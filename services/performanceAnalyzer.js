// Sistema de análise de performance para Beef Sync
import { query } from '../lib/database'

class PerformanceAnalyzer {
  constructor() {
    this.metrics = {
      queries: [],
      responseTimes: [],
      errors: [],
      memoryUsage: [],
      cpuUsage: []
    }
    this.isMonitoring = false
    this.monitoringInterval = null
  }

  // Iniciar monitoramento de performance
  startMonitoring() {
    if (this.isMonitoring) return

    console.log('📊 Iniciando monitoramento de performance...')
    this.isMonitoring = true

    // Monitorar métricas a cada 30 segundos
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics()
    }, 30000)

    // Monitorar queries em tempo real
    this.monitorQueries()
  }

  // Parar monitoramento
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    this.isMonitoring = false
    console.log('⏹️ Monitoramento de performance parado')
  }

  // Coletar métricas do sistema
  async collectMetrics() {
    try {
      const metrics = {
        timestamp: new Date(),
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        cpu: process.cpuUsage()
      }

      this.metrics.memoryUsage.push(metrics.memory)
      this.metrics.cpuUsage.push(metrics.cpu)

      // Manter apenas as últimas 100 medições
      if (this.metrics.memoryUsage.length > 100) {
        this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-100)
      }
      if (this.metrics.cpuUsage.length > 100) {
        this.metrics.cpuUsage = this.metrics.cpuUsage.slice(-100)
      }

    } catch (error) {
      console.error('❌ Erro ao coletar métricas:', error)
    }
  }

  // Monitorar queries do banco de dados
  monitorQueries() {
    // Não podemos reatribuir importações ES6, então vamos usar uma abordagem diferente
    console.log('📊 Monitoramento de queries ativado (modo observação)')
    // TODO: Implementar interceptação de queries de forma compatível com ES6
  }

  // Analisar performance do banco de dados
  async analyzeDatabasePerformance() {
    try {
      console.log('🔍 Analisando performance do banco de dados...')

      const analysis = {
        timestamp: new Date(),
        queries: {
          total: this.metrics.queries.length,
          slow: this.metrics.queries.filter(q => q.duration > 1000).length,
          average: this.calculateAverage(this.metrics.queries.map(q => q.duration)),
          max: Math.max(...this.metrics.queries.map(q => q.duration)),
          min: Math.min(...this.metrics.queries.map(q => q.duration))
        },
        errors: {
          total: this.metrics.errors.length,
          recent: this.metrics.errors.filter(e => 
            new Date() - new Date(e.timestamp) < 3600000 // Última hora
          ).length
        },
        recommendations: []
      }

      // Gerar recomendações
      if (analysis.queries.slow > analysis.queries.total * 0.1) {
        analysis.recommendations.push({
          type: 'performance',
          priority: 'high',
          message: `${analysis.queries.slow} queries lentas detectadas`,
          action: 'Otimizar queries ou adicionar índices'
        })
      }

      if (analysis.errors.recent > 10) {
        analysis.recommendations.push({
          type: 'reliability',
          priority: 'high',
          message: `${analysis.errors.recent} erros na última hora`,
          action: 'Investigar e corrigir problemas de banco'
        })
      }

      if (analysis.queries.average > 500) {
        analysis.recommendations.push({
          type: 'performance',
          priority: 'medium',
          message: `Tempo médio de query: ${analysis.queries.average.toFixed(2)}ms`,
          action: 'Considerar otimizações de performance'
        })
      }

      return analysis

    } catch (error) {
      console.error('❌ Erro ao analisar performance do banco:', error)
      return null
    }
  }

  // Analisar performance da aplicação
  async analyzeApplicationPerformance() {
    try {
      console.log('🔍 Analisando performance da aplicação...')

      const analysis = {
        timestamp: new Date(),
        memory: {
          current: process.memoryUsage(),
          average: this.calculateAverage(this.metrics.memoryUsage.map(m => m.heapUsed)),
          max: Math.max(...this.metrics.memoryUsage.map(m => m.heapUsed)),
          min: Math.min(...this.metrics.memoryUsage.map(m => m.heapUsed))
        },
        cpu: {
          current: process.cpuUsage(),
          average: this.calculateAverage(this.metrics.cpuUsage.map(c => c.user + c.system))
        },
        uptime: process.uptime(),
        recommendations: []
      }

      // Gerar recomendações
      if (analysis.memory.current.heapUsed > 100 * 1024 * 1024) { // 100MB
        analysis.recommendations.push({
          type: 'memory',
          priority: 'medium',
          message: `Uso de memória alto: ${(analysis.memory.current.heapUsed / 1024 / 1024).toFixed(2)}MB`,
          action: 'Monitorar vazamentos de memória'
        })
      }

      if (analysis.uptime > 7 * 24 * 3600) { // 7 dias
        analysis.recommendations.push({
          type: 'maintenance',
          priority: 'low',
          message: `Sistema rodando há ${Math.floor(analysis.uptime / 3600)} horas`,
          action: 'Considerar reinicialização preventiva'
        })
      }

      return analysis

    } catch (error) {
      console.error('❌ Erro ao analisar performance da aplicação:', error)
      return null
    }
  }

  // Analisar performance geral do sistema
  async analyzeSystemPerformance() {
    try {
      console.log('🔍 Analisando performance geral do sistema...')

      const [dbAnalysis, appAnalysis] = await Promise.all([
        this.analyzeDatabasePerformance(),
        this.analyzeApplicationPerformance()
      ])

      const analysis = {
        timestamp: new Date(),
        database: dbAnalysis,
        application: appAnalysis,
        overall: {
          health: 'good',
          score: 100,
          recommendations: []
        }
      }

      // Calcular score geral
      let score = 100
      const allRecommendations = []

      if (dbAnalysis) {
        allRecommendations.push(...dbAnalysis.recommendations)
        if (dbAnalysis.queries.slow > dbAnalysis.queries.total * 0.1) score -= 20
        if (dbAnalysis.errors.recent > 10) score -= 30
        if (dbAnalysis.queries.average > 500) score -= 15
      }

      if (appAnalysis) {
        allRecommendations.push(...appAnalysis.recommendations)
        if (appAnalysis.memory.current.heapUsed > 100 * 1024 * 1024) score -= 10
      }

      analysis.overall.score = Math.max(0, score)
      analysis.overall.recommendations = allRecommendations

      // Determinar saúde geral
      if (score >= 80) analysis.overall.health = 'excellent'
      else if (score >= 60) analysis.overall.health = 'good'
      else if (score >= 40) analysis.overall.health = 'fair'
      else analysis.overall.health = 'poor'

      return analysis

    } catch (error) {
      console.error('❌ Erro ao analisar performance geral:', error)
      return null
    }
  }

  // Calcular média
  calculateAverage(numbers) {
    if (numbers.length === 0) return 0
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length
  }

  // Obter métricas em tempo real
  getRealTimeMetrics() {
    return {
      timestamp: new Date(),
      isMonitoring: this.isMonitoring,
      queries: {
        total: this.metrics.queries.length,
        recent: this.metrics.queries.filter(q => 
          new Date() - new Date(q.timestamp) < 300000 // Últimos 5 minutos
        ).length,
        average: this.calculateAverage(this.metrics.queries.slice(-10).map(q => q.duration))
      },
      errors: {
        total: this.metrics.errors.length,
        recent: this.metrics.errors.filter(e => 
          new Date() - new Date(e.timestamp) < 300000 // Últimos 5 minutos
        ).length
      },
      memory: process.memoryUsage(),
      uptime: process.uptime()
    }
  }

  // Limpar métricas antigas
  cleanupOldMetrics() {
    const oneHourAgo = new Date(Date.now() - 3600000)
    
    this.metrics.queries = this.metrics.queries.filter(q => 
      new Date(q.timestamp) > oneHourAgo
    )
    
    this.metrics.errors = this.metrics.errors.filter(e => 
      new Date(e.timestamp) > oneHourAgo
    )
    
    this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-50)
    this.metrics.cpuUsage = this.metrics.cpuUsage.slice(-50)
    
    console.log('🧹 Métricas antigas removidas')
  }

  // Gerar relatório de performance
  async generatePerformanceReport() {
    try {
      const analysis = await this.analyzeSystemPerformance()
      
      if (!analysis) {
        throw new Error('Não foi possível gerar análise de performance')
      }

      const report = {
        generatedAt: new Date().toISOString(),
        summary: {
          health: analysis.overall.health,
          score: analysis.overall.score,
          totalRecommendations: analysis.overall.recommendations.length
        },
        details: analysis,
        recommendations: analysis.overall.recommendations,
        nextSteps: this.generateNextSteps(analysis.overall.recommendations)
      }

      return report

    } catch (error) {
      console.error('❌ Erro ao gerar relatório de performance:', error)
      return null
    }
  }

  // Gerar próximos passos baseados nas recomendações
  generateNextSteps(recommendations) {
    const nextSteps = []

    recommendations.forEach(rec => {
      switch (rec.type) {
        case 'performance':
          nextSteps.push('Otimizar queries do banco de dados')
          break
        case 'reliability':
          nextSteps.push('Investigar e corrigir erros do sistema')
          break
        case 'memory':
          nextSteps.push('Monitorar uso de memória')
          break
        case 'maintenance':
          nextSteps.push('Planejar manutenção preventiva')
          break
      }
    })

    return [...new Set(nextSteps)] // Remover duplicatas
  }
}

// Instância singleton
const performanceAnalyzer = new PerformanceAnalyzer()

export default performanceAnalyzer
export { PerformanceAnalyzer }
