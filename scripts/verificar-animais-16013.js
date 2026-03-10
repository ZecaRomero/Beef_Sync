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
    console.log('🔍 Buscando variações de CJCJ 16013...\n')
    
    // Buscar com diferentes variações
    const result = await client.query(`
      SELECT id, serie, rg, nome, situacao, valor_venda
      FROM animais
      WHERE (serie ILIKE '%CJCJ%' OR serie ILIKE '%CJ%')
        AND (rg::text LIKE '%16013%' OR rg::text LIKE '%16-013%')
      ORDER BY id
    `)

    if (result.rows.length === 0) {
      console.log('❌ Nenhum animal encontrado com RG 16013')
      
      // Buscar pelo nome
      console.log('\n🔍 Buscando por nome MANERA...\n')
      const nomeResult = await client.query(`
        SELECT id, serie, rg, nome, situacao, valor_venda
        FROM animais
        WHERE nome ILIKE '%MANERA%'
        ORDER BY id
      `)
      
      if (nomeResult.rows.length > 0) {
        console.log('📋 Animais encontrados com MANERA:')
        nomeResult.rows.forEach(a => {
          console.log(`  • ID: ${a.id} | ${a.serie} ${a.rg} | ${a.nome} | ${a.situacao}`)
        })
      }
    } else {
      console.log('📋 Animais encontrados:')
      result.rows.forEach(a => {
        console.log(`  • ID: ${a.id} | ${a.serie} ${a.rg} | ${a.nome} | ${a.situacao} | Valor: R$ ${a.valor_venda || 0}`)
      })
    }

    // Buscar também a CJCJ 17037
    console.log('\n🔍 Verificando CJCJ 17037...\n')
    const result17037 = await client.query(`
      SELECT id, serie, rg, nome, situacao, valor_venda
      FROM animais
      WHERE serie ILIKE '%CJCJ%' AND rg::text LIKE '%17037%'
    `)
    
    if (result17037.rows.length > 0) {
      console.log('📋 CJCJ 17037:')
      result17037.rows.forEach(a => {
        console.log(`  • ID: ${a.id} | ${a.serie} ${a.rg} | ${a.nome} | ${a.situacao} | Valor: R$ ${a.valor_venda || 0}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

verificar()
