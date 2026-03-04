const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
})

async function removerInfoLote() {
  const client = await pool.connect()
  
  try {
    console.log('🔍 Buscando animais com informação de lote nas observações...\n')
    
    // Buscar animais que têm "Cadastrado via lote" nas observações
    const result = await client.query(`
      SELECT id, serie, rg, observacoes
      FROM animais
      WHERE observacoes ILIKE '%Cadastrado via lote%'
      ORDER BY id
    `)
    
    console.log(`📊 Total de animais encontrados: ${result.rows.length}\n`)
    
    if (result.rows.length === 0) {
      console.log('✅ Nenhum animal com informação de lote encontrado!')
      return
    }
    
    // Mostrar alguns exemplos
    console.log('📋 Exemplos de observações que serão limpas:')
    result.rows.slice(0, 5).forEach(animal => {
      console.log(`\n  ID: ${animal.id} | ${animal.serie} ${animal.rg}`)
      console.log(`  Antes: "${animal.observacoes}"`)
      
      // Remover a linha "Cadastrado via lote LOTE-XXXXX"
      const observacoesLimpas = animal.observacoes
        .replace(/Cadastrado via lote LOTE-\d+\s*🔖\s*/gi, '')
        .replace(/Cadastrado via lote LOTE-\d+\s*/gi, '')
        .trim()
      
      console.log(`  Depois: "${observacoesLimpas || '(vazio)'}"`)
    })
    
    if (result.rows.length > 5) {
      console.log(`\n  ... e mais ${result.rows.length - 5} animais`)
    }
    
    // Confirmar ação
    console.log('\n⚠️  ATENÇÃO: Esta operação irá remover a informação de lote de todos os animais!')
    console.log('   Deseja continuar? (Ctrl+C para cancelar)\n')
    
    // Aguardar 3 segundos
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    console.log('🔄 Iniciando limpeza...\n')
    
    // Atualizar cada animal
    let atualizados = 0
    let erros = 0
    
    for (const animal of result.rows) {
      try {
        // Remover a linha "Cadastrado via lote LOTE-XXXXX"
        const observacoesLimpas = animal.observacoes
          .replace(/Cadastrado via lote LOTE-\d+\s*🔖\s*/gi, '')
          .replace(/Cadastrado via lote LOTE-\d+\s*/gi, '')
          .trim()
        
        await client.query(
          'UPDATE animais SET observacoes = $1 WHERE id = $2',
          [observacoesLimpas || null, animal.id]
        )
        
        atualizados++
        
        if (atualizados % 10 === 0) {
          console.log(`   ✓ ${atualizados} animais atualizados...`)
        }
      } catch (error) {
        console.error(`   ✗ Erro ao atualizar animal ${animal.id}:`, error.message)
        erros++
      }
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('📊 RESUMO DA LIMPEZA')
    console.log('='.repeat(60))
    console.log(`✅ Animais atualizados: ${atualizados}`)
    console.log(`❌ Erros: ${erros}`)
    console.log(`📋 Total processado: ${result.rows.length}`)
    console.log('='.repeat(60))
    
    // Verificar resultado
    console.log('\n🔍 Verificando resultado...\n')
    
    const verificacao = await client.query(`
      SELECT COUNT(*) as total
      FROM animais
      WHERE observacoes ILIKE '%Cadastrado via lote%'
    `)
    
    if (verificacao.rows[0].total === '0') {
      console.log('✅ Sucesso! Todas as informações de lote foram removidas!')
    } else {
      console.log(`⚠️  Ainda existem ${verificacao.rows[0].total} animais com informação de lote`)
    }
    
  } catch (error) {
    console.error('❌ Erro ao remover informações de lote:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

// Executar
removerInfoLote()
  .then(() => {
    console.log('\n✅ Script finalizado!')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Erro fatal:', error)
    process.exit(1)
  })
