/**
 * Utilitário para validação e monitoramento de APIs
 */

class ApiValidator {
  constructor() {
    this.endpoints = new Map()
    this.healthChecks = new Map()
    this.lastResults = new Map()
  }

  // Registrar endpoint para monitoramento
  registerEndpoint(name, config) {
    this.endpoints.set(name, {
      name,
      url: config.url,
      method: config.method || 'GET',
      headers: config.headers || { 'Content-Type': 'application/json' },
      timeout: config.timeout || 5000,
      critical: config.critical || false,
      retries: config.retries || 3,
      ...config
    })
  }

  // Verificar saúde de um endpoint específico
  async checkEndpoint(name) {
    const endpoint = this.endpoints.get(name)
    if (!endpoint) {
      throw new Error(`Endpoint '${name}' não encontrado`)
    }

    const startTime = Date.now()
    let attempt = 0
    let lastError = null

    while (attempt < endpoint.retries) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort('Timeout'), endpoint.timeout)

        const response = await fetch(endpoint.url, {
          method: endpoint.method,
          headers: endpoint.headers,
          signal: controller.signal,
          ...endpoint.fetchOptions
        })

        clearTimeout(timeoutId)
        
        const responseTime = Date.now() - startTime
        const isHealthy = response.ok

        const result = {
          name: endpoint.name,
          url: endpoint.url,
          status: isHealthy ? 'healthy' : 'error',
          statusCode: response.status,
          responseTime,
          timestamp: new Date().toISOString(),
          attempt: attempt + 1,
          critical: endpoint.critical,
          error: isHealthy ? null : `HTTP ${response.status}: ${response.statusText}`
        }

        this.lastResults.set(name, result)
        return result

      } catch (error) {
        lastError = error
        attempt++
        
        if (attempt < endpoint.retries) {
          // Aguardar antes de tentar novamente (backoff exponencial)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        }
      }
    }

    // Todas as tentativas falharam
    const result = {
      name: endpoint.name,
      url: endpoint.url,
      status: 'error',
      statusCode: 0,
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      attempt,
      critical: endpoint.critical,
      error: lastError?.message || 'Falha na conexão'
    }

    this.lastResults.set(name, result)
    return result
  }

  // Verificar todos os endpoints registrados
  async checkAllEndpoints() {
    const results = []
    const promises = Array.from(this.endpoints.keys()).map(name => 
      this.checkEndpoint(name).catch(error => ({
        name,
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      }))
    )

    const endpointResults = await Promise.all(promises)
    results.push(...endpointResults)

    return {
      timestamp: new Date().toISOString(),
      totalEndpoints: this.endpoints.size,
      healthyEndpoints: results.filter(r => r.status === 'healthy').length,
      criticalErrors: results.filter(r => r.status === 'error' && r.critical).length,
      results
    }
  }

  // Obter resumo do status
  getHealthSummary() {
    const results = Array.from(this.lastResults.values())
    
    return {
      total: results.length,
      healthy: results.filter(r => r.status === 'healthy').length,
      errors: results.filter(r => r.status === 'error').length,
      criticalErrors: results.filter(r => r.status === 'error' && r.critical).length,
      averageResponseTime: results.length > 0 
        ? Math.round(results.reduce((sum, r) => sum + (r.responseTime || 0), 0) / results.length)
        : 0,
      lastCheck: results.length > 0 
        ? Math.max(...results.map(r => new Date(r.timestamp).getTime()))
        : null
    }
  }

  // Configurar monitoramento automático
  startMonitoring(intervalMs = 60000) {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
    }

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkAllEndpoints()
        this.emitHealthUpdate()
      } catch (error) {
        console.error('Erro no monitoramento automático:', error)
      }
    }, intervalMs)

    // Verificação inicial
    this.checkAllEndpoints().then(() => this.emitHealthUpdate())
  }

  // Parar monitoramento
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
  }

  // Emitir evento de atualização de saúde
  emitHealthUpdate() {
    if (typeof window !== 'undefined') {
      const summary = this.getHealthSummary()
      window.dispatchEvent(new CustomEvent('apiHealthUpdate', { 
        detail: summary 
      }))
    }
  }

  // Registrar listener para atualizações
  onHealthUpdate(callback) {
    if (typeof window !== 'undefined') {
      window.addEventListener('apiHealthUpdate', (event) => {
        callback(event.detail)
      })
    }
  }

  // Remover listener
  offHealthUpdate(callback) {
    if (typeof window !== 'undefined') {
      window.removeEventListener('apiHealthUpdate', callback)
    }
  }
}

// Instância singleton
const apiValidator = new ApiValidator()

// Registrar endpoints principais do Beef Sync
if (typeof window !== 'undefined') {
  const baseUrl = window.location.origin

  // APIs críticas
  apiValidator.registerEndpoint('database', {
    url: `${baseUrl}/api/database/test`,
    critical: true
  })

  apiValidator.registerEndpoint('health', {
    url: `${baseUrl}/api/healthz`,
    critical: true
  })

  apiValidator.registerEndpoint('animals', {
    url: `${baseUrl}/api/animals`,
    critical: true
  })

  // APIs importantes
  apiValidator.registerEndpoint('semen', {
    url: `${baseUrl}/api/semen`,
    critical: false
  })

  apiValidator.registerEndpoint('births', {
    url: `${baseUrl}/api/births`,
    critical: false
  })

  apiValidator.registerEndpoint('reports', {
    url: `${baseUrl}/api/reports/templates`,
    critical: false
  })

  apiValidator.registerEndpoint('notifications', {
    url: `${baseUrl}/api/notifications`,
    critical: false
  })

  // Iniciar monitoramento (verificar a cada 2 minutos)
  apiValidator.startMonitoring(2 * 60 * 1000)
}

export default apiValidator

// Utilitários auxiliares
export const validateApiResponse = (response, expectedFields = []) => {
  if (!response) {
    return { valid: false, error: 'Resposta vazia' }
  }

  if (typeof response !== 'object') {
    return { valid: false, error: 'Resposta não é um objeto' }
  }

  const missingFields = expectedFields.filter(field => !(field in response))
  if (missingFields.length > 0) {
    return { 
      valid: false, 
      error: `Campos obrigatórios ausentes: ${missingFields.join(', ')}` 
    }
  }

  return { valid: true }
}

export const createApiHealthCheck = (name, url, options = {}) => {
  return {
    name,
    url,
    check: async () => {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000,
          ...options
        })

        return {
          name,
          status: response.ok ? 'healthy' : 'error',
          statusCode: response.status,
          timestamp: new Date().toISOString()
        }
      } catch (error) {
        return {
          name,
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        }
      }
    }
  }
}