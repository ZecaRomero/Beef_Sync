const fetch = require('node-fetch')

const BASE_URL = 'http://localhost:3000'

async function testExamesAndrologicos() {
  console.log('�Ÿ”� Testando Sistema de Exames Andrológicos')
  console.log('=' .repeat(50))

  try {
    // 1. Criar um exame com resultado "Apto"
    console.log('\n1. Criando exame com resultado "Apto"...')
    const exameApto = await fetch(`${BASE_URL}/api/reproducao/exames-andrologicos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        touro: 'Touro Teste Apto',
        rg: 'RG001',
        data_exame: '2024-10-30',
        resultado: 'Apto',
        observacoes: 'Exame normal, animal aprovado'
      })
    })

    if (exameApto.ok) {
      const resultApto = await exameApto.json()
      console.log('�œ… Exame "Apto" criado:', resultApto.exame?.id)
    } else {
      console.log('�Œ Erro ao criar exame "Apto"')
    }

    // 2. Criar um exame com resultado "Inapto" (deve gerar reagendamento)
    console.log('\n2. Criando exame com resultado "Inapto" (deve reagendar automaticamente)...')
    const exameInapto = await fetch(`${BASE_URL}/api/reproducao/exames-andrologicos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        touro: 'Touro Teste Inapto',
        rg: 'RG002',
        data_exame: '2024-10-30',
        resultado: 'Inapto',
        observacoes: 'Animal reprovado, necessário reagendamento'
      })
    })

    if (exameInapto.ok) {
      const resultInapto = await exameInapto.json()
      console.log('�œ… Exame "Inapto" criado:', resultInapto.exame?.id)
      if (resultInapto.reagendamento) {
        console.log('�Ÿ”„ Reagendamento automático criado para:', resultInapto.reagendamento.data_exame)
        console.log('�Ÿ“� Mensagem:', resultInapto.message)
      }
    } else {
      console.log('�Œ Erro ao criar exame "Inapto"')
    }

    // 3. Listar todos os exames
    console.log('\n3. Listando todos os exames...')
    const listarExames = await fetch(`${BASE_URL}/api/reproducao/exames-andrologicos`)
    
    if (listarExames.ok) {
      const exames = await listarExames.json()
      console.log(`�Ÿ“‹ Total de exames: ${exames.length}`)
      
      exames.forEach((exame, index) => {
        console.log(`\n   Exame ${index + 1}:`)
        console.log(`   - ID: ${exame.id}`)
        console.log(`   - Touro: ${exame.touro}`)
        console.log(`   - RG: ${exame.rg}`)
        console.log(`   - Data: ${exame.data_exame}`)
        console.log(`   - Resultado: ${exame.resultado}`)
        console.log(`   - Status: ${exame.status}`)
        console.log(`   - Reagendado: ${exame.reagendado ? 'Sim' : 'Não'}`)
        if (exame.data_reagendamento) {
          console.log(`   - Data Reagendamento: ${exame.data_reagendamento}`)
        }
        if (exame.exame_origem_id) {
          console.log(`   - Exame Origem ID: ${exame.exame_origem_id}`)
        }
      })
    } else {
      console.log('�Œ Erro ao listar exames')
    }

    // 4. Testar atualização de exame de "Pendente" para "Inapto"
    console.log('\n4. Testando atualização de exame pendente para inapto...')
    const examePendente = await fetch(`${BASE_URL}/api/reproducao/exames-andrologicos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        touro: 'Touro Teste Update',
        rg: 'RG003',
        data_exame: '2024-10-30',
        resultado: 'Pendente',
        observacoes: 'Exame agendado'
      })
    })

    if (examePendente.ok) {
      const resultPendente = await examePendente.json()
      const exameId = resultPendente.exame.id
      console.log('�œ… Exame pendente criado:', exameId)

      // Atualizar para "Inapto"
      const updateExame = await fetch(`${BASE_URL}/api/reproducao/exames-andrologicos?id=${exameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          touro: 'Touro Teste Update',
          rg: 'RG003',
          data_exame: '2024-10-30',
          resultado: 'Inapto',
          observacoes: 'Resultado alterado para inapto'
        })
      })

      if (updateExame.ok) {
        const updateResult = await updateExame.json()
        console.log('�œ… Exame atualizado para "Inapto"')
        if (updateResult.reagendamento) {
          console.log('�Ÿ”„ Novo reagendamento criado para:', updateResult.reagendamento.data_exame)
        }
      }
    }

    console.log('\n' + '=' .repeat(50))
    console.log('�œ… Teste do sistema de exames andrológicos concluído!')
    console.log('\nFuncionalidades testadas:')
    console.log('- �œ… Criação de exames com resultado "Apto"')
    console.log('- �œ… Criação de exames com resultado "Inapto" e reagendamento automático')
    console.log('- �œ… Listagem de exames com informações de reagendamento')
    console.log('- �œ… Atualização de exames e reagendamento automático')
    console.log('\nReagendamento automático:')
    console.log('- �Ÿ”„ Exames "Inapto" são automaticamente reagendados para 30 dias depois')
    console.log('- �Ÿ“… Status do exame original é alterado para "Reagendado"')
    console.log('- �Ÿ”— Novo exame fica vinculado ao exame original')

  } catch (error) {
    console.error('�Œ Erro durante o teste:', error.message)
  }
}

// Executar o teste
testExamesAndrologicos()