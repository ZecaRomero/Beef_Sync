
import React, { useState } from 'react'

import { 
  Cog6ToothIcon,
  SwatchIcon,
  AdjustmentsHorizontalIcon,
  BoltIcon,
  DevicePhoneMobileIcon,
  InformationCircleIcon
} from '../components/ui/Icons'
import dynamic from 'next/dynamic'
import MobileOptimizedLayout from '../components/mobile/MobileOptimizedLayout'

// ImportaÃ§Ãµes dinÃ¢micas para evitar erros de hidrataÃ§Ã£o
const AccessibilityEnhancements = dynamic(
  () => import('../components/accessibility/AccessibilityEnhancements'),
  { ssr: false }
)
const DarkModeEnhancements = dynamic(
  () => import('../components/theme/DarkModeEnhancements'),
  { ssr: false }
)
const PerformanceOptimizations = dynamic(
  () => import('../components/performance/PerformanceOptimizations'),
  { ssr: false }
)

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general')

  const tabs = [
    { id: 'general', name: 'Geral', icon: Cog6ToothIcon },
    { id: 'theme', name: 'Tema', icon: SwatchIcon },
    { id: 'accessibility', name: 'Acessibilidade', icon: AdjustmentsHorizontalIcon },
    { id: 'performance', name: 'Performance', icon: BoltIcon },
    { id: 'mobile', name: 'Mobile', icon: DevicePhoneMobileIcon }
  ]

  const renderTabContent = () => {
    try {
      switch (activeTab) {
        case 'general':
          return <GeneralSettings />
        case 'theme':
          return <DarkModeEnhancements />
        case 'accessibility':
          return <AccessibilityEnhancements />
        case 'performance':
          return <PerformanceOptimizations />
        case 'mobile':
          return <MobileSettings />
        default:
          return <GeneralSettings />
      }
    } catch (error) {
      console.error('Erro ao renderizar aba:', error)
      return (
        <div className="p-6 text-center">
          <p className="text-red-600 dark:text-red-400">
            Erro ao carregar configuraÃ§Ãµes. Por favor, recarregue a pÃ¡gina.
          </p>
        </div>
      )
    }
  }

  return (
    <MobileOptimizedLayout title="ConfiguraÃ§Ãµes">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            âÅ¡â„¢ï¸� ConfiguraÃ§Ãµes do Sistema
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Personalize e otimize sua experiÃªncia com o Beef Sync
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {Icon && <Icon className="h-5 w-5" />}
                      <span>{tab.name}</span>
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {renderTabContent()}
        </div>
      </div>
    </MobileOptimizedLayout>
  )
}

