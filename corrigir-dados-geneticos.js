/**
 * Script para corrigir mapeamento de dados genéticos
 * Corrige animais onde os valores foram importados nas colunas erradas
 * 
 * Execute: node corrigir-dados-geneticos.js
 */

const { query } = require('./lib/database')

async function corrigirDadosGeneticos() {
  try {
    console.log('\n🔧 Iniciando correção de dados genéticos...\n')
    
    // Buscar animais com situacao_abcz numérico (indica importação errada)
    const result = await query(`
      SELECT id, serie, rg, nome, abczg, deca, iqg, pt_iqg, situacao_abcz, genetica_2, decile_2
      FROM animais 
      WHERE situacao_abcz ~ '^[0-9]+\.?[0-9]*$'
      ORDER BY serie, rg
    `)
    
    if (result.rows.length === 0) {
      console.log('✅ Nenhum animal com dados incorretos encontrado!')
      return
    }
    
    console.log(`📋 Encontrados ${result.rows.length} animais com dados incorretos:\n`)
    
    let corrigidos = 0
    
    for (const animal of result.rows) {
      console.log(`\n🔍 Animal: ${animal.serie} ${animal.rg} (${animal.nome || 'Sem nome'})`)
      console.log('   Valores ANTES da correção:')
      console.log(`   - iABCZ: ${animal.abczg}`)
      console.log(`   - DECA: ${animal.deca}`)
      console.log(`   - IQG: ${animal.iqg}`)
      console.log(`   - Pt IQG: ${animal.pt_iqg}`)
      console.log(`   - Situação ABCZ: ${animal.situacao_abcz}`)
      
      // Corrigir mapeamento:
      // situacao_abcz (que tem número) -> iqg
      // iqg (que tem Pt IQG) -> pt_iqg
      // situacao_abcz -> NULL (limpar)
      
      const novoIqg = parseFloat(animal.situacao_abcz) || null
      const novoPtIqg = animal.iqg || null
      
      await query(`
        UPDATE animais 
        SET 
          iqg = $1,
          pt_iqg = $2,
          situacao_abcz = NULL,
          updated_at = NOW()
        WHERE id = $3
      `, [novoIqg, novoPtIqg, animal.id])
      
      console.log('   ✅ Valores DEPOIS da correção:')
      console.log(`   - iABCZ: ${animal.abczg}`)
      console.log(`   - DECA: ${animal.deca}`)
      console.log(`   - IQG: ${novoIqg}`)
      console.log(`   - Pt IQG: ${novoPtIqg}`)
      console.log(`   - Situação ABCZ: NULL (limpo)`)
      
      corrigidos++
    }
    
    console.log(`\n✅ Correção concluída! ${corrigidos} animais corrigidos.\n`)
    
  } catch (error) {
    console.error('❌ Erro:', error.message)
    console.error(error)
  } finally {
    process.exit(0)
  }
}

corrigirDadosGeneticos()
