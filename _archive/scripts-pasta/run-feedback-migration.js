const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// Configuração do banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/beef_sync'
})

async function runMigration() {
  console.log('🚀 Iniciando migração da tabela de feedbacks...')
  
  try {
    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, '..', 'migrations', 'create-feedbacks-table.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    // Executar a migração
    await pool.query(sql)
    
    console.log('✅ Tabela de feedbacks criada com sucesso!')
    console.log('📋 Estrutura:')
    console.log('   - id (SERIAL PRIMARY KEY)')
    console.log('   - nome (VARCHAR)')
    console.log('   - sugestao (TEXT)')
    console.log('   - audio_path (VARCHAR)')
    console.log('   - transcricao (TEXT)')
    console.log('   - status (VARCHAR)')
    console.log('   - created_at (TIMESTAMP)')
    console.log('   - updated_at (TIMESTAMP)')
    
  } catch (error) {
    console.error('❌ Erro ao executar migração:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

runMigration()
