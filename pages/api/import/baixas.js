/**
 * API de importação de Baixas (MORTE/BAIXA e VENDA)
 * Aceita Excel com colunas: SÉRIE, RG/RF/RC, OCORRENCIA, Causa, Data, COMPRADOR, VALOR, NOTA FISCAL, SÉRIE MA, RG
 * Formato VENDAS-only: SÉRIE RG, DATA, COMPRADOR, VALOR, NOTA FISCAL, SÉRIE MAE RG (sem OCORRENCIA)
 */
import formidable from 'formidable'
import fs from 'fs'
import * as XLSX from 'xlsx'
import databaseService from '../../../services/databaseService'
import { pool, createTablesIfNotExist } from '../../../lib/database'

export const config = {
  api: { bodyParser: false },
}

function converterData(val) {
  if (!val) return null
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null
    return val.toISOString().slice(0, 10)
  }
  if (typeof val === 'number') {
    const d = new Date((val - 25569) * 86400000)
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
  }
  const s = String(val).trim()
  // Excel serial como string (ex: "45405")
  if (/^\d{5,}$/.test(s)) {
    const n = parseInt(s, 10)
    const d = new Date((n - 25569) * 86400000)
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
  }
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (m) {
    let [, dia, mes, ano] = m
    if (ano.length === 2) ano = parseInt(ano) >= 50 ? `19${ano}` : `20${ano}`
    return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  return null
}

function parseValor(val) {
  if (val == null || val === '') return null
  if (typeof val === 'number') return val
  
  // Converter string para número, lidando com formato brasileiro (R$ 3.640,00)
  let str = String(val).trim()
  // Remover símbolo de moeda e espaços
  str = str.replace(/[R$\s]/g, '')
  
  // Se tem ponto e vírgula, assumir formato brasileiro (3.640,00)
  if (str.includes('.') && str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.')
  }
  // Se tem apenas vírgula, assumir formato brasileiro (3640,00)
  else if (str.includes(',')) {
    str = str.replace(',', '.')
  }
  // Se tem apenas ponto, pode ser formato americano (3640.00) ou separador de milhar brasileiro (3.640)
  // Verificar se há mais de um ponto ou se o ponto está a mais de 3 dígitos do final
  else if (str.includes('.')) {
    const parts = str.split('.')
    if (parts.length > 2 || (parts.length === 2 && parts[1].length > 2)) {
      // Formato brasileiro com separador de milhar (3.640)
      str = str.replace(/\./g, '')
    }
    // Caso contrário, manter como está (formato americano 3640.00)
  }
  
  const n = parseFloat(str)
  return isNaN(n) ? null : n
}

