
import React, { useEffect, useState } from 'react'

import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ServerIcon,
  DatabaseIcon,
  CpuChipIcon,
  ClockIcon,
  ArrowPathIcon,
  ShieldCheckIcon
} from '../components/ui/Icons'
import Button from '../components/ui/Button'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Toast from '../components/ui/SimpleToast'

export default function SystemCheck() {
  const [loading, setLoading] = useState(false)
  const [checkResults, setCheckResults] = useState(null)
  const [lastCheck, setLastCheck] = useState(null)

  useEffect(() => {
    performSystemCheck()
  }, [])

  const performSystemCheck = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/system-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'completo' })
      })

      if (response.ok) {
        const results = await response.json()
        setCheckResults(results)
        setLastCheck(new Date().toISOString())
        Toast.success('Verificação do sistema concluída!')
      } else {
        Toast.error('Erro ao verificar sistema')
      }
    } catch (error) {
      console.error('Erro na verificação:', error)
      Toast.error('Erro na verificação do sistema')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ok':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      case 'slow':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'ok':
        return 'text-green-600 dark:text-green-400'
      case 'error':
        return 'text-red-600 dark:text-red-400'
      case 'slow':
        return 'text-yellow-600 dark:text-yellow-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const formatBytes = (size) => {
    if (!size) return 'N/A'
    return size
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Verificação do Sistema
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Verifique o status de todas as APIs e componentes do sistema
          </p>
        </div>
        <Button
          onClick={performSystemCheck}
          disabled={loading}
          className="flex items-center space-x-2"
        >
          {loading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              <ArrowPathIcon className="h-5 w-5" />
              <span>Verificar Sistema</span>
            </>
          )}
        </Button>
      </div>

      {!checkResults ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <ServerIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Clique em "Verificar Sistema" para iniciar a verificação
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Resumo Geral */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Resumo Geral
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-3">
                <DatabaseIcon className="h-8 w-8 text-blue-500" />
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Banco de Dados</div>
                  <div className={`font-medium ${getStatusColor(checkResults.database.status)}`}>
                    {checkResults.database.status === 'ok' ? 'Conectado' : 'Erro'}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <ServerIcon className="h-8 w-8 text-green-500" />
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">APIs</div>
                  <div className="font-medium text-green-600 dark:text-green-400">
                    {Object.keys(checkResults.apis).length} Ativas
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <ShieldCheckIcon className="h-8 w-8 text-purple-500" />
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Integridade</div>
                  <div className={`font-medium ${getStatusColor(checkResults.data.status)}`}>
                    {checkResults.data.status === 'ok' ? 'OK' : 'Problemas'}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <CpuChipIcon className="h-8 w-8 text-orange-500" />
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Performance</div>
                  <div className={`font-medium ${getStatusColor(checkResults.performance.status)}`}>
                    {checkResults.performance.status === 'ok' ? 'Boa' : 'Lenta'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Banco de Dados */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Banco de Dados
              </h2>
              {getStatusIcon(checkResults.database.status)}
            </div>
            
            {checkResults.database.status === 'ok' ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Status:</span>
                  <span className="text-green-600 dark:text-green-400 font-medium">Conectado</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Versão:</span>
                  <span className="text-gray-900 dark:text-white">{checkResults.database.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Última Verificação:</span>
                  <span className="text-gray-900 dark:text-white">{formatDate(checkResults.database.timestamp)}</span>
                </div>
              </div>
            ) : (
              <div className="text-red-600 dark:text-red-400">
                Erro: {checkResults.database.error}
              </div>
            )}
          </div>

          {/* Tabelas */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Tabelas do Sistema
            </h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tabela
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Registros
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tamanho
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {Object.entries(checkResults.tables).map(([tableName, tableInfo]) => (
                    <tr key={tableName}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {tableName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {tableInfo.exists ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            OK
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            Erro
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {tableInfo.exists ? tableInfo.records : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {tableInfo.exists ? formatBytes(tableInfo.size) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* APIs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              APIs do Sistema
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(checkResults.apis).map(([apiName, apiInfo]) => (
                <div key={apiName} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {apiName}
                    </h3>
                    {getStatusIcon(apiInfo.status)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {apiInfo.endpoint}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Métodos: {apiInfo.methods.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Integridade dos Dados */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Integridade dos Dados
              </h2>
              {getStatusIcon(checkResults.data.status)}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Animais Órfãos:</span>
                  <span className={checkResults.data.orphanedAnimals > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}>
                    {checkResults.data.orphanedAnimals}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">TEs Órfãs:</span>
                  <span className={checkResults.data.orphanedTEs > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}>
                    {checkResults.data.orphanedTEs}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Dados Inconsistentes:</span>
                  <span className={checkResults.data.inconsistentData > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                    {checkResults.data.inconsistentData}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Datas Inválidas:</span>
                  <span className={checkResults.data.invalidDates > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                    {checkResults.data.invalidDates}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Performance */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Performance
              </h2>
              {getStatusIcon(checkResults.performance.status)}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Consulta Simples:</span>
                  <span className={checkResults.performance.simpleQueryTime < 100 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}>
                    {checkResults.performance.simpleQueryTime}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Consulta Complexa:</span>
                  <span className={checkResults.performance.complexQueryTime < 1000 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}>
                    {checkResults.performance.complexQueryTime}ms
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Informações da Verificação */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <ClockIcon className="h-4 w-4" />
              <span>Última verificação: {lastCheck ? formatDate(lastCheck) : 'Nunca'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
