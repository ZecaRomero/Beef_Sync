/**
 * Context global da aplicação
 * Gerencia estado compartilhado entre componentes
 * Refatorado para usar PostgreSQL ao invés de localStorage
 */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import apiClient from '../utils/apiClient'
import logger from '../utils/logger'
import { useServerEvents } from '../hooks/useServerEvents'

const AppContext = createContext(null)

/**
 * Hook para acessar o contexto da aplicação
 */
export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp deve ser usado dentro de AppProvider')
  }
  return context
}

/**
 * Provider do contexto da aplicação
 * Agora carrega dados do PostgreSQL através das APIs
 */
export function AppProvider({ children }) {
  // Estados dos dados (carregados do PostgreSQL)
  const [animals, setAnimals] = useState([])
  const [birthData, setBirthData] = useState([])
  const [costs, setCosts] = useState([])
  const [semenStock, setSemenStock] = useState([])
  const [notasFiscais, setNotasFiscais] = useState([])

  // Estados temporários
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [initialized, setInitialized] = useState(false)

  // Funções auxiliares
  const clearError = useCallback(() => setError(null), [])

  /**
   * Carrega todos os dados do PostgreSQL
   * Não bloqueia a UI - carrega em background
   */
  const loadAllData = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)

      // Timeout de 8s por requisição - falha mais rápido para não travar o app
      const fetchOpts = { timeout: 8000 }

      // Carregar dados em paralelo para melhor performance
      const [animalsRes, birthsRes, costsRes, semenRes, nfsRes] = await Promise.allSettled([
        apiClient.get('/api/animals', fetchOpts),
        apiClient.get('/api/births', fetchOpts),
        apiClient.get('/api/custos', fetchOpts),
        apiClient.get('/api/semen', fetchOpts),
        apiClient.get('/api/notas-fiscais', fetchOpts),
      ])

      // Processar resultados
      if (animalsRes.status === 'fulfilled') {
        setAnimals(Array.isArray(animalsRes.value.data) ? animalsRes.value.data : [])
      } else {
        logger.warn('Erro ao carregar animais:', animalsRes.reason)
      }

      if (birthsRes.status === 'fulfilled') {
        setBirthData(Array.isArray(birthsRes.value.data) ? birthsRes.value.data : [])
      } else {
        logger.warn('Erro ao carregar nascimentos:', birthsRes.reason)
      }

      if (costsRes.status === 'fulfilled') {
        setCosts(Array.isArray(costsRes.value.data) ? costsRes.value.data : [])
      } else {
        logger.warn('Erro ao carregar custos:', costsRes.reason)
      }

      if (semenRes.status === 'fulfilled') {
        setSemenStock(Array.isArray(semenRes.value.data) ? semenRes.value.data : [])
      } else {
        logger.warn('Erro ao carregar estoque de sêmen:', semenRes.reason)
      }

      if (nfsRes.status === 'fulfilled') {
        setNotasFiscais(Array.isArray(nfsRes.value.data) ? nfsRes.value.data : [])
      } else {
        logger.warn('Erro ao carregar notas fiscais:', nfsRes.reason)
      }

      logger.info('Dados do contexto carregados do PostgreSQL')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      logger.error('Erro ao carregar dados do contexto:', err)
    } finally {
      setLoading(false)
      setInitialized(true)
    }
  }, [])

  /**
   * Recarrega dados específicos
   */
  const refreshData = useCallback(async (dataType) => {
    try {
      let endpoint
      let setter

      switch (dataType) {
        case 'animals':
          endpoint = '/api/animals'
          setter = setAnimals
          break
        case 'births':
          endpoint = '/api/births'
          setter = setBirthData
          break
        case 'costs':
          endpoint = '/api/custos'
          setter = setCosts
          break
        case 'semen':
          endpoint = '/api/semen'
          setter = setSemenStock
          break
        case 'notasFiscais':
          endpoint = '/api/notas-fiscais'
          setter = setNotasFiscais
          break
        default:
          return
      }

      const result = await apiClient.get(endpoint)
      setter(Array.isArray(result.data) ? result.data : [])
    } catch (err) {
      logger.error(`Erro ao recarregar ${dataType}:`, err)
    }
  }, [])

  /**
   * Resetar todos os dados (apenas limpa o estado, não deleta do banco)
   */
  const resetAllData = useCallback(() => {
    if (typeof window === 'undefined') return
    
    const confirmed = window.confirm(
      'Tem certeza que deseja limpar todos os dados do contexto? Esta ação não afeta os dados no banco de dados.'
    )
    
    if (confirmed) {
      setAnimals([])
      setBirthData([])
      setCosts([])
      setSemenStock([])
      setNotasFiscais([])
      logger.info('Dados do contexto resetados')
    }
  }, [])

  // Carregar dados na inicialização (não bloqueia - UI abre imediatamente)
  useEffect(() => {
    if (!initialized) {
      setInitialized(true)
      loadAllData()
    }
  }, [initialized, loadAllData])

  // Ref para throttle do refreshData via SSE (evita múltiplos refreshes simultâneos)
  const refreshTimers = useRef({})

  // Opção 3: SSE — auto-refresh quando servidor emite evento de mudança
  useServerEvents(useCallback((event) => {
    const throttledRefresh = (dataType, delayMs = 800) => {
      if (refreshTimers.current[dataType]) return // já agendado
      refreshTimers.current[dataType] = setTimeout(() => {
        refreshData(dataType)
        delete refreshTimers.current[dataType]
      }, delayMs)
    }

    switch (event.type) {
      case 'animal.created':
      case 'animal.updated':
      case 'animal.deleted':
        throttledRefresh('animals')
        break
      case 'birth.created':
        throttledRefresh('births')
        throttledRefresh('animals', 1200)
        break
      case 'inseminacao.created':
      case 'inseminacao.updated':
        throttledRefresh('animals', 1200)
        break
      case 'pesagem.created':
        throttledRefresh('animals', 1200)
        break
      case 'morte.created':
        throttledRefresh('animals')
        break
      case 'semen.updated':
        throttledRefresh('semen')
        break
      case 'nf.created':
      case 'nf.updated':
        throttledRefresh('notasFiscais')
        break
      default:
        break
    }
  }, [refreshData]))

  // Estatísticas computadas
  const stats = {
    totalAnimals: Array.isArray(animals) ? animals.length : 0,
    activeAnimals: Array.isArray(animals) ? animals.filter(a => a?.situacao === 'Ativo').length : 0,
    totalBirths: Array.isArray(birthData) ? birthData.length : 0,
    totalCosts: Array.isArray(costs) ? costs.reduce((sum, c) => sum + (parseFloat(c?.valor) || 0), 0) : 0,
    totalSemen: Array.isArray(semenStock) ? semenStock.reduce((sum, s) => sum + (parseInt(s?.quantidade_doses || s?.quantidade || 0)), 0) : 0,
  }

  const value = {
    // Dados
    animals,
    setAnimals,
    birthData,
    setBirthData,
    costs,
    setCosts,
    semenStock,
    setSemenStock,
    notasFiscais,
    setNotasFiscais,
    
    // Estado
    loading,
    setLoading,
    error,
    setError,
    clearError,
    initialized,
    
    // Funções
    resetAllData,
    refreshData,
    loadAllData,
    
    // Estatísticas
    stats,
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}
