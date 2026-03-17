import { useEffect, useState, useRef, useCallback } from 'react'
import { ArrowUpCircleIcon, CheckCircleIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'
import { isLocalOrPrivateBrowserEnv } from '../utils/networkEnv'

const TOTAL_TABLES = 17
const AUTO_SYNC_INTERVAL = 5 * 60 * 1000 // 5 minutos

export default function SyncSupabaseButton({ onSyncDone }) {
  const { user } = useAuth()
  const [status, setStatus] = useState('idle')
  const [logs, setLogs] = useState([])
  const [open, setOpen] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTable, setCurrentTable] = useState('')
  const [tablesCount, setTablesCount] = useState(0)
  const [startTime, setStartTime] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [pending, setPending] = useState(0)
  const [loadingPending, setLoadingPending] = useState(false)
  const [toast, setToast] = useState(null)
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true)
  const [lastAutoSync, setLastAutoSync] = useState(null)
  const syncingRef = useRef(false)

  const isDev = user?.user_metadata?.role === 'desenvolvedor'
  if (!isDev) return null

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const loadPending = async () => {
    if (!isLocalOrPrivateBrowserEnv()) {
      setPending(0)
      setLoadingPending(false)
      return 0
    }

    setLoadingPending(true)
    try {
      const res = await fetch('/api/sync-diff')
      const json = await res.json()
      const count = Number(json?.totalPending || 0)
      if (json?.success) setPending(count)
      return count
    } catch (_) {
      return 0
    } finally {
      setLoadingPending(false)
    }
  }

  const runAutoSync = useCallback(async () => {
    if (syncingRef.current || !isLocalOrPrivateBrowserEnv()) return
    const pendingCount = await loadPending()
    if (pendingCount <= 0) return

    syncingRef.current = true
    try {
      const res = await fetch('/api/sync-supabase', { method: 'POST' })
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let success = false
      let syncedTables = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value)
        const lines = text.split('\n').filter(l => l.startsWith('data: '))
        for (const line of lines) {
          try {
            const data = JSON.parse(line.replace('data: ', ''))
            if (data.type === 'progress') {
              const msg = data.message
              if (msg.trim().startsWith('✓') || msg.trim().startsWith('→')) syncedTables++
            } else if (data.type === 'done') {
              success = data.success
            }
          } catch {}
        }
      }

      setLastAutoSync(new Date())
      if (success) {
        showToast(`Sincronizado com Supabase (${syncedTables} tabelas)`, 'success')
        setPending(0)
        if (onSyncDone) onSyncDone()
      } else {
        showToast('Falha na sincronização automática', 'error')
      }
      await loadPending()
    } catch (err) {
      showToast('Erro na sincronização: ' + err.message, 'error')
    } finally {
      syncingRef.current = false
    }
  }, [showToast, onSyncDone])

  useEffect(() => {
    loadPending()
    const pendingId = setInterval(loadPending, 30000)
    return () => clearInterval(pendingId)
  }, [])

  useEffect(() => {
    if (!autoSyncEnabled) return
    runAutoSync()
    const id = setInterval(runAutoSync, AUTO_SYNC_INTERVAL)
    return () => clearInterval(id)
  }, [autoSyncEnabled, runAutoSync])

  const startSync = async () => {
    if (!isLocalOrPrivateBrowserEnv()) {
      setStatus('error')
      setLogs([
        'Sincronização Local → Supabase disponível apenas no ambiente local/rede interna.',
        'No Vercel, os dados já estão no banco da nuvem.',
      ])
      setOpen(true)
      return
    }

    setStatus('syncing')
    setLogs([])
    setProgress(0)
    setTablesCount(0)
    setCurrentTable('')
    setElapsed(0)
    setOpen(true)
    const t0 = Date.now()
    setStartTime(t0)

    // Timer de elapsed
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 1000)), 500)

    try {
      const res = await fetch('/api/sync-supabase', { method: 'POST' })
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let done_tables = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value)
        const lines = text.split('\n').filter(l => l.startsWith('data: '))

        for (const line of lines) {
          try {
            const data = JSON.parse(line.replace('data: ', ''))

            if (data.type === 'start') {
              setLogs(prev => [...prev, data.message])
              setProgress(2)
            } else if (data.type === 'progress') {
              const msg = data.message
              setLogs(prev => [...prev, msg])

              // Detectar início de tabela: "Sincronizando animais..."
              const syncMatch = msg.match(/^Sincronizando (.+)\.\.\.$/)
              if (syncMatch) {
                setCurrentTable(syncMatch[1])
              }

              // Detectar conclusão de tabela: "  ✓ animais: 312 registros" ou "  → animais: vazia"
              if (msg.trim().startsWith('✓') || msg.trim().startsWith('→') || msg.trim().startsWith('✗') || msg.trim().startsWith('⚠')) {
                done_tables++
                setTablesCount(done_tables)
                setProgress(Math.min(5 + Math.round((done_tables / TOTAL_TABLES) * 90), 95))
              }
            } else if (data.type === 'done') {
              setProgress(100)
              setCurrentTable('')
              if (data.alreadyOnSupabase) {
                setStatus('done')
              } else {
                setStatus(data.success ? 'done' : 'error')
                if (data.error) setLogs(prev => [...prev, `Erro: ${data.error}`])
              }
              if (data.success && onSyncDone) onSyncDone()
              if (data.success) {
                setTimeout(() => {
                  loadPending()
                }, 500)
              }
            }
          } catch {}
        }
      }
    } catch (err) {
      setStatus('error')
      setLogs(prev => [...prev, `Erro de conexão: ${err.message}`])
    } finally {
      clearInterval(timer)
      setElapsed(Math.floor((Date.now() - t0) / 1000))
    }
  }

  const fmtTime = (s) => s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`

  // Estimar tempo restante baseado no progresso atual
  const eta = () => {
    if (!startTime || progress <= 2 || progress >= 100) return null
    const elapsed_ms = Date.now() - startTime
    const rate = progress / elapsed_ms // % por ms
    const remaining = (100 - progress) / rate
    return Math.ceil(remaining / 1000)
  }

  const etaVal = status === 'syncing' ? eta() : null

  return (
    <>
      <div className="flex flex-col items-start gap-1">
        <div className="flex items-center gap-2">
          <button
            data-sync-supabase-button="true"
            onClick={() => status === 'syncing' ? setOpen(true) : startSync()}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all border
              ${status === 'syncing'
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 cursor-wait'
                : status === 'done'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : status === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                : 'bg-violet-500/10 border-violet-500/30 text-violet-400 hover:bg-violet-500/20'
              }`}
          >
            {status === 'syncing' ? (
              <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            ) : status === 'done' ? (
              <CheckCircleIcon className="w-4 h-4" />
            ) : status === 'error' ? (
              <XCircleIcon className="w-4 h-4" />
            ) : (
              <ArrowUpCircleIcon className="w-4 h-4" />
            )}
            {status === 'syncing'
              ? `Sincronizando... ${progress}%`
              : status === 'done'
              ? 'Sincronizado ✓'
              : status === 'error'
              ? 'Falhou — tentar de novo'
              : 'Enviar para Supabase'}
          </button>
          <button
            onClick={() => setAutoSyncEnabled(prev => !prev)}
            title={autoSyncEnabled ? 'Auto-sync ativo (5 min) — clique para desativar' : 'Auto-sync desativado — clique para ativar'}
            className={`p-1.5 rounded-lg border transition-all ${
              autoSyncEnabled
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-white/5 border-white/10 text-white/30 hover:bg-white/10'
            }`}
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
        </div>
        <span className="text-xs text-white/60">
          {loadingPending ? 'Verificando...' : pending > 0 ? (
            <>
              {pending} pendência{pending > 1 ? 's' : ''}
              {autoSyncEnabled && <span className="text-emerald-400/60"> · auto-sync 5min</span>}
              {lastAutoSync && <span className="text-white/30"> · último: {lastAutoSync.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>}
            </>
          ) : (
            <>
              Tudo sincronizado
              {autoSyncEnabled && <span className="text-emerald-400/60"> · auto-sync ativo</span>}
            </>
          )}
        </span>
      </div>

      {/* Toast de notificação */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[9999] px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-sm flex items-center gap-2 text-sm font-medium animate-slide-up ${
          toast.type === 'success'
            ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
            : 'bg-red-500/20 border-red-500/30 text-red-300'
        }`}>
          {toast.type === 'success' ? <CheckCircleIcon className="w-5 h-5" /> : <XCircleIcon className="w-5 h-5" />}
          {toast.message}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0f1629] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ArrowUpCircleIcon className="w-4 h-4 text-violet-400" />
                <h3 className="text-white font-semibold text-sm">Sincronização Local → Supabase</h3>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white/70 text-xl leading-none transition">×</button>
            </div>

            {/* Progress bar */}
            <div className="px-5 pt-4 pb-2 space-y-2">
              <div className="flex items-center justify-between text-xs text-white/50 mb-1">
                <span>
                  {status === 'syncing' && currentTable
                    ? `Sincronizando ${currentTable}...`
                    : status === 'done'
                    ? '✅ Concluído'
                    : status === 'error'
                    ? '❌ Falhou'
                    : 'Aguardando...'}
                </span>
                <span className="flex items-center gap-2">
                  {status === 'syncing' && (
                    <>
                      <span className="text-white/40">{tablesCount}/{TOTAL_TABLES} tabelas</span>
                      <span className="text-white/30">·</span>
                      <span>{fmtTime(elapsed)}</span>
                      {etaVal && etaVal > 1 && (
                        <>
                          <span className="text-white/30">·</span>
                          <span className="text-white/40">~{fmtTime(etaVal)} restante</span>
                        </>
                      )}
                    </>
                  )}
                  {status === 'done' && <span className="text-emerald-400">{fmtTime(elapsed)}</span>}
                  <span className="font-mono font-bold text-white/80">{progress}%</span>
                </span>
              </div>

              {/* Barra */}
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    status === 'done'
                      ? 'bg-emerald-500'
                      : status === 'error'
                      ? 'bg-red-500'
                      : 'bg-gradient-to-r from-violet-500 to-blue-500'
                  } ${status === 'syncing' && progress < 100 ? 'relative' : ''}`}
                  style={{ width: `${progress}%` }}
                >
                  {/* Shimmer animado enquanto sincroniza */}
                  {status === 'syncing' && progress < 100 && (
                    <span
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 1.2s linear infinite',
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Log */}
            <div className="mx-5 mb-4 h-48 overflow-y-auto font-mono text-xs space-y-0.5 bg-black/30 rounded-xl p-3 border border-white/5">
              {logs.length === 0 && <p className="text-white/20">Iniciando...</p>}
              {logs.map((log, i) => (
                <p key={i} className={
                  log.startsWith('✓') || log.startsWith('✅') ? 'text-emerald-400' :
                  log.startsWith('✗') || log.startsWith('❌') ? 'text-red-400' :
                  log.startsWith('⚠') ? 'text-yellow-400' :
                  log.startsWith('Sincronizando') ? 'text-blue-300' :
                  'text-white/50'
                }>
                  {log}
                </p>
              ))}
            </div>

            {/* Footer */}
            <div className="px-5 pb-4 flex justify-end gap-2">
              {(status === 'done' || status === 'error') && (
                <button onClick={startSync} className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs rounded-lg font-semibold transition">
                  Tentar novamente
                </button>
              )}
              <button onClick={() => setOpen(false)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/60 text-xs rounded-lg transition">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0 }
          100% { background-position: 200% 0 }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
    </>
  )
}
