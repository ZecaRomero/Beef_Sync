import React, { useState, useEffect } from 'react'
import { 
  WifiIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

const ConnectionStatus = ({ className = '' }) => {
  const [mounted, setMounted] = useState(false)
  const [status, setStatus] = useState({
    online: typeof window !== 'undefined' ? navigator.onLine : true,
    database: 'checking',
    apis: 'checking',
    lastCheck: null
  })
  const [checking, setChecking] = useState(false)

  // Inicializar apenas no cliente
  useEffect(() => {
    setMounted(true)
    // Atualizar status inicial no cliente
    setStatus(prev => ({
      ...prev,
      online: navigator.onLine
    }))
  }, [])

  const checkConnections = async () => {
    if (!mounted) return
    
    setChecking(true)
    
    try {
      // Helper para criar timeout
      const createTimeout = (ms) => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort('Timeout'), ms)
        return { signal: controller.signal, cleanup: () => clearTimeout(timeoutId) }
      }
      
      // Verificar conexÃ£o com banco com timeout
      const dbTimeout = createTimeout(5000)
      const dbPromise = fetch('/api/database/test', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: dbTimeout.signal
      }).then(async r => {
        dbTimeout.cleanup()
        if (!r.ok) {
          return { success: false, error: `HTTP ${r.status}` }
        }
        return r.json()
      }).catch(err => {
        dbTimeout.cleanup()
        if (err.name === 'AbortError') {
          return { success: false, error: 'Timeout' }
        }
        return { success: false, error: err.message }
      })
      
      // Verificar APIs principais com timeout
      const apiPromises = ['/api/animals', '/api/semen', '/api/healthz'].map(endpoint => {
        const timeout = createTimeout(5000)
        return fetch(endpoint, { signal: timeout.signal })
          .then(r => {
            timeout.cleanup()
            return r.ok
          })
          .catch(() => {
            timeout.cleanup()
            return false
          })
      })
      
      const apiChecks = await Promise.allSettled(apiPromises)
      const dbData = await dbPromise
      const apisWorking = apiChecks.filter(r => r.status === 'fulfilled' && r.value === true).length
      const totalApis = apiChecks.length
      
      setStatus({
        online: navigator.onLine,
        database: dbData.success ? 'connected' : 'error',
        apis: apisWorking === totalApis ? 'connected' : apisWorking > 0 ? 'partial' : 'error',
        lastCheck: new Date(),
        apiStats: { working: apisWorking, total: totalApis },
        error: dbData.error || null
      })
    } catch (error) {
      console.error('Erro ao verificar conexÃµes:', error)
      setStatus(prev => ({
        ...prev,
        database: 'error',
        apis: 'error',
        lastCheck: new Date(),
        error: error.message
      }))
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    if (!mounted) return
    
    checkConnections()
    
    // Verificar a cada 2 minutos
    const interval = setInterval(checkConnections, 2 * 60 * 1000)
    
    // Listeners para mudanÃ§as de conectividade
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, online: true }))
      checkConnections()
    }
    
    const handleOffline = () => {
      setStatus(prev => ({ ...prev, online: false }))
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [mounted])

  // NÃ£o renderizar nada atÃ© o componente estar hidratado no cliente
  if (!mounted) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="flex items-center space-x-1 text-gray-500">
          <WifiIcon className="w-5 h-5" />
          <span className="text-sm font-medium">Verificando...</span>
        </div>
      </div>
    )
  }

  const getStatusColor = () => {
    if (!status.online) return 'text-red-500'
    if (status.database === 'error' || status.apis === 'error') return 'text-red-500'
    if (status.apis === 'partial') return 'text-yellow-500'
    if (status.database === 'connected' && status.apis === 'connected') return 'text-green-500'
    return 'text-gray-500'
  }

  const getStatusIcon = () => {
    if (!status.online) return <XCircleIcon className="w-5 h-5" />
    if (status.database === 'error' || status.apis === 'error') return <XCircleIcon className="w-5 h-5" />
    if (status.apis === 'partial') return <ExclamationTriangleIcon className="w-5 h-5" />
    if (status.database === 'connected' && status.apis === 'connected') return <CheckCircleIcon className="w-5 h-5" />
    return <WifiIcon className="w-5 h-5" />
  }

  const getStatusText = () => {
    if (!status.online) return 'Offline'
    if (status.database === 'checking' || status.apis === 'checking') return 'Verificando...'
    if (status.database === 'error') return 'X'
    if (status.apis === 'error') return 'Erro nas APIs'
    if (status.apis === 'partial') return 'APIs Parciais'
    if (status.database === 'connected' && status.apis === 'connected') return 'Conectado'
    return 'Desconhecido'
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`flex items-center space-x-1 ${getStatusColor()}`}>
        {checking ? (
          <ArrowPathIcon className="w-5 h-5 animate-spin" />
        ) : (
          getStatusIcon()
        )}
        <span className="text-sm font-medium">
          {getStatusText()}
        </span>
      </div>
      
      {status.lastCheck && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {status.lastCheck.toLocaleTimeString()}
        </span>
      )}
      
      {/* Tooltip com detalhes */}
      <div className="relative group">
        <button
          onClick={checkConnections}
          disabled={checking}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <ArrowPathIcon className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
        </button>
        
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          <div className="space-y-1">
            <div>Internet: {status.online ? 'âÅ“â€œ' : 'âÅ“â€”'}</div>
            <div>Banco: {status.database === 'connected' ? 'âÅ“â€œ' : status.database === 'error' ? 'âÅ“â€”' : '?'}</div>
            <div>APIs: {status.apiStats ? `${status.apiStats.working}/${status.apiStats.total}` : '?'}</div>
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    </div>
  )
}

export default ConnectionStatus