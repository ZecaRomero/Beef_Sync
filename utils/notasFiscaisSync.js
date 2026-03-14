// Sistema de Sincronização de Notas Fiscais entre Dispositivos
export class NotasFiscaisSync {
  constructor() {
    this.storageKey = 'notasFiscais'
    this.syncInterval = null
  }

  // Exportar dados para sincronização
  exportData() {
    try {
      const notasFiscais = JSON.parse(localStorage.getItem(this.storageKey) || '[]')
      const timestamp = new Date().toISOString()
      
      return {
        notasFiscais,
        timestamp,
        deviceId: this.getDeviceId(),
        version: '1.0'
      }
    } catch (error) {
      console.error('Erro ao exportar dados:', error)
      return null
    }
  }

  // Importar dados de outro dispositivo
  importData(data) {
    try {
      if (!data || !data.notasFiscais) {
        throw new Error('Dados inválidos')
      }

      // Fazer backup dos dados atuais
      const backup = this.exportData()
      localStorage.setItem(`${this.storageKey}_backup`, JSON.stringify(backup))

      // Importar novos dados
      localStorage.setItem(this.storageKey, JSON.stringify(data.notasFiscais))
      
      console.log(`✅ ${data.notasFiscais.length} notas fiscais importadas com sucesso!`)
      return true
    } catch (error) {
      console.error('Erro ao importar dados:', error)
      return false
    }
  }

  // Gerar ID único para o dispositivo
  getDeviceId() {
    let deviceId = localStorage.getItem('deviceId')
    if (!deviceId) {
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('deviceId', deviceId)
    }
    return deviceId
  }

  // Sincronizar via API (quando implementada)
  async syncViaAPI() {
    try {
      const response = await fetch('/api/notas-fiscais/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.exportData())
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          this.importData(result.data)
          return true
        }
      }
    } catch (error) {
      console.warn('Sincronização via API falhou, usando localStorage:', error)
    }
    return false
  }

  // Sincronização automática periódica
  startAutoSync(intervalMinutes = 5) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }

    this.syncInterval = setInterval(() => {
      this.syncViaAPI()
    }, intervalMinutes * 60 * 1000)

    console.log(`🔄 Sincronização automática iniciada (${intervalMinutes}min)`)
  }

  // Parar sincronização automática
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
      console.log('⏹️ Sincronização automática parada')
    }
  }

  // Verificar se há dados para sincronizar
  hasDataToSync() {
    const notasFiscais = JSON.parse(localStorage.getItem(this.storageKey) || '[]')
    return notasFiscais.length > 0
  }

  // Limpar dados locais
  clearLocalData() {
    localStorage.removeItem(this.storageKey)
    console.log('🗑️ Dados locais de notas fiscais removidos')
  }

  // Restaurar backup
  restoreBackup() {
    try {
      const backup = localStorage.getItem(`${this.storageKey}_backup`)
      if (backup) {
        const backupData = JSON.parse(backup)
        this.importData(backupData)
        console.log('🔄 Backup restaurado com sucesso!')
        return true
      }
    } catch (error) {
      console.error('Erro ao restaurar backup:', error)
    }
    return false
  }
}

// Instância global para uso em toda a aplicação
export const notasFiscaisSync = new NotasFiscaisSync()

// Funções utilitárias para uso direto
export const exportNotasFiscais = () => notasFiscaisSync.exportData()
export const importNotasFiscais = (data) => notasFiscaisSync.importData(data)
export const syncNotasFiscais = () => notasFiscaisSync.syncViaAPI()
export const startSyncNotasFiscais = (interval = 5) => notasFiscaisSync.startAutoSync(interval)
export const stopSyncNotasFiscais = () => notasFiscaisSync.stopAutoSync()
