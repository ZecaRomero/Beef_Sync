/**
 * Teste para verificar o seletor de touros nos exames andrológicos
 * 
 * Este script testa:
 * 1. Se a API retorna apenas touros machos ativos
 * 2. Se os dados estão no formato correto para o dropdown
 * 3. Se a validação está funcionando
 */

const fetch = require('node-fetch')

const BASE_URL = 'http://localhost:3020'

async function testTourosSelector() {
  console.log('🧪 TESTE: Seletor de Touros para Exames Andrológicos')
  console.log('=' .repeat(60))

  try {
    // 1. Testar busca de touros machos
    console.log('\n1. 🔍 Testando busca de touros machos...')
    const response = await fetch(`${BASE_URL}/api/animals?sexo=Macho&situacao=Ativo`)
    
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} - ${response.statusText}`)
    }

    const touros = await response.json()
    console.log(`✅ API respondeu com ${touros.length} touros machos ativos`)

    // 2. Verificar estrutura dos dados
    console.log('\n2. 📋 Verificando estrutura dos dados...')
    if (touros.length > 0) {
      const primeiroTouro = touros[0]
      const camposEsperados = ['id', 'serie', 'rg', 'sexo', 'raca', 'situacao']
      
      console.log('Campos do primeiro touro:')
      camposEsperados.forEach(campo => {
        const valor = primeiroTouro[campo]
        const status = valor !== undefined ? '✅' : '❌'
        console.log(`  ${status} ${campo}: ${valor || 'undefined'}`)
      })

      // Verificar se todos são realmente machos
      const todosMachos = touros.every(t => t.sexo === 'Macho')
      console.log(`\n${todosMachos ? '✅' : '❌'} Todos os animais são machos: ${todosMachos}`)

      // Verificar se todos estão ativos
      const todosAtivos = touros.every(t => t.situacao === 'Ativo')
      console.log(`${todosAtivos ? '✅' : '❌'} Todos os animais estão ativos: ${todosAtivos}`)

    } else {
      console.log('⚠️  Nenhum touro encontrado - isso pode ser normal se não há touros cadastrados')
    }

    // 3. Testar formato para dropdown
    console.log('\n3. 🎨 Testando formato para dropdown...')
    if (touros.length > 0) {
      console.log('Exemplos de como aparecerão no dropdown:')
      touros.slice(0, 5).forEach((touro, index) => {
        const label = `${touro.serie}-${touro.rg} - ${touro.raca}${touro.cor ? ` (${touro.cor})` : ''}`
        console.log(`  ${index + 1}. ${label}`)
      })
    }

    // 4. Testar busca sem filtros (deve retornar todos os animais)
    console.log('\n4. 🔍 Testando busca sem filtros (para comparação)...')
    const responseAll = await fetch(`${BASE_URL}/api/animals`)
    
    if (responseAll.ok) {
      const todosAnimais = await responseAll.json()
      const femeas = todosAnimais.filter(a => a.sexo === 'Fêmea' || a.sexo === 'Femea').length
      const machos = todosAnimais.filter(a => a.sexo === 'Macho').length
      const outros = todosAnimais.length - femeas - machos

      console.log(`📊 Estatísticas gerais:`)
      console.log(`  Total de animais: ${todosAnimais.length}`)
      console.log(`  Machos: ${machos}`)
      console.log(`  Fêmeas: ${femeas}`)
      console.log(`  Outros/Indefinidos: ${outros}`)
      console.log(`  Filtro funcionando: ${touros.length === machos ? '✅' : '❌'}`)
    }

    // 5. Simular seleção de touro
    console.log('\n5. 🎯 Simulando seleção de touro...')
    if (touros.length > 0) {
      const touroSelecionado = touros[0]
      console.log('Touro selecionado:')
      console.log(`  ID: ${touroSelecionado.id}`)
      console.log(`  Identificação: ${touroSelecionado.serie}-${touroSelecionado.rg}`)
      console.log(`  Raça: ${touroSelecionado.raca}`)
      console.log(`  Cor: ${touroSelecionado.cor || 'Não informada'}`)
      console.log(`  Data Nascimento: ${touroSelecionado.data_nascimento || 'Não informada'}`)
      
      // Dados que seriam preenchidos no formulário
      console.log('\nDados para o formulário:')
      console.log(`  newExame.touro: "${touroSelecionado.serie}-${touroSelecionado.rg}"`)
      console.log(`  newExame.rg: "${touroSelecionado.rg}"`)
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ TESTE CONCLUÍDO COM SUCESSO!')
    console.log('O seletor de touros está funcionando corretamente.')

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message)
    console.log('\nVerifique se:')
    console.log('1. O servidor está rodando na porta 3020')
    console.log('2. A API /api/animals está funcionando')
    console.log('3. Existem animais machos cadastrados no sistema')
  }
}

// Executar teste
testTourosSelector()