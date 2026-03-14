
import React, { useState } from 'react'

import { useToast } from '../../contexts/ToastContext'

const BackupManager = () => {
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [backupHistory, setBackupHistory] = useState([
    {
      id: 1,
      date: new Date().toISOString(),
      size: '2.4 MB',
      status: 'success',
      type: 'manual',
      tables: ['animals', 'costs', 'users', 'sales']
    },
    {
      id: 2,
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      size: '2.3 MB',
      status: 'success',
      type: 'automatic',
      tables: ['animals', 'costs', 'users', 'sales']
    }
  ])
  const toast = useToast()

  const createBackup = async (type = 'manual') => {
    setIsBackingUp(true)
    toast.info('Iniciando backup do sistema...')

    try {
      // Simular processo de backup
      await new Promise(resolve => setTimeout(resolve, 3000))

      const newBackup = {
        id: Date.now(),
        date: new Date().toISOString(),
        size: `${(Math.random() * 2 + 2).toFixed(1)} MB`,
        status: 'success',
        type,
        tables: ['animals', 'costs', 'users', 'sales', 'births']
      }

      setBackupHistory(prev => [newBackup, ...prev])
      toast.success('Backup criado com sucesso!')

      // Simular download do backup
      if (type === 'manual') {
        const backupData = {
          timestamp: new Date().toISOString(),
          version: '3.0',
          tables: {
            animals: 'Dados dos animais',
            costs: 'Dados de custos',
            users: 'Dados de usuários',
            sales: 'Dados de vendas'
          }
        }

        const dataStr = JSON.stringify(backupData, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `backup-beef-sync-${new Date().toISOString().split('T')[0]}.json`
        link.click()
        URL.revokeObjectURL(url)
      }

    } catch (error) {
      console.error('Erro no backup:', error)
      toast.error('Erro ao criar backup. Tente novamente.')
    } finally {
      setIsBackingUp(false)
    }
  }

  const restoreBackup = async (backupId) => {
    if (!confirm('Tem certeza que deseja restaurar este backup? Todos os dados atuais serão substituídos.')) {
      return
    }

    toast.info('Iniciando restauração...')
    
    try {
      // Simular processo de restauração
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success('Backup restaurado com sucesso!')
    } catch (error) {
      console.error('Erro na restauração:', error)
      toast.error('Erro ao restaurar backup.')
    }
  }

  const deleteBackup = (backupId) => {
    if (!confirm('Tem certeza que deseja excluir este backup?')) {
      return
    }

    setBackupHistory(prev => prev.filter(b => b.id !== backupId))
    toast.success('Backup excluído com sucesso!')
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      case 'in_progress':
        return '⏳'
      default:
        return '❓'
    }
  }

  const getTypeIcon = (type) => {
    return type === 'automatic' ? '🤖' : '👤'
  }

  return (
    <div className="space-y-6">
      {/* Controles de Backup */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          💾 Gerenciamento de Backup
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {backupHistory.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Backups Disponíveis</div>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {backupHistory.filter(b => b.status === 'success').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Backups Bem-sucedidos</div>
          </div>
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {backupHistory[0]?.size || '0 MB'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Último Backup</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => createBackup('manual')}
            disabled={isBackingUp}
            className="btn-primary flex items-center justify-center disabled:opacity-50"
          >
            {isBackingUp ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Criando Backup...
              </>
            ) : (
              <>
                💾 Criar Backup Manual
              </>
            )}
          </button>
          
          <label className="btn-secondary flex items-center justify-center cursor-pointer">
            📁 Restaurar de Arquivo
            <input
              type="file"
              accept=".json,.backup"
              className="hidden"
              onChange={(e) => {
                if (e.target.files[0]) {
                  toast.info('Funcionalidade de restauração em desenvolvimento')
                }
              }}
            />
          </label>

          <button
            onClick={() => createBackup('automatic')}
            className="btn-secondary"
          >
            🤖 Simular Backup Automático
          </button>
        </div>
      </div>

      {/* Histórico de Backups */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
          📋 Histórico de Backups
        </h4>
        
        {backupHistory.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 dark:text-gray-500 text-4xl mb-2">📦</div>
            <p className="text-gray-500 dark:text-gray-400">Nenhum backup encontrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {backupHistory.map((backup) => (
              <div key={backup.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getStatusIcon(backup.status)}</span>
                    <span className="text-lg">{getTypeIcon(backup.type)}</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Backup {backup.type === 'automatic' ? 'Automático' : 'Manual'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(backup.date)} • {backup.size} • {backup.tables.length} tabelas
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      Tabelas: {backup.tables.join(', ')}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => restoreBackup(backup.id)}
                    className="px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                    title="Restaurar"
                  >
                    🔄 Restaurar
                  </button>
                  <button
                    onClick={() => {
                      // Simular download
                      toast.info('Download do backup iniciado')
                    }}
                    className="px-3 py-1 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                    title="Download"
                  >
                    📥 Download
                  </button>
                  <button
                    onClick={() => deleteBackup(backup.id)}
                    className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    title="Excluir"
                  >
                    🗑️ Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Configurações de Backup Automático */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
          ⚙️ Configurações de Backup Automático
        </h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Backup Automático Ativado
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Realizar backup automático dos dados
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Frequência
              </label>
              <select className="input-field">
                <option value="daily">Diário</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Horário
              </label>
              <input
                type="time"
                defaultValue="02:00"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Retenção (dias)
              </label>
              <input
                type="number"
                defaultValue="30"
                min="7"
                max="365"
                className="input-field"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BackupManager