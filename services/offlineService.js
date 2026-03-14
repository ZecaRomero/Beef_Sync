// Sistema de modo offline para Beef Sync
import { query } from '../lib/database'

class OfflineService {
  constructor() {
    this.isOnline = true
    this.pendingOperations = []
    this.syncQueue = []
    this.offlineData = new Map()
    this.lastSync = null
    this.syncInterval = null
    this.retryAttempts = 3
    this.retryDelay = 5000 // 5 segundos
  }

  // Inicializar serviÃ§o offline
  initialize() {
    console.log('ðÅ¸â€œ± Inicializando serviÃ§o offline...')

    // Detectar status de conexÃ£o
    this.detectConnectionStatus()

    // Configurar listeners de conexÃ£o
    this.setupConnectionListeners()

    // Iniciar sincronizaÃ§Ã£o periÃ³dica
    this.startPeriodicSync()

    // Carregar dados offline salvos
    this.loadOfflineData()

    console.log('âÅ“â€¦ ServiÃ§o offline inicializado')
  }

  // Detectar status de conexÃ£o
  detectConnectionStatus() {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine
    }
  }

  // Configurar listeners de conexÃ£o
  setupConnectionListeners() {
    if (typeof window === 'undefined') return

    window.addEventListener('online', () => {
      console.log('ðÅ¸Å’� ConexÃ£o restaurada')
      this.isOnline = true
      this.syncPendingOperations()
    })

    window.addEventListener('offline', () => {
      console.log('ðÅ¸â€œ± Modo offline ativado')
      this.isOnline = false
    })
  }

  // Iniciar sincronizaÃ§Ã£o periÃ³dica
  startPeriodicSync() {
    if (this.syncInterval) return

    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.syncQueue.length > 0) {
        this.syncPendingOperations()
      }
    }, 30000) // 30 segundos
  }

  // Parar sincronizaÃ§Ã£o periÃ³dica
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  // Carregar dados offline salvos
  loadOfflineData() {
    if (typeof window === 'undefined') return

    try {
      const savedData = localStorage.getItem('beef-sync-offline-data')
      if (savedData) {
        const parsedData = JSON.parse(savedData)
        this.offlineData = new Map(parsedData)
        console.log(`ðÅ¸â€œ¦ ${this.offlineData.size} itens carregados do armazenamento offline`)
      }
    } catch (error) {
      console.error('â�Å’ Erro ao carregar dados offline:', error)
    }
  }

  // Salvar dados offline
  saveOfflineData() {
    if (typeof window === 'undefined') return

    try {
      const dataToSave = Array.from(this.offlineData.entries())
      localStorage.setItem('beef-sync-offline-data', JSON.stringify(dataToSave))
    } catch (error) {
      console.error('â�Å’ Erro ao salvar dados offline:', error)
    }
  }

  // Adicionar operaÃ§Ã£o Ã  fila de sincronizaÃ§Ã£o
  addToSyncQueue(operation) {
    const syncOperation = {
      id: Date.now() + Math.random(),
      operation,
      timestamp: new Date(),
      attempts: 0,
      status: 'pending'
    }

    this.syncQueue.push(syncOperation)
    console.log(`ðÅ¸â€œ� OperaÃ§Ã£o adicionada Ã  fila de sincronizaÃ§Ã£o: ${operation.type}`)

    // Tentar sincronizar imediatamente se online
    if (this.isOnline) {
      this.syncPendingOperations()
    }
  }

  // Sincronizar operaÃ§Ãµes pendentes
  async syncPendingOperations() {
    if (!this.isOnline || this.syncQueue.length === 0) return

    console.log(`ðÅ¸â€�â€ž Sincronizando ${this.syncQueue.length} operaÃ§Ãµes pendentes...`)

    const operationsToSync = [...this.syncQueue]
    this.syncQueue = []

    for (const syncOp of operationsToSync) {
      try {
        await this.executeSyncOperation(syncOp)
        syncOp.status = 'completed'
        console.log(`âÅ“â€¦ OperaÃ§Ã£o sincronizada: ${syncOp.operation.type}`)
      } catch (error) {
        console.error(`â�Å’ Erro ao sincronizar operaÃ§Ã£o:`, error)
        syncOp.attempts++
        syncOp.status = 'failed'

        // Recolocar na fila se nÃ£o excedeu tentativas
        if (syncOp.attempts < this.retryAttempts) {
          this.syncQueue.push(syncOp)
          console.log(`ðÅ¸â€�â€ž OperaÃ§Ã£o recolocada na fila (tentativa ${syncOp.attempts}/${this.retryAttempts})`)
        } else {
          console.error(`â�Å’ OperaÃ§Ã£o falhou apÃ³s ${this.retryAttempts} tentativas`)
        }
      }
    }

    this.lastSync = new Date()
  }

  // Executar operaÃ§Ã£o de sincronizaÃ§Ã£o
  async executeSyncOperation(syncOp) {
    const { operation } = syncOp

    switch (operation.type) {
      case 'create_animal':
        await this.syncCreateAnimal(operation.data)
        break
      case 'update_animal':
        await this.syncUpdateAnimal(operation.data)
        break
      case 'delete_animal':
        await this.syncDeleteAnimal(operation.data)
        break
      case 'create_cost':
        await this.syncCreateCost(operation.data)
        break
      case 'update_cost':
        await this.syncUpdateCost(operation.data)
        break
      case 'delete_cost':
        await this.syncDeleteCost(operation.data)
        break
      default:
        throw new Error(`Tipo de operaÃ§Ã£o nÃ£o suportado: ${operation.type}`)
    }
  }

  // Sincronizar criaÃ§Ã£o de animal
  async syncCreateAnimal(data) {
    const { serie, rg, sexo, raca, meses, situacao, observacoes } = data

    await query(`
      INSERT INTO animais (serie, rg, sexo, raca, meses, situacao, observacoes, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
    `, [serie, rg, sexo, raca, meses, situacao, observacoes])
  }

  // Sincronizar atualizaÃ§Ã£o de animal
  async syncUpdateAnimal(data) {
    const { id, serie, rg, sexo, raca, meses, situacao, observacoes } = data

    await query(`
      UPDATE animais 
      SET serie = $1, rg = $2, sexo = $3, raca = $4, meses = $5, situacao = $6, observacoes = $7, updated_at = NOW()
      WHERE id = $8
    `, [serie, rg, sexo, raca, meses, situacao, observacoes, id])
  }

  // Sincronizar exclusÃ£o de animal
  async syncDeleteAnimal(data) {
    const { id } = data

    await query('DELETE FROM animais WHERE id = $1', [id])
  }

  // Sincronizar criaÃ§Ã£o de custo
  async syncCreateCost(data) {
    const { animal_id, tipo, subtipo, valor, data: data_custo, observacoes, fornecedor, destino } = data

    await query(`
      INSERT INTO custos (animal_id, tipo, subtipo, valor, data, observacoes, fornecedor, destino, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    `, [animal_id, tipo, subtipo, valor, data_custo, observacoes, fornecedor, destino])
  }

  // Sincronizar atualizaÃ§Ã£o de custo
  async syncUpdateCost(data) {
    const { id, animal_id, tipo, subtipo, valor, data: data_custo, observacoes, fornecedor, destino } = data

    await query(`
      UPDATE custos 
      SET animal_id = $1, tipo = $2, subtipo = $3, valor = $4, data = $5, observacoes = $6, fornecedor = $7, destino = $8, updated_at = NOW()
      WHERE id = $9
    `, [animal_id, tipo, subtipo, valor, data_custo, observacoes, fornecedor, destino, id])
  }

  // Sincronizar exclusÃ£o de custo
  async syncDeleteCost(data) {
    const { id } = data

    await query('DELETE FROM custos WHERE id = $1', [id])
  }

  // Operar em modo offline
  async operateOffline(operation, data) {
    if (this.isOnline) {
      // Se online, executar normalmente
      return await this.executeOperation(operation, data)
    } else {
      // Se offline, salvar localmente e adicionar Ã  fila
      const offlineId = `offline_${Date.now()}_${Math.random()}`
      const offlineData = { ...data, offlineId }

      // Salvar dados offline
      this.offlineData.set(offlineId, { operation, data: offlineData })
      this.saveOfflineData()

      // Adicionar Ã  fila de sincronizaÃ§Ã£o
      this.addToSyncQueue({ type: operation, data: offlineData })

      console.log(`ðÅ¸â€œ± OperaÃ§Ã£o salva offline: ${operation}`)
      return { success: true, offlineId, message: 'OperaÃ§Ã£o salva para sincronizaÃ§Ã£o' }
    }
  }

  // Executar operaÃ§Ã£o online
  async executeOperation(operation, data) {
    switch (operation) {
      case 'create_animal':
        return await this.syncCreateAnimal(data)
      case 'update_animal':
        return await this.syncUpdateAnimal(data)
      case 'delete_animal':
        return await this.syncDeleteAnimal(data)
      case 'create_cost':
        return await this.syncCreateCost(data)
      case 'update_cost':
        return await this.syncUpdateCost(data)
      case 'delete_cost':
        return await this.syncDeleteCost(data)
      default:
        throw new Error(`Tipo de operaÃ§Ã£o nÃ£o suportado: ${operation}`)
    }
  }

  // Obter dados offline
  getOfflineData(key) {
    return this.offlineData.get(key)
  }

  // Remover dados offline
  removeOfflineData(key) {
    this.offlineData.delete(key)
    this.saveOfflineData()
  }

  // Obter status do serviÃ§o
  getStatus() {
    return {
      isOnline: this.isOnline,
      pendingOperations: this.syncQueue.length,
      offlineDataCount: this.offlineData.size,
      lastSync: this.lastSync,
      syncInterval: this.syncInterval ? 'active' : 'inactive'
    }
  }

  // Obter estatÃ­sticas
  getStats() {
    const stats = {
      totalOperations: this.syncQueue.length,
      completedOperations: 0,
      failedOperations: 0,
      pendingOperations: 0,
      offlineDataSize: this.offlineData.size,
      lastSync: this.lastSync,
      isOnline: this.isOnline
    }

    // Contar operaÃ§Ãµes por status
    this.syncQueue.forEach(op => {
      switch (op.status) {
        case 'completed':
          stats.completedOperations++
          break
        case 'failed':
          stats.failedOperations++
          break
        case 'pending':
          stats.pendingOperations++
          break
      }
    })

    return stats
  }

  // Limpar dados offline
  clearOfflineData() {
    this.offlineData.clear()
    this.saveOfflineData()
    console.log('ðÅ¸â€”â€˜ï¸� Dados offline limpos')
  }

  // ForÃ§ar sincronizaÃ§Ã£o
  async forceSync() {
    if (!this.isOnline) {
      throw new Error('NÃ£o Ã© possÃ­vel sincronizar offline')
    }

    console.log('ðÅ¸â€�â€ž ForÃ§ando sincronizaÃ§Ã£o...')
    await this.syncPendingOperations()
    console.log('âÅ“â€¦ SincronizaÃ§Ã£o forÃ§ada concluÃ­da')
  }

  // Verificar se hÃ¡ operaÃ§Ãµes pendentes
  hasPendingOperations() {
    return this.syncQueue.length > 0
  }

  // Obter operaÃ§Ãµes pendentes
  getPendingOperations() {
    return this.syncQueue.map(op => ({
      id: op.id,
      type: op.operation.type,
      timestamp: op.timestamp,
      attempts: op.attempts,
      status: op.status
    }))
  }

  // Parar serviÃ§o
  stop() {
    this.stopPeriodicSync()
    this.saveOfflineData()
    console.log('â�¹ï¸� ServiÃ§o offline parado')
  }
}

// InstÃ¢ncia singleton
const offlineService = new OfflineService()

export default offlineService
export { OfflineService }
