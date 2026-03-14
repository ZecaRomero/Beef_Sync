// ServiÃ§o de envio de WhatsApp
// Suporta mÃºltiplas APIs: Twilio, Evolution API, ou WhatsApp Web API

// Normaliza nÃºmero para formato internacional (55 + DDD + nÃºmero)
// Evita duplicar cÃ³digo do paÃ­s quando usuÃ¡rio jÃ¡ informou 55
function normalizeWhatsAppNumber(whatsapp) {
  if (!whatsapp) return ''
  const digits = String(whatsapp).replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length >= 12) {
    return digits // JÃ¡ tem cÃ³digo do paÃ­s
  }
  return `55${digits}`
}

// Helper para verificar se Twilio estÃ¡ disponÃ­vel (twilio em optionalDependencies)
const isTwilioAvailable = () => {
  try {
    if (typeof require === 'undefined') return false
    require.resolve('twilio')
    return true
  } catch {
    return false
  }
}

// Helper para importar Twilio dinamicamente (opcional)
const importTwilio = async () => {
  // Verificar se estÃ¡ disponÃ­vel antes de tentar importar
  if (!isTwilioAvailable()) {
    return null
  }
  
  try {
    // Usar Function para evitar anÃ¡lise estÃ¡tica do webpack
    const dynamicImport = new Function('moduleName', 'return import(moduleName)')
    const twilioModule = await dynamicImport('twilio')
    return twilioModule.default || twilioModule
  } catch (error) {
    // Se o mÃ³dulo nÃ£o estiver instalado, retornar null
    if (error.code === 'MODULE_NOT_FOUND' || 
        error.message.includes('Cannot find module') ||
        error.message.includes("Cannot resolve module")) {
      return null
    }
    throw error
  }
}

