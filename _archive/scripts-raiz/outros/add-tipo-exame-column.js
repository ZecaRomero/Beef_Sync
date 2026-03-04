require('dotenv').config()
const { query } = require('./lib/database')

async function addTipoExameColumn() {
  try {
    console.log('📝 Adicionando coluna tipo_exame na tabela dna_envios...\n')
    
    await query(`
      ALTER TABLE dna_envios 
      ADD COLUMN IF NOT EXISTS tipo_exame VARCHAR(255)
    `)
    
    console.log('✅ Coluna tipo_exame adicionada com sucesso!')
    
    // Verificar estrutura atualizada
    const result = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'dna_envios'
      ORDER BY ordinal_position
    `)
    
    console.log('\n📋 Estrutura atualizada da tabela dna_envios:\n')
    result.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`)
    })
    
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    process.exit(0)
  }
}

addTipoExameColumn()
