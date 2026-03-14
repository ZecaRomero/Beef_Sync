/**
 * Hook useFetch - Busca dados com estado de loading/error
 * Compatível com o cliente API centralizado
 */
import { useState, useCallback, useEffect } from 'react'
import { apiRequest, apiAll } from '../lib/apiClient'
import logger from '../utils/logger'

/**
 * @param {string} url - URL da API
 * @param {Object} [options]
 * @param {boolean} [options.enabled=true] - Se false, não executa a busca
 * @param {*} [options.deps=[]] - Dependências para refetch (ex: [year, month])
 * @param {number} [options.cacheTTL=0] - TTL do cache em ms (0 = sem cache)
 * @returns {{ data: *, loading: boolean, error: string|null, refetch: function }}
 */
export function useFetch(url, options = {}) {
  const {
    enabled = true,
    deps = [],
    cacheTTL = 0
  } = options

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    if (!enabled || !url) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await apiRequest(url)

      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || 'Erro ao carregar dados')
        setData(null)
      }
    } catch (err) {
      logger.error('useFetch error', { url, error: err?.message })
      setError(err?.message || 'Erro desconhecido')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [url, enabled, ...deps])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch: fetchData
  }
}

/**
 * Hook para buscar múltiplos endpoints em paralelo
 * @param {Array<{key: string, url: string}>} requests
 * @param {Array} [deps=[]] - Dependências para refetch
 * @returns {{ data: Object, loading: boolean, error: Object|null, refetch: function }}
 */
export function useFetchAll(requests, deps = []) {
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await apiAll(requests)

      if (result.success) {
        setData(result.data)
      } else {
        setError(result.errors)
        setData({})
      }
    } catch (err) {
      logger.error('useFetchAll error', { error: err?.message })
      setError({ _: err?.message })
      setData({})
    } finally {
      setLoading(false)
    }
  }, [requests?.length, ...deps])

  useEffect(() => {
    if (requests?.length) {
      fetchAll()
    } else {
      setLoading(false)
    }
  }, [fetchAll, requests?.length])

  return {
    data,
    loading,
    error,
    refetch: fetchAll
  }
}

export default useFetch
