export interface SidebarProps {
  isOpen: boolean
  isCollapsed: boolean
  onToggleCollapse: () => void
  onClose: () => void
}

export interface HeaderProps {
  darkMode: boolean
  toggleDarkMode: () => void
  onMenuClick: () => void
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
}

export interface NavigationItem {
  name: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  children?: NavigationChild[]
}

export interface NavigationChild {
  name: string
  href: string
  description?: string
  danger?: boolean
  new?: boolean  // Badge "Novo" para itens recentes
}

export interface SearchResult {
  id: string
  title: string
  description: string
  href: string
  type: 'page' | 'animal' | 'report' | 'setting'
}

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  timestamp: Date
  action?: {
    label: string
    href: string
  }
}

export interface UserProfile {
  name: string
  email: string
  avatar?: string
  role: string
}