/**
 * Matriz de permissões alinhada a hooks/usePermissions (role desenvolvedor vs demais).
 */

export const PERMISSION_ROWS = [
  { key: 'canCreate', label: 'Criar', adminOnly: false },
  { key: 'canRead', label: 'Ler', adminOnly: false },
  { key: 'canUpdate', label: 'Editar', adminOnly: false },
  { key: 'canExport', label: 'Exportar', adminOnly: false },
  { key: 'canDelete', label: 'Excluir', adminOnly: true },
  { key: 'canBackup', label: 'Backup', adminOnly: true },
  { key: 'canRestore', label: 'Restaurar', adminOnly: true },
  { key: 'canManageLocations', label: 'Locais', adminOnly: true },
  { key: 'canManageUsers', label: 'Usuários (tela)', adminOnly: true },
  { key: 'canImport', label: 'Importar', adminOnly: true },
]

export function isDeveloperRole(role) {
  if (!role) return false
  const r = String(role).toLowerCase().trim()
  return r === 'desenvolvedor' || r === 'developer' || r === 'dev'
}

/** Mesmas flags que usePermissions retorna para isDeveloper */
export function permissionFlagsForRole(role) {
  const isDev = isDeveloperRole(role)
  return {
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: isDev,
    canBackup: isDev,
    canRestore: isDev,
    canManageLocations: isDev,
    canManageUsers: isDev,
    canExport: true,
    canImport: isDev,
  }
}

export function roleLabel(role) {
  return isDeveloperRole(role) ? 'Desenvolvedor' : 'Externo'
}
