import { ReactNode, useEffect, useState } from 'react'

import ModernSidebar from './layout/ModernSidebar'
import ModernHeader from './layout/ModernHeader'
import KeyboardShortcuts from './KeyboardShortcuts'
import NetworkSyncButton from './NetworkSyncButton'

interface LayoutProps {
  children: ReactNode
  darkMode: boolean
  toggleDarkMode: () => void
}

export default function Layout({ children, darkMode, toggleDarkMode }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)

  // Carregar utilitários de sincronização e sêmen
  useEffect(() => {
    import('../utils/networkSync.js').catch(console.warn)
    import('../utils/semenIntegration.js').catch(console.warn)
  }, [])

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <ModernSidebar 
        isOpen={sidebarOpen} 
        isCollapsed={false}
        onToggleCollapse={() => {}}
        onClose={() => setSidebarOpen(false)} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <ModernHeader 
          darkMode={darkMode} 
          toggleDarkMode={toggleDarkMode}
          onMenuClick={() => setSidebarOpen(true)}
          sidebarCollapsed={false}
          onToggleSidebar={() => {}}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
          {children}
        </main>
      </div>
      
      {/* Busca global */}
      {/* <GlobalSearch /> */}
      
      {/* Botão de sincronização de rede */}
      <NetworkSyncButton />
      
      {/* Atalhos de teclado globais */}
      <KeyboardShortcuts />
    </div>
  )
}