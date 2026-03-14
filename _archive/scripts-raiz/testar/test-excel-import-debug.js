// Script para testar e debugar a importação de Excel
const fetch = require('node-fetch')
const fs = require('fs')
const path = require('path')

async function testExcelImport() {
  console.log('🔍 TESTANDO IMPORTAÇÃO DE EXCEL')
  console.log('=' .repeat(50))
  
  try {
    // 1. Verificar se o servidor está rodando
    console.log('1️⃣ Verificando servidor...')
    const healthCheck = await fetch('http://localhost:3020/api/health')
    if (healthCheck.ok) {
      console.log('✅ Servidor está rodando')
    } else {
      console.log('❌ Servidor não está respondendo')
      return
    }
    
    // 2. Testar endpoint de importação FIV
    console.log('\n2️⃣ Testando endpoint de importação FIV...')
    
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
    
    // 3. Verificar se há arquivos Excel de exemplo
    console.log('\n3️⃣ Verificando arquivos Excel de exemplo...')
    const excelFiles = fs.readdirSync('.').filter(file => 
      file.endsWith('.xlsx') || file.endsWith('.xls')
    )
    
    if (excelFiles.length > 0) {
      console.log('📊 Arquivos Excel encontrados:')
      excelFiles.forEach(file => {
        const stats = fs.statSync(file)
        console.log(`  - ${file} (${stats.size} bytes)`)
      })
    } else {
      console.log('⚠️ Nenhum arquivo Excel encontrado no diretório')
    }
    
    // 4. Verificar estrutura do banco de dados
    console.log('\n4️⃣ Verificando estrutura do banco...')
    const dbCheck = await fetch('http://localhost:3020/api/database/check')
    if (dbCheck.ok) {
      const dbData = await dbCheck.json()
      console.log('✅ Banco de dados acessível')
      console.log('Tabelas encontradas:', dbData.tables?.length || 'N/A')
    } else {
      console.log('❌ Erro ao acessar banco de dados')
    }
    
    // 5. Verificar logs do sistema
    console.log('\n5️⃣ Verificando logs...')
    const logFiles = ['error.log', 'app.log', 'debug.log']
    logFiles.forEach(logFile => {
      if (fs.existsSync(logFile)) {
        const stats = fs.statSync(logFile)
        console.log(`📝 ${logFile}: ${stats.size} bytes`)
        
        // Ler últimas linhas do log
        const content = fs.readFileSync(logFile, 'utf8')
        const lines = content.split('\n').slice(-5).filter(line => line.trim())
        if (lines.length > 0) {
          console.log('Últimas linhas:')
          lines.forEach(line => console.log(`  ${line}`))
        }
      }
    })
    
    // 6. Testar dependências
    console.log('\n6️⃣ Verificando dependências...')
    try {
      const XLSX = require('xlsx')
      console.log('✅ XLSX library disponível')
      console.log('Versão XLSX:', XLSX.version || 'N/A')
    } catch (error) {
      console.log('❌ XLSX library não encontrada:', error.message)
    }
    
    // 7. Verificar permissões de arquivo
    console.log('\n7️⃣ Verificando permissões...')
    try {
      const testFile = 'test-permission.tmp'
      fs.writeFileSync(testFile, 'test')
      fs.unlinkSync(testFile)
      console.log('✅ Permissões de escrita OK')
    } catch (error) {
      console.log('❌ Problema com permissões:', error.message)
    }
    
    console.log('\n🎯 DIAGNÓSTICO COMPLETO!')
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message)
    console.error('Stack:', error.stack)
  }
}

// Executar teste
testExcelImport()
  .then(() => {
    console.log('\n✅ Teste concluído')
    process.exit(0)
  })
  .catch(error => {
    console.error('Erro:', error)
    process.exit(1)
  })