/**
 * Script para verificar se todas as APIs de nitrogênio estão retornando
 * dados na estrutura correta esperada pelo frontend
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3020'

async function testarAPI(endpoint, metodo = 'GET', body = null) {
  try {
    const options = {
      method: metodo,
      headers: {
        'Content-Type': 'application/json',
      },
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options)
    const data = await response.json()

    return {
      endpoint,
      status: response.status,
      ok: response.ok,
      estrutura: {
        temData: 'data' in data,
        temMeta: 'meta' in data,
        temPagination: data.meta?.pagination !== undefined,
        temStats: data.meta?.stats !== undefined,
        ehArray: Array.isArray(data),
        estruturaEsperada: ('data' in data && 'meta' in data) || Array.isArray(data)
      },
      dados: data
    }
  } catch (error) {
    return {
      endpoint,
      erro: error.message,
      ok: false
    }
  }
}

async function verificarAPIs() {
  console.log('🔍 Verificando APIs de Nitrogênio...\n')

  const testes = [
    { endpoint: '/api/nitrogenio', metodo: 'GET', descricao: 'Listar abastecimentos (com paginação)' },
    { endpoint: '/api/nitrogenio?page=1&limit=10', metodo: 'GET', descricao: 'Listar abastecimentos (página 1)' },
    { endpoint: '/api/motoristas-nitrogenio', metodo: 'GET', descricao: 'Listar motoristas' },
  ]

  const resultados = []

  for (const teste of testes) {
    console.log(`Testando: ${teste.descricao}`)
    const resultado = await testarAPI(teste.endpoint, teste.metodo)
    resultados.push({ ...teste, resultado })
    
    if (resultado.ok) {
      console.log(`✅ Status: ${resultado.status}`)
      console.log(`   Estrutura:`, resultado.estrutura)
    } else {
      console.log(`❌ Erro: ${resultado.erro || 'Status ' + resultado.status}`)
    }
    console.log('')
  }

  // Resumo
  console.log('\n📊 RESUMO DA VERIFICAÇÃO:\n')
  
  const apisComProblema = resultados.filter(r => !r.resultado.ok || !r.resultado.estrutura?.estruturaEsperada)
  
  if (apisComProblema.length === 0) {
    console.log('✅ Todas as APIs estão retornando dados corretamente!')
  } else {
    console.log(`⚠️  ${apisComProblema.length} API(s) com problemas:`)
    apisComProblema.forEach(item => {
      console.log(`   - ${item.descricao}: ${item.endpoint}`)
      if (item.resultado.erro) {
        console.log(`     Erro: ${item.resultado.erro}`)
      } else if (item.resultado.estrutura) {
        console.log(`     Estrutura:`, item.resultado.estrutura)
      }
    })
  }

  console.log('\n📋 Estrutura esperada para GET /api/nitrogenio:')
  console.log(`   {
     data: [...],
     meta: {
       pagination: { page, limit, totalItems, totalPages },
       stats: { totalLitros }
     }
   }`)

  console.log('\n📋 Estrutura esperada para GET /api/motoristas-nitrogenio:')
  console.log(`   {
     success: true,
     data: [...],
     message: "..."
   }`)
}

// Executar verificação
if (require.main === module) {
  verificarAPIs().catch(console.error)
}

module.exports = { verificarAPIs, testarAPI }

