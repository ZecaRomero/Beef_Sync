import { query } from '../../../lib/database'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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
    const dadosComQuant = dados.filter((r) => (r.quant || 0) > 0)
    const totalGeral = dadosComQuant.reduce((s, r) => s + (r.quant || 0), 0)

    const doc = new jsPDF({ orientation: 'landscape' })
    doc.setFontSize(14)
    doc.text('Boletim Campo', 14, 15)
    doc.setFontSize(10)
    doc.text(new Date().toLocaleDateString('pt-BR'), 14, 22)

    const tableData = dadosComQuant.map(row => [
      row.local || '',
      row.local_1 || '',
      row.sub_local_2 || '',
      String(row.quant || 0),
      row.sexo || '',
      row.categoria || '',
      row.raca || '',
      row.era || '',
      (row.observacao || '').substring(0, 30)
    ])
    if (tableData.length > 0) {
      tableData.push(['TOTAL GERAL', '', '', String(totalGeral), '', '', '', '', ''])
    }

    autoTable(doc, {
      head: [HEADERS],
      body: tableData.length ? tableData : [['Nenhum registro']],
      startY: 28,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [255, 165, 0] }
    })

    const filename = `Boletim_Campo_${new Date().toISOString().split('T')[0]}.pdf`

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(doc.output('arraybuffer'))
  } catch (error) {
    console.error('Erro download PDF:', error)
    res.status(500).json({ success: false, error: error.message })
  }
}
