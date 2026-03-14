require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: false
})

async function adicionar() {
  try {
    console.log('�Ÿ”„ Adicionando coluna data_te na tabela animais...\n')
    
    // Verificar se a coluna já existe
    const checkColumn = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'animais' AND column_name = 'data_te'
      )
    `)
    
    if (checkColumn.rows[0].exists) {
      console.log('�œ… Coluna data_te já existe')
    } else {
      // Adicionar coluna
      await pool.query(`
        ALTER TABLE animais ADD COLUMN data_te DATE
      `)
      console.log('�œ… Coluna data_te adicionada com sucesso')
    }
    
    // Atualizar data_te para animais prenhas que têm inseminação
    console.log('\n�Ÿ”„ Atualizando data_te para animais prenhas...')
    const result = await pool.query(`
      UPDATE animais a
      SET data_te = i.data_ia, updated_at = CURRENT_TIMESTAMP
      FROM inseminacoes i
      WHERE a.id = i.animal_id 
        AND a.resultado_dg = 'Prenha'
        AND a.data_te IS NULL
        AND i.data_ia IS NOT NULL
      RETURNING a.id, a.serie, a.rg, a.nome, a.data_te
    `)
    
    if (result.rows.length > 0) {
      console.log(`�œ… ${result.rows.length} animais atualizados:`)
      result.rows.forEach(a => {
        console.log(`   - ${a.serie}-${a.rg} (${a.nome}): data_te = ${a.data_te}`)
      })
    } else {
      console.log('�š�️ Nenhum animal precisou ser atualizado')
    }
    
  } catch (error) {
    console.error('�Œ Erro:', error.message)
  } finally {
    await pool.end()
  }
}

adicionar()
