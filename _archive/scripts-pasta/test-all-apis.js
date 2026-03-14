#!/usr/bin/env node

/**
 * Script para testar todas as APIs do Beef Sync
 */

const fs = require('fs')
const path = require('path')

class ApiTester {
  constructor() {
    this.results = []
    this.stats = {
      total: 0,
      working: 0,
      errors: 0,
      critical: 0
    }
  }

  // APIs cr√≠ticas que devem estar funcionando
  getCriticalApis() {
    return [
      { name: 'Health Check', path: '/api/healthz', method: 'GET' },
      { name: 'Database Test', path: '/api/database/test', method: 'GET' },
      { name: 'System Health', path: '/api/system/health', method: 'GET' },
      { name: 'Animals API', path: '/api/animals', method: 'GET' },
      { name: 'Semen API', path: '/api/semen', method: 'GET' }
    ]
  }

  // APIs importantes mas n√£o cr√≠ticas
  getImportantApis() {
    return [
      { name: 'Births API', path: '/api/births', method: 'GET' },
      { name: 'Deaths API', path: '/api/deaths', method: 'GET' },
      { name: 'Locations API', path: '/api/localizacoes', method: 'GET' },
      { name: 'Costs API', path: '/api/custos', method: 'GET' },
      { name: 'Notifications API', path: '/api/notifications', method: 'GET' },
      { name: 'Reports Templates', path: '/api/reports/templates', method: 'GET' },
      { name: 'Dashboard Stats', path: '/api/dashboard/stats', method: 'GET' },
      { name: 'System Check', path: '/api/system-check', method: 'GET' }
    ]
  }

