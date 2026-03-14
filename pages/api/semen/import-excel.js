import formidable from 'formidable'
import * as XLSX from 'xlsx'
import fs from 'fs'
import os from 'os'
import { query } from '../../../lib/database'

export const config = {
  api: { bodyParser: false }
}

function limparTemp(filepath) {
  try { if (filepath) fs.unlinkSync(filepath) } catch (_) { /* silencioso */ }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'MÃ©todo nÃ£o permitido' })
  }

  const form = formidable({
    uploadDir: os.tmpdir(),
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024,
  })

  let filepath = null

  try {
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, f, fi) => {
        if (err) reject(err)
        else resolve([f, fi])
      })
    })

    const fileArr = files.file
    const file = Array.isArray(fileArr) ? fileArr[0] : fileArr
    if (!file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' })
    }
    filepath = file.filepath

    const localizacao = Array.isArray(fields.localizacao) ? fields.localizacao[0] : (fields.localizacao || 'Importado')
    const fornecedor = Array.isArray(fields.fornecedor) ? fields.fornecedor[0] : (fields.fornecedor || 'Importado')
    const tipoMaterialBase = Array.isArray(fields.tipoMaterial) ? fields.tipoMaterial[0] : (fields.tipoMaterial || 'semen')

    const wb = XLSX.readFile(filepath)
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

    if (rows.length < 2) {
      limparTemp(filepath)
      return res.status(400).json({ error: 'Planilha vazia ou sem dados' })
    }

    // Identificar linha do cabeÃ§alho
    let headerRow = 0
    let dataStartRow = 1
    for (let i = 0; i < Math.min(5, rows.length); i++) {
      const row = rows[i].map(c => String(c || '').toUpperCase().trim())
      if (row.some(c => c.includes('TOURO') || c.includes('RACK'))) {
        headerRow = i
        dataStartRow = i + 1
        break
      }
    }

    const headers = rows[headerRow].map(h => String(h || '').toUpperCase().trim())

    // Mapear colunas pelos headers ââ‚¬â€� detecÃ§Ã£o precisa para evitar falsos positivos
    let colMap = { rack: 0, touro: 1, raca: 2, botijao: 3, caneca: 4, obs: 5, entradas: 6, saidas: 7, estoque: 8 }
    headers.forEach((h, i) => {
      if (h.includes('RACK') || (h.includes('COD') && i === 0)) colMap.rack = i
      else if (h === 'TOURO') colMap.touro = i
      else if (h === 'RACA' || h === 'RAÃâ€¡A' || h === 'RAÃâ€¡' || h === 'RA\u00c7A') colMap.raca = i
      else if (h.includes('BOTIJ')) colMap.botijao = i
      else if (h.includes('CANECA')) colMap.caneca = i
      else if (h.includes('OBS')) colMap.obs = i
      else if (h.includes('ENTRADA')) colMap.entradas = i
      else if ((h.includes('SAIDA') || h.includes('SAÃ�DA') || h === 'SA\u00cdDAS') && i > 4) colMap.saidas = i
      else if (h.includes('ESTOQUE')) colMap.estoque = i
    })

    let importados = 0
    const erros = []

    for (let i = dataStartRow; i < rows.length; i++) {
      const row = rows[i]
      const touroVal = String(row[colMap.touro] || '').trim()
      if (!touroVal) continue

      const estoqueVal = parseInt(row[colMap.estoque] || 0) || 0
      const rackTouro = String(row[colMap.rack] || '').trim()
      const raca = String(row[colMap.raca] || '').trim()
      const botijao = String(row[colMap.botijao] || '').trim()
      const caneca = String(row[colMap.caneca] || '').trim()
      const observacoes = String(row[colMap.obs] || '').trim()

      // Extrair nome e RG do touro ââ‚¬â€� ex: "CAMARGO - BASA 893"
      let nomeTouro = touroVal
      let rgTouro = ''
      if (touroVal.includes(' - ')) {
        const parts = touroVal.split(' - ')
        nomeTouro = parts[0].trim()
        rgTouro = parts.slice(1).join(' - ').trim()
      }

      const status = estoqueVal > 0 ? 'disponivel' : 'esgotado'

      // Detectar embriÃ£o automaticamente pelo nome (ex: "ACASALAMENTO (X x Y)" ou "A X B")
      const isEmbriao = tipoMaterialBase === 'embriao' ||
        nomeTouro.toUpperCase().includes(' X ') ||
        nomeTouro.toUpperCase().includes('ACASALAMENTO')
      const tipo = isEmbriao ? 'embriao' : 'semen'

      try {
        await query(
          `INSERT INTO estoque_semen
            (nome_touro, rg_touro, raca, localizacao, rack_touro, botijao, caneca,
             tipo_operacao, fornecedor, quantidade_doses, doses_disponiveis,
             doses_usadas, observacoes, status, tipo)
           VALUES ($1,$2,$3,$4,$5,$6,$7,'entrada',$8,$9,$10,0,$11,$12,$13)`,
          [
            nomeTouro,
            rgTouro || null,
            raca || null,
            localizacao,
            rackTouro || null,
            botijao || null,
            caneca || null,
            fornecedor,
            estoqueVal,
            estoqueVal,
            observacoes || null,
            status,
            tipo,
          ]
        )
        importados++
      } catch (err) {
        erros.push(`Linha ${i + 1} (${touroVal}): ${err.message}`)
      }
    }

    limparTemp(filepath)

    return res.status(200).json({
      success: true,
      message: `${importados} registro(s) importado(s) com sucesso`,
      importados,
      erros: erros.length > 0 ? erros : undefined,
    })
  } catch (error) {
    limparTemp(filepath)
    console.error('Erro ao importar Excel de sÃªmen:', error)
    return res.status(500).json({ error: 'Erro ao processar arquivo', details: error.message })
  }
}
