require('dotenv').config()
const { Pool } = require('pg')
const fetch = require('node-fetch')

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'estoque_semen',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'jcromero85',
}

async function testarForcado() {
  const pool = new Pool(dbConfig)
  
  try {
    console.log('🧪 TESTE FORÇADO DE NOTIFICAÇÃO\n')
    
    // Buscar o último abastecimento
    const abastecimento = await pool.query(`
      SELECT id, data_abastecimento, quantidade_litros, motorista, proximo_abastecimento
      FROM abastecimento_nitrogenio 
      ORDER BY id DESC 
      LIMIT 1
    `)
    
    if (abastecimento.rows.length === 0) {
      console.log('❌ Nenhum abastecimento encontrado!')
      await pool.end()
      return
    }
    
    const abast = abastecimento.rows[0]
    console.log(`📊 Abastecimento encontrado:`)
    console.log(`   ID: ${abast.id}`)
    console.log(`   Data: ${abast.data_abastecimento}`)
    console.log(`   Próximo abastecimento atual: ${abast.proximo_abastecimento}`)
    
    // Calcular data para 2 dias a partir de hoje
    const hoje = new Date()
    const doisDias = new Date(hoje)
    doisDias.setDate(doisDias.getDate() + 2)
    const proximoAbastecimentoTeste = doisDias.toISOString().split('T')[0]
    
    console.log(`\n🔧 Modificando próximo abastecimento para: ${proximoAbastecimentoTeste} (2 dias a partir de hoje)`)
    
    // Atualizar o abastecimento para ter próximo abastecimento em 2 dias e resetar notificação
    await pool.query(`
      UPDATE abastecimento_nitrogenio 
      SET proximo_abastecimento = $1,
          notificacao_enviada_2dias = false
      WHERE id = $2
    `, [proximoAbastecimentoTeste, abast.id])
    
    console.log('✅ Abastecimento atualizado!')
    
    // Verificar contatos
    const contatos = await pool.query(`
      SELECT id, nome, whatsapp 
      FROM nitrogenio_whatsapp_contatos 
      WHERE ativo = true
    `)
    
    console.log(`\n📱 Contatos que receberão notificação: ${contatos.rows.length}`)
    contatos.rows.forEach(c => {
      console.log(`   - ${c.nome}: ${c.whatsapp}`)
    })
    
    if (contatos.rows.length === 0) {
      console.log('\n⚠️ Nenhum contato cadastrado! Não será possível enviar.')
      await pool.end()
      return
    }
    
    console.log('\n🚀 Enviando notificações...\n')
    
    // Chamar a API
    const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3020'
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/nitrogenio/enviar-notificacoes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      
      console.log('📨 RESULTADO DO ENVIO:\n')
      
      if (result.success) {
        console.log('✅ SUCESSO!')
        console.log(`   ${result.message}`)
        if (result.data) {
          console.log(`\n   📊 Detalhes:`)
          console.log(`   • Abastecimentos processados: ${result.data.abastecimentos_processados}`)
          console.log(`   • Contatos notificados: ${result.data.contatos_notificados}`)
          console.log(`   • Total de mensagens enviadas: ${result.data.resultados.total_enviados}`)
          
          if (result.data.resultados.sucessos.length > 0) {
            console.log(`\n   ✅ Mensagens enviadas com sucesso:`)
            result.data.resultados.sucessos.forEach(s => {
              console.log(`      - ${s.contato_nome} (${s.contato_whatsapp})`)
            })
          }
          
          if (result.data.resultados.erros.length > 0) {
            console.log(`\n   ⚠️ Erros encontrados: ${result.data.resultados.erros.length}`)
            result.data.resultados.erros.forEach(erro => {
              console.log(`      - ${erro.contato_nome}: ${erro.erro}`)
            })
          }
        }
      } else {
        console.log('❌ Erro:', result.message || result.error)
      }
    } catch (apiError) {
      console.error('❌ Erro ao chamar API:', apiError.message)
      if (apiError.code === 'ECONNREFUSED') {
        console.log('\n💡 O servidor não está rodando!')
        console.log('   Inicie o servidor com: npm run dev')
      }
    }
    
    await pool.end()
    console.log('\n✅ Teste concluído!')
  } catch (error) {
    console.error('❌ Erro:', error.message)
    console.error(error.stack)
    await pool.end()
    process.exit(1)
  }
}

testarForcado()

