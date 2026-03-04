const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// Configurar conexão com o banco (usando as mesmas credenciais do sistema)
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

async function runMigration() {
  const client = await pool.connect()
  
  try {
    console.log('🚀 Iniciando migração do sistema de Notas Fiscais...')
    
    // Ler arquivo SQL
    const sqlPath = path.join(__dirname, 'create-nf-tables.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    // Executar SQL
    await client.query(sql)
    
    console.log('✅ Tabelas criadas com sucesso!')
    
    // Migrar dados existentes se houver
    console.log('📦 Verificando dados existentes...')
    
    // Verificar se existe tabela antiga de NFs
    const checkTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'nfs_cadastradas'
      )
    `)
    
    if (checkTable.rows[0].exists) {
      console.log('🔄 Migrando dados da tabela antiga...')
      
      // Migrar dados (adaptar conforme estrutura antiga)
      await client.query(`
        INSERT INTO notas_fiscais (
          numero_nf,
          data,
          fornecedor,
          destino,
          natureza_operacao,
          observacoes,
          tipo,
          tipo_produto,
          valor_total
        )
        SELECT 
          numero_nf,
          COALESCE(data_compra, data_saida, CURRENT_DATE) as data,
          fornecedor,
          destino,
          COALESCE(natureza_operacao, 'Compra'),
          observacoes,
          CASE WHEN tipo_operacao = 'entrada' THEN 'entrada' ELSE 'saida' END,
          'bovino',
          COALESCE(valor_total, 0)
        FROM nfs_cadastradas
        WHERE NOT EXISTS (
          SELECT 1 FROM notas_fiscais nf 
          WHERE nf.numero_nf = nfs_cadastradas.numero_nf
        )
      `)
      
      console.log('✅ Dados migrados com sucesso!')
    }
    
    console.log('✨ Migração concluída com sucesso!')
    console.log('')
    console.log('📋 Resumo:')
    
    const stats = await client.query('SELECT COUNT(*) as total FROM notas_fiscais')
    console.log(`   - Total de notas fiscais: ${stats.rows[0].total}`)
    
    const statsItens = await client.query('SELECT COUNT(*) as total FROM notas_fiscais_itens')
    console.log(`   - Total de itens: ${statsItens.rows[0].total}`)
    
  } catch (error) {
    console.error('❌ Erro na migração:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

// Executar migração
runMigration()
  .then(() => {
    console.log('\n✅ Processo concluído!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro:', error)
    process.exit(1)
  })

