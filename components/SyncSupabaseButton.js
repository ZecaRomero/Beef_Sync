import { useState } from 'react'
import { ArrowUpCircleIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'

export default function SyncSupabaseButton() {
  const { user } = useAuth()
  const [status, setStatus] = useState('idle')
  const [logs, setLogs] = useState([])
  const [open, setOpen] = useState(false)

  // Só aparece para o desenvolvedor
  const isDev = user?.user_metadata?.role === 'desenvolvedor'
  if (!isDev) return null

  const startSync = async () => {
    setStatus('syncing')
    setLogs([])
    setOpen(true)

    try {
      const res = await fetch('/api/sync-supabase', { method: 'POST' })
      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value)
        const lines = text.split('\n').filter(l => l.startsWith('data: '))
        for (const line of lines) {
          try {
            const data = JSON.parse(line.replace('data: ', ''))
            if (data.type === 'progress' || data.type === 'start') {
              setLogs(prev => [...prev, data.message])
            } else if (data.type === 'done') {
              setStatus(data.success ? 'done' : 'error')
              if (data.error) setLogs(prev => [...prev, `Erro: ${data.error}`])
            }
          } catch {}
        }
      }
    } catch (err) {
      setStatus('error')
      setLogs(prev => [...prev, `Erro de conexão: ${err.message}`])
    }
  }

  return (
    <>
      <button
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
        {status === 'syncing' ? 'Sincronizando...' : status === 'done' ? 'Sincronizado ✓' : status === 'error' ? 'Falhou — tentar de novo' : 'Enviar para Supabase'}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                <ArrowUpCircleIcon className="w-4 h-4 text-violet-400" />
                Sincronização Local → Supabase
              </h3>
              <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white/80 text-xl leading-none">×</button>
            </div>

            <div className="p-4 h-64 overflow-y-auto font-mono text-xs space-y-1 bg-black/30">
              {logs.length === 0 && <p className="text-white/30">Iniciando...</p>}
              {logs.map((log, i) => (
                <p key={i} className={
                  log.startsWith('✓') || log.startsWith('✅') ? 'text-emerald-400' :
                  log.startsWith('✗') || log.startsWith('❌') ? 'text-red-400' :
                  log.startsWith('⚠') ? 'text-yellow-400' : 'text-white/60'
                }>
                  {log}
                </p>
              ))}
            </div>

            <div className="p-4 border-t border-white/10 flex justify-between items-center">
              <span className={`text-xs font-medium ${status === 'done' ? 'text-emerald-400' : status === 'error' ? 'text-red-400' : 'text-blue-400'}`}>
                {status === 'syncing' ? '⏳ Sincronizando...' : status === 'done' ? '✅ Concluído' : status === 'error' ? '❌ Falhou' : ''}
              </span>
              <div className="flex gap-2">
                {(status === 'done' || status === 'error') && (
                  <button onClick={startSync} className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs rounded-lg font-semibold transition">
                    Tentar novamente
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 text-xs rounded-lg transition">
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
