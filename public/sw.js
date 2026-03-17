// Service Worker para Beef Sync PWA
const CACHE_NAME = 'beef-sync-v3.1.0'
const OFFLINE_URL = '/offline.html'

// Arquivos para cache
const CACHE_FILES = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/beef-sync-icon.svg',
  '/_next/static/css/',
  '/_next/static/js/',
  '/_next/static/media/'
]

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker instalando...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Cache aberto')
        return cache.addAll(CACHE_FILES)
      })
      .then(() => {
        console.log('✅ Service Worker instalado')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('❌ Erro na instalação do Service Worker:', error)
      })
  )
})

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker ativando...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Removendo cache antigo:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('✅ Service Worker ativado')
        return self.clients.claim()
      })
  )
})

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  // Ignorar requisições que não são GET
  if (event.request.method !== 'GET') {
    return
  }

  // Ignorar requisições de API
  if (event.request.url.includes('/api/')) {
    return
  }

  // Para páginas/documentos, usar network-first para evitar tela antiga após deploy
  if (event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache))
          }
          return response
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match(OFFLINE_URL)))
    )
    return
  }

  // Para assets do Next.js, usar network-first (hashes mudam a cada build)
  if (event.request.url.includes('/_next/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache))
          }
          return response
        })
        .catch(() => caches.match(event.request).then((cached) => cached || new Response('', { status: 503 })))
    )
    return
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response
        }

        return fetch(event.request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }

            const responseToCache = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache))

            return response
          })
          .catch(() => {
            if (event.request.destination === 'document') {
              return caches.match(OFFLINE_URL)
            }
            return new Response('', { status: 503, statusText: 'Service Unavailable' })
          })
      })
  )
})

// Sincronização em background
self.addEventListener('sync', (event) => {
  console.log('🔄 Sincronização em background:', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      syncOfflineData()
    )
  }
})

// Função de sincronização offline
async function syncOfflineData() {
  try {
    console.log('📱 Sincronizando dados offline...')
    
    // Obter dados offline do IndexedDB
    const offlineData = await getOfflineData()
    
    if (offlineData.length === 0) {
      console.log('📦 Nenhum dado offline para sincronizar')
      return
    }

    // Sincronizar cada item
    for (const item of offlineData) {
      try {
        await syncItem(item)
        await removeOfflineData(item.id)
        console.log(`✅ Item sincronizado: ${item.id}`)
      } catch (error) {
        console.error(`❌ Erro ao sincronizar item ${item.id}:`, error)
      }
    }

    console.log('✅ Sincronização offline concluída')
  } catch (error) {
    console.error('❌ Erro na sincronização offline:', error)
  }
}

// Sincronizar item individual
async function syncItem(item) {
  const response = await fetch('/api/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(item)
  })

  if (!response.ok) {
    throw new Error(`Erro na sincronização: ${response.status}`)
  }

  return response.json()
}

// Obter dados offline do IndexedDB
async function getOfflineData() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('beef-sync-offline', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction(['offline-data'], 'readonly')
      const store = transaction.objectStore('offline-data')
      const getAllRequest = store.getAll()
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result)
      getAllRequest.onerror = () => reject(getAllRequest.error)
    }
  })
}

// Remover dados offline do IndexedDB
async function removeOfflineData(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('beef-sync-offline', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction(['offline-data'], 'readwrite')
      const store = transaction.objectStore('offline-data')
      const deleteRequest = store.delete(id)
      
      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => reject(deleteRequest.error)
    }
  })
}

// Notificações push
self.addEventListener('push', (event) => {
  console.log('📨 Push recebido:', event.data)
  
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação do Beef Sync',
    icon: '/beef-sync-icon.svg',
    badge: '/beef-sync-icon.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver Detalhes',
        icon: '/beef-sync-icon.svg'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/beef-sync-icon.svg'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('Beef Sync', options)
  )
})

// Clique em notificação
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notificação clicada:', event.action)
  
  event.notification.close()

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Mensagens do cliente
self.addEventListener('message', (event) => {
  console.log('💬 Mensagem recebida:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME })
  }
})

// Erro no Service Worker
self.addEventListener('error', (event) => {
  console.error('❌ Erro no Service Worker:', event.error)
})

// Rejeição não tratada
self.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Rejeição não tratada no Service Worker:', event.reason)
})
