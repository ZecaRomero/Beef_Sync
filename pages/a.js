/**
 * Consulta Rápida de Animal - Otimizada para celular
 * Acesse pelo celular: /a - sem sidebar, somente Série e RG em inputs separados
 */
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '../contexts/AuthContext'
import { MagnifyingGlassIcon, CheckCircleIcon, XCircleIcon, DevicePhoneMobileIcon, ChartBarIcon, ChatBubbleLeftRightIcon, TrophyIcon } from '@heroicons/react/24/outline'

export default function ConsultaRapida() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [serie, setSerie] = useState('')
  const [rg, setRg] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [touched, setTouched] = useState({ serie: false, rg: false })
  const [showSplash, setShowSplash] = useState(false)
  const [splashProgress, setSplashProgress] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [identificado, setIdentificado] = useState(null)
  const [nomeIdent, setNomeIdent] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const serieRef = useRef(null)
  const buscaPrincipalRef = useRef(null)
  const autoSearchDone = useRef(false)
  const inactivityTimerRef = useRef(null)
  
  // Estados para busca por nome
  const [nomeAnimal, setNomeAnimal] = useState('')
  const [sugestoes, setSugestoes] = useState([])
  const [loadingSugestoes, setLoadingSugestoes] = useState(false)
  const [showSugestoes, setShowSugestoes] = useState(false)
  const searchTimeoutRef = useRef(null)

  // Autenticação Unificada
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Configurar Dark Mode
    const savedDarkMode = localStorage.getItem('darkMode')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (savedDarkMode === 'true' || (!savedDarkMode && prefersDark)) {
      document.documentElement.classList.add('dark')
      setIsDarkMode(true)
    } else {
      document.documentElement.classList.remove('dark')
      setIsDarkMode(false)
    }

    // Aguardar carregamento do auth
    if (authLoading) return

    // 1. Prioridade: Login Principal (Supabase)
    if (user) {
      setIdentificado(true)
      setNomeIdent(user.user_metadata?.nome || user.email)
      return
    }

    // 2. Localhost sempre liberado
    const host = window.location.hostname
    if (host === 'localhost' || host === '127.0.0.1') {
      setIdentificado(true)
      return
    }

    // 3. Fallback: Mobile Auth Legacy (mantido para compatibilidade, mas não forçado)
    try {
      const authData = localStorage.getItem('mobile-auth')
      if (authData) {
        const data = JSON.parse(authData)
        if (data.nome) {
          setIdentificado(true)
          setNomeIdent(data.nome)
          return
        }
      }
    } catch (_) {}

    // 4. Redirecionar para Login Principal se não autenticado
    router.push('/login')
  }, [user, authLoading, router])

  // Deslogar após 10 min de inatividade (apenas para mobile-auth legacy)
  useEffect(() => {
    // Se tiver usuário logado pelo sistema principal (user), não aplica timeout
    if (typeof window === 'undefined' || identificado !== true || user) return

    const resetTimer = () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
      inactivityTimerRef.current = setTimeout(() => {
        localStorage.removeItem('mobile-auth')
        setIdentificado(false)
        router.push('/login')
      }, 600000)
    }

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart']
    events.forEach(event => document.addEventListener(event, resetTimer))
    resetTimer()

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
      events.forEach(event => document.removeEventListener(event, resetTimer))
    }
  }, [identificado, user, router])

  // Detectar se é mobile e mostrar splash apenas em mobile, e só após identificação
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setIsMobile(mobile)
      const skipSplash = typeof window !== 'undefined' && window.location.search.includes('buscar=1')
      setShowSplash(mobile && !skipSplash && identificado === true)
    }
    checkMobile()
  }, [identificado])

  // Splash screen com animação de progresso (apenas mobile)
  useEffect(() => {
    if (!showSplash) return
    
    const duration = 1000 // 3 segundos
    const interval = 50 // atualizar a cada 50ms
    const steps = duration / interval
    let currentStep = 0

    const timer = setInterval(() => {
      currentStep++
      setSplashProgress((currentStep / steps) * 100)
      
      if (currentStep >= steps) {
        clearInterval(timer)
        setTimeout(() => setShowSplash(false), 300)
      }
    }, interval)

    return () => clearInterval(timer)
  }, [showSplash])

  // Auto-buscar se vier pela URL: /a?serie=CJCJ&rg=15563
  useEffect(() => {
    if (!router.isReady || autoSearchDone.current) return
    const { serie: qSerie, rg: qRg } = router.query
    if (qSerie && qRg) {
      autoSearchDone.current = true
      setSerie(String(qSerie).trim())
      setRg(String(qRg).trim())
      setLoading(true)
      const params = new URLSearchParams({ serie: qSerie, rg: qRg })
      fetch(`/api/animals/verificar?${params}`)
        .then((r) => r.json().then((data) => ({ res: r, data })))
        .then(({ res, data }) => {
          if (data.success && data.data?.id) {
            const d = data.data
            router.replace(`/consulta-animal/${d.serie && d.rg ? `${d.serie}-${d.rg}` : d.id}`)
          } else {
            setError(data.message || (res.status === 500 ? 'Serviço indisponível.' : 'Animal não encontrado'))
            setLoading(false)
          }
        })
        .catch(() => {
          setError('Erro ao buscar. Verifique sua conexão.')
          setLoading(false)
        })
    }
  }, [router.isReady, router.query])

  useEffect(() => {
    // Foco no campo principal (nome ou RG) para digitar número direto
    buscaPrincipalRef.current?.focus()
  }, [identificado])

  // Buscar sugestões: se digitar só número = busca por RG; se tiver letras = busca por nome
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    const texto = nomeAnimal.trim()
    const soNumeros = /^\d+$/.test(texto)
    const minLen = soNumeros ? 3 : 2
    if (texto.length < minLen) {
      setSugestoes([])
      setShowSugestoes(false)
      return
    }

    setLoadingSugestoes(true)
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        let data = { success: false, data: [] }
        if (soNumeros) {
          // Digitar só número = buscar por RG (preenche série e nome)
          const res = await fetch(`/api/animals/buscar-por-rg?rg=${encodeURIComponent(texto)}`)
          data = await res.json()
        } else {
          // Texto com letras = buscar por nome
          const res = await fetch(`/api/animals/buscar-por-nome?nome=${encodeURIComponent(texto)}`)
          data = await res.json()
        }

        if (data.success && Array.isArray(data.data)) {
          setSugestoes(data.data)
          setShowSugestoes(data.data.length > 0)
          // Se só 1 resultado e digitou número, preencher e ir direto
          if (soNumeros && data.data.length === 1) {
            const animal = data.data[0]
            setSerie(animal.serie || '')
            setRg(animal.rg || '')
            setNomeAnimal(animal.nome || '')
            setTouched({ serie: true, rg: true })
            setError('')
            if (animal.serie && animal.rg) {
              router.push(`/consulta-animal/${animal.serie}-${animal.rg}`)
            } else if (animal.id) {
              router.push(`/consulta-animal/${animal.id}`)
            }
          }
        } else {
          setSugestoes([])
          setShowSugestoes(false)
        }
      } catch (err) {
        console.error('Erro ao buscar sugestões:', err)
        setSugestoes([])
        setShowSugestoes(false)
      } finally {
        setLoadingSugestoes(false)
      }
    }, soNumeros ? 400 : 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [nomeAnimal, router])

  // Busca automática por RG quando digitar apenas números
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    const rgDigitado = rg.trim()
    // Só busca se tiver pelo menos 3 dígitos e não tiver série preenchida
    if (rgDigitado.length < 3 || serie.trim().length > 0) {
      return
    }

    setLoadingSugestoes(true)
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/animals/buscar-por-rg?rg=${encodeURIComponent(rgDigitado)}`)
        const data = await res.json()
        
        if (data.success && Array.isArray(data.data)) {
          // Se encontrou apenas 1 animal, seleciona automaticamente
          if (data.data.length === 1) {
            const animal = data.data[0]
            setSerie(animal.serie || '')
            setRg(animal.rg || '')
            setNomeAnimal(animal.nome || '')
            setTouched({ serie: true, rg: true })
            setError('')
            // Redireciona automaticamente para a ficha do animal (usar serie-rg = mais confiável que ID)
            if (animal.serie && animal.rg) {
              router.push(`/consulta-animal/${animal.serie}-${animal.rg}`)
            } else if (animal.id) {
              router.push(`/consulta-animal/${animal.id}`)
            }
          } else if (data.data.length > 1) {
            // Se encontrou mais de 1, mostra as sugestões
            setSugestoes(data.data)
            setShowSugestoes(true)
          }
        }
      } catch (err) {
        console.error('Erro ao buscar por RG:', err)
      } finally {
        setLoadingSugestoes(false)
      }
    }, 500) // Debounce de 500ms para dar tempo de digitar

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [rg, serie, router])

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSugestoes && !event.target.closest('.sugestoes-container')) {
        setShowSugestoes(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showSugestoes])

  // Selecionar animal da lista de sugestões
  const selecionarAnimal = (animal) => {
    setSerie(animal.serie || '')
    setRg(animal.rg || '')
    setNomeAnimal(animal.nome || '')
    setShowSugestoes(false)
    setTouched({ serie: true, rg: true })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const s = serie.trim().toUpperCase()
    const r = rg.trim()
    
    if (!s || !r) {
      setError('Preencha Série e RG')
      setTouched({ serie: true, rg: true })
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({ serie: s, rg: r })
      const res = await fetch(`/api/animals/verificar?${params}`)
      const data = await res.json()

      if (!res.ok || !data.success) {
        const msg = data.message || (res.status === 500 ? 'Serviço indisponível. Tente novamente.' : 'Animal não encontrado')
        throw new Error(msg)
      }

      const d = data.data
      if (d) {
        const linkId = (d.serie && d.rg) ? `${d.serie}-${d.rg}` : d.id
        if (linkId) router.push(`/consulta-animal/${linkId}`)
        else throw new Error('Animal não encontrado')
      } else {
        throw new Error('Animal não encontrado')
      }
    } catch (err) {
      setError(err.message || 'Erro ao buscar.')
      setLoading(false)
    }
  }

  const isSerieValid = serie.trim().length > 0
  const isRgValid = rg.trim().length > 0
  const canSubmit = isSerieValid && isRgValid && !loading

  const getInputClass = (isValid, isTouched) => {
    const baseClass = 'w-full px-4 py-4 text-lg rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2'
    
    if (isTouched && !isValid) {
      return `${baseClass} border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-red-500`
    }
    if (isTouched && isValid) {
      return `${baseClass} border-green-400 dark:border-green-500 focus:border-green-500 focus:ring-green-500`
    }
    return `${baseClass} border-gray-300 dark:border-gray-600 focus:border-amber-500 focus:ring-amber-500`
  }

  return (
    <>
      <Head>
        <title>Consulta Animal | Beef-Sync</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Head>

      {/* Splash Screen */}
      {showSplash && (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-amber-900 to-gray-900 flex items-center justify-center z-[9999] transition-opacity duration-300">
          <div className="text-center space-y-8 px-4">
            {/* Logo da Fazenda com Prancheta */}
            <div className="relative">
              <div className="animate-bounce">
                <div className="w-45 h-40 mx-auto relative rounded-2xl shadow-2xl overflow-hidden bg-white">
                  <div className="relative w-full h-full">
                    <Image 
                      src="/logo-santanna.png.jpg" 
                      alt="Logo Fazenda Sant'Anna"
                      fill
                      className="object-"
                      style={{ objectPosition: 'center center' }}
                      priority
                    />
                  </div>
                </div>
              </div>
              
              {/* Prancheta/Clipboard animado */}
              <div 
                className="absolute -right-14 top-10 text-blue-300"
                style={{ 
                  animation: 'float 2s ease-in-out infinite',
                  transformOrigin: 'center'
                }}
              >
                <svg className="w-20 h-35" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  <path d="M9 12h6m-6 4h6"/>
                </svg>
              </div>
            </div>

            {/* Texto */}
            <div className="space-y-3">
              <h1 className="text-4xl font-bold text-white tracking-tight">
                Beef-Sync
              </h1>
              <p className="text-amber-200 text-lg animate-pulse">
                Iniciando o sistema...
              </p>
            </div>

            {/* Barra de progresso */}
            <div className="w-64 mx-auto">
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-300 ease-out"
                  style={{ width: `${splashProgress}%` }}
                />
              </div>
              <p className="text-gray-400 text-sm mt-2">
                {Math.round(splashProgress)}%
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6 bg-gradient-to-br from-gray-50 via-amber-50/30 to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="">
          {/* Logo e Header - só quando identificado (mobile-auth é a única tela de entrada) */}
          {identificado === true && (
          <>
          <div className="mb-8 text-center animate-fade-in">
            <div className="inline-flex items-center justify-center w-24 h-24 mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/30 overflow-hidden p-2">
              <Image 
                src="/Host_ico_rede.ico" 
                alt="Ícone Nelore"
                width={100}
                height={58}
                className="object-contain"
              />
            </div>
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-amber-500 dark:from-amber-500 dark:to-amber-400 bg-clip-text text-transparent">
                Beef-Sync
              </h1>
              
              {/* Controles de Visualização */}
              <div className="flex items-center gap-2">
                {/* Toggle Tema Escuro */}
                <button
                  onClick={() => {
                    const newDarkMode = !isDarkMode
                    
                    // Atualizar estado
                    setIsDarkMode(newDarkMode)
                    
                    // Salvar no localStorage
                    localStorage.setItem('darkMode', newDarkMode.toString())
                    
                    // Atualizar classe no HTML
                    const html = document.documentElement
                    if (newDarkMode) {
                      html.classList.add('dark')
                    } else {
                      html.classList.remove('dark')
                    }
                    
                    // Forçar re-render da página inteira
                    window.location.reload()
                  }}
                  className="bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 p-2 rounded-lg transition-all"
                  title={isDarkMode ? "Modo Claro" : "Modo Escuro"}
                >
                  {isDarkMode ? (
                    <span className="text-xl">☀️</span>
                  ) : (
                    <span className="text-xl">🌙</span>
                  )}
                </button>

                {/* Botão Logout */}
                <button
                  onClick={async () => {
                    if (confirm('Deseja realmente sair?')) {
                      const { supabase } = await import('../lib/supabase')
                      if (supabase) await supabase.auth.signOut()
                      router.push('/login')
                    }
                  }}
                  className="bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 p-2 rounded-lg transition-all"
                  title="Sair"
                >
                  <span className="text-xl">🚪</span>
                </button>
              </div>
            </div>
            <p className="text-base text-gray-600 dark:text-gray-400">
              Bem-vindo! Use os campos abaixo para consultar a ficha de um animal.
            </p>
          </div>

          {/* Card do Formulário */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 mb-4 animate-slide-up">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <MagnifyingGlassIcon className="w-6 h-6 text-amber-600 dark:text-amber-500" />
              Consulta Animal
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Digite só o número (RG) ou o nome — preenche automaticamente
            </p>

            {/* Links para Feedback e Relatórios - Grid 2 colunas */}
            <div className="mb-5 grid grid-cols-2 gap-3">
              <Link
                href="/mobile-feedback"
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold shadow-lg shadow-green-500/30 hover:shadow-green-600/40 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5" />
                <span className="text-sm">Feedback</span>
              </Link>

              <Link
                href="/mobile-relatorios"
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-600/40 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <ChartBarIcon className="h-5 w-5" />
                <span className="text-sm">Ver Relatórios</span>
              </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Campo de Busca por Nome */}
              <div className="relative sugestoes-container">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Buscar por Nome ou RG (digite o número)
                </label>
                <div className="relative">
                  <input
                    ref={buscaPrincipalRef}
                    type="text"
                    value={nomeAnimal}
                    onChange={(e) => {
                      setNomeAnimal(e.target.value)
                      setError('')
                    }}
                    onFocus={() => {
                      if (sugestoes.length > 0) setShowSugestoes(true)
                    }}
                    placeholder="Digite o número (RG) ou nome..."
                    className="w-full px-4 py-4 text-lg rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:border-amber-500 focus:ring-amber-500"
                    autoComplete="off"
                    disabled={loading}
                  />
                  {loadingSugestoes && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <span className="animate-spin rounded-full h-5 w-5 border-2 border-amber-500 border-t-transparent" />
                    </div>
                  )}
                </div>
                
                {/* Lista de Sugestões */}
                {showSugestoes && sugestoes.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                    {sugestoes.map((animal, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => selecionarAnimal(animal)}
                        className="w-full px-4 py-3 text-left hover:bg-amber-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                      >
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {animal.nome || `${animal.serie || ''} ${animal.rg || ''}`.trim() || '—'}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Série: <span className="font-medium text-amber-600 dark:text-amber-500">{animal.serie}</span> • RG: <span className="font-medium text-amber-600 dark:text-amber-500">{animal.rg}</span>
                        </div>
                        {(animal.situacao_reprodutiva || animal.carimbo_leilao) && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {animal.situacao_reprodutiva && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                {animal.situacao_reprodutiva}
                              </span>
                            )}
                            {animal.carimbo_leilao && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                                🏷️ {animal.carimbo_leilao}
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                
                {nomeAnimal.length >= 2 && !loadingSugestoes && sugestoes.length === 0 && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Nenhum animal encontrado. Dica: digite só o RG (ex: 17037) para buscar diretamente.
                  </p>
                )}
              </div>

              {/* Divisor */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">ou busque por Série e RG</span>
                </div>
              </div>

              {/* Campo Série */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Série
                </label>
                <div className="relative">
                  <input
                    ref={serieRef}
                    type="text"
                    value={serie}
                    onChange={(e) => {
                      const v = e.target.value
                      setSerie(v.toUpperCase())
                      setError('')
                      // Se digitou só números no campo Série, tratar como RG e buscar
                      if (/^\d+$/.test(v) && v.length >= 3) {
                        setRg(v)
                        setNomeAnimal(v)
                      }
                    }}
                    onBlur={() => setTouched(prev => ({ ...prev, serie: true }))}
                    placeholder="Série (Ex: CJCJ)"
                    className={getInputClass(isSerieValid, touched.serie)}
                    autoComplete="on"
                    autoCapitalize="characters"
                    inputMode="text"
                    disabled={loading}
                  />
                  {touched.serie && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isSerieValid ? (
                        <CheckCircleIcon className="w-6 h-6 text-green-500" />
                      ) : (
                        <XCircleIcon className="w-6 h-6 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {touched.serie && !isSerieValid && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    A série é obrigatória
                  </p>
                )}
              </div>

              {/* Campo RG */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  RG
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={rg}
                    onChange={(e) => {
                      setRg(e.target.value)
                      setError('')
                    }}
                    onBlur={() => setTouched(prev => ({ ...prev, rg: true }))}
                    placeholder="RG (digite os números)"
                    className={getInputClass(isRgValid, touched.rg)}
                    autoComplete="off"
                    inputMode="numeric"
                    disabled={loading}
                  />
                  {touched.rg && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isRgValid ? (
                        <CheckCircleIcon className="w-6 h-6 text-green-500" />
                      ) : (
                        <XCircleIcon className="w-6 h-6 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {touched.rg && !isRgValid && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    O RG é obrigatório
                  </p>
                )}
              </div>

              {/* Botão de Busca */}
              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full py-4 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold text-lg flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 hover:shadow-amber-600/40 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <MagnifyingGlassIcon className="w-6 h-6" />
                    Buscar
                  </>
                )}
              </button>
            </form>

            {/* Mensagem de Erro */}
            {error && (
              <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm flex items-start gap-2 animate-shake">
                <XCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Dica de Exemplo */}
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2 inline-block">
              💡 Exemplo: Série <span className="font-semibold text-amber-600 dark:text-amber-500">CJCJ</span> e RG <span className="font-semibold text-amber-600 dark:text-amber-500">12345</span>
            </p>
          </div>
          </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(-5deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }

        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </>
  )
}

// Desabilitar layout padrão (sem sidebar)
ConsultaRapida.getLayout = function getLayout(page) {
  return page
}
