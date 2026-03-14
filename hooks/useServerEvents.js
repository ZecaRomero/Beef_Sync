/**
 * Hook para receber eventos em tempo real via SSE (Server-Sent Events)
 * Reconecta automaticamente em caso de falha
 */
import { useEffect, useRef } from 'react'

/**
 * @param {(event: {type: string, [key: string]: any}) => void} onEvent
 */
export function useServerEvents(onEvent) {
  const onEventRef = useRef(onEvent)
  const esRef = useRef(null)
  const reconnectTimer = useRef(null)
  const mounted = useRef(true)

  onEventRef.current = onEvent

  useEffect(() => {
    if (typeof window === 'undefined') return
    mounted.current = true

    const connect = () => {
      if (!mounted.current) return

      try {
        const es = new EventSource('/api/events')
        esRef.current = es

        es.addEventListener('change', (e) => {
          try {
            const data = JSON.parse(e.data)
            onEventRef.current?.(data)
          } catch {}
        })

        es.addEventListener('connected', () => {
          // Conexão estabelecida — limpa timer de reconexão se existir
          if (reconnectTimer.current) {
            clearTimeout(reconnectTimer.current)
            reconnectTimer.current = null
          }
        })

        es.onerror = () => {
          es.close()
          esRef.current = null
          if (mounted.current) {
            // Reconectar após 5s com backoff
            reconnectTimer.current = setTimeout(connect, 5000)
          }
        }
      } catch {
        if (mounted.current) {
          reconnectTimer.current = setTimeout(connect, 5000)
        }
      }
    }

    connect()

    return () => {
      mounted.current = false
      esRef.current?.close()
      esRef.current = null
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
    }
  }, [])
}
