const { query } = require('./lib/database')

async function adicionarLotePesagens() {
  try {
    console.log('�Ÿ”� Adicionando coluna "lote" na tabela pesagens...\n')

    // Verificar se a coluna já existe
    const checkColumn = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pesagens' 
        AND column_name = 'lote'
    `)

    if (checkColumn.rows.length > 0) {
      console.log('�š�️  Coluna "lote" já existe na tabela pesagens')
      return
    }

    // Adicionar coluna lote
    await query(`
      ALTER TABLE pesagens 
      ADD COLUMN lote VARCHAR(100)
    `)

    console.log('�œ… Coluna "lote" adicionada com sucesso!')
    console.log('\n�Ÿ“‹ Estrutura da coluna:')
    console.log('   - Nome: lote')
    console.log('   - Tipo: VARCHAR(100)')
    console.log('   - Permite NULL: Sim')
    console.log('   - Descrição: Identificador do lote de pesagens')
    console.log('\n�Ÿ’� Exemplos de uso:')
    console.log('   - "Lote de Pesagens ABCZ Fev 2026"')
    console.log('   - "Pesagem Desmame Set 2025"')
    console.log('   - "Avaliação Anual 2026"')
    console.log('   - "Pesagem Pré-Venda Mar 2026"')

    // Verificar a estrutura atualizada
    const columns = await query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'pesagens'
      ORDER BY ordinal_position
    `)

    console.log('\n�Ÿ“Š Estrutura completa da tabela pesagens:')
    columns.rows.forEach(col => {
      const length = col.character_maximum_length ? `(${col.character_maximum_length})` : ''
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'
      console.log(`   - ${col.column_name}: ${col.data_type}${length} ${nullable}`)
    })

  } catch (error) {
    console.error('�Œ Erro ao adicionar coluna:', error.message)
    if (error.stack) {
      console.error('\nStack trace:', error.stack)
    }
  } finally {
    process.exit()
  }
}

adicionarLotePesagens()
