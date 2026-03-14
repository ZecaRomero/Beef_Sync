// Relat√≥rio detalhado dos erros de importa√ß√£o de insemina√ß√£o
const { query } = require('./lib/database')

async function gerarRelatorioErros() {
  console.log('≈∏‚Äú‚Äπ RELAT√‚ÄúRIO DETALHADO DOS ERROS DE IMPORTA√‚Ä°√∆íO - INSEMINA√‚Ä°√∆íO ARTIFICIAL')
  console.log('=' .repeat(80))
  console.log('')

  try {
    // 1. Analisar os animais espec√≠ficos mencionados nos erros
    console.log('≈∏‚Äùç 1. AN√ÅLISE DOS ANIMAIS COM ERRO')
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
          
          // Verificar se j√° tem insemina√ß√µes
          const iaResult = await query(`
            SELECT COUNT(*) as total_ias, MAX(data_inseminacao) as ultima_ia
            FROM inseminacoes 
            WHERE animal_id = $1
          `, [animal.id])

          const problema = []
          const solucao = []

          // Identificar problemas
          if (animal.sexo === 'Macho' || animal.sexo === 'M') {
            problema.push('‚ù≈í SEXO: √‚Ä∞ MACHO (n√£o pode ser inseminado)')
            solucao.push('‚‚Ç¨¢ Remover da planilha de IA')
            solucao.push('‚‚Ç¨¢ Ou corrigir sexo se estiver incorreto')
          } else if (animal.sexo === 'F√™mea' || animal.sexo === 'F') {
            problema.push('‚≈ì‚Ä¶ SEXO: √‚Ä∞ F√≈†MEA (pode ser inseminada)')
          } else {
            problema.push(`‚≈°†Ô∏è SEXO: "${animal.sexo}" (n√£o reconhecido)`)
            solucao.push('‚‚Ç¨¢ Padronizar sexo para "Macho" ou "F√™mea"')
          }

          if (animal.situacao !== 'Ativo') {
            problema.push(`‚≈°†Ô∏è SITUA√‚Ä°√∆íO: ${animal.situacao}`)
            solucao.push('‚‚Ç¨¢ Verificar se animal deve estar ativo')
          }

          const idadeMeses = parseInt(animal.idade_meses) || 0
          if (idadeMeses < 15) {
            problema.push(`‚≈°†Ô∏è IDADE: ${idadeMeses} meses (muito jovem para IA)`)
            solucao.push('‚‚Ç¨¢ Aguardar at√© 15-18 meses para primeira IA')
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
            problemas: ['‚ù≈í ANIMAL N√∆íO ENCONTRADO'],
            solucoes: ['‚‚Ç¨¢ Verificar se s√©rie e RG est√£o corretos', '‚‚Ç¨¢ Cadastrar animal se necess√°rio']
          })
        }
      } catch (error) {
        console.error(`Erro ao analisar ${animalStr}:`, error.message)
      }
    }

    // Mostrar relat√≥rio dos animais
    relatorioAnimais.forEach((item, index) => {
      console.log(`${index + 1}. ${item.animal}`)
      if (item.id) {
        console.log(`   ID: ${item.id} | Nome: ${item.nome} | Sexo: ${item.sexo}`)
        console.log(`   Ra√ßa: ${item.raca} | Idade: ${item.idade}`)
        console.log(`   Situa√ß√£o: ${item.situacao} | IAs: ${item.total_ias}`)
        if (item.ultima_ia) {
          console.log(`   √≈°ltima IA: ${new Date(item.ultima_ia).toLocaleDateString('pt-BR')}`)
        }
      }
      
      console.log('   PROBLEMAS:')
      item.problemas.forEach(p => console.log(`     ${p}`))
      
      if (item.solucoes && item.solucoes.length > 0) {
        console.log('   SOLU√‚Ä°√‚Ä¢ES:')
        item.solucoes.forEach(s => console.log(`     ${s}`))
      }
      console.log('')
    })

    // 2. Estat√≠sticas gerais
    console.log('≈∏‚Äú≈† 2. ESTAT√çSTICAS GERAIS')
    console.log('-'.repeat(50))
    
    const totalAnimais = relatorioAnimais.length
    const animaisEncontrados = relatorioAnimais.filter(a => a.id !== null).length
    const animaisNaoEncontrados = totalAnimais - animaisEncontrados
    const machos = relatorioAnimais.filter(a => a.sexo === 'Macho' || a.sexo === 'M').length
    const femeas = relatorioAnimais.filter(a => a.sexo === 'F√™mea' || a.sexo === 'F').length
    const sexoIndefinido = relatorioAnimais.filter(a => a.id && a.sexo !== 'Macho' && a.sexo !== 'M' && a.sexo !== 'F√™mea' && a.sexo !== 'F').length

    console.log(`Total de animais analisados: ${totalAnimais}`)
    console.log(`Animais encontrados no sistema: ${animaisEncontrados}`)
    console.log(`Animais N√∆íO encontrados: ${animaisNaoEncontrados}`)
    console.log(`Machos (n√£o podem ser inseminados): ${machos}`)
    console.log(`F√™meas (podem ser inseminadas): ${femeas}`)
    console.log(`Sexo indefinido: ${sexoIndefinido}`)
    console.log('')

    // 3. Verificar estrutura da tabela inseminacoes
    console.log('≈∏‚Äùß 3. VERIFICA√‚Ä°√∆íO DA ESTRUTURA DO BANCO')
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
        console.log(`  ‚≈ì‚Ä¶ ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(obrigat√≥rio)' : '(opcional)'}`)
      })
      
      if (colunas.rows.length < 15) {
        console.log('‚≈°†Ô∏è ATEN√‚Ä°√∆íO: Tabela pode estar com colunas faltando')
        console.log('   Execute: node fix-inseminacao-table.js')
      }
    } catch (error) {
      console.log('‚ù≈í ERRO: Tabela inseminacoes n√£o existe ou tem problemas')
      console.log('   Execute: node fix-inseminacao-table.js')
    }

    console.log('')

    // 4. Recomenda√ß√µes espec√≠ficas
    console.log('≈∏‚Äô° 4. RECOMENDA√‚Ä°√‚Ä¢ES ESPEC√çFICAS')
    console.log('-'.repeat(50))
    
    console.log('PARA CORRIGIR OS ERROS DE IMPORTA√‚Ä°√∆íO:')
    console.log('')
    
    console.log('A) ANIMAIS MACHOS (remover da planilha):')
    const machosParaRemover = relatorioAnimais.filter(a => a.sexo === 'Macho' || a.sexo === 'M')
    machosParaRemover.forEach(animal => {
      console.log(`   ‚ù≈í ${animal.animal} - REMOVER da planilha Excel`)
    })
    
    console.log('')
    console.log('B) ANIMAIS N√∆íO ENCONTRADOS (verificar cadastro):')
    const naoEncontrados = relatorioAnimais.filter(a => a.id === null)
    naoEncontrados.forEach(animal => {
      console.log(`   ‚ù‚Äú ${animal.animal} - Verificar se existe no sistema`)
    })
    
    console.log('')
    console.log('C) F√≈†MEAS APTAS PARA IA:')
    const femeasAptas = relatorioAnimais.filter(a => 
      (a.sexo === 'F√™mea' || a.sexo === 'F') && 
      a.id !== null &&
      a.situacao === 'Ativo'
    )
    femeasAptas.forEach(animal => {
      console.log(`   ‚≈ì‚Ä¶ ${animal.animal} - Pode ser inseminada`)
    })

    // 5. Gerar arquivo CSV com o relat√≥rio
    console.log('')
    console.log('≈∏‚Äú‚Äû 5. GERANDO ARQUIVO DE RELAT√‚ÄúRIO')
    console.log('-'.repeat(50))
    
    const csvContent = [
      'Animal,ID,Nome,Sexo,Raca,Idade,Situacao,Total_IAs,Ultima_IA,Status,Acao_Recomendada',
      ...relatorioAnimais.map(item => {
        const status = item.id === null ? 'NAO_ENCONTRADO' : 
                     (item.sexo === 'Macho' || item.sexo === 'M') ? 'MACHO_REMOVER' :
                     (item.sexo === 'F√™mea' || item.sexo === 'F') ? 'FEMEA_OK' : 'SEXO_INDEFINIDO'
        
        const acao = item.id === null ? 'Verificar cadastro' :
                    (item.sexo === 'Macho' || item.sexo === 'M') ? 'REMOVER da planilha' :
                    (item.sexo === 'F√™mea' || item.sexo === 'F') ? 'Manter na planilha' : 'Corrigir sexo'
        
        return `"${item.animal}","${item.id || ''}","${item.nome || ''}","${item.sexo || ''}","${item.raca || ''}","${item.idade || ''}","${item.situacao || ''}","${item.total_ias || 0}","${item.ultima_ia || ''}","${status}","${acao}"`
      })
    ].join('\n')

    require('fs').writeFileSync('relatorio-erros-inseminacao.csv', csvContent, 'utf8')
    console.log('‚≈ì‚Ä¶ Arquivo criado: relatorio-erros-inseminacao.csv')

    // 6. Comandos para corre√ß√£o
    console.log('')
    console.log('≈∏‚Ä∫†Ô∏è 6. COMANDOS PARA CORRE√‚Ä°√∆íO')
    console.log('-'.repeat(50))
    console.log('Execute os seguintes comandos para corrigir os problemas:')
    console.log('')
    console.log('1. Corrigir estrutura do banco:')
    console.log('   node fix-inseminacao-table.js')
    console.log('')
    console.log('2. Verificar sexo dos animais:')
    console.log('   node check-animal-genders.js')
    console.log('')
    console.log('3. Gerar lista de f√™meas aptas:')
    console.log('   node filter-females-for-inseminacao.js')
    console.log('')

    console.log('‚≈ì‚Ä¶ RELAT√‚ÄúRIO CONCLU√çDO!')

  } catch (error) {
    console.error('‚ù≈í Erro ao gerar relat√≥rio:', error)
  }
}

// Executar
gerarRelatorioErros()
  .then(() => {
    console.log('')
    console.log('≈∏≈ΩØ RESUMO EXECUTIVO:')
    console.log('‚‚Ç¨¢ Relat√≥rio detalhado gerado')
    console.log('‚‚Ç¨¢ Problemas identificados e catalogados')
    console.log('‚‚Ç¨¢ Solu√ß√µes espec√≠ficas fornecidas')
    console.log('‚‚Ç¨¢ Arquivo CSV criado para an√°lise')
    console.log('')
    console.log('≈∏‚Äú‚Äπ PR√‚ÄúXIMOS PASSOS:')
    console.log('1. Analise o arquivo relatorio-erros-inseminacao.csv')
    console.log('2. Remova os animais machos da planilha Excel')
    console.log('3. Corrija os dados conforme recomenda√ß√µes')
    console.log('4. Tente importar novamente')
    process.exit(0)
  })
  .catch(error => {
    console.error('Erro:', error)
    process.exit(1)
  })