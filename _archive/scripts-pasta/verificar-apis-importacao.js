/**
 * Script para verificar todas as APIs de importação e conexões
 * Verifica se frontend e backend estão conectados corretamente
 */

const http = require('http')

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3020'

// Lista de APIs de importação para verificar
const APIs = [
  {
    name: 'Importação de Animais (Batch)',
    endpoint: '/api/animals/batch',
    method: 'POST',
    testData: {
      animais: [{
        serie: 'TEST',
        rg: '001',
        sexo: 'Macho',
        raca: 'Nelore',
        data_nascimento: '2024-01-01'
      }]
    }
  },
  {
    name: 'Importação de Inseminações',
    endpoint: '/api/reproducao/inseminacao/import-excel',
    method: 'POST',
    testData: {
      data: [{
        serie: 'TEST',
        rg: '001',
        data_ia1: '01/01/2024',
        touro1: 'Touro Teste',
        resultado1: 'Negativo'
      }]
    }
  },
  {
    name: 'Importação de Diagnóstico de Gestação',
    endpoint: '/api/reproducao/diagnostico-gestacao/import-excel',
    method: 'POST',
    testData: {
      data: [{
        serie: 'TEST',
        rg: '001',
        data_dg: '01/02/2024',
        resultado: 'Negativo'
      }]
    }
  },
  {
    name: 'Importação de FIV',
    endpoint: '/api/reproducao/coleta-fiv/import-excel',
    method: 'POST',
    testData: {
      fileData: '',
      fileName: 'test.xlsx',
      laboratorio: 'Lab Teste',
      veterinario: 'Vet Teste'
    }
  },
  {
    name: 'API de Animais (GET)',
    endpoint: '/api/animals',
    method: 'GET'
  },
  {
    name: 'API de Lotes',
    endpoint: '/api/lotes',
    method: 'GET'
  },
  {
    name: 'API de Access Log',
    endpoint: '/api/access-log',
    method: 'GET'
  }
]

// Função para fazer requisição HTTP
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = ''
      
      res.on('data', (chunk) => {
        body += chunk
      })
      
      res.on('end', () => {
        let parsedBody
        try {
          parsedBody = JSON.parse(body)
        } catch (e) {
          parsedBody = body
        }
        
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: parsedBody
        })
      })
    })
    
    req.on('error', (error) => {
      reject(error)
    })
    
    req.setTimeout(10000, () => {
      req.destroy()
      reject(new Error('Timeout'))
    })
    
    if (data) {
      req.write(JSON.stringify(data))
    }
    
    req.end()
  })
}

// Função para testar conexão com banco de dados
async function testDatabaseConnection() {
  try {
    const { pool } = require('../lib/database')
    const client = await pool.connect()
    const result = await client.query('SELECT NOW() as timestamp, current_database()')
    client.release()
    
    return {
      success: true,
      message: 'Conexão com banco de dados OK',
      database: result.rows[0].current_database,
      timestamp: result.rows[0].timestamp
    }
  } catch (error) {
    return {
      success: false,
      message: `Erro na conexão com banco: ${error.message}`,
      error: error.stack
    }
  }
}

