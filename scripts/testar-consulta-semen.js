const { Pool } = require('pg')
require('dotenv').config()

async function testarConsulta() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'beef_sync',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  })

  try {
    console.log('🔌 Conectando...\n')
    
    // Consulta que a API usa
    const resultado = await pool.query(`
      SELECT id, nome_touro, rg_touro, raca, rack_touro, botijao, caneca,
             quantidade_doses, doses_disponiveis, doses_usadas, status,
             localizacao, observacoes, tipo, created_at
      FROM estoque_semen
      WHERE tipo_operacao = 'entrada'
        AND doses_disponiveis > 0
        AND (tipo = 'semen' 
             OR (tipo IS NULL
                 AND nome_touro NOT ILIKE '%ACASALAMENTO%'
                 AND nome_touro NOT ILIKE '% X %'))
      ORDER BY nome_touro
      LIMIT 300
    `)

    console.log(`📊 Total de registros: ${resultado.rows.length}\n`)
    
    // Filtrar por 14785
    const com14785 = resultado.rows.filter(r => r.nome_touro && r.nome_touro.includes('14785'))
    console.log(`🔍 Registros com "14785": ${com14785.length}\n`)
    
    if (com14785.length > 0) {
      console.log('📋 Detalhes:')
      com14785.forEach(r => {
        console.log(`  ID ${r.id}: ${r.nome_touro}`)
        console.log(`    tipo: ${r.tipo}`)
        console.log(`    doses_disponiveis: ${r.doses_disponiveis}`)
        console.log(`    raca: ${r.raca}`)
        console.log('')
      })
    } else {
      console.log('⚠️  Nenhum registro encontrado com "14785"')
      console.log('\n🔍 Vamos verificar TODOS os registros com 14785 (sem filtros):')
      
      const todos = await pool.query(`
        SELECT id, nome_touro, tipo, tipo_operacao, doses_disponiveis, quantidade_doses
        FROM estoque_semen
        WHERE nome_touro ILIKE '%14785%'
        ORDER BY id
      `)
      
      console.log(`\n📦 Total encontrado: ${todos.rows.length}\n`)
      todos.rows.forEach(r => {
        console.log(`  ID ${r.id}: ${r.nome_touro}`)
        console.log(`    tipo: ${r.tipo}`)
        console.log(`    tipo_operacao: ${r.tipo_operacao}`)
        console.log(`    doses_disponiveis: ${r.doses_disponiveis}`)
        console.log(`    quantidade_doses: ${r.quantidade_doses}`)
        console.log('')
      })
    }

  } catch (error) {
    console.error('❌ Erro:', error.message)
  } finally {
    await pool.end()
  }
}

testarConsulta()
