import nodemailer from 'nodemailer'

// Configurar transporter de email
const createTransporter = () => {
  // Verificar se as variáveis de ambiente estão configuradas
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️ Variáveis SMTP não configuradas. Email desabilitado.')
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
      rejectUnauthorized: false // Para desenvolvimento, remover em produção
    }
  })
}

// Enviar email com anexos
export const sendEmail = async (recipient, subject, htmlContent, attachments = []) => {
  const transporter = createTransporter()
  
  if (!transporter) {
    throw new Error('Serviço de email não configurado. Configure as variáveis SMTP_HOST, SMTP_USER e SMTP_PASS no arquivo .env')
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
    console.log(`✅ Email enviado para ${recipient.email}:`, info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error(`❌ Erro ao enviar email para ${recipient.email}:`, error)
    throw error
  }
}

// Gerar conteúdo HTML do email
export const generateEmailContent = (recipient, period, reports) => {
  const reportNames = {
    boletim: 'Boletim de Gado',
    notasFiscais: 'Notas Fiscais (Entradas e Saídas)',
    movimentacoes: 'Movimentações do Mês',
    nf_entrada_saida: 'Relatório de NF de Entrada e Saída',
    nascimentos: 'Relatório de Nascimentos',
    mortes: 'Relatório de Mortes',
    receptoras_chegaram: 'Receptoras que Chegaram',
    receptoras_faltam_parir: 'Receptoras que Faltam Parir',
    receptoras_faltam_diagnostico: 'Receptoras que Faltam Diagnóstico de Gestação',
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
          <h1>🐄 Beef-Sync</h1>
          <p>Sistema de Gestão Pecuária</p>
        </div>
        <div class="content">
          <h2>Olá ${recipient.nome || recipient.name}!</h2>
          <p>Segue em anexo os relatórios  solicitados:</p>
          
          <div class="period">
            <strong>📅 Período:</strong> ${period.startDate} até ${period.endDate}
          </div>
          
          <div class="report-list">
            <strong>📊 Relatórios incluídos:</strong>
            <ul>
              ${reportsList}
            </ul>
          </div>
          
          <p>Os arquivos estão em formato Excel (.xlsx) e podem ser abertos diretamente no Microsoft Excel, Google Sheets ou outros programas compatíveis.</p>
          
          <p>Qualquer dúvida, estamos à disposição.</p>
        </div>
        <div class="footer">
          <p><strong>Beef-Sync</strong> - Sistema de Gestão Pecuária</p>
          <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
        </div>
      </div>
    </body>
    </html>
  `
}

