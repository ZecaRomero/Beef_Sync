/**
 * Live Reload para desenvolvimento mobile
 * Só ativa em desenvolvimento e quando acessado via rede/ngrok (não localhost)
 * Faz polling para detectar mudanças e recarrega a página automaticamente
 */
import { useEffect, useRef } from 'react'

const POLL_INTERVAL = 10000 // 10 segundos

export default function DevLiveReload() {
  const lastTimestamp = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (process.env.NODE_ENV !== 'development') return

    const hostname = window.location.hostname
    // Só ativar para desenvolvedor: localhost, rede local ou ngrok
    const isDev = hostname === 'localhost' || hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.') ||
      hostname.includes('ngrok')

    if (!isDev) return

    const poll = async () => {
      try {
        const res = await fetch('/api/dev-reload')
        if (!res.ok) return
        const data = await res.json()
        const ts = data.timestamp

        if (lastTimestamp.current === null) {
          lastTimestamp.current = ts
          return
        }
        if (ts > lastTimestamp.current) {
          lastTimestamp.current = ts
          window.location.reload()
        }
      } catch (_) {}
    }

    const interval = setInterval(poll, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [])

  return null
}
