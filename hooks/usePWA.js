

// Hook para gerenciar Progressive Web App (PWA)
import React, { useCallback, useEffect, useState } from 'react'

export default function usePWA() {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [isStandalone, setIsStandalone] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [registration, setRegistration] = useState(null)

  // Detectar se é PWA instalado
  useEffect(() => {
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                              window.navigator.standalone === true ||
                              document.referrer.includes('android-app://')
      setIsStandalone(isStandaloneMode)
    }

    checkStandalone()
    window.addEventListener('resize', checkStandalone)
    
    return () => window.removeEventListener('resize', checkStandalone)
  }, [])

  // Detectar status de conexão
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    updateOnlineStatus()
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  // Configurar Service Worker
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('✅ Service Worker registrado:', reg)
          setRegistration(reg)
          
          // Verificar atualizações
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true)
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('❌ Erro ao registrar Service Worker:', error)
        })
    } else if (process.env.NODE_ENV !== 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        if (regs.length) console.log('🔧 Dev: removendo Service Workers para evitar cache em desenvolvimento');
        regs.forEach((r) => r.unregister());
      });
    }
  }, [])

  // Detectar evento de instalação
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  // Detectar instalação concluída
  useEffect(() => {
    const handleAppInstalled = () => {
      console.log('✅ PWA instalado com sucesso')
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // Instalar PWA
  const installPWA = useCallback(async () => {
    if (!deferredPrompt) {
      console.log('❌ Prompt de instalação não disponível')
      return false
    }

    try {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('✅ Usuário aceitou a instalação')
        setIsInstallable(false)
        setDeferredPrompt(null)
        return true
      } else {
        console.log('❌ Usuário rejeitou a instalação')
        return false
      }
    } catch (error) {
      console.error('❌ Erro ao instalar PWA:', error)
      return false
    }
  }, [deferredPrompt])

  // Atualizar PWA
  const updatePWA = useCallback(async () => {
    if (!registration) {
      console.log('❌ Service Worker não registrado')
      return false
    }

    try {
      await registration.update()
      setUpdateAvailable(false)
      console.log('✅ PWA atualizado')
      return true
    } catch (error) {
      console.error('❌ Erro ao atualizar PWA:', error)
      return false
    }
  }, [registration])

  // Solicitar permissão para notificações
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('❌ Notificações não suportadas')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      console.log('❌ Notificações negadas pelo usuário')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    } catch (error) {
      console.error('❌ Erro ao solicitar permissão de notificação:', error)
      return false
    }
  }, [])

  // Enviar notificação
  const sendNotification = useCallback(async (title, options = {}) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      console.log('❌ Notificações não disponíveis')
      return false
    }

    try {
      const notification = new Notification(title, {
        icon: '/beef-sync-icon.svg',
        badge: '/beef-sync-icon.svg',
        ...options
      })

      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      return true
    } catch (error) {
      console.error('❌ Erro ao enviar notificação:', error)
      return false
    }
  }, [])

  // Sincronizar dados offline
  const syncOfflineData = useCallback(async () => {
    if (!registration) {
      console.log('❌ Service Worker não registrado')
      return false
    }

    try {
      await registration.sync.register('background-sync')
      console.log('✅ Sincronização offline iniciada')
      return true
    } catch (error) {
      console.error('❌ Erro na sincronização offline:', error)
      return false
    }
  }, [registration])

  // Obter informações do PWA
  const getPWAInfo = useCallback(() => {
    return {
      isInstalled,
      isInstallable,
      isOnline,
      isStandalone,
      updateAvailable,
      hasServiceWorker: !!registration,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: navigator.deviceMemory,
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
        saveData: navigator.connection.saveData
      } : null
    }
  }, [isInstalled, isInstallable, isOnline, isStandalone, updateAvailable, registration])

  // Verificar recursos suportados
  const getSupportedFeatures = useCallback(() => {
    return {
      serviceWorker: 'serviceWorker' in navigator,
      pushManager: 'PushManager' in window,
      notifications: 'Notification' in window,
      backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      indexedDB: 'indexedDB' in window,
      webShare: 'share' in navigator,
      webShareTarget: 'serviceWorker' in navigator,
      fileSystem: 'showOpenFilePicker' in window,
      clipboard: 'clipboard' in navigator,
      geolocation: 'geolocation' in navigator,
      camera: 'mediaDevices' in navigator,
      vibration: 'vibrate' in navigator,
      fullscreen: 'requestFullscreen' in document.documentElement,
      wakeLock: 'wakeLock' in navigator,
      paymentRequest: 'PaymentRequest' in window,
      webAuthn: 'credentials' in navigator,
      webBluetooth: 'bluetooth' in navigator,
      webUSB: 'usb' in navigator,
      webSerial: 'serial' in navigator
    }
  }, [])

  // Obter estatísticas de uso
  const getUsageStats = useCallback(() => {
    if (!registration) return null

    return {
      scope: registration.scope,
      state: registration.active?.state || 'unknown',
      scriptURL: registration.active?.scriptURL || 'unknown',
      lastUpdate: registration.lastUpdate,
      updateViaCache: registration.updateViaCache
    }
  }, [registration])

  // Limpar cache
  const clearCache = useCallback(async () => {
    if (!registration) {
      console.log('❌ Service Worker não registrado')
      return false
    }

    try {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      )
      console.log('✅ Cache limpo')
      return true
    } catch (error) {
      console.error('❌ Erro ao limpar cache:', error)
      return false
    }
  }, [registration])

  // Reiniciar Service Worker
  const restartServiceWorker = useCallback(async () => {
    if (!registration) {
      console.log('❌ Service Worker não registrado')
      return false
    }

    try {
      await registration.unregister()
      window.location.reload()
      return true
    } catch (error) {
      console.error('❌ Erro ao reiniciar Service Worker:', error)
      return false
    }
  }, [registration])

  return {
    // Estado
    isInstalled,
    isInstallable,
    isOnline,
    isStandalone,
    updateAvailable,
    registration,

    // Ações
    installPWA,
    updatePWA,
    requestNotificationPermission,
    sendNotification,
    syncOfflineData,
    clearCache,
    restartServiceWorker,

    // Informações
    getPWAInfo,
    getSupportedFeatures,
    getUsageStats,

    // Utilitários
    deferredPrompt
  }
}
