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
  console.log('ðÅ¸Å¡â‚¬ Assistente de ConfiguraÃ§Ã£o do WhatsApp\n')
  console.log('Escolha uma opÃ§Ã£o:')
  console.log('1. Twilio (Recomendado - mais fÃ¡cil)')
  console.log('2. Evolution API (Requer Docker)')
  console.log('3. Ver configuraÃ§Ã£o atual')
  console.log('4. Sair\n')
  
  const opcao = await question('Digite o nÃºmero da opÃ§Ã£o: ')
  
  if (opcao === '1') {
    await configurarTwilio()
  } else if (opcao === '2') {
    await configurarEvolution()
  } else if (opcao === '3') {
    verificarConfiguracao()
  } else {
    console.log('AtÃ© logo!')
    rl.close()
    return
  }
  
  rl.close()
}

async function configurarTwilio() {
  console.log('\nðÅ¸â€œ± Configurando Twilio...\n')
  console.log('1. Acesse: https://www.twilio.com/try-twilio')
  console.log('2. Crie uma conta (grÃ¡tis, $15 de crÃ©dito)')
  console.log('3. No painel, copie Account SID e Auth Token\n')
  
  const accountSid = await question('Cole o Account SID (comeÃ§a com AC...): ')
  const authToken = await question('Cole o Auth Token: ')
  const whatsappNumber = await question('NÃºmero WhatsApp (ex: whatsapp:+14155238886): ') || 'whatsapp:+14155238886'
  
  const envPath = path.join(process.cwd(), '.env')
  let envContent = ''
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8')
  }
  
  // Remover configuraÃ§Ãµes antigas
  envContent = envContent.split('\n')
    .filter(line => !line.includes('TWILIO_') && !line.includes('EVOLUTION_'))
    .join('\n')
  
  // Adicionar novas configuraÃ§Ãµes
  const config = `
# Twilio WhatsApp Configuration
TWILIO_ACCOUNT_SID=${accountSid.trim()}
TWILIO_AUTH_TOKEN=${authToken.trim()}
TWILIO_WHATSAPP_NUMBER=${whatsappNumber.trim()}
`
  
  envContent += config
  
  fs.writeFileSync(envPath, envContent)
  
  console.log('\nâÅ“â€¦ ConfiguraÃ§Ã£o salva no .env!')
  console.log('\nðÅ¸â€œ¦ Instale o Twilio: npm install twilio')
  console.log('ðÅ¸§ª Teste: node scripts/test-notificacao-simulado.js')
}

async function configurarEvolution() {
  console.log('\nðÅ¸â€œ± Configurando Evolution API...\n')
  console.log('1. Instale Docker Desktop: https://www.docker.com/products/docker-desktop')
  console.log('2. Execute: docker run --name evolution-api -d -p 8080:8080 atendai/evolution-api:latest')
  console.log('3. Acesse: http://localhost:8080')
  console.log('4. Configure a instÃ¢ncia e copie a API Key\n')
  
  const apiUrl = await question('URL da Evolution API (ex: http://localhost:8080): ') || 'http://localhost:8080'
  const apiKey = await question('Cole a API Key: ')
  const instanceName = await question('Nome da instÃ¢ncia (ex: default): ') || 'default'
  
  const envPath = path.join(process.cwd(), '.env')
  let envContent = ''
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8')
  }
  
  // Remover configuraÃ§Ãµes antigas
  envContent = envContent.split('\n')
    .filter(line => !line.includes('TWILIO_') && !line.includes('EVOLUTION_'))
    .join('\n')
  
  // Adicionar novas configuraÃ§Ãµes
  const config = `
# Evolution API WhatsApp Configuration
EVOLUTION_API_URL=${apiUrl.trim()}
EVOLUTION_API_KEY=${apiKey.trim()}
EVOLUTION_INSTANCE_NAME=${instanceName.trim()}
`
  
  envContent += config
  
  fs.writeFileSync(envPath, envContent)
  
  console.log('\nâÅ“â€¦ ConfiguraÃ§Ã£o salva no .env!')
  console.log('ðÅ¸§ª Teste: node scripts/test-notificacao-simulado.js')
}

function verificarConfiguracao() {
  console.log('\nðÅ¸â€œÅ  ConfiguraÃ§Ã£o Atual:\n')
  
  const evolutionConfigurado = 
    process.env.EVOLUTION_API_URL && 
    process.env.EVOLUTION_API_KEY
  
  const twilioConfigurado = 
    process.env.TWILIO_ACCOUNT_SID && 
    process.env.TWILIO_AUTH_TOKEN
  
  if (evolutionConfigurado) {
    console.log('âÅ“â€¦ Evolution API: CONFIGURADO')
    console.log(`   URL: ${process.env.EVOLUTION_API_URL}`)
    console.log(`   Instance: ${process.env.EVOLUTION_INSTANCE_NAME || 'default'}`)
  } else {
    console.log('â�Å’ Evolution API: NÃÆ’O CONFIGURADO')
  }
  
  if (twilioConfigurado) {
    console.log('\nâÅ“â€¦ Twilio: CONFIGURADO')
    console.log(`   Account SID: ${process.env.TWILIO_ACCOUNT_SID.substring(0, 10)}...`)
    console.log(`   WhatsApp Number: ${process.env.TWILIO_WHATSAPP_NUMBER || 'nÃ£o definido'}`)
  } else {
    console.log('\nâ�Å’ Twilio: NÃÆ’O CONFIGURADO')
  }
  
  if (!evolutionConfigurado && !twilioConfigurado) {
    console.log('\nâÅ¡ ï¸� Nenhum serviÃ§o configurado!')
    console.log('   Execute este script novamente e escolha uma opÃ§Ã£o.')
  } else {
    console.log('\nâÅ“â€¦ WhatsApp estÃ¡ configurado!')
    console.log('   Teste com: node scripts/test-notificacao-simulado.js')
  }
}

configurar().catch(console.error)

