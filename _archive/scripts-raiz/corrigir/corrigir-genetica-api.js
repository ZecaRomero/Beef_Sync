/**
 * Script para corrigir dados genéticos via API
 * Execute: node corrigir-genetica-api.js
 */

const http = require('http')

async function corrigirGenetica() {
  try {
    console.log('\n�Ÿ”� Iniciando correção de dados genéticos via API...\n')
    
    const options = {
      hostname: 'localhost',
      port: 3020,
      path: '/api/animals/corrigir-genetica',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
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
      console.log('�Œ Erro:', response.message)
      return
    }
    
    console.log(`�œ… ${response.message}\n`)
    
    if (response.animais && response.animais.length > 0) {
      console.log('�Ÿ“‹ Animais corrigidos:\n')
      
      response.animais.forEach((animal, index) => {
        console.log(`${index + 1}. ${animal.serie} ${animal.rg} (${animal.nome || 'Sem nome'})`)
        console.log(`   ANTES:`)
        console.log(`   - IQG: ${animal.antes.iqg}`)
        console.log(`   - Pt IQG: ${animal.antes.pt_iqg}`)
        console.log(`   - Situação ABCZ: ${animal.antes.situacao_abcz}`)
        console.log(`   DEPOIS:`)
        console.log(`   - IQG: ${animal.depois.iqg}`)
        console.log(`   - Pt IQG: ${animal.depois.pt_iqg}`)
        console.log(`   - Situação ABCZ: ${animal.depois.situacao_abcz || 'NULL'}`)
        console.log('')
      })
    }
    
    console.log('�œ… Correção concluída!\n')
    
  } catch (error) {
    console.error('�Œ Erro:', error.message)
    console.error('\n�Ÿ’� Certifique-se de que o servidor está rodando em http://localhost:3020')
  }
}

corrigirGenetica().then(() => process.exit(0))
