// Sistema de recomendaÃ§Ãµes inteligentes para Beef Sync
import { query } from '../lib/database'

class AIRecommendationService {
  constructor() {
    this.recommendations = []
    this.lastUpdate = null
    this.updateInterval = 60 * 60 * 1000 // 1 hora
  }

  // Gerar recomendaÃ§Ãµes inteligentes
  async generateRecommendations() {
    try {
      console.log('ðÅ¸¤â€“ Gerando recomendaÃ§Ãµes inteligentes...')
      
      const recommendations = []
      
      // 1. RecomendaÃ§Ãµes de venda baseadas em idade e custo
      const saleRecommendations = await this.analyzeSaleOpportunities()
      recommendations.push(...saleRecommendations)
      
      // 2. RecomendaÃ§Ãµes de protocolos sanitÃ¡rios
      const protocolRecommendations = await this.analyzeProtocolNeeds()
      recommendations.push(...protocolRecommendations)
      
      // 3. RecomendaÃ§Ãµes de reproduÃ§Ã£o
      const breedingRecommendations = await this.analyzeBreedingOpportunities()
      recommendations.push(...breedingRecommendations)
      
      // 4. RecomendaÃ§Ãµes de custos
      const costRecommendations = await this.analyzeCostOptimization()
      recommendations.push(...costRecommendations)
      
      // 5. RecomendaÃ§Ãµes de mercado
      const marketRecommendations = await this.analyzeMarketTrends()
      recommendations.push(...marketRecommendations)

      this.recommendations = recommendations
      this.lastUpdate = new Date()
      
      console.log(`âÅ“â€¦ ${recommendations.length} recomendaÃ§Ãµes geradas`)
      
      return recommendations

    } catch (error) {
      console.error('â�Å’ Erro ao gerar recomendaÃ§Ãµes:', error)
      return []
    }
  }

  // Analisar oportunidades de venda
  async analyzeSaleOpportunities() {
    try {
      const animais = await query(`
        SELECT a.*, c.total_custo
        FROM animais a
        LEFT JOIN (
          SELECT animal_id, SUM(valor) as total_custo
          FROM custos
          GROUP BY animal_id
        ) c ON a.id = c.animal_id
        WHERE a.situacao = 'Ativo'
        ORDER BY a.meses DESC, c.total_custo ASC
      `)

      const recommendations = []
      const precoBoiGordo = 180.00 // PreÃ§o atual do boi gordo
      const pesoMedio = 450 // Peso mÃ©dio em kg

      animais.rows.forEach(animal => {
        const custoTotal = animal.total_custo || 0
        const idadeMeses = animal.meses || 0
        const valorEstimado = pesoMedio * precoBoiGordo
        const lucroEstimado = valorEstimado - custoTotal
        const roi = custoTotal > 0 ? (lucroEstimado / custoTotal) * 100 : 0

        // Animais com mais de 24 meses e ROI positivo
        if (idadeMeses >= 24 && roi > 15) {
          recommendations.push({
            type: 'sale',
            priority: 'high',
            title: 'Oportunidade de Venda',
            message: `${animal.serie}${animal.rg} - Idade: ${idadeMeses} meses, ROI: ${roi.toFixed(1)}%`,
            animal: animal,
            data: {
              idadeMeses,
              custoTotal,
              valorEstimado,
              lucroEstimado,
              roi
            },
            action: 'Considerar venda imediata',
            confidence: Math.min(95, 70 + (roi - 15))
          })
        }

        // Animais com custo muito alto
        if (custoTotal > 8000 && idadeMeses >= 18) {
          recommendations.push({
            type: 'sale',
            priority: 'medium',
            title: 'Alto Custo de ManutenÃ§Ã£o',
            message: `${animal.serie}${animal.rg} - Custo total: R$ ${custoTotal.toFixed(2)}`,
            animal: animal,
            data: { custoTotal, idadeMeses },
            action: 'Avaliar viabilidade econÃ´mica',
            confidence: 80
          })
        }
      })

      return recommendations

    } catch (error) {
      console.error('â�Å’ Erro ao analisar oportunidades de venda:', error)
      return []
    }
  }

