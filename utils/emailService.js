import nodemailer from 'nodemailer'

// Configurar transporter de email
const createTransporter = () => {
  // Verificar se as variÃ¡veis de ambiente estÃ£o configuradas
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('âÅ¡ ï¸� VariÃ¡veis SMTP nÃ£o configuradas. Email desabilitado.')
    return null
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true para 465, false para outras portas
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false // Para desenvolvimento, remover em produÃ§Ã£o
    }
  })
}

// Enviar email com anexos
export const sendEmail = async (recipient, subject, htmlContent, attachments = []) => {
  const transporter = createTransporter()
  
  if (!transporter) {
    throw new Error('ServiÃ§o de email nÃ£o configurado. Configure as variÃ¡veis SMTP_HOST, SMTP_USER e SMTP_PASS no arquivo .env')
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: recipient.email,
    subject: subject,
    html: htmlContent,
    attachments: attachments.map(att => ({
      filename: att.filename,
      content: att.content,
      contentType: att.contentType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }))
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log(`âÅ“â€¦ Email enviado para ${recipient.email}:`, info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error(`â�Å’ Erro ao enviar email para ${recipient.email}:`, error)
    throw error
  }
}

// Gerar conteÃºdo HTML do email
export const generateEmailContent = (recipient, period, reports) => {
  const reportNames = {
    boletim: 'Boletim de Gado',
    notasFiscais: 'Notas Fiscais (Entradas e SaÃ­das)',
    movimentacoes: 'MovimentaÃ§Ãµes do MÃªs',
    nf_entrada_saida: 'RelatÃ³rio de NF de Entrada e SaÃ­da',
    nascimentos: 'RelatÃ³rio de Nascimentos',
    mortes: 'RelatÃ³rio de Mortes',
    receptoras_chegaram: 'Receptoras que Chegaram',
    receptoras_faltam_parir: 'Receptoras que Faltam Parir',
    receptoras_faltam_diagnostico: 'Receptoras que Faltam DiagnÃ³stico de GestaÃ§Ã£o',
    resumo_nascimentos: 'Resumo de Nascimentos',
    resumo_por_sexo: 'Resumo por Sexo',
    resumo_por_pai: 'Resumo por Pai'
  }

  const reportsList = reports.map(r => `<li>${reportNames[r] || r}</li>`).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .footer { background-color: #1f2937; color: white; padding: 15px; text-align: center; border-radius: 0 0 5px 5px; font-size: 12px; }
        .report-list { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #2563eb; }
        .report-list ul { margin: 10px 0; padding-left: 20px; }
        .period { background-color: white; padding: 10px; margin: 10px 0; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ðÅ¸�â€ž Beef-Sync</h1>
          <p>Sistema de GestÃ£o PecuÃ¡ria</p>
        </div>
        <div class="content">
          <h2>OlÃ¡ ${recipient.nome || recipient.name}!</h2>
          <p>Segue em anexo os relatÃ³rios  solicitados:</p>
          
          <div class="period">
            <strong>ðÅ¸â€œâ€¦ PerÃ­odo:</strong> ${period.startDate} atÃ© ${period.endDate}
          </div>
          
          <div class="report-list">
            <strong>ðÅ¸â€œÅ  RelatÃ³rios incluÃ­dos:</strong>
            <ul>
              ${reportsList}
            </ul>
          </div>
          
          <p>Os arquivos estÃ£o em formato Excel (.xlsx) e podem ser abertos diretamente no Microsoft Excel, Google Sheets ou outros programas compatÃ­veis.</p>
          
          <p>Qualquer dÃºvida, estamos Ã  disposiÃ§Ã£o.</p>
        </div>
        <div class="footer">
          <p><strong>Beef-Sync</strong> - Sistema de GestÃ£o PecuÃ¡ria</p>
          <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
        </div>
      </div>
    </body>
    </html>
  `
}

