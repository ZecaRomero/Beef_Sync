/**
 * Script para limpar dados mock/fictícios do localStorage
 * Execute este script no console do navegador ou use a página /limpar-dados-mock
 */

function limparDadosMock() {
  console.log('🧹 Iniciando limpeza de dados mock...')
  
  // Lista de dados mock conhecidos para remover
  const dadosMockParaRemover = [
    'sales', // vendas com Nelore 001, Angus 045, etc.
    'equipamentos',
    'custosNutricionais', 
    'consumoRacao',
    'dietas',
    'protocolosSanitarios',
    'medicamentos',
    'insumos'
  ]

  let dadosRemovidos = 0
  
  dadosMockParaRemover.forEach(chave => {
    const dados = localStorage.getItem(chave)
    if (dados) {
      try {
        const dadosParsed = JSON.parse(dados)
        
        // Verificar se contém dados mock
        if (Array.isArray(dadosParsed)) {
          const contemMock = dadosParsed.some(item => {
            const itemStr = JSON.stringify(item).toLowerCase()
            return (
              itemStr.includes('nelore 001') ||
              itemStr.includes('angus 045') ||
              itemStr.includes('guzerá 123') ||
              itemStr.includes('fazenda xyz') ||
              itemStr.includes('frigorífico abc') ||
              itemStr.includes('comprador def') ||
              itemStr.includes('teste') ||
              itemStr.includes('exemplo') ||
              itemStr.includes('mock') ||
              itemStr.includes('demo')
            )
          })
          
          if (contemMock || dadosParsed.length > 0) {
            localStorage.removeItem(chave)
            console.log(`✅ Removido: ${chave} (${dadosParsed.length} itens)`)
            dadosRemovidos++
          }
        }
      } catch (error) {
        console.error(`❌ Erro ao processar ${chave}:`, error)
      }
    }
  })
  
  console.log(`🎉 Limpeza concluída! ${dadosRemovidos} tipos de dados removidos.`)
  
  if (dadosRemovidos > 0) {
    console.log('🔄 Recarregue a página para ver as mudanças.')
    return true
  } else {
    console.log('ℹ️ Nenhum dado mock foi encontrado.')
    return false
  }
}

// Função específica para limpar apenas vendas
function limparVendas() {
  const vendas = localStorage.getItem('sales')
  if (vendas) {
    localStorage.removeItem('sales')
    console.log('✅ Vendas removidas com sucesso!')
    return true
  } else {
    console.log('ℹ️ Nenhuma venda encontrada.')
    return false
  }
}

// Função para verificar dados sem remover
function verificarDadosMock() {
  console.log('🔍 Verificando dados mock no sistema...')
  
  const chaves = Object.keys(localStorage)
  const dadosEncontrados = []
  
  chaves.forEach(chave => {
    if (!chave.includes('darkMode') && 
        !chave.includes('theme') && 
        !chave.includes('settings')) {
      
      try {
        const dados = localStorage.getItem(chave)
        const dadosParsed = JSON.parse(dados)
        
        if (Array.isArray(dadosParsed) && dadosParsed.length > 0) {
          dadosEncontrados.push({
            chave,
            quantidade: dadosParsed.length,
            amostra: dadosParsed[0]
          })
        }
      } catch (error) {
        // Ignorar erros de parse
      }
    }
  })
  
  if (dadosEncontrados.length > 0) {
    console.log('📊 Dados encontrados:')
    dadosEncontrados.forEach(({ chave, quantidade, amostra }) => {
      console.log(`  • ${chave}: ${quantidade} itens`)
      console.log(`    Amostra:`, amostra)
    })
  } else {
    console.log('✅ Nenhum dado encontrado.')
  }
  
  return dadosEncontrados
}

// Exportar funções para uso no console
if (typeof window !== 'undefined') {
  window.limparDadosMock = limparDadosMock
  window.limparVendas = limparVendas
  window.verificarDadosMock = verificarDadosMock
  
  console.log(`
🧹 Funções de limpeza disponíveis:
  • limparDadosMock() - Remove todos os dados mock
  • limparVendas() - Remove apenas vendas
  • verificarDadosMock() - Verifica dados sem remover

💡 Ou acesse: localhost:3020/limpar-dados-mock
  `)
}

module.exports = {
  limparDadosMock,
  limparVendas,
  verificarDadosMock
}