// ServiÃ§o alternativo de WhatsApp usando whatsapp-web.js
// Mais simples que Twilio, nÃ£o requer conta externa

let client = null
let qrCode = null
let isReady = false
let qrCodeCallbacks = []

// Inicializar cliente WhatsApp Web
async function initWhatsAppClient() {
  try {
    // Importar dinamicamente para evitar erro se nÃ£o estiver instalado
    const whatsappModule = await import('whatsapp-web.js')
    const qrcodeModule = await import('qrcode-terminal')
    const { Client, LocalAuth } = whatsappModule.default || whatsappModule
    const qrcode = qrcodeModule.default || qrcodeModule
    
    if (client) {
      return client
    }

    client = new Client({
      authStrategy: new LocalAuth({
        dataPath: './whatsapp-session'
      }),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    })

    // Eventos
    client.on('qr', (qr) => {
      qrCode = qr
      console.log('\nðÅ¸â€œ± Escaneie este QR Code com seu WhatsApp:\n')
      qrcode.generate(qr, { small: true })
      console.log('\n')
      
      // Notificar callbacks
      qrCodeCallbacks.forEach(callback => callback(qr))
    })

    client.on('ready', () => {
      isReady = true
      qrCode = null
      console.log('âÅ“â€¦ WhatsApp conectado e pronto!')
    })

    client.on('authenticated', () => {
      console.log('âÅ“â€¦ WhatsApp autenticado!')
    })

    client.on('auth_failure', (msg) => {
      console.error('â�Å’ Falha na autenticaÃ§Ã£o:', msg)
      isReady = false
    })

    client.on('disconnected', (reason) => {
      console.log('âÅ¡ ï¸� WhatsApp desconectado:', reason)
      isReady = false
      client = null
    })

    // Inicializar
    await client.initialize()
    
    return client
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.warn('âÅ¡ ï¸� whatsapp-web.js nÃ£o instalado. Execute: npm install whatsapp-web.js qrcode-terminal')
      throw new Error('whatsapp-web.js nÃ£o instalado. Execute: npm install whatsapp-web.js qrcode-terminal')
    }
    throw error
  }
}

// Obter QR Code para escanear
export async function getQRCode() {
  return new Promise(async (resolve, reject) => {
    if (isReady) {
      resolve(null) // JÃ¡ estÃ¡ conectado
      return
    }
    
    if (!client) {
      try {
        await initWhatsAppClient()
      } catch (error) {
        reject(error)
        return
      }
    }
    
    // Se jÃ¡ tem QR Code, retornar
    if (qrCode) {
      resolve(qrCode)
      return
    }
    
    // Aguardar QR Code
    const callback = (qr) => {
      resolve(qr)
      qrCodeCallbacks = qrCodeCallbacks.filter(cb => cb !== callback)
    }
    
    qrCodeCallbacks.push(callback)
    
    // Timeout apÃ³s 30 segundos
    setTimeout(() => {
      qrCodeCallbacks = qrCodeCallbacks.filter(cb => cb !== callback)
      if (!isReady && !qrCode) {
        reject(new Error('Timeout aguardando QR Code'))
      }
    }, 30000)
  })
}

// Verificar se estÃ¡ pronto
export async function isWhatsAppReady() {
  if (isReady) {
    return true
  }
  
  if (!client) {
    try {
      await initWhatsAppClient()
      // Aguardar um pouco para verificar se conecta
      await new Promise(resolve => setTimeout(resolve, 2000))
    } catch {
      return false
    }
  }
  
  return isReady
}

// Enviar mensagem via WhatsApp Web
export async function sendWhatsAppWeb(recipient, message) {
  try {
    if (!client) {
      await initWhatsAppClient()
    }
    
    // Aguardar estar pronto (mÃ¡ximo 30 segundos)
    let attempts = 0
    while (!isReady && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      attempts++
    }
    
    if (!isReady) {
      throw new Error('WhatsApp nÃ£o estÃ¡ pronto. Escaneie o QR Code primeiro. Execute o servidor e escaneie o QR Code que aparecer no terminal.')
    }
    
    // Formatar nÃºmero (remover caracteres nÃ£o numÃ©ricos e adicionar cÃ³digo do paÃ­s)
    let phoneNumber = recipient.whatsapp.replace(/\D/g, '')
    
    // Se nÃ£o comeÃ§ar com 55 (Brasil), adicionar
    if (!phoneNumber.startsWith('55')) {
      phoneNumber = `55${phoneNumber}`
    }
    
    // Adicionar @c.us para WhatsApp Web
    const chatId = `${phoneNumber}@c.us`
    
    // Enviar mensagem
    await client.sendMessage(chatId, message)
    
    console.log(`âÅ“â€¦ Mensagem WhatsApp enviada para ${recipient.name} (${phoneNumber})`)
    
    return { success: true, messageId: Date.now().toString() }
  } catch (error) {
    console.error('â�Å’ Erro ao enviar WhatsApp:', error)
    throw error
  }
}

export async function sendWhatsAppWebMedia(recipient, mediaBuffer, filename, caption = '') {
  try {
    if (!client) {
      await initWhatsAppClient()
    }
    let attempts = 0
    while (!isReady && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      attempts++
    }
    if (!isReady) {
      throw new Error('WhatsApp nÃ£o estÃ¡ pronto. Escaneie o QR Code primeiro.')
    }
    let phoneNumber = recipient.whatsapp.replace(/\D/g, '')
    if (!phoneNumber.startsWith('55')) {
      phoneNumber = `55${phoneNumber}`
    }
    const chatId = `${phoneNumber}@c.us`
    const whatsappModule = await import('whatsapp-web.js')
    const { MessageMedia } = whatsappModule.default || whatsappModule
    const base64 = mediaBuffer.toString('base64')
    let mimeType = 'application/octet-stream'
    if (filename.endsWith('.xlsx')) mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    else if (filename.endsWith('.png')) mimeType = 'image/png'
    else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) mimeType = 'image/jpeg'
    else if (filename.endsWith('.pdf')) mimeType = 'application/pdf'
    const media = new MessageMedia(mimeType, base64, filename)
    await client.sendMessage(chatId, media, { caption })
    return { success: true, messageId: Date.now().toString() }
  } catch (error) {
    throw error
  }
}
// Inicializar na importaÃ§Ã£o (opcional)
if (typeof window === 'undefined') {
  // Apenas no servidor
  initWhatsAppClient().catch(err => {
    if (!err.message.includes('nÃ£o instalado')) {
      console.error('Erro ao inicializar WhatsApp:', err)
    }
  })
}

export default {
  sendWhatsAppWeb,
  sendWhatsAppWebMedia,
  getQRCode,
  isWhatsAppReady,
  initWhatsAppClient
}