  // Analisar necessidades de protocolos
  async analyzeProtocolNeeds() {
    try {
      const animais = await query(`
        SELECT a.*, 
               MAX(c.data) as ultimo_protocolo,
               COUNT(c.id) as total_protocolos
        FROM animais a
        LEFT JOIN custos c ON a.id = c.animal_id AND c.tipo = 'Protocolo'
        WHERE a.situacao = 'Ativo'
        GROUP BY a.id
        ORDER BY a.meses ASC
      `)

      const recommendations = []

      animais.rows.forEach(animal => {
        const idadeMeses = animal.meses || 0
        const ultimoProtocolo = animal.ultimo_protocolo
        const diasDesdeUltimoProtocolo = ultimoProtocolo ? 
          Math.floor((new Date() - new Date(ultimoProtocolo)) / (1000 * 60 * 60 * 24)) : 999

        // Bezerros de 0-3 meses sem protocolo
        if (idadeMeses <= 3 && animal.total_protocolos === 0) {
          recommendations.push({
            type: 'protocol',
            priority: 'high',
            title: 'Protocolo SanitÃ¡rio Pendente',
            message: `${animal.serie}${animal.rg} - Bezerro de ${idadeMeses} meses sem protocolo`,
            animal: animal,
            data: { idadeMeses, diasDesdeUltimoProtocolo },
            action: 'Aplicar protocolo sanitÃ¡rio bÃ¡sico',
            confidence: 95
          })
        }

        // Animais sem protocolo hÃ¡ mais de 90 dias
        if (diasDesdeUltimoProtocolo > 90 && idadeMeses > 3) {
          recommendations.push({
            type: 'protocol',
            priority: 'medium',
            title: 'Protocolo em Atraso',
            message: `${animal.serie}${animal.rg} - Sem protocolo hÃ¡ ${diasDesdeUltimoProtocolo} dias`,
            animal: animal,
            data: { idadeMeses, diasDesdeUltimoProtocolo },
            action: 'Renovar protocolo sanitÃ¡rio',
            confidence: 85
          })
        }
      })

      return recommendations

    } catch (error) {
      console.error('â�Å’ Erro ao analisar necessidades de protocolos:', error)
      return []
    }
  }

  // Analisar oportunidades de reproduÃ§Ã£o
  async analyzeBreedingOpportunities() {
    try {
      const femeas = await query(`
        SELECT a.*, 
               MAX(g.data_gestacao) as ultima_gestacao,
               MAX(n.data_nascimento) as ultimo_nascimento
        FROM animais a
        LEFT JOIN gestacoes g ON a.id = g.animal_id
        LEFT JOIN nascimentos n ON a.id = n.animal_id
        WHERE a.situacao = 'Ativo' 
          AND a.sexo = 'FÃªmea'
          AND a.meses BETWEEN 18 AND 84
        GROUP BY a.id
        ORDER BY a.meses ASC
      `)

      const recommendations = []

      femeas.rows.forEach(femea => {
        const idadeMeses = femea.meses || 0
        const ultimaGestacao = femea.ultima_gestacao
        const ultimoNascimento = femea.ultimo_nascimento
        const diasDesdeUltimoNascimento = ultimoNascimento ? 
          Math.floor((new Date() - new Date(ultimoNascimento)) / (1000 * 60 * 60 * 24)) : 999

        // FÃªmeas em idade reprodutiva sem gestaÃ§Ã£o recente
        if (idadeMeses >= 18 && idadeMeses <= 60 && diasDesdeUltimoNascimento > 365) {
          recommendations.push({
            type: 'breeding',
            priority: 'medium',
            title: 'Oportunidade de ReproduÃ§Ã£o',
            message: `${femea.serie}${femea.rg} - FÃªmea de ${idadeMeses} meses sem reproduÃ§Ã£o recente`,
            animal: femea,
            data: { idadeMeses, diasDesdeUltimoNascimento },
            action: 'Considerar inseminaÃ§Ã£o ou monta natural',
            confidence: 75
          })
        }

        // FÃªmeas jovens prontas para reproduÃ§Ã£o
        if (idadeMeses >= 15 && idadeMeses <= 18 && !ultimaGestacao) {
          recommendations.push({
            type: 'breeding',
            priority: 'high',
            title: 'FÃªmea Pronta para ReproduÃ§Ã£o',
            message: `${femea.serie}${femea.rg} - Idade ideal para primeira reproduÃ§Ã£o`,
            animal: femea,
            data: { idadeMeses },
            action: 'Planejar primeira inseminaÃ§Ã£o',
            confidence: 90
          })
        }
      })

      return recommendations

    } catch (error) {
      console.error('â�Å’ Erro ao analisar oportunidades de reproduÃ§Ã£o:', error)
      return []
    }
  }

