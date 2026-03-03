/**
 * Cliente HTTP padronizado para todas as chamadas de API
 * Garante consistência, tratamento de erros e formatação de respostas
 */

import logger from './logger'

/**
 * Classe para gerenciar requisições HTTP padronizadas
 */
class ApiClient {
  constructor(baseURL = '') {
    this.baseURL = baseURL
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    }
  }

  /**
   * Faz uma requisição HTTP
   * @param {string} endpoint - Endpoint da API
   * @param {Object} options - Opções da requisição
   * @returns {Promise<Object>} Resposta padronizada
   */
  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      body,
      headers = {},
      cache = 'no-cache',
      timeout = 20000,
      ...fetchOptions
    } = options

    const url = `${this.baseURL}${endpoint}`
    const requestHeaders = {
      ...this.defaultHeaders,
      ...headers,
    }

    try {
      logger.debug(`API Request: ${method} ${url}`, { body, headers: requestHeaders })

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        cache,
        signal: controller.signal,
        ...fetchOptions,
      })
      clearTimeout(timeoutId)

      // Tentar fazer parse do JSON
      let data
      const contentType = response.headers.get('content-type')
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json()
        } catch (parseError) {
          logger.error('Erro ao fazer parse do JSON', { error: parseError, url })
          throw new Error(`Erro ao processar resposta da API: ${parseError.message}`)
        }
      } else {
        // Se não for JSON, retornar texto
        data = await response.text()
      }

      // Verificar se houve erro na resposta
      if (!response.ok) {
        const errorMessage = data?.message || data?.error || `Erro ${response.status}: ${response.statusText}`
        logger.error('API Error', {
          url,
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          data,
        })
        
        throw new ApiError(errorMessage, response.status, data)
      }

      // Retornar dados padronizados
      const result = {
        success: data.success !== false,
        data: data.data !== undefined ? data.data : data,
        message: data.message,
        meta: data.meta,
        timestamp: data.timestamp,
        status: response.status,
      }

      logger.debug(`API Response: ${method} ${url}`, { 
        success: result.success,
        status: response.status,
        dataLength: Array.isArray(result.data) ? result.data.length : 'N/A'
      })

      return result
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      if (error?.name === 'AbortError') {
        logger.warn('Requisição cancelada por timeout', { url, method })
        throw new ApiError('Tempo limite excedido. Tente novamente.', 408, null, error)
      }

      logger.error('Erro na requisição HTTP', {
        url,
        method,
        error: error.message,
        stack: error.stack,
      })

      throw new ApiError(
        error.message || 'Erro ao conectar com o servidor',
        0,
        null,
        error
      )
    }
  }

  /**
   * GET request
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' })
  }

  /**
   * POST request
   */
  async post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body })
  }

  /**
   * PUT request
   */
  async put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body })
  }

  /**
   * DELETE request
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' })
  }

  /**
   * PATCH request
   */
  async patch(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body })
  }
}

/**
 * Classe de erro personalizada para APIs
 */
export class ApiError extends Error {
  constructor(message, status = 0, data = null, originalError = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
    this.originalError = originalError
  }
}

// Instância padrão do cliente
const apiClient = new ApiClient()

export default apiClient

