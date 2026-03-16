import { useEffect, useState } from 'react'

export function useDashboardStats() {
  const [stats, setStats] = useState({
    totalAnimals: 0,
    activeAnimals: 0,
    totalLocations: 0,
    todayEvents: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true)
        setError(null)

        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort('Timeout'), 8000)
          const statsResponse = await fetch('/api/statistics', { signal: controller.signal })
          clearTimeout(timeoutId)
          if (statsResponse.ok) {
            const statsData = await statsResponse.json()
            if (statsData.success && statsData.data) {
              setStats({
                totalAnimals: statsData.data.totalAnimais || statsData.data.total_animais || 0,
                activeAnimals: statsData.data.animaisAtivos || 0,
                totalLocations: 0,
                todayEvents: 0,
              })
              return
            }
          }
          throw new Error('API de estatísticas indisponível')
        } catch (apiError) {
          if (apiError.name !== 'AbortError' && apiError !== 'Timeout') {
            console.warn('API de estatísticas indisponível, usando dados básicos:', apiError)
          }

          try {
            const ctrl = new AbortController()
            const t = setTimeout(() => ctrl.abort('Timeout'), 8000)
            const animalsResponse = await fetch('/api/animals', { signal: ctrl.signal })
            clearTimeout(t)
            if (animalsResponse.ok) {
              const animalsData = await animalsResponse.json()
              const animals = Array.isArray(animalsData.data) ? animalsData.data : []

              setStats({
                totalAnimals: animals.length,
                activeAnimals: animals.filter((a) => a?.situacao === 'Ativo').length,
                totalLocations: 0,
                todayEvents: 0,
              })
            } else {
              const localAnimals = localStorage.getItem('animals')
              if (localAnimals) {
                const animals = JSON.parse(localAnimals)
                if (Array.isArray(animals)) {
                  setStats({
                    totalAnimals: animals.length,
                    activeAnimals: animals.filter((a) => a?.situacao === 'Ativo').length,
                    totalLocations: 0,
                    todayEvents: 0,
                  })
                }
              }
            }
          } catch (fallbackError) {
            if (fallbackError.name !== 'AbortError' && fallbackError !== 'Timeout') {
              console.error('Erro no fallback:', fallbackError)
              setError('Não foi possível carregar os dados do sistema')
            }
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError' && err !== 'Timeout') {
          console.error('Erro ao carregar estatísticas:', err)
          setError('Erro ao carregar dados do dashboard')
        }
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  return { stats, loading, error }
}

