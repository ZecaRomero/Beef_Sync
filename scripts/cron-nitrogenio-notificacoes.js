require('dotenv').config()
const fetch = require('node-fetch')

// URL base da API (ajustar conforme necessÃ¡rio)
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3020'

async function enviarNotificacoesNitrogenio() {
  try {
    console.log(`[${new Date().toLocaleString('pt-BR')}] ðÅ¸â€�â€� Verificando notificaÃ§Ãµes de nitrogÃªnio...`)
    
    const response = await fetch(`${API_BASE_URL}/api/nitrogenio/enviar-notificacoes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const result = await response.json()
    
    if (result.success) {
      console.log(`âÅ“â€¦ ${result.message}`)
      if (result.data && result.data.resultados) {
        console.log(`   ââ‚¬¢ Abastecimentos processados: ${result.data.abastecimentos_processados}`)
        console.log(`   ââ‚¬¢ Contatos notificados: ${result.data.contatos_notificados}`)
        console.log(`   ââ‚¬¢ Total de mensagens enviadas: ${result.data.resultados.total_enviados}`)
        
        if (result.data.resultados.erros.length > 0) {
          console.log(`   âÅ¡ ï¸� Erros: ${result.data.resultados.erros.length}`)
          result.data.resultados.erros.forEach(erro => {
            console.log(`      - ${erro.contato_nome}: ${erro.erro}`)
          })
        }
      }
    } else {
      console.log(`âÅ¡ ï¸� ${result.message || 'Nenhuma notificaÃ§Ã£o enviada'}`)
    }
  } catch (error) {
    console.error(`â�Å’ Erro ao enviar notificaÃ§Ãµes:`, error.message)
  }
}

// Executar imediatamente se chamado diretamente
if (require.main === module) {
  enviarNotificacoesNitrogenio()
    .then(() => {
      console.log('âÅ“â€¦ Processo concluÃ­do')
      process.exit(0)
    })
    .catch(error => {
      console.error('â�Å’ Erro fatal:', error)
      process.exit(1)
    })
}

module.exports = { enviarNotificacoesNitrogenio }

