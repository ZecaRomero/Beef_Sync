const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'beef_sync',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
})

async function limpar() {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')
    
    console.log('🔍 Identificando baixas duplicadas...\n')
    
    // Buscar todas as baixas duplicadas
    const duplicadas = await client.query(`
      SELECT serie, rg, tipo
      FROM baixas
      WHERE serie IS NOT NULL AND rg IS NOT NULL
      GROUP BY serie, rg, tipo
      HAVING COUNT(*) > 1
    `)
    
    if (duplicadas.rows.length === 0) {
      console.log('✅ Nenhuma baixa duplicada encontrada')
      await client.query('ROLLBACK')
      return
    }
    
    console.log(`⚠️  Encontradas ${duplicadas.rows.length} baixas duplicadas\n`)
    
    let totalRemovidos = 0
    
    for (const dup of duplicadas.rows) {
      // Para cada duplicata, manter apenas o registro com menor ID (original)
      // e deletar os demais
      const result = await client.query(`
        DELETE FROM baixas
        WHERE serie = $1 AND rg = $2 AND tipo = $3
          AND id NOT IN (
            SELECT MIN(id)
            FROM baixas
            WHERE serie = $1 AND rg = $2 AND tipo = $3
          )
        RETURNING id
      `, [dup.serie, dup.rg, dup.tipo])
      
      if (result.rowCount > 0) {
        console.log(`✅ ${dup.serie} ${dup.rg} - ${dup.tipo}: removidos ${result.rowCount} duplicados`)
        totalRemovidos += result.rowCount
      }
    }
    
    await client.query('COMMIT')
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`✅ LIMPEZA CONCLUÍDA!`)
    console.log(`📊 Total de registros duplicados removidos: ${totalRemovidos}`)
    console.log(`📋 Baixas únicas mantidas: ${duplicadas.rows.length}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Erro ao limpar duplicatas:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

limpar()
  .then(() => {
    console.log('\n✨ Script finalizado')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n💥 Erro fatal:', error)
    process.exit(1)
  })
