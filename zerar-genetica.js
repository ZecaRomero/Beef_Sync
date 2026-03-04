/**
 * Script para zerar TODOS os dados genéticos antes de reimportar
 * Execute: node zerar-genetica.js
 */

const http = require('http')

async function zerarGenetica() {
  try {
    console.log('\n⚠️  ATENÇÃO: Este script vai ZERAR todos os dados genéticos!')
    console.log('   (iABCZ, DECA, IQG, Pt IQG, Situação ABCZ)\n')
    console.log('🔧 Enviando requisição...\n')
    
    const options = {
      hostname: 'localhost',
      port: 3020,
      path: '/api/import/limpar-situacao-abcz',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    }
    
    const response = await new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = ''
        res.on('data', chunk => data += chunk)
        res.on('end', () => {
          try {
            resolve(JSON.parse(data))
          } catch (e) {
            reject(e)
          }
        })
      })
      
      req.on('error', reject)
      req.end()
    })
    
    if (!response.success) {
      console.log('❌ Erro:', response.error || response.details)
      return
    }
    
    console.log('✅', response.message)
    console.log('')
    console.log('📋 Próximos passos:')
    console.log('   1. Abra o sistema no navegador')
    console.log('   2. Vá em Importações > Genética')
    console.log('   3. Importe seu Excel com as colunas na ordem:')
    console.log('      Série | RG | iABCZg | DECA | IQG | Pt IQG | Situação ABCZ')
    console.log('')
    
  } catch (error) {
    console.error('❌ Erro:', error.message)
    console.error('\n💡 Certifique-se de que o servidor está rodando em http://localhost:3020')
  }
}

zerarGenetica().then(() => process.exit(0))
