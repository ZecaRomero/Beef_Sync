
import React, { useEffect, useState } from 'react'

import { 
  EyeIcon,
  EyeSlashIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  AdjustmentsHorizontalIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

export default function AccessibilityEnhancements() {
  const [highContrast, setHighContrast] = useState(false)
  const [largeText, setLargeText] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [screenReader, setScreenReader] = useState(false)
  const [focusVisible, setFocusVisible] = useState(true)

  useEffect(() => {
    // Carregar preferências salvas
    const savedPrefs = JSON.parse(localStorage.getItem('beefsync_accessibility') || '{}')
    setHighContrast(savedPrefs.highContrast || false)
    setLargeText(savedPrefs.largeText || false)
    setReducedMotion(savedPrefs.reducedMotion || false)
    setScreenReader(savedPrefs.screenReader || false)
    setFocusVisible(savedPrefs.focusVisible !== false)

    // Aplicar preferências
    applyAccessibilitySettings(savedPrefs)
  }, [])

  const applyAccessibilitySettings = (settings) => {
    const root = document.documentElement

    // Alto contraste
    if (settings.highContrast) {
      root.classList.add('high-contrast')
      document.body.style.filter = 'contrast(150%) brightness(120%)'
    } else {
      root.classList.remove('high-contrast')
      document.body.style.filter = ''
    }

    // Texto grande
    if (settings.largeText) {
      root.style.fontSize = '18px'
      root.classList.add('large-text')
    } else {
      root.style.fontSize = ''
      root.classList.remove('large-text')
    }

    // Reduzir animações
    if (settings.reducedMotion) {
      root.style.setProperty('--animation-duration', '0.01ms')
      root.style.setProperty('--transition-duration', '0.01ms')
      root.classList.add('reduce-motion')
    } else {
      root.style.removeProperty('--animation-duration')
      root.style.removeProperty('--transition-duration')
      root.classList.remove('reduce-motion')
    }

    // Screen reader
    if (settings.screenReader) {
      root.classList.add('screen-reader-mode')
    } else {
      root.classList.remove('screen-reader-mode')
    }

    // Focus visível
    if (settings.focusVisible !== false) {
      root.classList.add('focus-visible')
    } else {
      root.classList.remove('focus-visible')
    }
  }

  const savePreferences = (newSettings) => {
    const updatedSettings = { ...newSettings }
    localStorage.setItem('beefsync_accessibility', JSON.stringify(updatedSettings))
    applyAccessibilitySettings(updatedSettings)
  }

  const handleHighContrast = (enabled) => {
    setHighContrast(enabled)
    savePreferences({ highContrast: enabled, largeText, reducedMotion, screenReader, focusVisible })
  }

  const handleLargeText = (enabled) => {
    setLargeText(enabled)
    savePreferences({ highContrast, largeText: enabled, reducedMotion, screenReader, focusVisible })
  }

  const handleReducedMotion = (enabled) => {
    setReducedMotion(enabled)
    savePreferences({ highContrast, largeText, reducedMotion: enabled, screenReader, focusVisible })
  }

  const handleScreenReader = (enabled) => {
    setScreenReader(enabled)
    savePreferences({ highContrast, largeText, reducedMotion, screenReader: enabled, focusVisible })
  }

  const handleFocusVisible = (enabled) => {
    setFocusVisible(enabled)
    savePreferences({ highContrast, largeText, reducedMotion, screenReader, focusVisible: enabled })
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <AdjustmentsHorizontalIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Configurações de Acessibilidade
        </h2>
      </div>

      <div className="space-y-6">
        {/* Alto Contraste */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {highContrast ? (
              <EyeIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            ) : (
              <EyeSlashIcon className="h-5 w-5 text-gray-400" />
            )}
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Alto Contraste
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Aumenta o contraste das cores para melhor legibilidade
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={highContrast}
              onChange={(e) => handleHighContrast(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Texto Grande */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-1 bg-gray-100 dark:bg-gray-700 rounded">
              <span className="text-sm font-bold text-gray-900 dark:text-white">A</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Texto Grande
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Aumenta o tamanho da fonte para facilitar a leitura
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={largeText}
              onChange={(e) => handleLargeText(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Reduzir Animações */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-1 bg-gray-100 dark:bg-gray-700 rounded">
              <span className="text-xs text-gray-600 dark:text-gray-400">⚡</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Reduzir Animações
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Remove animações que podem causar desconforto
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(e) => handleReducedMotion(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Modo Screen Reader */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {screenReader ? (
              <SpeakerWaveIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <SpeakerXMarkIcon className="h-5 w-5 text-gray-400" />
            )}
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Modo Screen Reader
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Otimiza a interface para leitores de tela
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={screenReader}
              onChange={(e) => handleScreenReader(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Focus Visível */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-1 bg-gray-100 dark:bg-gray-700 rounded">
              <span className="text-xs text-gray-600 dark:text-gray-400">🎯</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Focus Visível
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Destaca elementos focados para navegação por teclado
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={focusVisible}
              onChange={(e) => handleFocusVisible(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* Informações Adicionais */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="flex items-start space-x-2">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium">Dicas de Acessibilidade:</p>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li>Use Tab para navegar entre elementos</li>
              <li>Pressione Enter ou Espaço para ativar botões</li>
              <li>Use Ctrl + para aumentar o zoom do navegador</li>
              <li>As configurações são salvas automaticamente</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Atalhos de Teclado */}
      <div className="mt-6">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">
          Atalhos de Teclado
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Navegar</span>
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Tab</kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Ativar</span>
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Enter</kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Voltar</span>
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Esc</kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Buscar</span>
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl+F</kbd>
          </div>
        </div>
      </div>
    </div>
  )
}
