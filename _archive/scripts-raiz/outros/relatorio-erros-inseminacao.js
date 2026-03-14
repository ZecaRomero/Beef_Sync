// Relatório detalhado dos erros de importação de inseminação
const { query } = require('./lib/database')

async function gerarRelatorioErros() {
  console.log('📋 RELATÓRIO DETALHADO DOS ERROS DE IMPORTAÇÃO - INSEMINAÇÃO ARTIFICIAL')
  console.log('=' .repeat(80))
  console.log('')

  try {
    // 1. Analisar os animais específicos mencionados nos erros
    console.log('🔍 1. ANÁLISE DOS ANIMAIS COM ERRO')
    console.log('-'.repeat(50))
    
    const animaisComErro = [
      'CJCJ 19639', 'CJCJ 16235', 'CJCJ 16511', 'CJCJ 16563', 'CJCJ 19635',
      'CJCJ 16639', 'CJCJ 19631', 'CJCJ 16631', 'CJCJ 19627', 'CJCJ 16627',
      'CJCJ 19623', 'CJCJ 16623', 'CJCJ 19619', 'CJCJ 16619', 'CJCJ 19615',
      'CJCJ 16615', 'CJCJ 19611', 'CJCJ 16611', 'CJCJ 19607', 'CJCJ 16607'
    ]

    const relatorioAnimais = []
    
    for (const animalStr of animaisComErro) {
      const [serie, rg] = animalStr.split(' ')
      
      try {
        const result = await query(`
          SELECT 
            id, serie, rg, nome, sexo, raca, data_nascimento,
            situacao, pai, mae, receptora,
            EXTRACT(YEAR FROM AGE(CURRENT_DATE, data_nascimento)) as idade_anos,
            EXTRACT(MONTH FROM AGE(CURRENT_DATE, data_nascimento)) as idade_meses
          FROM animais 
          WHERE serie = $1 AND rg = $2
        `, [serie, rg])

        if (result.rows.length > 0) {
          const animal = result.rows[0]
          
          // Verificar se já tem inseminações
          const iaResult = await query(`
            SELECT COUNT(*) as total_ias, MAX(data_inseminacao) as ultima_ia
            FROM inseminacoes 
            WHERE animal_id = $1
          `, [animal.id])

          const problema = []
          const solucao = []

          // Identificar problemas
          if (animal.sexo === 'Macho' || animal.sexo === 'M') {
            problema.push('❌ SEXO: É MACHO (não pode ser inseminado)')
            solucao.push('• Remover da planilha de IA')
            solucao.push('• Ou corrigir sexo se estiver incorreto')
          } else if (animal.sexo === 'Fêmea' || animal.sexo === 'F') {
            problema.push('✅ SEXO: É FÊMEA (pode ser inseminada)')
          } else {
            problema.push(`⚠️ SEXO: "${animal.sexo}" (não reconhecido)`)
            solucao.push('• Padronizar sexo para "Macho" ou "Fêmea"')
          }

          if (animal.situacao !== 'Ativo') {
            problema.push(`⚠️ SITUAÇÃO: ${animal.situacao}`)
            solucao.push('• Verificar se animal deve estar ativo')
          }

          const idadeMeses = parseInt(animal.idade_meses) || 0
          if (idadeMeses < 15) {
            problema.push(`⚠️ IDADE: ${idadeMeses} meses (muito jovem para IA)`)
            solucao.push('• Aguardar até 15-18 meses para primeira IA')
          }

          relatorioAnimais.push({
            animal: `${serie} ${rg}`,
            id: animal.id,
            nome: animal.nome || 'N/A',
            sexo: animal.sexo,
            raca: animal.raca || 'N/A',
            idade: `${animal.idade_anos || 0} anos, ${idadeMeses} meses`,
            situacao: animal.situacao,
            total_ias: iaResult.rows[0].total_ias,
            ultima_ia: iaResult.rows[0].ultima_ia,
            problemas: problema,
            solucoes: solucao
          })
        } else {
          relatorioAnimais.push({
            animal: `${serie} ${rg}`,
            id: null,
            problemas: ['❌ ANIMAL NÃO ENCONTRADO'],
            solucoes: ['• Verificar se série e RG estão corretos', '• Cadastrar animal se necessário']
          })
        }
      } catch (error) {
        console.error(`Erro ao analisar ${animalStr}:`, error.message)
      }
    }

    // Mostrar relatório dos animais
    relatorioAnimais.forEach((item, index) => {
      console.log(`${index + 1}. ${item.animal}`)
      if (item.id) {
        console.log(`   ID: ${item.id} | Nome: ${item.nome} | Sexo: ${item.sexo}`)
        console.log(`   Raça: ${item.raca} | Idade: ${item.idade}`)
        console.log(`   Situação: ${item.situacao} | IAs: ${item.total_ias}`)
        if (item.ultima_ia) {
          console.log(`   Última IA: ${new Date(item.ultima_ia).toLocaleDateString('pt-BR')}`)
        }
      }
      
      console.log('   PROBLEMAS:')
      item.problemas.forEach(p => console.log(`     ${p}`))
      
      if (item.solucoes && item.solucoes.length > 0) {
        console.log('   SOLUÇÕES:')
        item.solucoes.forEach(s => console.log(`     ${s}`))
      }
      console.log('')
    })

    // 2. Estatísticas gerais
    console.log('📊 2. ESTATÍSTICAS GERAIS')
    console.log('-'.repeat(50))
    
    const totalAnimais = relatorioAnimais.length
    const animaisEncontrados = relatorioAnimais.filter(a => a.id !== null).length
    const animaisNaoEncontrados = totalAnimais - animaisEncontrados
    const machos = relatorioAnimais.filter(a => a.sexo === 'Macho' || a.sexo === 'M').length
    const femeas = relatorioAnimais.filter(a => a.sexo === 'Fêmea' || a.sexo === 'F').length
    const sexoIndefinido = relatorioAnimais.filter(a => a.id && a.sexo !== 'Macho' && a.sexo !== 'M' && a.sexo !== 'Fêmea' && a.sexo !== 'F').length

    console.log(`Total de animais analisados: ${totalAnimais}`)
    console.log(`Animais encontrados no sistema: ${animaisEncontrados}`)
    console.log(`Animais NÃO encontrados: ${animaisNaoEncontrados}`)
    console.log(`Machos (não podem ser inseminados): ${machos}`)
    console.log(`Fêmeas (podem ser inseminadas): ${femeas}`)
    console.log(`Sexo indefinido: ${sexoIndefinido}`)
    console.log('')

    // 3. Verificar estrutura da tabela inseminacoes
    console.log('🔧 3. VERIFICAÇÃO DA ESTRUTURA DO BANCO')
    console.log('-'.repeat(50))
    
    try {
      const colunas = await query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'inseminacoes'
        ORDER BY ordinal_position
      `)

      console.log('Colunas da tabela inseminacoes:')
      colunas.rows.forEach(col => {
        console.log(`  ✅ ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(obrigatório)' : '(opcional)'}`)
      })
      
      if (colunas.rows.length < 15) {
        console.log('⚠️ ATENÇÃO: Tabela pode estar com colunas faltando')
        console.log('   Execute: node fix-inseminacao-table.js')
      }
    } catch (error) {
      console.log('❌ ERRO: Tabela inseminacoes não existe ou tem problemas')
      console.log('   Execute: node fix-inseminacao-table.js')
    }

    console.log('')

    // 4. Recomendações específicas
    console.log('💡 4. RECOMENDAÇÕES ESPECÍFICAS')
    console.log('-'.repeat(50))
    
    console.log('PARA CORRIGIR OS ERROS DE IMPORTAÇÃO:')
    console.log('')
    
    console.log('A) ANIMAIS MACHOS (remover da planilha):')
    const machosParaRemover = relatorioAnimais.filter(a => a.sexo === 'Macho' || a.sexo === 'M')
    machosParaRemover.forEach(animal => {
      console.log(`   ❌ ${animal.animal} - REMOVER da planilha Excel`)
    })
    
    console.log('')
    console.log('B) ANIMAIS NÃO ENCONTRADOS (verificar cadastro):')
    const naoEncontrados = relatorioAnimais.filter(a => a.id === null)
    naoEncontrados.forEach(animal => {
      console.log(`   ❓ ${animal.animal} - Verificar se existe no sistema`)
    })
    
    console.log('')
    console.log('C) FÊMEAS APTAS PARA IA:')
    const femeasAptas = relatorioAnimais.filter(a => 
      (a.sexo === 'Fêmea' || a.sexo === 'F') && 
      a.id !== null &&
      a.situacao === 'Ativo'
    )
    femeasAptas.forEach(animal => {
      console.log(`   ✅ ${animal.animal} - Pode ser inseminada`)
    })

    // 5. Gerar arquivo CSV com o relatório
    console.log('')
    console.log('📄 5. GERANDO ARQUIVO DE RELATÓRIO')
    console.log('-'.repeat(50))
    
    const csvContent = [
      'Animal,ID,Nome,Sexo,Raca,Idade,Situacao,Total_IAs,Ultima_IA,Status,Acao_Recomendada',
      ...relatorioAnimais.map(item => {
        const status = item.id === null ? 'NAO_ENCONTRADO' : 
                     (item.sexo === 'Macho' || item.sexo === 'M') ? 'MACHO_REMOVER' :
                     (item.sexo === 'Fêmea' || item.sexo === 'F') ? 'FEMEA_OK' : 'SEXO_INDEFINIDO'
        
        const acao = item.id === null ? 'Verificar cadastro' :
                    (item.sexo === 'Macho' || item.sexo === 'M') ? 'REMOVER da planilha' :
                    (item.sexo === 'Fêmea' || item.sexo === 'F') ? 'Manter na planilha' : 'Corrigir sexo'
        
        return `"${item.animal}","${item.id || ''}","${item.nome || ''}","${item.sexo || ''}","${item.raca || ''}","${item.idade || ''}","${item.situacao || ''}","${item.total_ias || 0}","${item.ultima_ia || ''}","${status}","${acao}"`
      })
    ].join('\n')

    require('fs').writeFileSync('relatorio-erros-inseminacao.csv', csvContent, 'utf8')
    console.log('✅ Arquivo criado: relatorio-erros-inseminacao.csv')

    // 6. Comandos para correção
    console.log('')
    console.log('🛠️ 6. COMANDOS PARA CORREÇÃO')
    console.log('-'.repeat(50))
    console.log('Execute os seguintes comandos para corrigir os problemas:')
    console.log('')
    console.log('1. Corrigir estrutura do banco:')
    console.log('   node fix-inseminacao-table.js')
    console.log('')
    console.log('2. Verificar sexo dos animais:')
    console.log('   node check-animal-genders.js')
    console.log('')
    console.log('3. Gerar lista de fêmeas aptas:')
    console.log('   node filter-females-for-inseminacao.js')
    console.log('')

    console.log('✅ RELATÓRIO CONCLUÍDO!')

  } catch (error) {
    console.error('❌ Erro ao gerar relatório:', error)
  }
}

// Executar
gerarRelatorioErros()
  .then(() => {
    console.log('')
    console.log('🎯 RESUMO EXECUTIVO:')
    console.log('• Relatório detalhado gerado')
    console.log('• Problemas identificados e catalogados')
    console.log('• Soluções específicas fornecidas')
    console.log('• Arquivo CSV criado para análise')
    console.log('')
    console.log('📋 PRÓXIMOS PASSOS:')
    console.log('1. Analise o arquivo relatorio-erros-inseminacao.csv')
    console.log('2. Remova os animais machos da planilha Excel')
    console.log('3. Corrija os dados conforme recomendações')
    console.log('4. Tente importar novamente')
    process.exit(0)
  })
  .catch(error => {
    console.error('Erro:', error)
    process.exit(1)
  })