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

async function verificar() {
  const client = await pool.connect()
  
  try {
    console.log('ðÅ¸â€�� Buscando baixas duplicadas...\n')
    
    // Buscar baixas que aparecem mais de uma vez (mesmo serie, rg, tipo)
    const duplicadas = await client.query(`
      SELECT serie, rg, tipo, COUNT(*) as total
      FROM baixas
      WHERE serie IS NOT NULL AND rg IS NOT NULL
      GROUP BY serie, rg, tipo
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC, serie, rg
      LIMIT 20
    `)
    
    if (duplicadas.rows.length === 0) {
      console.log('âÅ“â€¦ Nenhuma baixa duplicada encontrada')
      return
    }
    
    console.log(`âÅ¡ ï¸�  Encontradas ${duplicadas.rows.length} baixas duplicadas:\n`)
    
    for (const dup of duplicadas.rows) {
      console.log(`\nââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��`)
      console.log(`ðÅ¸â€œâ€¹ ${dup.serie} ${dup.rg} - ${dup.tipo} (${dup.total}x duplicado)`)
      console.log(`ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��`)
      
      // Buscar detalhes de cada duplicata
      const detalhes = await client.query(`
        SELECT id, serie, rg, tipo, valor, comprador, numero_nf, data_baixa, 
               serie_mae, rg_mae, animal_id, causa
        FROM baixas
        WHERE serie = $1 AND rg = $2 AND tipo = $3
        ORDER BY id
      `, [dup.serie, dup.rg, dup.tipo])
      
      detalhes.rows.forEach((b, i) => {
        console.log(`\n${i + 1}. ID: ${b.id}`)
        console.log(`   Valor: R$ ${b.valor || 0}`)
        console.log(`   NF: ${b.numero_nf || 'N/A'}`)
        console.log(`   Data: ${b.data_baixa ? new Date(b.data_baixa).toLocaleDateString('pt-BR') : 'N/A'}`)
        console.log(`   Comprador: ${b.comprador || 'N/A'}`)
        console.log(`   MÃ£e: ${b.serie_mae || ''} ${b.rg_mae || ''}`)
        console.log(`   Animal ID: ${b.animal_id || 'NULL'}`)
        if (b.causa) console.log(`   Causa: ${b.causa}`)
      })
    }
    
    console.log('\n\nââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��')
    console.log('ðÅ¸â€™¡ RECOMENDAÃâ€¡ÃÆ’O: Limpar duplicatas mantendo apenas 1 registro por animal')
    
  } catch (error) {
    console.error('â�Å’ Erro:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

verificar()
