const fetch = require('node-fetch')

const BASE_URL = 'http://localhost:3020'

async function testDestinatariosAPI() {
  console.log('�Ÿ�� Testando API de Destinatários...\n')

  try {
    // 1. Listar destinatários (deve estar vazio inicialmente)
    console.log('1️�ƒ� Listando destinatários...')
    let response = await fetch(`${BASE_URL}/api/relatorios-envio/destinatarios`)
    let data = await response.json()
    console.log('Status:', response.status)
    console.log('Resposta:', JSON.stringify(data, null, 2))
    console.log('�œ… Lista de destinatários obtida\n')

    // 2. Criar um novo destinatário
    console.log('2️�ƒ� Criando novo destinatário...')
    const novoDestinatario = {
      nome: 'ZECA',
      email: 'zeca@fazendasantanna.com.br',
      whatsapp: '17996003821',
      cargo: 'Área Adm',
      recebe_email: true,
      recebe_whatsapp: false
    }
    
    response = await fetch(`${BASE_URL}/api/relatorios-envio/destinatarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novoDestinatario)
    })
    
    data = await response.json()
    console.log('Status:', response.status)
    console.log('Resposta:', JSON.stringify(data, null, 2))
    
    if (response.ok) {
      console.log('�œ… Destinatário criado com sucesso\n')
      const destinatarioId = data.data?.id || data.id
      
      // 3. Buscar destinatário por ID
      console.log('3️�ƒ� Buscando destinatário por ID...')
      response = await fetch(`${BASE_URL}/api/relatorios-envio/destinatarios/${destinatarioId}`)
      data = await response.json()
      console.log('Status:', response.status)
      console.log('Resposta:', JSON.stringify(data, null, 2))
      console.log('�œ… Destinatário encontrado\n')
      
      // 4. Atualizar destinatário
      console.log('4️�ƒ� Atualizando destinatário...')
      const dadosAtualizados = {
        ...novoDestinatario,
        cargo: 'Administração',
        recebe_whatsapp: true
      }
      
      response = await fetch(`${BASE_URL}/api/relatorios-envio/destinatarios/${destinatarioId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosAtualizados)
      })
      
      data = await response.json()
      console.log('Status:', response.status)
      console.log('Resposta:', JSON.stringify(data, null, 2))
      console.log('�œ… Destinatário atualizado\n')
      
      // 5. Listar novamente
      console.log('5️�ƒ� Listando destinatários novamente...')
      response = await fetch(`${BASE_URL}/api/relatorios-envio/destinatarios`)
      data = await response.json()
      console.log('Status:', response.status)
      console.log('Total de destinatários:', data.data?.length || data.length)
      console.log('�œ… Lista atualizada\n')
      
      // 6. Deletar destinatário (opcional - descomente se quiser testar)
      // console.log('6️�ƒ� Deletando destinatário...')
      // response = await fetch(`${BASE_URL}/api/relatorios-envio/destinatarios/${destinatarioId}`, {
      //   method: 'DELETE'
      // })
      // data = await response.json()
      // console.log('Status:', response.status)
      // console.log('Resposta:', JSON.stringify(data, null, 2))
      // console.log('�œ… Destinatário deletado\n')
      
    } else {
      console.log('�Œ Erro ao criar destinatário\n')
    }

    console.log('�œ… Todos os testes concluídos!')
    
  } catch (error) {
    console.error('�Œ Erro ao executar testes:', error.message)
    console.error('Certifique-se de que o servidor está rodando em', BASE_URL)
  }
}

testDestinatariosAPI()
