/**
 * API para enviar Boletim Campo por WhatsApp (Excel ou PDF)
 */
import { query } from '../../../lib/database'
import ExcelJS from 'exceljs'
import { sendWhatsAppMedia } from '../../../utils/whatsappService'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const HEADERS = ['LOCAL', 'LOCAL 1', 'SUB_LOCAL_2', 'QUANT.', 'SEXO', 'CATEGORIA', 'RAÇA', 'ERA', 'OBSERVAÇÃO']

function normalizeWhatsApp(whatsapp) {
  if (!whatsapp) return ''
  const digits = String(whatsapp).replace(/\D/g, '')
  return digits.startsWith('55') ? digits : `55${digits}`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' })
  }

  try {
    const { formato } = req.body
    if (!['excel', 'pdf'].includes(formato)) {
      return res.status(400).json({ success: false, message: 'Formato deve ser excel ou pdf' })
    }

    const userResult = await query(
      'SELECT whatsapp FROM boletim_campo_users WHERE LOWER(nome) = $1',
      ['adelso']
    )
    const whatsapp = userResult.rows[0]?.whatsapp
    if (!whatsapp) {
      return res.status(400).json({
        success: false,
        message: 'Cadastre seu WhatsApp primeiro em Configurações'
      })
    }

    const dadosResult = await query(`
      SELECT local, local_1, sub_local_2, quant, sexo, categoria, raca, era, observacao
      FROM boletim_campo
      ORDER BY local, local_1, sub_local_2
    `)
    const dados = dadosResult.rows || []

    const recipient = { name: 'Adelso', whatsapp: normalizeWhatsApp(whatsapp) }
    const caption = `📋 Boletim Campo - ${new Date().toLocaleDateString('pt-BR')}\n\nSistema Beef-Sync`

    if (formato === 'excel') {
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

      try {
        await sendWhatsAppMedia(recipient, Buffer.from(buffer), filename, caption)
        return res.status(200).json({ success: true, message: 'Enviado para WhatsApp!' })
      } catch (apiErr) {
        return res.status(200).json({
          success: true,
          fallback: true,
          message: 'WhatsApp API não configurada. Arquivo pronto para download.',
          downloadUrl: `/api/boletim-campo/download-excel`,
          waLink: `https://wa.me/${recipient.whatsapp}`
        })
      }
    }

    if (formato === 'pdf') {
      const doc = new jsPDF({ orientation: 'landscape' })
      doc.setFontSize(14)
      doc.text('Boletim Campo', 14, 15)
      doc.setFontSize(10)
      doc.text(new Date().toLocaleDateString('pt-BR'), 14, 22)

      const tableData = dados.map(row => [
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

      autoTable(doc, {
        head: [HEADERS],
        body: tableData.length ? tableData : [['Nenhum registro']],
        startY: 28,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [255, 165, 0] }
      })

      const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
      const filename = `Boletim_Campo_${new Date().toISOString().split('T')[0]}.pdf`

      try {
        await sendWhatsAppMedia(recipient, pdfBuffer, filename, caption)
        return res.status(200).json({ success: true, message: 'Enviado para WhatsApp!' })
      } catch (apiErr) {
        return res.status(200).json({
          success: true,
          fallback: true,
          message: 'WhatsApp API não configurada. Arquivo pronto para download.',
          downloadUrl: `/api/boletim-campo/download-pdf`,
          waLink: `https://wa.me/${recipient.whatsapp}`
        })
      }
    }

    return res.status(400).json({ success: false, message: 'Formato inválido' })
  } catch (error) {
    console.error('Erro ao enviar Boletim Campo:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao enviar'
    })
  }
}
