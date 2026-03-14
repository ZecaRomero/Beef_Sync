
import React, { useEffect, useState } from 'react'

import { useRouter } from 'next/router'

export default function KeyboardShortcuts() {
  const router = useRouter()
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [lastPressed, setLastPressed] = useState('')

  const shortcuts = [
    { key: 'Alt + A', description: 'Ir para Animais', action: () => router.push('/animals') },
    { key: 'Alt + N', description: 'Ir para Nascimentos', action: () => router.push('/nascimentos') },
    { key: 'Alt + C', description: 'Ir para Custos', action: () => router.push('/custos') },
    { key: 'Alt + G', description: 'Ir para Gestações', action: () => router.push('/gestacao') },
    { key: 'Alt + R', description: 'Ir para Relatórios', action: () => router.push('/reports') },
    { key: 'Alt + S', description: 'Ir para Configurações', action: () => router.push('/settings') },
    { key: 'Alt + H', description: 'Mostrar/Ocultar Atalhos', action: () => setShowShortcuts(!showShortcuts) },
    { key: 'Alt + D', description: 'Voltar ao Dashboard', action: () => router.push('/') }
  ]

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.altKey) {
        const key = event.key.toLowerCase()
        setLastPressed(`Alt + ${key.toUpperCase()}`)
        
        switch (key) {
          case 'a':
            event.preventDefault()
            router.push('/animals')
            break
          case 'n':
            event.preventDefault()
            router.push('/nascimentos')
            break
          case 'c':
            event.preventDefault()
            router.push('/custos')
            break
          case 'g':
            event.preventDefault()
            router.push('/gestacao')
            break
          case 'r':
            event.preventDefault()
            router.push('/reports')
            break
          case 's':
            event.preventDefault()
            router.push('/settings')
            break
          case 'h':
            event.preventDefault()
            setShowShortcuts(!showShortcuts)
            break
          case 'd':
            event.preventDefault()
            router.push('/')
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router, showShortcuts])

  // Limpar o último pressionado após 2 segundos
  useEffect(() => {
    if (lastPressed) {
      const timer = setTimeout(() => setLastPressed(''), 2000)
      return () => clearTimeout(timer)
    }
  }, [lastPressed])

  return (
    <>
      {/* Botão flutuante para mostrar atalhos */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setShowShortcuts(!showShortcuts)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
          title="Atalhos de Teclado (Alt + H)"
        >
          ⌨️
        </button>
      </div>

      {/* Indicador de tecla pressionada */}
      {lastPressed && (
        <div className="fixed top-4 right-4 z-50 bg-black text-white px-4 py-2 rounded-lg shadow-lg animate-pulse">
          <div className="text-sm font-mono">
            {lastPressed}
          </div>
        </div>
      )}

      {/* Modal de atalhos */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold flex items-center">
                    ⌨️ Atalhos de Teclado
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">
                    Navegue mais rápido pelo sistema
                  </p>
                </div>
                <button
                  onClick={() => setShowShortcuts(false)}
                  className="text-white hover:text-gray-200 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-3">
                {shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                    onClick={shortcut.action}
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {shortcut.description}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {shortcut.key.split(' + ').map((key, keyIndex) => (
                        <span key={keyIndex} className="flex items-center">
                          {keyIndex > 0 && <span className="mx-1 text-gray-400">+</span>}
                          <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded text-xs font-mono">
                            {key}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Dicas */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center">
                  💡 Dicas
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Mantenha Alt pressionado e aperte a letra</li>
                  <li>• Os atalhos funcionam em qualquer página</li>
                  <li>• Use Alt + H para mostrar/ocultar esta janela</li>
                  <li>• Clique nos atalhos acima para testá-los</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {shortcuts.length} atalhos disponíveis
                </div>
                <button
                  onClick={() => setShowShortcuts(false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                >
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