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
import { formatNomeAnimal } from '../utils/animalUtils'
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
  const [recentes, setRecentes] = useState([])
  const [sugestaoAtivaIdx, setSugestaoAtivaIdx] = useState(-1)
  const [ultimoConsultado, setUltimoConsultado] = useState(null)
  const [modoBusca, setModoBusca] = useState('inteligente')
  const searchTimeoutRef = useRef(null)

  const addBuscaRecente = (animal) => {
    if (typeof window === 'undefined' || !animal) return
    const item = {
      id: animal.id || `${animal.serie || ''}-${animal.rg || ''}`,
      serie: String(animal.serie || '').trim().toUpperCase(),
      rg: String(animal.rg || '').trim(),
      nome: String(animal.nome || '').trim(),
    }
    if (!item.serie || !item.rg) return
    setRecentes((prev) => {
      const next = [item, ...prev.filter((r) => !(r.serie === item.serie && r.rg === item.rg))].slice(0, 5)
      localStorage.setItem('consulta-rapida-recentes', JSON.stringify(next))
      return next
    })
  }

  const registrarConsultaAnimal = (animal) => {
    if (!animal) return
    addBuscaRecente(animal)
    const s = String(animal.serie || '').trim().toUpperCase()
    const r = String(animal.rg || '').trim()
    if (!s || !r) return
    const item = { serie: s, rg: r, nome: String(animal.nome || '').trim() }
    setUltimoConsultado(item)
    if (typeof window !== 'undefined') {
      localStorage.setItem('consulta-rapida-ultimo', JSON.stringify(item))
    }
  }

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
            registrarConsultaAnimal(d)
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

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem('consulta-rapida-recentes')
      const parsed = raw ? JSON.parse(raw) : []
      if (Array.isArray(parsed)) setRecentes(parsed.slice(0, 5))
      const ultimoRaw = localStorage.getItem('consulta-rapida-ultimo')
      if (ultimoRaw) setUltimoConsultado(JSON.parse(ultimoRaw))
    } catch (_) {}
  }, [])

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
          setSugestaoAtivaIdx(data.data.length > 0 ? 0 : -1)
          // Se só 1 resultado e digitou número, preencher e ir direto
          if (soNumeros && data.data.length === 1) {
            const animal = data.data[0]
            setSerie(animal.serie || '')
            setRg(animal.rg || '')
            setNomeAnimal(animal.nome || '')
            setTouched({ serie: true, rg: true })
            setError('')
            abrirAnimal(animal)
          }
        } else {
          setSugestoes([])
          setShowSugestoes(false)
          setSugestaoAtivaIdx(-1)
        }
      } catch (err) {
        console.error('Erro ao buscar sugestões:', err)
        setSugestoes([])
        setShowSugestoes(false)
        setSugestaoAtivaIdx(-1)
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
            abrirAnimal(animal)
          } else if (data.data.length > 1) {
            // Se encontrou mais de 1, mostra as sugestões
            setSugestoes(data.data)
            setShowSugestoes(true)
            setSugestaoAtivaIdx(0)
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

  const abrirAnimal = (animal) => {
    if (!animal) return
    const s = String(animal.serie || '').trim().toUpperCase()
    const r = String(animal.rg || '').trim()
    registrarConsultaAnimal(animal)
    if (s && r) {
      router.push(`/consulta-animal/${s}-${r}`)
      return true
    } else if (animal.id) {
      router.push(`/consulta-animal/${animal.id}`)
      return true
    }
    return false
  }

  const handleBuscaPrincipalKeyDown = (e) => {
    if (!showSugestoes || sugestoes.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSugestaoAtivaIdx((prev) => (prev + 1) % sugestoes.length)
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSugestaoAtivaIdx((prev) => (prev <= 0 ? sugestoes.length - 1 : prev - 1))
      return
    }
    if (e.key === 'Enter') {
      const atual = sugestoes[sugestaoAtivaIdx] || sugestoes[0]
      if (atual) {
        e.preventDefault()
        abrirAnimal(atual)
      }
    }
  }

  const aplicarBuscaRecente = (item) => {
    const s = String(item?.serie || '').trim().toUpperCase()
    const r = String(item?.rg || '').trim()
    if (!s || !r) return
    setSerie(s)
    setRg(r)
    setNomeAnimal(item?.nome || '')
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
        if (!abrirAnimal(d)) throw new Error('Animal não encontrado')
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

      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6 pb-24 md:pb-6 bg-[radial-gradient(circle_at_10%_10%,rgba(245,158,11,0.14),transparent_38%),radial-gradient(circle_at_85%_5%,rgba(59,130,246,0.12),transparent_32%),linear-gradient(to_bottom_right,#f8fafc,#fff7ed,#f8fafc)] dark:bg-[radial-gradient(circle_at_10%_10%,rgba(245,158,11,0.12),transparent_35%),radial-gradient(circle_at_85%_5%,rgba(59,130,246,0.10),transparent_30%),linear-gradient(to_bottom_right,#0f172a,#111827,#0b1220)]">
        <div className="w-full max-w-xl">
          {/* Logo e Header - só quando identificado (mobile-auth é a única tela de entrada) */}
          {identificado === true && (
          <>
          <div className="mb-5 animate-fade-in">
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-[1px] shadow-2xl shadow-amber-500/30">
              <div className="rounded-3xl bg-white/95 dark:bg-gray-900/90 backdrop-blur-md p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300 font-bold">Consulta rápida</p>
                    <h1 className="text-3xl font-black mt-1 bg-gradient-to-r from-amber-600 to-orange-500 dark:from-amber-400 dark:to-orange-300 bg-clip-text text-transparent">
                      Beef-Sync
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Interface nova para buscar fichas com mais velocidade.
                    </p>
                  </div>
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/40 overflow-hidden p-2 animate-glow-pulse">
                    <Image
                      src="/Host_ico_rede.ico"
                      alt="Ícone Nelore"
                      width={64}
                      height={40}
                      className="object-contain"
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/70 dark:border-amber-800/50 p-3">
                    <p className="text-[10px] uppercase font-bold tracking-wide text-amber-700 dark:text-amber-300">Recentes</p>
                    <p className="text-lg font-black text-amber-900 dark:text-amber-200">{recentes.length}</p>
                  </div>
                  <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200/70 dark:border-indigo-800/50 p-3">
                    <p className="text-[10px] uppercase font-bold tracking-wide text-indigo-700 dark:text-indigo-300">Sugestões</p>
                    <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200 truncate">
                      {showSugestoes ? `${sugestoes.length || 0} ativas` : `${sugestoes.length || 0} disponíveis`}
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/70 dark:border-emerald-800/50 p-3">
                    <p className="text-[10px] uppercase font-bold tracking-wide text-emerald-700 dark:text-emerald-300">Modo</p>
                    <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">{modoBusca === 'inteligente' ? 'Auto' : 'Manual'}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => {
                      const newDarkMode = !isDarkMode
                      setIsDarkMode(newDarkMode)
                      localStorage.setItem('darkMode', newDarkMode.toString())
                      const html = document.documentElement
                      if (newDarkMode) html.classList.add('dark')
                      else html.classList.remove('dark')
                      window.location.reload()
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-semibold transition-colors"
                    title={isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
                  >
                    {isDarkMode ? '☀️ Claro' : '🌙 Escuro'}
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm('Deseja realmente sair?')) {
                        const { supabase } = await import('../lib/supabase')
                        if (supabase) await supabase.auth.signOut()
                        router.push('/login')
                      }
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 font-semibold transition-colors"
                    title="Sair"
                  >
                    🚪 Sair
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/85 dark:bg-gray-800/85 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 dark:border-gray-700/70 p-5 mb-4 animate-slide-up">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <MagnifyingGlassIcon className="w-6 h-6 text-amber-600 dark:text-amber-500" />
                Consulta Animal
              </h2>
              <div className="text-[11px] px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                {nomeIdent || 'Usuário'}
              </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2 p-1 rounded-xl bg-gray-100 dark:bg-gray-700/80">
              <button
                type="button"
                onClick={() => setModoBusca('inteligente')}
                className={`py-2.5 rounded-lg text-sm font-bold transition-all ${
                  modoBusca === 'inteligente'
                    ? 'bg-white dark:bg-gray-900 text-amber-700 dark:text-amber-300 shadow'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                Inteligente
              </button>
              <button
                type="button"
                onClick={() => setModoBusca('manual')}
                className={`py-2.5 rounded-lg text-sm font-bold transition-all ${
                  modoBusca === 'manual'
                    ? 'bg-white dark:bg-gray-900 text-amber-700 dark:text-amber-300 shadow'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                Manual
              </button>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setSerie('CJCJ')
                  setRg('')
                  setNomeAnimal('')
                  setError('')
                  setTouched({ serie: false, rg: false })
                  buscaPrincipalRef.current?.focus()
                }}
                className="px-3 py-2 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors"
              >
                Série padrão
              </button>
              <button
                type="button"
                onClick={() => {
                  setSerie('')
                  setRg('')
                  setNomeAnimal('')
                  setError('')
                  setTouched({ serie: false, rg: false })
                  setShowSugestoes(false)
                  buscaPrincipalRef.current?.focus()
                }}
                className="px-3 py-2 rounded-lg text-xs font-semibold bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 transition-colors"
              >
                Limpar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {modoBusca === 'inteligente' && (
                <div className="relative sugestoes-container">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome ou RG
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
                      onKeyDown={handleBuscaPrincipalKeyDown}
                      onFocus={() => {
                        if (sugestoes.length > 0) setShowSugestoes(true)
                      }}
                      placeholder="Ex.: 12345 ou nome do animal"
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

                  {showSugestoes && sugestoes.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                      {sugestoes.map((animal, index) => (
                        <button
                          key={index}
                          type="button"
                          onMouseEnter={() => setSugestaoAtivaIdx(index)}
                          onClick={() => abrirAnimal(animal)}
                          className={`w-full px-4 py-3 text-left transition-colors border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${
                            sugestaoAtivaIdx === index
                              ? 'bg-amber-50 dark:bg-gray-700/90'
                              : 'hover:bg-amber-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {formatNomeAnimal(animal)}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Série: <span className="font-medium text-amber-600 dark:text-amber-500">{animal.serie}</span> • RG: <span className="font-medium text-amber-600 dark:text-amber-500">{animal.rg}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Série</label>
                  <div className="relative">
                    <input
                      ref={serieRef}
                      type="text"
                      value={serie}
                      onChange={(e) => {
                        const v = e.target.value
                        setSerie(v.toUpperCase())
                        setError('')
                        if (/^\d+$/.test(v) && v.length >= 3) {
                          setRg(v)
                          setNomeAnimal(v)
                        }
                      }}
                      onBlur={() => setTouched(prev => ({ ...prev, serie: true }))}
                      placeholder="Ex: CJCJ"
                      className={getInputClass(isSerieValid, touched.serie)}
                      autoComplete="on"
                      autoCapitalize="characters"
                      inputMode="text"
                      disabled={loading}
                    />
                    {touched.serie && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {isSerieValid ? <CheckCircleIcon className="w-6 h-6 text-green-500" /> : <XCircleIcon className="w-6 h-6 text-red-500" />}
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">RG</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={rg}
                      onChange={(e) => {
                        setRg(e.target.value)
                        setError('')
                      }}
                      onBlur={() => setTouched(prev => ({ ...prev, rg: true }))}
                      placeholder="Ex: 12345"
                      className={getInputClass(isRgValid, touched.rg)}
                      autoComplete="off"
                      inputMode="numeric"
                      disabled={loading}
                    />
                    {touched.rg && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {isRgValid ? <CheckCircleIcon className="w-6 h-6 text-green-500" /> : <XCircleIcon className="w-6 h-6 text-red-500" />}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full py-4 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-orange-500 to-amber-500 hover:from-amber-700 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 hover:shadow-amber-600/40 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <MagnifyingGlassIcon className="w-6 h-6" />
                    Buscar Animal
                  </>
                )}
              </button>
            </form>

            {error && (
              <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm flex items-start gap-2 animate-shake">
                <XCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <Link
              href="/mobile-feedback"
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold shadow-lg shadow-green-500/30 hover:shadow-green-600/40 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5" />
              <span className="text-sm">Feedback</span>
            </Link>

            <Link
              href="/mobile-relatorios"
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-600/40 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <ChartBarIcon className="h-5 w-5" />
              <span className="text-sm">Relatórios</span>
            </Link>
          </div>

          {recentes.length > 0 && (
            <div className="bg-white/85 dark:bg-gray-800/85 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-gray-700/70 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Buscas recentes</p>
                <button
                  type="button"
                  onClick={() => {
                    setRecentes([])
                    localStorage.removeItem('consulta-rapida-recentes')
                  }}
                  className="text-xs text-red-600 dark:text-red-400 hover:underline"
                >
                  limpar
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentes.map((item, idx) => (
                  <button
                    key={`${item.serie}-${item.rg}-${idx}`}
                    type="button"
                    onClick={() => abrirAnimal(item)}
                    className="px-3 py-1.5 rounded-full text-xs bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 transition-colors"
                  >
                    {item.serie}-{item.rg}
                    {item.nome ? ` • ${item.nome.slice(0, 16)}` : ''}
                  </button>
                ))}
              </div>
            </div>
          )}

          {ultimoConsultado?.serie && ultimoConsultado?.rg && (
            <div className="md:hidden fixed bottom-3 left-3 right-3 z-40">
              <div className="rounded-2xl border border-white/50 dark:border-gray-700/60 bg-white/90 dark:bg-gray-900/85 backdrop-blur-xl shadow-2xl p-2">
                <button
                  type="button"
                  onClick={() => abrirAnimal(ultimoConsultado)}
                  className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm transition-colors"
                >
                  Último consultado: {ultimoConsultado.serie}-{ultimoConsultado.rg}
                </button>
              </div>
            </div>
          )}
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

        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.35); }
          50% { box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); }
        }

        .animate-glow-pulse {
          animation: glow-pulse 1.8s ease-in-out infinite;
        }
      `}</style>
    </>
  )
}

// Desabilitar layout padrão (sem sidebar)
ConsultaRapida.getLayout = function getLayout(page) {
  return page
}
