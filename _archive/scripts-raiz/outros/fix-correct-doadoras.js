#!/usr/bin/env node

/**
 * Script para corrigir as vinculações incorretas e manter apenas as doadoras CJCJ corretas
 */

const { query } = require('./lib/database')

async function fixCorrectDoadoras() {
  console.log('🔧 Corrigindo vinculações incorretas de doadoras...\n')

  try {
    // 1. Verificar estado atual das transferências
    console.log('1. Estado atual das transferências:')
    const currentState = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(doadora_id) as com_doadora_id,
        COUNT(touro_id) as com_touro_id
      FROM transferencias_embrioes
    `)
    
    console.log(`   📊 Total de transferências: ${currentState.rows[0].total}`)
    console.log(`   📊 Com doadora_id: ${currentState.rows[0].com_doadora_id}`)
    console.log(`   📊 Com touro_id: ${currentState.rows[0].com_touro_id}`)

    // 2. Verificar quais doadoras estão vinculadas incorretamente
    console.log('\n2. Verificando doadoras vinculadas:')
    const vinculacoesAtuais = await query(`
      SELECT 
        te.doadora_nome,
        a.serie,
        a.rg,
        COUNT(*) as total_transferencias
      FROM transferencias_embrioes te
      LEFT JOIN animais a ON te.doadora_id = a.id
      WHERE te.doadora_id IS NOT NULL
      GROUP BY te.doadora_nome, a.serie, a.rg
      ORDER BY total_transferencias DESC
    `)
    
    console.log(`   📊 Doadoras vinculadas encontradas:`)
    vinculacoesAtuais.rows.forEach((vinc, index) => {
      const isCorrect = vinc.doadora_nome && vinc.doadora_nome.includes('CJCJ')
      console.log(`   ${index + 1}. "${vinc.doadora_nome}" → ${vinc.serie} ${vinc.rg} (${vinc.total_transferencias} TEs) ${isCorrect ? '✅' : '❌'}`)
    })

    // 3. Remover vinculações incorretas (não-CJCJ)
    console.log('\n3. Removendo vinculações incorretas:')
    const incorrectLinks = await query(`
      SELECT DISTINCT te.doadora_id, a.serie, a.rg, te.doadora_nome
      FROM transferencias_embrioes te
      JOIN animais a ON te.doadora_id = a.id
      WHERE te.doadora_id IS NOT NULL 
        AND (a.serie != 'CJCJ' OR te.doadora_nome NOT ILIKE '%CJCJ%')
    `)
    
    if (incorrectLinks.rows.length > 0) {
      console.log(`   ❌ Encontradas ${incorrectLinks.rows.length} vinculações incorretas:`)
      
      for (const link of incorrectLinks.rows) {
        console.log(`      Removendo: ${link.serie} ${link.rg} (ID: ${link.doadora_id}) de "${link.doadora_nome}"`)
        
        await query(`
          UPDATE transferencias_embrioes 
          SET doadora_id = NULL, updated_at = NOW()
          WHERE doadora_id = $1
        `, [link.doadora_id])
      }
      console.log(`   ✅ Vinculações incorretas removidas`)
    } else {
      console.log(`   ✅ Nenhuma vinculação incorreta encontrada`)
    }

    // 4. Verificar e corrigir vinculações de touros (CJCA6 não deveria ter prenhezes como touro)
    console.log('\n4. Verificando vinculações de touros:')
    const touroLinks = await query(`
      SELECT 
        te.touro,
        a.serie,
        a.rg,
        COUNT(*) as total_transferencias
      FROM transferencias_embrioes te
      LEFT JOIN animais a ON te.touro_id = a.id
      WHERE te.touro_id IS NOT NULL
      GROUP BY te.touro, a.serie, a.rg
      ORDER BY total_transferencias DESC
    `)
    
    console.log(`   📊 Touros vinculados:`)
    touroLinks.rows.forEach((touro, index) => {
      console.log(`   ${index + 1}. "${touro.touro}" → ${touro.serie} ${touro.rg} (${touro.total_transferencias} TEs)`)
    })

    // 5. Remover vinculação incorreta do CJCA6 como touro
    console.log('\n5. Removendo CJCA6 das vinculações de touro:')
    const cjca6AsTouro = await query(`
      SELECT COUNT(*) as total
      FROM transferencias_embrioes te
      JOIN animais a ON te.touro_id = a.id
      WHERE a.serie = 'CJCA' AND a.rg = '6'
    `)
    
    if (cjca6AsTouro.rows[0].total > 0) {
      console.log(`   ❌ CJCA6 está vinculado a ${cjca6AsTouro.rows[0].total} transferências como touro`)
      
      await query(`
        UPDATE transferencias_embrioes 
        SET touro_id = NULL, updated_at = NOW()
        WHERE touro_id = (SELECT id FROM animais WHERE serie = 'CJCA' AND rg = '6')
      `)
      
      console.log(`   ✅ CJCA6 removido das vinculações de touro`)
    } else {
      console.log(`   ✅ CJCA6 não está vinculado como touro`)
    }

    // 6. Vincular corretamente apenas as doadoras CJCJ
    console.log('\n6. Vinculando corretamente doadoras CJCJ:')
    
    // Buscar animais CJCJ fêmeas
    const cjcjFemeas = await query(`
      SELECT id, serie, rg
      FROM animais 
      WHERE serie = 'CJCJ' 
        AND (sexo ILIKE '%fêmea%' OR sexo ILIKE '%femea%' OR sexo = 'F')
      ORDER BY CAST(rg AS INTEGER)
    `)
    
    console.log(`   📊 Encontradas ${cjcjFemeas.rows.length} fêmeas CJCJ`)
    
    let correcoesCJCJ = 0
    
    for (const femea of cjcjFemeas.rows) {
      // Buscar transferências que correspondem a esta fêmea CJCJ
      const transferencias = await query(`
        SELECT id, doadora_nome
        FROM transferencias_embrioes 
        WHERE doadora_id IS NULL 
          AND doadora_nome ILIKE '%CJCJ%'
          AND (
            doadora_nome ILIKE '%${femea.rg}%'
            OR doadora_nome ILIKE '%CJCJ (RG: ${femea.rg})%'
          )
      `)
      
      if (transferencias.rows.length > 0) {
        console.log(`   🔗 Vinculando CJCJ ${femea.rg} a ${transferencias.rows.length} transferências`)
        
        for (const te of transferencias.rows) {
          await query(`
            UPDATE transferencias_embrioes 
            SET doadora_id = $1, updated_at = NOW()
            WHERE id = $2
          `, [femea.id, te.id])
        }
        
        correcoesCJCJ += transferencias.rows.length
      }
    }
    
    console.log(`   ✅ ${correcoesCJCJ} transferências vinculadas a doadoras CJCJ`)

    // 7. Verificação final
    console.log('\n7. Verificação final:')
    
    // CJCA6 prenhezes
    const cjca6Final = await query(`
      SELECT COUNT(*) as prenhezes
      FROM transferencias_embrioes 
      WHERE touro_id = (SELECT id FROM animais WHERE serie = 'CJCA' AND rg = '6')
    `)
    
    console.log(`   📊 CJCA6 prenhezes como touro: ${cjca6Final.rows[0].prenhezes}`)
    
    // Doadoras CJCJ
    const cjcjDoadoras = await query(`
      SELECT 
        a.serie,
        a.rg,
        COUNT(te.id) as transferencias
      FROM animais a
      LEFT JOIN transferencias_embrioes te ON a.id = te.doadora_id
      WHERE a.serie = 'CJCJ' AND (a.sexo ILIKE '%fêmea%' OR a.sexo ILIKE '%femea%' OR a.sexo = 'F')
      GROUP BY a.serie, a.rg
      HAVING COUNT(te.id) > 0
      ORDER BY transferencias DESC
    `)
    
    console.log(`   📊 Doadoras CJCJ com transferências:`)
    cjcjDoadoras.rows.forEach((doadora, index) => {
      console.log(`   ${index + 1}. CJCJ ${doadora.rg}: ${doadora.transferencias} transferências`)
    })

    // Resumo geral
    const resumoFinal = await query(`
      SELECT 
        COUNT(*) as total_transferencias,
        COUNT(touro_id) as touros_vinculados,
        COUNT(doadora_id) as doadoras_vinculadas
      FROM transferencias_embrioes
    `)
    
    const stats = resumoFinal.rows[0]
    console.log(`\n📊 Resumo final:`)
    console.log(`   Total de transferências: ${stats.total_transferencias}`)
    console.log(`   Touros vinculados: ${stats.touros_vinculados}`)
    console.log(`   Doadoras vinculadas: ${stats.doadoras_vinculadas}`)

    console.log('\n✅ Correção concluída!')
    console.log('\n💡 Resultado esperado:')
    console.log('- CJCA6 não deve ter prenhezes ativas (não é touro reprodutor)')
    console.log('- Apenas doadoras CJCJ devem estar vinculadas às transferências')
    console.log('- Atualize a página do CJCA6 para confirmar')

  } catch (error) {
    console.error('❌ Erro durante correção:', error)
  }
}

// Executar
fixCorrectDoadoras()
  .then(() => {
    console.log('\n🎯 CORREÇÃO DE DOADORAS CONCLUÍDA')
    process.exit(0)
  })
  .catch(error => {
    console.error('Erro:', error)
    process.exit(1)
  })