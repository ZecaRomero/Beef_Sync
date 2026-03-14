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
    console.log('ðÅ¸â€�� Verificando baixas relacionadas Ã  CJCJ 16013...\n')
    
    // 1. Baixas onde serie=CJCJ e rg=16013 (baixa prÃ³pria)
    console.log('1ï¸�âÆ’£ Baixas prÃ³prias da CJCJ 16013:')
    const baixasProprias = await client.query(`
      SELECT id, tipo, serie, rg, valor, comprador, numero_nf, data_baixa, animal_id
      FROM baixas
      WHERE UPPER(TRIM(serie)) = 'CJCJ' AND TRIM(rg::text) = '16013'
      ORDER BY data_baixa DESC
    `)
    
    if (baixasProprias.rows.length > 0) {
      baixasProprias.rows.forEach(b => {
        console.log(`  ââ‚¬¢ ID: ${b.id} | ${b.tipo} | ${b.serie} ${b.rg}`)
        console.log(`    Valor: R$ ${b.valor} | NF: ${b.numero_nf}`)
        console.log(`    Comprador: ${b.comprador}`)
        console.log(`    Animal ID: ${b.animal_id}`)
        console.log(`    Data: ${b.data_baixa}`)
      })
    } else {
      console.log('  âÅ“â€¦ Nenhuma baixa prÃ³pria encontrada')
    }

    // 2. Baixas onde serie_mae=CJCJ e rg_mae=16013 (filhos vendidos)
    console.log('\n2ï¸�âÆ’£ Baixas de filhos da CJCJ 16013 (serie_mae/rg_mae):')
    const baixasFilhos = await client.query(`
      SELECT b.id, b.tipo, b.serie, b.rg, b.serie_mae, b.rg_mae, b.valor, b.comprador, b.numero_nf, b.data_baixa, b.animal_id,
             a.nome as animal_nome
      FROM baixas b
      LEFT JOIN animais a ON b.animal_id = a.id
      WHERE UPPER(TRIM(b.serie_mae)) = 'CJCJ' AND TRIM(b.rg_mae::text) = '16013'
      ORDER BY b.data_baixa DESC
    `)
    
    if (baixasFilhos.rows.length > 0) {
      baixasFilhos.rows.forEach(b => {
        console.log(`  ââ‚¬¢ ID: ${b.id} | ${b.tipo} | ${b.serie} ${b.rg} (${b.animal_nome || 'sem nome'})`)
        console.log(`    MÃ£e: ${b.serie_mae} ${b.rg_mae}`)
        console.log(`    Valor: R$ ${b.valor} | NF: ${b.numero_nf}`)
        console.log(`    Comprador: ${b.comprador}`)
        console.log(`    Animal ID: ${b.animal_id}`)
      })
    } else {
      console.log('  âÅ¡ ï¸�  Nenhuma baixa de filhos encontrada')
    }

    // 3. Verificar filhos cadastrados da CJCJ 16013
    console.log('\n3ï¸�âÆ’£ Filhos cadastrados da CJCJ 16013 (serie_mae/rg_mae):')
    const filhos = await client.query(`
      SELECT id, serie, rg, nome, sexo, situacao, valor_venda, data_nascimento
      FROM animais
      WHERE UPPER(TRIM(serie_mae)) = 'CJCJ' AND TRIM(rg_mae::text) = '16013'
      ORDER BY data_nascimento DESC
    `)
    
    if (filhos.rows.length > 0) {
      console.log(`  ðÅ¸â€œâ€¹ ${filhos.rows.length} filho(s) encontrado(s):`)
      filhos.rows.forEach(f => {
        console.log(`  ââ‚¬¢ ${f.serie} ${f.rg} | ${f.nome || 'sem nome'} | ${f.sexo} | ${f.situacao}`)
        if (f.valor_venda) console.log(`    Valor venda: R$ ${f.valor_venda}`)
      })
    } else {
      console.log('  âÅ¡ ï¸�  Nenhum filho cadastrado')
    }

    // 4. Verificar se CJCJ 16013 existe
    console.log('\n4ï¸�âÆ’£ Dados da CJCJ 16013:')
    const mae = await client.query(`
      SELECT id, serie, rg, nome, sexo, situacao, valor_venda
      FROM animais
      WHERE UPPER(TRIM(serie)) = 'CJCJ' AND TRIM(rg::text) = '16013'
    `)
    
    if (mae.rows.length > 0) {
      const m = mae.rows[0]
      console.log(`  ââ‚¬¢ ID: ${m.id}`)
      console.log(`  ââ‚¬¢ Nome: ${m.nome}`)
      console.log(`  ââ‚¬¢ Sexo: ${m.sexo}`)
      console.log(`  ââ‚¬¢ SituaÃ§Ã£o: ${m.situacao}`)
      if (m.valor_venda) console.log(`  ââ‚¬¢ Valor venda: R$ ${m.valor_venda}`)
    } else {
      console.log('  â�Å’ CJCJ 16013 nÃ£o encontrada')
    }
    
  } catch (error) {
    console.error('â�Å’ Erro:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

verificar()
