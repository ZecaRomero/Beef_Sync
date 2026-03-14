/**
 * Script para remover constraint UNIQUE incorreta da tabela localizacoes_animais
 * Um animal pode ter múltiplas localizações ao longo do tempo
 */

const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

async function fixConstraint() {
  const client = await pool.connect()
  
  try {
    console.log('�Ÿ”� Verificando constraints da tabela localizacoes_animais...\n')
    
    // Verificar constraints existentes
    const constraints = await client.query(`
      SELECT 
        con.conname AS constraint_name,
        con.contype AS constraint_type,
        pg_get_constraintdef(con.oid) AS definition
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      WHERE rel.relname = 'localizacoes_animais'
      ORDER BY con.conname
    `)
    
    console.log('Constraints encontradas:')
    constraints.rows.forEach(row => {
      console.log(`  - ${row.constraint_name} (${row.constraint_type}): ${row.definition}`)
    })
    console.log()
    
    // Verificar se existe a constraint problemática
    const problematicConstraint = constraints.rows.find(
      row => row.constraint_name === 'localizacoes_animais_animal_id_key'
    )
    
    if (problematicConstraint) {
      console.log('�Œ Encontrada constraint UNIQUE incorreta em animal_id!')
      console.log('   Esta constraint impede que um animal tenha múltiplas localizações.\n')
      
      console.log('�Ÿ”� Removendo constraint...')
      await client.query(`
        ALTER TABLE localizacoes_animais 
        DROP CONSTRAINT IF EXISTS localizacoes_animais_animal_id_key
      `)
      console.log('�œ… Constraint removida com sucesso!\n')
      
      // Verificar se há registros duplicados que precisam ser corrigidos
      console.log('�Ÿ”� Verificando registros duplicados...')
      const duplicates = await client.query(`
        SELECT animal_id, COUNT(*) as count
        FROM localizacoes_animais
        WHERE data_saida IS NULL
        GROUP BY animal_id
        HAVING COUNT(*) > 1
      `)
      
      if (duplicates.rows.length > 0) {
        console.log(`�š�️  Encontrados ${duplicates.rows.length} animais com múltiplas localizações ativas:`)
        duplicates.rows.forEach(row => {
          console.log(`   - Animal ID ${row.animal_id}: ${row.count} localizações ativas`)
        })
        console.log('\n�Ÿ’� Recomendação: Verifique manualmente e finalize as localizações antigas.')
      } else {
        console.log('�œ… Nenhum registro duplicado encontrado.\n')
      }
      
    } else {
      console.log('�œ… Constraint UNIQUE em animal_id não existe (correto!).\n')
    }
    
    // Verificar índices
    console.log('�Ÿ”� Verificando índices...')
    const indexes = await client.query(`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'localizacoes_animais'
      ORDER BY indexname
    `)
    
    console.log('Índices encontrados:')
    indexes.rows.forEach(row => {
      console.log(`  - ${row.indexname}`)
      console.log(`    ${row.indexdef}`)
    })
    console.log()
    
    // Criar índice útil se não existir
    console.log('�Ÿ”� Criando índices úteis...')
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_localizacoes_animal_ativo 
      ON localizacoes_animais(animal_id) 
      WHERE data_saida IS NULL
    `)
    console.log('�œ… Índice para localizações ativas criado.\n')
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_localizacoes_piquete 
      ON localizacoes_animais(piquete)
    `)
    console.log('�œ… Índice para piquetes criado.\n')
    
    console.log('�œ… Correção concluída com sucesso!')
    
  } catch (error) {
    console.error('�Œ Erro ao corrigir constraints:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

fixConstraint()
  .then(() => {
    console.log('\n�œ… Script finalizado.')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n�Œ Erro fatal:', error)
    process.exit(1)
  })
