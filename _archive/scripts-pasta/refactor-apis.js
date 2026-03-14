#!/usr/bin/env node

/**
 * Script para refatoração e verificação de todas as APIs do Beef Sync
 */

const fs = require('fs')
const path = require('path')
const { query, testConnection } = require('../lib/database')

class ApiRefactor {
  constructor() {
    this.apiRoutes = []
    this.errors = []
    this.warnings = []
    this.stats = {
      total: 0,
      working: 0,
      errors: 0,
      refactored: 0
    }
  }

  // Escanear todas as rotas de API
  async scanApiRoutes() {
    console.log('�Ÿ”� Escaneando rotas de API...')
    
    const apiDir = path.join(process.cwd(), 'pages', 'api')
    await this.scanDirectory(apiDir, '/api')
    
    console.log(`�Ÿ“Š Encontradas ${this.apiRoutes.length} rotas de API`)
    return this.apiRoutes
  }

  // Escanear diretório recursivamente
  async scanDirectory(dir, basePath) {
    try {
      const items = fs.readdirSync(dir)
      
      for (const item of items) {
        const fullPath = path.join(dir, item)
        const stat = fs.statSync(fullPath)
        
        if (stat.isDirectory()) {
          await this.scanDirectory(fullPath, `${basePath}/${item}`)
        } else if (item.endsWith('.js') && !item.startsWith('_')) {
          const routePath = `${basePath}/${item.replace('.js', '')}`
          this.apiRoutes.push({
            file: fullPath,
            route: routePath,
            name: item.replace('.js', '')
          })
        }
      }
    } catch (error) {
      this.errors.push(`Erro ao escanear ${dir}: ${error.message}`)
    }
  }

  // Verificar conectividade das APIs
  async checkApiConnectivity() {
    console.log('�Ÿ”Œ Verificando conectividade das APIs...')
    
    const results = []
    
    for (const api of this.apiRoutes) {
      try {
        console.log(`  Testando ${api.route}...`)
        
        const startTime = Date.now()
        const response = await fetch(`http://localhost:3020${api.route}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000
        })
        
        const responseTime = Date.now() - startTime
        const isWorking = response.ok
        
        if (isWorking) {
          this.stats.working++
          console.log(`    �œ… OK (${responseTime}ms)`)
        } else {
          this.stats.errors++
          console.log(`    �Œ ERRO ${response.status}`)
        }
        
        results.push({
          ...api,
          status: isWorking ? 'working' : 'error',
          statusCode: response.status,
          responseTime,
          error: isWorking ? null : `HTTP ${response.status}`
        })
        
      } catch (error) {
        this.stats.errors++
        console.log(`    �Œ ERRO: ${error.message}`)
        
        results.push({
          ...api,
          status: 'error',
          statusCode: 0,
          responseTime: null,
          error: error.message
        })
      }
      
      this.stats.total++
    }
    
    return results
  }

  // Verificar estrutura do banco de dados
  async checkDatabaseStructure() {
    console.log('�Ÿ—„️  Verificando estrutura do banco de dados...')
    
    try {
      const dbStatus = await testConnection()
      
      if (!dbStatus.success) {
        this.errors.push('Falha na conexão com o banco de dados')
        return false
      }
      
      console.log('  �œ… Conexão com banco OK')
      
      // Verificar tabelas principais
      const tables = [
        'animais', 'custos', 'gestacoes', 'nascimentos', 'estoque_semen',
        'transferencias_embrioes', 'servicos', 'notificacoes', 'protocolos_reprodutivos',
        'notas_fiscais', 'historia_ocorrencias', 'localizacoes_animais'
      ]
      
      for (const table of tables) {
        try {
          const result = await query(`SELECT COUNT(*) as count FROM ${table}`)
          console.log(`  �œ… Tabela ${table}: ${result.rows[0].count} registros`)
        } catch (error) {
          this.errors.push(`Erro na tabela ${table}: ${error.message}`)
          console.log(`  �Œ Tabela ${table}: ERRO`)
        }
      }
      
      return true
    } catch (error) {
      this.errors.push(`Erro na verificação do banco: ${error.message}`)
      return false
    }
  }

  // Refatorar APIs com problemas
  async refactorApis(apiResults) {
    console.log('�Ÿ”� Refatorando APIs com problemas...')
    
    const errorApis = apiResults.filter(api => api.status === 'error')
    
    for (const api of errorApis) {
      try {
        await this.refactorApiFile(api)
        this.stats.refactored++
      } catch (error) {
        this.errors.push(`Erro ao refatorar ${api.route}: ${error.message}`)
      }
    }
  }

  // Refatorar arquivo de API específico
  async refactorApiFile(api) {
    console.log(`  Refatorando ${api.file}...`)
    
    try {
      const content = fs.readFileSync(api.file, 'utf8')
      
      // Verificar se já tem tratamento de erro adequado
      if (!content.includes('try') || !content.includes('catch')) {
        const refactoredContent = this.addErrorHandling(content, api.name)
        fs.writeFileSync(api.file, refactoredContent)
        console.log(`    �œ… Adicionado tratamento de erro`)
      }
      
      // Verificar se tem validação de método HTTP
      if (!content.includes('req.method')) {
        const validatedContent = this.addMethodValidation(content)
        fs.writeFileSync(api.file, validatedContent)
        console.log(`    �œ… Adicionada validação de método`)
      }
      
    } catch (error) {
      throw new Error(`Falha ao refatorar ${api.file}: ${error.message}`)
    }
  }

  // Adicionar tratamento de erro padrão
  addErrorHandling(content, apiName) {
    // Template básico com tratamento de erro
    const template = `
const { query } = require('../../lib/database')

export default async function handler(req, res) {
  // Validação de método HTTP
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'DELETE') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed',
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE']
    })
  }

  try {
    // Lógica da API aqui
    ${this.extractApiLogic(content)}
    
  } catch (error) {
    console.error('Erro na API ${apiName}:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno',
      timestamp: new Date().toISOString()
    })
  }
}
`
    return template
  }

  // Extrair lógica existente da API
  extractApiLogic(content) {
    // Tentar extrair a lógica principal da API
    const lines = content.split('\n')
    const logicLines = lines.filter(line => 
      !line.includes('export default') &&
      !line.includes('function handler') &&
      !line.trim().startsWith('//')
    )
    
    return logicLines.join('\n')
  }

  // Adicionar validação de método HTTP
  addMethodValidation(content) {
    const methodValidation = `
  // Validação de método HTTP
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(req.method)) {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed',
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE']
    })
  }
