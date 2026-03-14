import React from 'react'
import { usePermissions } from '../../hooks/usePermissions'
import { 
  CheckCircleIcon, 
  XCircleIcon,
  LockClosedIcon,
  InformationCircleIcon
} from './Icons'

/**
 * Componente para exibir as permissões do usuário atual
 */
export default function PermissionsBadge({ className = '', compact = false }) {
  const permissions = usePermissions()

  if (compact) {
    return (
      <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg border ${
        permissions.isDeveloper
          ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300'
          : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300'
      } ${className}`}>
        {permissions.isDeveloper ? (
          <>
            <CheckCircleIcon className="h-4 w-4" />
            <span className="text-xs font-medium">Acesso Total</span>
          </>
        ) : (
          <>
            <LockClosedIcon className="h-4 w-4" />
            <span className="text-xs font-medium">Acesso Limitado</span>
          </>
        )}
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Permissões do Usuário
        </h3>
        {permissions.isDeveloper ? (
          <span className="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg">
            Desenvolvedor
          </span>
        ) : (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-lg">
            Usuário da Rede
          </span>
        )}
      </div>

      <div className="space-y-2">
        {/* Permissões Básicas */}
        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center space-x-2">
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
            <span>Criar / Incluir</span>
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">✓ Permitido</span>
        </div>

        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center space-x-2">
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
            <span>Ler / Visualizar</span>
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">✓ Permitido</span>
        </div>

        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center space-x-2">
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
            <span>Alterar / Editar</span>
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">✓ Permitido</span>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

        {/* Permissões Restritas */}
        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center space-x-2">
            {permissions.canDelete ? (
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
            ) : (
              <XCircleIcon className="h-4 w-4 text-red-500" />
            )}
            <span>Excluir</span>
          </span>
          {permissions.canDelete ? (
            <span className="text-xs text-gray-500 dark:text-gray-400">✓ Permitido</span>
          ) : (
            <span className="text-xs text-red-500 dark:text-red-400">✗ Restrito</span>
          )}
        </div>

        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center space-x-2">
            {permissions.canBackup ? (
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
            ) : (
              <XCircleIcon className="h-4 w-4 text-red-500" />
            )}
            <span>Backup / Restaurar</span>
          </span>
          {permissions.canBackup ? (
            <span className="text-xs text-gray-500 dark:text-gray-400">✓ Permitido</span>
          ) : (
            <span className="text-xs text-red-500 dark:text-red-400">✗ Restrito</span>
          )}
        </div>

        {!permissions.isDeveloper && (
          <div className="mt-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-2">
            <div className="flex items-start space-x-2">
              <InformationCircleIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                Você está acessando via <strong>rede</strong>. Apenas ações de <strong>criação e edição</strong> estão permitidas.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

