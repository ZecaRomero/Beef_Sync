import SyncSupabaseButton from '../SyncSupabaseButton'

export default function DeveloperSyncPanel({
  isLocalEnv,
  diffLoading,
  syncDiff,
  onSyncDone,
}) {
  return (
    <div className="rounded-xl bg-violet-950/60 border border-violet-500/30 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="text-base">🛠</span>
        <span className="font-semibold text-violet-200 text-sm">Modo Desenvolvedor</span>
        <span className="text-violet-500">·</span>
        <span className="text-violet-400 text-xs">{isLocalEnv ? 'Banco local ativo' : 'Vercel (somente leitura)'}</span>

        {isLocalEnv && diffLoading && (
          <span className="ml-1 text-xs text-violet-400/60 flex items-center gap-1">
            <span className="w-3 h-3 border border-violet-400 border-t-transparent rounded-full animate-spin inline-block" />
            verificando...
          </span>
        )}

        {isLocalEnv && !diffLoading && syncDiff && (
          syncDiff.supabaseOnline ? (
            syncDiff.totalPending > 0 ? (
              <span className="ml-1 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                {syncDiff.totalPending} registro{syncDiff.totalPending !== 1 ? 's' : ''} pendente{syncDiff.totalPending !== 1 ? 's' : ''}
              </span>
            ) : (
              <span className="ml-1 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Supabase sincronizado
              </span>
            )
          ) : (
            <span className="ml-1 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-300 text-xs">
              Supabase offline
            </span>
          )
        )}

        {!isLocalEnv && (
          <span className="ml-1 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs">
            Sync local desabilitado no Vercel
          </span>
        )}

        <div className="ml-auto">
          <SyncSupabaseButton onSyncDone={onSyncDone} />
        </div>
      </div>

      {isLocalEnv && !diffLoading && syncDiff?.supabaseOnline && syncDiff.diff.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {syncDiff.diff.map(({ key, label, local, remote, delta }) => (
            <span key={key} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white/70">
              <span className="font-medium text-white/90">{label}</span>
              <span className="text-white/40">local {local}</span>
              {remote !== null && (
                <>
                  <span className="text-white/30">·</span>
                  <span className={delta > 0 ? 'text-amber-400' : 'text-red-400'}>
                    {delta > 0 ? `+${delta}` : delta} vs Supabase
                  </span>
                </>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

