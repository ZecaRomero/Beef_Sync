/**
 * Script para corrigir o animal CJCJ 15668
 * Execute: node corrigir-15668.js
 */

const http = require('http')

async function corrigirAnimal() {
  try {
    console.log('\n�Ÿ”� Corrigindo animal CJCJ 15668...\n')
    
    const data = JSON.stringify({
      serie: 'CJCJ',
      rg: '15668',
      iqg: 33.61,  // Valor correto do Excel
      pt_iqg: 1    // Valor correto do Excel
    })
    
    const options = {
      hostname: 'localhost',
      port: 3020,
      path: '/api/animals/corrigir-animal-especifico',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }
    
    const response = await new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let responseData = ''
        res.on('data', chunk => responseData += chunk)
        res.on('end', () => {
          try {
            resolve(JSON.parse(responseData))
          } catch (e) {
            reject(e)
          }
        })
      })
      
      req.on('error', reject)
      req.write(data)
      req.end()
    })
    
    if (!response.success) {
      console.log('�Œ Erro:', response.message)
      return
    }
    
    console.log('�œ…', response.message)
    console.log('')
    console.log('�Ÿ“‹ Detalhes da correção:')
    console.log('�”€'.repeat(50))
    console.log(`Animal: ${response.animal.serie} ${response.animal.rg}`)
    console.log(`Nome: ${response.animal.nome || 'Sem nome'}`)
    console.log('')
    console.log('ANTES:')
    console.log(`  IQG: ${response.animal.antes.iqg}`)
    console.log(`  Pt IQG: ${response.animal.antes.pt_iqg}`)
    console.log(`  Situação ABCZ: ${response.animal.antes.situacao_abcz}`)
    console.log('')
    console.log('DEPOIS:')
    console.log(`  IQG: ${response.animal.depois.iqg}`)
    console.log(`  Pt IQG: ${response.animal.depois.pt_iqg}`)
    console.log(`  Situação ABCZ: ${response.animal.depois.situacao_abcz || 'NULL'}`)
    console.log('')
    console.log('�œ… Correção concluída! Atualize a página para ver as mudanças.')
    console.log('')
    
  } catch (error) {
    console.error('�Œ Erro:', error.message)
    console.error('\n�Ÿ’� Certifique-se de que o servidor está rodando em http://localhost:3020')
  }
}

corrigirAnimal().then(() => process.exit(0))
