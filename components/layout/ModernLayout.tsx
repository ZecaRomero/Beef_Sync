
import React, { useEffect, useState } from 'react'

import ModernSidebar from './ModernSidebar'
import ModernHeader from './ModernHeader'
import TabBar from './TabBar'
import ContabilidadeLembretes from '../ContabilidadeLembretes'
import { TabsProvider } from '../../contexts/TabsContext'
import { cn } from '../../lib/utils'
import { LayoutProps } from '../../types/components'

const ModernLayout: React.FC<LayoutProps> = ({ children, darkMode, toggleDarkMode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleClickOutside = () => {
      if (sidebarOpen && window.innerWidth < 1280) {
        setSidebarOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [sidebarOpen])

  // Handle window resize
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      if (window.innerWidth >= 1280) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <ModernSidebar 
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 xl:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className={cn(
        'flex-1 flex flex-col transition-all duration-300',
        sidebarCollapsed ? 'xl:ml-16' : 'xl:ml-64'
      )}>
        <TabsProvider>
          <ModernHeader 
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
            onMenuClick={() => setSidebarOpen(true)}
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
          <TabBar />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900">
            <div className="container py-6">
              {children}
            </div>
          </main>
        </TabsProvider>
      </div>

      {/* Sistema de Lembretes da Contabilidade */}
      <ContabilidadeLembretes />
    </div>
  )
}

export default ModernLayout