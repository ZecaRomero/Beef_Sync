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

async function buscar() {
  const client = await pool.connect()
  
  try {
    console.log('ðÅ¸â€�� Buscando informaÃ§Ãµes da CJCJ 17037...\n')
    
    const result = await client.query(`
      SELECT 
        id, serie, rg, nome, situacao, valor_venda,
        mae_serie, mae_rg, mae_nome,
        pai_serie, pai_rg, pai_nome,
        data_nascimento
      FROM animais
      WHERE serie ILIKE '%CJCJ%' AND rg::text LIKE '%17037%'
    `)

    if (result.rows.length > 0) {
      const animal = result.rows[0]
      console.log('ðÅ¸â€œâ€¹ CJCJ 17037 (JATAUBA SANT ANNA):')
      console.log(`  ââ‚¬¢ ID: ${animal.id}`)
      console.log(`  ââ‚¬¢ Nome: ${animal.nome}`)
      console.log(`  ââ‚¬¢ SituaÃ§Ã£o: ${animal.situacao}`)
      console.log(`  ââ‚¬¢ Valor Venda: R$ ${animal.valor_venda || 0}`)
      console.log(`  ââ‚¬¢ Nascimento: ${animal.data_nascimento}`)
      console.log(`  ââ‚¬¢ MÃ£e: ${animal.mae_serie || ''} ${animal.mae_rg || ''} ${animal.mae_nome || 'NÃ£o informada'}`)
      console.log(`  ââ‚¬¢ Pai: ${animal.pai_serie || ''} ${animal.pai_rg || ''} ${animal.pai_nome || 'NÃ£o informado'}`)
      
      // Se tem mÃ£e, buscar ela
      if (animal.mae_serie && animal.mae_rg) {
        console.log('\nðÅ¸â€�� Buscando a mÃ£e...\n')
        const maeResult = await client.query(`
          SELECT id, serie, rg, nome, situacao, valor_venda
          FROM animais
          WHERE UPPER(TRIM(serie)) = UPPER(TRIM($1))
            AND TRIM(rg::text) = TRIM($2)
        `, [animal.mae_serie, animal.mae_rg])
        
        if (maeResult.rows.length > 0) {
          const mae = maeResult.rows[0]
          console.log(`ðÅ¸â€œâ€¹ MÃ£e encontrada: ${mae.serie} ${mae.rg}`)
          console.log(`  ââ‚¬¢ ID: ${mae.id}`)
          console.log(`  ââ‚¬¢ Nome: ${mae.nome}`)
          console.log(`  ââ‚¬¢ SituaÃ§Ã£o: ${mae.situacao}`)
          console.log(`  ââ‚¬¢ Valor Venda: R$ ${mae.valor_venda || 0}`)
        } else {
          console.log(`â�Å’ MÃ£e ${animal.mae_serie} ${animal.mae_rg} nÃ£o encontrada no cadastro`)
        }
      }
    }

    // Buscar a baixa
    console.log('\nðÅ¸â€�� Buscando a baixa (venda)...\n')
    const baixaResult = await client.query(`
      SELECT id, animal_id, serie, rg, tipo, valor, comprador, numero_nf, data_baixa
      FROM baixas
      WHERE UPPER(TRIM(serie)) = 'CJCJ' 
        AND TRIM(rg::text) = '17037'
        AND tipo = 'VENDA'
      ORDER BY data_baixa DESC
    `)

    if (baixaResult.rows.length > 0) {
      console.log('ðÅ¸â€œâ€¹ Baixas encontradas:')
      baixaResult.rows.forEach(b => {
        console.log(`  ââ‚¬¢ ID: ${b.id} | ${b.serie} ${b.rg} | ${b.tipo}`)
        console.log(`    Valor: R$ ${b.valor} | NF: ${b.numero_nf}`)
        console.log(`    Comprador: ${b.comprador}`)
        console.log(`    Data: ${b.data_baixa}`)
        console.log(`    Animal ID: ${b.animal_id}`)
      })
    }
    
  } catch (error) {
    console.error('â�Å’ Erro:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

buscar()
