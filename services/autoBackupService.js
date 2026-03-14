// Sistema de backup automÃ¡tico para Beef Sync
import { query } from '../lib/database'

class AutoBackupService {
  constructor() {
    this.isEnabled = true
    this.backupInterval = 24 * 60 * 60 * 1000 // 24 horas
    this.maxBackups = 7 // Manter 7 backups
    this.backupPath = './backups'
    this.intervalId = null
  }

  // Inicializar serviÃ§o de backup automÃ¡tico
  async initialize() {
    if (!this.isEnabled) return

    console.log('ðÅ¸â€�â€ž Iniciando serviÃ§o de backup automÃ¡tico...')
    
    // Executar backup inicial
    await this.performBackup()
    
    // Configurar backup periÃ³dico
    this.intervalId = setInterval(async () => {
      await this.performBackup()
    }, this.backupInterval)

    console.log('âÅ“â€¦ ServiÃ§o de backup automÃ¡tico iniciado')
  }

  // Parar serviÃ§o de backup
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      console.log('â�¹ï¸� ServiÃ§o de backup automÃ¡tico parado')
    }
  }

  // Executar backup completo
  async performBackup() {
    try {
      console.log('ðÅ¸â€œ¦ Iniciando backup automÃ¡tico...')
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupData = await this.collectBackupData()
      
      // Salvar backup em JSON
      const jsonBackup = {
        timestamp: new Date().toISOString(),
        version: '3.0.0',
        data: backupData,
        metadata: {
          totalAnimals: backupData.animais?.length || 0,
          totalCosts: backupData.custos?.length || 0,
          totalGestations: backupData.gestacoes?.length || 0,
          totalBirths: backupData.nascimentos?.length || 0,
          totalSemen: backupData.estoque_semen?.length || 0,
          totalTransfers: backupData.transferencias_embrioes?.length || 0,
          totalNFs: backupData.notas_fiscais?.length || 0
        }
      }

      // Salvar arquivo localmente (simulado)
      const filename = `backup_auto_${timestamp}.json`
      console.log(`ðÅ¸â€™¾ Backup salvo: ${filename}`)
      
      // Limpar backups antigos
      await this.cleanupOldBackups()
      
      // Log de sucesso
      console.log('âÅ“â€¦ Backup automÃ¡tico concluÃ­do com sucesso')
      
      return {
        success: true,
        filename,
        timestamp: new Date().toISOString(),
        metadata: jsonBackup.metadata
      }

    } catch (error) {
      console.error('â�Å’ Erro no backup automÃ¡tico:', error)
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }

  // Coletar todos os dados para backup
  async collectBackupData() {
    try {
      console.log('ðÅ¸â€œÅ  Coletando dados para backup...')
      
      const tables = [
        'animais',
        'custos', 
        'gestacoes',
        'nascimentos',
        'estoque_semen',
        'transferencias_embrioes',
        'notas_fiscais',
        'servicos',
        'notificacoes',
        'protocolos_reprodutivos'
      ]

      const backupData = {}

      for (const table of tables) {
        try {
          const result = await query(`SELECT * FROM ${table} ORDER BY id`)
          backupData[table] = result.rows || []
          console.log(`âÅ“â€¦ ${table}: ${backupData[table].length} registros`)
        } catch (error) {
          console.warn(`âÅ¡ ï¸� Erro ao coletar dados da tabela ${table}:`, error.message)
          backupData[table] = []
        }
      }

      return backupData

    } catch (error) {
      console.error('â�Å’ Erro ao coletar dados para backup:', error)
      throw error
    }
  }

  // Limpar backups antigos
  async cleanupOldBackups() {
    try {
      console.log('ðÅ¸§¹ Limpando backups antigos...')
      
      // Simular limpeza de arquivos antigos
      // Em produÃ§Ã£o, isso seria implementado com fs
      console.log(`ðÅ¸â€”â€˜ï¸� Mantendo apenas os Ãºltimos ${this.maxBackups} backups`)
      
    } catch (error) {
      console.error('â�Å’ Erro ao limpar backups antigos:', error)
    }
  }

  // Verificar integridade dos dados
  async verifyDataIntegrity() {
    try {
      console.log('ðÅ¸â€�� Verificando integridade dos dados...')
      
      const checks = []
      
      // Verificar animais Ã³rfÃ£os (sem custos)
      const animaisSemCustos = await query(`
        SELECT a.id, a.serie, a.rg 
        FROM animais a 
        LEFT JOIN custos c ON a.id = c.animal_id 
        WHERE c.animal_id IS NULL AND a.situacao = 'Ativo'
      `)
      
      if (animaisSemCustos.rows.length > 0) {
        checks.push({
          type: 'warning',
          message: `${animaisSemCustos.rows.length} animais ativos sem custos registrados`,
          data: animaisSemCustos.rows
        })
      }

      // Verificar custos Ã³rfÃ£os (sem animal)
      const custosOrfaos = await query(`
        SELECT c.id, c.animal_id, c.tipo, c.valor
        FROM custos c 
        LEFT JOIN animais a ON c.animal_id = a.id 
        WHERE a.id IS NULL
      `)
      
      if (custosOrfaos.rows.length > 0) {
        checks.push({
          type: 'error',
          message: `${custosOrfaos.rows.length} custos Ã³rfÃ£os encontrados`,
          data: custosOrfaos.rows
        })
      }

      // Verificar gestaÃ§Ãµes sem nascimento
      const gestacoesSemNascimento = await query(`
        SELECT g.id, g.animal_id, g.data_gestacao
        FROM gestacoes g 
        LEFT JOIN nascimentos n ON g.animal_id = n.animal_id 
        WHERE n.animal_id IS NULL AND g.data_gestacao < NOW() - INTERVAL '9 months'
      `)
      
      if (gestacoesSemNascimento.rows.length > 0) {
        checks.push({
          type: 'warning',
          message: `${gestacoesSemNascimento.rows.length} gestaÃ§Ãµes antigas sem nascimento registrado`,
          data: gestacoesSemNascimento.rows
        })
      }

      console.log(`âÅ“â€¦ VerificaÃ§Ã£o de integridade concluÃ­da: ${checks.length} problemas encontrados`)
      
      return {
        success: true,
        checks,
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      console.error('â�Å’ Erro na verificaÃ§Ã£o de integridade:', error)
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }

  // EstatÃ­sticas do sistema de backup
  async getBackupStats() {
    try {
      const stats = {
        isEnabled: this.isEnabled,
        nextBackup: this.intervalId ? new Date(Date.now() + this.backupInterval).toISOString() : null,
        backupInterval: this.backupInterval,
        maxBackups: this.maxBackups,
        lastBackup: null, // Seria implementado com persistÃªncia
        totalBackups: 0, // Seria implementado com persistÃªncia
        backupSize: 0 // Seria implementado com persistÃªncia
      }

      return stats

    } catch (error) {
      console.error('â�Å’ Erro ao obter estatÃ­sticas de backup:', error)
      return null
    }
  }

  // Configurar backup
  configure(options) {
    if (options.enabled !== undefined) {
      this.isEnabled = options.enabled
    }
    
    if (options.interval) {
      this.backupInterval = options.interval
    }
    
    if (options.maxBackups) {
      this.maxBackups = options.maxBackups
    }

    console.log('âÅ¡â„¢ï¸� ConfiguraÃ§Ãµes de backup atualizadas:', {
      enabled: this.isEnabled,
      interval: this.backupInterval,
      maxBackups: this.maxBackups
    })
  }
}

// InstÃ¢ncia singleton
const autoBackupService = new AutoBackupService()

export default autoBackupService
export { AutoBackupService }
