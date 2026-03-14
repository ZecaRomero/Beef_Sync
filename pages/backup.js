import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { 
  CloudArrowDownIcon,
  DocumentArrowDownIcon,
  ServerIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LockClosedIcon,
  ArrowPathIcon,
  DocumentArrowUpIcon,
} from '../components/ui/Icons'
import Button from '../components/ui/Button'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { useToast } from '../contexts/ToastContext'
import { formatDate } from '../utils/formatters'
import { formatBytes } from '../utils/formatters'
import logger from '../utils/logger'
import { usePermissions } from '../hooks/usePermissions'

export default function BackupSystem() {
  // ========== TODOS OS HOOKS PRIMEIRO ==========
  const permissions = usePermissions()
  const [loading, setLoading] = useState(false)
  const [backupHistory, setBackupHistory] = useState([])
  const [selectedType, setSelectedType] = useState('completo')
  const [selectedFormat, setSelectedFormat] = useState('json')
  const [saveFile, setSaveFile] = useState(true)
  const [lastBackup, setLastBackup] = useState(null)
  const [restoreFile, setRestoreFile] = useState(null)
  const [restoreLoading, setRestoreLoading] = useState(false)
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false)
  const [restorePreview, setRestorePreview] = useState(null)
  
  const toast = useToast()

  // Memoização dos tipos de backup
  const backupTypes = useMemo(() => [
    { value: 'completo', label: 'Backup Completo', description: 'Todos os dados do sistema', icon: '🗄️' },
    { value: 'animais', label: 'Animais', description: 'Dados de animais e custos', icon: '🐄' },
    { value: 'reprodutivo', label: 'Reprodutivo', description: 'TE, gestações, nascimentos', icon: '🐄' },
    { value: 'comercial', label: 'Comercial', description: 'Notas fiscais e serviços', icon: '🏢' },
    { value: 'financeiro', label: 'Financeiro', description: 'Custos e valores', icon: '💰' }
  ], [])

  const formats = useMemo(() => [
    { value: 'json', label: 'JSON', description: 'Formato JSON para importação' },
    { value: 'sql', label: 'SQL', description: 'Script SQL para restauração' }
  ], [])

  // Função auxiliar para gerar SQL (não é hook, mas precisa estar antes dos callbacks)
  const generateSQLFromBackup = (backup) => {
    let sql = '-- Backup do Sistema Beef-Sync\n'
    sql += `-- Gerado em: ${new Date().toISOString()}\n`
    sql += `-- Tipo: ${backup.metadata?.tipo || 'completo'}\n\n`

    const data = backup.data || {}
    
    for (const [tableName, records] of Object.entries(data)) {
      if (!Array.isArray(records) || records.length === 0) continue

      sql += `-- Tabela: ${tableName} (${records.length} registros)\n`
      sql += `DELETE FROM ${tableName};\n`

      const columns = Object.keys(records[0])
      const values = records.map(record => {
        const rowValues = columns.map(col => {
          const value = record[col]
          if (value === null || value === undefined) return 'NULL'
          if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`
          if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`
          if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
          return value
        })
        return `(${rowValues.join(', ')})`
      })

      sql += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES\n`
      sql += values.join(',\n') + ';\n\n'
    }

    return sql
  }

  const loadBackupHistory = useCallback(async () => {
    try {
      logger.debug('Carregando histórico de backups')
      
      // Simular histórico de backups (em produção, viria de uma API)
      const history = [
        {
          id: 1,
          tipo: 'completo',
          dataCriacao: new Date(Date.now() - 86400000).toISOString(),
          totalRegistros: 1250,
          tamanho: 2621440, // bytes
          status: 'sucesso'
        },
        {
          id: 2,
          tipo: 'animais',
          dataCriacao: new Date(Date.now() - 172800000).toISOString(),
          totalRegistros: 450,
          tamanho: 870400, // bytes
          status: 'sucesso'
        }
      ]
      setBackupHistory(history)
    } catch (error) {
      logger.error('Erro ao carregar histórico:', error)
    }
  }, [])

  const createBackup = useCallback(async () => {
    try {
      setLoading(true)
      logger.info('Criando backup', { tipo: selectedType, formato: selectedFormat })
      
      // Timeout de 5 minutos - backup completo pode demorar com muitos dados
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000)
      
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: selectedType,
          formato: selectedFormat,
          salvarArquivo: saveFile
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const text = await response.text()
        let backup
        try {
          backup = text ? JSON.parse(text) : null
        } catch (parseError) {
          logger.error('Resposta do backup inválida', { text: text?.substring(0, 200) })
          throw new Error('Resposta do servidor inválida. O backup pode ter expirado por tempo limite.')
        }
        if (!backup) {
          throw new Error('Resposta vazia do servidor. Tente um backup parcial (ex: apenas Animais).')
        }
        setLastBackup(backup)
        
        // FAZER DOWNLOAD AUTOMÁTICO DO ARQUIVO
        const timestamp = new Date().toISOString().split('T')[0]
        const fileName = `backup_${selectedType}_${timestamp}.${selectedFormat}`
        
        let content
        if (selectedFormat === 'json') {
          content = JSON.stringify(backup, null, 2)
        } else if (selectedFormat === 'sql') {
          // Para SQL, gerar o script
          content = generateSQLFromBackup(backup)
        }
        
        const blob = new Blob([content], { 
          type: selectedFormat === 'json' ? 'application/json' : 'text/plain' 
        })
        
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast.success(
          saveFile 
            ? `✅ Backup criado! Arquivo baixado e salvo no servidor` 
            : `✅ Backup criado e baixado! Escolha onde salvar`
        )
        logger.info('Backup criado e baixado', { backup, fileName })
        
        // Atualizar histórico
        await loadBackupHistory()
      } else {
        let errorMsg = 'Erro ao criar backup'
        try {
          const errText = await response.text()
          const error = errText ? JSON.parse(errText) : {}
          errorMsg = error.message || errorMsg
        } catch (_) {}
        toast.error(errorMsg)
        logger.error('Erro ao criar backup', { status: response.status })
      }
    } catch (error) {
      logger.error('Erro ao criar backup:', error)
      if (error.name === 'AbortError') {
        toast.error('Backup demorou muito. Tente um backup parcial (ex: apenas Animais) ou aguarde o servidor processar.')
      } else if (error.message?.includes('JSON') || error.message?.includes('Resposta')) {
        toast.error(error.message)
      } else {
        toast.error('Erro ao criar backup. Tente novamente ou use um backup parcial.')
      }
    } finally {
      setLoading(false)
    }
  }, [selectedType, selectedFormat, saveFile, toast, loadBackupHistory])

  const downloadBackup = useCallback(async (tipo, formato) => {
    try {
      setLoading(true)
      logger.info('Baixando backup', { tipo, formato })
      
      const response = await fetch(`/api/backup?tipo=${tipo}&formato=${formato}`)
      
      if (response.ok) {
        const backup = await response.json()
        
        // Criar arquivo para download
        const blob = new Blob([JSON.stringify(backup, null, 2)], { 
          type: formato === 'json' ? 'application/json' : 'text/plain' 
        })
        
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `backup_${tipo}_${new Date().toISOString().split('T')[0]}.${formato}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast.success('Backup baixado com sucesso!')
        logger.info('Backup baixado', { tipo, formato })
      } else {
        toast.error('Erro ao baixar backup')
        logger.error('Erro ao baixar backup')
      }
    } catch (error) {
      logger.error('Erro ao baixar backup:', error)
      toast.error('Erro ao baixar backup')
    } finally {
      setLoading(false)
    }
  }, [toast])

  const getStatusIcon = useCallback((status) => {
    switch (status) {
      case 'sucesso':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'erro':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-500" />
    }
  }, [])

  const getTypeInfo = useCallback((tipo) => {
    return backupTypes.find(t => t.value === tipo) || backupTypes[0]
  }, [backupTypes])

  const handleFileSelect = useCallback((event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setRestoreFile(file)
    setShowRestoreConfirm(false)
    setRestorePreview(null)

    // Ler e validar o arquivo
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target.result
        let backupData

        if (file.name.endsWith('.json')) {
          backupData = JSON.parse(content)
        } else if (file.name.endsWith('.sql')) {
          // Para SQL, apenas mostrar preview básico
          backupData = { tipo: 'sql', content: content.substring(0, 500) }
        } else {
          throw new Error('Formato de arquivo não suportado')
        }

        // Validar estrutura do backup
        if (file.name.endsWith('.json')) {
          if (!backupData.metadata || !backupData.data) {
            throw new Error('Arquivo de backup inválido')
          }
          setRestorePreview({
            tipo: backupData.metadata.tipo,
            dataCriacao: backupData.metadata.dataCriacao,
            totalRegistros: backupData.metadata.totalRegistros,
            tabelas: backupData.metadata.tabelas || [],
            versao: backupData.metadata.versao
          })
        } else {
          setRestorePreview({
            tipo: 'sql',
            tamanho: file.size,
            preview: content.substring(0, 300)
          })
        }
      } catch (error) {
        toast.error(`Erro ao ler arquivo: ${error.message}`)
        setRestoreFile(null)
      }
    }
    reader.readAsText(file)
  }, [toast])

  const restoreBackup = useCallback(async () => {
    if (!restoreFile) {
      toast.error('Selecione um arquivo de backup')
      return
    }

    try {
      setRestoreLoading(true)
      logger.info('Restaurando backup', { fileName: restoreFile.name })

      // Ler conteúdo do arquivo
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const fileContent = e.target.result

          const response = await fetch('/api/backup/restore', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileContent,
              fileName: restoreFile.name,
              fileType: restoreFile.type
            })
          })

          if (response.ok) {
            const result = await response.json()
            toast.success(`✅ Backup restaurado com sucesso! ${result.data?.registrosRestaurados || 0} registros restaurados.`)
            logger.info('Backup restaurado', result)
            
            // Limpar estado
            setRestoreFile(null)
            setRestorePreview(null)
            setShowRestoreConfirm(false)
            
            // Recarregar histórico
            await loadBackupHistory()
          } else {
            const error = await response.json()
            toast.error(error.message || 'Erro ao restaurar backup')
            logger.error('Erro ao restaurar backup', error)
            setRestoreLoading(false)
          }
        } catch (error) {
          logger.error('Erro ao restaurar backup:', error)
          toast.error('Erro ao restaurar backup')
          setRestoreLoading(false)
        }
      }

      reader.onerror = () => {
        toast.error('Erro ao ler arquivo')
        setRestoreLoading(false)
      }

      reader.readAsText(restoreFile)
    } catch (error) {
      logger.error('Erro ao restaurar backup:', error)
      toast.error('Erro ao restaurar backup')
      setRestoreLoading(false)
    }
  }, [restoreFile, toast, loadBackupHistory])

  useEffect(() => {
    loadBackupHistory()
  }, [loadBackupHistory])

  // ========== DEPOIS DE TODOS OS HOOKS, VERIFICAR PERMISSÕES ==========
  if (!permissions.canBackup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="mb-6">
            <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <LockClosedIcon className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              🔒 Acesso Restrito
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Esta funcionalidade está disponível apenas para acesso local (desenvolvedor)
            </p>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div className="text-sm text-left">
                <p className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                  Permissões do Usuário
                </p>
                <p className="text-yellow-700 dark:text-yellow-300">
                  Você está acessando via <strong>rede</strong> ({permissions.userName}). 
                  Usuários da rede podem <strong>incluir e alterar</strong> dados, mas não podem fazer backup, restaurar ou excluir informações.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 <strong>Para acessar esta funcionalidade:</strong><br />
              Use <code className="bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded">http://localhost:3020</code> ao invés do IP da rede.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Sistema de Backup
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Crie e gerencie backups dos dados do sistema
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <ServerIcon className="h-5 w-5" />
          <span>PostgreSQL</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Criar Backup */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Criar Novo Backup
          </h2>

          <div className="space-y-4">
            {/* Tipo de Backup */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Backup
              </label>
              <div className="grid grid-cols-1 gap-2">
                {backupTypes.map((type) => (
                  <label key={type.value} className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      name="backupType"
                      value={type.value}
                      checked={selectedType === type.value}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex items-center">
                      <span className="text-xl mr-3">{type.icon}</span>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{type.label}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{type.description}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Formato */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Formato
              </label>
              <div className="grid grid-cols-2 gap-2">
                {formats.map((format) => (
                  <label key={format.value} className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      name="format"
                      value={format.value}
                      checked={selectedFormat === format.value}
                      onChange={(e) => setSelectedFormat(e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{format.label}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{format.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Info Download Automático */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900 dark:text-blue-200">
                  <div className="font-semibold mb-1">📥 Download Automático</div>
                  <div>O arquivo será <strong>baixado automaticamente</strong> e você poderá escolher onde salvá-lo no seu computador.</div>
                </div>
              </div>
            </div>

            {/* Opções Adicionais */}
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveFile}
                  onChange={(e) => setSaveFile(e.target.checked)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    💾 Salvar cópia no servidor também
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Além do download, manter uma cópia de segurança na pasta backups/ do servidor
                  </div>
                </div>
              </label>
            </div>

            {/* Botão Criar */}
            <Button
              onClick={createBackup}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Criando e baixando backup...</span>
                </>
              ) : (
                <>
                  <DocumentArrowDownIcon className="h-5 w-5" />
                  <span>Criar e Baixar Backup</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Restaurar Backup */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Restaurar Backup
          </h2>

          <div className="space-y-4">
            {/* Aviso Importante */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-900 dark:text-red-200">
                  <div className="font-semibold mb-1">⚠️ Atenção</div>
                  <div>A restauração irá <strong>substituir</strong> os dados existentes no banco. Faça um backup antes de restaurar!</div>
                </div>
              </div>
            </div>

            {/* Upload de Arquivo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Selecione o arquivo de backup
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  accept=".json,.sql"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="restore-file-input"
                />
                <label
                  htmlFor="restore-file-input"
                  className="flex-1 cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                  {restoreFile ? restoreFile.name : 'Escolher arquivo'}
                </label>
              </div>
            </div>

            {/* Preview do Backup */}
            {restorePreview && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="text-sm text-blue-900 dark:text-blue-200">
                  <div className="font-semibold mb-2">📋 Preview do Backup</div>
                  {restorePreview.tipo !== 'sql' ? (
                    <div className="space-y-1">
                      <p><strong>Tipo:</strong> {getTypeInfo(restorePreview.tipo).label}</p>
                      <p><strong>Data:</strong> {formatDate(restorePreview.dataCriacao)}</p>
                      <p><strong>Registros:</strong> {restorePreview.totalRegistros}</p>
                      <p><strong>Tabelas:</strong> {restorePreview.tabelas?.length || 0}</p>
                      {restorePreview.versao && (
                        <p><strong>Versão:</strong> {restorePreview.versao}</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p><strong>Tipo:</strong> Script SQL</p>
                      <p><strong>Tamanho:</strong> {formatBytes(restorePreview.tamanho)}</p>
                      <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono overflow-auto max-h-32">
                        {restorePreview.preview}...
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Botão Restaurar */}
            <Button
              onClick={() => setShowRestoreConfirm(true)}
              disabled={!restoreFile || restoreLoading}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              {restoreLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Restaurando...</span>
                </>
              ) : (
                <>
                  <ArrowPathIcon className="h-5 w-5" />
                  <span>Restaurar Backup</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Histórico de Backups */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Histórico de Backups
          </h2>

          <div className="space-y-3">
            {backupHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <ServerIcon className="h-12 w-12 mx-auto mb-2" />
                <p>Nenhum backup encontrado</p>
              </div>
            ) : (
              backupHistory.map((backup) => {
                const typeInfo = getTypeInfo(backup.tipo)
                return (
                  <div key={backup.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(backup.status)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{typeInfo.icon}</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {typeInfo.label}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(backup.dataCriacao)} • {backup.totalRegistros} registros • {formatBytes(backup.tamanho)}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => downloadBackup(backup.tipo, 'json')}
                        className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        title="Baixar JSON"
                      >
                        <DocumentArrowDownIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal de Confirmação */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="mb-4">
              <div className="flex items-center space-x-3 mb-2">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Confirmar Restauração
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Esta ação irá <strong>substituir</strong> todos os dados existentes no banco de dados pelos dados do backup selecionado.
              </p>
            </div>

            {restorePreview && restorePreview.tipo !== 'sql' && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                <div className="text-sm text-yellow-900 dark:text-yellow-200">
                  <p><strong>Backup:</strong> {getTypeInfo(restorePreview.tipo).label}</p>
                  <p><strong>Registros:</strong> {restorePreview.totalRegistros}</p>
                  <p><strong>Tabelas:</strong> {restorePreview.tabelas?.join(', ') || 'N/A'}</p>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <Button
                onClick={() => setShowRestoreConfirm(false)}
                className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  setShowRestoreConfirm(false)
                  restoreBackup()
                }}
                disabled={restoreLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {restoreLoading ? 'Restaurando...' : 'Confirmar Restauração'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Último Backup */}
      {lastBackup && (
        <div className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            <h3 className="font-medium text-green-800 dark:text-green-200">
              Backup Criado com Sucesso!
            </h3>
          </div>
          <div className="text-sm text-green-700 dark:text-green-300">
            <p><strong>Tipo:</strong> {getTypeInfo(lastBackup.metadata.tipo).label}</p>
            <p><strong>Data:</strong> {formatDate(lastBackup.metadata.dataCriacao)}</p>
            <p><strong>Registros:</strong> {lastBackup.metadata.totalRegistros}</p>
            <p><strong>Tabelas:</strong> {lastBackup.metadata.tabelas.join(', ')}</p>
            {lastBackup.metadata.arquivoSalvo && (
              <p><strong>Arquivo:</strong> {lastBackup.metadata.arquivoSalvo}</p>
            )}
          </div>
        </div>
      )}

      {/* Informações do Sistema */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-medium text-blue-800 dark:text-blue-200">
            Informações do Sistema
          </h3>
        </div>
        <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <p>• <strong>Banco de Dados:</strong> PostgreSQL</p>
          <p>• <strong>Backup Completo:</strong> Inclui todas as tabelas do sistema</p>
          <p>• <strong>Backup Parcial:</strong> Seleciona dados específicos por categoria</p>
          <p>• <strong>Formato JSON:</strong> Para importação e análise de dados</p>
          <p>• <strong>Formato SQL:</strong> Para restauração direta no banco</p>
          <p>• <strong>Recomendação:</strong> Faça backup completo semanalmente</p>
        </div>
      </div>
    </div>
  )
}