function normalizeKey(s) {
  return String(s || '').toLowerCase().replace(/\s/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function getVal(obj, ...keys) {
  for (const k of keys) {
    const searchNorm = normalizeKey(k)
    const key = Object.keys(obj || {}).find(x => normalizeKey(x).includes(searchNorm) || searchNorm.includes(normalizeKey(x)))
    if (key) return obj[key]
  }
  return null
}

// Extrai serie e rg de coluna combinada (ex: "CJCJ 15989", "CJCJ 16013", "CJCJ-16013")
function parseSerieRg(val) {
  if (!val) return { serie: null, rg: null }
  const s = String(val).trim()
  const mSpace = s.match(/^([A-Za-z]+)\s+(\d+)$/)
  if (mSpace) return { serie: mSpace[1], rg: mSpace[2] }
  const mHyphen = s.match(/^([A-Za-z]+)-(\d+)$/)
  if (mHyphen) return { serie: mHyphen[1], rg: mHyphen[2] }
  return { serie: null, rg: null }
}
// Alias para compatibilidade
function parseSerieMaeRg(val) {
  const r = parseSerieRg(val)
  return { serieMae: r.serie, rgMae: r.rg }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  const form = formidable({ multiples: false, maxFileSize: 100 * 1024 * 1024 })
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Erro ao fazer parse:', err)
      return res.status(500).json({ error: err.message || 'Erro ao processar arquivo' })
    }

    let file = files?.file
    if (Array.isArray(file)) file = file[0]
    if (!file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' })
    }

    const filepath = file.filepath || file.path
    if (!filepath) {
      return res.status(500).json({ error: 'Arquivo não recebido corretamente. Tente um arquivo menor ou divida em partes.' })
    }

    let filepathToClean = filepath
    try {
      await createTablesIfNotExist()
      const workbook = XLSX.readFile(filepath)
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false })

      if (!aoa || aoa.length < 2) {
        return res.status(400).json({ error: 'Planilha vazia ou sem dados' })
      }

      const headerRow = aoa[0].map(h => String(h || '').trim())
      const dataRows = aoa.slice(1)

      // Mapear índices por nome (formato BAIXAS: SÉRIE, RG, OCORRENCIA, Causa, Data, SÉRIE MAE, RG)
      const findIdx = (names) => {
        for (const n of names) {
          const idx = headerRow.findIndex(h => normalizeKey(h).includes(normalizeKey(n)))
          if (idx >= 0) return idx
        }
        return -1
      }
      // SÉR/SÉRIE do animal (não confundir com SÉRIE MAE - que é da mãe)
      const serieIdx = (() => {
        for (let i = 0; i < headerRow.length; i++) {
          const n = normalizeKey(headerRow[i])
          if (n.includes('mae')) continue
          if (n === 'ser' || n === 'sér' || n.includes('serie')) return i
        }
        return findIdx(['série', 'serie'])
      })()
      const rgIdx = findIdx(['rg', 'rf', 'rc'])
      const ocorrenciaIdx = findIdx(['ocorrencia', 'ocorrenc'])
      const causaIdx = findIdx(['causa'])
      const dataIdx = findIdx(['data', 'dt'])
      const compradorIdx = findIdx(['comprador', 'cliente', 'destinatario'])
      const valorIdx = findIdx(['valor', 'preco', 'preço', 'vlr'])
      const nfIdx = findIdx(['nota fiscal', 'nota_fiscal', 'nf', 'numero nf', 'nº nf'])
      const serieMaeIdx = findIdx(['serie mae', 'série mae', 'serie_mae', 'serie ma', 'série ma'])
      const serieRgCombinedIdx = findIdx(['serie rg', 'série rg', 'serie_rg', 'sér rg', 'ser rg', 'identificacao', 'identificação'])
      const serieMaeRgCombinedIdx = findIdx(['serie mae rg', 'série mae rg', 'serie_mae_rg'])

      // RG da mãe: segunda coluna "RG" (após SÉRIE MAE)
      let rgMaeIdx = -1
      if (serieMaeIdx >= 0 && serieMaeIdx + 1 < headerRow.length) {
        const nextHeader = normalizeKey(headerRow[serieMaeIdx + 1] || '')
        if (nextHeader.includes('rg') || nextHeader === 'rg') rgMaeIdx = serieMaeIdx + 1
      }
      if (rgMaeIdx < 0) rgMaeIdx = headerRow.findIndex((h, i) => i > rgIdx && normalizeKey(h).includes('rg'))

      const resultados = { importados: 0, erros: [], ignorados: 0 }

      for (let i = 0; i < dataRows.length; i++) {
        const arr = dataRows[i]
        const v = (idx) => (idx >= 0 && arr[idx] != null) ? arr[idx] : null

        const ocorrencia = String(v(ocorrenciaIdx) || '').trim().toUpperCase()
        let serie = String(v(serieIdx) || '').trim()
        let rg = String(v(rgIdx) || '').trim()
        if (!serie || !rg) {
          const combined = v(serieRgCombinedIdx)
          if (combined) {
            const parsed = parseSerieMaeRg(combined)
            serie = parsed.serieMae || serie
            rg = parsed.rgMae || rg
          }
        }
        // Se ainda falta rg mas serie parece combinado (ex: "CJCJ 16013"), extrair
        if ((!serie || !rg) && serie && /^[A-Za-z]+\s+\d+$/.test(serie)) {
          const parsed = parseSerieRg(serie)
          if (parsed.serie && parsed.rg) {
            serie = parsed.serie
            rg = parsed.rg
          }
        }
        if (!serie || !rg) {
          resultados.ignorados++
          continue
        }

        let tipo = null
        if (ocorrencia.includes('MORTE') || ocorrencia.includes('BAIXA')) {
          tipo = 'MORTE/BAIXA'
        } else if (ocorrencia.includes('VENDA')) {
          tipo = 'VENDA'
        } else if (compradorIdx >= 0 && v(compradorIdx)) {
          tipo = 'VENDA'
        } else if (valorIdx >= 0 && v(valorIdx)) {
          tipo = 'VENDA'
        }

        if (!tipo) {
          resultados.ignorados++
          continue
        }

        const dataStr = v(dataIdx)
        const dataBaixa = converterData(dataStr)
        if (!dataBaixa) {
          resultados.erros.push({ linha: i + 2, animal: `${serie} ${rg}`, msg: 'Data inválida' })
          continue
        }

        const causa = tipo === 'MORTE/BAIXA' ? String(v(causaIdx) || '').trim() || null : null
        const comprador = tipo === 'VENDA' ? String(v(compradorIdx) || '').trim() || null : null
        const valor = tipo === 'VENDA' ? parseValor(v(valorIdx)) : null
        const numeroNf = tipo === 'VENDA' ? String(v(nfIdx) || '').trim() || null : null

        let serieMaeFinal = String(v(serieMaeIdx) || '').trim() || null
        let rgMaeFinal = rgMaeIdx >= 0 ? String(v(rgMaeIdx) || '').trim() || null : null
        if (!serieMaeFinal && !rgMaeFinal) {
          const combined = v(serieMaeRgCombinedIdx)
          if (combined) {
            const parsed = parseSerieMaeRg(combined)
            serieMaeFinal = parsed.serieMae
            rgMaeFinal = parsed.rgMae
          }
        }

        try {
          const animais = await databaseService.buscarAnimais({ serie, rg });
          const animal = animais && animais.length > 0 ? animais[0] : null
          const animalId = animal ? animal.id : null

          await databaseService.inserirBaixa({
            animal_id: animalId,
            serie,
            rg,
            tipo,
            causa: causa || null,
            data_baixa: dataBaixa,
            comprador: comprador || null,
            valor: valor || null,
            numero_nf: numeroNf || null,
            serie_mae: serieMaeFinal || null,
            rg_mae: (serieMaeFinal || rgMaeFinal) ? rgMaeFinal : null,
          })

          if (tipo === 'VENDA' && animalId) {
            await pool.query(
              `UPDATE animais SET situacao = 'Vendido', valor_venda = COALESCE($2, valor_venda), updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
              [animalId, valor]
            )
          } else if (tipo === 'MORTE/BAIXA' && animalId) {
            await pool.query(
              `UPDATE animais SET situacao = 'Morto', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
              [animalId]
            )
            try {
              await databaseService.registrarMorte({
                animal_id: animalId,
                data_morte: dataBaixa,
                causa_morte: causa || 'Não informado',
                observacoes: null,
                valor_perda: animal?.custo_total || 0,
              })
            } catch (e) {
              // ignora se já existir morte
            }
          }

          resultados.importados++
        } catch (e) {
          resultados.erros.push({ linha: i + 2, animal: `${serie} ${rg}`, msg: e.message || 'Erro ao importar' })
        }
      }

      try {
        await pool.query(
          `INSERT INTO importacoes_historico (tipo, descricao, registros, usuario, status)
           VALUES ($1, $2, $3, $4, $5)`,
          ['Baixas', `Importação baixas: ${resultados.importados} importados`, resultados.importados, 'Sistema', 'sucesso']
        )
      } catch (e) {
        // ignora se tabela não existir
      }

      return res.status(200).json({
        success: true,
        resultados: {
          importados: resultados.importados,
          erroCount: resultados.erros.length,
          ignorados: resultados.ignorados,
          erros: resultados.erros.slice(0, 20),
        },
      })
    } catch (error) {
      console.error('Erro ao importar baixas:', error)
      return res.status(500).json({ error: error.message || 'Erro ao processar arquivo' })
    } finally {
      try { if (filepathToClean) fs.unlinkSync(filepathToClean) } catch (e) { /* ignorar */ }
    }
  })
}
