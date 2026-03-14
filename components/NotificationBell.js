import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { BellIcon } from '@heroicons/react/24/outline'
import { BellAlertIcon } from '@heroicons/react/24/solid'

export default function NotificationBell() {
  const router = useRouter()
  const [notificacoes, setNotificacoes] = useState([])
  const [mostrarDropdown, setMostrarDropdown] = useState(false)
  const [loading, setLoading] = useState(false)

  const carregarNotificacoes = async () => {
    try {
      const response = await fetch('/api/notifications/feedbacks')
      const data = await response.json()
      if (data.success) {
        setNotificacoes(data.notificacoes || [])
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
    }
  }

  useEffect(() => {
    carregarNotificacoes()
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(carregarNotificacoes, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const totalNaoLidas = notificacoes.length

  return (
    <div className="relative">
      <button
        onClick={() => setMostrarDropdown(!mostrarDropdown)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Notificações"
      >
        {totalNaoLidas > 0 ? (
          <BellAlertIcon className="h-6 w-6 text-amber-500 animate-pulse" />
        ) : (
          <BellIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
        )}
        
        {totalNaoLidas > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {totalNaoLidas > 9 ? '9+' : totalNaoLidas}
          </span>
        )}
      </button>

      {mostrarDropdown && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setMostrarDropdown(false)}
          />
          
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20 max-h-96 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white">
                Notificações
              </h3>
              {totalNaoLidas > 0 && (
                <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                  {totalNaoLidas} nova(s)
                </span>
              )}
            </div>

            <div className="overflow-y-auto flex-1">
              {notificacoes.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <BellIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma notificação</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notificacoes.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => {
                        router.push(notif.link)
                        setMostrarDropdown(false)
                      }}
                      className="w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {notif.tipo === 'feedback' && (
                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <span className="text-xl">💬</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">
                            {notif.titulo}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {notif.mensagem}
                          </p>
                          {notif.temAudio && (
                            <span className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 dark:text-blue-400">
                              🎤 Com áudio
                            </span>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {new Date(notif.data).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {notificacoes.length > 0 && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    router.push('/admin/feedbacks')
                    setMostrarDropdown(false)
                  }}
                  className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Ver todos os feedbacks
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
