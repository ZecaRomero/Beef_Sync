require('dotenv').config()

console.log('ðÅ¸â€�� Verificando configuraÃ§Ã£o do WhatsApp...\n')

// Verificar Evolution API
const evolutionConfigurado = 
  process.env.EVOLUTION_API_URL && 
  process.env.EVOLUTION_API_KEY

// Verificar Twilio
const twilioConfigurado = 
  process.env.TWILIO_ACCOUNT_SID && 
  process.env.TWILIO_AUTH_TOKEN

console.log('ðÅ¸â€œÅ  Status da ConfiguraÃ§Ã£o:\n')

if (evolutionConfigurado) {
  console.log('âÅ“â€¦ Evolution API: CONFIGURADO')
  console.log(`   URL: ${process.env.EVOLUTION_API_URL}`)
  console.log(`   Instance: ${process.env.EVOLUTION_INSTANCE_NAME || 'default'}`)
  console.log(`   API Key: ${process.env.EVOLUTION_API_KEY.substring(0, 10)}...`)
} else {
  console.log('â�Å’ Evolution API: NÃÆ’O CONFIGURADO')
  console.log('   Adicione no .env:')
  console.log('   EVOLUTION_API_URL=http://localhost:8080')
  console.log('   EVOLUTION_API_KEY=sua_chave_aqui')
  console.log('   EVOLUTION_INSTANCE_NAME=default')
}

console.log('')

if (twilioConfigurado) {
  console.log('âÅ“â€¦ Twilio: CONFIGURADO')
  console.log(`   Account SID: ${process.env.TWILIO_ACCOUNT_SID.substring(0, 10)}...`)
  console.log(`   WhatsApp Number: ${process.env.TWILIO_WHATSAPP_NUMBER || 'nÃ£o definido'}`)
} else {
  console.log('â�Å’ Twilio: NÃÆ’O CONFIGURADO')
  console.log('   Adicione no .env:')
  console.log('   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')
  console.log('   TWILIO_AUTH_TOKEN=seu_auth_token_aqui')
  console.log('   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886')
}

console.log('')

if (evolutionConfigurado || twilioConfigurado) {
  console.log('âÅ“â€¦ WhatsApp estÃ¡ configurado!')
  console.log('   VocÃª pode testar com: node scripts/test-notificacao-simulado.js')
} else {
  console.log('âÅ¡ ï¸� Nenhum serviÃ§o de WhatsApp configurado!')
  console.log('\nðÅ¸â€œâ€“ Para configurar, veja: docs/CONFIGURAR_WHATSAPP.md')
  console.log('\nðÅ¸Å¡â‚¬ OpÃ§Ã£o rÃ¡pida (Evolution API):')
  console.log('   1. docker run --name evolution-api -d -p 8080:8080 atendai/evolution-api:latest')
  console.log('   2. Acesse http://localhost:8080')
  console.log('   3. Configure a instÃ¢ncia e copie a API Key')
  console.log('   4. Adicione no .env: EVOLUTION_API_KEY=sua_chave')
}