`
    
    // Inserir após a declaração da função
    return content.replace(
      /export default async function handler\(req, res\) \{/,
      `export default async function handler(req, res) {${methodValidation}`
    )
  }

  // Gerar relatório de refatoração
  generateReport() {
    console.log('\n�Ÿ“‹ RELAT�“RIO DE REFATORA�‡�ƒO')
    console.log('=' .repeat(50))
    
    console.log(`�Ÿ“Š Estatísticas:`)
    console.log(`  Total de APIs: ${this.stats.total}`)
    console.log(`  APIs funcionando: ${this.stats.working}`)
    console.log(`  APIs com erro: ${this.stats.errors}`)
    console.log(`  APIs refatoradas: ${this.stats.refactored}`)
    
    if (this.errors.length > 0) {
      console.log(`\n�Œ Erros encontrados (${this.errors.length}):`)
      this.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`)
      })
    }
    
    if (this.warnings.length > 0) {
      console.log(`\n�š�️  Avisos (${this.warnings.length}):`)
      this.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`)
      })
    }
    
    const successRate = this.stats.total > 0 
      ? ((this.stats.working / this.stats.total) * 100).toFixed(1)
      : 0
    
    console.log(`\n�ŸŽ� Taxa de sucesso: ${successRate}%`)
    
    if (successRate >= 90) {
      console.log('�ŸŽ‰ Excelente! A maioria das APIs está funcionando corretamente.')
    } else if (successRate >= 70) {
      console.log('�š�️  Atenção: Algumas APIs precisam de correção.')
    } else {
      console.log('�Ÿš� Crítico: Muitas APIs estão com problemas.')
    }
  }

  // Executar refatoração completa
  async run() {
    console.log('�Ÿš€ Iniciando refatoração das APIs do Beef Sync...\n')
    
    try {
      // 1. Verificar banco de dados
      const dbOk = await this.checkDatabaseStructure()
      if (!dbOk) {
        console.log('�Œ Falha na verificação do banco de dados')
        return
      }
      
      // 2. Escanear APIs
      await this.scanApiRoutes()
      
      // 3. Verificar conectividade (apenas se servidor estiver rodando)
      console.log('�š�️  Para verificar conectividade, certifique-se de que o servidor está rodando na porta 3020')
      
      // 4. Gerar relatório
      this.generateReport()
      
      console.log('\n�œ… Refatoração concluída!')
      
    } catch (error) {
      console.error('�Œ Erro durante a refatoração:', error)
      process.exit(1)
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const refactor = new ApiRefactor()
  refactor.run()
}

module.exports = ApiRefactor