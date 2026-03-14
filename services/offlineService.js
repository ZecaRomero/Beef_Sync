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

  // Inicializar serviço offline
  initialize() {
    console.log('📱 Inicializando serviço offline...')

    // Detectar status de conexão
    this.detectConnectionStatus()

    // Configurar listeners de conexão
    this.setupConnectionListeners()

    // Iniciar sincronização periódica
    this.startPeriodicSync()

    // Carregar dados offline salvos
    this.loadOfflineData()

    console.log('✅ Serviço offline inicializado')
  }

  // Detectar status de conexão
  detectConnectionStatus() {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine
    }
  }

  // Configurar listeners de conexão
  setupConnectionListeners() {
    if (typeof window === 'undefined') return

    window.addEventListener('online', () => {
      console.log('🌐 Conexão restaurada')
      this.isOnline = true
      this.syncPendingOperations()
    })

    window.addEventListener('offline', () => {
      console.log('📱 Modo offline ativado')
      this.isOnline = false
    })
  }

  // Iniciar sincronização periódica
  startPeriodicSync() {
    if (this.syncInterval) return

    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.syncQueue.length > 0) {
        this.syncPendingOperations()
      }
    }, 30000) // 30 segundos
  }

  // Parar sincronização periódica
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
        console.log(`📦 ${this.offlineData.size} itens carregados do armazenamento offline`)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados offline:', error)
    }
  }

  // Salvar dados offline
  saveOfflineData() {
    if (typeof window === 'undefined') return

    try {
      const dataToSave = Array.from(this.offlineData.entries())
      localStorage.setItem('beef-sync-offline-data', JSON.stringify(dataToSave))
    } catch (error) {
      console.error('❌ Erro ao salvar dados offline:', error)
    }
  }

  // Adicionar operação à fila de sincronização
  addToSyncQueue(operation) {
    const syncOperation = {
      id: Date.now() + Math.random(),
      operation,
      timestamp: new Date(),
      attempts: 0,
      status: 'pending'
    }

    this.syncQueue.push(syncOperation)
    console.log(`📝 Operação adicionada à fila de sincronização: ${operation.type}`)

    // Tentar sincronizar imediatamente se online
    if (this.isOnline) {
      this.syncPendingOperations()
    }
  }

  // Sincronizar operações pendentes
  async syncPendingOperations() {
    if (!this.isOnline || this.syncQueue.length === 0) return

    console.log(`🔄 Sincronizando ${this.syncQueue.length} operações pendentes...`)

    const operationsToSync = [...this.syncQueue]
    this.syncQueue = []

    for (const syncOp of operationsToSync) {
      try {
        await this.executeSyncOperation(syncOp)
        syncOp.status = 'completed'
        console.log(`✅ Operação sincronizada: ${syncOp.operation.type}`)
      } catch (error) {
        console.error(`❌ Erro ao sincronizar operação:`, error)
        syncOp.attempts++
        syncOp.status = 'failed'

        // Recolocar na fila se não excedeu tentativas
        if (syncOp.attempts < this.retryAttempts) {
          this.syncQueue.push(syncOp)
          console.log(`🔄 Operação recolocada na fila (tentativa ${syncOp.attempts}/${this.retryAttempts})`)
        } else {
          console.error(`❌ Operação falhou após ${this.retryAttempts} tentativas`)
        }
      }
    }

    this.lastSync = new Date()
  }

  // Executar operação de sincronização
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
        throw new Error(`Tipo de operação não suportado: ${operation.type}`)
    }
  }

  // Sincronizar criação de animal
  async syncCreateAnimal(data) {
    const { serie, rg, sexo, raca, meses, situacao, observacoes } = data

    await query(`
      INSERT INTO animais (serie, rg, sexo, raca, meses, situacao, observacoes, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
    `, [serie, rg, sexo, raca, meses, situacao, observacoes])
  }

  // Sincronizar atualização de animal
  async syncUpdateAnimal(data) {
    const { id, serie, rg, sexo, raca, meses, situacao, observacoes } = data

    await query(`
      UPDATE animais 
      SET serie = $1, rg = $2, sexo = $3, raca = $4, meses = $5, situacao = $6, observacoes = $7, updated_at = NOW()
      WHERE id = $8
    `, [serie, rg, sexo, raca, meses, situacao, observacoes, id])
  }

  // Sincronizar exclusão de animal
  async syncDeleteAnimal(data) {
    const { id } = data

    await query('DELETE FROM animais WHERE id = $1', [id])
  }

  // Sincronizar criação de custo
  async syncCreateCost(data) {
    const { animal_id, tipo, subtipo, valor, data: data_custo, observacoes, fornecedor, destino } = data

    await query(`
      INSERT INTO custos (animal_id, tipo, subtipo, valor, data, observacoes, fornecedor, destino, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    `, [animal_id, tipo, subtipo, valor, data_custo, observacoes, fornecedor, destino])
  }

  // Sincronizar atualização de custo
  async syncUpdateCost(data) {
    const { id, animal_id, tipo, subtipo, valor, data: data_custo, observacoes, fornecedor, destino } = data

    await query(`
      UPDATE custos 
      SET animal_id = $1, tipo = $2, subtipo = $3, valor = $4, data = $5, observacoes = $6, fornecedor = $7, destino = $8, updated_at = NOW()
      WHERE id = $9
    `, [animal_id, tipo, subtipo, valor, data_custo, observacoes, fornecedor, destino, id])
  }

  // Sincronizar exclusão de custo
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
      // Se offline, salvar localmente e adicionar à fila
      const offlineId = `offline_${Date.now()}_${Math.random()}`
      const offlineData = { ...data, offlineId }

      // Salvar dados offline
      this.offlineData.set(offlineId, { operation, data: offlineData })
      this.saveOfflineData()

      // Adicionar à fila de sincronização
      this.addToSyncQueue({ type: operation, data: offlineData })

      console.log(`📱 Operação salva offline: ${operation}`)
      return { success: true, offlineId, message: 'Operação salva para sincronização' }
    }
  }

  // Executar operação online
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
        throw new Error(`Tipo de operação não suportado: ${operation}`)
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

  // Obter status do serviço
  getStatus() {
    return {
      isOnline: this.isOnline,
      pendingOperations: this.syncQueue.length,
      offlineDataCount: this.offlineData.size,
      lastSync: this.lastSync,
      syncInterval: this.syncInterval ? 'active' : 'inactive'
    }
  }

  // Obter estatísticas
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

    // Contar operações por status
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
    console.log('🗑️ Dados offline limpos')
  }

  // Forçar sincronização
  async forceSync() {
    if (!this.isOnline) {
      throw new Error('Não é possível sincronizar offline')
    }

    console.log('🔄 Forçando sincronização...')
    await this.syncPendingOperations()
    console.log('✅ Sincronização forçada concluída')
  }

  // Verificar se há operações pendentes
  hasPendingOperations() {
    return this.syncQueue.length > 0
  }

  // Obter operações pendentes
  getPendingOperations() {
    return this.syncQueue.map(op => ({
      id: op.id,
      type: op.operation.type,
      timestamp: op.timestamp,
      attempts: op.attempts,
      status: op.status
    }))
  }

  // Parar serviço
  stop() {
    this.stopPeriodicSync()
    this.saveOfflineData()
    console.log('⏹️ Serviço offline parado')
  }
}

// Instância singleton
const offlineService = new OfflineService()

export default offlineService
export { OfflineService }
