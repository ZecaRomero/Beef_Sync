require('dotenv').config()
const { Pool } = require('pg')

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'estoque_semen',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'jcromero85',
}

async function testarNotificacoes() {
  const pool = new Pool(dbConfig)
  
  try {
    console.log('🔍 Verificando dados para teste...\n')
    
    // Verificar abastecimentos
    const abastecimentos = await pool.query(`
      SELECT 
        id,
        data_abastecimento,
        proximo_abastecimento,
        notificacao_enviada_2dias,
        (proximo_abastecimento - CURRENT_DATE) as dias_restantes
      FROM abastecimento_nitrogenio 
      WHERE proximo_abastecimento IS NOT NULL 
      ORDER BY proximo_abastecimento ASC 
      LIMIT 5
    `)
    
    console.log('📊 Abastecimentos encontrados:')
    if (abastecimentos.rows.length === 0) {
      console.log('  ⚠️ Nenhum abastecimento com próximo abastecimento definido')
    } else {
      abastecimentos.rows.forEach(a => {
        console.log(`  - ID: ${a.id}`)
        console.log(`    Próximo abastecimento: ${a.proximo_abastecimento}`)
        console.log(`    Dias restantes: ${a.dias_restantes}`)
        console.log(`    Notificação enviada (2 dias): ${a.notificacao_enviada_2dias ? '✅ Sim' : '❌ Não'}`)
        console.log('')
      })
    }
    
    // Verificar contatos
    const contatos = await pool.query(`
      SELECT id, nome, whatsapp 
      FROM nitrogenio_whatsapp_contatos 
      WHERE ativo = true
    `)
    
    console.log(`📱 Contatos WhatsApp cadastrados: ${contatos.rows.length}`)
    if (contatos.rows.length === 0) {
      console.log('  ⚠️ Nenhum contato cadastrado!')
    } else {
      contatos.rows.forEach(c => {
        console.log(`  - ${c.nome}: ${c.whatsapp}`)
      })
    }
    
    console.log('\n🚀 Testando envio de notificações...\n')
    
    // Buscar abastecimentos que precisam de notificação (2 dias antes)
    const abastecimentosParaNotificar = await pool.query(`
      SELECT 
        id,
        data_abastecimento,
        quantidade_litros,
        motorista,
        proximo_abastecimento,
        notificacao_enviada_2dias
      FROM abastecimento_nitrogenio 
      WHERE 
        proximo_abastecimento IS NOT NULL
        AND notificacao_enviada_2dias = false
        AND proximo_abastecimento - CURRENT_DATE = 2
      ORDER BY proximo_abastecimento ASC
    `)
    
    if (abastecimentosParaNotificar.rows.length === 0) {
      console.log('ℹ️ Nenhum abastecimento precisa de notificação no momento (faltam exatamente 2 dias)')
      console.log('   Para testar, você pode:')
      console.log('   1. Criar um abastecimento com próximo abastecimento em 2 dias')
      console.log('   2. Ou modificar um existente para ter próximo abastecimento em 2 dias')
    } else {
      console.log(`✅ Encontrados ${abastecimentosParaNotificar.rows.length} abastecimento(s) para notificar`)
      
      if (contatos.rows.length === 0) {
        console.log('⚠️ Mas não há contatos cadastrados para receber as notificações!')
      } else {
        console.log(`📤 Serão enviadas notificações para ${contatos.rows.length} contato(s)`)
        console.log('\n💬 Chamando API de envio...\n')
        
        // Chamar a API
        const fetch = require('node-fetch')
        const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3020'
        
        try {
          const response = await fetch(`${API_BASE_URL}/api/nitrogenio/enviar-notificacoes`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          })
          
          const result = await response.json()
          
          if (result.success) {
            console.log('✅ SUCESSO!')
            console.log(`   ${result.message}`)
            if (result.data) {
              console.log(`   • Abastecimentos processados: ${result.data.abastecimentos_processados}`)
              console.log(`   • Contatos notificados: ${result.data.contatos_notificados}`)
              console.log(`   • Total de mensagens enviadas: ${result.data.resultados.total_enviados}`)
              
              if (result.data.resultados.erros.length > 0) {
                console.log(`\n   ⚠️ Erros encontrados: ${result.data.resultados.erros.length}`)
                result.data.resultados.erros.forEach(erro => {
                  console.log(`      - ${erro.contato_nome}: ${erro.erro}`)
                })
              }
            }
          } else {
            console.log('❌ Erro:', result.message)
          }
        } catch (apiError) {
          console.error('❌ Erro ao chamar API:', apiError.message)
          console.log('\n💡 Dica: Certifique-se de que o servidor está rodando na porta 3020')
        }
      }
    }
    
    await pool.end()
  } catch (error) {
    console.error('❌ Erro:', error.message)
    await pool.end()
    process.exit(1)
  }
}

testarNotificacoes()

