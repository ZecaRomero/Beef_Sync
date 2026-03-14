/**
 * Script para corrigir o estoque de embriÃµes
 * 
 * Problema: EmbriÃµes transferidos ainda aparecem no relatÃ³rio porque
 * o campo doses_disponiveis nÃ£o estÃ¡ sendo atualizado corretamente.
 * 
 * SoluÃ§Ã£o: Recalcular doses_disponiveis = quantidade_doses - doses_usadas
 */

const { Pool } = require('pg')
require('dotenv').config()

async function corrigirEstoqueEmbrioes() {
  // Criar pool de conexÃ£o
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'beef_sync',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  })

  try {
    console.log('ðÅ¸â€�Å’ Conectando ao banco de dados...')
    await pool.query('SELECT 1')
    console.log('âÅ“â€¦ Conectado ao banco de dados')

    // 1. Verificar estado ANTES da correÃ§Ã£o
    console.log('\nðÅ¸â€œÅ  ANTES DA CORREÃâ€¡ÃÆ’O:')
    const antes = await pool.query(`
      SELECT 
        id,
        nome_touro as acasalamento,
        quantidade_doses,
        doses_disponiveis,
        COALESCE(doses_usadas, 0) as doses_usadas
      FROM estoque_semen
      WHERE tipo_operacao = 'entrada'
        AND (tipo = 'embriao'
             OR nome_touro ILIKE '%ACASALAMENTO%'
             OR nome_touro ILIKE '% X %')
      ORDER BY nome_touro
    `)

    console.log(`ðÅ¸â€œ¦ Total de registros de embriÃµes: ${antes.rows.length}`)
    
    const comDosesDisponiveis = antes.rows.filter(r => r.doses_disponiveis > 0)
    console.log(`âÅ“â€¦ EmbriÃµes com doses disponÃ­veis: ${comDosesDisponiveis.length}`)
    
    if (comDosesDisponiveis.length > 0) {
      console.log('\nðÅ¸â€œâ€¹ Detalhes dos embriÃµes com doses disponÃ­veis:')
      comDosesDisponiveis.forEach(e => {
        const deveriaTer = e.quantidade_doses - e.doses_usadas
        const diferenca = e.doses_disponiveis - deveriaTer
        console.log(`  - ${e.acasalamento}:`)
        console.log(`    ââ‚¬¢ DisponÃ­veis: ${e.doses_disponiveis}`)
        console.log(`    ââ‚¬¢ Total: ${e.quantidade_doses}, Usadas: ${e.doses_usadas}`)
        console.log(`    ââ‚¬¢ Deveria ter: ${deveriaTer} ${diferenca !== 0 ? 'âÅ¡ ï¸� INCONSISTENTE' : 'âÅ“â€œ'}`)
      })
    }

    // 2. APLICAR CORREÃâ€¡ÃÆ’O
    console.log('\n\nðÅ¸â€�§ APLICANDO CORREÃâ€¡ÃÆ’O...')
    console.log('Recalculando: doses_disponiveis = quantidade_doses - doses_usadas')
    
    const resultado = await pool.query(`
      UPDATE estoque_semen 
      SET doses_disponiveis = GREATEST(0, quantidade_doses - COALESCE(doses_usadas, 0)),
          updated_at = CURRENT_TIMESTAMP
      WHERE tipo_operacao = 'entrada'
        AND (tipo = 'embriao'
             OR nome_touro ILIKE '%ACASALAMENTO%'
             OR nome_touro ILIKE '% X %')
      RETURNING id, nome_touro, quantidade_doses, doses_disponiveis, COALESCE(doses_usadas, 0) as doses_usadas
    `)

    console.log(`âÅ“â€¦ ${resultado.rows.length} registros atualizados`)

    // 3. Verificar estado DEPOIS da correÃ§Ã£o
    console.log('\nðÅ¸â€œÅ  DEPOIS DA CORREÃâ€¡ÃÆ’O:')
    const depois = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN doses_disponiveis > 0 THEN 1 ELSE 0 END) as com_doses,
        SUM(doses_disponiveis) as total_doses_disponiveis
      FROM estoque_semen
      WHERE tipo_operacao = 'entrada'
        AND (tipo = 'embriao'
             OR nome_touro ILIKE '%ACASALAMENTO%'
             OR nome_touro ILIKE '% X %')
    `)

    const stats = depois.rows[0]
    console.log(`ðÅ¸â€œ¦ Total de registros: ${stats.total}`)
    console.log(`âÅ“â€¦ Com doses disponÃ­veis: ${stats.com_doses}`)
    console.log(`ðÅ¸§¬ Total de doses disponÃ­veis: ${stats.total_doses_disponiveis}`)

    // 4. Mostrar registros que ainda tÃªm doses
    const aindaComDoses = await pool.query(`
      SELECT 
        nome_touro as acasalamento,
        quantidade_doses,
        doses_disponiveis,
        COALESCE(doses_usadas, 0) as doses_usadas
      FROM estoque_semen
      WHERE tipo_operacao = 'entrada'
        AND doses_disponiveis > 0
        AND (tipo = 'embriao'
             OR nome_touro ILIKE '%ACASALAMENTO%'
             OR nome_touro ILIKE '% X %')
      ORDER BY doses_disponiveis DESC, nome_touro
    `)

    if (aindaComDoses.rows.length > 0) {
      console.log('\nðÅ¸â€œâ€¹ EmbriÃµes que ainda tÃªm doses disponÃ­veis:')
      aindaComDoses.rows.forEach(e => {
        console.log(`  - ${e.acasalamento}: ${e.doses_disponiveis} doses (total: ${e.quantidade_doses}, usadas: ${e.doses_usadas})`)
      })
    } else {
      console.log('\nâÅ“â€¦ Nenhum embriÃ£o com doses disponÃ­veis (todos foram transferidos)')
    }

    console.log('\n\nâÅ“â€¦ CORREÃâ€¡ÃÆ’O CONCLUÃ�DA COM SUCESSO!')
    console.log('ðÅ¸â€œ± Agora o relatÃ³rio mobile deve mostrar apenas embriÃµes realmente disponÃ­veis')

  } catch (error) {
    console.error('\nâ�Å’ Erro:', error.message)
    console.error('Stack:', error.stack)
    throw error
  } finally {
    await pool.end()
    console.log('\nðÅ¸â€�Å’ ConexÃ£o encerrada')
  }
}

// Executar
corrigirEstoqueEmbrioes()
  .then(() => {
    console.log('\nâÅ“â€¦ Script finalizado')
    process.exit(0)
  })
  .catch(error => {
    console.error('\nâ�Å’ Erro ao executar script:', error.message)
    process.exit(1)
  })
