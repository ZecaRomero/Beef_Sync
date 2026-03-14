require('dotenv').config()
const { query } = require('./lib/database')

async function checkStructure() {
  try {
    const result = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'animais'
      ORDER BY ordinal_position
    `)
    
    console.log('📋 Estrutura da tabela animais:\n')
    result.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`)
    })
    
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    process.exit(0)
  }
}

checkStructure()
