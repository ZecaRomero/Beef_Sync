require('dotenv').config()
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('ðÅ¸Å¡â‚¬ ConfiguraÃ§Ã£o AutomÃ¡tica do WhatsApp (Evolution API)\n')

// Verificar se Docker estÃ¡ instalado
function verificarDocker() {
  try {
    execSync('docker --version', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

// Verificar se Evolution API estÃ¡ rodando
function verificarEvolutionAPI() {
  try {
    const response = require('http').get('http://localhost:8080', (res) => {
      return res.statusCode === 200 || res.statusCode === 404
    })
    return true
  } catch {
    return false
  }
}

async function configurar() {
  console.log('ðÅ¸â€œâ€¹ Passo 1: Verificando Docker...')
  
  if (!verificarDocker()) {
    console.log('â�Å’ Docker nÃ£o estÃ¡ instalado!')
    console.log('\nðÅ¸â€œ¥ Instale o Docker Desktop:')
    console.log('   https://www.docker.com/products/docker-desktop')
    console.log('\n   Depois execute este script novamente.')
    return
  }
  
  console.log('âÅ“â€¦ Docker encontrado!\n')
  
  console.log('ðÅ¸â€œâ€¹ Passo 2: Verificando Evolution API...')
  
  // Verificar se container jÃ¡ existe
  try {
    const containers = execSync('docker ps -a --filter "name=evolution-api" --format "{{.Names}}"', { encoding: 'utf-8' })
    if (containers.includes('evolution-api')) {
      console.log('âÅ“â€¦ Container Evolution API encontrado!')
      
      // Verificar se estÃ¡ rodando
      const running = execSync('docker ps --filter "name=evolution-api" --format "{{.Names}}"', { encoding: 'utf-8' })
      if (running.includes('evolution-api')) {
        console.log('âÅ“â€¦ Evolution API estÃ¡ rodando!')
      } else {
        console.log('ðÅ¸â€�â€ž Iniciando Evolution API...')
        execSync('docker start evolution-api', { stdio: 'inherit' })
        console.log('âÅ“â€¦ Evolution API iniciado!')
      }
    } else {
      console.log('ðÅ¸â€œ¦ Criando container Evolution API...')
      execSync('docker run --name evolution-api -d -p 8080:8080 atendai/evolution-api:latest', { stdio: 'inherit' })
      console.log('âÅ“â€¦ Container criado e iniciado!')
      console.log('â�³ Aguarde alguns segundos para o serviÃ§o iniciar...')
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  } catch (error) {
    console.log('â�Å’ Erro ao verificar/iniciar Evolution API:', error.message)
    return
  }
  
  console.log('\nðÅ¸â€œâ€¹ Passo 3: Configurando variÃ¡veis de ambiente...')
  
  // Ler .env atual
  const envPath = path.join(process.cwd(), '.env')
  let envContent = ''
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8')
  }
  
  // Verificar se jÃ¡ tem configuraÃ§Ã£o
  if (envContent.includes('EVOLUTION_API_URL')) {
    console.log('âÅ¡ ï¸� Evolution API jÃ¡ estÃ¡ configurado no .env')
    console.log('\nðÅ¸â€œ� ConfiguraÃ§Ã£o atual:')
    const lines = envContent.split('\n')
    lines.forEach(line => {
      if (line.includes('EVOLUTION')) {
        console.log(`   ${line}`)
      }
    })
  } else {
    // Adicionar configuraÃ§Ã£o
    const config = `
# Evolution API Configuration (WhatsApp)
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=cole_a_chave_aqui_apos_configurar
EVOLUTION_INSTANCE_NAME=default
`
    
    fs.appendFileSync(envPath, config)
    console.log('âÅ“â€¦ ConfiguraÃ§Ã£o adicionada ao .env!')
  }
  
  console.log('\nðÅ¸â€œâ€¹ Passo 4: PrÃ³ximos passos:')
  console.log('\n1. Acesse: http://localhost:8080')
  console.log('2. Crie uma nova instÃ¢ncia')
  console.log('3. Escaneie o QR Code com seu WhatsApp')
  console.log('4. Copie a API Key gerada')
  console.log('5. Edite o arquivo .env e substitua "cole_a_chave_aqui_apos_configurar" pela API Key')
  console.log('6. Reinicie o servidor: npm run dev')
  console.log('7. Teste: node scripts/test-notificacao-simulado.js')
  
  console.log('\nâÅ“â€¦ ConfiguraÃ§Ã£o inicial concluÃ­da!')
  console.log('\nðÅ¸â€™¡ Dica: Abra http://localhost:8080 no navegador para configurar a instÃ¢ncia.')
}

configurar().catch(console.error)

