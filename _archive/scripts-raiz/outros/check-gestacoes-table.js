// Script para verificar a estrutura da tabela gestacoes
const { query } = require('./lib/database')

async function checkGestacaoesTable() {
  console.log('🔍 VERIFICANDO ESTRUTURA DA TABELA GESTACOES')
  console.log('=' .repeat(60))
  
  try {
    // Verificar estrutura da tabela
    const structure = await query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'gestacoes' 
      ORDER BY ordinal_position
    `)
    
    console.log('\n📋 ESTRUTURA DA TABELA GESTACOES:')
    console.log('-'.repeat(80))
    console.log('COLUNA'.padEnd(20) + 'TIPO'.padEnd(15) + 'NULLABLE'.padEnd(10) + 'DEFAULT'.padEnd(15) + 'TAMANHO')
    console.log('-'.repeat(80))
    
    structure.rows.forEach(col => {
      console.log(
        col.column_name.padEnd(20) + 
        col.data_type.padEnd(15) + 
        col.is_nullable.padEnd(10) + 
        (col.column_default || 'NULL').padEnd(15) + 
        (col.character_maximum_length || 'N/A')
      )
    })
    
    // Verificar constraints
    const constraints = await query(`
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        cc.check_clause
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      LEFT JOIN information_schema.check_constraints cc 
        ON tc.constraint_name = cc.constraint_name
      WHERE tc.table_name = 'gestacoes'
      ORDER BY tc.constraint_type, kcu.column_name
    `)
    
    console.log('\n🔒 CONSTRAINTS DA TABELA GESTACOES:')
    console.log('-'.repeat(80))
    console.log('CONSTRAINT'.padEnd(25) + 'TIPO'.padEnd(15) + 'COLUNA'.padEnd(20) + 'REGRA')
    console.log('-'.repeat(80))
    
    constraints.rows.forEach(constraint => {
      console.log(
        (constraint.constraint_name || 'N/A').padEnd(25) + 
        (constraint.constraint_type || 'N/A').padEnd(15) + 
        (constraint.column_name || 'N/A').padEnd(20) + 
        (constraint.check_clause || 'N/A')
      )
    })
    
    // Testar inserção simples
    console.log('\n🧪 TESTANDO INSERÇÃO SIMPLES:')
    console.log('-'.repeat(40))
    
    try {
      const testResult = await query(`
        INSERT INTO gestacoes (
          receptora_nome,
          receptora_serie,
          receptora_rg,
          pai_serie,
          pai_rg,
          data_cobertura,
          situacao,
          observacoes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [
        'TESTE ANIMAL',
        'TEST',
        '999999',
        'TOURO',
        '888888',
        '2025-01-01',
        'Prenha',
        'Teste de inserção'
      ])
      
      console.log('✅ Inserção bem-sucedida! ID:', testResult.rows[0].id)
      
      // Remover o registro de teste
      await query('DELETE FROM gestacoes WHERE id = $1', [testResult.rows[0].id])
      console.log('🗑️ Registro de teste removido')
      
    } catch (insertError) {
      console.log('❌ Erro na inserção:', insertError.message)
      console.log('📝 Detalhes:', insertError.detail || 'Sem detalhes adicionais')
    }
    
    // Verificar registros existentes
    const count = await query('SELECT COUNT(*) as total FROM gestacoes')
    console.log(`\n📊 Total de registros existentes: ${count.rows[0].total}`)
    
    if (count.rows[0].total > 0) {
      const sample = await query('SELECT * FROM gestacoes LIMIT 3')
      console.log('\n📋 AMOSTRA DE REGISTROS EXISTENTES:')
      console.log('-'.repeat(80))
      sample.rows.forEach((row, index) => {
        console.log(`${index + 1}. ID: ${row.id}`)
        console.log(`   Receptora: ${row.receptora_serie} ${row.receptora_rg}`)
        console.log(`   Mãe: ${row.mae_serie || 'NULL'} ${row.mae_rg || 'NULL'}`)
        console.log(`   Pai: ${row.pai_serie || 'NULL'} ${row.pai_rg || 'NULL'}`)
        console.log(`   Data: ${row.data_cobertura}`)
        console.log(`   Situação: ${row.situacao}`)
        console.log('')
      })
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar tabela:', error)
  }
}

// Executar
checkGestacaoesTable()
  .then(() => {
    console.log('\n✅ VERIFICAÇÃO CONCLUÍDA!')
    process.exit(0)
  })
  .catch(error => {
    console.error('Erro:', error)
    process.exit(1)
  })