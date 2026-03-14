#!/usr/bin/env node

/**
 * Script para corrigir a vinculação de prenhezes de todos os animais
 */

const { query } = require('./lib/database')

async function fixAllAnimalsPrenhezes() {
  console.log('�Ÿ”� Corrigindo vinculação de prenhezes de todos os animais...\n')

  try {
    // 1. Buscar todos os animais machos (touros)
    console.log('1. Buscando todos os touros no sistema:')
    const touros = await query(`
      SELECT id, serie, rg, nome, sexo
      FROM animais 
      WHERE sexo ILIKE '%macho%' OR sexo = 'M'
      ORDER BY serie, rg
    `)
    
    console.log(`   �œ… Encontrados ${touros.rows.length} touros`)

    // 2. Para cada touro, tentar encontrar correspondência nas transferências
    console.log('\n2. Analisando correspondências:')
    
    let correcoes = 0
    
    for (const touro of touros.rows) {
      const identificacao = `${touro.serie} ${touro.rg}`
      console.log(`\n   �Ÿ”� Analisando ${identificacao} (ID: ${touro.id})`)
      
      // Buscar transferências que possam corresponder a este touro
      const possiveisCorrespondencias = await query(`
        SELECT DISTINCT touro, COUNT(*) as total
        FROM transferencias_embrioes 
        WHERE touro_id IS NULL 
          AND (
            touro ILIKE '%${touro.serie}%' 
            OR touro ILIKE '%${touro.rg}%'
            OR touro ILIKE '%${identificacao}%'
          )
        GROUP BY touro
        ORDER BY total DESC
      `)
      
      if (possiveisCorrespondencias.rows.length > 0) {
        console.log(`      �œ… Possíveis correspondências:`)
        
        for (const corresp of possiveisCorrespondencias.rows) {
          console.log(`         - "${corresp.touro}" (${corresp.total} transferências)`)
          
          // Se encontrou uma correspondência clara, fazer a correção
          if (corresp.total >= 5) { // Apenas se tiver pelo menos 5 transferências
            console.log(`         �Ÿ”� Corrigindo vinculação...`)
            
            const updateResult = await query(`
              UPDATE transferencias_embrioes 
              SET touro_id = $1, updated_at = NOW()
              WHERE touro = $2 AND touro_id IS NULL
              RETURNING id
            `, [touro.id, corresp.touro])
            
            if (updateResult.rows.length > 0) {
              console.log(`         �œ… ${updateResult.rows.length} transferências vinculadas ao ${identificacao}`)
              correcoes += updateResult.rows.length
            }
          }
        }
      } else {
        console.log(`      �Œ Nenhuma correspondência encontrada`)
      }
    }

    // 3. Buscar fêmeas (doadoras)
    console.log('\n3. Buscando todas as fêmeas (doadoras):')
    const femeas = await query(`
      SELECT id, serie, rg, nome, sexo
      FROM animais 
      WHERE sexo ILIKE '%fêmea%' OR sexo ILIKE '%femea%' OR sexo = 'F'
      ORDER BY serie, rg
    `)
    
    console.log(`   �œ… Encontradas ${femeas.rows.length} fêmeas`)

    // 4. Para cada fêmea, tentar encontrar correspondência nas transferências
    for (const femea of femeas.rows) {
      const identificacao = `${femea.serie} ${femea.rg}`
      
      // Buscar transferências que possam corresponder a esta doadora
      const possiveisCorrespondencias = await query(`
        SELECT DISTINCT doadora_nome, COUNT(*) as total
        FROM transferencias_embrioes 
        WHERE doadora_id IS NULL 
          AND (
            doadora_nome ILIKE '%${femea.serie}%' 
            OR doadora_nome ILIKE '%${femea.rg}%'
            OR doadora_nome ILIKE '%${identificacao}%'
          )
        GROUP BY doadora_nome
        ORDER BY total DESC
      `)
      
      if (possiveisCorrespondencias.rows.length > 0) {
        for (const corresp of possiveisCorrespondencias.rows) {
          if (corresp.total >= 2) { // Pelo menos 2 transferências
            const updateResult = await query(`
              UPDATE transferencias_embrioes 
              SET doadora_id = $1, updated_at = NOW()
              WHERE doadora_nome = $2 AND doadora_id IS NULL
              RETURNING id
            `, [femea.id, corresp.doadora_nome])
            
            if (updateResult.rows.length > 0) {
              console.log(`   �œ… ${updateResult.rows.length} transferências vinculadas à doadora ${identificacao}`)
              correcoes += updateResult.rows.length
            }
          }
        }
      }
    }

    // 5. Verificação final - CJCA6 especificamente
    console.log('\n5. Verificação específica do CJCA6:')
    const cjca6Check = await query(`
      SELECT COUNT(*) as prenhezes_vinculadas
      FROM transferencias_embrioes 
      WHERE touro_id = (SELECT id FROM animais WHERE serie = 'CJCA' AND rg = '6')
    `)
    
    console.log(`   �Ÿ“Š CJCA6 agora tem ${cjca6Check.rows[0].prenhezes_vinculadas} prenhezes vinculadas`)

    // 6. Resumo geral
    console.log('\n6. Resumo das correções:')
    const resumo = await query(`
      SELECT 
        COUNT(*) as total_transferencias,
        COUNT(touro_id) as touros_vinculados,
        COUNT(doadora_id) as doadoras_vinculadas,
        COUNT(*) - COUNT(touro_id) as touros_sem_vinculo,
        COUNT(*) - COUNT(doadora_id) as doadoras_sem_vinculo
      FROM transferencias_embrioes
    `)
    
    const stats = resumo.rows[0]
    console.log(`   �Ÿ“Š Total de transferências: ${stats.total_transferencias}`)
    console.log(`   �œ… Touros vinculados: ${stats.touros_vinculados}`)
    console.log(`   �œ… Doadoras vinculadas: ${stats.doadoras_vinculadas}`)
    console.log(`   �Œ Touros sem vínculo: ${stats.touros_sem_vinculo}`)
    console.log(`   �Œ Doadoras sem vínculo: ${stats.doadoras_sem_vinculo}`)
    console.log(`   �Ÿ”� Total de correções feitas: ${correcoes}`)

    console.log('\n�œ… Correção concluída!')
    
    if (stats.touros_sem_vinculo > 0 || stats.doadoras_sem_vinculo > 0) {
      console.log('\n�Ÿ’� PR�“XIMOS PASSOS:')
      console.log('1. Verifique os animais que ainda não foram vinculados')
      console.log('2. Pode ser necessário correção manual para casos específicos')
      console.log('3. Atualize a página do CJCA6 para ver as prenhezes ativas')
    }

  } catch (error) {
    console.error('�Œ Erro durante correção:', error)
  }
}

// Executar
fixAllAnimalsPrenhezes()
  .then(() => {
    console.log('\n�ŸŽ� CORRE�‡�ƒO AUTOMÁTICA CONCLUÍDA')
    process.exit(0)
  })
  .catch(error => {
    console.error('Erro:', error)
    process.exit(1)
  })