require('dotenv').config()
const fetch = require('node-fetch')

// URL base da API (ajustar conforme necessário)
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3020'

async function enviarNotificacoesNitrogenio() {
  try {
    console.log(`[${new Date().toLocaleString('pt-BR')}] 🔔 Verificando notificações de nitrogênio...`)
    
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
      console.log(`✅ ${result.message}`)
      if (result.data && result.data.resultados) {
        console.log(`   • Abastecimentos processados: ${result.data.abastecimentos_processados}`)
        console.log(`   • Contatos notificados: ${result.data.contatos_notificados}`)
        console.log(`   • Total de mensagens enviadas: ${result.data.resultados.total_enviados}`)
        
        if (result.data.resultados.erros.length > 0) {
          console.log(`   ⚠️ Erros: ${result.data.resultados.erros.length}`)
          result.data.resultados.erros.forEach(erro => {
            console.log(`      - ${erro.contato_nome}: ${erro.erro}`)
          })
        }
      }
    } else {
      console.log(`⚠️ ${result.message || 'Nenhuma notificação enviada'}`)
    }
  } catch (error) {
    console.error(`❌ Erro ao enviar notificações:`, error.message)
  }
}

// Executar imediatamente se chamado diretamente
if (require.main === module) {
  enviarNotificacoesNitrogenio()
    .then(() => {
      console.log('✅ Processo concluído')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Erro fatal:', error)
      process.exit(1)
    })
}

module.exports = { enviarNotificacoesNitrogenio }

