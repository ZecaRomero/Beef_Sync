// Sistema de cache inteligente para Beef Sync
import { query } from '../lib/database'

class SmartCacheService {
  constructor() {
    this.cache = new Map()
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      size: 0
    }
    this.maxSize = 1000 // Máximo 1000 itens no cache
    this.defaultTTL = 5 * 60 * 1000 // 5 minutos por padrão
    this.cleanupInterval = 60 * 1000 // Limpeza a cada minuto
    this.cleanupTimer = null
  }

  // Inicializar serviço de cache
  initialize() {
    console.log('🚀 Iniciando serviço de cache inteligente...')
    
    // Iniciar limpeza automática
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.cleanupInterval)

    console.log('✅ Serviço de cache inicializado')
  }

  // Parar serviço de cache
  stop() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
    this.cache.clear()
    console.log('⏹️ Serviço de cache parado')
  }

  // Gerar chave de cache
  generateKey(prefix, ...args) {
    return `${prefix}:${args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(':')}`
  }

  // Obter item do cache
  get(key) {
    const item = this.cache.get(key)
    
    if (!item) {
      this.stats.misses++
      return null
    }

    // Verificar se expirou
    if (Date.now() > item.expires) {
      this.cache.delete(key)
      this.stats.misses++
      this.stats.size = this.cache.size
      return null
    }

    this.stats.hits++
    return item.value
  }

  // Definir item no cache
  set(key, value, ttl = this.defaultTTL) {
    // Verificar limite de tamanho
    if (this.cache.size >= this.maxSize) {
      this.evictOldest()
    }

    const item = {
      value,
      expires: Date.now() + ttl,
      createdAt: Date.now(),
      accessCount: 0
    }

    this.cache.set(key, item)
    this.stats.sets++
    this.stats.size = this.cache.size
  }

  // Remover item do cache
  delete(key) {
    const deleted = this.cache.delete(key)
    if (deleted) {
      this.stats.deletes++
      this.stats.size = this.cache.size
    }
    return deleted
  }

  // Limpar cache expirado
  cleanup() {
    const now = Date.now()
    let cleaned = 0

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key)
        cleaned++
      }
    }

    this.stats.size = this.cache.size

    if (cleaned > 0) {
      console.log(`🧹 Cache limpo: ${cleaned} itens expirados removidos`)
    }
  }

  // Remover item mais antigo (LRU)
  evictOldest() {
    let oldestKey = null
    let oldestTime = Date.now()

    for (const [key, item] of this.cache.entries()) {
      if (item.createdAt < oldestTime) {
        oldestTime = item.createdAt
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
      console.log(`🗑️ Item mais antigo removido do cache: ${oldestKey}`)
    }
  }

  // Cache inteligente para queries do banco
  async cachedQuery(sql, params = [], ttl = this.defaultTTL) {
    const key = this.generateKey('query', sql, ...params)
    
    // Tentar obter do cache
    const cached = this.get(key)
    if (cached !== null) {
      console.log('📦 Query carregada do cache')
      return cached
    }

    // Executar query e armazenar no cache
    try {
      const result = await query(sql, params)
      this.set(key, result, ttl)
      console.log('💾 Query armazenada no cache')
      return result
    } catch (error) {
      console.error('❌ Erro na query:', error)
      throw error
    }
  }

  // Cache para dados de animais
  async getAnimals(forceRefresh = false) {
    const key = 'animals:all'
    
    if (!forceRefresh) {
      const cached = this.get(key)
      if (cached !== null) {
        return cached
      }
    }

    try {
      const result = await this.cachedQuery(`
        SELECT a.*, 
               COALESCE(c.total_custo, 0) as custo_total,
               COALESCE(c.total_protocolos, 0) as total_protocolos
        FROM animais a
        LEFT JOIN (
          SELECT animal_id, 
                 SUM(valor) as total_custo,
                 COUNT(CASE WHEN tipo = 'Protocolo' THEN 1 END) as total_protocolos
          FROM custos
          GROUP BY animal_id
        ) c ON a.id = c.animal_id
        ORDER BY a.created_at DESC
      `, [], 2 * 60 * 1000) // 2 minutos

      return result.rows
    } catch (error) {
      console.error('❌ Erro ao buscar animais:', error)
      throw error
    }
  }

  // Cache para estatísticas do dashboard
  async getDashboardStats(forceRefresh = false) {
    const key = 'dashboard:stats'
    
    if (!forceRefresh) {
      const cached = this.get(key)
      if (cached !== null) {
        return cached
      }
    }

    try {
      const [animals, costs, gestations, births] = await Promise.all([
        this.cachedQuery('SELECT COUNT(*) as total FROM animais WHERE situacao = ?', ['Ativo'], 5 * 60 * 1000),
        this.cachedQuery('SELECT SUM(valor) as total FROM custos', [], 5 * 60 * 1000),
        this.cachedQuery('SELECT COUNT(*) as total FROM gestacoes WHERE data_gestacao > ?', [new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)], 5 * 60 * 1000),
        this.cachedQuery('SELECT COUNT(*) as total FROM nascimentos WHERE data_nascimento > ?', [new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)], 5 * 60 * 1000)
      ])

      const stats = {
        totalAnimais: animals.rows[0]?.total || 0,
        custoTotal: costs.rows[0]?.total || 0,
        gestacoesRecentes: gestations.rows[0]?.total || 0,
        nascimentosRecentes: births.rows[0]?.total || 0,
        timestamp: new Date()
      }

      this.set(key, stats, 5 * 60 * 1000) // 5 minutos
      return stats

    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error)
      throw error
    }
  }

  // Cache para dados de mercado
  async getMarketData(forceRefresh = false) {
    const key = 'market:data'
    
    if (!forceRefresh) {
      const cached = this.get(key)
      if (cached !== null) {
        return cached
      }
    }

    try {
      // Simular dados de mercado (em produção seria API real)
      const marketData = {
        boiGordo: { preco: 180.50, variacao: 2.3 },
        vacaGorda: { preco: 165.20, variacao: -1.1 },
        novilha: { preco: 142.80, variacao: 0.8 },
        garrote: { preco: 158.90, variacao: 1.5 },
        dolar: { preco: 5.12, variacao: -0.4 },
        boiFuturo: { preco: 182.30, variacao: 3.1 },
        timestamp: new Date()
      }

      this.set(key, marketData, 30 * 1000) // 30 segundos
      return marketData

    } catch (error) {
      console.error('❌ Erro ao buscar dados de mercado:', error)
      throw error
    }
  }

  // Invalidar cache por padrão
  invalidatePattern(pattern) {
    let invalidated = 0
    
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
        invalidated++
      }
    }

    this.stats.size = this.cache.size
    console.log(`🗑️ ${invalidated} itens invalidados (padrão: ${pattern})`)
    return invalidated
  }

  // Invalidar cache relacionado a um animal
  invalidateAnimal(animalId) {
    const patterns = [
      'animals:',
      'dashboard:',
      'costs:',
      'gestations:',
      'births:'
    ]

    let totalInvalidated = 0
    patterns.forEach(pattern => {
      totalInvalidated += this.invalidatePattern(pattern)
    })

    console.log(`🗑️ Cache invalidado para animal ${animalId}: ${totalInvalidated} itens`)
    return totalInvalidated
  }

  // Obter estatísticas do cache
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 ? 
      (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100 : 0

    return {
      ...this.stats,
      hitRate: parseFloat(hitRate.toFixed(2)),
      size: this.cache.size,
      maxSize: this.maxSize,
      utilization: parseFloat(((this.cache.size / this.maxSize) * 100).toFixed(2))
    }
  }

  // Obter itens do cache por padrão
  getItemsByPattern(pattern) {
    const items = []
    
    for (const [key, item] of this.cache.entries()) {
      if (key.includes(pattern)) {
        items.push({
          key,
          value: item.value,
          expires: new Date(item.expires),
          createdAt: new Date(item.createdAt),
          accessCount: item.accessCount
        })
      }
    }

    return items
  }

  // Limpar todo o cache
  clear() {
    this.cache.clear()
    this.stats.size = 0
    console.log('🗑️ Cache completamente limpo')
  }

  // Exportar dados do cache
  exportCache() {
    const data = {
      timestamp: new Date().toISOString(),
      stats: this.getStats(),
      items: Array.from(this.cache.entries()).map(([key, item]) => ({
        key,
        value: item.value,
        expires: new Date(item.expires),
        createdAt: new Date(item.createdAt),
        accessCount: item.accessCount
      }))
    }

    return data
  }

  // Importar dados do cache
  importCache(data) {
    try {
      this.cache.clear()
      
      data.items.forEach(item => {
        this.cache.set(item.key, {
          value: item.value,
          expires: new Date(item.expires).getTime(),
          createdAt: new Date(item.createdAt).getTime(),
          accessCount: item.accessCount
        })
      })

      this.stats.size = this.cache.size
      console.log(`📥 Cache importado: ${data.items.length} itens`)
      
    } catch (error) {
      console.error('❌ Erro ao importar cache:', error)
    }
  }
}

// Instância singleton
const smartCacheService = new SmartCacheService()

export default smartCacheService
export { SmartCacheService }