function GeneralSettings() {
  const [settings, setSettings] = useState({
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    dateFormat: 'DD/MM/YYYY',
    currency: 'BRL',
    notifications: true,
    autoSave: true,
    backupFrequency: 'daily'
  })

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    localStorage.setItem('beefsync_general_settings', JSON.stringify(newSettings))
  }

  return (
    <div className="p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Cog6ToothIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          ConfiguraÃ§Ãµes Gerais
        </h2>
      </div>

      <div className="space-y-6">
        {/* Idioma */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Idioma
          </label>
          <select
            value={settings.language}
            onChange={(e) => handleSettingChange('language', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="pt-BR">PortuguÃªs (Brasil)</option>
            <option value="en-US">English (US)</option>
            <option value="es-ES">EspaÃ±ol</option>
          </select>
        </div>

        {/* Fuso HorÃ¡rio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Fuso HorÃ¡rio
          </label>
          <select
            value={settings.timezone}
            onChange={(e) => handleSettingChange('timezone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="America/Sao_Paulo">BrasÃ­lia (GMT-3)</option>
            <option value="America/New_York">Nova York (GMT-5)</option>
            <option value="Europe/London">Londres (GMT+0)</option>
            <option value="Asia/Tokyo">TÃ³quio (GMT+9)</option>
          </select>
        </div>

        {/* Formato de Data */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Formato de Data
          </label>
          <select
            value={settings.dateFormat}
            onChange={(e) => handleSettingChange('dateFormat', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="DD/MM/YYYY">DD/MM/AAAA</option>
            <option value="MM/DD/YYYY">MM/DD/AAAA</option>
            <option value="YYYY-MM-DD">AAAA-MM-DD</option>
          </select>
        </div>

        {/* Moeda */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Moeda
          </label>
          <select
            value={settings.currency}
            onChange={(e) => handleSettingChange('currency', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="BRL">Real Brasileiro (R$)</option>
            <option value="USD">DÃ³lar Americano ($)</option>
            <option value="EUR">Euro (ââ€š¬)</option>
          </select>
        </div>

        {/* NotificaÃ§Ãµes */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">NotificaÃ§Ãµes</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Receber notificaÃ§Ãµes do sistema
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.notifications}
              onChange={(e) => handleSettingChange('notifications', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Auto Save */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">Salvamento AutomÃ¡tico</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Salvar alteraÃ§Ãµes automaticamente
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoSave}
              onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* FrequÃªncia de Backup */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            FrequÃªncia de Backup
          </label>
          <select
            value={settings.backupFrequency}
            onChange={(e) => handleSettingChange('backupFrequency', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="hourly">A cada hora</option>
            <option value="daily">Diariamente</option>
            <option value="weekly">Semanalmente</option>
            <option value="monthly">Mensalmente</option>
          </select>
        </div>
      </div>
    </div>
  )
}

function MobileSettings() {
  const [mobileSettings, setMobileSettings] = useState({
    compactMode: false,
    swipeGestures: true,
    hapticFeedback: true,
    offlineMode: false,
    syncOnWifi: true
  })

  const handleMobileSettingChange = (key, value) => {
    const newSettings = { ...mobileSettings, [key]: value }
    setMobileSettings(newSettings)
    localStorage.setItem('beefsync_mobile_settings', JSON.stringify(newSettings))
  }

  return (
    <div className="p-6">
      <div className="flex items-center space-x-2 mb-6">
        <DevicePhoneMobileIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          ConfiguraÃ§Ãµes Mobile
        </h2>
      </div>

      <div className="space-y-6">
        {/* Modo Compacto */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">Modo Compacto</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Interface mais compacta para telas pequenas
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={mobileSettings.compactMode}
              onChange={(e) => handleMobileSettingChange('compactMode', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Gestos de Swipe */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">Gestos de Swipe</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Habilitar navegaÃ§Ã£o por gestos
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={mobileSettings.swipeGestures}
              onChange={(e) => handleMobileSettingChange('swipeGestures', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Feedback HÃ¡ptico */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">Feedback HÃ¡ptico</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              VibraÃ§Ã£o ao tocar em elementos
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={mobileSettings.hapticFeedback}
              onChange={(e) => handleMobileSettingChange('hapticFeedback', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Modo Offline */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">Modo Offline</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Funcionar sem conexÃ£o com internet
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={mobileSettings.offlineMode}
              onChange={(e) => handleMobileSettingChange('offlineMode', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Sincronizar apenas no WiFi */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">Sincronizar apenas no WiFi</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Evitar uso de dados mÃ³veis
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={mobileSettings.syncOnWifi}
              onChange={(e) => handleMobileSettingChange('syncOnWifi', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* InformaÃ§Ãµes */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="flex items-start space-x-2">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium">Dicas para Mobile:</p>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li>Use gestos de swipe para navegaÃ§Ã£o rÃ¡pida</li>
              <li>O modo offline permite trabalhar sem internet</li>
              <li>O feedback hÃ¡ptico melhora a experiÃªncia tÃ¡til</li>
              <li>Configure sincronizaÃ§Ã£o apenas no WiFi para economizar dados</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}