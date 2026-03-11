/**
 * API para enviar Boletim Campo por WhatsApp (Excel ou PDF)
 */
import { query } from '../../../lib/database'
import { generateBoletimCampoWorkbook } from '../../../utils/boletimCampoExcel'
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
    const { formato, telefone } = req.body
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
      SELECT id, local, local_1, sub_local_2, quant, sexo, categoria, raca, era, observacao
      FROM boletim_campo
      ORDER BY local, local_1, sub_local_2
    `)
    const dados = dadosResult.rows || []

    const historicoResult = await query(`
      SELECT m.tipo, m.destino_local, m.destino_sub_local, m.motivo, m.quantidade, m.observacao, m.usuario, m.created_at,
             b.local, b.local_1, b.sub_local_2
      FROM boletim_campo_movimentacoes m
      LEFT JOIN boletim_campo b ON b.id = m.boletim_campo_id
      ORDER BY m.created_at DESC
      LIMIT 500
    `)
    const historico = historicoResult.rows || []

    const recipient = { name: 'Adelso', whatsapp: normalizeWhatsApp(whatsapp) }
    const caption = `📋 Boletim Campo - ${new Date().toLocaleDateString('pt-BR')}\n\nSistema Beef-Sync`

    if (formato === 'excel') {
      const workbook = await generateBoletimCampoWorkbook(dados, historico)
      const buf = await workbook.xlsx.writeBuffer()
      const buffer = Buffer.isBuffer(buf) ? buf : Buffer.from(buf)
      const now = new Date()
      const filename = `Boletim_Campo_${now.toISOString().split('T')[0]}_${now.toTimeString().slice(0, 5).replace(':', 'h')}.xlsx`

      try {
        await sendWhatsAppMedia(recipient, buffer, filename, caption)
        return res.status(200).json({ success: true, message: 'Enviado para WhatsApp!' })
      } catch (apiErr) {
        const waNum = telefone ? normalizeWhatsApp(telefone) : recipient.whatsapp
        const msg = `📋 Boletim Campo - ${new Date().toLocaleDateString('pt-BR')}\nSistema Beef-Sync`
        const waLink = `https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`
        return res.status(200).json({
          success: true,
          fallback: true,
          message: 'WhatsApp API não configurada. Arquivo pronto para download.',
          downloadUrl: `/api/boletim-campo/download-excel`,
          waLink
        })
      }
    }

    if (formato === 'pdf') {
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

      const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
      const now = new Date()
      const filename = `Boletim_Campo_${now.toISOString().split('T')[0]}_${now.toTimeString().slice(0, 5).replace(':', 'h')}.pdf`

      try {
        await sendWhatsAppMedia(recipient, pdfBuffer, filename, caption)
        return res.status(200).json({ success: true, message: 'Enviado para WhatsApp!' })
      } catch (apiErr) {
        const waNum = telefone ? normalizeWhatsApp(telefone) : recipient.whatsapp
        const msg = `📋 Boletim Campo - ${new Date().toLocaleDateString('pt-BR')}\nSistema Beef-Sync`
        const waLink = `https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`
        return res.status(200).json({
          success: true,
          fallback: true,
          message: 'WhatsApp API não configurada. Arquivo pronto para download.',
          downloadUrl: `/api/boletim-campo/download-pdf`,
          waLink
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
