/**
 * Importa Boletim Campo do Excel.
 * Colunas: LOCAL (A), LOCAL 1 (B), SUB_LOCAL_2 (C), QUANT. (D), SEXO (E), CATEGORIA (F), RAÇA (G), ERA (H), OBSERVAÇÃO (I)
 */
import { query } from '../../../lib/database'
import formidable from 'formidable'
import ExcelJS from 'exceljs'
import fs from 'fs'
import { blockIfNotZecaDeveloper } from '../../../utils/importAccess'

export const config = {
  api: { bodyParser: false }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  const blocked = blockIfNotZecaDeveloper(req, res)
  if (blocked) return blocked

  const form = formidable({ multiples: false })
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao processar arquivo', details: String(err?.message || err) })
    }

    const file = Array.isArray(files?.file) ? files.file[0] : files?.file
    if (!file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' })
    }

    const filepath = file.filepath || file.path
    if (!filepath) {
      return res.status(400).json({ error: 'Arquivo inválido' })
    }

    try {
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.readFile(filepath)

      const worksheet = workbook.worksheets[0]
      if (!worksheet || !worksheet.rowCount) {
        return res.status(400).json({ error: 'Planilha vazia ou sem dados' })
      }

      let startRow = 1
      const primeiraLinha = worksheet.getRow(1)
      const cellA1 = (primeiraLinha.getCell(1).value ?? '').toString().toUpperCase()
      if (cellA1.includes('LOCAL') || cellA1.includes('QUANT')) {
        startRow = 2
      }

      const usuario = (fields?.usuario && (Array.isArray(fields.usuario) ? fields.usuario[0] : fields.usuario)) || null
      let inseridos = 0

      for (let i = startRow; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i)
        const local = String(row.getCell(1).value ?? '').trim()
        const local1 = String(row.getCell(2).value ?? '').trim() || null
        const subLocal2 = String(row.getCell(3).value ?? '').trim() || null
        const quant = parseInt(row.getCell(4).value) || 0
        const sexo = String(row.getCell(5).value ?? '').trim().charAt(0).toUpperCase() || null
        const categoria = String(row.getCell(6).value ?? '').trim() || null
        const raca = String(row.getCell(7).value ?? '').trim() || null
        const era = String(row.getCell(8).value ?? '').trim() || null
        const observacao = String(row.getCell(9).value ?? '').trim() || null

        if (!local) continue

        await query(`
          INSERT INTO boletim_campo (local, local_1, sub_local_2, quant, sexo, categoria, raca, era, observacao, usuario)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [local, local1, subLocal2, quant, sexo === 'M' || sexo === 'F' ? sexo : null, categoria, raca, era, observacao, usuario])
        inseridos++
      }

      try { fs.unlinkSync(filepath) } catch (e) { /* ignorar */ }

      return res.status(200).json({
        success: true,
        message: `Importação concluída: ${inseridos} registros`,
        inseridos
      })
    } catch (error) {
      console.error('Erro ao importar Excel:', error)
      try { if (filepath) fs.unlinkSync(filepath) } catch (e) { /* ignorar */ }
      return res.status(500).json({
        error: 'Erro ao processar arquivo Excel',
        details: String(error?.message || error)
      })
    }
  })
}
