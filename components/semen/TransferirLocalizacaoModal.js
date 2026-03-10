import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

export default function TransferirLocalizacaoModal({ isOpen, onClose, registro, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    rack: registro?.rack_touro || '',
    botijao: registro?.botijao || '',
    caneca: registro?.caneca || ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/semen/transferir-localizacao', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: registro.id,
          rack: formData.rack,
          botijao: formData.botijao,
          caneca: formData.caneca
        })
      })

      const data = await response.json()

      if (data.success) {
        onSuccess?.()
        onClose()
      } else {
        alert(data.message || 'Erro ao transferir localização')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao transferir localização')
    } finally {
      setLoading(false)
    }
  }

  if (!registro) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={e => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ArrowPathIcon className="h-5 w-5" />
                  Transferir Localização
                </h3>
                <p className="text-sm text-blue-100 mt-1">
                  {registro.nome_touro || 'Registro'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>

            {/* Conteúdo */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Localização Atual */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Localização Atual:
                </p>
                <div className="flex items-center gap-2 text-sm font-mono">
                  <span className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                    Rack: {registro.rack_touro || '-'}
                  </span>
                  <span className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                    Botijão: {registro.botijao || '-'}
                  </span>
                  <span className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                    Caneca: {registro.caneca || '-'}
                  </span>
                </div>
              </div>

              {/* Nova Localização */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Nova Localização
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Rack
                    </label>
                    <input
                      type="text"
                      value={formData.rack}
                      onChange={(e) => setFormData({ ...formData, rack: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Ex: A1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Botijão
                    </label>
                    <input
                      type="text"
                      value={formData.botijao}
                      onChange={(e) => setFormData({ ...formData, botijao: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Ex: 7"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Caneca
                    </label>
                    <input
                      type="text"
                      value={formData.caneca}
                      onChange={(e) => setFormData({ ...formData, caneca: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Ex: 2"
                    />
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                      Transferindo...
                    </>
                  ) : (
                    'Transferir'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
