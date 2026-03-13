import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'

const PUBLIC_ROUTES = ['/login', '/mobile-auth', '/a', '/A', '/identificar', '/adelso', '/consulta-animal', '/mobile-relatorios', '/boletim-defesa/mobile', '/reset-password', '/404', '/500']

export default function AuthGuard({ children }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  const isPublic = PUBLIC_ROUTES.some(route =>
    router.pathname === route || router.pathname.startsWith(route + '/')
  )

  useEffect(() => {
    if (!loading && !user && !isPublic) {
      router.replace(`/login?redirect=${encodeURIComponent(router.asPath)}`)
    }
  }, [user, loading, isPublic, router])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a, #1e3a5f, #0f172a)',
      }}>
        <div style={{
          textAlign: 'center',
          color: '#94a3b8',
        }}>
          <div style={{
            width: 40, height: 40,
            border: '3px solid rgba(96,165,250,0.2)',
            borderTopColor: '#60a5fa',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ fontSize: 14 }}>Carregando...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    )
  }

  if (!user && !isPublic) return null

  return children
}
