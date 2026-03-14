const pool = require('../lib/database')

async function addDGFields() {
  try {
    console.log('🔧 Adicionando campos de DG na tabela animais...')

    // Verificar se os campos já existem
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'animais' 
      AND column_name IN ('data_dg', 'veterinario_dg', 'resultado_dg', 'observacoes_dg')
    `
    
    const existingColumns = await pool.query(checkQuery)
    const existingColumnNames = existingColumns.rows.map(row => row.column_name)
    
    console.log('📋 Campos existentes:', existingColumnNames)

    // Adicionar campos que não existem
    const fieldsToAdd = []
    
    if (!existingColumnNames.includes('data_dg')) {
      fieldsToAdd.push('ADD COLUMN IF NOT EXISTS data_dg DATE')
    }
    
    if (!existingColumnNames.includes('veterinario_dg')) {
      fieldsToAdd.push('ADD COLUMN IF NOT EXISTS veterinario_dg VARCHAR(255)')
    }
    
    if (!existingColumnNames.includes('resultado_dg')) {
      fieldsToAdd.push('ADD COLUMN IF NOT EXISTS resultado_dg VARCHAR(50)')
    }
    
    if (!existingColumnNames.includes('observacoes_dg')) {
      fieldsToAdd.push('ADD COLUMN IF NOT EXISTS observacoes_dg TEXT')
    }

    if (fieldsToAdd.length > 0) {
      const alterQuery = `ALTER TABLE animais ${fieldsToAdd.join(', ')}`
      console.log('🔧 Executando:', alterQuery)
      await pool.query(alterQuery)
      console.log('✅ Campos adicionados com sucesso!')
    } else {
      console.log('✅ Todos os campos já existem!')
    }

    // Verificar resultado
    const verifyQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'animais' 
      AND column_name IN ('data_dg', 'veterinario_dg', 'resultado_dg', 'observacoes_dg')
      ORDER BY column_name
    `
    
    const result = await pool.query(verifyQuery)
    console.log('\n📋 Campos de DG na tabela animais:')
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`)
    })

    console.log('\n✅ Processo concluído!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }
}

addDGFields()
