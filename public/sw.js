// Service Worker para Beef Sync PWA
const CACHE_NAME = 'beef-sync-v3.0.0'
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
  console.log('ðÅ¸â€�§ Service Worker instalando...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('ðÅ¸â€œ¦ Cache aberto')
        return cache.addAll(CACHE_FILES)
      })
      .then(() => {
        console.log('âÅ“â€¦ Service Worker instalado')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('â�Å’ Erro na instalaÃ§Ã£o do Service Worker:', error)
      })
  )
})

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('ðÅ¸Å¡â‚¬ Service Worker ativando...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('ðÅ¸â€”â€˜ï¸� Removendo cache antigo:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('âÅ“â€¦ Service Worker ativado')
        return self.clients.claim()
      })
  )
})

// Interceptar requisiÃ§Ãµes
self.addEventListener('fetch', (event) => {
  // Ignorar requisiÃ§Ãµes que nÃ£o sÃ£o GET
  if (event.request.method !== 'GET') {
    return
  }

  // Ignorar requisiÃ§Ãµes de API
  if (event.request.url.includes('/api/')) {
    return
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retornar do cache se disponÃ­vel
        if (response) {
          return response
        }

        // Tentar buscar da rede
        return fetch(event.request)
          .then((response) => {
            // Verificar se a resposta Ã© vÃ¡lida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }

            // Clonar a resposta
            const responseToCache = response.clone()

            // Adicionar ao cache
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache)
              })

            return response
          })
          .catch(() => {
            // Se offline, retornar pÃ¡gina offline para navegaÃ§Ã£o
            if (event.request.destination === 'document') {
              return caches.match(OFFLINE_URL)
            }
            
            // Para outros recursos, retornar resposta vazia
            return new Response('', { status: 503, statusText: 'Service Unavailable' })
          })
      })
  )
})

// SincronizaÃ§Ã£o em background
self.addEventListener('sync', (event) => {
  console.log('ðÅ¸â€�â€ž SincronizaÃ§Ã£o em background:', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      syncOfflineData()
    )
  }
})

// FunÃ§Ã£o de sincronizaÃ§Ã£o offline
async function syncOfflineData() {
  try {
    console.log('ðÅ¸â€œ± Sincronizando dados offline...')
    
    // Obter dados offline do IndexedDB
    const offlineData = await getOfflineData()
    
    if (offlineData.length === 0) {
      console.log('ðÅ¸â€œ¦ Nenhum dado offline para sincronizar')
      return
    }

    // Sincronizar cada item
    for (const item of offlineData) {
      try {
        await syncItem(item)
        await removeOfflineData(item.id)
        console.log(`âÅ“â€¦ Item sincronizado: ${item.id}`)
      } catch (error) {
        console.error(`â�Å’ Erro ao sincronizar item ${item.id}:`, error)
      }
    }

    console.log('âÅ“â€¦ SincronizaÃ§Ã£o offline concluÃ­da')
  } catch (error) {
    console.error('â�Å’ Erro na sincronizaÃ§Ã£o offline:', error)
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
    throw new Error(`Erro na sincronizaÃ§Ã£o: ${response.status}`)
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

// NotificaÃ§Ãµes push
self.addEventListener('push', (event) => {
  console.log('ðÅ¸â€œ¨ Push recebido:', event.data)
  
  const options = {
    body: event.data ? event.data.text() : 'Nova notificaÃ§Ã£o do Beef Sync',
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

// Clique em notificaÃ§Ã£o
self.addEventListener('notificationclick', (event) => {
  console.log('ðÅ¸â€�â€� NotificaÃ§Ã£o clicada:', event.action)
  
  event.notification.close()

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Mensagens do cliente
self.addEventListener('message', (event) => {
  console.log('ðÅ¸â€™¬ Mensagem recebida:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME })
  }
})

// Erro no Service Worker
self.addEventListener('error', (event) => {
  console.error('â�Å’ Erro no Service Worker:', event.error)
})

// RejeiÃ§Ã£o nÃ£o tratada
self.addEventListener('unhandledrejection', (event) => {
  console.error('â�Å’ RejeiÃ§Ã£o nÃ£o tratada no Service Worker:', event.reason)
})
