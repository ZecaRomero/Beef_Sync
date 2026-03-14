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
    console.log('🔍 Verificando baixas com serie_mae/rg_mae = CJCJ 13604...\n')
    
    // Buscar todas as baixas que têm CJCJ 13604 como mãe
    const baixas = await client.query(`
      SELECT b.id, b.serie, b.rg, b.tipo, b.valor, b.comprador, b.numero_nf, b.data_baixa,
             b.serie_mae, b.rg_mae, b.animal_id
      FROM baixas b
      WHERE UPPER(TRIM(b.serie_mae)) = 'CJCJ' AND TRIM(b.rg_mae::text) = '13604'
      ORDER BY b.tipo, b.serie, b.rg
    `)
    
    console.log(`📊 Total de baixas encontradas: ${baixas.rows.length}\n`)
    
    if (baixas.rows.length === 0) {
      console.log('❌ Nenhuma baixa encontrada com serie_mae/rg_mae = CJCJ 13604')
      return
    }
    
    // Agrupar por tipo
    const vendas = baixas.rows.filter(b => b.tipo === 'VENDA')
    const mortes = baixas.rows.filter(b => b.tipo === 'MORTE/BAIXA')
    
    console.log(`💰 VENDAS: ${vendas.length}`)
    console.log(`☠️  MORTES/BAIXAS: ${mortes.length}\n`)
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📋 LISTA DE VENDAS:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    vendas.forEach((b, i) => {
      console.log(`${i + 1}. ${b.serie} ${b.rg}`)
      console.log(`   Valor: R$ ${parseFloat(b.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
      console.log(`   NF: ${b.numero_nf || 'N/A'}`)
      console.log(`   Comprador: ${b.comprador || 'N/A'}`)
      console.log(`   Data: ${b.data_baixa ? new Date(b.data_baixa).toLocaleDateString('pt-BR') : 'N/A'}`)
      console.log(`   Mãe: ${b.serie_mae} ${b.rg_mae}`)
      console.log(`   Animal ID: ${b.animal_id || 'NULL'}`)
      console.log(`   Baixa ID: ${b.id}`)
      console.log('')
    })
    
    if (mortes.length > 0) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('☠️  LISTA DE MORTES/BAIXAS:')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
      
      mortes.forEach((b, i) => {
        console.log(`${i + 1}. ${b.serie} ${b.rg}`)
        console.log(`   Data: ${b.data_baixa ? new Date(b.data_baixa).toLocaleDateString('pt-BR') : 'N/A'}`)
        console.log(`   Mãe: ${b.serie_mae} ${b.rg_mae}`)
        console.log(`   Baixa ID: ${b.id}`)
        console.log('')
      })
    }
    
    // Verificar se esses animais estão cadastrados
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔍 Verificando se os animais estão cadastrados...\n')
    
    const seriesRgs = vendas.map(b => `('${b.serie}', '${b.rg}')`).join(', ')
    
    if (seriesRgs) {
      const animaisCadastrados = await client.query(`
        SELECT serie, rg, nome, serie_mae, rg_mae
        FROM animais
        WHERE (serie, rg) IN (${seriesRgs})
      `)
      
      console.log(`✅ Animais cadastrados: ${animaisCadastrados.rows.length}/${vendas.length}`)
      
      if (animaisCadastrados.rows.length > 0) {
        console.log('\nAnimais encontrados:')
        animaisCadastrados.rows.forEach(a => {
          console.log(`  • ${a.serie} ${a.rg} | ${a.nome || 'sem nome'} | Mãe: ${a.serie_mae || ''} ${a.rg_mae || ''}`)
        })
      }
      
      const naoEncontrados = vendas.filter(v => 
        !animaisCadastrados.rows.some(a => a.serie === v.serie && a.rg === v.rg)
      )
      
      if (naoEncontrados.length > 0) {
        console.log(`\n⚠️  Animais NÃO cadastrados: ${naoEncontrados.length}`)
        naoEncontrados.forEach(a => {
          console.log(`  • ${a.serie} ${a.rg}`)
        })
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

verificar()
