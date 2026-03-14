// Usar fetch nativo do Node.js 18+

async function testAPIPeriod() {
  try {
    console.log('�Ÿ”� Testando API com período válido...')
    
    // Período do mês atual
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    const period = {
      startDate: firstDay.toISOString().split('T')[0],
      endDate: lastDay.toISOString().split('T')[0]
    }
    
    console.log(`�Ÿ“… Período: ${period.startDate} até ${period.endDate}`)
    
    const response = await fetch('http://localhost:3020/api/contabilidade/notas-fiscais', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ period })
    })
    
    if (response.ok) {
      const buffer = await response.buffer()
      console.log('�œ… API respondeu com sucesso!')
      console.log(`�Ÿ“Š Tamanho do arquivo: ${buffer.length} bytes`)
      
      // Salvar arquivo para verificação
      const fs = require('fs')
      fs.writeFileSync('teste-relatorio-nfs.xlsx', buffer)
      console.log('�Ÿ’� Arquivo salvo como: teste-relatorio-nfs.xlsx')
      
    } else {
      const error = await response.text()
      console.error('�Œ Erro na API:', response.status, error)
    }
    
  } catch (error) {
    console.error('�Ÿ’� Erro no teste:', error.message)
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testAPIPeriod()
    .then(() => {
      console.log('�ŸŽ‰ Teste concluído!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('�Ÿ’� Erro no teste:', error)
      process.exit(1)
    })
}

module.exports = testAPIPeriod
