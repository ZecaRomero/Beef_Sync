/**
 * API para corrigir Série, RG e Nome dos animais via importação Excel.
 * Formato esperado: SÉRIE (A) | RG (B) | NOME DO ANIMAL (C)
 * Atualiza o campo nome dos animais existentes identificados por serie+rg.
 */
import { query } from '../../../lib/database'
import formidable from 'formidable'
import * as XLSX from 'xlsx'
import fs from 'fs'

export const config = {
  api: {
    bodyParser: false
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  const form = formidable({ multiples: false })

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Erro ao processar formulário:', err)
      return res.status(500).json({
        success: false,
        error: 'Erro ao processar arquivo',
        details: String(err?.message || err)
      })
    }

    const file = Array.isArray(files?.file) ? files.file[0] : files?.file
    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo enviado. Selecione um arquivo Excel (.xlsx ou .xls).'
      })
    }

    const filepath = file.filepath || file.path
    if (!filepath) {
      return res.status(400).json({
        success: false,
        error: 'Arquivo inválido'
      })
    }

    try {
      const buffer = fs.readFileSync(filepath)
      const workbook = XLSX.read(buffer, {
        type: 'buffer',
        cellDates: true,
        cellNF: false,
        cellText: false
      })

      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null, raw: true })

      if (!data || data.length < 1) {
        try { fs.unlinkSync(filepath) } catch (e) { /* ignorar */ }
        return res.status(400).json({
          success: false,
          error: 'Planilha vazia ou sem dados.'
        })
      }

      // Detectar cabeçalho na primeira linha
      const headers = (data[0] || []).map(h => String(h ?? '').trim().toLowerCase())
      const colSerie = headers.findIndex(h =>
        h.includes('série') || h.includes('serie')
      )
      const colRg = headers.findIndex(h =>
        h === 'rg' || (h.includes('rg') && !h.includes('rgd'))
      )
      const colNome = headers.findIndex(h =>
        h.includes('nome') && !h.includes('serie') && !h.includes('rg')
      )

      // Se encontrou cabeçalho, começar da linha 2; senão, da linha 1
      const temCabecalho = colSerie >= 0 || colRg >= 0 || colNome >= 0
      const startRow = temCabecalho ? 1 : 0

      const idxSerie = colSerie >= 0 ? colSerie : 0
      const idxRg = colRg >= 0 ? colRg : 1
      const idxNome = colNome >= 0 ? colNome : 2

      const resultados = {
        atualizados: 0,
        naoEncontrados: [],
        erros: []
      }

      for (let i = startRow; i < data.length; i++) {
        const row = data[i] || []
        const serie = String(row[idxSerie] ?? '').trim()
        const rg = String(row[idxRg] ?? '').trim()
        const nome = String(row[idxNome] ?? '').trim()

        if (!serie && !rg) continue

        try {
          const animalResult = await query(
            `SELECT id, serie, rg, nome FROM animais 
             WHERE UPPER(COALESCE(serie, '')) = UPPER($1) AND CAST(rg AS TEXT) = $2`,
            [serie, rg]
          )

          if (animalResult.rows.length === 0) {
            resultados.naoEncontrados.push({ linha: i + 1, serie, rg })
            continue
          }

          const animal = animalResult.rows[0]
          await query(
            `UPDATE animais SET nome = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [nome || null, animal.id]
          )
          resultados.atualizados++
        } catch (rowError) {
          resultados.erros.push({
            linha: i + 1,
            serie,
            rg,
            erro: rowError.message
          })
        }
      }

      try { fs.unlinkSync(filepath) } catch (e) { /* ignorar */ }

      return res.status(200).json({
        success: true,
        message: `Importação concluída: ${resultados.atualizados} animal(is) atualizado(s)`,
        resultados
      })
    } catch (error) {
      console.error('Erro ao processar Excel:', error)
      try { if (filepath) fs.unlinkSync(filepath) } catch (e) { /* ignorar */ }
      return res.status(500).json({
        success: false,
        error: 'Erro ao processar arquivo Excel',
        details: String(error?.message || error)
      })
    }
  })
}
