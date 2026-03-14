// Script para testar e debugar a importaÃ§Ã£o de Excel
const fetch = require('node-fetch')
const fs = require('fs')
const path = require('path')

async function testExcelImport() {
  console.log('ðÅ¸â€ TESTANDO IMPORTAÃâ€¡ÃÆ’O DE EXCEL')
  console.log('=' .repeat(50))
  
  try {
    // 1. Verificar se o servidor estÃ¡ rodando
    console.log('1ï¸âÆ’£ Verificando servidor...')
    const healthCheck = await fetch('http://localhost:3020/api/health')
    if (healthCheck.ok) {
      console.log('âÅ“â€¦ Servidor estÃ¡ rodando')
    } else {
      console.log('âÅ’ Servidor nÃ£o estÃ¡ respondendo')
      return
    }
    
    // 2. Testar endpoint de importaÃ§Ã£o FIV
    console.log('\n2ï¸âÆ’£ Testando endpoint de importaÃ§Ã£o FIV...')
    
    // Criar dados de teste simulando um Excel
    const testData = {
      fileData: 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,UEsDBBQAAAAIAA==', // Base64 vazio para teste
      fileName: 'teste.xlsx',
      laboratorio: 'Lab Teste',
      veterinario: 'Dr. Teste'
    }
    
    const importResponse = await fetch('http://localhost:3020/api/reproducao/coleta-fiv/import-excel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    })
    
    console.log('Status da resposta:', importResponse.status)
    const responseText = await importResponse.text()
    console.log('Resposta:', responseText)
    
    // 3. Verificar se hÃ¡ arquivos Excel de exemplo
    console.log('\n3ï¸âÆ’£ Verificando arquivos Excel de exemplo...')
    const excelFiles = fs.readdirSync('.').filter(file => 
      file.endsWith('.xlsx') || file.endsWith('.xls')
    )
    
    if (excelFiles.length > 0) {
      console.log('ðÅ¸â€œÅ  Arquivos Excel encontrados:')
      excelFiles.forEach(file => {
        const stats = fs.statSync(file)
        console.log(`  - ${file} (${stats.size} bytes)`)
      })
    } else {
      console.log('âÅ¡ ï¸ Nenhum arquivo Excel encontrado no diretÃ³rio')
    }
    
    // 4. Verificar estrutura do banco de dados
    console.log('\n4ï¸âÆ’£ Verificando estrutura do banco...')
    const dbCheck = await fetch('http://localhost:3020/api/database/check')
    if (dbCheck.ok) {
      const dbData = await dbCheck.json()
      console.log('âÅ“â€¦ Banco de dados acessÃ­vel')
      console.log('Tabelas encontradas:', dbData.tables?.length || 'N/A')
    } else {
      console.log('âÅ’ Erro ao acessar banco de dados')
    }
    
    // 5. Verificar logs do sistema
    console.log('\n5ï¸âÆ’£ Verificando logs...')
    const logFiles = ['error.log', 'app.log', 'debug.log']
    logFiles.forEach(logFile => {
      if (fs.existsSync(logFile)) {
        const stats = fs.statSync(logFile)
        console.log(`ðÅ¸â€œ ${logFile}: ${stats.size} bytes`)
        
        // Ler Ãºltimas linhas do log
        const content = fs.readFileSync(logFile, 'utf8')
        const lines = content.split('\n').slice(-5).filter(line => line.trim())
        if (lines.length > 0) {
          console.log('ÃÅ¡ltimas linhas:')
          lines.forEach(line => console.log(`  ${line}`))
        }
      }
    })
    
    // 6. Testar dependÃªncias
    console.log('\n6ï¸âÆ’£ Verificando dependÃªncias...')
    try {
      const XLSX = require('xlsx')
      console.log('âÅ“â€¦ XLSX library disponÃ­vel')
      console.log('VersÃ£o XLSX:', XLSX.version || 'N/A')
    } catch (error) {
      console.log('âÅ’ XLSX library nÃ£o encontrada:', error.message)
    }
    
    // 7. Verificar permissÃµes de arquivo
    console.log('\n7ï¸âÆ’£ Verificando permissÃµes...')
    try {
      const testFile = 'test-permission.tmp'
      fs.writeFileSync(testFile, 'test')
      fs.unlinkSync(testFile)
      console.log('âÅ“â€¦ PermissÃµes de escrita OK')
    } catch (error) {
      console.log('âÅ’ Problema com permissÃµes:', error.message)
    }
    
    console.log('\nðÅ¸Å½¯ DIAGNÃâ€œSTICO COMPLETO!')
    
  } catch (error) {
    console.error('âÅ’ Erro durante o teste:', error.message)
    console.error('Stack:', error.stack)
  }
}

// Executar teste
testExcelImport()
  .then(() => {
    console.log('\nâÅ“â€¦ Teste concluÃ­do')
    process.exit(0)
  })
  .catch(error => {
    console.error('Erro:', error)
    process.exit(1)
  })