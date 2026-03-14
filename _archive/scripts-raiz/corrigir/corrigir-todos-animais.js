/**
 * Script para corrigir dados genéticos de TODOS os animais
 * Execute: node corrigir-todos-animais.js
 */

const http = require('http')

async function corrigirTodos() {
  try {
    console.log('\n�Ÿ”� Iniciando correção em massa de dados genéticos...')
    console.log('�š�️  Este processo pode demorar alguns minutos dependendo da quantidade de animais.\n')
    
    const options = {
      hostname: 'localhost',
      port: 3020,
      path: '/api/animals/corrigir-todos-genetica',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }
    
    console.log('�Ÿ“� Enviando requisição para o servidor...\n')
    
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
      console.log('�Ÿ“‹ Resumo dos animais corrigidos:\n')
      console.log('�”€'.repeat(80))
      console.log('Nº  | Série RG      | Nome                    | IQG (antes�†’depois) | Pt IQG (antes�†’depois)')
      console.log('�”€'.repeat(80))
      
      response.animais.forEach((animal, index) => {
        const num = String(index + 1).padStart(3, ' ')
        const serieRg = `${animal.serie} ${animal.rg}`.padEnd(13, ' ')
        const nome = (animal.nome || 'Sem nome').substring(0, 23).padEnd(23, ' ')
        const iqgAntes = String(animal.antes.iqg || '-').padStart(6, ' ')
        const iqgDepois = String(animal.depois.iqg || '-').padStart(6, ' ')
        const ptIqgAntes = String(animal.antes.pt_iqg || '-').padStart(6, ' ')
        const ptIqgDepois = String(animal.depois.pt_iqg || '-').padStart(6, ' ')
        
        console.log(`${num} | ${serieRg} | ${nome} | ${iqgAntes}�†’${iqgDepois}     | ${ptIqgAntes}�†’${ptIqgDepois}`)
      })
      
      console.log('�”€'.repeat(80))
      console.log('')
    }
    
    if (response.erros > 0) {
      console.log(`�š�️  ${response.erros} erro(s) encontrado(s):\n`)
      response.errosDetalhes.forEach((erro, index) => {
        console.log(`${index + 1}. ${erro.serie} ${erro.rg}: ${erro.erro}`)
      })
      console.log('')
    }
    
    console.log('�œ… Correção concluída!')
    console.log(`�Ÿ“Š Total: ${response.corrigidos} animais corrigidos`)
    if (response.erros > 0) {
      console.log(`�š�️  Erros: ${response.erros}`)
    }
    console.log('')
    console.log('�Ÿ’� Atualize as páginas abertas no navegador para ver as mudanças.')
    console.log('')
    
  } catch (error) {
    console.error('�Œ Erro:', error.message)
    console.error('\n�Ÿ’� Certifique-se de que o servidor está rodando em http://localhost:3020')
  }
}

corrigirTodos().then(() => process.exit(0))
