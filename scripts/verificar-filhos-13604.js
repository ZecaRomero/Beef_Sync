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
    console.log('🔍 Verificando filhos da CJCJ 13604...\n')
    
    // 1. Buscar a CJCJ 13604
    const mae = await client.query(`
      SELECT id, serie, rg, nome, sexo, situacao
      FROM animais
      WHERE UPPER(TRIM(serie)) = 'CJCJ' AND TRIM(rg::text) = '13604'
    `)
    
    if (mae.rows.length === 0) {
      console.log('❌ CJCJ 13604 não encontrada')
      return
    }
    
    console.log('📋 Mãe encontrada:')
    console.log(`  • ID: ${mae.rows[0].id}`)
    console.log(`  • Nome: ${mae.rows[0].nome}`)
    console.log(`  • Situação: ${mae.rows[0].situacao}\n`)
    
    // 2. Buscar filhos cadastrados
    console.log('👶 Filhos cadastrados (serie_mae/rg_mae):')
    const filhosCadastrados = await client.query(`
      SELECT id, serie, rg, nome, sexo, situacao, data_nascimento
      FROM animais
      WHERE UPPER(TRIM(serie_mae)) = 'CJCJ' AND TRIM(rg_mae::text) = '13604'
      ORDER BY data_nascimento DESC
    `)
    
    console.log(`  Total: ${filhosCadastrados.rows.length} filhos\n`)
    
    if (filhosCadastrados.rows.length > 0) {
      filhosCadastrados.rows.forEach((f, i) => {
        console.log(`  ${i + 1}. ${f.serie} ${f.rg} | ${f.nome || 'sem nome'} | ${f.sexo} | ${f.situacao}`)
        if (f.data_nascimento) {
          console.log(`     Nascimento: ${new Date(f.data_nascimento).toLocaleDateString('pt-BR')}`)
        }
      })
    }
    
    // 3. Buscar baixas (vendas) dos filhos
    console.log('\n\n💰 Baixas (vendas) de filhos da CJCJ 13604:')
    const baixasFilhos = await client.query(`
      SELECT b.id, b.serie, b.rg, b.tipo, b.valor, b.comprador, b.numero_nf, b.data_baixa,
             a.nome as animal_nome, a.id as animal_id
      FROM baixas b
      LEFT JOIN animais a ON b.animal_id = a.id
      WHERE UPPER(TRIM(b.serie_mae)) = 'CJCJ' AND TRIM(b.rg_mae::text) = '13604'
        AND b.tipo = 'VENDA'
      ORDER BY b.data_baixa DESC
    `)
    
    console.log(`  Total: ${baixasFilhos.rows.length} vendas registradas\n`)
    
    if (baixasFilhos.rows.length > 0) {
      baixasFilhos.rows.forEach((b, i) => {
        console.log(`  ${i + 1}. ${b.serie} ${b.rg} | ${b.animal_nome || 'sem nome'}`)
        console.log(`     Valor: R$ ${parseFloat(b.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
        console.log(`     NF: ${b.numero_nf || 'N/A'}`)
        console.log(`     Comprador: ${b.comprador || 'N/A'}`)
        console.log(`     Data: ${b.data_baixa ? new Date(b.data_baixa).toLocaleDateString('pt-BR') : 'N/A'}`)
        console.log(`     Animal ID: ${b.animal_id || 'NULL'}`)
        console.log(`     Baixa ID: ${b.id}`)
        console.log('')
      })
    }
    
    // 4. Verificar se há filhos sem serie_mae/rg_mae preenchidos
    console.log('\n🔍 Verificando filhos que podem estar sem serie_mae/rg_mae...')
    const filhosSemMae = await client.query(`
      SELECT id, serie, rg, nome, mae, serie_mae, rg_mae
      FROM animais
      WHERE (mae ILIKE '%13604%' OR mae ILIKE '%CJCJ 13604%')
        AND (serie_mae IS NULL OR rg_mae IS NULL OR serie_mae != 'CJCJ' OR rg_mae != '13604')
    `)
    
    if (filhosSemMae.rows.length > 0) {
      console.log(`  ⚠️  Encontrados ${filhosSemMae.rows.length} filhos com mae preenchida mas sem serie_mae/rg_mae:`)
      filhosSemMae.rows.forEach(f => {
        console.log(`    • ${f.serie} ${f.rg} | ${f.nome} | mae: "${f.mae}" | serie_mae: ${f.serie_mae || 'NULL'} | rg_mae: ${f.rg_mae || 'NULL'}`)
      })
    } else {
      console.log('  ✅ Todos os filhos têm serie_mae/rg_mae preenchidos corretamente')
    }
    
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

verificar()
