/**
 * Script para limpar dados mock/fict√≠cios do localStorage
 * Execute este script no console do navegador ou use a p√°gina /limpar-dados-mock
 */

function limparDadosMock() {
  console.log('≈∏ßπ Iniciando limpeza de dados mock...')
  
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
        
        // Verificar se cont√©m dados mock
        if (Array.isArray(dadosParsed)) {
          const contemMock = dadosParsed.some(item => {
            const itemStr = JSON.stringify(item).toLowerCase()
            return (
              itemStr.includes('nelore 001') ||
              itemStr.includes('angus 045') ||
              itemStr.includes('guzer√° 123') ||
              itemStr.includes('fazenda xyz') ||
              itemStr.includes('frigor√≠fico abc') ||
              itemStr.includes('comprador def') ||
              itemStr.includes('teste') ||
              itemStr.includes('exemplo') ||
              itemStr.includes('mock') ||
              itemStr.includes('demo')
            )
          })
          
          if (contemMock || dadosParsed.length > 0) {
            localStorage.removeItem(chave)
            console.log(`‚≈ì‚Ä¶ Removido: ${chave} (${dadosParsed.length} itens)`)
            dadosRemovidos++
          }
        }
      } catch (error) {
        console.error(`‚ù≈í Erro ao processar ${chave}:`, error)
      }
    }
  })
  
  console.log(`≈∏≈Ω‚Ä∞ Limpeza conclu√≠da! ${dadosRemovidos} tipos de dados removidos.`)
  
  if (dadosRemovidos > 0) {
    console.log('≈∏‚Äù‚Äû Recarregue a p√°gina para ver as mudan√ßas.')
    return true
  } else {
    console.log('‚‚ÄûπÔ∏è Nenhum dado mock foi encontrado.')
    return false
  }
}

// Fun√ß√£o espec√≠fica para limpar apenas vendas
function limparVendas() {
  const vendas = localStorage.getItem('sales')
  if (vendas) {
    localStorage.removeItem('sales')
    console.log('‚≈ì‚Ä¶ Vendas removidas com sucesso!')
    return true
  } else {
    console.log('‚‚ÄûπÔ∏è Nenhuma venda encontrada.')
    return false
  }
}

// Fun√ß√£o para verificar dados sem remover
function verificarDadosMock() {
  console.log('≈∏‚Äùç Verificando dados mock no sistema...')
  
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
    console.log('≈∏‚Äú≈† Dados encontrados:')
    dadosEncontrados.forEach(({ chave, quantidade, amostra }) => {
      console.log(`  ‚‚Ç¨¢ ${chave}: ${quantidade} itens`)
      console.log(`    Amostra:`, amostra)
    })
  } else {
    console.log('‚≈ì‚Ä¶ Nenhum dado encontrado.')
  }
  
  return dadosEncontrados
}

// Exportar fun√ß√µes para uso no console
if (typeof window !== 'undefined') {
  window.limparDadosMock = limparDadosMock
  window.limparVendas = limparVendas
  window.verificarDadosMock = verificarDadosMock
  
  console.log(`
≈∏ßπ Fun√ß√µes de limpeza dispon√≠veis:
  ‚‚Ç¨¢ limparDadosMock() - Remove todos os dados mock
  ‚‚Ç¨¢ limparVendas() - Remove apenas vendas
  ‚‚Ç¨¢ verificarDadosMock() - Verifica dados sem remover

≈∏‚Äô° Ou acesse: localhost:3020/limpar-dados-mock
  `)
}

module.exports = {
  limparDadosMock,
  limparVendas,
  verificarDadosMock
}