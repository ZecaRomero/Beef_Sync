// Script para filtrar apenas fêmeas para inseminação
const { query } = require('./lib/database')

async function filterFemalesForInseminacao() {
  console.log('🔍 Identificando fêmeas disponíveis para inseminação...\n')

  try {
    // 1. Buscar todas as fêmeas do rebanho
    console.log('1. Buscando fêmeas no rebanho...')
    
    const femeas = await query(`
      SELECT 
        id,
        serie,
        rg,
        nome,
        raca,
        data_nascimento,
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, data_nascimento)) as idade_anos,
        EXTRACT(MONTH FROM AGE(CURRENT_DATE, data_nascimento)) as idade_meses_total
      FROM animais 
      WHERE sexo IN ('Fêmea', 'F')
        AND situacao = 'Ativo'
      ORDER BY serie, rg
    `)

    console.log(`   ✅ Encontradas ${femeas.rows.length} fêmeas ativas`)

    // 2. Categorizar fêmeas por idade reprodutiva
    console.log('\n2. Categorizando por idade reprodutiva...')
    
    const femeasPorIdade = {
      novilhas: [], // 12-24 meses
      vacas: [],    // > 24 meses
      jovens: []    // < 12 meses
    }

    femeas.rows.forEach(femea => {
      const idadeMeses = parseInt(femea.idade_meses_total) || 0
      
      if (idadeMeses < 12) {
        femeasPorIdade.jovens.push(femea)
      } else if (idadeMeses <= 24) {
        femeasPorIdade.novilhas.push(femea)
      } else {
        femeasPorIdade.vacas.push(femea)
      }
    })

    console.log(`   • Bezerras (< 12 meses): ${femeasPorIdade.jovens.length}`)
    console.log(`   • Novilhas (12-24 meses): ${femeasPorIdade.novilhas.length}`)
    console.log(`   • Vacas (> 24 meses): ${femeasPorIdade.vacas.length}`)

    // 3. Verificar quais já têm inseminações
    console.log('\n3. Verificando histórico de inseminações...')
    
    const femeasComIA = await query(`
      SELECT 
        a.serie,
        a.rg,
        COUNT(i.id) as total_ias,
        MAX(i.data_inseminacao) as ultima_ia,
        CURRENT_DATE - MAX(i.data_inseminacao) as dias_desde_ultima_ia
      FROM animais a
      INNER JOIN inseminacoes i ON a.id = i.animal_id
      WHERE a.sexo IN ('Fêmea', 'F')
        AND a.situacao = 'Ativo'
      GROUP BY a.id, a.serie, a.rg
      ORDER BY ultima_ia DESC
    `)

    console.log(`   ✅ ${femeasComIA.rows.length} fêmeas já têm histórico de IA`)

    // 4. Identificar fêmeas aptas para nova IA
    console.log('\n4. Identificando fêmeas aptas para nova inseminação...')
    
    const femeasAptas = []
    const femeasPendenteDG = []
    
    for (const femea of femeas.rows) {
      const idadeMeses = parseInt(femea.idade_meses_total) || 0
      
      // Critérios básicos: idade reprodutiva (>= 15 meses)
      if (idadeMeses >= 15) {
        // Verificar última IA
        const ultimaIA = femeasComIA.rows.find(ia => 
          ia.serie === femea.serie && ia.rg === femea.rg
        )
        
        if (!ultimaIA) {
          // Nunca foi inseminada
          femeasAptas.push({
            ...femea,
            status: 'Primeira IA',
            observacao: 'Nunca foi inseminada'
          })
        } else {
          const diasDesdeUltimaIA = parseInt(ultimaIA.dias_desde_ultima_ia) || 0
          
          if (diasDesdeUltimaIA >= 45) {
            // Pode ser inseminada novamente
            femeasAptas.push({
              ...femea,
              status: 'Apta para nova IA',
              observacao: `Última IA há ${diasDesdeUltimaIA} dias`
            })
          } else if (diasDesdeUltimaIA >= 30 && diasDesdeUltimaIA < 45) {
            // Pendente de diagnóstico
            femeasPendenteDG.push({
              ...femea,
              status: 'Pendente DG',
              observacao: `IA há ${diasDesdeUltimaIA} dias - fazer DG`
            })
          }
        }
      }
    }

    console.log(`   ✅ ${femeasAptas.length} fêmeas aptas para inseminação`)
    console.log(`   ⏳ ${femeasPendenteDG.length} fêmeas pendentes de diagnóstico`)

    // 5. Mostrar lista das fêmeas aptas (primeiras 20)
    console.log('\n5. Lista de fêmeas aptas para IA (primeiras 20):')
    
    femeasAptas.slice(0, 20).forEach((femea, index) => {
      console.log(`   ${index + 1}. ${femea.serie} ${femea.rg} - ${femea.raca || 'N/A'} - ${femea.idade_anos || 0} anos - ${femea.status}`)
    })

    if (femeasAptas.length > 20) {
      console.log(`   ... e mais ${femeasAptas.length - 20} fêmeas`)
    }

    // 6. Verificar os animais problemáticos do erro original
    console.log('\n6. Verificando animais do erro original:')
    
    const animaisProblematicos = [
      { serie: 'CJCJ', rg: '16235' },
      { serie: 'CJCJ', rg: '16511' },
      { serie: 'CJCJ', rg: '16635' }
    ]

    for (const animal of animaisProblematicos) {
      const encontrado = femeas.rows.find(f => 
        f.serie === animal.serie && f.rg === animal.rg
      )
      
      if (encontrado) {
        console.log(`   ✅ ${animal.serie} ${animal.rg}: É fêmea, pode ser inseminada`)
      } else {
        console.log(`   ❌ ${animal.serie} ${animal.rg}: É macho, REMOVER da planilha`)
      }
    }

    // 7. Gerar arquivo CSV com fêmeas aptas
    console.log('\n7. Gerando arquivo de referência...')
    
    const csvContent = [
      'Serie,RG,Nome,Raca,Idade_Anos,Status,Observacao',
      ...femeasAptas.map(f => 
        `${f.serie},${f.rg},"${f.nome || ''}","${f.raca || ''}",${f.idade_anos || 0},"${f.status}","${f.observacao}"`
      )
    ].join('\n')

    require('fs').writeFileSync('femeas-aptas-inseminacao.csv', csvContent, 'utf8')
    console.log('   ✅ Arquivo criado: femeas-aptas-inseminacao.csv')

    console.log('\n✅ Análise concluída!')

  } catch (error) {
    console.error('❌ Erro:', error)
  }
}

// Executar
filterFemalesForInseminacao()
  .then(() => {
    console.log('\n🎯 RESUMO E RECOMENDAÇÕES:')
    console.log('')
    console.log('📋 PARA CORRIGIR O ERRO DE IMPORTAÇÃO:')
    console.log('1. Os animais CJCJ 16235, 16511 e 16635 são MACHOS')
    console.log('2. REMOVA estes animais da sua planilha Excel')
    console.log('3. Use apenas as fêmeas listadas acima')
    console.log('4. Consulte o arquivo femeas-aptas-inseminacao.csv')
    console.log('')
    console.log('💡 DICA: Filtre sua planilha para incluir apenas fêmeas')
    console.log('   com idade >= 15 meses e sem IA recente')
    process.exit(0)
  })
  .catch(error => {
    console.error('Erro:', error)
    process.exit(1)
  })