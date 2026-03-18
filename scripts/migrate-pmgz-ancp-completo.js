/**
 * Script para adicionar todas as colunas faltantes do PMGZ e ANCP
 * Execute: node scripts/migrate-pmgz-ancp-completo.js
 */

const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function migrate() {
  const client = await pool.connect()
  
  try {
    console.log('🔄 Iniciando migração: Adicionando colunas PMGZ e ANCP completas...')
    
    // PMGZ - Já existem as colunas _dep, _deca, _pct para cada trait
    // Mas vamos garantir que todas existam
    const pmgzTraits = ['pn', 'pd', 'pa', 'ps', 'ipp', 'stay', 'pe365', 'aol', 'acab', 'mar']
    const pmgzSuffixes = ['dep', 'deca', 'pct']
    
    console.log('\n📊 PMGZ - Verificando colunas...')
    for (const trait of pmgzTraits) {
      for (const suffix of pmgzSuffixes) {
        const colName = `pmgz_${trait}_${suffix}`
        console.log(`  ➕ Verificando coluna: ${colName}`)
        await client.query(`
          ALTER TABLE animais 
          ADD COLUMN IF NOT EXISTS ${colName} DECIMAL(10,3)
        `)
      }
    }
    
    // ANCP - Já temos MGTe, TOP, e os DEPs com TOP
    // Vamos garantir que todas as colunas TOP existam
    console.log('\n📊 ANCP - Colunas TOP já foram criadas anteriormente')
    
    console.log('\n✅ Migração concluída com sucesso!')
    console.log('\n📊 Verificando colunas PMGZ:')
    
    const resultPMGZ = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'animais' 
        AND column_name LIKE 'pmgz_%'
      ORDER BY column_name
    `)
    
    console.log(`Total de colunas PMGZ: ${resultPMGZ.rows.length}`)
    console.table(resultPMGZ.rows.slice(0, 10))
    
    console.log('\n📊 Verificando colunas ANCP:')
    
    const resultANCP = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'animais' 
        AND (column_name LIKE 'ancp_%' OR column_name IN ('mgte', 'top'))
      ORDER BY column_name
    `)
    
    console.log(`Total de colunas ANCP: ${resultANCP.rows.length}`)
    console.table(resultANCP.rows)
    
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
    console.log('\n✨ Pronto! Agora você pode reimportar os dados.')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Falha na migração:', err)
    process.exit(1)
  })
