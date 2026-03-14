require('dotenv').config()
const { Pool } = require('pg')

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'estoque_semen',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'jcromero85',
}

async function checkMedicamentosTable() {
  const pool = new Pool(dbConfig)
  
  try {
    console.log('🔍 Verificando estrutura da tabela medicamentos...\n')
    
    // Verificar se a tabela existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'medicamentos'
      );
    `)
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ Tabela medicamentos não existe!')
      console.log('📝 Criando tabela...\n')
      
      await pool.query(`
        CREATE TABLE medicamentos (
          id SERIAL PRIMARY KEY,
          nome VARCHAR(200) NOT NULL,
          preco DECIMAL(12,2),
          unidade VARCHAR(50),
          descricao TEXT,
          ativo BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      
      console.log('✅ Tabela criada com sucesso!')
    } else {
      console.log('✅ Tabela medicamentos existe!\n')
      
      // Mostrar estrutura atual
      const columns = await pool.query(`
        SELECT 
          column_name, 
          data_type, 
          character_maximum_length,
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_name = 'medicamentos' 
        ORDER BY ordinal_position
      `)
      
      console.log('📊 Estrutura atual da tabela:')
      columns.rows.forEach(col => {
        const length = col.character_maximum_length ? `(${col.character_maximum_length})` : ''
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : ''
        console.log(`  - ${col.column_name}: ${col.data_type}${length} ${nullable}${defaultVal}`)
      })
      
      // Verificar quais colunas faltam
      const requiredColumns = [
        'principio_ativo',
        'categoria',
        'fabricante',
        'lote',
        'data_vencimento',
        'quantidade_estoque',
        'quantidade_minima',
        'prescricao_veterinaria',
        'carencia_leite',
        'carencia_carne',
        'indicacoes',
        'dosagem',
        'via_aplicacao',
        'observacoes'
      ]
      
      const existingColumns = columns.rows.map(r => r.column_name)
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col))
      
      if (missingColumns.length > 0) {
        console.log('\n⚠️  Colunas faltando:')
        missingColumns.forEach(col => console.log(`  - ${col}`))
      } else {
        console.log('\n✅ Todas as colunas necessárias existem!')
      }
    }
    
    // Contar registros
    const count = await pool.query('SELECT COUNT(*) FROM medicamentos')
    console.log(`\n📦 Total de registros: ${count.rows[0].count}`)
    
    await pool.end()
  } catch (error) {
    console.error('❌ Erro:', error.message)
    await pool.end()
    process.exit(1)
  }
}

checkMedicamentosTable()

