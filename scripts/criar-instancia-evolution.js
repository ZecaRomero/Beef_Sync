// Script para criar instÃ¢ncia no Evolution API via REST API

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080'
const AUTHENTICATION_API_KEY = process.env.EVOLUTION_API_KEY || 'beef-sync-api-key-2024'
const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || 'default'

async function criarInstancia() {
  console.log('ðÅ¸Å¡â‚¬ Criando instÃ¢ncia no Evolution API...')
  console.log(`   URL: ${EVOLUTION_API_URL}`)
  console.log(`   Nome da instÃ¢ncia: ${INSTANCE_NAME}`)
  
  try {
    // Criar instÃ¢ncia
    const createResponse = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': AUTHENTICATION_API_KEY
      },
      body: JSON.stringify({
        instanceName: INSTANCE_NAME,
        token: INSTANCE_NAME,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS'
      })
    })

    if (!createResponse.ok) {
      const errorText = await createResponse.text()
      console.error('â�Å’ Erro ao criar instÃ¢ncia:', errorText)
      
      // Verificar se a instÃ¢ncia jÃ¡ existe
      if (errorText.includes('already exists') || createResponse.status === 409) {
        console.log('ââ€ž¹ï¸�  InstÃ¢ncia jÃ¡ existe. Obtendo QR Code...')
        await obterQRCode()
        return
      }
      
      throw new Error(`Erro ${createResponse.status}: ${errorText}`)
    }

    const createResult = await createResponse.json()
    console.log('âÅ“â€¦ InstÃ¢ncia criada com sucesso!')
    console.log('   Resultado:', JSON.stringify(createResult, null, 2))

    // Obter QR Code
    await obterQRCode()

  } catch (error) {
    console.error('â�Å’ Erro:', error.message)
    process.exit(1)
  }
}

async function obterQRCode() {
  console.log('\nðÅ¸â€œ± Obtendo QR Code...')
  
  try {
    const qrResponse = await fetch(`${EVOLUTION_API_URL}/instance/connect/${INSTANCE_NAME}`, {
      method: 'GET',
      headers: {
        'apikey': AUTHENTICATION_API_KEY
      }
    })

    if (!qrResponse.ok) {
      const errorText = await qrResponse.text()
      throw new Error(`Erro ao obter QR Code: ${qrResponse.status} - ${errorText}`)
    }

    const qrResult = await qrResponse.json()
    
    if (qrResult.qrcode) {
      console.log('\nâÅ“â€¦ QR Code obtido!')
      console.log('\nðÅ¸â€œ± Escaneie este QR Code com seu WhatsApp:')
      console.log('   1. Abra o WhatsApp no celular')
      console.log('   2. VÃ¡ em ConfiguraÃ§Ãµes ââ€ â€™ Aparelhos conectados ââ€ â€™ Conectar um aparelho')
      console.log('   3. Escaneie o QR Code abaixo:\n')
      
      // Tentar abrir QR Code em base64 ou URL
      if (qrResult.qrcode.base64) {
        console.log('   QR Code (base64):', qrResult.qrcode.base64.substring(0, 50) + '...')
        console.log('\nðÅ¸â€™¡ Dica: Acesse http://localhost:8080/manager para ver o QR Code visualmente')
      } else if (qrResult.qrcode.code) {
        console.log('   CÃ³digo QR:', qrResult.qrcode.code)
      } else {
        console.log('   Dados:', JSON.stringify(qrResult.qrcode, null, 2))
      }
      
      console.log('\nðÅ¸â€œâ€¹ Ou acesse no navegador:')
      console.log(`   ${EVOLUTION_API_URL}/manager`)
    } else {
      console.log('ââ€ž¹ï¸�  InstÃ¢ncia jÃ¡ estÃ¡ conectada!')
      console.log('   Status:', qrResult.instance?.instanceName || 'Conectado')
    }

  } catch (error) {
    console.error('â�Å’ Erro ao obter QR Code:', error.message)
  }
}

// Executar
criarInstancia()
