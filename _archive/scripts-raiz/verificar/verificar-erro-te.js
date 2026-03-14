const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
})

async function verificarErroTE() {
  try {
    console.log('🔍 Verificando estrutura da tabela transferencias_embriao...\n')

    // Ver estrutura da tabela
    const estrutura = await pool.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'transferencias_embriao'
      ORDER BY ordinal_position
    `)

    console.log('📋 Colunas da tabela transferencias_embriao:')
    estrutura.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? '(opcional)' : '(obrigatório)'
      const defaultVal = col.column_default ? ` [default: ${col.column_default}]` : ''
      console.log(`   - ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`)
    })

    // Verificar constraints
    console.log('\n📋 Constraints da tabela:')
    const constraints = await pool.query(`
      SELECT
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'transferencias_embriao'
      ORDER BY tc.constraint_type, tc.constraint_name
    `)

    constraints.rows.forEach(c => {
      console.log(`   - ${c.constraint_name} (${c.constraint_type}): ${c.column_name || 'N/A'}`)
    })

    // Testar inserção
    console.log('\n🧪 Testando inserção de TE...')
    try {
      const teste = await pool.query(`
        INSERT INTO transferencias_embriao 
        (animal_id, data_te, veterinario, observacoes)
        VALUES (1658, '2026-02-19', 'TESTE', 'Teste de inserção')
        RETURNING id
      `)
      
      if (teste.rows.length > 0) {
        console.log(`✅ Inserção bem-sucedida! ID: ${teste.rows[0].id}`)
        
        // Deletar o teste
        await pool.query(`DELETE FROM transferencias_embriao WHERE id = $1`, [teste.rows[0].id])
        console.log('✅ Registro de teste deletado.')
      }
    } catch (error) {
      console.log('❌ Erro ao inserir:', error.message)
      console.log('\nDetalhes do erro:')
      console.log(error)
    }

  } catch (error) {
    console.error('❌ Erro:', error.message)
  } finally {
    await pool.end()
  }
}

verificarErroTE()
