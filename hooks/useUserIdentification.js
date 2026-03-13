import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

export function useUserIdentification() {
  const { user, loading } = useAuth()
  const [userInfo, setUserInfo] = useState(null)
  const [logged, setLogged] = useState(false)

  useEffect(() => {
    if (loading) return

    const hostname = window.location.hostname
    const port = window.location.port

    const role = user?.user_metadata?.role || 'externo'
    const isDev = role === 'desenvolvedor'
    const userName = user?.user_metadata?.nome || user?.email?.split('@')[0] || 'Usuário'
    const userType = isDev ? 'developer' : 'external'
    const userRole = isDev ? 'Desenvolvedor' : 'Externo'

    setUserInfo({
      type: userType,
      name: userName,
      role: userRole,
      hostname,
      ip: hostname,
      port,
      isDeveloper: isDev,
      isNetworkUser: false,
      isExternal: !isDev,
      fullUrl: window.location.origin,
      accessTime: new Date().toLocaleString('pt-BR'),
      email: user?.email || '',
    })

    if (user && !logged) {
      setLogged(true)
      fetch('/api/access-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName,
          userType,
          ipAddress: hostname,
          hostname,
          userAgent: navigator.userAgent,
          action: 'Acesso ao Sistema'
        })
      }).catch(() => {})
    }
  }, [user, loading, logged])

  return userInfo
}