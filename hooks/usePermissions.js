import { useMemo } from 'react'
import { useUserIdentification } from './useUserIdentification'

/**
 * Hook para gerenciar permissões baseadas no perfil do Supabase Auth.
 * O role vem de user_metadata.role ("desenvolvedor" ou "externo").
 */
export function usePermissions() {
  const userInfo = useUserIdentification()

  const permissions = useMemo(() => {
    // Handle null userInfo during initial load
    if (!userInfo) {
      return {
        canCreate: false,
        canRead: false,
        canUpdate: false,
        canDelete: false,
        canBackup: false,
        canRestore: false,
        canManageLocations: false,
        canManageUsers: false,
        canExport: false,
        canImport: false,
        userType: 'loading',
        userName: 'Carregando...',
        isDeveloper: false,
        isNetworkUser: false,
        getPermissionMessage: () => 'Carregando permissões...'
      }
    }

    const isDeveloper = userInfo.isDeveloper
    const isNetworkUser = userInfo.isNetworkUser

    return {
      // Permissões básicas
      canCreate: true, // Todos podem criar
      canRead: true,   // Todos podem ler
      canUpdate: true, // Todos podem atualizar
      
      // Permissões restritas
      canDelete: isDeveloper,        // Só desenvolvedor pode excluir
      canBackup: isDeveloper,        // Só desenvolvedor pode fazer backup
      canRestore: isDeveloper,       // Só desenvolvedor pode restaurar backup
      canManageLocations: isDeveloper, // Só desenvolvedor pode gerenciar locais
      canManageUsers: isDeveloper,   // Só desenvolvedor pode gerenciar usuários
      canExport: true,               // Todos podem exportar
      canImport: isDeveloper,        // Só desenvolvedor pode importar
      
      // Informações do usuário
      userType: userInfo.type,
      userName: userInfo.name,
      isDeveloper,
      isNetworkUser,
      
      // Mensagens
      getPermissionMessage: (action) => {
        if (!isDeveloper && (action === 'excluir' || action === 'backup' || action === 'restaurar')) {
          return 'Esta ação é permitida apenas para usuários com perfil Desenvolvedor.'
        }
        return null
      }
    }
  }, [userInfo])

  return permissions
}

export default usePermissions

