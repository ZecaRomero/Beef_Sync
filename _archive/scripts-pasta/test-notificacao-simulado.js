require('dotenv').config()
const { Pool } = require('pg')
const { sendWhatsApp } = require('../utils/whatsappService')

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'estoque_semen',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'jcromero85',
}

async function testarEnvioDireto() {
  const pool = new Pool(dbConfig)
  
  try {
    console.log('≈∏ß™ TESTE DIRETO DE ENVIO DE NOTIFICA√‚Ä°√∆íO\n')
    
    // Buscar o √∫ltimo abastecimento
    const abastecimento = await pool.query(`
      SELECT 
        id,
        data_abastecimento,
        quantidade_litros,
        motorista,
        proximo_abastecimento
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
    
    // Buscar contatos
    const contatos = await pool.query(`
      SELECT id, nome, whatsapp 
      FROM nitrogenio_whatsapp_contatos 
      WHERE ativo = true
    `)
    
    if (contatos.rows.length === 0) {
      console.log('‚ù≈í Nenhum contato WhatsApp cadastrado!')
      await pool.end()
      return
    }
    
    console.log('≈∏‚Äú≈† Dados do teste:')
    console.log(`   Abastecimento ID: ${abast.id}`)
    console.log(`   Data √∫ltimo abastecimento: ${abast.data_abastecimento}`)
    console.log(`   Quantidade: ${abast.quantidade_litros}L`)
    console.log(`   Motorista: ${abast.motorista}`)
    console.log(`   Pr√≥ximo abastecimento: ${abast.proximo_abastecimento}`)
    
    // Calcular dias restantes
    const proximo = new Date(abast.proximo_abastecimento)
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    proximo.setHours(0, 0, 0, 0)
    const diasRestantes = Math.ceil((proximo - hoje) / (1000 * 60 * 60 * 24))
    
    console.log(`   Dias restantes: ${diasRestantes}`)
    console.log(`\n≈∏‚Äú± Contatos que receber√£o: ${contatos.rows.length}`)
    contatos.rows.forEach(c => {
      console.log(`   - ${c.nome}: ${c.whatsapp}`)
    })
    
    // Criar mensagem de teste
    const mensagem = `≈∏‚Äù‚Äù *TESTE - LEMBRETE DE ABASTECIMENTO DE NITROG√≈†NIO*

‚≈°†Ô∏è Faltam apenas *${diasRestantes} dias* para o pr√≥ximo abastecimento!

≈∏‚Äú‚Ä¶ *√≈°ltimo abastecimento:*
‚‚Ç¨¢ Data: ${new Date(abast.data_abastecimento).toLocaleDateString('pt-BR')}
‚‚Ç¨¢ Quantidade: ${abast.quantidade_litros}L
‚‚Ç¨¢ Motorista: ${abast.motorista}

≈∏‚Äú‚Ä¶ *Pr√≥ximo abastecimento:*
${new Date(abast.proximo_abastecimento).toLocaleDateString('pt-BR', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}

Por favor, programe o abastecimento para evitar falta de nitrog√™nio.

_Sistema Beef-Sync - TESTE_`
    
    console.log('\n≈∏≈°‚Ç¨ Enviando mensagens...\n')
    
    const resultados = {
      sucessos: [],
      erros: []
    }
    
    for (const contato of contatos.rows) {
      try {
        console.log(`≈∏‚Äú§ Enviando para ${contato.nome} (${contato.whatsapp})...`)
        
        await sendWhatsApp(
          { name: contato.nome, whatsapp: contato.whatsapp },
          mensagem
        )
        
        resultados.sucessos.push({
          contato: contato.nome,
          whatsapp: contato.whatsapp
        })
        
        console.log(`   ‚≈ì‚Ä¶ Enviado com sucesso!`)
      } catch (error) {
        resultados.erros.push({
          contato: contato.nome,
          whatsapp: contato.whatsapp,
          erro: error.message
        })
        
        console.log(`   ‚ù≈í Erro: ${error.message}`)
      }
    }
    
    console.log('\n≈∏‚Äú≈† RESUMO DO TESTE:')
    console.log(`   ‚≈ì‚Ä¶ Sucessos: ${resultados.sucessos.length}`)
    console.log(`   ‚ù≈í Erros: ${resultados.erros.length}`)
    
    if (resultados.sucessos.length > 0) {
      console.log('\n   ‚≈ì‚Ä¶ Mensagens enviadas com sucesso para:')
      resultados.sucessos.forEach(s => {
        console.log(`      - ${s.contato} (${s.whatsapp})`)
      })
    }
    
    if (resultados.erros.length > 0) {
      console.log('\n   ‚ù≈í Erros:')
      resultados.erros.forEach(e => {
        console.log(`      - ${e.contato}: ${e.erro}`)
      })
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

testarEnvioDireto()

