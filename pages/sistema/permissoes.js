import { useState, useEffect } from 'react'
import { usePermissions } from '../../hooks/usePermissions'
import { 
  UserGroupIcon, 
  CheckIcon, 
  XMarkIcon, 
  ExclamationTriangleIcon 
} from '../../components/ui/Icons'

export default function SistemaPermissoes() {
  const [mounted, setMounted] = useState(false)
  const permissions = usePermissions()
  const [systemInfo, setSystemInfo] = useState(null)

  useEffect(() => {
    setMounted(true)
    loadSystemInfo()
  }, [])

  const loadSystemInfo = async () => {
    try {
      const response = await fetch('/api/system-check')
      if (response.ok) {
        const data = await response.json()
        setSystemInfo(data)
      }
    } catch (error) {
      console.error('Erro ao carregar informações do sistema:', error)
    }
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  const permissionsList = [
    {
      name: 'Visualizar',
      key: 'canView',
      description: 'Visualizar dados do sistema',
      icon: '👁️',
      level: 'basic'
    },
    {
      name: 'Editar',
      key: 'canEdit',
      description: 'Editar registros existentes',
      icon: '✏️',
      level: 'intermediate'
    },
    {
      name: 'Excluir',
      key: 'canDelete',
      description: 'Excluir registros do sistema',
      icon: '🗑️',
      level: 'advanced'
    },
    {
      name: 'Backup',
      key: 'canBackup',
      description: 'Criar backups do sistema',
      icon: '💾',
      level: 'admin'
    },
    {
      name: 'Restaurar',
      key: 'canRestore',
      description: 'Restaurar backups do sistema',
      icon: '🔄',
      level: 'admin'
    },
    {
      name: 'Importar',
      key: 'canImport',
      description: 'Importar dados externos',
      icon: '📥',
      level: 'admin'
    }
  ]

  const getLevelColor = (level) => {
    switch (level) {
      case 'basic':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'intermediate':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'advanced':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getLevelName = (level) => {
    switch (level) {
      case 'basic':
        return 'Básico'
      case 'intermediate':
        return 'Intermediário'
      case 'advanced':
        return 'Avançado'
      case 'admin':
        return 'Administrador'
      default:
        return 'Desconhecido'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="text-2xl mr-3">🛡️</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sistema de Permissões</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Controle de acesso e segurança</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status do Usuário Atual */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <div className="flex items-center mb-4">
            <UserGroupIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Status do Usuário Atual</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Tipo de Acesso</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  permissions?.isDeveloper ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                  permissions?.isNetworkUser ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}>
                  {permissions?.isDeveloper ? 'Desenvolvedor' :
                   permissions?.isNetworkUser ? 'Usuário de Rede' : 'Usuário Local'}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">IP de Acesso</span>
                <span className="text-sm text-gray-900 dark:text-white font-mono">
                  {systemInfo?.network?.clientIP || 'Carregando...'}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Nível de Segurança</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  permissions?.isDeveloper ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}>
                  {permissions?.isDeveloper ? 'Alto' : 'Padrão'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Permissões */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="text-xl mr-2">🔑</div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Permissões do Sistema</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Suas permissões atuais no sistema
            </p>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {permissionsList.map((permission) => {
              const hasPermission = permissions?.[permission.key] || false
              
              return (
                <div key={permission.key} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="text-2xl mr-3">{permission.icon}</div>
                      <div>
                        <div className="flex items-center">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                            {permission.name}
                          </h3>
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(permission.level)}`}>
                            {getLevelName(permission.level)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {permission.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      {hasPermission ? (
                        <div className="flex items-center text-green-600 dark:text-green-400">
                          <CheckIcon className="h-5 w-5 mr-1" />
                          <span className="text-sm font-medium">Permitido</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-600 dark:text-red-400">
                          <XMarkIcon className="h-5 w-5 mr-1" />
                          <span className="text-sm font-medium">Negado</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Informações de Segurança */}
        <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                Informações de Segurança
              </h3>
              <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                <p>• As permissões são baseadas no tipo de acesso (local vs. rede)</p>
                <p>• Desenvolvedores têm acesso completo quando conectados localmente</p>
                <p>• Usuários de rede têm permissões limitadas por segurança</p>
                <p>• Algumas operações críticas requerem acesso local</p>
              </div>
            </div>
          </div>
        </div>

        {/* Informações do Sistema */}
        {systemInfo && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Informações do Sistema
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-300">Versão do Sistema:</span>
                <span className="ml-2 text-gray-900 dark:text-white">Beef-Sync v1.0</span>
              </div>
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-300">Status do Banco:</span>
                <span className={`ml-2 ${systemInfo.database?.connected ? 'text-green-600' : 'text-red-600'}`}>
                  {systemInfo.database?.connected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-300">Última Verificação:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {new Date().toLocaleString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}