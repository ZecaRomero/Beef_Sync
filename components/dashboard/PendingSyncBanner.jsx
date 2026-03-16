export default function PendingSyncBanner({ totalPending }) {
  if (!totalPending || totalPending <= 0) return null

  return (
    <div className="mb-4 rounded-xl border border-amber-300/50 bg-amber-50 dark:bg-amber-900/20 p-3 md:p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-sm">
      <div>
        <p className="text-sm md:text-base font-bold text-amber-800 dark:text-amber-200">
          Voce tem {totalPending} alteracao{totalPending !== 1 ? 'oes' : ''} pendente{totalPending !== 1 ? 's' : ''} para enviar ao Supabase
        </p>
        <p className="text-xs md:text-sm text-amber-700/90 dark:text-amber-300/90">
          Continue trabalhando localmente e envie quando finalizar.
        </p>
      </div>
      <button
        onClick={() => {
          const syncButton = document.querySelector('[data-sync-supabase-button="true"]')
          if (syncButton) syncButton.click()
        }}
        className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm transition-colors self-start md:self-auto"
      >
        Enviar agora
      </button>
    </div>
  )
}

