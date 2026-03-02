const { query } = require('./lib/database')

async function verificarColunas() {
  try {
    const r = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'animais' 
        AND (column_name LIKE '%abc%' OR column_name LIKE '%deca%' OR column_name LIKE '%pai%' OR column_name LIKE '%avo%')
      ORDER BY column_name
    `)
    
    console.log('Colunas encontradas:')
    r.rows.forEach(row => console.log(`  - ${row.column_name}`))
    
  } catch (error) {
    console.error('Erro:', error.message)
  } finally {
    process.exit()
  }
}

verificarColunas()
