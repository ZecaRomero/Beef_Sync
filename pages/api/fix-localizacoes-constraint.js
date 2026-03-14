/**
 * API para remover constraint UNIQUE incorreta da tabela localizacoes_animais
 */

const { query } = require('../../lib/database')

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    console.log('🔍 Verificando constraints da tabela localizacoes_animais...')
    
    // Verificar constraints existentes
    const constraints = await query(`
      SELECT 
        con.conname AS constraint_name,
        con.contype AS constraint_type,
        pg_get_constraintdef(con.oid) AS definition
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      WHERE rel.relname = 'localizacoes_animais'
      ORDER BY con.conname
    `)
    
    const constraintsList = constraints.rows.map(row => ({
      name: row.constraint_name,
      type: row.constraint_type,
      definition: row.definition
    }))
    
    // Verificar se existe a constraint problemática
    const problematicConstraint = constraints.rows.find(
      row => row.constraint_name === 'localizacoes_animais_animal_id_key'
    )
    
    let removed = false
    let duplicates = []
    
    if (problematicConstraint) {
      console.log('❌ Encontrada constraint UNIQUE incorreta em animal_id!')
      
      // Remover constraint
      await query(`
        ALTER TABLE localizacoes_animais 
        DROP CONSTRAINT IF EXISTS localizacoes_animais_animal_id_key
      `)
      removed = true
      console.log('✅ Constraint removida com sucesso!')
      
      // Verificar registros duplicados
      const duplicatesResult = await query(`
        SELECT animal_id, COUNT(*) as count
        FROM localizacoes_animais
        WHERE data_saida IS NULL
        GROUP BY animal_id
        HAVING COUNT(*) > 1
      `)
      
      duplicates = duplicatesResult.rows
    }
    
    // Criar índices úteis
    await query(`
      CREATE INDEX IF NOT EXISTS idx_localizacoes_animal_ativo 
      ON localizacoes_animais(animal_id) 
      WHERE data_saida IS NULL
    `)
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_localizacoes_piquete 
      ON localizacoes_animais(piquete)
    `)
    
    res.status(200).json({
      success: true,
      message: removed 
        ? 'Constraint UNIQUE removida com sucesso!' 
        : 'Nenhuma constraint problemática encontrada',
      details: {
        constraintRemoved: removed,
        constraintsFound: constraintsList,
        duplicatesFound: duplicates.length,
        duplicates: duplicates
      }
    })
    
  } catch (error) {
    console.error('❌ Erro ao corrigir constraints:', error)
    res.status(500).json({
      success: false,
      error: 'Erro ao corrigir constraints',
      details: error.message
    })
  }
}
