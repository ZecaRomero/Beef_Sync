/**
 * Consulta Rápida de Animal - Otimizada para celular
 * Acesse pelo celular: /a - sem sidebar, somente Série e RG em inputs separados
 */
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { useAuth } from '../contexts/AuthContext'
import QuickLinksCards from '../components/consulta-rapida/QuickLinksCards'
import RecentSearches from '../components/consulta-rapida/RecentSearches'
import LastConsultedDock from '../components/consulta-rapida/LastConsultedDock'
import AnimalSearchPanel from '../components/consulta-rapida/AnimalSearchPanel'
import ConsultaRapidaHeader from '../components/consulta-rapida/ConsultaRapidaHeader'
import ConsultaRapidaSplash from '../components/consulta-rapida/ConsultaRapidaSplash'

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

  const preencherAnimalNoFormulario = (animal) => {
    if (!animal) return
    setSerie(animal.serie || '')
    setRg(animal.rg || '')
    setNomeAnimal(animal.nome || '')
    setTouched({ serie: true, rg: true })
    setError('')
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

  // Deslogar após 1 dia de inatividade (apenas para mobile-auth legacy)
  useEffect(() => {
    if (typeof window === 'undefined' || identificado !== true || user) return

    const ONE_DAY_MS = 24 * 60 * 60 * 1000

    const resetTimer = () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
      inactivityTimerRef.current = setTimeout(() => {
        localStorage.removeItem('mobile-auth')
        setIdentificado(false)
        router.push('/login')
      }, ONE_DAY_MS)
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
            preencherAnimalNoFormulario(animal)
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
            preencherAnimalNoFormulario(animal)
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

  const handleToggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    localStorage.setItem('darkMode', newDarkMode.toString())
    const html = document.documentElement
    if (newDarkMode) html.classList.add('dark')
    else html.classList.remove('dark')
    window.location.reload()
  }

  const handleLogout = async () => {
    if (!confirm('Deseja realmente sair?')) return
    const { supabase } = await import('../lib/supabase')
    if (supabase) await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      <Head>
        <title>Consulta Animal | Beef-Sync</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Head>

      {/* Splash Screen */}
      {showSplash && <ConsultaRapidaSplash splashProgress={splashProgress} />}

      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6 pb-24 md:pb-6 bg-[radial-gradient(circle_at_10%_10%,rgba(245,158,11,0.14),transparent_38%),radial-gradient(circle_at_85%_5%,rgba(59,130,246,0.12),transparent_32%),linear-gradient(to_bottom_right,#f8fafc,#fff7ed,#f8fafc)] dark:bg-[radial-gradient(circle_at_10%_10%,rgba(245,158,11,0.12),transparent_35%),radial-gradient(circle_at_85%_5%,rgba(59,130,246,0.10),transparent_30%),linear-gradient(to_bottom_right,#0f172a,#111827,#0b1220)]">
        <div className="w-full max-w-xl">
          {/* Logo e Header - só quando identificado (mobile-auth é a única tela de entrada) */}
          {identificado === true && (
          <>
          <ConsultaRapidaHeader
            recentesCount={recentes.length}
            sugestoesCount={sugestoes.length}
            showSugestoes={showSugestoes}
            modoBusca={modoBusca}
            isDarkMode={isDarkMode}
            onToggleDarkMode={handleToggleDarkMode}
            onLogout={handleLogout}
          />

          <AnimalSearchPanel
            nomeIdent={nomeIdent}
            modoBusca={modoBusca}
            onModoBuscaChange={setModoBusca}
            onPreencherSeriePadrao={() => {
              setSerie('CJCJ')
              setRg('')
              setNomeAnimal('')
              setError('')
              setTouched({ serie: false, rg: false })
              buscaPrincipalRef.current?.focus()
            }}
            onLimparFormulario={() => {
              setSerie('')
              setRg('')
              setNomeAnimal('')
              setError('')
              setTouched({ serie: false, rg: false })
              setShowSugestoes(false)
              buscaPrincipalRef.current?.focus()
            }}
            handleSubmit={handleSubmit}
            buscaPrincipalRef={buscaPrincipalRef}
            nomeAnimal={nomeAnimal}
            onNomeAnimalChange={(e) => {
              setNomeAnimal(e.target.value)
              setError('')
            }}
            onBuscaPrincipalKeyDown={handleBuscaPrincipalKeyDown}
            onBuscaPrincipalFocus={() => {
              if (sugestoes.length > 0) setShowSugestoes(true)
            }}
            sugestoes={sugestoes}
            showSugestoes={showSugestoes}
            loadingSugestoes={loadingSugestoes}
            sugestaoAtivaIdx={sugestaoAtivaIdx}
            onSugestaoMouseEnter={setSugestaoAtivaIdx}
            onAbrirAnimal={abrirAnimal}
            serieRef={serieRef}
            serie={serie}
            rg={rg}
            onSerieChange={(e) => {
              const v = e.target.value
              setSerie(v.toUpperCase())
              setError('')
              if (/^\d+$/.test(v) && v.length >= 3) {
                setRg(v)
                setNomeAnimal(v)
              }
            }}
            onSerieBlur={() => setTouched((prev) => ({ ...prev, serie: true }))}
            onRgChange={(e) => {
              setRg(e.target.value)
              setError('')
            }}
            onRgBlur={() => setTouched((prev) => ({ ...prev, rg: true }))}
            touched={touched}
            isSerieValid={isSerieValid}
            isRgValid={isRgValid}
            canSubmit={canSubmit}
            loading={loading}
            error={error}
            getInputClass={getInputClass}
          />

          <QuickLinksCards />

          <RecentSearches
            recentes={recentes}
            onOpenAnimal={abrirAnimal}
            onClear={() => {
              setRecentes([])
              localStorage.removeItem('consulta-rapida-recentes')
            }}
          />

          <LastConsultedDock
            ultimoConsultado={ultimoConsultado}
            onOpenAnimal={abrirAnimal}
          />
          </>
          )}
        </div>
      </div>

      <style jsx global>{`
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
