// Script para criar instância no Evolution API via REST API

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080'
const AUTHENTICATION_API_KEY = process.env.EVOLUTION_API_KEY || 'beef-sync-api-key-2024'
const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || 'default'

async function criarInstancia() {
  console.log('🚀 Criando instância no Evolution API...')
  console.log(`   URL: ${EVOLUTION_API_URL}`)
  console.log(`   Nome da instância: ${INSTANCE_NAME}`)
  
  try {
    // Criar instância
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
      console.error('❌ Erro ao criar instância:', errorText)
      
      // Verificar se a instância já existe
      if (errorText.includes('already exists') || createResponse.status === 409) {
        console.log('ℹ️  Instância já existe. Obtendo QR Code...')
        await obterQRCode()
        return
      }
      
      throw new Error(`Erro ${createResponse.status}: ${errorText}`)
    }

    const createResult = await createResponse.json()
    console.log('✅ Instância criada com sucesso!')
    console.log('   Resultado:', JSON.stringify(createResult, null, 2))

    // Obter QR Code
    await obterQRCode()

  } catch (error) {
    console.error('❌ Erro:', error.message)
    process.exit(1)
  }
}

async function obterQRCode() {
  console.log('\n📱 Obtendo QR Code...')
  
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
      console.log('\n✅ QR Code obtido!')
      console.log('\n📱 Escaneie este QR Code com seu WhatsApp:')
      console.log('   1. Abra o WhatsApp no celular')
      console.log('   2. Vá em Configurações → Aparelhos conectados → Conectar um aparelho')
      console.log('   3. Escaneie o QR Code abaixo:\n')
      
      // Tentar abrir QR Code em base64 ou URL
      if (qrResult.qrcode.base64) {
        console.log('   QR Code (base64):', qrResult.qrcode.base64.substring(0, 50) + '...')
        console.log('\n💡 Dica: Acesse http://localhost:8080/manager para ver o QR Code visualmente')
      } else if (qrResult.qrcode.code) {
        console.log('   Código QR:', qrResult.qrcode.code)
      } else {
        console.log('   Dados:', JSON.stringify(qrResult.qrcode, null, 2))
      }
      
      console.log('\n📋 Ou acesse no navegador:')
      console.log(`   ${EVOLUTION_API_URL}/manager`)
    } else {
      console.log('ℹ️  Instância já está conectada!')
      console.log('   Status:', qrResult.instance?.instanceName || 'Conectado')
    }

  } catch (error) {
    console.error('❌ Erro ao obter QR Code:', error.message)
  }
}

// Executar
criarInstancia()
