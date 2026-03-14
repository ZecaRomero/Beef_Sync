import { useState, useEffect } from 'react'
import { useUserIdentification } from '../../hooks/useUserIdentification'
import { 
  EyeIcon, 
  ClockIcon, 
  ComputerDesktopIcon,
  UsersIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline'

export default function AccessMonitor({ className = '' }) {
  const userInfo = useUserIdentification()
  const [accessLog, setAccessLog] = useState([])
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    // Atualizar horário a cada segundo
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('pt-BR'))
    }
    
    updateTime()
    const timeInterval = setInterval(updateTime, 1000)

    // Carregar logs de acesso reais da API
    const loadAccessLogs = async () => {
      try {
        const response = await fetch('/api/access-log')
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            const formattedLogs = data.data.slice(0, 10).map(log => ({
              id: log.id,
              user: log.user_name,
              type: log.user_type,
              ip: log.ip_address,
              time: new Date(log.access_time).toLocaleTimeString('pt-BR'),
              action: log.action
            }))
            setAccessLog(formattedLogs)
          }
        }
      } catch (error) {
        console.warn('Erro ao carregar logs de acesso:', error)
        // Fallback para dados mock se a API falhar
        const mockAccessLog = [
          {
            id: 1,
            user: 'Zeca',
            type: 'developer',
            ip: 'localhost',
            time: new Date(Date.now() - 300000).toLocaleTimeString('pt-BR'),
            action: 'Acesso ao Sistema'
          }
        ]
        setAccessLog(mockAccessLog)
      }
    }

    loadAccessLogs()
    
    // Atualizar logs a cada 30 segundos
    const logInterval = setInterval(loadAccessLogs, 30000)

    return () => {
      clearInterval(timeInterval)
      clearInterval(logInterval)
    }
  }, [])

  const getTypeIcon = (type) => {
    switch (type) {
      case 'developer':
        return <CodeBracketIcon className="h-4 w-4 text-purple-500" />
      case 'network':
        return <UsersIcon className="h-4 w-4 text-green-500" />
      default:
        return <ComputerDesktopIcon className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <EyeIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Monitor de Acesso
          </h3>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <ClockIcon className="h-4 w-4" />
          <span className="font-mono">{currentTime}</span>
        </div>
      </div>

      {/* Usuário Atual */}
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getTypeIcon(userInfo?.type || 'unknown')}
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {userInfo?.name || 'Carregando...'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {userInfo?.role || 'Carregando...'} • {userInfo?.ip || 'N/A'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {userInfo ? 'ATIVO' : 'CARREGANDO'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {userInfo?.accessTime || '--:--'}
            </p>
          </div>
        </div>
      </div>

      {/* Log de Acessos Recentes */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Acessos Recentes
        </h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {accessLog.map((access) => (
            <div key={access.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center space-x-2">
                {getTypeIcon(access.type)}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {access.user}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {access.ip} • {access.action}
                  </p>
                </div>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                {access.time}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Estatísticas */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              1
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Desenvolvedor
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              1
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Usuário Rede
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}