const { query, pool } = require('../lib/database')
require('dotenv').config()

async function limparColetasFIVImportadas() {
  const client = await pool.connect()
  
  try {
    console.log('🔍 Verificando coletas FIV importadas...\n')
    
    // Contar coletas que foram importadas (criadas em lote, geralmente na mesma data)
    const stats = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT DATE(created_at)) as dias_importacao,
        MIN(created_at) as primeira_importacao,
        MAX(created_at) as ultima_importacao
      FROM coleta_fiv
    `)
    
    console.log('📊 Estatísticas atuais:')
    console.log(`   Total de coletas FIV: ${stats.rows[0].total}`)
    console.log(`   Dias de importação distintos: ${stats.rows[0].dias_importacao}`)
    console.log(`   Primeira importação: ${new Date(stats.rows[0].primeira_importacao).toLocaleString('pt-BR')}`)
    console.log(`   Última importação: ${new Date(stats.rows[0].ultima_importacao).toLocaleString('pt-BR')}`)
    
    // Verificar quantas foram importadas recentemente (últimos 7 dias)
    const recentes = await query(`
      SELECT COUNT(*) as total
      FROM coleta_fiv
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `)
    
    console.log(`   Coletas importadas nos últimos 7 dias: ${recentes.rows[0].total}`)
    
    const args = process.argv.slice(2)
    const autoConfirm = args.includes('--yes') || args.includes('-y')
    
    if (!autoConfirm) {
      console.log('\n⚠️  ATENÇÃO: Este script irá DELETAR TODAS as coletas FIV do banco!')
      console.log('   Isso é irreversível. Certifique-se de ter um backup.')
      console.log('\n   Para executar, execute novamente com --yes ou -y')
      console.log('   Exemplo: node scripts/limpar-e-reimportar-fiv.js --yes\n')
      return
    }
    
    console.log('\n🗑️  Iniciando limpeza de todas as coletas FIV...\n')
    
    await client.query('BEGIN')
    
    try {
      // Deletar todas as coletas FIV
      const result = await query('DELETE FROM coleta_fiv RETURNING id, doadora_nome, data_fiv')
      
      await client.query('COMMIT')
      
      console.log(`✅ ${result.rows.length} coletas FIV deletadas com sucesso!`)
      console.log('\n📋 Próximos passos:')
      console.log('   1. Reimporte o arquivo Excel através da interface web')
      console.log('   2. O código de importação foi melhorado e deve processar as datas corretamente')
      console.log('   3. Verifique as datas após a importação\n')
      
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('\n❌ Erro durante a limpeza. Rollback executado.')
      throw error
    }
    
  } catch (error) {
    console.error('❌ Erro ao executar limpeza:', error)
    throw error
  } finally {
    client.release()
  }
}

limparColetasFIVImportadas()
  .then(() => {
    console.log('\n✅ Script finalizado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error)
    process.exit(1)
  })
