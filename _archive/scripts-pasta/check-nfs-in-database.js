const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'estoque_semen',
  password: process.env.DB_PASSWORD || 'jcromero85',
  port: process.env.DB_PORT || 5432,
})

async function checkNFsInDatabase() {
  console.log('🔍 Verificando notas fiscais no PostgreSQL...')
  
  try {
    const client = await pool.connect()
    
    try {
      // Verificar todas as notas fiscais
      const result = await client.query(`
        SELECT 
          id, 
          numero_nf, 
          data_compra, 
          valor_total, 
          fornecedor, 
          destino,
          tipo,
          tipo_produto,
          observacoes,
          created_at
        FROM notas_fiscais 
        ORDER BY created_at DESC
      `)
      
      console.log(`📊 Total de notas fiscais encontradas: ${result.rows.length}`)
      
      if (result.rows.length === 0) {
        console.log('❌ Nenhuma nota fiscal encontrada no PostgreSQL')
      } else {
        console.log('\n📋 Detalhes das notas fiscais:')
        result.rows.forEach((nf, index) => {
          console.log(`\n${index + 1}. ID: ${nf.id}`)
          console.log(`   Número NF: ${nf.numero_nf}`)
          console.log(`   Data: ${nf.data_compra}`)
          console.log(`   Tipo: ${nf.tipo}`)
          console.log(`   Fornecedor: ${nf.fornecedor}`)
          console.log(`   Destino: ${nf.destino}`)
          console.log(`   Valor Total: R$ ${nf.valor_total}`)
          console.log(`   Tipo Produto: ${nf.tipo_produto}`)
          console.log(`   Observações: ${nf.observacoes}`)
          console.log(`   Criado em: ${nf.created_at}`)
        })
      }
      
      // Verificar estrutura da tabela
      const structure = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais'
        ORDER BY ordinal_position
      `)
      
      console.log('\n📋 Estrutura da tabela:')
      structure.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
      })
      
    } finally {
      client.release()
    }
    
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await pool.end()
  }
}

checkNFsInDatabase()