// Enviar via Twilio WhatsApp Business API
export const sendViaTwilio = async (recipient, message, mediaUrl = null) => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    throw new Error('Twilio nÃ£o configurado. Configure TWILIO_ACCOUNT_SID e TWILIO_AUTH_TOKEN no .env')
  }

  // Import dinÃ¢mico do Twilio
  const twilio = await importTwilio()
  if (!twilio) {
    throw new Error('MÃ³dulo Twilio nÃ£o instalado. Execute: npm install twilio ou configure Evolution API')
  }

  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  )

  const whatsappNumber = normalizeWhatsAppNumber(recipient.whatsapp)
  const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'

  const messageOptions = {
    from: fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`,
    to: `whatsapp:+${whatsappNumber}`,
    body: message
  }

  // Se houver mÃ­dia (arquivo), adicionar
  if (mediaUrl) {
    messageOptions.mediaUrl = [mediaUrl]
  }

  try {
    const result = await client.messages.create(messageOptions)
    console.log(`âÅ“â€¦ WhatsApp enviado via Twilio para ${recipient.whatsapp}:`, result.sid)
    return { success: true, messageId: result.sid }
  } catch (error) {
    console.error(`â�Å’ Erro ao enviar WhatsApp via Twilio:`, error)
    throw error
  }
}

// Enviar via Evolution API (API local de WhatsApp)
export const sendViaEvolutionAPI = async (recipient, message) => {
  if (!process.env.EVOLUTION_API_URL || !process.env.EVOLUTION_API_KEY) {
    throw new Error('Evolution API nÃ£o configurada. Configure EVOLUTION_API_URL e EVOLUTION_API_KEY no .env')
  }

  const whatsappNumber = normalizeWhatsAppNumber(recipient.whatsapp)
  const instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'default'

  const url = `${process.env.EVOLUTION_API_URL}/message/sendText/${instanceName}`
  
  const payload = {
    number: whatsappNumber,
    text: message
  }

  try {
    console.log(`ðÅ¸â€œ¤ Evolution API: enviando para ${whatsappNumber} (${recipient.whatsapp})`)
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.EVOLUTION_API_KEY
      },
      body: JSON.stringify(payload)
    })

    const responseText = await response.text()
    if (!response.ok) {
      console.error(`â�Å’ Evolution API error ${response.status}:`, responseText)
      throw new Error(`Evolution API error: ${response.status} - ${responseText}`)
    }

    let result
    try {
      result = JSON.parse(responseText)
    } catch {
      result = {}
    }
    console.log(`âÅ“â€¦ WhatsApp enviado via Evolution API para ${recipient.whatsapp}`)

    return { success: true, messageId: result.key?.id }
  } catch (error) {
    if (error.message?.includes('fetch') || error.code === 'ECONNREFUSED') {
      console.error(`â�Å’ Evolution API inacessÃ­vel. Verifique se estÃ¡ rodando em ${process.env.EVOLUTION_API_URL}`)
      throw new Error('Evolution API inacessÃ­vel. Inicie o Evolution API (ex: docker run -p 8080:8080 atendai/evolution-api) e verifique EVOLUTION_API_URL no .env')
    }
    console.error(`â�Å’ Erro ao enviar WhatsApp via Evolution API:`, error)
    throw error
  }
}

// Enviar mÃ­dia via Evolution API
const sendMediaViaEvolutionAPI = async (recipient, mediaBuffer, filename, caption) => {
  const whatsappNumber = normalizeWhatsAppNumber(recipient.whatsapp)
  const instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'default'

  // Converter buffer para base64
  const base64Media = mediaBuffer.toString('base64')
  
  // Determinar mimeType baseado na extensÃ£o do arquivo
  let mimeType = 'application/octet-stream'
  let mediatype = 'document'
  
  if (filename.endsWith('.xlsx')) {
    mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    mediatype = 'document'
  } else if (filename.endsWith('.png')) {
    mimeType = 'image/png'
    mediatype = 'image'
  } else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) {
    mimeType = 'image/jpeg'
    mediatype = 'image'
  } else if (filename.endsWith('.pdf')) {
    mimeType = 'application/pdf'
    mediatype = 'document'
  }

  const url = `${process.env.EVOLUTION_API_URL}/message/sendMedia/${instanceName}`

  const payload = {
    number: whatsappNumber,
    mediatype: mediatype,
    media: `data:${mimeType};base64,${base64Media}`,
    fileName: filename,
    caption: caption
  }

  try {
    console.log(`ðÅ¸â€œ¤ Evolution API (mÃ­dia): enviando para ${whatsappNumber} (${recipient.whatsapp})`)
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.EVOLUTION_API_KEY
      },
      body: JSON.stringify(payload)
    })

    const responseText = await response.text()
    if (!response.ok) {
      console.error(`â�Å’ Evolution API media error ${response.status}:`, responseText.substring(0, 200))
      throw new Error(`Evolution API media error: ${response.status} - ${responseText}`)
    }

    try {
      return JSON.parse(responseText)
    } catch {
      return {}
    }
  } catch (error) {
    if (error.message?.includes('fetch') || error.code === 'ECONNREFUSED') {
      console.error(`â�Å’ Evolution API inacessÃ­vel em ${process.env.EVOLUTION_API_URL}`)
      throw new Error('Evolution API inacessÃ­vel. Verifique se estÃ¡ rodando e se EVOLUTION_API_URL estÃ¡ correto no .env')
    }
    throw error
  }
}

// Tentar usar WhatsApp Web como fallback
async function sendViaWhatsAppWeb(recipient, message) {
  try {
    // Tentar importar CommonJS primeiro
    let whatsappWeb
    try {
      whatsappWeb = require('./whatsappWebService.cjs')
    } catch {
      // Se nÃ£o funcionar, tentar ES module
      const module = await import('./whatsappWebService.js')
      whatsappWeb = module.default || module
    }
    
    const ready = await whatsappWeb.isWhatsAppReady()
    if (!ready) {
      throw new Error('WhatsApp Web nÃ£o estÃ¡ pronto. Escaneie o QR Code primeiro. Execute o servidor (npm run dev) e escaneie o QR Code que aparecer no terminal.')
    }
    
    return await whatsappWeb.sendWhatsAppWeb(recipient, message)
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND' || error.message.includes('nÃ£o instalado') || error.message.includes('Cannot find module')) {
      throw new Error('whatsapp-web.js nÃ£o instalado. Execute: npm install whatsapp-web.js qrcode-terminal')
    }
    throw error
  }
}

// FunÃ§Ã£o principal de envio de mensagem de texto
export const sendWhatsApp = async (recipient, message) => {
  // Verificar qual serviÃ§o estÃ¡ configurado (ordem de prioridade)
  
  // 1. Tentar Twilio primeiro
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
      return await sendViaTwilio(recipient, message)
    } catch (error) {
      console.warn('âÅ¡ ï¸� Erro ao enviar via Twilio, tentando alternativas...', error.message)
      // Continuar para tentar outras opÃ§Ãµes
    }
  }
  
  // 2. Tentar Evolution API
  if (process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY) {
    try {
      return await sendViaEvolutionAPI(recipient, message)
    } catch (error) {
      console.warn('âÅ¡ ï¸� Erro ao enviar via Evolution API, tentando WhatsApp Web...', error.message)
      // Continuar para tentar WhatsApp Web
    }
  }
  
  // 3. Tentar WhatsApp Web como Ãºltima opÃ§Ã£o
  try {
    return await sendViaWhatsAppWeb(recipient, message)
  } catch (error) {
    // Se nenhum funcionar, mostrar erro claro
    throw new Error(
      'Nenhum serviÃ§o de WhatsApp disponÃ­vel. ' +
      'Configure Twilio, Evolution API ou instale whatsapp-web.js. ' +
      'Veja: docs/CONFIGURAR_WHATSAPP.md'
    )
  }
}

// FunÃ§Ã£o para enviar arquivo via WhatsApp
export const sendWhatsAppMedia = async (recipient, mediaBuffer, filename, caption = '') => {
  if (process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY) {
    return await sendMediaViaEvolutionAPI(recipient, mediaBuffer, filename, caption)
  } else if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    console.warn('âÅ¡ ï¸� Twilio requer URL pÃºblica para mÃ­dia. Arquivo nÃ£o enviado.')
    throw new Error('Twilio requer URL pÃºblica para envio de arquivos. Configure Evolution API ou faÃ§a upload do arquivo primeiro.')
  } else {
    try {
      let whatsappWeb
      try {
        whatsappWeb = require('./whatsappWebService.cjs')
      } catch {
        const module = await import('./whatsappWebService.js')
        whatsappWeb = module.default || module
      }
      return await whatsappWeb.sendWhatsAppWebMedia(recipient, mediaBuffer, filename, caption)
    } catch (error) {
      throw new Error('Nenhum serviÃ§o de WhatsApp configurado para envio de mÃ­dia. Instale whatsapp-web.js ou configure Evolution API.')
    }
  }
}

// Gerar mensagem formatada para WhatsApp
export const generateWhatsAppMessage = (recipient, period, reports) => {
  const reportNames = {
    boletim: 'ðÅ¸â€œÅ  Boletim de Gado',
    notasFiscais: 'ðÅ¸â€œâ€¹ Notas Fiscais (Entradas e SaÃ­das)',
    movimentacoes: 'ðÅ¸â€œË† MovimentaÃ§Ãµes do MÃªs'
  }

  const reportsList = reports.map(r => `ââ‚¬¢ ${reportNames[r] || r}`).join('\n')

  return `ðÅ¸�â€ž *BEEF-SYNC - RELATÃâ€œRIOS CONTÃ�BEIS*

OlÃ¡ ${recipient.name}!

ðÅ¸â€œâ€¦ *PerÃ­odo:* ${period.startDate} atÃ© ${period.endDate}

ðÅ¸â€œÅ  *RelatÃ³rios incluÃ­dos:*
${reportsList}

Os arquivos estÃ£o sendo enviados em anexo.

Gerado em: ${new Date().toLocaleString('pt-BR')}

_Sistema Beef-Sync_`
}

