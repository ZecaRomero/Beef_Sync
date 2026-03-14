const { Pool } = require('pg')

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'estoque_semen',
  password: process.env.DB_PASSWORD || 'jcromero85',
  port: process.env.DB_PORT || 5432,
})

async function verificarOcorrencias() {
  const client = await pool.connect()
  
  try {
    // Buscar ocorrências do animal CJCJ-16173
    const result = await client.query(`
      SELECT id, animal_id, avo_materno, serie, rg, data_registro
      FROM ocorrencias_animais 
      WHERE animal_id = 1149
      ORDER BY data_registro DESC
      LIMIT 10
    `)
    
    console.log(`📋 Ocorrências encontradas para animal ID 1149 (CJCJ-16173): ${result.rows.length}`)
    
    if (result.rows.length > 0) {
      result.rows.forEach((oc, index) => {
        console.log(`\n${index + 1}. Ocorrência ID ${oc.id}:`)
        console.log(`   Data: ${oc.data_registro}`)
        console.log(`   Avô Materno: ${oc.avo_materno || 'NULL'}`)
        console.log(`   Série: ${oc.serie || 'N/A'}`)
        console.log(`   RG: ${oc.rg || 'N/A'}`)
      })
      
      // Verificar se alguma ocorrência tem avô materno
      const comAvo = result.rows.find(oc => oc.avo_materno && oc.avo_materno.trim() !== '')
      if (comAvo) {
        console.log(`\n✅ Encontrado avô materno em ocorrência: "${comAvo.avo_materno}"`)
        console.log('💡 Atualizando animal com esse valor...')
        
        await client.query(`
          UPDATE animais 
          SET avo_materno = $1, updated_at = CURRENT_TIMESTAMP 
          WHERE id = $2
        `, [comAvo.avo_materno, 1149])
        
        console.log('✅ Animal atualizado!')
      } else {
        console.log('\n⚠️ Nenhuma ocorrência tem avô materno preenchido')
      }
    } else {
      console.log('\n⚠️ Nenhuma ocorrência encontrada para este animal')
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message)
    if (error.message.includes('does not exist')) {
      console.log('\n💡 Tabela de ocorrências não existe ainda. Isso é normal.')
    } else {
      throw error
    }
  } finally {
    client.release()
    await pool.end()
  }
}

verificarOcorrencias()
  .then(() => {
    console.log('\n✅ Script concluído!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error)
    process.exit(1)
  })

