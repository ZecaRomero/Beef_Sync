const { Pool } = require('pg')

// Configuração do banco de dados
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'estoque_semen',
  password: 'jcromero85',
  port: 5432,
})

async function testObservacoesNitrogenio() {
  console.log('�Ÿ”� Testando observações do sistema de nitrogênio...')
  
  try {
    // Verificar se a tabela existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'abastecimento_nitrogenio'
      );
    `)
    
    if (!tableExists.rows[0].exists) {
      console.log('�Œ Tabela abastecimento_nitrogenio não existe!')
      return
    }
    
    console.log('�œ… Tabela abastecimento_nitrogenio existe')
    
    // Verificar estrutura da tabela
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'abastecimento_nitrogenio'
      ORDER BY ordinal_position;
    `)
    
    console.log('\n�Ÿ“Š Estrutura da tabela:')
    columns.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`)
    })
    
    // Verificar se existe coluna observacoes
    const hasObservacoes = columns.rows.some(col => col.column_name === 'observacoes')
    if (!hasObservacoes) {
      console.log('\n�Œ Coluna "observacoes" não encontrada!')
      return
    }
    
    console.log('\n�œ… Coluna "observacoes" existe')
    
    // Buscar registros com observações
    const withObservations = await pool.query(`
      SELECT 
        id,
        data_abastecimento,
        quantidade_litros,
        motorista,
        observacoes,
        LENGTH(TRIM(COALESCE(observacoes, ''))) as obs_length
      FROM abastecimento_nitrogenio 
      WHERE observacoes IS NOT NULL 
      AND TRIM(observacoes) != ''
      ORDER BY data_abastecimento DESC
      LIMIT 10
    `)
    
    console.log(`\n�Ÿ“� Registros com observações: ${withObservations.rows.length}`)
    
    if (withObservations.rows.length > 0) {
      console.log('\n�Ÿ”� Exemplos de observações:')
      withObservations.rows.forEach((row, index) => {
        console.log(`\n   ${index + 1}. ID: ${row.id}`)
        console.log(`      Data: ${new Date(row.data_abastecimento).toLocaleDateString('pt-BR')}`)
        console.log(`      Motorista: ${row.motorista}`)
        console.log(`      Quantidade: ${row.quantidade_litros}L`)
        console.log(`      Observação (${row.obs_length} chars): "${row.observacoes}"`)
      })
    } else {
      console.log('\n�š�️  Nenhum registro com observações encontrado')
      
      // Criar um registro de teste com observação
      console.log('\n�Ÿ”� Criando registro de teste com observação...')
      
      const testRecord = await pool.query(`
        INSERT INTO abastecimento_nitrogenio 
        (data_abastecimento, quantidade_litros, motorista, observacoes, valor_unitario, valor_total)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        new Date().toISOString().split('T')[0], // hoje
        100.5,
        'João Teste',
        'Esta é uma observação de teste para verificar se o modal está funcionando corretamente. Contém informações importantes sobre o abastecimento.',
        9.50,
        955.25
      ])
      
      console.log('�œ… Registro de teste criado:')
      console.log(`   ID: ${testRecord.rows[0].id}`)
      console.log(`   Observação: "${testRecord.rows[0].observacoes}"`)
    }
    
    // Buscar todos os registros para estatísticas
    const allRecords = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN observacoes IS NOT NULL AND TRIM(observacoes) != '' THEN 1 END) as com_observacoes,
        COUNT(CASE WHEN observacoes IS NULL OR TRIM(observacoes) = '' THEN 1 END) as sem_observacoes
      FROM abastecimento_nitrogenio
    `)
    
    const stats = allRecords.rows[0]
    console.log('\n�Ÿ“Š Estatísticas:')
    console.log(`   Total de registros: ${stats.total}`)
    console.log(`   Com observações: ${stats.com_observacoes}`)
    console.log(`   Sem observações: ${stats.sem_observacoes}`)
    console.log(`   Percentual com observações: ${stats.total > 0 ? ((stats.com_observacoes / stats.total) * 100).toFixed(1) : 0}%`)
    
    // Testar a API
    console.log('\n�ŸŒ� Testando API /api/nitrogenio...')
    
    const fetch = require('node-fetch')
    
    try {
      const response = await fetch('http://localhost:3020/api/nitrogenio?page=1&limit=5')
      
      if (response.ok) {
        const data = await response.json()
        console.log('�œ… API respondeu corretamente')
        console.log(`   Registros retornados: ${data.data?.length || 0}`)
        
        const recordsWithObs = data.data?.filter(item => 
          item.observacoes && String(item.observacoes).trim().length > 0
        ) || []
        
        console.log(`   Registros com observações na API: ${recordsWithObs.length}`)
        
        if (recordsWithObs.length > 0) {
          console.log('\n�Ÿ“� Observações retornadas pela API:')
          recordsWithObs.forEach((item, index) => {
            console.log(`   ${index + 1}. ID ${item.id}: "${item.observacoes}"`)
          })
        }
      } else {
        console.log(`�Œ API retornou erro: ${response.status} ${response.statusText}`)
      }
    } catch (apiError) {
      console.log(`�š�️  Erro ao testar API (servidor pode estar offline): ${apiError.message}`)
    }
    
  } catch (error) {
    console.error('�Œ Erro durante o teste:', error)
  } finally {
    await pool.end()
  }
}

// Executar o teste
testObservacoesNitrogenio()
  .then(() => {
    console.log('\n�ŸŽ‰ Teste concluído!')
  })
  .catch(error => {
    console.error('�Ÿ’� Erro fatal:', error)
    process.exit(1)
  })