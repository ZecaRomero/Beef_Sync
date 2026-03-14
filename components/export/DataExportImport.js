
import React, { useState } from 'react'

import { 
  ArrowDownTrayIcon, 
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '../ui/Icons'

// Ícone adicional que não está no arquivo Icons.js
const ArrowUpTrayIcon = ({ className = "h-6 w-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
)

export default function DataExportImport({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('export')
  const [exportFormat, setExportFormat] = useState('json')
  const [importFile, setImportFile] = useState(null)
  const [importPreview, setImportPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })

  const exportData = async () => {
    try {
      setLoading(true)
      setStatus({ type: '', message: '' })

      // Coletar todos os dados do sistema
      const data = {
        metadata: {
          exportDate: new Date().toISOString(),
          version: '1.0',
          source: 'Beef Sync'
        },
        animals: JSON.parse(localStorage.getItem('animals') || '[]'),
        nascimentos: JSON.parse(localStorage.getItem('birthData') || '[]'),
        custos: JSON.parse(localStorage.getItem('custos') || '[]'),
        estoqueSemen: JSON.parse(localStorage.getItem('estoqueSemen') || '[]'),
        notasFiscais: JSON.parse(localStorage.getItem('notasFiscais') || '[]'),
        protocolos: JSON.parse(localStorage.getItem('protocolos') || '[]'),
        configuracoes: JSON.parse(localStorage.getItem('beefsync_config') || '{}')
      }

      if (exportFormat === 'json') {
        // Exportar como JSON
        const jsonData = JSON.stringify(data, null, 2)
        const blob = new Blob([jsonData], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        
        const a = document.createElement('a')
        a.href = url
        a.download = `beefsync_backup_${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        setStatus({ type: 'success', message: 'Dados exportados com sucesso!' })
      } else if (exportFormat === 'csv') {
        // Exportar animais como CSV
        const animais = data.animals
        if (animais.length === 0) {
          setStatus({ type: 'warning', message: 'Nenhum animal encontrado para exportar.' })
          return
        }

        const headers = ['ID', 'Série', 'RG', 'Tatuagem', 'Sexo', 'Raça', 'Data Nascimento', 'Peso', 'Situação', 'Data Entrada']
        const csvContent = [
          headers.join(','),
          ...animais.map(animal => [
            animal.id || '',
            animal.serie || '',
            animal.rg || '',
            animal.tatuagem || '',
            animal.sexo || '',
            animal.raca || '',
            animal.dataNascimento || '',
            animal.peso || '',
            animal.situacao || '',
            animal.dataEntrada || ''
          ].join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        
        const a = document.createElement('a')
        a.href = url
        a.download = `animais_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        setStatus({ type: 'success', message: 'Animais exportados como CSV!' })
      }

    } catch (error) {
      console.error('Erro ao exportar dados:', error)
      setStatus({ type: 'error', message: 'Erro ao exportar dados: ' + error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleFileImport = (event) => {
    const file = event.target.files[0]
    if (!file) return

    setImportFile(file)
    setStatus({ type: '', message: '' })

    // Fazer preview do arquivo
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target.result
        if (file.type === 'application/json') {
          const data = JSON.parse(content)
          setImportPreview({
            type: 'json',
            data: data,
            summary: {
              animals: data.animals?.length || 0,
              nascimentos: data.nascimentos?.length || 0,
              custos: data.custos?.length || 0,
              estoqueSemen: data.estoqueSemen?.length || 0,
              notasFiscais: data.notasFiscais?.length || 0
            }
          })
        } else if (file.type === 'text/csv') {
          const lines = content.split('\n')
          const headers = lines[0].split(',')
          const rows = lines.slice(1).filter(line => line.trim())
          
          setImportPreview({
            type: 'csv',
            data: { headers, rows },
            summary: {
              totalRows: rows.length
            }
          })
        }
      } catch (error) {
        setStatus({ type: 'error', message: 'Erro ao ler arquivo: ' + error.message })
      }
    }
    reader.readAsText(file)
  }

  const importData = async () => {
    if (!importFile || !importPreview) return

    try {
      setLoading(true)
      setStatus({ type: '', message: '' })

      if (importPreview.type === 'json') {
        const data = importPreview.data

        // Fazer backup dos dados atuais
        const backup = {
          animals: JSON.parse(localStorage.getItem('animals') || '[]'),
          nascimentos: JSON.parse(localStorage.getItem('birthData') || '[]'),
          custos: JSON.parse(localStorage.getItem('custos') || '[]'),
          estoqueSemen: JSON.parse(localStorage.getItem('estoqueSemen') || '[]'),
          notasFiscais: JSON.parse(localStorage.getItem('notasFiscais') || '[]'),
          protocolos: JSON.parse(localStorage.getItem('protocolos') || '[]'),
          configuracoes: JSON.parse(localStorage.getItem('beefsync_config') || '{}')
        }

        localStorage.setItem('beefsync_backup_' + Date.now(), JSON.stringify(backup))

        // Importar novos dados
        if (data.animals) localStorage.setItem('animals', JSON.stringify(data.animals))
        if (data.nascimentos) localStorage.setItem('birthData', JSON.stringify(data.nascimentos))
        if (data.custos) localStorage.setItem('custos', JSON.stringify(data.custos))
        if (data.estoqueSemen) localStorage.setItem('estoqueSemen', JSON.stringify(data.estoqueSemen))
        if (data.notasFiscais) localStorage.setItem('notasFiscais', JSON.stringify(data.notasFiscais))
        if (data.protocolos) localStorage.setItem('protocolos', JSON.stringify(data.protocolos))
        if (data.configuracoes) localStorage.setItem('beefsync_config', JSON.stringify(data.configuracoes))

        setStatus({ 
          type: 'success', 
          message: `Dados importados com sucesso! ${importPreview.summary.animals} animais, ${importPreview.summary.nascimentos} nascimentos, ${importPreview.summary.custos} custos.` 
        })

      } else if (importPreview.type === 'csv') {
        // Importar CSV como animais
        const { headers, rows } = importPreview.data
        const animais = rows.map((row, index) => {
          const values = row.split(',')
          return {
            id: Date.now() + index,
            serie: values[1] || '',
            rg: values[2] || '',
            tatuagem: values[3] || '',
            sexo: values[4] || '',
            raca: values[5] || '',
            dataNascimento: values[6] || '',
            peso: values[7] || '',
            situacao: values[8] || 'Ativo',
            dataEntrada: values[9] || new Date().toISOString().split('T')[0],
            created_at: new Date().toISOString()
          }
        })

        // Fazer backup
        const currentAnimals = JSON.parse(localStorage.getItem('animals') || '[]')
        localStorage.setItem('beefsync_backup_animals_' + Date.now(), JSON.stringify(currentAnimals))

        // Adicionar novos animais
        const allAnimals = [...currentAnimals, ...animais]
        localStorage.setItem('animals', JSON.stringify(allAnimals))

        setStatus({ 
          type: 'success', 
          message: `${animais.length} animais importados com sucesso!` 
        })
      }

      // Limpar preview
      setImportPreview(null)
      setImportFile(null)

    } catch (error) {
      console.error('Erro ao importar dados:', error)
      setStatus({ type: 'error', message: 'Erro ao importar dados: ' + error.message })
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = () => {
    switch (status.type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      default:
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            📊 Exportar/Importar Dados
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'export'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <ArrowDownTrayIcon className="h-5 w-5 inline mr-2" />
            Exportar
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'import'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <ArrowUpTrayIcon className="h-5 w-5 inline mr-2" />
            Importar
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'export' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Exportar Dados do Sistema
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Exporte todos os seus dados para backup ou transferência.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Formato de Exportação
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="json"
                      checked={exportFormat === 'json'}
                      onChange={(e) => setExportFormat(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      JSON Completo (todos os dados)
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="csv"
                      checked={exportFormat === 'csv'}
                      onChange={(e) => setExportFormat(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      CSV (apenas animais)
                    </span>
                  </label>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-start">
                  <InformationCircleIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-2" />
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-medium">Informações sobre a exportação:</p>
                    <ul className="mt-1 list-disc list-inside space-y-1">
                      <li>O arquivo JSON contém todos os dados do sistema</li>
                      <li>O arquivo CSV contém apenas a lista de animais</li>
                      <li>Um backup automático é criado antes da importação</li>
                      <li>Os dados são exportados no formato atual do sistema</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                onClick={exportData}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <ArrowDownTrayIcon className="h-5 w-5" />
                )}
                <span>{loading ? 'Exportando...' : 'Exportar Dados'}</span>
              </button>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Importar Dados
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Importe dados de um arquivo de backup ou CSV.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Selecionar Arquivo
                </label>
                <input
                  type="file"
                  accept=".json,.csv"
                  onChange={handleFileImport}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {importPreview && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Preview do Arquivo
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    {importPreview.type === 'json' && (
                      <>
                        <p>Animais: {importPreview.summary.animals}</p>
                        <p>Nascimentos: {importPreview.summary.nascimentos}</p>
                        <p>Custos: {importPreview.summary.custos}</p>
                        <p>Estoque Sêmen: {importPreview.summary.estoqueSemen}</p>
                        <p>Notas Fiscais: {importPreview.summary.notasFiscais}</p>
                      </>
                    )}
                    {importPreview.type === 'csv' && (
                      <p>Linhas de dados: {importPreview.summary.totalRows}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mt-0.5 mr-2" />
                  <div className="text-sm text-yellow-700 dark:text-yellow-300">
                    <p className="font-medium">Atenção:</p>
                    <ul className="mt-1 list-disc list-inside space-y-1">
                      <li>Um backup automático será criado antes da importação</li>
                      <li>Os dados importados serão adicionados aos dados existentes</li>
                      <li>Verifique se o arquivo é compatível com o sistema</li>
                      <li>Recomendamos testar primeiro com dados de teste</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                onClick={importData}
                disabled={loading || !importFile}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <ArrowUpTrayIcon className="h-5 w-5" />
                )}
                <span>{loading ? 'Importando...' : 'Importar Dados'}</span>
              </button>
            </div>
          )}

          {/* Status */}
          {status.message && (
            <div className={`p-4 rounded-lg flex items-start space-x-2 ${
              status.type === 'success' ? 'bg-green-50 dark:bg-green-900/20' :
              status.type === 'error' ? 'bg-red-50 dark:bg-red-900/20' :
              status.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
              'bg-blue-50 dark:bg-blue-900/20'
            }`}>
              {getStatusIcon()}
              <p className={`text-sm ${
                status.type === 'success' ? 'text-green-700 dark:text-green-300' :
                status.type === 'error' ? 'text-red-700 dark:text-red-300' :
                status.type === 'warning' ? 'text-yellow-700 dark:text-yellow-300' :
                'text-blue-700 dark:text-blue-300'
              }`}>
                {status.message}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
