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
    console.log('ðÅ¸â€�� Verificando baixas com serie_mae/rg_mae = CJCJ 13604...\n')
    
    // Buscar todas as baixas que tÃªm CJCJ 13604 como mÃ£e
    const baixas = await client.query(`
      SELECT b.id, b.serie, b.rg, b.tipo, b.valor, b.comprador, b.numero_nf, b.data_baixa,
             b.serie_mae, b.rg_mae, b.animal_id
      FROM baixas b
      WHERE UPPER(TRIM(b.serie_mae)) = 'CJCJ' AND TRIM(b.rg_mae::text) = '13604'
      ORDER BY b.tipo, b.serie, b.rg
    `)
    
    console.log(`ðÅ¸â€œÅ  Total de baixas encontradas: ${baixas.rows.length}\n`)
    
    if (baixas.rows.length === 0) {
      console.log('â�Å’ Nenhuma baixa encontrada com serie_mae/rg_mae = CJCJ 13604')
      return
    }
    
    // Agrupar por tipo
    const vendas = baixas.rows.filter(b => b.tipo === 'VENDA')
    const mortes = baixas.rows.filter(b => b.tipo === 'MORTE/BAIXA')
    
    console.log(`ðÅ¸â€™° VENDAS: ${vendas.length}`)
    console.log(`âËœ ï¸�  MORTES/BAIXAS: ${mortes.length}\n`)
    
    console.log('ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��')
    console.log('ðÅ¸â€œâ€¹ LISTA DE VENDAS:')
    console.log('ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��\n')
    
    vendas.forEach((b, i) => {
      console.log(`${i + 1}. ${b.serie} ${b.rg}`)
      console.log(`   Valor: R$ ${parseFloat(b.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
      console.log(`   NF: ${b.numero_nf || 'N/A'}`)
      console.log(`   Comprador: ${b.comprador || 'N/A'}`)
      console.log(`   Data: ${b.data_baixa ? new Date(b.data_baixa).toLocaleDateString('pt-BR') : 'N/A'}`)
      console.log(`   MÃ£e: ${b.serie_mae} ${b.rg_mae}`)
      console.log(`   Animal ID: ${b.animal_id || 'NULL'}`)
      console.log(`   Baixa ID: ${b.id}`)
      console.log('')
    })
    
    if (mortes.length > 0) {
      console.log('\nââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��')
      console.log('âËœ ï¸�  LISTA DE MORTES/BAIXAS:')
      console.log('ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��\n')
      
      mortes.forEach((b, i) => {
        console.log(`${i + 1}. ${b.serie} ${b.rg}`)
        console.log(`   Data: ${b.data_baixa ? new Date(b.data_baixa).toLocaleDateString('pt-BR') : 'N/A'}`)
        console.log(`   MÃ£e: ${b.serie_mae} ${b.rg_mae}`)
        console.log(`   Baixa ID: ${b.id}`)
        console.log('')
      })
    }
    
    // Verificar se esses animais estÃ£o cadastrados
    console.log('\nââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��')
    console.log('ðÅ¸â€�� Verificando se os animais estÃ£o cadastrados...\n')
    
    const seriesRgs = vendas.map(b => `('${b.serie}', '${b.rg}')`).join(', ')
    
    if (seriesRgs) {
      const animaisCadastrados = await client.query(`
        SELECT serie, rg, nome, serie_mae, rg_mae
        FROM animais
        WHERE (serie, rg) IN (${seriesRgs})
      `)
      
      console.log(`âÅ“â€¦ Animais cadastrados: ${animaisCadastrados.rows.length}/${vendas.length}`)
      
      if (animaisCadastrados.rows.length > 0) {
        console.log('\nAnimais encontrados:')
        animaisCadastrados.rows.forEach(a => {
          console.log(`  ââ‚¬¢ ${a.serie} ${a.rg} | ${a.nome || 'sem nome'} | MÃ£e: ${a.serie_mae || ''} ${a.rg_mae || ''}`)
        })
      }
      
      const naoEncontrados = vendas.filter(v => 
        !animaisCadastrados.rows.some(a => a.serie === v.serie && a.rg === v.rg)
      )
      
      if (naoEncontrados.length > 0) {
        console.log(`\nâÅ¡ ï¸�  Animais NÃÆ’O cadastrados: ${naoEncontrados.length}`)
        naoEncontrados.forEach(a => {
          console.log(`  ââ‚¬¢ ${a.serie} ${a.rg}`)
        })
      }
    }
    
  } catch (error) {
    console.error('â�Å’ Erro:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

verificar()
