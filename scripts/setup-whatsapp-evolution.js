require('dotenv').config()
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 Configuração Automática do WhatsApp (Evolution API)\n')

// Verificar se Docker está instalado
function verificarDocker() {
  try {
    execSync('docker --version', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

// Verificar se Evolution API está rodando
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
  console.log('📋 Passo 1: Verificando Docker...')
  
  if (!verificarDocker()) {
    console.log('❌ Docker não está instalado!')
    console.log('\n📥 Instale o Docker Desktop:')
    console.log('   https://www.docker.com/products/docker-desktop')
    console.log('\n   Depois execute este script novamente.')
    return
  }
  
  console.log('✅ Docker encontrado!\n')
  
  console.log('📋 Passo 2: Verificando Evolution API...')
  
  // Verificar se container já existe
  try {
    const containers = execSync('docker ps -a --filter "name=evolution-api" --format "{{.Names}}"', { encoding: 'utf-8' })
    if (containers.includes('evolution-api')) {
      console.log('✅ Container Evolution API encontrado!')
      
      // Verificar se está rodando
      const running = execSync('docker ps --filter "name=evolution-api" --format "{{.Names}}"', { encoding: 'utf-8' })
      if (running.includes('evolution-api')) {
        console.log('✅ Evolution API está rodando!')
      } else {
        console.log('🔄 Iniciando Evolution API...')
        execSync('docker start evolution-api', { stdio: 'inherit' })
        console.log('✅ Evolution API iniciado!')
      }
    } else {
      console.log('📦 Criando container Evolution API...')
      execSync('docker run --name evolution-api -d -p 8080:8080 atendai/evolution-api:latest', { stdio: 'inherit' })
      console.log('✅ Container criado e iniciado!')
      console.log('⏳ Aguarde alguns segundos para o serviço iniciar...')
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  } catch (error) {
    console.log('❌ Erro ao verificar/iniciar Evolution API:', error.message)
    return
  }
  
  console.log('\n📋 Passo 3: Configurando variáveis de ambiente...')
  
  // Ler .env atual
  const envPath = path.join(process.cwd(), '.env')
  let envContent = ''
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8')
  }
  
  // Verificar se já tem configuração
  if (envContent.includes('EVOLUTION_API_URL')) {
    console.log('⚠️ Evolution API já está configurado no .env')
    console.log('\n📝 Configuração atual:')
    const lines = envContent.split('\n')
    lines.forEach(line => {
      if (line.includes('EVOLUTION')) {
        console.log(`   ${line}`)
      }
    })
  } else {
    // Adicionar configuração
    const config = `
# Evolution API Configuration (WhatsApp)
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=cole_a_chave_aqui_apos_configurar
EVOLUTION_INSTANCE_NAME=default
`
    
    fs.appendFileSync(envPath, config)
    console.log('✅ Configuração adicionada ao .env!')
  }
  
  console.log('\n📋 Passo 4: Próximos passos:')
  console.log('\n1. Acesse: http://localhost:8080')
  console.log('2. Crie uma nova instância')
  console.log('3. Escaneie o QR Code com seu WhatsApp')
  console.log('4. Copie a API Key gerada')
  console.log('5. Edite o arquivo .env e substitua "cole_a_chave_aqui_apos_configurar" pela API Key')
  console.log('6. Reinicie o servidor: npm run dev')
  console.log('7. Teste: node scripts/test-notificacao-simulado.js')
  
  console.log('\n✅ Configuração inicial concluída!')
  console.log('\n💡 Dica: Abra http://localhost:8080 no navegador para configurar a instância.')
}

configurar().catch(console.error)