// Função principal
async function verificarAPIs() {
  console.log('🔍 VERIFICAÇÃO DE APIS DE IMPORTAÇÃO E CONEXÕES\n')
  console.log(`📍 URL Base: ${BASE_URL}\n`)
  console.log('='.repeat(80))
  
  // Testar conexão com banco de dados
  console.log('\n📊 TESTANDO CONEXÃO COM BANCO DE DADOS...')
  const dbTest = await testDatabaseConnection()
  if (dbTest.success) {
    console.log(`✅ ${dbTest.message}`)
    console.log(`   Database: ${dbTest.database}`)
    console.log(`   Timestamp: ${dbTest.timestamp}`)
  } else {
    console.log(`❌ ${dbTest.message}`)
    console.log(`   Erro: ${dbTest.error}`)
  }
  
  console.log('\n' + '='.repeat(80))
  console.log('\n🌐 TESTANDO APIs DE IMPORTAÇÃO...\n')
  
  const resultados = []
  
  for (const api of APIs) {
    try {
      const url = new URL(api.endpoint, BASE_URL)
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: api.method,
        headers: {
          'Content-Type': 'application/json'
        }
      }
      
      console.log(`\n📡 Testando: ${api.name}`)
      console.log(`   Endpoint: ${api.endpoint}`)
      console.log(`   Método: ${api.method}`)
      
      const startTime = Date.now()
      const response = await makeRequest(options, api.testData || null)
      const duration = Date.now() - startTime
      
      const isSuccess = response.statusCode >= 200 && response.statusCode < 300
      const isJson = response.headers['content-type']?.includes('application/json')
      
      resultados.push({
        name: api.name,
        endpoint: api.endpoint,
        success: isSuccess,
        statusCode: response.statusCode,
        isJson,
        duration,
        hasError: response.body?.success === false || response.body?.error
      })
      
      if (isSuccess && isJson) {
        console.log(`   ✅ Status: ${response.statusCode} (${duration}ms)`)
        if (response.body?.success !== false) {
          console.log(`   ✅ Resposta JSON válida`)
        } else {
          console.log(`   ⚠️  Resposta indica erro: ${response.body?.message || 'Erro desconhecido'}`)
        }
      } else if (isSuccess && !isJson) {
        console.log(`   ⚠️  Status: ${response.statusCode} mas resposta não é JSON`)
        console.log(`   Tipo: ${response.headers['content-type']}`)
      } else {
        console.log(`   ❌ Status: ${response.statusCode}`)
        if (response.body?.message) {
          console.log(`   Mensagem: ${response.body.message}`)
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`)
      resultados.push({
        name: api.name,
        endpoint: api.endpoint,
        success: false,
        error: error.message
      })
    }
  }
  
  // Resumo
  console.log('\n' + '='.repeat(80))
  console.log('\n📊 RESUMO DA VERIFICAÇÃO\n')
  
  const sucessos = resultados.filter(r => r.success && !r.hasError).length
  const erros = resultados.filter(r => !r.success || r.hasError).length
  
  console.log(`✅ APIs funcionando: ${sucessos}/${resultados.length}`)
  console.log(`❌ APIs com problemas: ${erros}/${resultados.length}`)
  
  if (dbTest.success) {
    console.log(`✅ Banco de dados: Conectado`)
  } else {
    console.log(`❌ Banco de dados: Desconectado`)
  }
  
  console.log('\n' + '='.repeat(80))
  console.log('\n📋 DETALHES POR API:\n')
  
  resultados.forEach(r => {
    const status = r.success && !r.hasError ? '✅' : '❌'
    console.log(`${status} ${r.name}`)
    console.log(`   Endpoint: ${r.endpoint}`)
    if (r.statusCode) {
      console.log(`   Status: ${r.statusCode}`)
    }
    if (r.error) {
      console.log(`   Erro: ${r.error}`)
    }
    if (r.duration) {
      console.log(`   Tempo: ${r.duration}ms`)
    }
    console.log('')
  })
  
  // Verificar tabelas do banco
  console.log('\n' + '='.repeat(80))
  console.log('\n🗄️  VERIFICANDO TABELAS DO BANCO DE DADOS...\n')
  
  try {
    const { pool } = require('../lib/database')
    const client = await pool.connect()
    
    const tabelasImportantes = [
      'animais',
      'inseminacoes',
      'gestacoes',
      'nascimentos',
      'transferencias_embrioes',
      'notas_fiscais',
      'lotes_operacoes'
    ]
    
    for (const tabela of tabelasImportantes) {
      try {
        const result = await client.query(`
          SELECT COUNT(*) as total 
          FROM ${tabela}
        `)
        console.log(`✅ ${tabela}: ${result.rows[0].total} registros`)
      } catch (error) {
        if (error.code === '42P01') {
          console.log(`⚠️  ${tabela}: Tabela não existe`)
        } else {
          console.log(`❌ ${tabela}: Erro - ${error.message}`)
        }
      }
    }
    
    client.release()
  } catch (error) {
    console.log(`❌ Erro ao verificar tabelas: ${error.message}`)
  }
  
  console.log('\n' + '='.repeat(80))
  console.log('\n✅ Verificação concluída!\n')
}

// Executar
verificarAPIs().catch(error => {
  console.error('❌ Erro ao executar verificação:', error)
  process.exit(1)
})
