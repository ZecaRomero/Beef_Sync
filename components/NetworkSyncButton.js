
import React, { useState } from 'react'

import { CloudArrowUpIcon, CloudArrowDownIcon, ShareIcon } from './ui/Icons'

export default function NetworkSyncButton() {
  const [showMenu, setShowMenu] = useState(false)

  const handleExport = () => {
    if (window.exportAllData) {
      window.exportAllData()
      setShowMenu(false)
    } else {
      alert('Utilitários de sincronização não carregados')
    }
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result)
            if (window.importAllData) {
              window.importAllData(data)
            }
          } catch (error) {
            alert('Arquivo inválido')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
    setShowMenu(false)
  }

  const handleShowNetworkInfo = () => {
    if (window.showNetworkInfo) {
      window.showNetworkInfo()
      alert('ℹ️ Informações de rede exibidas no console (F12)')
    }
    setShowMenu(false)
  }

  return (
    <div className="fixed bottom-20 right-4 z-40">
      {/* Menu de opções */}
      {showMenu && (
        <div className="mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2 min-w-48">
          <button
            onClick={handleExport}
            className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <CloudArrowUpIcon className="h-4 w-4 mr-2" />
            Exportar Dados
          </button>
          <button
            onClick={handleImport}
            className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <CloudArrowDownIcon className="h-4 w-4 mr-2" />
            Importar Dados
          </button>
          <button
            onClick={handleShowNetworkInfo}
            className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ShareIcon className="h-4 w-4 mr-2" />
            Info da Rede
          </button>
          <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 px-3">
              Para sincronizar entre computadores
            </div>
          </div>
        </div>
      )}

      {/* Botão principal */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
        title="Sincronização de Rede"
      >
        <ShareIcon className="h-5 w-5" />
      </button>
    </div>
  )
}