import { AnimatePresence, motion } from 'framer-motion'
import { ChartBarIcon, XMarkIcon } from '@heroicons/react/24/outline'

export default function CardInfoModal({ cardInfoModal, onClose, onViewReport }) {
  return (
    <AnimatePresence>
      {cardInfoModal.open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute left-4 right-4 top-1/2 -translate-y-1/2 p-5 rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{cardInfoModal.title}</h3>
              <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mb-3">{cardInfoModal.value}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{cardInfoModal.description}</p>

            {cardInfoModal.reportKey && (
              <button
                onClick={onViewReport}
                className="w-full py-2.5 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
              >
                <ChartBarIcon className="h-5 w-5" />
                Ver relatório completo
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

