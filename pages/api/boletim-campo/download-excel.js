import { query } from '../../../lib/database'
import ExcelJS from 'exceljs'

const HEADERS = ['LOCAL', 'LOCAL 1', 'SUB_LOCAL_2', 'QUANT.', 'SEXO', 'CATEGORIA', 'RAÇA', 'ERA', 'OBSERVAÇÃO']

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' })
  }

  try {
    const dadosResult = await query(`
      SELECT local, local_1, sub_local_2, quant, sexo, categoria, raca, era, observacao
      FROM boletim_campo
      ORDER BY local, local_1, sub_local_2
    `)
    const dados = dadosResult.rows || []

    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Boletim Campo')
    const corLaranja = { argb: 'FFFFA500' }

    sheet.getRow(1).values = HEADERS
    sheet.getRow(1).eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: corLaranja }
      cell.font = { bold: true }
    })

    const rowsToExport = dados.length ? dados : [{ local: '', local_1: '', sub_local_2: '', quant: 0, sexo: '', categoria: '', raca: '', era: '', observacao: '' }]
    rowsToExport.forEach((row, idx) => {
      const r = sheet.getRow(idx + 2)
      r.values = [
        row.local || '',
        row.local_1 || '',
        row.sub_local_2 || '',
        row.quant || 0,
        row.sexo || '',
        row.categoria || '',
        row.raca || '',
        row.era || '',
        row.observacao || ''
      ]
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const filename = `Boletim_Campo_${new Date().toISOString().split('T')[0]}.xlsx`

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(Buffer.from(buffer))
  } catch (error) {
    console.error('Erro download Excel:', error)
    res.status(500).json({ success: false, error: error.message })
  }
}
