import React, { useState, useEffect } from 'react'
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

const ApiHealthMonitor = () => {
  const [apiStatus, setApiStatus] = useState({})
  const [loading, setLoading] = useState(true)
  const [lastCheck, setLastCheck] = useState(null)

  const apis = [
    { name: 'Database', endpoint: '/api/database/test', critical: true },
    { name: 'Animals', endpoint: '/api/animals', critical: true },
    { name: 'Semen', endpoint: '/api/semen', critical: true },
    { name: 'Reports', endpoint: '/api/reports/templates', critical: false },
    { name: 'Births', endpoint: '/api/births', critical: false },
    { name: 'Deaths', endpoint: '/api/deaths', critical: false },
    { name: 'Locations', endpoint: '/api/localizacoes', critical: false },
    { name: 'Costs', endpoint: '/api/custos', critical: false },
    { name: 'Notifications', endpoint: '/api/notifications', critical: false },
    { name: 'Health Check', endpoint: '/api/healthz', critical: true },
    { name: 'System Health', endpoint: '/api/system/health', critical: true },
    { name: 'System Check', endpoint: '/api/system-check', critical: false }
  ]

  const checkApiHealth = async (api) => {
    try {
      const response = await fetch(api.endpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const responseTime = Date.now()
      
      return {
        name: api.name,
        status: response.ok ? 'healthy' : 'error',
        statusCode: response.status,
        responseTime: responseTime,
        critical: api.critical,
        endpoint: api.endpoint,
        error: response.ok ? null : `HTTP ${response.status}`
      }
    } catch (error) {
      return {
        name: api.name,
        status: 'error',
        statusCode: 0,
        responseTime: null,
        critical: api.critical,
        endpoint: api.endpoint,
        error: error.message
      }
    }
  }

  const checkAllApis = async () => {
    setLoading(true)
    const startTime = Date.now()
    
    try {
      const results = await Promise.all(
        apis.map(api => checkApiHealth(api))
      )
      
      const statusMap = {}
      results.forEach(result => {
        statusMap[result.name] = result
      })
      
      setApiStatus(statusMap)
      setLastCheck(new Date())
    } catch (error) {
      console.error('Erro ao verificar APIs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAllApis()
    
    // Verificar APIs a cada 5 minutos
    const interval = setInterval(checkAllApis, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-500" />
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status, critical) => {
    if (status === 'healthy') return 'bg-green-50 border-green-200'
    if (status === 'error' && critical) return 'bg-red-50 border-red-200'
    if (status === 'error') return 'bg-yellow-50 border-yellow-200'
    return 'bg-gray-50 border-gray-200'
  }

  const healthyCount = Object.values(apiStatus).filter(api => api.status === 'healthy').length
  const totalCount = Object.keys(apiStatus).length
  const criticalErrors = Object.values(apiStatus).filter(api => api.status === 'error' && api.critical).length

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Status das APIs
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Monitoramento em tempo real das conexões do sistema
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {healthyCount}/{totalCount} APIs
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {lastCheck && `Última verificação: ${lastCheck.toLocaleTimeString()}`}
              </div>
            </div>
            
            <button
              onClick={checkAllApis}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Status Geral */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center">
              <CheckCircleIcon className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {healthyCount}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  APIs Saudáveis
                </div>
              </div>
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center">
              <XCircleIcon className="w-8 h-8 text-red-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {criticalErrors}
                </div>
                <div className="text-sm text-red-600 dark:text-red-400">
                  Erros Críticos
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center">
              <ArrowPathIcon className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {loading ? '...' : '5min'}
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  Auto-refresh
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de APIs */}
        <div className="space-y-2">
          {Object.values(apiStatus).map((api) => (
            <div
              key={api.name}
              className={`p-4 rounded-lg border ${getStatusColor(api.status, api.critical)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(api.status)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {api.name}
                      </span>
                      {api.critical && (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                          Crítica
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {api.endpoint}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {api.status === 'healthy' ? 'OK' : 'ERRO'}
                  </div>
                  {api.error && (
                    <div className="text-xs text-red-500">
                      {api.error}
                    </div>
                  )}
                  {api.statusCode > 0 && (
                    <div className="text-xs text-gray-500">
                      HTTP {api.statusCode}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {loading && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
              <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
              Verificando APIs...
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ApiHealthMonitor