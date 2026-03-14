const { Pool } = require('pg')

// Configurar conexão com o banco
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'estoque_semen',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'jcromero85',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

async function checkTableStructure() {
  const client = await pool.connect()
  
  try {
    console.log('�Ÿ”� Verificando estrutura da tabela notas_fiscais...')
    
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'notas_fiscais'
      ORDER BY ordinal_position
    `)
    
    console.log('�Ÿ“‹ Colunas da tabela notas_fiscais:')
    columns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`)
    })
    
    // Verificar se precisa adicionar coluna 'data'
    const hasDataColumn = columns.rows.some(col => col.column_name === 'data')
    
    if (!hasDataColumn) {
      console.log('\n�Ÿ“… Adicionando coluna "data"...')
      await client.query(`
        ALTER TABLE notas_fiscais 
        ADD COLUMN data DATE
      `)
      console.log('�œ… Coluna "data" adicionada!')
    } else {
      console.log('�œ… Coluna "data" já existe!')
    }
    
    // Verificar outras colunas necessárias
    const requiredColumns = ['numero_nf', 'fornecedor', 'destino', 'natureza_operacao', 'tipo', 'tipo_produto', 'valor_total']
    
    for (const col of requiredColumns) {
      const exists = columns.rows.some(c => c.column_name === col)
      if (!exists) {
        console.log(`�Ÿ“� Adicionando coluna "${col}"...`)
        let dataType = 'VARCHAR(100)'
        if (col === 'valor_total') dataType = 'DECIMAL(12,2)'
        if (col === 'tipo') dataType = 'VARCHAR(20)'
        if (col === 'tipo_produto') dataType = 'VARCHAR(20)'
        if (col === 'numero_nf') dataType = 'VARCHAR(50)'
        if (col === 'fornecedor' || col === 'destino') dataType = 'VARCHAR(200)'
        
        await client.query(`ALTER TABLE notas_fiscais ADD COLUMN ${col} ${dataType}`)
        console.log(`�œ… Coluna "${col}" adicionada!`)
      }
    }
    
    console.log('\n�œ… Estrutura da tabela verificada e corrigida!')
    
  } catch (error) {
    console.error('�Œ Erro:', error.message)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

// Executar verificação
checkTableStructure()
  .then(() => {
    console.log('\n�ŸŽ‰ Verificação concluída!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n�Ÿ’� Erro:', error.message)
    process.exit(1)
  })

