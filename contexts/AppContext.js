/**
 * Context global da aplicaÃ§Ã£o
 * Gerencia estado compartilhado entre componentes
 * Refatorado para usar PostgreSQL ao invÃ©s de localStorage
 */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import apiClient from '../utils/apiClient'
import logger from '../utils/logger'
import { useServerEvents } from '../hooks/useServerEvents'
import { useAuth } from './AuthContext'

const AppContext = createContext(null)

/**
 * Hook para acessar o contexto da aplicaÃ§Ã£o
 */
export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp deve ser usado dentro de AppProvider')
  }
  return context
}

/**
 * Provider do contexto da aplicaÃ§Ã£o
 * Agora carrega dados do PostgreSQL atravÃ©s das APIs
 */
export function AppProvider({ children }) {
  const { user } = useAuth()
  // Estados dos dados (carregados do PostgreSQL)
  const [animals, setAnimals] = useState([])
  const [birthData, setBirthData] = useState([])
  // const [costs, setCosts] = useState([]) // Removido para otimizaÃ§Ã£o - carregado sob demanda
  const [semenStock, setSemenStock] = useState([])
  const [notasFiscais, setNotasFiscais] = useState([])

  // Estados temporÃ¡rios
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [initialized, setInitialized] = useState(false)

  // FunÃ§Ãµes auxiliares
  const clearError = useCallback(() => setError(null), [])

  /**
   * Carrega todos os dados do PostgreSQL
   * NÃ£o bloqueia a UI - carrega em background
   */
  const loadAllData = useCallback(async ({ background = false } = {}) => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setError(null)
      if (!background) {
        setLoading(true)
      }

      // Carregar primeiro apenas o que Ã© mais crÃ­tico para abrir o app rÃ¡pido
      const criticalFetchOpts = { timeout: 8000 }
      const animalsRes = await apiClient.get('/api/animals', criticalFetchOpts)
      setAnimals(Array.isArray(animalsRes?.data) ? animalsRes.data : [])

      // Carregar dados complementares em background (sem bloquear entrada)
      const backgroundFetchOpts = { timeout: 5000 }
      Promise.allSettled([
        apiClient.get('/api/births', backgroundFetchOpts),
        apiClient.get('/api/semen', backgroundFetchOpts),
        apiClient.get('/api/notas-fiscais', backgroundFetchOpts),
      ]).then(([birthsRes, semenRes, nfsRes]) => {
        if (birthsRes.status === 'fulfilled') {
          setBirthData(Array.isArray(birthsRes.value.data) ? birthsRes.value.data : [])
        } else {
          logger.warn('Erro ao carregar nascimentos:', birthsRes.reason)
        }

        if (semenRes.status === 'fulfilled') {
          setSemenStock(Array.isArray(semenRes.value.data) ? semenRes.value.data : [])
        } else {
          logger.warn('Erro ao carregar estoque de semen:', semenRes.reason)
        }

        if (nfsRes.status === 'fulfilled') {
          setNotasFiscais(Array.isArray(nfsRes.value.data) ? nfsRes.value.data : [])
        } else {
          logger.warn('Erro ao carregar notas fiscais:', nfsRes.reason)
        }
      })

      logger.info('Dados do contexto carregados do PostgreSQL')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      logger.error('Erro ao carregar dados do contexto:', err)
    } finally {
      if (!background) {
        setLoading(false)
      }
      setInitialized(true)
    }
  }, [user])

  /**
   * Recarrega dados especÃ­ficos
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
        /*
        case 'costs':
          endpoint = '/api/custos'
          setter = setCosts
          break
        */
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
   * Resetar todos os dados (apenas limpa o estado, nÃ£o deleta do banco)
   */
  const resetAllData = useCallback(() => {
    if (typeof window === 'undefined') return
    
    const confirmed = window.confirm(
      'Tem certeza que deseja limpar todos os dados do contexto? Esta aÃ§Ã£o nÃ£o afeta os dados no banco de dados.'
    )
    
    if (confirmed) {
      setAnimals([])
      setBirthData([])
      // setCosts([])
      setSemenStock([])
      setNotasFiscais([])
      logger.info('Dados do contexto resetados')
    }
  }, [])

  // Carregar dados na inicializaÃ§Ã£o (nÃ£o bloqueia - UI abre imediatamente)
  useEffect(() => {
    if (!user) {
      setLoading(false)
      if (initialized) {
        setInitialized(false)
      }
      return
    }

    if (!initialized) {
      setInitialized(true)
      // Evita travar navegaÃ§Ã£o de entrada; carrega em background.
      loadAllData({ background: true })
    }
  }, [user, initialized, loadAllData])

  // Ref para throttle do refreshData via SSE (evita mÃºltiplos refreshes simultÃ¢neos)
  const refreshTimers = useRef({})

  // OpÃ§Ã£o 3: SSE ââ‚¬â€� auto-refresh quando servidor emite evento de mudanÃ§a
  useServerEvents(useCallback((event) => {
    const throttledRefresh = (dataType, delayMs = 800) => {
      if (refreshTimers.current[dataType]) return // jÃ¡ agendado
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

  // EstatÃ­sticas computadas
  const stats = {
    totalAnimals: Array.isArray(animals) ? animals.length : 0,
    activeAnimals: Array.isArray(animals) ? animals.filter(a => a?.situacao === 'Ativo').length : 0,
    totalBirths: Array.isArray(birthData) ? birthData.length : 0,
    // totalCosts: Array.isArray(costs) ? costs.reduce((sum, c) => sum + (parseFloat(c?.valor) || 0), 0) : 0, // Removido
    totalSemen: Array.isArray(semenStock) ? semenStock.reduce((sum, s) => sum + (parseInt(s?.quantidade_doses || s?.quantidade || 0)), 0) : 0,
  }

  const value = {
    // Dados
    animals,
    setAnimals,
    birthData,
    setBirthData,
    // costs, // Removido
    // setCosts, // Removido
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
    
    // FunÃ§Ãµes
    resetAllData,
    refreshData,
    loadAllData,
    
    // EstatÃ­sticas
    stats,
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}
