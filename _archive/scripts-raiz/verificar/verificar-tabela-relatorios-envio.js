const { Pool } = require('pg')

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'beef_sync',
  user: 'postgres',
  password: 'jcromero85'
})

async function verificarTabela() {
  try {
    console.log('≈∏‚Äùç Verificando estrutura da tabela relatorios_envio...\n')
    
    // Verificar se a tabela existe
    const tabelaExiste = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'relatorios_envio'
      )
    `)
    
    console.log('Tabela existe:', tabelaExiste.rows[0].exists)
    
    if (tabelaExiste.rows[0].exists) {
      // Listar colunas
      const colunas = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'relatorios_envio'
        ORDER BY ordinal_position
      `)
      
      console.log('\n≈∏‚Äú‚Äπ Colunas da tabela relatorios_envio:')
      colunas.rows.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`)
      })
      
      // Verificar se existe coluna referencias
      const temReferencias = colunas.rows.some(col => col.column_name === 'referencias')
      console.log('\n‚ù‚Äú Tem coluna "referencias":', temReferencias)
      
      // Contar registros
      const count = await pool.query('SELECT COUNT(*) FROM relatorios_envio')
      console.log('\n≈∏‚Äú≈† Total de registros:', count.rows[0].count)
    }
    
  } catch (error) {
    console.error('‚ù≈í Erro:', error.message)
  } finally {
    await pool.end()
  }
}

verificarTabela()
