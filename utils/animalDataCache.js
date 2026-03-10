// Cache simples para dados de animais
// Evita requisições duplicadas durante a navegação

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos
const cache = new Map()

export const animalDataCache = {
  get(animalId) {
    const cached = cache.get(animalId)
    if (!cached) return null
    
    const now = Date.now()
    if (now - cached.timestamp > CACHE_DURATION) {
      cache.delete(animalId)
      return null
    }
    
    return cached.data
  },
  
  set(animalId, data) {
    cache.set(animalId, {
      data,
      timestamp: Date.now()
    })
  },
  
  invalidate(animalId) {
    if (animalId) {
      cache.delete(animalId)
    } else {
      cache.clear()
    }
  },
  
  clear() {
    cache.clear()
  }
}

// Limpar cache quando houver mudanças
if (typeof window !== 'undefined') {
  window.addEventListener('animalUpdated', (e) => {
    if (e.detail?.animalId) {
      animalDataCache.invalidate(e.detail.animalId)
    }
  })
  
  window.addEventListener('animalDeleted', (e) => {
    if (e.detail?.animalId) {
      animalDataCache.invalidate(e.detail.animalId)
    }
  })
}
