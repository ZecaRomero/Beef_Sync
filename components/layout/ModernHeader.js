
import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { 
  Bars3Icon,
  MagnifyingGlassIcon,
  BellIcon,
  DevicePhoneMobileIcon,
  SunIcon,
  MoonIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
  CogIcon,
  EyeIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { cn } from '../../lib/utils'
import Button from '../ui/Button'
import Input from '../ui/Input'
import SystemInfo from '../ui/SystemInfo'
import ConnectionStatus from '../system/ConnectionStatus'
import useNotifications from '../../hooks/useNotifications'
import { useAuth } from '../../contexts/AuthContext'

export default function ModernHeader({ 
  darkMode, 
  toggleDarkMode, 
  onMenuClick,
  sidebarCollapsed,
  onToggleSidebar 
}) {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const buttonRef = useRef(null)
  const searchRef = useRef(null)
  const userMenuRef = useRef(null)
  
  const {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications()

  // Calcular posição do dropdown quando abrir
  useEffect(() => {
    if (showNotifications && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      })
    }
  }, [showNotifications])

  // Buscar animais quando o termo de busca mudar
  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch(searchQuery)
      setShowSearchResults(true)
    } else {
      setSearchResults([])
      setShowSearchResults(false)
    }
  }, [searchQuery])

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false)
        setIsSearchFocused(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const performSearch = async (query) => {
    try {
      // Primeiro tentar buscar na API
      try {
        const response = await fetch('/api/animals')
        if (response.ok) {
          const result = await response.json()
          // A API retorna { success: true, data: [...], message: "..." }
          const animals = result.success ? result.data : []
          
          if (Array.isArray(animals)) {
            const filteredAnimals = animals.filter(animal => 
              `${animal.serie}${animal.rg}`.toLowerCase().includes(query.toLowerCase()) ||
              animal.raca?.toLowerCase().includes(query.toLowerCase()) ||
              animal.situacao?.toLowerCase().includes(query.toLowerCase())
            ).slice(0, 5) // Máximo 5 resultados

            setSearchResults(filteredAnimals.map(animal => ({
              type: 'animal',
              title: `${animal.serie} ${animal.rg}`,
              description: `${animal.raca} - ${animal.situacao}`,
              animal: animal
            })))
            return
          }
        }
      } catch (apiError) {
        console.error('Erro ao buscar na API:', apiError)
      }

      // Fallback para localStorage
      const storedAnimals = localStorage.getItem('animals')
      if (storedAnimals) {
        const animals = JSON.parse(storedAnimals)
        const filteredAnimals = animals.filter(animal => 
          `${animal.serie}${animal.rg}`.toLowerCase().includes(query.toLowerCase()) ||
          animal.raca?.toLowerCase().includes(query.toLowerCase()) ||
          animal.situacao?.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5)

        setSearchResults(filteredAnimals.map(animal => ({
          type: 'animal',
          title: `${animal.serie} ${animal.rg}`,
          description: `${animal.raca} - ${animal.situacao}`,
          animal: animal
        })))
      }
    } catch (error) {
      console.error('Erro na busca:', error)
      setSearchResults([])
    }
  }

  const handleSearchSelect = (result) => {
    if (result.type === 'animal') {
      router.push(`/animals/${result.animal.id}`)
    }
    setSearchQuery('')
    setShowSearchResults(false)
    setIsSearchFocused(false)
  }

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (_) {}
    router.push('/login')
  }

  const UserInfo = () => {
    const userName = user?.user_metadata?.nome || user?.email?.split('@')[0] || 'Usuário'
    const userEmail = user?.email || ''

    return (
      <>
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {userName}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {userEmail}
        </p>
      </>
    )
  }

  const getPageTitle = () => {
    const path = router.pathname
    const titles = {
      '/dashboard': 'Dashboard',
      '/animals': 'Animais',
      '/nascimentos': 'Nascimentos',
      '/gestacao': 'Gestação',
      '/ocorrencias': 'Ocorrências',
      '/estoque-semen': 'Estoque de Sêmen',
      '/nitrogenio': 'Nitrogênio',
      '/notas-fiscais': 'Notas Fiscais',
      '/contabilidade': 'Contabilidade',
      '/custos': 'Custos',
      '/reports': 'Relatórios',
      '/protocol-editor': 'Protocolos',
      '/settings': 'Configurações',
      '/admin/feedbacks': 'Feedbacks',
      '/notas-fiscais/relatorio': 'Relatório de Vendas'
    }
    return titles[path] || 'Beef-Sync'
  }

  return (
    <header className={cn(
      'sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-gray-700',
      'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-sm',
      'px-4 sm:gap-x-6 sm:px-6 lg:px-8'
    )}>
      {/* Mobile menu button */}
      <button
        type="button"
        className={cn(
          'p-2.5 text-gray-700 dark:text-gray-200 xl:hidden',
          'hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200'
        )}
        onClick={onMenuClick}
      >
        <Bars3Icon className="h-6 w-6" />
      </button>

      {/* Desktop sidebar toggle */}
      <button
        type="button"
        className={cn(
          'hidden xl:flex p-2 text-gray-500 dark:text-gray-400',
          'hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200'
        )}
        onClick={onToggleSidebar}
      >
        <Bars3Icon className="h-5 w-5" />
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
          {getPageTitle()}
        </h1>
      </div>

      {/* Search */}
      <div className="relative flex-1 max-w-md hidden sm:block" ref={searchRef}>
        <div className="relative">
          <MagnifyingGlassIcon className={cn(
            'pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400 pl-3',
            isSearchFocused && 'text-blue-500'
          )} />
          <input
            type="text"
            placeholder="Buscar animais..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            className={cn(
              'block w-full rounded-xl border-0 py-2 pl-10 pr-3 text-gray-900 dark:text-white',
              'ring-1 ring-inset ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-blue-500',
              'bg-gray-50 dark:bg-gray-800/50 text-sm transition-all duration-200',
              isSearchFocused && 'bg-white dark:bg-gray-800 shadow-md ring-blue-500'
            )}
          />
        </div>

        {/* Search Results Dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <div className={cn(
            'absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800',
            'border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50',
            'max-h-80 overflow-y-auto'
          )}>
            {searchResults.map((result, index) => (
              <button
                key={index}
                onClick={() => handleSearchSelect(result)}
                className={cn(
                  'w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700',
                  'transition-colors duration-150 border-b border-gray-100 dark:border-gray-700 last:border-b-0',
                  'focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20'
                )}
              >
                <div className="font-medium text-gray-900 dark:text-white text-sm">
                  {result.title}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {result.description}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex sm:hidden">
        <button className="p-2 text-gray-500 dark:text-gray-400" onClick={() => router.push('/animals')}>
          <MagnifyingGlassIcon className="h-5 w-5" />
        </button>
      </div>

      {/* System Info */}
      <SystemInfo className="hidden lg:flex" />
      
      {/* Connection Status */}
      <ConnectionStatus className="hidden md:flex" />

      {/* Right side actions */}
      <div className="flex items-center gap-x-2">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/a?buscar=1')}
          className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          title="Modo mobile"
        >
          <DevicePhoneMobileIcon className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={toggleDarkMode}
          className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          {darkMode ? (
            <SunIcon className="h-5 w-5" />
          ) : (
            <MoonIcon className="h-5 w-5" />
          )}
        </Button>

        {/* Notifications */}
        <div className="relative">
          <Button
            ref={buttonRef}
            variant="ghost"
            size="sm"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <BellIcon className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className={cn(
                'absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white',
                'text-xs font-medium flex items-center justify-center',
                'animate-pulse'
              )}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div 
              className={cn(
                'absolute mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl',
                'border border-gray-200 dark:border-gray-700 z-50'
              )}
              style={{ 
                top: dropdownPosition.top, 
                right: dropdownPosition.right 
              }}
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Notificações
                  </h3>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Marcar todas como lidas
                    </Button>
                  )}
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    Carregando...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    Nenhuma notificação
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        'p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0',
                        'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                        !(notification.lida ?? notification.read) && 'bg-blue-50 dark:bg-blue-900/10'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'flex-shrink-0 w-2 h-2 rounded-full mt-2',
                          (notification.lida ?? notification.read) ? 'bg-gray-300' : 'bg-blue-500'
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {notification.titulo ?? notification.title}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {notification.mensagem ?? notification.message}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                            {notification.timestamp ?? (notification.created_at || notification.createdAt ? new Date(notification.created_at || notification.createdAt).toLocaleString('pt-BR') : '')}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                markAsRead(notification.id)
                                if (notification.tipo === 'feedback') {
                                  router.push('/admin/feedbacks')
                                  setShowNotifications(false)
                                }
                              }}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1"
                            >
                              <EyeIcon className="h-3.5 w-3.5" />
                              Ler
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (confirm('Excluir esta notificação?')) {
                                  deleteNotification(notification.id)
                                }
                              }}
                              className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium flex items-center gap-1"
                            >
                              <TrashIcon className="h-3.5 w-3.5" />
                              Excluir
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={userMenuRef}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <UserCircleIcon className="h-6 w-6" />
            <ChevronDownIcon className={cn(
              'h-4 w-4 transition-transform duration-200',
              showUserMenu && 'rotate-180'
            )} />
          </Button>

          {/* User Dropdown */}
          {showUserMenu && (
            <div className={cn(
              'absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl',
              'border border-gray-200 dark:border-gray-700 z-50'
            )}>
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <UserInfo />
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    router.push('/profile')
                    setShowUserMenu(false)
                  }}
                  className={cn(
                    'flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300',
                    'hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
                  )}
                >
                  <UserIcon className="h-4 w-4 mr-3" />
                  Perfil
                </button>

                <button
                  onClick={() => {
                    router.push('/settings')
                    setShowUserMenu(false)
                  }}
                  className={cn(
                    'flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300',
                    'hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
                  )}
                >
                  <CogIcon className="h-4 w-4 mr-3" />
                  Configurações
                </button>

                <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

                <button
                  onClick={handleLogout}
                  className={cn(
                    'flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400',
                    'hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors'
                  )}
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}