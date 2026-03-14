#!/usr/bin/env node

/**
 * Script para verificar e corrigir o campo receptora de todos os animais CJCC
 */

const { query } = require('./lib/database')

// Mapeamento baseado na planilha original
const receptoraPorAnimal = {
  '1': 'RZE72304',
  '2': 'RZE72305',
  '3': 'RZE72306',
  '4': 'RZE72307',
  '5': 'RZE72308',
  '6': 'RZE72309',
  '7': 'RZE72310',
  '8': 'RZE72311',
  '9': 'RZE72312',
  '10': 'RZE72313',
  '11': 'RZE72314',
  '12': 'RZE72315',
  '13': 'RZE72316',
  '14': 'RZE72317',
  '15': 'RZE72318',
  // Adicione mais conforme necessário
}

async function fixAllCJCCReceptora() {
  console.log('🔍 Verificando todos os animais CJCC sem receptora...\n')

  try {
    // 1. Buscar todos os animais CJCC
    console.log('1. Buscando todos os animais CJCC:')
    const allCJCC = await query(`
      SELECT id, serie, rg, receptora, created_at
      FROM animais 
      WHERE serie = 'CJCC'
      ORDER BY CAST(rg AS INTEGER)
    `)
    
    if (allCJCC.rows.length === 0) {
      console.log('   ❌ Nenhum animal CJCC encontrado')
      return
    }

    console.log(`   ✅ Encontrados ${allCJCC.rows.length} animais CJCC:`)
    
    const animaisSemReceptora = []
    const animaisComReceptora = []
    
    allCJCC.rows.forEach((animal, index) => {
      const temReceptora = animal.receptora && animal.receptora.trim() !== ''
      console.log(`   ${index + 1}. CJCC ${animal.rg} - Receptora: "${animal.receptora || 'VAZIO'}" ${temReceptora ? '✅' : '❌'}`)
      
      if (temReceptora) {
        animaisComReceptora.push(animal)
      } else {
        animaisSemReceptora.push(animal)
      }
    })

    console.log(`\n📊 Resumo:`)
    console.log(`   ✅ Com receptora: ${animaisComReceptora.length}`)
    console.log(`   ❌ Sem receptora: ${animaisSemReceptora.length}`)

    if (animaisSemReceptora.length === 0) {
      console.log('\n🎉 Todos os animais CJCC já têm receptora preenchida!')
      return
    }

    // 2. Verificar se temos dados para corrigir
    console.log('\n2. Verificando dados disponíveis para correção:')
    const animaisParaCorrigir = []
    
    animaisSemReceptora.forEach(animal => {
      const receptoraSugerida = receptoraPorAnimal[animal.rg]
      if (receptoraSugerida) {
        animaisParaCorrigir.push({
          ...animal,
          receptoraSugerida
        })
        console.log(`   ✅ CJCC ${animal.rg} → ${receptoraSugerida}`)
      } else {
        console.log(`   ⚠️ CJCC ${animal.rg} → Dados não disponíveis (precisa ser adicionado manualmente)`)
      }
    })

    if (animaisParaCorrigir.length === 0) {
      console.log('\n⚠️ Nenhum animal tem dados de receptora disponíveis para correção automática')
      console.log('💡 Você precisa fornecer os dados da receptora para cada animal')
      return
    }

    // 3. Corrigir animais com dados disponíveis
    console.log(`\n3. Corrigindo ${animaisParaCorrigir.length} animais:`)
    
    for (const animal of animaisParaCorrigir) {
      try {
        const updateResult = await query(`
          UPDATE animais 
          SET receptora = $1, updated_at = NOW()
          WHERE id = $2
          RETURNING id, serie, rg, receptora
        `, [animal.receptoraSugerida, animal.id])

        if (updateResult.rows.length > 0) {
          const updated = updateResult.rows[0]
          console.log(`   ✅ CJCC ${updated.rg} atualizado: "${updated.receptora}"`)
        }
      } catch (error) {
        console.error(`   ❌ Erro ao atualizar CJCC ${animal.rg}:`, error.message)
      }
    }

    // 4. Verificação final
    console.log('\n4. Verificação final:')
    const finalCheck = await query(`
      SELECT id, serie, rg, receptora
      FROM animais 
      WHERE serie = 'CJCC'
      ORDER BY CAST(rg AS INTEGER)
    `)
    
    let corrigidos = 0
    let aindaSemReceptora = 0
    
    finalCheck.rows.forEach(animal => {
      const temReceptora = animal.receptora && animal.receptora.trim() !== ''
      if (temReceptora) {
        corrigidos++
        console.log(`   ✅ CJCC ${animal.rg}: "${animal.receptora}"`)
      } else {
        aindaSemReceptora++
        console.log(`   ❌ CJCC ${animal.rg}: Ainda sem receptora`)
      }
    })

    console.log('\n📊 Resultado final:')
    console.log(`   ✅ Animais com receptora: ${corrigidos}`)
    console.log(`   ❌ Animais ainda sem receptora: ${aindaSemReceptora}`)

    if (aindaSemReceptora > 0) {
      console.log('\n💡 Para corrigir os animais restantes:')
      console.log('1. Consulte a planilha original de importação')
      console.log('2. Adicione os dados no objeto "receptoraPorAnimal" neste script')
      console.log('3. Execute o script novamente')
    } else {
      console.log('\n🎉 Todos os animais CJCC agora têm receptora preenchida!')
    }

  } catch (error) {
    console.error('❌ Erro durante verificação:', error)
  }
}

// Executar
fixAllCJCCReceptora()
  .then(() => {
    console.log('\n✅ Verificação concluída!')
    process.exit(0)
  })
  .catch(error => {
    console.error('Erro:', error)
    process.exit(1)
  })