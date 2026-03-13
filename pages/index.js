import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '../contexts/AuthContext'

export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [showFallback, setShowFallback] = useState(false)

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

  const role = user?.user_metadata?.role || 'externo'
  const targetPath = user?.email === 'adelso@fazendasantanna.com.br'
    ? '/adelso-menu'
    : role === 'desenvolvedor'
      ? '/dashboard'
      : '/a'

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Redirecionando...</p>
        {showFallback && (
          <p className="mt-4 text-sm">
            <Link href={targetPath} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
              Clique aqui se não redirecionar automaticamente
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
