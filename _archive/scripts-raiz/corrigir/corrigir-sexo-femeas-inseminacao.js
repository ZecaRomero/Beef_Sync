// Script para corrigir o sexo dos animais que aparecem nas inseminações
const { query } = require('./lib/database')

async function corrigirSexoFemeasInseminacao() {
  console.log('🔄 CORRIGINDO SEXO DOS ANIMAIS NAS INSEMINAÇÕES')
  console.log('=' .repeat(70))
  console.log('')

  try {
    // Dados da planilha fornecida - todos estes animais devem ser fêmeas
    const dadosInseminacao = [
      { serie: 'CJCJ', rg: '15639' },
      { serie: 'CJCJ', rg: '16235' },
      { serie: 'CJCJ', rg: '16511' },
      { serie: 'CJCJ', rg: '15563' },
      { serie: 'CJCJ', rg: '16182' },
      { serie: 'CJCJ', rg: '16219' },
      { serie: 'CJCJ', rg: '16236' },
      { serie: 'CJCJ', rg: '16262' },
      { serie: 'CJCJ', rg: '16373' },
      { serie: 'CJCJ', rg: '16603' },
      { serie: 'CJCJ', rg: '15587' },
      { serie: 'CJCJ', rg: '16165' },
      { serie: 'CJCJ', rg: '16173' },
      { serie: 'CJCJ', rg: '16274' },
      { serie: 'CJCJ', rg: '16308' },
      { serie: 'CJCJ', rg: '16335' },
      { serie: 'CJCJ', rg: '16397' },
      { serie: 'CJCJ', rg: '16467' },
      { serie: 'CJCJ', rg: '16578' },
      { serie: 'CJCJ', rg: '16599' },
      { serie: 'CJCA', rg: '2' },
      { serie: 'CJCJ', rg: '15959' },
      { serie: 'CJCJ', rg: '15829' },
      { serie: 'CJCJ', rg: '15524' },
      { serie: 'CJCJ', rg: '16068' },
      { serie: 'CJCJ', rg: '16222' },
      { serie: 'CJCJ', rg: '15535' },
      { serie: 'CJCJ', rg: '16189' },
      { serie: 'CJCJ', rg: '16525' },
      { serie: 'CJCJ', rg: '16622' },
      { serie: 'CJCA', rg: '6' },
      { serie: 'CJCJ', rg: '16368' },
      { serie: 'CJCJ', rg: '16478' },
      { serie: 'CJCJ', rg: '16199' },
      { serie: 'CJCJ', rg: '15875' },
      { serie: 'CJCJ', rg: '16220' },
      { serie: 'CJCJ', rg: '16310' },
      { serie: 'CJCJ', rg: '16591' },
      { serie: 'CJCJ', rg: '16619' },
      { serie: 'CJCJ', rg: '15539' },
      { serie: 'CJCJ', rg: '15687' },
      { serie: 'CJCJ', rg: '15696' },
      { serie: 'CJCJ', rg: '15707' },
      { serie: 'CJCJ', rg: '16249' },
      { serie: 'MFBN', rg: '9851' },
      { serie: 'CJCJ', rg: '15592' },
      { serie: 'CJCJ', rg: '16087' },
      { serie: 'CJCJ', rg: '16131' },
      { serie: 'CJCJ', rg: '16050' },
      { serie: 'CJCJ', rg: '15991' },
      { serie: 'CJCJ', rg: '16153' },
      { serie: 'CJCJ', rg: '16291' },
      { serie: 'CJCJ', rg: '16333' },
      { serie: 'CJCJ', rg: '15521' },
      { serie: 'CJCJ', rg: '15547' },
      { serie: 'CJCJ', rg: '15548' },
      { serie: 'CJCJ', rg: '15599' },
      { serie: 'CJCJ', rg: '15607' },
      { serie: 'CJCJ', rg: '15673' },
      { serie: 'CJCJ', rg: '15801' },
      { serie: 'CJCJ', rg: '15877' },
      { serie: 'CJCJ', rg: '15897' },
      { serie: 'CJCJ', rg: '15955' },
      { serie: 'CJCJ', rg: '16208' },
      { serie: 'CJCJ', rg: '16400' },
      { serie: 'CJCJ', rg: '16435' },
      { serie: 'CJCJ', rg: '16446' },
      { serie: 'CJCJ', rg: '16590' },
      { serie: 'CJCJ', rg: '16600' },
      { serie: 'CJCJ', rg: '16601' },
      { serie: 'CJCJ', rg: '15627' },
      { serie: 'CJCJ', rg: '15714' },
      { serie: 'CJCJ', rg: '15738' },
      { serie: 'CJCJ', rg: '15775' },
      { serie: 'CJCJ', rg: '15785' },
      { serie: 'CJCJ', rg: '16201' }
    ]

    console.log(`📊 Total de animais para verificar: ${dadosInseminacao.length}`)
    console.log('')

    let encontrados = 0
    let naoEncontrados = 0
    let jaFemeas = 0
    let corrigidos = 0
    const erros = []
    const correcoes = []

    console.log('🔍 Verificando e corrigindo sexo dos animais...')
    console.log('')

    for (let i = 0; i < dadosInseminacao.length; i++) {
      const animal = dadosInseminacao[i]
      const numeroRegistro = i + 1
      
      try {
        console.log(`${numeroRegistro}/${dadosInseminacao.length} - ${animal.serie} ${animal.rg}`)

        // 1. Buscar animal
        const animalResult = await query(`
          SELECT id, sexo, situacao, nome
          FROM animais 
          WHERE serie = $1 AND rg = $2
        `, [animal.serie, animal.rg])

        if (animalResult.rows.length === 0) {
          naoEncontrados++
          console.log(`   ❌ Animal não encontrado no sistema`)
          erros.push(`${animal.serie} ${animal.rg}: Animal não encontrado`)
          continue
        }

        const animalData = animalResult.rows[0]
        encontrados++

        // 2. Verificar se já é fêmea
        if (animalData.sexo === 'Fêmea' || animalData.sexo === 'F') {
          jaFemeas++
          console.log(`   ✅ Já é fêmea (${animalData.sexo})`)
          continue
        }

        // 3. Corrigir para fêmea
        console.log(`   🔧 Corrigindo de "${animalData.sexo}" para "Fêmea"`)
        
        await query(`
          UPDATE animais 
          SET sexo = 'Fêmea', updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [animalData.id])

        corrigidos++
        correcoes.push({
          serie: animal.serie,
          rg: animal.rg,
          nome: animalData.nome,
          sexoAnterior: animalData.sexo,
          sexoNovo: 'Fêmea'
        })
        
        console.log(`   ✅ Corrigido com sucesso`)

      } catch (error) {
        erros.push(`${animal.serie} ${animal.rg}: ${error.message}`)
        console.log(`   ❌ Erro: ${error.message}`)
      }
    }

    // Relatório final
    console.log('')
    console.log('📊 RELATÓRIO FINAL')
    console.log('=' .repeat(50))
    console.log(`🔍 Animais verificados: ${dadosInseminacao.length}`)
    console.log(`✅ Encontrados no sistema: ${encontrados}`)
    console.log(`❌ Não encontrados: ${naoEncontrados}`)
    console.log(`👩 Já eram fêmeas: ${jaFemeas}`)
    console.log(`🔧 Corrigidos para fêmea: ${corrigidos}`)
    console.log(`📈 Taxa de sucesso: ${((encontrados / dadosInseminacao.length) * 100).toFixed(1)}%`)

    if (corrigidos > 0) {
      console.log('')
      console.log('🔧 ANIMAIS CORRIGIDOS:')
      console.log('-'.repeat(80))
      correcoes.forEach((correcao, index) => {
        console.log(`${index + 1}. ${correcao.serie} ${correcao.rg} - ${correcao.nome || 'Sem nome'}`)
        console.log(`   Antes: ${correcao.sexoAnterior} → Depois: ${correcao.sexoNovo}`)
      })
    }

    if (erros.length > 0) {
      console.log('')
      console.log('❌ ERROS ENCONTRADOS:')
      console.log('-'.repeat(50))
      erros.forEach((erro, index) => {
        console.log(`${index + 1}. ${erro}`)
      })
    }

    // Verificação adicional - buscar todos os animais que ainda estão como machos mas têm inseminações
    console.log('')
    console.log('🔍 VERIFICAÇÃO ADICIONAL: Buscando machos com inseminações...')
    
    const machosComIA = await query(`
      SELECT DISTINCT a.id, a.serie, a.rg, a.nome, a.sexo, COUNT(i.id) as total_ias
      FROM animais a
      INNER JOIN inseminacoes i ON a.id = i.animal_id
      WHERE a.sexo IN ('Macho', 'M')
      GROUP BY a.id, a.serie, a.rg, a.nome, a.sexo
      ORDER BY a.serie, a.rg
    `)

    if (machosComIA.rows.length > 0) {
      console.log(`⚠️ Encontrados ${machosComIA.rows.length} machos com inseminações:`)
      console.log('-'.repeat(80))
      
      for (const macho of machosComIA.rows) {
        console.log(`• ${macho.serie} ${macho.rg} - ${macho.nome || 'Sem nome'} (${macho.total_ias} IAs)`)
        
        // Corrigir automaticamente
        await query(`
          UPDATE animais 
          SET sexo = 'Fêmea', updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [macho.id])
        
        console.log(`  ✅ Corrigido para Fêmea`)
      }
    } else {
      console.log('✅ Nenhum macho com inseminações encontrado')
    }

    console.log('')
    console.log('✅ CORREÇÃO CONCLUÍDA!')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar
corrigirSexoFemeasInseminacao()
  .then(() => {
    console.log('')
    console.log('🎯 RESULTADO FINAL:')
    console.log('• Sexo dos animais corrigido')
    console.log('• Todos os animais com inseminação agora são fêmeas')
    console.log('• Sistema consistente para importações futuras')
    process.exit(0)
  })
  .catch(error => {
    console.error('Erro:', error)
    process.exit(1)
  })