  // Analisar otimizaÃ§Ã£o de custos
  async analyzeCostOptimization() {
    try {
      const custos = await query(`
        SELECT c.*, a.serie, a.rg, a.situacao
        FROM custos c
        JOIN animais a ON c.animal_id = a.id
        WHERE a.situacao = 'Ativo'
        ORDER BY c.valor DESC
      `)

      const recommendations = []
      const custosPorAnimal = {}

      // Agrupar custos por animal
      custos.rows.forEach(custo => {
        if (!custosPorAnimal[custo.animal_id]) {
          custosPorAnimal[custo.animal_id] = {
            animal: { serie: custo.serie, rg: custo.rg },
            total: 0,
            custos: []
          }
        }
        custosPorAnimal[custo.animal_id].total += custo.valor
        custosPorAnimal[custo.animal_id].custos.push(custo)
      })

      // Analisar custos altos
      Object.entries(custosPorAnimal).forEach(([animalId, data]) => {
        if (data.total > 10000) {
          recommendations.push({
            type: 'cost',
            priority: 'high',
            title: 'Custo Alto Detectado',
            message: `${data.animal.serie}${data.animal.rg} - Total: R$ ${data.total.toFixed(2)}`,
            animal: data.animal,
            data: { total: data.total, custos: data.custos },
            action: 'Revisar custos e avaliar viabilidade',
            confidence: 85
          })
        }
      })

      return recommendations

    } catch (error) {
      console.error('â�Å’ Erro ao analisar otimizaÃ§Ã£o de custos:', error)
      return []
    }
  }

  // Analisar tendÃªncias de mercado
  async analyzeMarketTrends() {
    try {
      // Simular anÃ¡lise de mercado (em produÃ§Ã£o seria integrado com APIs reais)
      const recommendations = []

      // Simular dados de mercado
      const precoBoiGordo = 180.00
      const precoAnterior = 175.00
      const variacao = ((precoBoiGordo - precoAnterior) / precoAnterior) * 100

      if (variacao > 5) {
        recommendations.push({
          type: 'market',
          priority: 'high',
          title: 'Alta no PreÃ§o do Boi Gordo',
          message: `PreÃ§o subiu ${variacao.toFixed(1)}% - R$ ${precoBoiGordo}`,
          data: { precoAtual: precoBoiGordo, variacao },
          action: 'Considerar venda de animais prontos',
          confidence: 80
        })
      }

      if (variacao < -3) {
        recommendations.push({
          type: 'market',
          priority: 'medium',
          title: 'Queda no PreÃ§o do Boi Gordo',
          message: `PreÃ§o caiu ${Math.abs(variacao).toFixed(1)}% - R$ ${precoBoiGordo}`,
          data: { precoAtual: precoBoiGordo, variacao },
          action: 'Aguardar recuperaÃ§Ã£o antes de vender',
          confidence: 75
        })
      }

      return recommendations

    } catch (error) {
      console.error('â�Å’ Erro ao analisar tendÃªncias de mercado:', error)
      return []
    }
  }

  // Obter recomendaÃ§Ãµes por tipo
  getRecommendationsByType(type) {
    return this.recommendations.filter(rec => rec.type === type)
  }

  // Obter recomendaÃ§Ãµes por prioridade
  getRecommendationsByPriority(priority) {
    return this.recommendations.filter(rec => rec.priority === priority)
  }

  // Obter estatÃ­sticas das recomendaÃ§Ãµes
  getRecommendationStats() {
    const stats = {
      total: this.recommendations.length,
      byType: {},
      byPriority: {},
      lastUpdate: this.lastUpdate
    }

    this.recommendations.forEach(rec => {
      stats.byType[rec.type] = (stats.byType[rec.type] || 0) + 1
      stats.byPriority[rec.priority] = (stats.byPriority[rec.priority] || 0) + 1
    })

    return stats
  }

  // Atualizar recomendaÃ§Ãµes periodicamente
  startAutoUpdate() {
    setInterval(async () => {
      await this.generateRecommendations()
    }, this.updateInterval)
  }
}

// InstÃ¢ncia singleton
const aiRecommendationService = new AIRecommendationService()

export default aiRecommendationService
export { AIRecommendationService }
