import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import InteractiveDashboard from '../components/InteractiveDashboard'
import AlertasDGWidget from '../components/AlertasDGWidget'
import { useAuth } from '../contexts/AuthContext'
import NotasFiscaisRecentesWidget from '../components/dashboard/NotasFiscaisRecentesWidget'
import ReceptorasNF2141Widget from '../components/dashboard/ReceptorasNF2141Widget'
import LastAnimalWidget from '../components/dashboard/LastAnimalWidget'
import DeveloperSyncPanel from '../components/dashboard/DeveloperSyncPanel'
import PendingSyncBanner from '../components/dashboard/PendingSyncBanner'
import DashboardHero from '../components/dashboard/DashboardHero'
import InsightsCards from '../components/dashboard/InsightsCards'
import LaunchHistoryCard from '../components/dashboard/LaunchHistoryCard'
import DashboardSimpleView from '../components/dashboard/DashboardSimpleView'
import DashboardErrorAlert from '../components/dashboard/DashboardErrorAlert'
import { useDashboardStats } from '../hooks/useDashboardStats'
import { useDashboardSyncDiff } from '../hooks/useDashboardSyncDiff'

export default function Dashboard() {
  const router = useRouter()
  const { user } = useAuth()
  const isDev = user?.user_metadata?.role === 'desenvolvedor'
  const { isLocalEnv, syncDiff, diffLoading, setSyncDiff, setDiffLoading } = useDashboardSyncDiff(isDev)
  const { stats, loading, error } = useDashboardStats()
  const [showInteractive, setShowInteractive] = useState(false)
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

      {/* Painel do Desenvolvedor — visível só para Zeca */}
      {isDev && (
        <DeveloperSyncPanel
          isLocalEnv={isLocalEnv}
          diffLoading={diffLoading}
          syncDiff={syncDiff}
          onSyncDone={() => {
            setDiffLoading(true)
            fetch('/api/sync-diff').then((r) => r.json()).then(setSyncDiff).finally(() => setDiffLoading(false))
          }}
        />
      )}

      <DashboardErrorAlert error={error} />

      {/* Cabeçalho Mobile-Friendly */}
      {isDev && isLocalEnv && syncDiff?.supabaseOnline && (
        <PendingSyncBanner totalPending={syncDiff?.totalPending || 0} />
      )}

      <DashboardHero
        darkMode={darkMode}
        showInteractive={showInteractive}
        onGoMobile={() => router.push('/a')}
        onToggleDarkMode={toggleDarkMode}
        onToggleInteractive={() => setShowInteractive(!showInteractive)}
      />

      <InsightsCards />

      {/* Widget de Alertas de DG */}
      <AlertasDGWidget />

      {/* Notas Fiscais Recentes */}
      <NotasFiscaisRecentesWidget />

      {/* Receptoras NF 2141 - Acesso Rápido */}
      <ReceptorasNF2141Widget />

      {/* Widget do Último Animal Cadastrado */}
      <LastAnimalWidget />

      <LaunchHistoryCard />

      {/* Renderizar Dashboard Interativo ou Simples */}
      {showInteractive ? (
        <InteractiveDashboard />
      ) : (
        <DashboardSimpleView stats={stats} />
      )}
    </div>
  )
}
