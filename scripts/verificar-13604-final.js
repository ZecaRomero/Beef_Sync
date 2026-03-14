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
    console.log('🔍 Verificando CJCJ 13604...\n')
    
    // Verificar se a mãe existe
    const maeResult = await client.query(`
      SELECT * FROM animais WHERE serie = 'CJCJ' AND rg = '13604'
    `)
    
    if (maeResult.rows.length === 0) {
      console.log('❌ CJCJ 13604 não encontrada na tabela animais')
      return
    }
    
    console.log(`✅ CJCJ 13604 encontrada (ID: ${maeResult.rows[0].id})`)
    console.log(`   Nome: ${maeResult.rows[0].nome}`)
    console.log(`   Situação: ${maeResult.rows[0].situacao}\n`)
    
    // Buscar baixas da mãe
    const baixasResult = await client.query(`
      SELECT * FROM baixas 
      WHERE serie_mae = 'CJCJ' AND rg_mae = '13604'
      ORDER BY data_baixa DESC
    `)
    
    console.log(`📊 Total de baixas (filhos): ${baixasResult.rows.length}`)
    
    const vendas = baixasResult.rows.filter(b => b.tipo === 'VENDA')
    const mortes = baixasResult.rows.filter(b => b.tipo === 'MORTE/BAIXA')
    
    console.log(`   - Vendas: ${vendas.length}`)
    console.log(`   - Mortes/Baixas: ${mortes.length}\n`)
    
    // Verificar quantos filhos têm animal_id
    const comAnimalId = baixasResult.rows.filter(b => b.animal_id !== null)
    const semAnimalId = baixasResult.rows.filter(b => b.animal_id === null)
    
    console.log(`📋 Status dos animal_id:`)
    console.log(`   - Com animal_id: ${comAnimalId.length}`)
    console.log(`   - Sem animal_id: ${semAnimalId.length}\n`)
    
    if (semAnimalId.length > 0) {
      console.log(`⚠️ Filhos sem animal_id:`)
      for (const baixa of semAnimalId.slice(0, 5)) {
        console.log(`   - ${baixa.serie} ${baixa.rg} (${baixa.tipo})`)
      }
      if (semAnimalId.length > 5) {
        console.log(`   ... e mais ${semAnimalId.length - 5}`)
      }
      console.log()
    }
    
    // Buscar filhos cadastrados
    const filhosResult = await client.query(`
      SELECT * FROM animais 
      WHERE serie_mae = 'CJCJ' AND rg_mae = '13604'
      ORDER BY data_nascimento DESC NULLS LAST
    `)
    
    console.log(`👶 Filhos cadastrados na tabela animais: ${filhosResult.rows.length}`)
    
    if (filhosResult.rows.length > 0) {
      console.log(`\nPrimeiros 5 filhos:`)
      for (const filho of filhosResult.rows.slice(0, 5)) {
        console.log(`   - ${filho.serie} ${filho.rg} | ${filho.situacao} | ${filho.nome}`)
      }
      if (filhosResult.rows.length > 5) {
        console.log(`   ... e mais ${filhosResult.rows.length - 5}`)
      }
    }
    
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`✅ VERIFICAÇÃO CONCLUÍDA`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

verificar()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('💥 Erro fatal:', error)
    process.exit(1)
  })
