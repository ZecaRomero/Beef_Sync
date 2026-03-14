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
    console.log('≈∏ß™ TESTE FOR√‚Ä°ADO DE NOTIFICA√‚Ä°√∆íO\n')
    
    // Buscar o √∫ltimo abastecimento
    const abastecimento = await pool.query(`
      SELECT id, data_abastecimento, quantidade_litros, motorista, proximo_abastecimento
      FROM abastecimento_nitrogenio 
      ORDER BY id DESC 
      LIMIT 1
    `)
    
    if (abastecimento.rows.length === 0) {
      console.log('‚ù≈í Nenhum abastecimento encontrado!')
      await pool.end()
      return
    }
    
    const abast = abastecimento.rows[0]
    console.log(`≈∏‚Äú≈† Abastecimento encontrado:`)
    console.log(`   ID: ${abast.id}`)
    console.log(`   Data: ${abast.data_abastecimento}`)
    console.log(`   Pr√≥ximo abastecimento atual: ${abast.proximo_abastecimento}`)
    
    // Calcular data para 2 dias a partir de hoje
    const hoje = new Date()
    const doisDias = new Date(hoje)
    doisDias.setDate(doisDias.getDate() + 2)
    const proximoAbastecimentoTeste = doisDias.toISOString().split('T')[0]
    
    console.log(`\n≈∏‚Äùß Modificando pr√≥ximo abastecimento para: ${proximoAbastecimentoTeste} (2 dias a partir de hoje)`)
    
    // Atualizar o abastecimento para ter pr√≥ximo abastecimento em 2 dias e resetar notifica√ß√£o
    await pool.query(`
      UPDATE abastecimento_nitrogenio 
      SET proximo_abastecimento = $1,
          notificacao_enviada_2dias = false
      WHERE id = $2
    `, [proximoAbastecimentoTeste, abast.id])
    
    console.log('‚≈ì‚Ä¶ Abastecimento atualizado!')
    
    // Verificar contatos
    const contatos = await pool.query(`
      SELECT id, nome, whatsapp 
      FROM nitrogenio_whatsapp_contatos 
      WHERE ativo = true
    `)
    
    console.log(`\n≈∏‚Äú± Contatos que receber√£o notifica√ß√£o: ${contatos.rows.length}`)
    contatos.rows.forEach(c => {
      console.log(`   - ${c.nome}: ${c.whatsapp}`)
    })
    
    if (contatos.rows.length === 0) {
      console.log('\n‚≈°†Ô∏è Nenhum contato cadastrado! N√£o ser√° poss√≠vel enviar.')
      await pool.end()
      return
    }
    
    console.log('\n≈∏≈°‚Ç¨ Enviando notifica√ß√µes...\n')
    
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
      
      console.log('≈∏‚Äú® RESULTADO DO ENVIO:\n')
      
      if (result.success) {
        console.log('‚≈ì‚Ä¶ SUCESSO!')
        console.log(`   ${result.message}`)
        if (result.data) {
          console.log(`\n   ≈∏‚Äú≈† Detalhes:`)
          console.log(`   ‚‚Ç¨¢ Abastecimentos processados: ${result.data.abastecimentos_processados}`)
          console.log(`   ‚‚Ç¨¢ Contatos notificados: ${result.data.contatos_notificados}`)
          console.log(`   ‚‚Ç¨¢ Total de mensagens enviadas: ${result.data.resultados.total_enviados}`)
          
          if (result.data.resultados.sucessos.length > 0) {
            console.log(`\n   ‚≈ì‚Ä¶ Mensagens enviadas com sucesso:`)
            result.data.resultados.sucessos.forEach(s => {
              console.log(`      - ${s.contato_nome} (${s.contato_whatsapp})`)
            })
          }
          
          if (result.data.resultados.erros.length > 0) {
            console.log(`\n   ‚≈°†Ô∏è Erros encontrados: ${result.data.resultados.erros.length}`)
            result.data.resultados.erros.forEach(erro => {
              console.log(`      - ${erro.contato_nome}: ${erro.erro}`)
            })
          }
        }
      } else {
        console.log('‚ù≈í Erro:', result.message || result.error)
      }
    } catch (apiError) {
      console.error('‚ù≈í Erro ao chamar API:', apiError.message)
      if (apiError.code === 'ECONNREFUSED') {
        console.log('\n≈∏‚Äô° O servidor n√£o est√° rodando!')
        console.log('   Inicie o servidor com: npm run dev')
      }
    }
    
    await pool.end()
    console.log('\n‚≈ì‚Ä¶ Teste conclu√≠do!')
  } catch (error) {
    console.error('‚ù≈í Erro:', error.message)
    console.error(error.stack)
    await pool.end()
    process.exit(1)
  }
}

testarForcado()

