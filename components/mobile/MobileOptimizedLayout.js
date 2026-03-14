
import React, { useEffect, useState } from 'react'

import { 
  Bars3Icon, 
  XMarkIcon,
  MagnifyingGlassIcon,
  BellIcon,
  UserIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'

export default function MobileOptimizedLayout({ children, title = "Beef-Sync" }) {
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (!isMobile) {
    return children
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Menu Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          {/* Title */}
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {title}
          </h1>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              <BellIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex flex-col w-64 h-full bg-white dark:bg-gray-800 shadow-xl">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Menu
              </h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-2">
              <MobileNavItem href="/dashboard" icon="📊" label="Dashboard" />
              <MobileNavItem href="/animals" icon="🐄" label="Animais" />
              <MobileNavItem href="/births" icon="👶" label="Nascimentos" />
              <MobileNavItem href="/semen" icon="🧬" label="Estoque Sêmen" />
              <MobileNavItem href="/costs" icon="💰" label="Custos" />
              <MobileNavItem href="/notas-fiscais" icon="📄" label="Notas Fiscais" />
              <MobileNavItem href="/reports" icon="📈" label="Relatórios" />
              <MobileNavItem href="/settings" icon="⚙️" label="Configurações" />
            </nav>

            {/* User Info */}
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                  <UserIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Usuário
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Fazenda Local
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Search */}
      {searchOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setSearchOpen(false)} />
          <div className="relative bg-white dark:bg-gray-800 mx-4 mt-20 rounded-lg shadow-xl">
            <div className="p-4">
              <div className="flex items-center space-x-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar animais, nascimentos, custos..."
                  className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={() => setSearchOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="pb-20">
        {children}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-30">
        <div className="grid grid-cols-5 h-16">
          <MobileBottomNavItem href="/dashboard" icon="📊" label="Home" />
          <MobileBottomNavItem href="/animals" icon="🐄" label="Animais" />
          <MobileBottomNavItem href="/births" icon="👶" label="Nascimentos" />
          <MobileBottomNavItem href="/costs" icon="💰" label="Custos" />
          <MobileBottomNavItem href="/reports" icon="📈" label="Relatórios" />
        </div>
      </div>
    </div>
  )
}

function MobileNavItem({ href, icon, label }) {
  return (
    <a
      href={href}
      className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
    >
      <span className="text-lg">{icon}</span>
      <span className="font-medium">{label}</span>
    </a>
  )
}

function MobileBottomNavItem({ href, icon, label }) {
  return (
    <a
      href={href}
      className="flex flex-col items-center justify-center space-y-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
    >
      <span className="text-lg">{icon}</span>
      <span className="text-xs font-medium">{label}</span>
    </a>
  )
}
