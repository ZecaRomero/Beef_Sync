/**
 * Script para testar o Boletim Defesa
 */

const { Client } = require('pg')

async function testarBoletimDefesa() {
  const client = new Client({
    connectionString: 'postgres://postgres:jcromero85@localhost:5432/beef_sync'
  })

  try {
    await client.connect()
    console.log('‚≈ì‚Ä¶ Conectado ao banco de dados\n')

    // Verificar se a tabela existe
    console.log('≈∏‚Äú‚Äπ Verificando tabela...\n')
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'boletim_defesa_fazendas'
      )
    `)

    if (!tableCheck.rows[0].exists) {
      console.log('‚ù≈í Tabela boletim_defesa_fazendas n√£o existe!')
      return
    }

    console.log('‚≈ì‚Ä¶ Tabela boletim_defesa_fazendas existe!\n')

    // Buscar fazendas
    console.log('≈∏‚Äú≈† Fazendas cadastradas:\n')
    const fazendas = await client.query(`
      SELECT id, nome, cnpj, quantidades 
      FROM boletim_defesa_fazendas 
      ORDER BY nome
    `)

    if (fazendas.rows.length === 0) {
      console.log('‚≈°†Ô∏è Nenhuma fazenda cadastrada\n')
    } else {
      fazendas.rows.forEach(f => {
        const q = f.quantidades
        let totalM = 0
        let totalF = 0

        Object.keys(q).forEach(faixa => {
          totalM += q[faixa].M || 0
          totalF += q[faixa].F || 0
        })

        console.log(`≈∏‚Äúç ${f.nome}`)
        console.log(`   CNPJ: ${f.cnpj}`)
        console.log(`   Total: ${totalM + totalF} animais (‚‚Ñ¢‚Äö ${totalM} | ‚‚Ñ¢‚Ç¨ ${totalF})`)
        console.log(`   Faixas:`)
        console.log(`     0-3:     ‚‚Ñ¢‚Äö ${q['0a3']?.M || 0} | ‚‚Ñ¢‚Ç¨ ${q['0a3']?.F || 0}`)
        console.log(`     3-8:     ‚‚Ñ¢‚Äö ${q['3a8']?.M || 0} | ‚‚Ñ¢‚Ç¨ ${q['3a8']?.F || 0}`)
        console.log(`     8-12:    ‚‚Ñ¢‚Äö ${q['8a12']?.M || 0} | ‚‚Ñ¢‚Ç¨ ${q['8a12']?.F || 0}`)
        console.log(`     12-24:   ‚‚Ñ¢‚Äö ${q['12a24']?.M || 0} | ‚‚Ñ¢‚Ç¨ ${q['12a24']?.F || 0}`)
        console.log(`     25-36:   ‚‚Ñ¢‚Äö ${q['25a36']?.M || 0} | ‚‚Ñ¢‚Ç¨ ${q['25a36']?.F || 0}`)
        console.log(`     >36:     ‚‚Ñ¢‚Äö ${q['acima36']?.M || 0} | ‚‚Ñ¢‚Ç¨ ${q['acima36']?.F || 0}`)
        console.log('')
      })
    }

    console.log('=' .repeat(60))
    console.log('‚≈ì‚Ä¶ TESTE CONCLU√çDO COM SUCESSO!')
    console.log('=' .repeat(60))
    console.log('\n≈∏≈íê Acesse o sistema:')
    console.log('   Desktop: http://localhost:3030/boletim-defesa')
    console.log('   Mobile:  http://localhost:3030/boletim-defesa/mobile\n')

  } catch (error) {
    console.error('‚ù≈í Erro no teste:', error)
    throw error
  } finally {
    await client.end()
  }
}

// Executar
testarBoletimDefesa()
  .then(() => {
    console.log('‚≈ì‚Ä¶ Script finalizado com sucesso!')
    process.exit(0)
  })
  .catch(error => {
    console.error('‚ù≈í Erro ao executar script:', error)
    process.exit(1)
  })
