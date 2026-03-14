#!/usr/bin/env node

/**
 * Script para corrigir a vinculação das prenhezes do CJCA6
 */

const { query } = require('./lib/database')

async function fixCJCA6Prenhezes() {
  console.log('�Ÿ”� Corrigindo vinculação das prenhezes do CJCA6...\n')

  try {
    // 1. Buscar animal CJCA6
    console.log('1. Buscando animal CJCA6:')
    const cjca6 = await query(`
      SELECT id, serie, rg, nome, sexo
      FROM animais 
      WHERE serie = 'CJCA' AND rg = '6'
      ORDER BY id DESC
      LIMIT 1
    `)
    
    if (cjca6.rows.length === 0) {
      console.log('   �Œ Animal CJCA6 não encontrado')
      return
    }

    const animal = cjca6.rows[0]
    console.log(`   �œ… Animal encontrado: ID ${animal.id} - ${animal.serie} ${animal.rg}`)

    // 2. Verificar se CJCA6 deveria ser vinculado a algum touro específico
    console.log('\n2. Analisando touros nas transferências:')
    const tourosUnicos = await query(`
      SELECT DISTINCT touro, COUNT(*) as total_transferencias
      FROM transferencias_embrioes 
      WHERE touro IS NOT NULL AND touro != ''
      GROUP BY touro
      ORDER BY total_transferencias DESC
    `)
    
    console.log(`   �Ÿ“Š Touros únicos encontrados: ${tourosUnicos.rows.length}`)
    tourosUnicos.rows.slice(0, 10).forEach((touro, index) => {
      console.log(`   ${index + 1}. ${touro.touro} (${touro.total_transferencias} transferências)`)
    })

    // 3. Verificar se existe algum padrão que indique CJCA6
    console.log('\n3. Buscando padrões relacionados ao CJCA6:')
    const possiveisCJCA6 = await query(`
      SELECT DISTINCT touro, COUNT(*) as total
      FROM transferencias_embrioes 
      WHERE touro ILIKE '%CJCA%' OR touro ILIKE '%6%'
      GROUP BY touro
      ORDER BY total DESC
    `)
    
    if (possiveisCJCA6.rows.length > 0) {
      console.log(`   �œ… Possíveis correspondências encontradas:`)
      possiveisCJCA6.rows.forEach((match, index) => {
        console.log(`   ${index + 1}. "${match.touro}" (${match.total} transferências)`)
      })
    } else {
      console.log('   �Œ Nenhuma correspondência direta encontrada')
    }

    // 4. Verificar se há transferências sem touro_id definido que poderiam ser do CJCA6
    console.log('\n4. Verificando transferências sem touro_id:')
    const semTouroId = await query(`
      SELECT COUNT(*) as total
      FROM transferencias_embrioes 
      WHERE touro_id IS NULL AND touro IS NOT NULL
    `)
    
    console.log(`   �Ÿ“Š Transferências sem touro_id: ${semTouroId.rows[0].total}`)

    // 5. Propor correção baseada em análise manual
    console.log('\n5. Análise para correção:')
    console.log('   �Ÿ”� Baseado nos dados encontrados:')
    console.log('   - CJCA6 é um touro (macho)')
    console.log('   - Existem 29 transferências que deveriam estar vinculadas a ele')
    console.log('   - As transferências não têm touro_id preenchido')
    
    // Vamos verificar se algum dos touros nas transferências poderia ser o CJCA6
    const analiseDetalhada = await query(`
      SELECT touro, COUNT(*) as total,
             MIN(data_te) as primeira_te,
             MAX(data_te) as ultima_te
      FROM transferencias_embrioes 
      WHERE touro IS NOT NULL
      GROUP BY touro
      HAVING COUNT(*) >= 5  -- Touros com pelo menos 5 transferências
      ORDER BY total DESC
    `)
    
    console.log('\n   �Ÿ“Š Touros com mais transferências:')
    analiseDetalhada.rows.slice(0, 5).forEach((touro, index) => {
      console.log(`   ${index + 1}. "${touro.touro}"`)
      console.log(`      Total: ${touro.total} transferências`)
      console.log(`      Período: ${new Date(touro.primeira_te).toLocaleDateString('pt-BR')} a ${new Date(touro.ultima_te).toLocaleDateString('pt-BR')}`)
      console.log('')
    })

    // 6. Verificar se podemos identificar o CJCA6 por outros critérios
    console.log('6. Tentando identificar CJCA6 por critérios específicos:')
    
    // Buscar por padrões que possam indicar CJCA6
    const criterios = [
      "touro ILIKE '%CJCA%'",
      "touro ILIKE '%6%'",
      "touro ILIKE '%853%'", // ID do animal
    ]
    
    for (const criterio of criterios) {
      const resultado = await query(`
        SELECT touro, COUNT(*) as total
        FROM transferencias_embrioes 
        WHERE ${criterio}
        GROUP BY touro
        ORDER BY total DESC
      `)
      
      console.log(`   Critério "${criterio}": ${resultado.rows.length} resultados`)
      resultado.rows.forEach(r => {
        console.log(`     - "${r.touro}" (${r.total} transferências)`)
      })
    }

    console.log('\n�Ÿ’� RECOMENDA�‡�•ES:')
    console.log('1. Verifique manualmente qual touro nas transferências corresponde ao CJCA6')
    console.log('2. Uma vez identificado, execute UPDATE para vincular o touro_id')
    console.log('3. Exemplo de comando:')
    console.log('   UPDATE transferencias_embrioes SET touro_id = 853 WHERE touro = \'NOME_DO_TOURO_CORRETO\'')
    
    console.log('\n�œ… Análise concluída!')

  } catch (error) {
    console.error('�Œ Erro durante análise:', error)
  }
}

// Executar
fixCJCA6Prenhezes()
  .then(() => {
    console.log('\n�ŸŽ� PR�“XIMO PASSO: Identificar manualmente o touro correto e executar a correção')
    process.exit(0)
  })
  .catch(error => {
    console.error('Erro:', error)
    process.exit(1)
  })