require('dotenv').config()
const readline = require('readline')
const fs = require('fs')
const path = require('path')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function configurar() {
  console.log('🚀 Assistente de Configuração do WhatsApp\n')
  console.log('Escolha uma opção:')
  console.log('1. Twilio (Recomendado - mais fácil)')
  console.log('2. Evolution API (Requer Docker)')
  console.log('3. Ver configuração atual')
  console.log('4. Sair\n')
  
  const opcao = await question('Digite o número da opção: ')
  
  if (opcao === '1') {
    await configurarTwilio()
  } else if (opcao === '2') {
    await configurarEvolution()
  } else if (opcao === '3') {
    verificarConfiguracao()
  } else {
    console.log('Até logo!')
    rl.close()
    return
  }
  
  rl.close()
}

async function configurarTwilio() {
  console.log('\n📱 Configurando Twilio...\n')
  console.log('1. Acesse: https://www.twilio.com/try-twilio')
  console.log('2. Crie uma conta (grátis, $15 de crédito)')
  console.log('3. No painel, copie Account SID e Auth Token\n')
  
  const accountSid = await question('Cole o Account SID (começa com AC...): ')
  const authToken = await question('Cole o Auth Token: ')
  const whatsappNumber = await question('Número WhatsApp (ex: whatsapp:+14155238886): ') || 'whatsapp:+14155238886'
  
  const envPath = path.join(process.cwd(), '.env')
  let envContent = ''
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8')
  }
  
  // Remover configurações antigas
  envContent = envContent.split('\n')
    .filter(line => !line.includes('TWILIO_') && !line.includes('EVOLUTION_'))
    .join('\n')
  
  // Adicionar novas configurações
  const config = `
# Twilio WhatsApp Configuration
TWILIO_ACCOUNT_SID=${accountSid.trim()}
TWILIO_AUTH_TOKEN=${authToken.trim()}
TWILIO_WHATSAPP_NUMBER=${whatsappNumber.trim()}
`
  
  envContent += config
  
  fs.writeFileSync(envPath, envContent)
  
  console.log('\n✅ Configuração salva no .env!')
  console.log('\n📦 Instale o Twilio: npm install twilio')
  console.log('🧪 Teste: node scripts/test-notificacao-simulado.js')
}

async function configurarEvolution() {
  console.log('\n📱 Configurando Evolution API...\n')
  console.log('1. Instale Docker Desktop: https://www.docker.com/products/docker-desktop')
  console.log('2. Execute: docker run --name evolution-api -d -p 8080:8080 atendai/evolution-api:latest')
  console.log('3. Acesse: http://localhost:8080')
  console.log('4. Configure a instância e copie a API Key\n')
  
  const apiUrl = await question('URL da Evolution API (ex: http://localhost:8080): ') || 'http://localhost:8080'
  const apiKey = await question('Cole a API Key: ')
  const instanceName = await question('Nome da instância (ex: default): ') || 'default'
  
  const envPath = path.join(process.cwd(), '.env')
  let envContent = ''
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8')
  }
  
  // Remover configurações antigas
  envContent = envContent.split('\n')
    .filter(line => !line.includes('TWILIO_') && !line.includes('EVOLUTION_'))
    .join('\n')
  
  // Adicionar novas configurações
  const config = `
# Evolution API WhatsApp Configuration
EVOLUTION_API_URL=${apiUrl.trim()}
EVOLUTION_API_KEY=${apiKey.trim()}
EVOLUTION_INSTANCE_NAME=${instanceName.trim()}
`
  
  envContent += config
  
  fs.writeFileSync(envPath, envContent)
  
  console.log('\n✅ Configuração salva no .env!')
  console.log('🧪 Teste: node scripts/test-notificacao-simulado.js')
}

function verificarConfiguracao() {
  console.log('\n📊 Configuração Atual:\n')
  
  const evolutionConfigurado = 
    process.env.EVOLUTION_API_URL && 
    process.env.EVOLUTION_API_KEY
  
  const twilioConfigurado = 
    process.env.TWILIO_ACCOUNT_SID && 
    process.env.TWILIO_AUTH_TOKEN
  
  if (evolutionConfigurado) {
    console.log('✅ Evolution API: CONFIGURADO')
    console.log(`   URL: ${process.env.EVOLUTION_API_URL}`)
    console.log(`   Instance: ${process.env.EVOLUTION_INSTANCE_NAME || 'default'}`)
  } else {
    console.log('❌ Evolution API: NÃO CONFIGURADO')
  }
  
  if (twilioConfigurado) {
    console.log('\n✅ Twilio: CONFIGURADO')
    console.log(`   Account SID: ${process.env.TWILIO_ACCOUNT_SID.substring(0, 10)}...`)
    console.log(`   WhatsApp Number: ${process.env.TWILIO_WHATSAPP_NUMBER || 'não definido'}`)
  } else {
    console.log('\n❌ Twilio: NÃO CONFIGURADO')
  }
  
  if (!evolutionConfigurado && !twilioConfigurado) {
    console.log('\n⚠️ Nenhum serviço configurado!')
    console.log('   Execute este script novamente e escolha uma opção.')
  } else {
    console.log('\n✅ WhatsApp está configurado!')
    console.log('   Teste com: node scripts/test-notificacao-simulado.js')
  }
}

configurar().catch(console.error)

