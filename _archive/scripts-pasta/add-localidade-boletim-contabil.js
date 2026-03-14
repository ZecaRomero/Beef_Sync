const { query, pool } = require('../lib/database')
require('dotenv').config()

async function addLocalidadeBoletimContabil() {
  const client = await pool.connect()
  
  try {
    console.log('�Ÿ”� Adicionando coluna localidade à tabela boletim_contabil...\n')
    
    await client.query('BEGIN')
    
    try {
      // Adicionar coluna localidade se não existir
      await client.query(`
        ALTER TABLE boletim_contabil 
        ADD COLUMN IF NOT EXISTS localidade VARCHAR(50) CHECK (localidade IN ('Pardinho', 'Rancharia', NULL))
      `)
      
      console.log('�œ… Coluna localidade adicionada com sucesso!')
      
      await client.query('COMMIT')
      
      console.log('\n�Ÿ“‹ Próximos passos:')
      console.log('   1. Atualize os boletins existentes com a localidade (Pardinho ou Rancharia)')
      console.log('   2. O formulário de nota fiscal agora mostrará a localidade do boletim selecionado\n')
      
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
    
  } catch (error) {
    console.error('�Œ Erro ao adicionar coluna:', error)
    throw error
  } finally {
    client.release()
  }
}

addLocalidadeBoletimContabil()
  .then(() => {
    console.log('\n�œ… Script finalizado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n�Œ Erro fatal:', error)
    process.exit(1)
  })
