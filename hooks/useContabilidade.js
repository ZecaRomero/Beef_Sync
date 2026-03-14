import { useState, useEffect, useCallback } from 'react'

/**
 * Hook customizado para gerenciar dados da contabilidade
 */
export const useContabilidade = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [reportStats, setReportStats] = useState({
    totalAnimals: 0,
    nfsEntradas: 0,
    nfsSaidas: 0,
    movimentacoes: 0
  })
  const [resumoAnimais, setResumoAnimais] = useState({
    totalAnimais: 0,
    porSexo: { Macho: 0, Fêmea: 0 },
    porRaca: {}
  })
  const [animaisData, setAnimaisData] = useState([])
  const [nfsEntradasData, setNfsEntradasData] = useState([])
  const [nfsSaidasData, setNfsSaidasData] = useState([])

  // Função para carregar estatísticas
  const loadStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Limpar localStorage para evitar inconsistências
      localStorage.removeItem('nfsEntradas')
      localStorage.removeItem('nfsSaidas')
      localStorage.removeItem('notasFiscais')
      
      // Carregar animais da API
      let totalAnimals = 0
      try {
        const animalsResponse = await fetch('/api/animals')
        if (animalsResponse.ok) {
          const result = await animalsResponse.json()
          const animals = Array.isArray(result) ? result : (result.data || [])
          totalAnimals = animals.length
          setAnimaisData(animals)
        }
      } catch (error) {
        console.error('Erro ao carregar animais da API:', error)
        // Fallback para localStorage
        const animals = JSON.parse(localStorage.getItem('animals') || '[]')
        totalAnimals = animals.length
        setAnimaisData(animals)
      }

      // Carregar notas fiscais da API
      let nfsEntradas = 0
      let nfsSaidas = 0
      let nfsEntradasData = []
      let nfsSaidasData = []
      
      try {
        const nfsResponse = await fetch('/api/notas-fiscais?' + Date.now(), {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
        if (nfsResponse.ok) {
          const nfs = await nfsResponse.json()
          const nfsArray = Array.isArray(nfs) ? nfs : (Array.isArray(nfs.data) ? nfs.data : [])
          
          nfsEntradasData = nfsArray.filter(nf => nf.tipo === 'entrada')
          nfsSaidasData = nfsArray.filter(nf => nf.tipo === 'saida')
          
          nfsEntradas = nfsEntradasData.length
          nfsSaidas = nfsSaidasData.length
        }
      } catch (error) {
        console.error('Erro ao carregar NFs da API:', error)
        nfsEntradas = 0
        nfsSaidas = 0
        nfsEntradasData = []
        nfsSaidasData = []
      }
      
      setReportStats({
        totalAnimals,
        nfsEntradas,
        nfsSaidas,
        movimentacoes: nfsEntradas + nfsSaidas
      })
      
      setNfsEntradasData(nfsEntradasData)
      setNfsSaidasData(nfsSaidasData)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
      setError('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [])

  // Função para carregar resumo dos animais
  const loadResumoAnimais = useCallback(async () => {
    try {
      // Primeiro tentar carregar da API (PostgreSQL)
      try {
        const response = await fetch('/api/animals')
        if (response.ok) {
          const result = await response.json()
          const animals = Array.isArray(result) ? result : (result.data || [])
          
          setAnimaisData(animals)
          
          const porSexo = animals.reduce((acc, animal) => {
            const sexo = animal.sexo || 'Não informado'
            acc[sexo] = (acc[sexo] || 0) + 1
            return acc
          }, {})

          const porRaca = animals.reduce((acc, animal) => {
            const raca = animal.raca || 'Não informado'
            acc[raca] = (acc[raca] || 0) + 1
            return acc
          }, {})

          setResumoAnimais({
            totalAnimais: animals.length,
            porSexo,
            porRaca
          })
          
          console.log('✅ Resumo carregado da API:', animals.length, 'animais')
          return
        }
      } catch (apiError) {
        console.error('❌ Erro ao conectar com API:', apiError)
      }
      
      // Fallback para localStorage
      const animals = JSON.parse(localStorage.getItem('animals') || '[]')
      setAnimaisData(animals)
      
      const porSexo = animals.reduce((acc, animal) => {
        const sexo = animal.sexo || 'Não informado'
        acc[sexo] = (acc[sexo] || 0) + 1
        return acc
      }, {})

      const porRaca = animals.reduce((acc, animal) => {
        const raca = animal.raca || 'Não informado'
        acc[raca] = (acc[raca] || 0) + 1
        return acc
      }, {})

      setResumoAnimais({
        totalAnimais: animals.length,
        porSexo,
        porRaca
      })
      
      console.log('⚠️ Resumo carregado do localStorage:', animals.length, 'animais')
    } catch (error) {
      console.error('Erro ao carregar resumo dos animais:', error)
      setError('Erro ao carregar resumo dos animais')
    }
  }, [])

  return {
    loading,
    error,
    reportStats,
    resumoAnimais,
    animaisData,
    nfsEntradasData,
    nfsSaidasData,
    loadStats,
    loadResumoAnimais,
    setLoading,
    setError
  }
}

export default useContabilidade