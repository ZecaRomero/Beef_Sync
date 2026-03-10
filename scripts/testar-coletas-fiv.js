/**
 * Script para testar a busca de coletas FIV da CJCJ 16013 (MANERA SANT ANNA)
 */
const { query } = require('../lib/database')

async function testarColetasFIV() {
  try {
    console.log('🔍 Testando busca de coletas FIV para CJCJ 16013...\n')
    
    // Teste 1: Buscar por doadora_nome exato
    console.log('Teste 1: Buscar por doadora_nome = "CJCJ 16013"')
    const result1 = await query(
      `SELECT id, data_fiv, quantidade_oocitos, embrioes_produzidos, embrioes_transferidos, touro, doadora_nome
       FROM coleta_fiv
       WHERE UPPER(TRIM(doadora_nome)) = UPPER($1)
       ORDER BY data_fiv DESC`,
      ['CJCJ 16013']
    )
    console.log(`   Encontradas: ${result1.rows.length} coletas`)
    if (result1.rows.length > 0) {
      console.log('   Primeira coleta:', result1.rows[0])
    }
    
    // Teste 2: Buscar por doadora_nome com LIKE
    console.log('\nTeste 2: Buscar por doadora_nome LIKE "%CJCJ%16013%"')
    const result2 = await query(
      `SELECT id, data_fiv, quantidade_oocitos, embrioes_produzidos, embrioes_transferidos, touro, doadora_nome
       FROM coleta_fiv
       WHERE UPPER(doadora_nome) LIKE $1
       ORDER BY data_fiv DESC`,
      ['%CJCJ%16013%']
    )
    console.log(`   Encontradas: ${result2.rows.length} coletas`)
    
    // Teste 3: Buscar por doadora_identificador
    console.log('\nTeste 3: Buscar por doadora_identificador = "CJCJ 16013"')
    const result3 = await query(
      `SELECT id, data_fiv, quantidade_oocitos, embrioes_produzidos, embrioes_transferidos, touro, doadora_nome, doadora_identificador
       FROM coleta_fiv
       WHERE doadora_identificador = $1
       ORDER BY data_fiv DESC`,
      ['CJCJ 16013']
    )
    console.log(`   Encontradas: ${result3.rows.length} coletas`)
    if (result3.rows.length > 0) {
      console.log('   Primeira coleta:', result3.rows[0])
    }
    
    // Teste 4: Listar todas as coletas para ver os nomes
    console.log('\nTeste 4: Listar todas as doadoras únicas')
    const result4 = await query(
      `SELECT DISTINCT doadora_nome, doadora_identificador, COUNT(*) as total_coletas
       FROM coleta_fiv
       GROUP BY doadora_nome, doadora_identificador
       ORDER BY total_coletas DESC
       LIMIT 10`
    )
    console.log('   Top 10 doadoras:')
    result4.rows.forEach(row => {
      console.log(`   - ${row.doadora_nome} (${row.doadora_identificador || 'sem identificador'}) - ${row.total_coletas} coletas`)
    })
    
    // Teste 5: Calcular resumo
    if (result1.rows.length > 0 || result2.rows.length > 0 || result3.rows.length > 0) {
      const coletas = result1.rows.length > 0 ? result1.rows : (result2.rows.length > 0 ? result2.rows : result3.rows)
      const totalColetas = coletas.length
      const totalOocitos = coletas.reduce((s, c) => s + (parseInt(c.quantidade_oocitos) || 0), 0)
      const totalEmbrioes = coletas.reduce((s, c) => s + (parseInt(c.embrioes_produzidos) || 0), 0)
      const totalTransferidos = coletas.reduce((s, c) => s + (parseInt(c.embrioes_transferidos) || 0), 0)
      
      console.log('\n📊 Resumo das coletas:')
      console.log(`   Total de coletas: ${totalColetas}`)
      console.log(`   Total de oócitos: ${totalOocitos}`)
      console.log(`   Média de oócitos: ${(totalOocitos / totalColetas).toFixed(1)}`)
      console.log(`   Total de embriões: ${totalEmbrioes}`)
      console.log(`   Média de embriões: ${(totalEmbrioes / totalColetas).toFixed(1)}`)
      console.log(`   Total transferidos: ${totalTransferidos}`)
      console.log(`   Média transferidos: ${(totalTransferidos / totalColetas).toFixed(1)}`)
    }
    
    console.log('\n✅ Teste concluído!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro ao testar:', error)
    process.exit(1)
  }
}

testarColetasFIV()
