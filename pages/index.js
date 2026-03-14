import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '../contexts/AuthContext'

export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [showFallback, setShowFallback] = useState(false)
  const [stats, setStats] = useState({ total: 0, ativos: 0 })

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.replace('/login')
      return
    }

    // Adelso (email fazenda): acesso ao Boletim Campo e Relatórios
    if (user.email === 'adelso@fazendasantanna.com.br') {
      router.prefetch('/adelso-menu')
      router.replace('/adelso-menu')
      return
    }

    const role = user.user_metadata?.role || 'externo'
    const target = role === 'desenvolvedor' ? '/dashboard' : '/a'

    // Prefetch da página de destino para carregamento mais rápido
    router.prefetch(target)
    router.replace(target)

    // Fallback: se após 2s ainda estiver aqui, mostrar link manual
    const t = setTimeout(() => setShowFallback(true), 2000)
    return () => clearTimeout(t)
  }, [user, loading, router])

  // Carregar estatísticas rápidas
  useEffect(() => {
    if (!user) return
    fetch('/api/statistics')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.success) {
          setStats({
            total: data.data.totalAnimais || data.data.total_animais || 0,
            ativos: data.data.animaisAtivos || 0
          })
        }
      })
      .catch(() => {})
  }, [user])

  const role = user?.user_metadata?.role || 'externo'
  const targetPath = user?.email === 'adelso@fazendasantanna.com.br'
    ? '/adelso-menu'
    : role === 'desenvolvedor'
      ? '/dashboard'
      : '/a'

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="text-center max-w-2xl">
          {/* Logo e Branding */}
          <div className="mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-32 h-32 mb-6 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-2xl shadow-amber-500/30 overflow-hidden p-3">
              <Image 
                src="/Host_ico_rede.ico" 
                alt="Beef-Sync"
                width={120}
                height={120}
                className="object-contain"
                priority
              />
            </div>
            
            <h1 className="text-5xl font-bold bg-gradient-to-r from-amber-600 to-orange-500 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent mb-3">
              Beef-Sync
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
              Sistema de Gestão Pecuária Inteligente
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Controle completo do seu rebanho em tempo real
            </p>
          </div>

          {/* Estatísticas Rápidas */}
          {stats.total > 0 && (
            <div className="grid grid-cols-2 gap-4 mb-8 animate-slide-up">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-1">
                  {stats.total}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total de Animais
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {stats.ativos}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Animais Ativos
                </div>
              </div>
            </div>
          )}

          {/* Loading e Redirecionamento */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700 mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-200 dark:border-amber-900 border-t-amber-600 dark:border-t-amber-400 mx-auto mb-4"></div>
            <p className="text-lg text-gray-700 dark:text-gray-300 font-medium mb-2">
              Carregando seu painel...
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Aguarde enquanto preparamos tudo para você
            </p>
            
            {showFallback && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Está demorando mais que o esperado?
                </p>
                <Link 
                  href={targetPath} 
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 text-white rounded-xl font-semibold shadow-lg shadow-amber-500/30 transition-all transform hover:scale-105"
                >
                  <span>Acessar Manualmente</span>
                  <span>→</span>
                </Link>
              </div>
            )}
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-2xl mb-2">📊</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Dashboard Completo</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Visualize métricas e indicadores em tempo real
              </p>
            </div>
            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-2xl mb-2">🐂</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Gestão de Rebanho</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Controle completo de animais e genealogia
              </p>
            </div>
            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-2xl mb-2">📱</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Acesso Mobile</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Consulte informações de qualquer lugar
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500 mt-8">
            © {new Date().getFullYear()} Beef-Sync. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}
