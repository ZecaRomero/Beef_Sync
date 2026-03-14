#!/usr/bin/env node

/**
 * Script para debugar e limpar completamente as prenhezes do CJCA6
 */

const { query } = require('./lib/database')

async function debugCJCA6Final() {
  console.log('�Ÿ”� Debug final do CJCA6 - Verificação completa...\n')

  try {
    // 1. Verificar dados do CJCA6
    console.log('1. Dados do animal CJCA6:')
    const cjca6 = await query(`
      SELECT id, serie, rg, nome, sexo
      FROM animais 
      WHERE serie = 'CJCA' AND rg = '6'
    `)
    
    if (cjca6.rows.length === 0) {
      console.log('   �Œ CJCA6 não encontrado!')
      return
    }

    const animal = cjca6.rows[0]
    console.log(`   �œ… Animal: ID ${animal.id}, ${animal.serie} ${animal.rg}, Sexo: ${animal.sexo}`)

    // 2. Verificar TODAS as formas que o CJCA6 pode estar vinculado
    console.log('\n2. Verificando TODAS as vinculações do CJCA6:')
    
    // Como touro_id
    const comoTouro = await query(`
      SELECT COUNT(*) as total, 'touro_id' as tipo
      FROM transferencias_embrioes 
      WHERE touro_id = $1
    `, [animal.id])
    
    console.log(`   �Ÿ“Š Como touro_id: ${comoTouro.rows[0].total}`)

    // Como doadora_id
    const comoDoadora = await query(`
      SELECT COUNT(*) as total, 'doadora_id' as tipo
      FROM transferencias_embrioes 
      WHERE doadora_id = $1
    `, [animal.id])
    
    console.log(`   �Ÿ“Š Como doadora_id: ${comoDoadora.rows[0].total}`)

    // Como receptora_id
    const comoReceptora = await query(`
      SELECT COUNT(*) as total, 'receptora_id' as tipo
      FROM transferencias_embrioes 
      WHERE receptora_id = $1
    `, [animal.id])
    
    console.log(`   �Ÿ“Š Como receptora_id: ${comoReceptora.rows[0].total}`)

    // 3. Verificar por nome/texto
    console.log('\n3. Verificando por nome/texto:')
    
    const porNomeTouro = await query(`
      SELECT COUNT(*) as total
      FROM transferencias_embrioes 
      WHERE touro ILIKE '%CJCA%6%' OR touro ILIKE '%853%'
    `)
    
    console.log(`   �Ÿ“Š Por nome no campo touro: ${porNomeTouro.rows[0].total}`)

    const porNomeDoadora = await query(`
      SELECT COUNT(*) as total
      FROM transferencias_embrioes 
      WHERE doadora_nome ILIKE '%CJCA%6%' OR doadora_nome ILIKE '%853%'
    `)
    
    console.log(`   �Ÿ“Š Por nome no campo doadora_nome: ${porNomeDoadora.rows[0].total}`)

    const porNomeReceptora = await query(`
      SELECT COUNT(*) as total
      FROM transferencias_embrioes 
      WHERE receptora_nome ILIKE '%CJCA%6%' OR receptora_nome ILIKE '%853%'
    `)
    
    console.log(`   �Ÿ“Š Por nome no campo receptora_nome: ${porNomeReceptora.rows[0].total}`)

    // 4. Listar TODAS as transferências que podem estar relacionadas
    console.log('\n4. Listando transferências relacionadas:')
    
    const todasRelacionadas = await query(`
      SELECT id, touro, doadora_nome, receptora_nome, touro_id, doadora_id, receptora_id, status
      FROM transferencias_embrioes 
      WHERE touro_id = $1 
         OR doadora_id = $1 
         OR receptora_id = $1
         OR touro ILIKE '%CJCA%6%' 
         OR touro ILIKE '%853%'
         OR doadora_nome ILIKE '%CJCA%6%' 
         OR doadora_nome ILIKE '%853%'
         OR receptora_nome ILIKE '%CJCA%6%' 
         OR receptora_nome ILIKE '%853%'
    `, [animal.id])
    
    if (todasRelacionadas.rows.length > 0) {
      console.log(`   �Œ Encontradas ${todasRelacionadas.rows.length} transferências relacionadas:`)
      todasRelacionadas.rows.forEach((te, index) => {
        console.log(`   ${index + 1}. ID: ${te.id}`)
        console.log(`      Touro: "${te.touro}" (ID: ${te.touro_id})`)
        console.log(`      Doadora: "${te.doadora_nome}" (ID: ${te.doadora_id})`)
        console.log(`      Receptora: "${te.receptora_nome}" (ID: ${te.receptora_id})`)
        console.log(`      Status: ${te.status}`)
        console.log('')
      })
    } else {
      console.log(`   �œ… Nenhuma transferência relacionada encontrada`)
    }

    // 5. LIMPEZA FOR�‡ADA - Remover TODAS as vinculações
    if (todasRelacionadas.rows.length > 0) {
      console.log('5. LIMPEZA FOR�‡ADA - Removendo TODAS as vinculações:')
      
      // Remover por ID
      await query(`
        UPDATE transferencias_embrioes 
        SET touro_id = NULL, updated_at = NOW()
        WHERE touro_id = $1
      `, [animal.id])
      
      await query(`
        UPDATE transferencias_embrioes 
        SET doadora_id = NULL, updated_at = NOW()
        WHERE doadora_id = $1
      `, [animal.id])
      
      await query(`
        UPDATE transferencias_embrioes 
        SET receptora_id = NULL, updated_at = NOW()
        WHERE receptora_id = $1
      `, [animal.id])
      
      console.log(`   �œ… Vinculações por ID removidas`)
      
      // Remover por nome (se houver)
      const nomeUpdates = await query(`
        UPDATE transferencias_embrioes 
        SET touro = CASE 
          WHEN touro ILIKE '%CJCA%6%' OR touro ILIKE '%853%' THEN NULL 
          ELSE touro 
        END,
        doadora_nome = CASE 
          WHEN doadora_nome ILIKE '%CJCA%6%' OR doadora_nome ILIKE '%853%' THEN NULL 
          ELSE doadora_nome 
        END,
        receptora_nome = CASE 
          WHEN receptora_nome ILIKE '%CJCA%6%' OR receptora_nome ILIKE '%853%' THEN NULL 
          ELSE receptora_nome 
        END,
        updated_at = NOW()
        WHERE touro ILIKE '%CJCA%6%' 
           OR touro ILIKE '%853%'
           OR doadora_nome ILIKE '%CJCA%6%' 
           OR doadora_nome ILIKE '%853%'
           OR receptora_nome ILIKE '%CJCA%6%' 
           OR receptora_nome ILIKE '%853%'
        RETURNING id
      `)
      
      console.log(`   �œ… ${nomeUpdates.rows.length} registros de nome atualizados`)
    }

    // 6. Verificação final
    console.log('\n6. Verificação final:')
    
    const verificacaoFinal = await query(`
      SELECT COUNT(*) as total
      FROM transferencias_embrioes 
      WHERE touro_id = $1 
         OR doadora_id = $1 
         OR receptora_id = $1
         OR touro ILIKE '%CJCA%6%' 
         OR touro ILIKE '%853%'
         OR doadora_nome ILIKE '%CJCA%6%' 
         OR doadora_nome ILIKE '%853%'
         OR receptora_nome ILIKE '%CJCA%6%' 
         OR receptora_nome ILIKE '%853%'
    `, [animal.id])
    
    console.log(`   �Ÿ“Š Transferências ainda relacionadas: ${verificacaoFinal.rows[0].total}`)

    // 7. Testar a API como o frontend faria
    console.log('\n7. Simulando busca da API:')
    
    // Simular a busca que a API faz
    const searchTerm = animal.rg || animal.nome
    console.log(`   �Ÿ”� Termo de busca: "${searchTerm}"`)
    
    const apiSimulation = await query(`
      SELECT * FROM transferencias_embrioes 
      WHERE touro ILIKE '%${searchTerm}%'
      ORDER BY data_te DESC
    `)
    
    console.log(`   �Ÿ“Š Resultados da simulação API: ${apiSimulation.rows.length}`)
    
    if (apiSimulation.rows.length > 0) {
      console.log(`   �Œ A API ainda encontraria ${apiSimulation.rows.length} transferências!`)
      apiSimulation.rows.forEach((te, index) => {
        console.log(`   ${index + 1}. "${te.touro}" - Status: ${te.status}`)
      })
    } else {
      console.log(`   �œ… A API não encontraria nenhuma transferência`)
    }

    // 8. Verificar cache/sessão
    console.log('\n8. Recomendações para limpeza de cache:')
    console.log('   �Ÿ”„ Limpe o cache do navegador (Ctrl+Shift+Del)')
    console.log('   �Ÿ”„ Faça um hard refresh (Ctrl+F5)')
    console.log('   �Ÿ”„ Abra uma aba anônima/privada')
    console.log('   �Ÿ”„ Reinicie o servidor se necessário')

    console.log('\n�œ… Debug concluído!')

  } catch (error) {
    console.error('�Œ Erro durante debug:', error)
  }
}

// Executar
debugCJCA6Final()
  .then(() => {
    console.log('\n�ŸŽ� DEBUG FINAL CONCLUÍDO')
    process.exit(0)
  })
  .catch(error => {
    console.error('Erro:', error)
    process.exit(1)
  })