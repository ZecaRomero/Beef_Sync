/**
 * Cliente API centralizado - Beef Sync
 * Unifica todas as chamadas HTTP com tratamento de erros, timeout e respostas padronizadas
 * @module lib/apiClient
 */

import logger from '../utils/logger'

const BASE_URL = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8081')

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

/**
 * Classe para gerenciar requisições HTTP padronizadas
 */
class ApiClient {
  constructor(baseURL = BASE_URL) {
    this.baseURL = baseURL
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    }
  }

  /**
   * Faz uma requisição HTTP
   * @param {string} endpoint - Endpoint da API (ex: '/api/animals')
   * @param {Object} options - Opções da requisição
   * @returns {Promise<Object>} Resposta padronizada { success, data, message, meta }
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

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`
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

      let data
      const contentType = response.headers.get('content-type')

      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json()
        } catch (parseError) {
          logger.error('Erro ao fazer parse do JSON', { error: parseError, url })
          throw new ApiError(`Erro ao processar resposta da API: ${parseError.message}`, 0, null, parseError)
        }
      } else {
        data = await response.text()
      }

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
        dataLength: Array.isArray(result.data) ? result.data.length : 'N/A',
      })

      return result
    } catch (error) {
      if (error instanceof ApiError) throw error
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

  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' })
  }

  async post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body })
  }

  async put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body })
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' })
  }

  async patch(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body })
  }
}

// Instância padrão do cliente
const apiClient = new ApiClient()

/**
 * Executa uma requisição HTTP (compatibilidade com lib/apiClient antigo)
 * Retorna objeto em vez de lançar - para uso em useFetch e fluxos que esperam { success, data, error }
 */
export async function apiRequest(url, options = {}) {
  const { method = 'GET', body, parseJson = true } = options
  try {
    const result = await apiClient.request(url, { method, body, ...options })
    if (!parseJson) return result
    return {
      success: result.success,
      data: result.data,
      message: result.message,
      errors: result.errors,
      meta: result.meta,
    }
  } catch (error) {
    logger.error('apiRequest error', { url, method, error: error?.message })
    return {
      success: false,
      error: error?.message || 'Erro desconhecido',
      data: null,
    }
  }
}

export const apiGet = (url, options) => apiClient.get(url, options)
export const apiPost = (url, body, options) => apiClient.post(url, body, options)
export const apiPut = (url, body, options) => apiClient.put(url, body, options)
export const apiDelete = (url, options) => apiClient.delete(url, options)

/**
 * Busca múltiplos endpoints em paralelo
 * @param {Array<{key: string, url: string, options?: Object}>} requests
 * @returns {Promise<{ success: boolean, data: Object, errors?: Object }>}
 */
export async function apiAll(requests) {
  const results = await Promise.all(
    requests.map(async ({ key, url, options }) => {
      try {
        const result = await apiClient.get(url, options || {})
        return { key, success: true, data: result.data, error: null }
      } catch (err) {
        return {
          key,
          success: false,
          data: null,
          error: err?.message || err?.toString?.() || 'Erro desconhecido',
        }
      }
    })
  )

  const data = {}
  const errors = {}

  results.forEach(({ key, success, data: d, error }) => {
    if (success) {
      data[key] = d
    } else {
      errors[key] = error
    }
  })

  return {
    success: Object.keys(errors).length === 0,
    data,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  }
}

export default apiClient
