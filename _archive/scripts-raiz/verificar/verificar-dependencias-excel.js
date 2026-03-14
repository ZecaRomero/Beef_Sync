console.log('🔍 Verificando dependências do Excel...\n')

try {
  // 1. Verificar ExcelJS
  console.log('📊 Testando ExcelJS...')
  const ExcelJS = require('exceljs')
  console.log('✅ ExcelJS carregado:', ExcelJS.version || 'versão não disponível')

  // 2. Criar workbook simples
  console.log('📝 Criando workbook de teste...')
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Teste'
  workbook.created = new Date()
  
  const worksheet = workbook.addWorksheet('Teste')
  worksheet.addRow(['Coluna 1', 'Coluna 2'])
  worksheet.addRow(['Valor 1', 'Valor 2'])
  
  console.log('✅ Workbook criado com sucesso')

  // 3. Testar geração de buffer
  console.log('💾 Testando geração de buffer...')
  workbook.xlsx.writeBuffer().then(buffer => {
    console.log(`✅ Buffer gerado: ${buffer.length} bytes`)
    
    // 4. Verificar se é um arquivo Excel válido
    if (buffer.length > 0 && buffer[0] === 0x50 && buffer[1] === 0x4B) {
      console.log('✅ Assinatura Excel válida (ZIP)')
    } else {
      console.log('❌ Assinatura inválida')
      console.log('🔍 Primeiros bytes:', Array.from(buffer.slice(0, 10)).map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' '))
    }

    // 5. Salvar arquivo de teste
    const fs = require('fs')
    fs.writeFileSync('teste-dependencias.xlsx', buffer)
    console.log('💾 Arquivo salvo: teste-dependencias.xlsx')

    // 6. Tentar ler o arquivo
    console.log('📖 Testando leitura do arquivo...')
    const workbook2 = new ExcelJS.Workbook()
    return workbook2.xlsx.readFile('teste-dependencias.xlsx')
  }).then(workbook2 => {
    console.log('✅ Arquivo lido com sucesso')
    console.log(`📋 Planilhas: ${workbook2.worksheets.map(ws => ws.name).join(', ')}`)
    
    console.log('\n🎉 TODAS AS DEPENDÊNCIAS FUNCIONANDO CORRETAMENTE!')
    
  }).catch(error => {
    console.error('❌ Erro ao testar ExcelJS:', error.message)
    console.error('Stack:', error.stack)
  })

} catch (error) {
  console.error('❌ Erro ao carregar dependências:', error.message)
  console.error('Stack:', error.stack)
}

// 7. Verificar outras dependências relacionadas
console.log('\n📦 Verificando outras dependências...')

try {
  const jsPDF = require('jspdf')
  console.log('✅ jsPDF carregado')
} catch (error) {
  console.log('❌ jsPDF não encontrado:', error.message)
}

try {
  const fs = require('fs')
  console.log('✅ fs (Node.js) disponível')
} catch (error) {
  console.log('❌ fs não disponível:', error.message)
}

try {
  const path = require('path')
  console.log('✅ path (Node.js) disponível')
} catch (error) {
  console.log('❌ path não disponível:', error.message)
}

console.log('\n📋 Informações do sistema:')
console.log(`Node.js: ${process.version}`)
console.log(`Plataforma: ${process.platform}`)
console.log(`Arquitetura: ${process.arch}`)
console.log(`Diretório: ${process.cwd()}`)

console.log('\n✅ Verificação de dependências concluída')