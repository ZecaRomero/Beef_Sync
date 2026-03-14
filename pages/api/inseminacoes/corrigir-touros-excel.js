/**
 * API para corrigir touro_nome nas inseminações a partir de um Excel
 * Formato: SÉRIE, RG, LOCAL, LOCAL, TOURO_1ª I.A, SÉRIE, RG, DATA I.A, DATA DG, Result
 */

import { query } from '../../../lib/database'
import formidable from 'formidable'
import ExcelJS from 'exceljs'
import fs from 'fs'

export const config = { api: { bodyParser: false } }

function converterDataExcel(data) {
  if (!data) return null
  if (data instanceof Date || Object.prototype.toString.call(data) === '[object Date]') {
    if (isNaN(data.getTime())) return null
    const ano = data.getUTCFullYear()
    const mes = String(data.getUTCMonth() + 1).padStart(2, '0')
    const dia = String(data.getUTCDate()).padStart(2, '0')
    return `${ano}-${mes}-${dia}`
  }
  if (typeof data === 'string') {
    const partes = data.trim().split(/[\/\-]/)
    if (partes.length === 3) {
      let [d, m, a] = partes
      if (a.length === 2) a = parseInt(a) >= 50 ? `19${a}` : `20${a}`
      return `${a}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    }
  }
  if (typeof data === 'number') {
    const excelEpoch = new Date(Date.UTC(1899, 11, 31))
    const dt = new Date(excelEpoch.getTime() + (data > 59 ? data - 1 : data) * 86400000)
    return dt.toISOString().split('T')[0]
  }
  return null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  const form = formidable({ multiples: false })
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao processar arquivo', details: err.message })
    }
    const file = files.file
    if (!file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' })
    }

    try {
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.readFile(file.filepath)
      const ws = workbook.worksheets[0]
      if (!ws) {
        return res.status(400).json({ error: 'Planilha vazia' })
      }

      let corrigidos = 0
      const erros = []

      for (let i = 2; i <= (ws.rowCount || 1000); i++) {
        const row = ws.getRow(i)
        const serie = row.getCell(1).value?.toString().trim() || ''
        const rg = row.getCell(2).value?.toString().trim() || ''
        const col4 = row.getCell(4).value?.toString().trim() || ''
        const col5 = row.getCell(5).value?.toString().trim() || ''
        const dataIA = converterDataExcel(row.getCell(8).value) || converterDataExcel(row.getCell(7).value)
        const ehFormatoComDoisLocal = /^PIQUETE\s*\d*$/i.test(col4) || /^PIQ\s*\d*$/i.test(col4)
        const touro = ehFormatoComDoisLocal ? col5 : col4

        if (!serie || !rg || !touro || !dataIA) continue
        if (/^PIQUETE\s*\d*$/i.test(touro) || /^PIQ\s*\d*$/i.test(touro)) continue

        try {
          const animalRes = await query('SELECT id FROM animais WHERE serie = $1 AND rg = $2', [serie, rg])
          if (animalRes.rows.length === 0) {
            erros.push({ linha: i, serie, rg, msg: 'Animal não encontrado' })
            continue
          }
          const animalId = animalRes.rows[0].id
          const upd = await query(
            `UPDATE inseminacoes SET touro_nome = $1 WHERE animal_id = $2 AND data_ia = $3 RETURNING id`,
            [touro, animalId, dataIA]
          )
          if (upd?.rowCount > 0) corrigidos++
        } catch (e) {
          erros.push({ linha: i, serie, rg, msg: e.message })
        }
      }

      fs.unlinkSync(file.filepath)

      return res.status(200).json({
        success: true,
        message: `${corrigidos} touro(s) corrigido(s)`,
        corrigidos,
        erros: erros.slice(0, 20)
      })
    } catch (error) {
      console.error('Erro ao corrigir touros:', error)
      return res.status(500).json({
        error: 'Erro ao processar Excel',
        details: error.message
      })
    }
  })
}
