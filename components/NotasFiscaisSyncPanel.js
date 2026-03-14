
import React, { useEffect, useState } from 'react'

import { 
  ArrowPathIcon, 
  DocumentArrowDownIcon, 
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { ArrowDownTrayIcon, ArrowUpTrayIcon } from './ui/Icons'
import { notasFiscaisSync } from '../utils/notasFiscaisSync'

export default function NotasFiscaisSyncPanel() {
  const [syncStatus, setSyncStatus] = useState('idle')
  const [lastSync, setLastSync] = useState(null)
  const [deviceId, setDeviceId] = useState('')
  const [notasCount, setNotasCount] = useState(0)
  const [showExportData, setShowExportData] = useState(false)
  const [exportData, setExportData] = useState('')
  const [importData, setImportData] = useState('')
  const [autoSync, setAutoSync] = useState(false)

  useEffect(() => {
    loadSyncInfo()
    checkAutoSync()
  }, [])

  const loadSyncInfo = () => {
    const notasFiscais = JSON.parse(localStorage.getItem('notasFiscais') || '[]')
    setNotasCount(notasFiscais.length)
    setDeviceId(notasFiscaisSync.getDeviceId())
    setLastSync(localStorage.getItem('lastSync') || null)
  }

  const checkAutoSync = () => {
    const autoSyncEnabled = localStorage.getItem('autoSyncEnabled') === 'true'
    setAutoSync(autoSyncEnabled)
    if (autoSyncEnabled) {
      notasFiscaisSync.startAutoSync(5)
    }
  }

  const handleExport = () => {
    const data = notasFiscaisSync.exportData()
    if (data) {
      setExportData(JSON.stringify(data, null, 2))
      setShowExportData(true)
      setSyncStatus('exported')
    } else {
      setSyncStatus('error')
    }
  }

  const handleImport = () => {
    try {
      const data = JSON.parse(importData)
      const success = notasFiscaisSync.importData(data)
      
      if (success) {
        setSyncStatus('imported')
        localStorage.setItem('lastSync', new Date().toISOString())
        loadSyncInfo()
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setSyncStatus('error')
      }
    } catch (error) {
      console.error('Erro ao importar:', error)
      setSyncStatus('error')
    }
  }

  const handleAutoSync = () => {
    const newAutoSync = !autoSync
    setAutoSync(newAutoSync)
    localStorage.setItem('autoSyncEnabled', newAutoSync.toString())
    
    if (newAutoSync) {
      notasFiscaisSync.startAutoSync(5)
      setSyncStatus('auto-sync-enabled')
    } else {
      notasFiscaisSync.stopAutoSync()
      setSyncStatus('auto-sync-disabled')
    }
  }

  const handleRestoreBackup = () => {
    const success = notasFiscaisSync.restoreBackup()
    if (success) {
      setSyncStatus('restored')
      loadSyncInfo()
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } else {
      setSyncStatus('error')
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(exportData)
    setSyncStatus('copied')
  }

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'exported':
      case 'imported':
      case 'restored':
      case 'copied':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      case 'auto-sync-enabled':
      case 'auto-sync-disabled':
        return <ArrowPathIcon className="h-5 w-5 text-blue-500" />
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusMessage = () => {
    switch (syncStatus) {
      case 'exported':
        return 'Dados exportados com sucesso!'
      case 'imported':
        return 'Dados importados com sucesso! Recarregando...'
      case 'restored':
        return 'Backup restaurado com sucesso! Recarregando...'
      case 'copied':
        return 'Dados copiados para a área de transferência!'
      case 'error':
        return 'Erro na operação. Verifique os dados e tente novamente.'
      case 'auto-sync-enabled':
        return 'Sincronização automática ativada!'
      case 'auto-sync-disabled':
        return 'Sincronização automática desativada!'
      default:
        return 'Sistema de sincronização de notas fiscais'
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            🔄 Sincronização de Notas Fiscais
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Sincronize dados entre localhost e rede local
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {getStatusMessage()}
          </span>
        </div>
      </div>

      {/* Informações do Sistema */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="text-2xl">📱</div>
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400">Dispositivo</p>
              <p className="text-xs text-blue-500 dark:text-blue-300 font-mono">
                {deviceId.substring(0, 20)}...
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="text-2xl">📋</div>
            <div>
              <p className="text-sm text-green-600 dark:text-green-400">Notas Fiscais</p>
              <p className="text-lg font-semibold text-green-700 dark:text-green-300">
                {notasCount}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="text-2xl">⏰</div>
            <div>
              <p className="text-sm text-purple-600 dark:text-purple-400">Última Sincronização</p>
              <p className="text-xs text-purple-500 dark:text-purple-300">
                {lastSync ? new Date(lastSync).toLocaleString('pt-BR') : 'Nunca'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Controles de Sincronização */}
      <div className="space-y-4">
        {/* Exportar Dados */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">Exportar Dados</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Copie os dados para transferir para outro dispositivo
            </p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            <span>Exportar</span>
          </button>
        </div>

        {/* Importar Dados */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="mb-3">
            <h4 className="font-medium text-gray-900 dark:text-white">Importar Dados</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Cole os dados exportados de outro dispositivo
            </p>
          </div>
          <textarea
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            placeholder="Cole aqui os dados exportados..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white mb-3"
          />
          <button
            onClick={handleImport}
            disabled={!importData.trim()}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowUpTrayIcon className="h-5 w-5" />
            <span>Importar</span>
          </button>
        </div>

        {/* Sincronização Automática */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">Sincronização Automática</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sincronizar automaticamente a cada 5 minutos
            </p>
          </div>
          <button
            onClick={handleAutoSync}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              autoSync
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            <ArrowPathIcon className="h-5 w-5" />
            <span>{autoSync ? 'Desativar' : 'Ativar'}</span>
          </button>
        </div>

        {/* Restaurar Backup */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">Restaurar Backup</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Restaurar dados do backup automático
            </p>
          </div>
          <button
            onClick={handleRestoreBackup}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <ArrowPathIcon className="h-5 w-5" />
            <span>Restaurar</span>
          </button>
        </div>
      </div>

      {/* Modal de Dados Exportados */}
      {showExportData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  📋 Dados Exportados
                </h3>
                <button
                  onClick={() => setShowExportData(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Copie os dados abaixo e cole no outro dispositivo:
                </p>
                <textarea
                  value={exportData}
                  readOnly
                  rows={15}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white font-mono text-sm"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  <span>Copiar</span>
                </button>
                <button
                  onClick={() => setShowExportData(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
