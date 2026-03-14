// Sistema de SincronizaÃ§Ã£o de Notas Fiscais entre Dispositivos
export class NotasFiscaisSync {
  constructor() {
    this.storageKey = 'notasFiscais'
    this.syncInterval = null
  }

  // Exportar dados para sincronizaÃ§Ã£o
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
        throw new Error('Dados invÃ¡lidos')
      }

      // Fazer backup dos dados atuais
      const backup = this.exportData()
      localStorage.setItem(`${this.storageKey}_backup`, JSON.stringify(backup))

      // Importar novos dados
      localStorage.setItem(this.storageKey, JSON.stringify(data.notasFiscais))
      
      console.log(`âÅ“â€¦ ${data.notasFiscais.length} notas fiscais importadas com sucesso!`)
      return true
    } catch (error) {
      console.error('Erro ao importar dados:', error)
      return false
    }
  }

  // Gerar ID Ãºnico para o dispositivo
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
      console.warn('SincronizaÃ§Ã£o via API falhou, usando localStorage:', error)
    }
    return false
  }

  // SincronizaÃ§Ã£o automÃ¡tica periÃ³dica
  startAutoSync(intervalMinutes = 5) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }

    this.syncInterval = setInterval(() => {
      this.syncViaAPI()
    }, intervalMinutes * 60 * 1000)

    console.log(`ðÅ¸â€�â€ž SincronizaÃ§Ã£o automÃ¡tica iniciada (${intervalMinutes}min)`)
  }

  // Parar sincronizaÃ§Ã£o automÃ¡tica
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
      console.log('â�¹ï¸� SincronizaÃ§Ã£o automÃ¡tica parada')
    }
  }

  // Verificar se hÃ¡ dados para sincronizar
  hasDataToSync() {
    const notasFiscais = JSON.parse(localStorage.getItem(this.storageKey) || '[]')
    return notasFiscais.length > 0
  }

  // Limpar dados locais
  clearLocalData() {
    localStorage.removeItem(this.storageKey)
    console.log('ðÅ¸â€”â€˜ï¸� Dados locais de notas fiscais removidos')
  }

  // Restaurar backup
  restoreBackup() {
    try {
      const backup = localStorage.getItem(`${this.storageKey}_backup`)
      if (backup) {
        const backupData = JSON.parse(backup)
        this.importData(backupData)
        console.log('ðÅ¸â€�â€ž Backup restaurado com sucesso!')
        return true
      }
    } catch (error) {
      console.error('Erro ao restaurar backup:', error)
    }
    return false
  }
}

// InstÃ¢ncia global para uso em toda a aplicaÃ§Ã£o
export const notasFiscaisSync = new NotasFiscaisSync()

// FunÃ§Ãµes utilitÃ¡rias para uso direto
export const exportNotasFiscais = () => notasFiscaisSync.exportData()
export const importNotasFiscais = (data) => notasFiscaisSync.importData(data)
export const syncNotasFiscais = () => notasFiscaisSync.syncViaAPI()
export const startSyncNotasFiscais = (interval = 5) => notasFiscaisSync.startAutoSync(interval)
export const stopSyncNotasFiscais = () => notasFiscaisSync.stopAutoSync()
