import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Card, CardHeader, CardBody } from '../components/ui/Card'
import Button from '../components/ui/Button'
import LotesWidget from '../components/LotesWidget'
import AccessMonitor from '../components/ui/AccessMonitor'
import InteractiveDashboard from '../components/InteractiveDashboard'
import AlertasDGWidget from '../components/AlertasDGWidget'
import { 
  ChartBarIcon,
  UserGroupIcon,
  CubeIcon,
  CalendarIcon,
  ClockIcon
} from '../components/ui/Icons'
import { SparklesIcon, LightBulbIcon } from '../components/ui/Icons'

const NotasFiscaisRecentesWidget = () => {
  const router = useRouter()
  const [notasFiscais, setNotasFiscais] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/notas-fiscais')
      .then(r => r.ok ? r.json() : { data: [] })
      .then(result => {
        // Pegar as 3 notas mais recentes
        const recentes = (result.data || []).slice(0, 3)
        setNotasFiscais(recentes)
      })
      .catch(() => setNotasFiscais([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading || notasFiscais.length === 0) return null

  return (
    <Card className="mb-6 border-2 border-blue-300 dark:border-blue-700 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
      <CardBody className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-blue-800 dark:text-blue-200 flex items-center gap-2">
              <span>📋</span> Notas Fiscais Recentes
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Últimas movimentações cadastradas
            </p>
          </div>
          <button
            onClick={() => router.push('/notas-fiscais')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all"
          >
            Ver Todas
          </button>
        </div>
        
        <div className="space-y-3">
          {notasFiscais.map((nf) => {
            const isEntrada = nf.tipo === 'entrada'
            const dataFormatada = new Date(nf.data).toLocaleDateString('pt-BR')
            
            return (
              <div
                key={nf.id}
                onClick={() => router.push(`/notas-fiscais?busca=${nf.numero_nf}`)}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        isEntrada 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                          : 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300'
                      }`}>
                        {isEntrada ? '📥 ENTRADA' : '📤 SAÍDA'}
                      </span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        NF {nf.numero_nf}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {isEntrada ? nf.fornecedor : nf.destino} • {dataFormatada}
                    </p>
                    {nf.total_itens > 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {nf.total_itens} {nf.total_itens === 1 ? 'item' : 'itens'}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {nf.valor_total_calculado > 0 && (
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        R$ {Number(nf.valor_total_calculado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardBody>
    </Card>
  )
}

const ReceptorasNF2141Widget = () => {
  const router = useRouter()
  const [receptoras, setReceptoras] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/notas-fiscais/receptoras?numero=2141')
      .then(r => r.ok ? r.json() : { receptoras: [] })
      .then(data => setReceptoras(data.receptoras || []))
      .catch(() => setReceptoras([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading || receptoras.length === 0) return null

  return (
    <Card 
      className="mb-6 border-2 border-pink-300 dark:border-pink-700 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
      onClick={() => router.push('/notas-fiscais?busca=2141')}
    >
      <CardBody className="p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-pink-800 dark:text-pink-200 flex items-center gap-2">
                <span>🤰</span> Receptoras NF 2141
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {receptoras.length} receptoras chegaram — clique no card para conferir a atividade
              </p>
            </div>
            <div className="text-pink-500 text-2xl">➔</div>
          </div>
          
          {/* Resumo visual */}
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 border border-pink-200 dark:border-pink-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-pink-100 dark:bg-pink-900/40 rounded-full p-3">
                  <span className="text-2xl">✅</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <p className="text-lg font-bold text-pink-800 dark:text-pink-200">Cadastradas no Sistema</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-3xl font-bold text-pink-600 dark:text-pink-400">{receptoras.length}</p>
              </div>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

const LastAnimalWidget = () => {
  const [lastAnimals, setLastAnimals] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedRace, setSelectedRace] = useState('all')

  useEffect(() => {
    const fetchLastAnimals = async () => {
      try {
        // Buscar todos os animais ordenados por data de cadastro
        const res = await fetch('/api/animals?orderBy=created_at')
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.data && data.data.length > 0) {
            // Agrupar por raça e pegar o último de cada
            const animalsByRace = {}
            const racas = new Set()
            
            data.data.forEach(animal => {
              const raca = animal.raca || 'Sem Raça'
              racas.add(raca)
              
              if (!animalsByRace[raca]) {
                animalsByRace[raca] = animal
              }
            })
            
            // Adicionar "Todos" com o último animal geral
            animalsByRace['all'] = data.data[0]
            
            setLastAnimals(animalsByRace)
          }
        }
      } catch (err) {
        console.error('Erro ao buscar últimos animais:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchLastAnimals()
  }, [])

  if (loading) {
    return (
      <Card className="mb-6 border-2 border-gray-300 dark:border-gray-700">
        <CardBody className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando últimos animais...</p>
        </CardBody>
      </Card>
    )
  }

  if (Object.keys(lastAnimals).length === 0) return null

  const currentAnimal = lastAnimals[selectedRace] || lastAnimals['all']
  const racas = Object.keys(lastAnimals).filter(r => r !== 'all').sort()

  return (
    <Card className="mb-6 border-2 border-yellow-400 bg-gray-900 shadow-xl transform transition-all hover:scale-[1.002]">
      <CardBody className="flex flex-col gap-3 p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-2 border-b border-gray-700 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-bounce">🆕</span>
            <h3 className="text-xl font-black text-white uppercase tracking-wider">
              Últimos Animais Cadastrados
            </h3>
          </div>
          <div className="bg-red-600 text-white px-4 py-1 rounded-full border border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse">
            <span className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              ⚠️ Verifique antes de cadastrar ⚠️
            </span>
          </div>
        </div>

        {/* Filtro por Raça */}
        <div className="flex flex-wrap gap-2 pb-2 border-b border-gray-700">
          <button
            onClick={() => setSelectedRace('all')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              selectedRace === 'all'
                ? 'bg-yellow-500 text-gray-900 shadow-lg scale-105'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            🔥 Todos
          </button>
          {racas.map(raca => (
            <button
              key={raca}
              onClick={() => setSelectedRace(raca)}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                selectedRace === raca
                  ? 'bg-blue-500 text-white shadow-lg scale-105'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {raca === 'Nelore' && '🐂'}
              {raca === 'Angus' && '🐄'}
              {raca === 'Brahman' && '🐃'}
              {raca === 'Mestiça' && '🐮'}
              {!['Nelore', 'Angus', 'Brahman', 'Mestiça'].includes(raca) && '🐄'}
              {' '}{raca}
            </button>
          ))}
        </div>
        
        {currentAnimal && (
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 bg-gray-800 p-3 rounded-xl border border-gray-700 shadow-inner">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="col-span-1 md:col-span-2 bg-gray-900 p-2 rounded-lg border border-gray-700">
                  <span className="text-gray-400 block text-xs font-bold uppercase tracking-widest mb-0.5">
                    Identificação (Série / RG)
                  </span>
                  <span className="font-black text-yellow-400 text-3xl md:text-4xl tracking-tight leading-none drop-shadow-md">
                    {currentAnimal.serie} {currentAnimal.rg}
                  </span>
                </div>
                
                <div className="bg-gray-900 p-2 rounded-lg border border-gray-700">
                  <span className="text-gray-400 block text-xs font-bold uppercase tracking-widest mb-0.5">Raça</span>
                  <span className="font-bold text-white text-xl">{currentAnimal.raca}</span>
                </div>
                
                <div className="bg-gray-900 p-2 rounded-lg border border-gray-700">
                  <span className="text-gray-400 block text-xs font-bold uppercase tracking-widest mb-0.5">Sexo</span>
                  <span className="font-bold text-white text-xl">{currentAnimal.sexo}</span>
                </div>
              </div>
              
              <div className="mt-3 flex flex-col md:flex-row items-start md:items-center justify-between text-gray-400 text-xs border-t border-gray-700 pt-2 gap-2">
                <div className="flex items-center gap-2">
                  <span>📅 Cadastrado em:</span>
                  <span className="text-white font-bold text-base">
                    {new Date(currentAnimal.created_at || Date.now()).toLocaleDateString('pt-BR')} às {new Date(currentAnimal.created_at || Date.now()).toLocaleTimeString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🔢 ID:</span>
                  <span className="font-mono text-gray-500">{currentAnimal.id}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center md:w-40">
              <Button 
                onClick={() => window.location.href = `/animals?edit=${currentAnimal.id}`}
                className="w-full h-full min-h-[60px] text-lg font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/50 rounded-xl border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all"
              >
                Ver Detalhes
              </Button>
            </div>
          </div>
        )}

        {/* Resumo por Raça */}
        <div className="mt-2 pt-2 border-t border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {racas.map(raca => {
              const animal = lastAnimals[raca]
              return (
                <div
                  key={raca}
                  className="bg-gray-800 p-2 rounded-lg border border-gray-700 hover:border-blue-500 transition-all cursor-pointer"
                  onClick={() => setSelectedRace(raca)}
                >
                  <div className="text-xs text-gray-400 font-bold uppercase">{raca}</div>
                  <div className="text-sm text-white font-bold truncate">{animal.serie}-{animal.rg}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(animal.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({
    totalAnimals: 0,
    activeAnimals: 0,
    totalLocations: 0,
    todayEvents: 0
  })
  const [showInteractive, setShowInteractive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [darkMode, setDarkMode] = useState(false)

  // Carregar preferência de tema
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark)
    setDarkMode(isDark)
    if (isDark) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  // Alternar tema
  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    if (newMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  // Redirecionar para mobile se acessar do celular (desabilitado - agora é manual)
  // useEffect(() => {
  //   const isMobileUA = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  //   const isSmallScreen = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 768px)').matches
  //   const isMobile = isMobileUA || isSmallScreen
  //   
  //   if (isMobile) {
  //     router.replace('/a')
  //   }
  // }, [router])

  // Carregar estatísticas do sistema
  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true)
        setError(null)

        // Carregar estatísticas da API (timeout 12s para não travar)
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort('Timeout'), 12000)
          const statsResponse = await fetch('/api/statistics', { signal: controller.signal })
          clearTimeout(timeoutId)
          if (statsResponse.ok) {
            const statsData = await statsResponse.json()
            if (statsData.success && statsData.data) {
              setStats({
                totalAnimals: statsData.data.totalAnimais || statsData.data.total_animais || 0,
                activeAnimals: statsData.data.animaisAtivos || 0,
                totalLocations: 0, // Será carregado separadamente se necessário
                todayEvents: 0 // Será calculado se necessário
              })
            }
          } else {
            throw new Error('API de estatísticas indisponível')
          }
        } catch (apiError) {
          if (apiError.name !== 'AbortError' && apiError !== 'Timeout') {
            console.warn('API de estatísticas indisponível, usando dados básicos:', apiError)
          }
          
          // Fallback: tentar carregar animais diretamente (timeout 12s)
          try {
            const ctrl = new AbortController()
            const t = setTimeout(() => ctrl.abort('Timeout'), 12000)
            const animalsResponse = await fetch('/api/animals', { signal: ctrl.signal })
            clearTimeout(t)
            if (animalsResponse.ok) {
              const animalsData = await animalsResponse.json()
              const animals = Array.isArray(animalsData.data) ? animalsData.data : []
              
              setStats({
                totalAnimals: animals.length,
                activeAnimals: animals.filter(a => a?.situacao === 'Ativo').length,
                totalLocations: 0,
                todayEvents: 0
              })
            } else {
              // Último fallback: localStorage
              const localAnimals = localStorage.getItem('animals')
              if (localAnimals) {
                const animals = JSON.parse(localAnimals)
                if (Array.isArray(animals)) {
                  setStats({
                    totalAnimals: animals.length,
                    activeAnimals: animals.filter(a => a?.situacao === 'Ativo').length,
                    totalLocations: 0,
                    todayEvents: 0
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

      } catch (error) {
        if (error.name !== 'AbortError' && error !== 'Timeout') {
          console.error('Erro ao carregar estatísticas:', error)
          setError('Erro ao carregar dados do dashboard')
        }
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  // Mostrar loading
  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Carregando dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Mostrar erro se houver */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Erro no Dashboard
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cabeçalho Mobile-Friendly */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-lg p-4 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-white opacity-10 rounded-lg"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold mb-2 flex items-center space-x-2">
                <span className="text-3xl md:text-5xl">📊</span>
                <span>Beef Sync</span>
              </h1>
              <p className="text-blue-100 text-sm md:text-lg">Visão geral do rebanho</p>
            </div>
            
            {/* Controles de Visualização */}
            <div className="flex items-center gap-2">
              {/* Botão Modo Mobile */}
              <button
                onClick={() => router.push('/a')}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-2 md:p-3 rounded-lg transition-all"
                title="Modo Mobile"
              >
                <span className="text-xl md:text-2xl">📱</span>
              </button>
              
              {/* Toggle Tema Escuro */}
              <button
                onClick={toggleDarkMode}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-2 md:p-3 rounded-lg transition-all"
                title={darkMode ? 'Modo Claro' : 'Modo Escuro'}
              >
                <span className="text-xl md:text-2xl">{darkMode ? '☀️' : '🌙'}</span>
              </button>
            </div>
          </div>
          
          {/* Toggle para Dashboard Interativo */}
          <div className="mt-3 flex items-center space-x-2">
            <button
              onClick={() => setShowInteractive(!showInteractive)}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-white text-sm md:text-base font-medium transition-all flex items-center space-x-1.5"
            >
              <span>{showInteractive ? '📊' : '📈'}</span>
              <span className="hidden sm:inline">{showInteractive ? 'Simples' : 'Interativo'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Beef IA Insights Section - Mobile Optimized */}
      <div className="grid grid-cols-1 gap-4 md:gap-6">
        <Card className="bg-gradient-to-br from-violet-600 to-indigo-600 text-white border-none shadow-lg">
          <CardBody className="p-4 md:p-6 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center space-x-2 mb-3">
                <span className="bg-white/20 p-1.5 rounded-lg">
                  <SparklesIcon className="h-5 w-5 text-yellow-300" />
                </span>
                <h3 className="font-bold text-lg">Beef IA Insights</h3>
              </div>
              
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-md border border-white/10">
                <p className="text-sm flex items-start gap-2">
                  <span className="text-lg">💡</span>
                  <span className="leading-relaxed">
                    Taxa de prenhez "Matrizes A" aumentou <span className="text-green-300 font-bold">5%</span> este mês.
                  </span>
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white border-none shadow-lg">
          <CardBody className="p-4 md:p-6 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center space-x-2 mb-3">
                <span className="bg-white/20 p-1.5 rounded-lg">
                  <LightBulbIcon className="h-5 w-5 text-yellow-300" />
                </span>
                <h3 className="font-bold text-lg">Dica de Manejo</h3>
              </div>
              
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-md border border-white/10">
                <p className="text-sm flex items-start gap-2">
                  <span className="text-lg">🌡️</span>
                  <span className="leading-relaxed">
                    Alta temperatura amanhã. Antecipe o manejo para a manhã.
                  </span>
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Widget de Alertas de DG */}
      <AlertasDGWidget />

      {/* Notas Fiscais Recentes */}
      <NotasFiscaisRecentesWidget />

      {/* Receptoras NF 2141 - Acesso Rápido */}
      <ReceptorasNF2141Widget />

      {/* Widget do Último Animal Cadastrado */}
      <LastAnimalWidget />

      {/* Ações Rápidas */}
      <div className="grid grid-cols-1">
        <Card 
          className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border-l-4 border-indigo-500 bg-gradient-to-r from-white to-indigo-50 dark:from-gray-800 dark:to-indigo-900/20"
          onClick={() => window.location.href = '/relatorios-lotes'}
        >
          <CardBody className="flex items-center space-x-4 p-6">
            <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full shadow-sm">
              <ClockIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Histórico de Lançamentos
                <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full dark:bg-indigo-900 dark:text-indigo-300">Acesso Rápido</span>
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Visualize e gerencie todas as operações em lote realizadas no sistema (cadastros, movimentações, etc.)
              </p>
            </div>
            <div className="hidden md:block">
              <span className="text-indigo-500 text-2xl">➔</span>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Renderizar Dashboard Interativo ou Simples */}
      {showInteractive ? (
        <InteractiveDashboard />
      ) : (
        <>
          {/* Cards de Estatísticas - Mobile Optimized */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            <Card>
              <CardBody className="flex flex-col items-center text-center p-3 md:p-4">
                <div className="p-2 md:p-3 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-900 rounded-full mb-2">
                  <UserGroupIcon className="h-5 w-5 md:h-8 md:w-8 text-blue-600 dark:text-blue-300" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{stats.totalAnimals}</h3>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Total</p>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="flex flex-col items-center text-center p-3 md:p-4">
                <div className="p-2 md:p-3 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-800 dark:to-green-900 rounded-full mb-2">
                  <ChartBarIcon className="h-5 w-5 md:h-8 md:w-8 text-green-600 dark:text-green-300" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{stats.activeAnimals}</h3>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Ativos</p>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="flex flex-col items-center text-center p-3 md:p-4">
                <div className="p-2 md:p-3 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-800 dark:to-purple-900 rounded-full mb-2">
                  <CubeIcon className="h-5 w-5 md:h-8 md:w-8 text-purple-600 dark:text-purple-300" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{stats.totalLocations}</h3>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Locais</p>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="flex flex-col items-center text-center p-3 md:p-4">
                <div className="p-2 md:p-3 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-800 dark:to-orange-900 rounded-full mb-2">
                  <CalendarIcon className="h-5 w-5 md:h-8 md:w-8 text-orange-600 dark:text-orange-300" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{stats.todayEvents}</h3>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Hoje</p>
              </CardBody>
            </Card>
          </div>

          {/* Widget de Lotes */}
          <div className="mb-6">
            <LotesWidget />
          </div>

          {/* Monitor de Acesso */}
          <div className="mb-6">
            <AccessMonitor />
          </div>

          {/* Ações Rápidas - Mobile Optimized */}
          <Card>
            <CardHeader>
              <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <span className="mr-2">⚡</span>
                Ações Rápidas
              </h2>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
                <Button
                  onClick={() => window.location.href = '/animals'}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 md:py-3 px-2 md:px-4 rounded-lg text-xs md:text-sm flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2"
                >
                  <span className="text-lg md:text-xl">👥</span>
                  <span>Animais</span>
                </Button>

                <Button
                  onClick={() => window.location.href = '/localizacao-animais'}
                  className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 md:py-3 px-2 md:px-4 rounded-lg text-xs md:text-sm flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2"
                >
                  <span className="text-lg md:text-xl">📍</span>
                  <span>Localização</span>
                </Button>

                <Button
                  onClick={() => window.location.href = '/protocolos'}
                  className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 md:py-3 px-2 md:px-4 rounded-lg text-xs md:text-sm flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2"
                >
                  <span className="text-lg md:text-xl">📋</span>
                  <span>Protocolos</span>
                </Button>

                <Button
                  onClick={() => window.location.href = '/dados-teste'}
                  className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 md:py-3 px-2 md:px-4 rounded-lg text-xs md:text-sm flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2"
                >
                  <span className="text-lg md:text-xl">🧪</span>
                  <span>Testes</span>
                </Button>

                <Button
                  onClick={() => window.location.href = '/relatorios-lotes'}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 md:py-3 px-2 md:px-4 rounded-lg text-xs md:text-sm flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2"
                >
                  <span className="text-lg md:text-xl">📊</span>
                  <span>Lançamentos</span>
                </Button>

                <Button
                  onClick={() => window.location.href = '/teste-lotes'}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 md:py-3 px-2 md:px-4 rounded-lg text-xs md:text-sm flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2"
                >
                  <span className="text-lg md:text-xl">🔬</span>
                  <span>Teste Lotes</span>
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Aviso sobre Funcionalidades Melhorado */}
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardBody>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-blue-500 p-6 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="text-3xl animate-bounce">ℹ️</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-blue-800 dark:text-blue-300 text-lg mb-2">Dashboard Simplificado</h3>
                    <p className="text-blue-700 dark:text-blue-400 mb-3">
                      Esta é uma versão simplificada do dashboard. Use os botões acima para acessar as funcionalidades principais do sistema.
                    </p>
                    <p className="text-blue-600 dark:text-blue-300 text-sm font-medium">
                      💡 Dica: Clique em "Dashboard Interativo" no cabeçalho para ver gráficos avançados e análises detalhadas!
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  )
}
