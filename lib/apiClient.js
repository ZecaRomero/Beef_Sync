/**
 * Cliente API centralizado - Beef Sync
 * Centraliza todas as chamadas fetch com tratamento de erros e respostas padronizadas
 */
import logger from '../utils/logger'

const BASE_URL = typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3020'

/**
 * Estrutura padrão de resposta da API
 * @typedef {Object} ApiResponse
 * @property {boolean} success
 * @property {string} message
 * @property {*} [data]
 * @property {*} [errors]
 * @property {string} timestamp
 */

/**
 * Opções para requisições
 * @typedef {Object} RequestOptions
 * @property {string} [method='GET']
 * @property {Object} [headers]
 * @property {*} [body]
 * @property {boolean} [parseJson=true]
 */

/**
 * Executa uma requisição HTTP padronizada
 * @param {string} url - URL ou path da API (ex: '/api/animals')
 * @param {RequestOptions} [options]
 * @returns {Promise<{ success: boolean, data?: *, message?: string, error?: string }>}
 */
export async function apiRequest(url, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body,
    parseJson = true
  } = options

  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  }

  if (body && method !== 'GET') {
    config.body = typeof body === 'string' ? body : JSON.stringify(body)
  }

  try {
    const response = await fetch(fullUrl, config)

    if (!response.ok) {
      const errorData = parseJson ? await response.json().catch(() => ({})) : {}
      throw new Error(
        errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`
      )
    }

    if (parseJson) {
      const json = await response.json()
      return {
        success: json.success !== false,
        data: json.data !== undefined ? json.data : json,
        message: json.message,
        errors: json.errors,
        meta: json.meta
      }
    }

    return { success: true, data: await response.text() }
  } catch (error) {
    logger.error('apiRequest error', { url, method, error: error.message })
    return {
      success: false,
      error: error.message,
      data: null
    }
  }
}

/**
 * GET request
 */
export function apiGet(url, options = {}) {
  return apiRequest(url, { ...options, method: 'GET' })
}

/**
 * POST request
 */
export function apiPost(url, body, options = {}) {
  return apiRequest(url, { ...options, method: 'POST', body })
}

/**
 * PUT request
 */
export function apiPut(url, body, options = {}) {
  return apiRequest(url, { ...options, method: 'PUT', body })
}

/**
 * DELETE request
 */
export function apiDelete(url, options = {}) {
  return apiRequest(url, { ...options, method: 'DELETE' })
}

/**
 * Busca múltiplos endpoints em paralelo
 * @param {Array<{key: string, url: string, options?: RequestOptions}>} requests
 * @returns {Promise<Record<string, *>>}
 */
export async function apiAll(requests) {
  const results = await Promise.all(
    requests.map(async ({ key, url, options }) => {
      const result = await apiRequest(url, options)
      return { key, ...result }
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
    errors: Object.keys(errors).length > 0 ? errors : undefined
  }
}

export default {
  request: apiRequest,
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
  all: apiAll
}
