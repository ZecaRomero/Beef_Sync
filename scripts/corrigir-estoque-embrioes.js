/**
 * Script para corrigir o estoque de embriões
 * 
 * Problema: Embriões transferidos ainda aparecem no relatório porque
 * o campo doses_disponiveis não está sendo atualizado corretamente.
 * 
 * Solução: Recalcular doses_disponiveis = quantidade_doses - doses_usadas
 */

const { Pool } = require('pg')
require('dotenv').config()

async function corrigirEstoqueEmbrioes() {
  // Criar pool de conexão
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'beef_sync',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  })

  try {
    console.log('🔌 Conectando ao banco de dados...')
    await pool.query('SELECT 1')
    console.log('✅ Conectado ao banco de dados')

    // 1. Verificar estado ANTES da correção
    console.log('\n📊 ANTES DA CORREÇÃO:')
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

    console.log(`📦 Total de registros de embriões: ${antes.rows.length}`)
    
    const comDosesDisponiveis = antes.rows.filter(r => r.doses_disponiveis > 0)
    console.log(`✅ Embriões com doses disponíveis: ${comDosesDisponiveis.length}`)
    
    if (comDosesDisponiveis.length > 0) {
      console.log('\n📋 Detalhes dos embriões com doses disponíveis:')
      comDosesDisponiveis.forEach(e => {
        const deveriaTer = e.quantidade_doses - e.doses_usadas
        const diferenca = e.doses_disponiveis - deveriaTer
        console.log(`  - ${e.acasalamento}:`)
        console.log(`    • Disponíveis: ${e.doses_disponiveis}`)
        console.log(`    • Total: ${e.quantidade_doses}, Usadas: ${e.doses_usadas}`)
        console.log(`    • Deveria ter: ${deveriaTer} ${diferenca !== 0 ? '⚠️ INCONSISTENTE' : '✓'}`)
      })
    }

    // 2. APLICAR CORREÇÃO
    console.log('\n\n🔧 APLICANDO CORREÇÃO...')
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

    console.log(`✅ ${resultado.rows.length} registros atualizados`)

    // 3. Verificar estado DEPOIS da correção
    console.log('\n📊 DEPOIS DA CORREÇÃO:')
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
    console.log(`📦 Total de registros: ${stats.total}`)
    console.log(`✅ Com doses disponíveis: ${stats.com_doses}`)
    console.log(`🧬 Total de doses disponíveis: ${stats.total_doses_disponiveis}`)

    // 4. Mostrar registros que ainda têm doses
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
      console.log('\n📋 Embriões que ainda têm doses disponíveis:')
      aindaComDoses.rows.forEach(e => {
        console.log(`  - ${e.acasalamento}: ${e.doses_disponiveis} doses (total: ${e.quantidade_doses}, usadas: ${e.doses_usadas})`)
      })
    } else {
      console.log('\n✅ Nenhum embrião com doses disponíveis (todos foram transferidos)')
    }

    console.log('\n\n✅ CORREÇÃO CONCLUÍDA COM SUCESSO!')
    console.log('📱 Agora o relatório mobile deve mostrar apenas embriões realmente disponíveis')

  } catch (error) {
    console.error('\n❌ Erro:', error.message)
    console.error('Stack:', error.stack)
    throw error
  } finally {
    await pool.end()
    console.log('\n🔌 Conexão encerrada')
  }
}

// Executar
corrigirEstoqueEmbrioes()
  .then(() => {
    console.log('\n✅ Script finalizado')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Erro ao executar script:', error.message)
    process.exit(1)
  })
