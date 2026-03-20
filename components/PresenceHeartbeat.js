import { useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'

const INTERVAL_MS = 45_000

function isMobileUA() {
  if (typeof navigator === 'undefined') return false
  return /mobile|android|iphone|ipad|ipod|webos|blackberry|iemobile|tablet|kindle/i.test(navigator.userAgent)
}

function getIdentifiedGuest() {
  try {
    const m = localStorage.getItem('maintenance_auth')
    if (m) {
      const j = JSON.parse(m)
      if (j.nome && String(j.nome).trim()) {
        return {
          userName: String(j.nome).trim(),
          userType: 'Mobile (manutenção/ident.)',
          telefone: j.telefone ? String(j.telefone).trim() : null,
          email: null,
        }
      }
    }
  } catch (_) {}
  try {
    const u = localStorage.getItem('beef_usuario_identificado')
    if (u) {
      const j = JSON.parse(u)
      if (j.nome && String(j.nome).trim()) {
        return {
          userName: String(j.nome).trim(),
          userType: 'Mobile (identificado)',
          telefone: j.telefone ? String(j.telefone).trim() : null,
          email: null,
        }
      }
    }
  } catch (_) {}
  try {
    const mob = localStorage.getItem('mobile-auth')
    if (mob) {
      const j = JSON.parse(mob)
      if (j.nome && String(j.nome).trim()) {
        return {
          userName: String(j.nome).trim(),
          userType: 'Mobile (auth)',
          telefone: j.telefone ? String(j.telefone).trim() : null,
          email: j.email || null,
        }
      }
    }
  } catch (_) {}
  return null
}

/**
 * Envia ping periódico para /api/presence quando há usuário Supabase ou cadastro mobile/local.
 */
export default function PresenceHeartbeat() {
  const router = useRouter()
  const { user } = useAuth()
  const intervalRef = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const resolvePayload = () => {
      if (user?.email) {
        const meta = user.user_metadata || {}
        return {
          userName: (meta.nome || meta.full_name || user.email.split('@')[0] || '').trim(),
          userType: 'Web (Supabase)',
          telefone: meta.telefone || meta.phone || null,
          email: user.email,
        }
      }
      return getIdentifiedGuest()
    }

    const send = () => {
      const payload = resolvePayload()
      if (!payload?.userName) return
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return

      let sid = sessionStorage.getItem('beef_presence_sid')
      if (!sid) {
        sid =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `p-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
        sessionStorage.setItem('beef_presence_sid', sid)
      }

      const body = JSON.stringify({
        sessionId: sid,
        userName: payload.userName,
        userType: payload.userType,
        telefone: payload.telefone,
        email: payload.email || null,
        path: (router.asPath || '/').slice(0, 500),
        isMobile: isMobileUA(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      })

      fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {})
    }

    send()
    intervalRef.current = setInterval(send, INTERVAL_MS)
    const onVis = () => {
      if (document.visibilityState === 'visible') send()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(intervalRef.current)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [router.asPath, user?.id, user?.email])

  return null
}
