/**
 * Script para adicionar colunas TOP da ANCP na tabela animais
 * Execute: node scripts/migrate-ancp-top.js
 */

const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function migrate() {
  const client = await pool.connect()
  
  try {
    console.log('🔄 Iniciando migração: Adicionando colunas TOP da ANCP...')
    
    const columns = [
      'ancp_top_d3p',
      'ancp_top_dipp',
      'ancp_top_dpe365',
      'ancp_top_dpn',
      'ancp_top_dstay',
      'ancp_top_mp120',
      'ancp_top_mp210',
      'ancp_top_dp450',
      'ancp_top_daol',
      'ancp_top_dacab',
    ]
    
    for (const col of columns) {
      console.log(`  ➕ Adicionando coluna: ${col}`)
      await client.query(`
        ALTER TABLE animais 
        ADD COLUMN IF NOT EXISTS ${col} DECIMAL(10,2)
      `)
    }
    
    console.log('\n✅ Migração concluída com sucesso!')
    console.log('\n📊 Verificando colunas criadas:')
    
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'animais' 
        AND column_name LIKE 'ancp_top_%'
      ORDER BY column_name
    `)
    
    console.table(result.rows)
    
  } catch (error) {
    console.error('❌ Erro na migração:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

migrate()
  .then(() => {
    console.log('\n✨ Pronto! Agora você pode reimportar os dados da ANCP.')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Falha na migração:', err)
    process.exit(1)
  })
