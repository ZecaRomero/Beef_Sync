import { ArrowDownTrayIcon, ArrowLeftIcon, ChatBubbleLeftRightIcon, ShareIcon } from '@heroicons/react/24/outline'
import { AnimatePresence, motion } from 'framer-motion'

export default function ReportActionBar({
  onBack,
  onExportCSV,
  sharing,
  shareMenuOpen,
  onToggleShareMenu,
  onShareWhatsApp,
  onShareEmail,
  onShareSummary,
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-20">
      <div className="max-w-lg mx-auto grid grid-cols-3 gap-2">
        <button
          onClick={onBack}
          className="flex items-center justify-center gap-1 py-3 rounded-xl bg-amber-600 dark:bg-amber-500 text-white font-semibold text-sm"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Voltar
        </button>
        <button
          onClick={onExportCSV}
          className="flex items-center justify-center gap-1 py-3 rounded-xl bg-gray-600 dark:bg-gray-500 text-white font-semibold text-sm"
        >
          <ArrowDownTrayIcon className="h-5 w-5" />
          Exportar
        </button>
        <div className="relative">
          <button
            onClick={onToggleShareMenu}
            disabled={sharing}
            className="flex items-center justify-center gap-1 py-3 px-4 rounded-xl bg-blue-600 dark:bg-blue-500 text-white font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed w-full"
          >
            {sharing ? (
              <>
                <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                Compartilhando
              </>
            ) : (
              <>
                <ShareIcon className="h-5 w-5" />
                Compartilhar
              </>
            )}
          </button>

          <AnimatePresence>
            {shareMenuOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => onToggleShareMenu()}
                  className="fixed inset-0 z-40"
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full mb-2 right-0 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
                >
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => {
                        onShareWhatsApp()
                        onToggleShareMenu()
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-left group"
                    >
                      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ChatBubbleLeftRightIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">WhatsApp</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Enviar por mensagem</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        onShareEmail()
                        onToggleShareMenu()
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left group"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">Email</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Enviar por email</p>
                      </div>
                    </button>

                    <button
                      onClick={async () => {
                        await onShareSummary()
                        onToggleShareMenu()
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors text-left group"
                    >
                      <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ShareIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">Outros</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Mais opções</p>
                      </div>
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
