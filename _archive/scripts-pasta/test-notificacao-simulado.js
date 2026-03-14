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
    console.log('🧪 TESTE DIRETO DE ENVIO DE NOTIFICAÇÃO\n')
    
    // Buscar o último abastecimento
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
      console.log('❌ Nenhum abastecimento encontrado!')
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
      console.log('❌ Nenhum contato WhatsApp cadastrado!')
      await pool.end()
      return
    }
    
    console.log('📊 Dados do teste:')
    console.log(`   Abastecimento ID: ${abast.id}`)
    console.log(`   Data último abastecimento: ${abast.data_abastecimento}`)
    console.log(`   Quantidade: ${abast.quantidade_litros}L`)
    console.log(`   Motorista: ${abast.motorista}`)
    console.log(`   Próximo abastecimento: ${abast.proximo_abastecimento}`)
    
    // Calcular dias restantes
    const proximo = new Date(abast.proximo_abastecimento)
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    proximo.setHours(0, 0, 0, 0)
    const diasRestantes = Math.ceil((proximo - hoje) / (1000 * 60 * 60 * 24))
    
    console.log(`   Dias restantes: ${diasRestantes}`)
    console.log(`\n📱 Contatos que receberão: ${contatos.rows.length}`)
    contatos.rows.forEach(c => {
      console.log(`   - ${c.nome}: ${c.whatsapp}`)
    })
    
    // Criar mensagem de teste
    const mensagem = `🔔 *TESTE - LEMBRETE DE ABASTECIMENTO DE NITROGÊNIO*

⚠️ Faltam apenas *${diasRestantes} dias* para o próximo abastecimento!

📅 *Último abastecimento:*
• Data: ${new Date(abast.data_abastecimento).toLocaleDateString('pt-BR')}
• Quantidade: ${abast.quantidade_litros}L
• Motorista: ${abast.motorista}

📅 *Próximo abastecimento:*
${new Date(abast.proximo_abastecimento).toLocaleDateString('pt-BR', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}

Por favor, programe o abastecimento para evitar falta de nitrogênio.

_Sistema Beef-Sync - TESTE_`
    
    console.log('\n🚀 Enviando mensagens...\n')
    
    const resultados = {
      sucessos: [],
      erros: []
    }
    
    for (const contato of contatos.rows) {
      try {
        console.log(`📤 Enviando para ${contato.nome} (${contato.whatsapp})...`)
        
        await sendWhatsApp(
          { name: contato.nome, whatsapp: contato.whatsapp },
          mensagem
        )
        
        resultados.sucessos.push({
          contato: contato.nome,
          whatsapp: contato.whatsapp
        })
        
        console.log(`   ✅ Enviado com sucesso!`)
      } catch (error) {
        resultados.erros.push({
          contato: contato.nome,
          whatsapp: contato.whatsapp,
          erro: error.message
        })
        
        console.log(`   ❌ Erro: ${error.message}`)
      }
    }
    
    console.log('\n📊 RESUMO DO TESTE:')
    console.log(`   ✅ Sucessos: ${resultados.sucessos.length}`)
    console.log(`   ❌ Erros: ${resultados.erros.length}`)
    
    if (resultados.sucessos.length > 0) {
      console.log('\n   ✅ Mensagens enviadas com sucesso para:')
      resultados.sucessos.forEach(s => {
        console.log(`      - ${s.contato} (${s.whatsapp})`)
      })
    }
    
    if (resultados.erros.length > 0) {
      console.log('\n   ❌ Erros:')
      resultados.erros.forEach(e => {
        console.log(`      - ${e.contato}: ${e.erro}`)
      })
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

testarEnvioDireto()

