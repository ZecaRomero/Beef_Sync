#!/usr/bin/env node

const logger = require('../utils/logger.cjs')
const databaseService = require('../services/databaseService')

async function testDatabaseConnection() {
  try {
    logger.info('Testando conexão com o banco de dados...')
    const connection = await databaseService.testConnection()
    
    if (connection) {
      logger.info('�œ… Conexão com banco de dados: OK')
      return true
    } else {
      logger.error('�Œ Conexão com banco de dados: FALHOU')
      return false
    }
  } catch (error) {
    logger.error('�Œ Erro na conexão com banco de dados:', error)
    return false
  }
}

async function testAPIs() {
  const apis = [
    '/api/animals',
    '/api/dashboard/stats',
    '/api/births',
    '/api/semen',
    '/api/costs',
    '/api/notas-fiscais'
  ]

  logger.info('Testando APIs...')
  let successCount = 0

  for (const api of apis) {
    try {
      const response = await fetch(`http://localhost:3020${api}`)
      
      if (response.ok) {
        logger.info(`�œ… ${api}: OK`)
        successCount++
      } else {
        logger.warn(`�š�️ ${api}: Status ${response.status}`)
      }
    } catch (error) {
      logger.error(`�Œ ${api}: ${error.message}`)
    }
  }

  logger.info(`APIs testadas: ${successCount}/${apis.length} funcionando`)
  return successCount === apis.length
}

async function testDatabaseTables() {
  try {
    logger.info('Verificando tabelas do banco de dados...')
    
    const tables = [
      'animais',
      'custos',
      'gestacoes',
      'nascimentos',
      'estoque_semen',
      'transferencias_embrioes',
      'servicos',
      'notificacoes',
      'protocolos_reprodutivos',
      'relatorios_personalizados',
      'notas_fiscais',
      'naturezas_operacao'
    ]

    let successCount = 0

    for (const table of tables) {
      try {
        const count = await databaseService.getTableCount(table)
        logger.info(`�œ… Tabela ${table}: ${count} registro(s)`)
        successCount++
      } catch (error) {
        logger.error(`�Œ Tabela ${table}: ${error.message}`)
      }
    }

    logger.info(`Tabelas verificadas: ${successCount}/${tables.length}`)
    return successCount === tables.length
  } catch (error) {
    logger.error('�Œ Erro ao verificar tabelas:', error)
    return false
  }
}

async function testSystemPerformance() {
  try {
    logger.info('Testando performance do sistema...')
    
    const startTime = Date.now()
    
    // Teste de consulta simples
    await databaseService.buscarAnimais({})
    
    const queryTime = Date.now() - startTime
    
    if (queryTime < 1000) {
      logger.info(`�œ… Performance: OK (${queryTime}ms)`)
      return true
    } else {
      logger.warn(`�š�️ Performance: LENTA (${queryTime}ms)`)
      return false
    }
  } catch (error) {
    logger.error('�Œ Erro no teste de performance:', error)
    return false
  }
}

async function generateSystemReport() {
  try {
    logger.info('Gerando relatório do sistema...')
    
    const stats = await databaseService.getSystemStats()
    
    logger.info('�Ÿ“Š Estatísticas do Sistema:')
    logger.info(`   Animais: ${stats.totalAnimals || 0}`)
    logger.info(`   Nascimentos: ${stats.totalBirths || 0}`)
    logger.info(`   Custos: ${stats.totalCosts || 0}`)
    logger.info(`   Sêmen: ${stats.totalSemen || 0}`)
    
    return true
  } catch (error) {
    logger.error('�Œ Erro ao gerar relatório:', error)
    return false
  }
}

async function runCompleteTest() {
  logger.info('�Ÿš€ Iniciando teste completo do sistema...')
  logger.info('=' * 60)

  const tests = [
    { name: 'Conexão com Banco', fn: testDatabaseConnection },
    { name: 'Tabelas do Banco', fn: testDatabaseTables },
    { name: 'APIs do Sistema', fn: testAPIs },
    { name: 'Performance', fn: testSystemPerformance },
    { name: 'Relatório do Sistema', fn: generateSystemReport }
  ]

  let passedTests = 0
  const results = []

  for (const test of tests) {
    logger.info(`\n�Ÿ“‹ Executando: ${test.name}`)
    logger.info('-' * 40)
    
    try {
      const result = await test.fn()
      results.push({ name: test.name, passed: result })
      
      if (result) {
        passedTests++
        logger.info(`�œ… ${test.name}: PASSOU`)
      } else {
        logger.error(`�Œ ${test.name}: FALHOU`)
      }
    } catch (error) {
      logger.error(`�Œ ${test.name}: ERRO - ${error.message}`)
      results.push({ name: test.name, passed: false, error: error.message })
    }
  }

  logger.info('\n' + '=' * 60)
  logger.info('�Ÿ“Š RESULTADO FINAL DO TESTE')
  logger.info('=' * 60)
  
  logger.info(`Testes executados: ${tests.length}`)
  logger.info(`Testes aprovados: ${passedTests}`)
  logger.info(`Taxa de sucesso: ${((passedTests / tests.length) * 100).toFixed(1)}%`)

  if (passedTests === tests.length) {
    logger.info('�ŸŽ‰ TODOS OS TESTES PASSARAM! Sistema funcionando perfeitamente!')
    process.exit(0)
  } else {
    logger.error('�š�️ ALGUNS TESTES FALHARAM! Verifique os erros acima.')
    
    logger.info('\n�Ÿ“‹ Resumo dos resultados:')
    results.forEach(result => {
      const status = result.passed ? '�œ…' : '�Œ'
      logger.info(`   ${status} ${result.name}`)
      if (result.error) {
        logger.info(`      Erro: ${result.error}`)
      }
    })
    
    process.exit(1)
  }
}

// Executar teste se chamado diretamente
if (require.main === module) {
  runCompleteTest().catch(error => {
    logger.error('Erro fatal no teste:', error)
    process.exit(1)
  })
}

module.exports = {
  testDatabaseConnection,
  testAPIs,
  testDatabaseTables,
  testSystemPerformance,
  generateSystemReport,
  runCompleteTest
}