  // Testar uma API espec√≠fica
  async testApi(api, baseUrl = 'http://localhost:3020') {
    const startTime = Date.now()
    
    try {
      console.log(`  Testando ${api.name}...`)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout
      
      const response = await fetch(`${baseUrl}${api.path}`, {
        method: api.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Beef-Sync-API-Tester/1.0'
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      const responseTime = Date.now() - startTime
      const isWorking = response.ok
      
      let responseData = null
      try {
        const text = await response.text()
        if (text) {
          responseData = JSON.parse(text)
        }
      } catch (e) {
        // Resposta n√£o √© JSON v√°lido
      }
      
      const result = {
        name: api.name,
        path: api.path,
        method: api.method || 'GET',
        status: isWorking ? 'working' : 'error',
        statusCode: response.status,
        responseTime,
        timestamp: new Date().toISOString(),
        error: isWorking ? null : `HTTP ${response.status}: ${response.statusText}`,
        hasData: responseData !== null,
        dataStructure: responseData ? this.analyzeDataStructure(responseData) : null
      }
      
      if (isWorking) {
        console.log(`    ‚≈ì‚Ä¶ OK (${responseTime}ms) - Status: ${response.status}`)
        if (responseData && responseData.data) {
          console.log(`    ≈∏‚Äú≈† Dados: ${Array.isArray(responseData.data) ? responseData.data.length + ' registros' : 'objeto'}`)
        }
      } else {
        console.log(`    ‚ù≈í ERRO ${response.status} (${responseTime}ms)`)
      }
      
      return result
      
    } catch (error) {
      const responseTime = Date.now() - startTime
      
      console.log(`    ‚ù≈í FALHA: ${error.message} (${responseTime}ms)`)
      
      return {
        name: api.name,
        path: api.path,
        method: api.method || 'GET',
        status: 'error',
        statusCode: 0,
        responseTime,
        timestamp: new Date().toISOString(),
        error: error.message,
        hasData: false,
        dataStructure: null
      }
    }
  }

  // Analisar estrutura dos dados retornados
  analyzeDataStructure(data) {
    if (Array.isArray(data)) {
      return {
        type: 'array',
        length: data.length,
        sample: data.length > 0 ? Object.keys(data[0]) : []
      }
    } else if (typeof data === 'object' && data !== null) {
      return {
        type: 'object',
        keys: Object.keys(data),
        hasSuccess: 'success' in data,
        hasData: 'data' in data,
        hasMessage: 'message' in data
      }
    } else {
      return {
        type: typeof data,
        value: data
      }
    }
  }

  // Testar todas as APIs
  async testAllApis() {
    console.log('≈∏ß™ Testando APIs do Beef Sync...\n')
    
    // Testar APIs cr√≠ticas
    console.log('≈∏‚Äù¥ Testando APIs Cr√≠ticas:')
    const criticalApis = this.getCriticalApis()
    
    for (const api of criticalApis) {
      const result = await this.testApi(api)
      result.critical = true
      this.results.push(result)
      this.stats.total++
      
      if (result.status === 'working') {
        this.stats.working++
      } else {
        this.stats.errors++
        this.stats.critical++
      }
    }
    
    console.log('\n≈∏≈∏° Testando APIs Importantes:')
    const importantApis = this.getImportantApis()
    
    for (const api of importantApis) {
      const result = await this.testApi(api)
      result.critical = false
      this.results.push(result)
      this.stats.total++
      
      if (result.status === 'working') {
        this.stats.working++
      } else {
        this.stats.errors++
      }
    }
  }

  // Testar conectividade b√°sica
  async testConnectivity() {
    console.log('≈∏≈íê Testando conectividade b√°sica...')
    
    try {
      const response = await fetch('http://localhost:3020/api/healthz', {
        method: 'GET',
        timeout: 5000
      })
      
      if (response.ok) {
        console.log('  ‚≈ì‚Ä¶ Servidor respondendo na porta 3020')
        return true
      } else {
        console.log('  ‚ù≈í Servidor retornou erro:', response.status)
        return false
      }
    } catch (error) {
      console.log('  ‚ù≈í Falha na conectividade:', error.message)
      console.log('  ≈∏‚Äô° Certifique-se de que o servidor est√° rodando: npm run dev')
      return false
    }
  }

  // Gerar relat√≥rio detalhado
  generateReport() {
    console.log('\n≈∏‚Äú‚Äπ RELAT√‚ÄúRIO DE TESTES DAS APIs')
    console.log('=' .repeat(60))
    
    // Estat√≠sticas gerais
    console.log(`≈∏‚Äú≈† Estat√≠sticas Gerais:`)
    console.log(`  Total de APIs testadas: ${this.stats.total}`)
    console.log(`  APIs funcionando: ${this.stats.working} (${((this.stats.working / this.stats.total) * 100).toFixed(1)}%)`)
    console.log(`  APIs com erro: ${this.stats.errors} (${((this.stats.errors / this.stats.total) * 100).toFixed(1)}%)`)
    console.log(`  Erros cr√≠ticos: ${this.stats.critical}`)
    
    // APIs funcionando
    const workingApis = this.results.filter(r => r.status === 'working')
    if (workingApis.length > 0) {
      console.log(`\n‚≈ì‚Ä¶ APIs Funcionando (${workingApis.length}):`)
      workingApis.forEach(api => {
        const criticalMark = api.critical ? '≈∏‚Äù¥' : '≈∏≈∏°'
        console.log(`  ${criticalMark} ${api.name} - ${api.responseTime}ms`)
      })
    }
    
    // APIs com erro
    const errorApis = this.results.filter(r => r.status === 'error')
    if (errorApis.length > 0) {
      console.log(`\n‚ù≈í APIs com Erro (${errorApis.length}):`)
      errorApis.forEach(api => {
        const criticalMark = api.critical ? '≈∏‚Äù¥' : '≈∏≈∏°'
        console.log(`  ${criticalMark} ${api.name} - ${api.error}`)
      })
    }
    
    // Tempo de resposta m√©dio
    const avgResponseTime = this.results.length > 0 
      ? Math.round(this.results.reduce((sum, r) => sum + r.responseTime, 0) / this.results.length)
      : 0
    
    console.log(`\n‚è±Ô∏è  Tempo de Resposta M√©dio: ${avgResponseTime}ms`)
    
    // Recomenda√ß√µes
    console.log('\n≈∏‚Äô° Recomenda√ß√µes:')
    
    if (this.stats.critical > 0) {
      console.log('  ≈∏≈°® CR√çTICO: APIs essenciais est√£o falhando!')
      console.log('     - Verifique se o servidor est√° rodando')
      console.log('     - Verifique a conex√£o com o banco de dados')
      console.log('     - Execute: npm run dev')
    }
    
    if (this.stats.errors > this.stats.critical) {
      console.log('  ‚≈°†Ô∏è  Algumas APIs n√£o cr√≠ticas est√£o com problemas')
      console.log('     - Verifique os logs do servidor')
      console.log('     - Execute: npm run check:apis')
    }
    
    if (avgResponseTime > 1000) {
      console.log('  ≈∏ê≈í Tempo de resposta alto detectado')
      console.log('     - Verifique a performance do banco de dados')
      console.log('     - Considere otimizar as queries')
    }
    
    if (this.stats.working === this.stats.total) {
      console.log('  ≈∏≈Ω‚Ä∞ Todas as APIs est√£o funcionando perfeitamente!')
    }
    
    // Status final
    const successRate = (this.stats.working / this.stats.total) * 100
    console.log(`\n≈∏≈ΩØ Status Final: ${successRate.toFixed(1)}% das APIs funcionando`)
    
    if (successRate >= 95) {
      console.log('≈∏≈∏¢ EXCELENTE - Sistema totalmente operacional')
    } else if (successRate >= 80) {
      console.log('≈∏≈∏° BOM - Sistema operacional com pequenos problemas')
    } else if (successRate >= 60) {
      console.log('≈∏≈∏† ATEN√‚Ä°√∆íO - Sistema com problemas significativos')
    } else {
      console.log('≈∏‚Äù¥ CR√çTICO - Sistema com falhas graves')
    }
  }

  // Salvar relat√≥rio em arquivo
  saveReport() {
    const reportData = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      results: this.results,
      summary: {
        successRate: (this.stats.working / this.stats.total) * 100,
        avgResponseTime: this.results.length > 0 
          ? Math.round(this.results.reduce((sum, r) => sum + r.responseTime, 0) / this.results.length)
          : 0,
        criticalIssues: this.stats.critical > 0,
        hasErrors: this.stats.errors > 0
      }
    }
    
    const reportPath = path.join(process.cwd(), 'api-test-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2))
    
    console.log(`\n≈∏‚Äôæ Relat√≥rio salvo em: ${reportPath}`)
  }

  // Executar todos os testes
  async run() {
    console.log('≈∏≈°‚Ç¨ Iniciando testes das APIs do Beef Sync...\n')
    
    try {
      // Testar conectividade b√°sica primeiro
      const isConnected = await this.testConnectivity()
      
      if (!isConnected) {
        console.log('\n‚ù≈í N√£o foi poss√≠vel conectar ao servidor. Verifique se est√° rodando.')
        return
      }
      
      // Testar todas as APIs
      await this.testAllApis()
      
      // Gerar relat√≥rio
      this.generateReport()
      
      // Salvar relat√≥rio
      this.saveReport()
      
      console.log('\n‚≈ì‚Ä¶ Testes conclu√≠dos!')
      
      // Exit code baseado no resultado
      if (this.stats.critical > 0) {
        process.exit(1) // Falha cr√≠tica
      } else if (this.stats.errors > 0) {
        process.exit(2) // Falhas n√£o cr√≠ticas
      } else {
        process.exit(0) // Sucesso
      }
      
    } catch (error) {
      console.error('\n‚ù≈í Erro durante os testes:', error)
      process.exit(1)
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const tester = new ApiTester()
  tester.run()
}

module.exports = ApiTester