// import nodemailer from 'nodemailer'
// import { generatePDFReport } from '../../../utils/reportGenerator'
import { sendSuccess, sendValidationError, sendMethodNotAllowed, sendError, asyncHandler } from '../../../utils/apiResponse'
import logger from '../../../utils/logger'

// Configure email transporter - Temporariamente desabilitado
// const transporter = nodemailer.createTransporter({
//   host: process.env.SMTP_HOST || 'smtp.gmail.com',
//   port: process.env.SMTP_PORT || 587,
//   secure: false,
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   },
// })

const RECIPIENTS_DATA = {
  owner: { name: 'ProprietÃ¡rio', email: 'proprietario@fazenda.com', role: 'Dono' },
  manager: { name: 'Gerente Geral', email: 'gerente@fazenda.com', role: 'Gerente' },
  vet: { name: 'VeterinÃ¡rio', email: 'veterinario@fazenda.com', role: 'VeterinÃ¡rio' },
  zootecnista: { name: 'Zootecnista', email: 'zootecnista@fazenda.com', role: 'Zootecnista' },
  financeiro: { name: 'Financeiro', email: 'financeiro@fazenda.com', role: 'Financeiro' }
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendMethodNotAllowed(res, 'POST')
  }

  // Funcionalidade temporariamente desabilitada
  return sendError(res, 'Funcionalidade de envio de email temporariamente desabilitada', 501, {
    note: 'Use o sistema de WhatsApp no gerador de relatÃ³rios'
  })

  /* try {
    const { reports, recipients, period, sections } = req.body

    if (!reports || !Array.isArray(reports) || reports.length === 0) {
      return sendValidationError(res, 'Tipos de relatÃ³rio sÃ£o obrigatÃ³rios')
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return sendValidationError(res, 'DestinatÃ¡rios sÃ£o obrigatÃ³rios')
    }

    if (!period || !period.startDate || !period.endDate) {
      return sendValidationError(res, 'PerÃ­odo Ã© obrigatÃ³rio')
    }

    // Generate report data
    const reportResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3020'}/api/reports/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reports, period, sections })
    })

    if (!reportResponse.ok) {
      throw new Error('Erro ao gerar dados do relatÃ³rio')
    }

    const reportData = await reportResponse.json()

    // Generate PDF
    const pdfBuffer = await generatePDFReport(reportData, period)

    // Send emails to each recipient
    const emailPromises = recipients.map(async (recipientId) => {
      const recipient = RECIPIENTS_DATA[recipientId]
      if (!recipient) return

      const emailContent = generateEmailContent(recipient, reports, period, reportData)

      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@fazenda.com',
        to: recipient.email,
        subject: `RelatÃ³rio Gerencial - ${formatPeriod(period)}`,
        html: emailContent,
        attachments: [
          {
            filename: `relatorio-${period.startDate}-${period.endDate}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      }

      return transporter.sendMail(mailOptions)
    })

    await Promise.all(emailPromises)

    return sendSuccess(res, {
      sentTo: recipients.length,
      reportTypes: reports.length
    }, 'RelatÃ³rios enviados com sucesso')

  } catch (error) {
    logger.error('Erro ao enviar relatÃ³rios:', error)
    return sendError(res, 'Erro ao enviar relatÃ³rios', 500, { error: error.message })
  } */
}

export default asyncHandler(handler)

function generateEmailContent(recipient, reports, period, reportData) {
  const reportNames = {
    monthly_summary: 'Resumo Mensal',
    births_analysis: 'AnÃ¡lise de Nascimentos',
    breeding_report: 'RelatÃ³rio de ReproduÃ§Ã£o',
    financial_summary: 'Resumo Financeiro',
    inventory_report: 'RelatÃ³rio de Estoque'
  }

  const reportsList = reports.map(r => reportNames[r] || r).join(', ')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .summary { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .footer { background: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b; }
        .highlight { color: #2563eb; font-weight: bold; }
        .stats { display: flex; justify-content: space-around; margin: 20px 0; }
        .stat { text-align: center; }
        .stat-number { font-size: 24px; font-weight: bold; color: #2563eb; }
        .stat-label { font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>ðÅ¸�â€ž Beef Sync - RelatÃ³rio Gerencial</h1>
        <p>PerÃ­odo: ${formatPeriod(period)}</p>
      </div>
      
      <div class="content">
        <h2>OlÃ¡, ${recipient.name}!</h2>
        
        <p>Segue em anexo o(s) relatÃ³rio(s) solicitado(s) para o perÃ­odo de <strong>${formatPeriod(period)}</strong>:</p>
        
        <div class="summary">
          <h3>ðÅ¸â€œÅ  RelatÃ³rios Inclusos:</h3>
          <ul>
            ${reports.map(r => `<li>${reportNames[r] || r}</li>`).join('')}
          </ul>
        </div>

        ${generateQuickStats(reportData)}

        <p>Para mais detalhes, consulte o arquivo PDF em anexo.</p>
        
        <p>Este relatÃ³rio foi gerado automaticamente pelo sistema Beef Sync em ${new Date().toLocaleString('pt-BR')}.</p>
      </div>
      
      <div class="footer">
        <p>Â© ${new Date().getFullYear()} Beef Sync - Sistema de GestÃ£o PecuÃ¡ria</p>
        <p>Este Ã© um e-mail automÃ¡tico, nÃ£o responda.</p>
      </div>
    </body>
    </html>
  `
}

function generateQuickStats(reportData) {
  let stats = ''
  
  if (reportData.data?.monthly_summary) {
    const summary = reportData.data.monthly_summary
    stats += `
      <div class="summary">
        <h3>ðÅ¸â€œË† Resumo RÃ¡pido:</h3>
        <div class="stats">
          ${summary.nascimentos ? `
            <div class="stat">
              <div class="stat-number">${summary.nascimentos.total || 0}</div>
              <div class="stat-label">Nascimentos</div>
            </div>
          ` : ''}
          ${summary.vendas ? `
            <div class="stat">
              <div class="stat-number">${summary.vendas.total || 0}</div>
              <div class="stat-label">Vendas</div>
            </div>
          ` : ''}
          ${summary.mortes ? `
            <div class="stat">
              <div class="stat-number">${summary.mortes.total || 0}</div>
              <div class="stat-label">Mortes</div>
            </div>
          ` : ''}
          ${summary.estatisticas_gerais ? `
            <div class="stat">
              <div class="stat-number">${summary.estatisticas_gerais.total_rebanho || 0}</div>
              <div class="stat-label">Total Rebanho</div>
            </div>
          ` : ''}
        </div>
      </div>
    `
  }
  
  return stats
}

function formatPeriod(period) {
  const startDate = new Date(period.startDate).toLocaleDateString('pt-BR')
  const endDate = new Date(period.endDate).toLocaleDateString('pt-BR')
  return `${startDate} a ${endDate}`
}