/**
 * ServiÃ§o de InteligÃªncia Artificial AvanÃ§ado
 * Fornece anÃ¡lises preditivas, recomendaÃ§Ãµes inteligentes e insights automÃ¡ticos
 */

import logger from '../utils/logger'
import marketAnalysisService from './marketAnalysisService'

class AIIntelligenceService {
  constructor() {
    this.predictionModels = {
      weightGain: this.predictWeightGain.bind(this),
      healthRisk: this.predictHealthRisk.bind(this),
      reproductionSuccess: this.predictReproductionSuccess.bind(this),
      optimalSaleTime: this.predictOptimalSaleTime.bind(this)
    }
  }

  /**
   * Gera recomendaÃ§Ãµes inteligentes para um animal
   */
  async generateAnimalRecommendations(animal) {
    try {
      const recommendations = {
        animal_id: animal.id,
        identificacao: `${animal.serie || ''}${animal.rg || ''}`,
        timestamp: new Date().toISOString(),
        recommendations: [],
        alerts: [],
        insights: []
      }

      // 1. AnÃ¡lise de mercado
      try {
        const marketAnalysis = await marketAnalysisService.analyzeSaleReadiness(animal)
        if (marketAnalysis.apto_venda) {
          recommendations.recommendations.push({
            type: 'sale',
            priority: marketAnalysis.score >= 70 ? 'high' : 'medium',
            title: 'Animal apto para venda',
            description: `Score de ${marketAnalysis.score}/100. ${marketAnalysis.recomendacao}`,
            action: 'Considerar venda no mercado atual',
            roi_estimado: marketAnalysis.roi_estimado,
            valor_estimado: marketAnalysis.valor_estimado_mercado
          })
        }
      } catch (error) {
        logger.error('Erro na anÃ¡lise de mercado:', error)
      }

      // 2. AnÃ¡lise de peso e crescimento
      const weightAnalysis = this.analyzeWeightGrowth(animal)
      if (weightAnalysis.recommendation) {
        recommendations.recommendations.push(weightAnalysis.recommendation)
      }

      // 3. AnÃ¡lise de saÃºde
      const healthAnalysis = this.analyzeHealth(animal)
      if (healthAnalysis.alerts.length > 0) {
        recommendations.alerts.push(...healthAnalysis.alerts)
      }

      // 4. AnÃ¡lise reprodutiva (para fÃªmeas)
      if (animal.sexo && (animal.sexo.toLowerCase().includes('fÃªmea') || animal.sexo.toLowerCase().includes('femea'))) {
        const reproAnalysis = this.analyzeReproduction(animal)
        if (reproAnalysis.recommendations.length > 0) {
          recommendations.recommendations.push(...reproAnalysis.recommendations)
        }
      }

      // 5. AnÃ¡lise de custos
      const costAnalysis = this.analyzeCosts(animal)
      if (costAnalysis.insights.length > 0) {
        recommendations.insights.push(...costAnalysis.insights)
      }

      // 6. PrevisÃ£o de ganho de peso
      const weightPrediction = this.predictWeightGain(animal)
      if (weightPrediction) {
        recommendations.insights.push({
          type: 'prediction',
          title: 'PrevisÃ£o de Peso',
          description: weightPrediction
        })
      }

      return recommendations
    } catch (error) {
      logger.error('Erro ao gerar recomendaÃ§Ãµes:', error)
      throw error
    }
  }

  /**
   * Analisa crescimento de peso
   */
  analyzeWeightGrowth(animal) {
    const idadeMeses = this.calculateAgeInMonths(animal.dataNascimento || animal.data_nascimento)
    const pesoAtual = parseFloat(animal.peso) || 0
    const pesoEsperado = this.calculateExpectedWeight(idadeMeses, animal.sexo, animal.raca)

    if (pesoAtual > 0 && pesoEsperado > 0) {
      const percentual = (pesoAtual / pesoEsperado) * 100

      if (percentual < 85) {
        return {
          recommendation: {
            type: 'health',
            priority: 'high',
            title: 'Peso abaixo do esperado',
            description: `Animal com ${percentual.toFixed(1)}% do peso esperado para a idade`,
            action: 'Verificar saÃºde e condiÃ§Ãµes gerais'
          }
        }
      } else if (percentual > 115) {
        return {
          recommendation: {
            type: 'health',
            priority: 'medium',
            title: 'Peso acima do esperado',
            description: `Animal com ${percentual.toFixed(1)}% do peso esperado`,
            action: 'Monitorar saÃºde'
          }
        }
      }
    }

    return {}
  }

  /**
   * Calcula peso esperado para idade
   */
  calculateExpectedWeight(idadeMeses, sexo, raca) {
    // FÃ³rmula simplificada baseada em mÃ©dias da raÃ§a Nelore
    const baseWeight = sexo && sexo.toLowerCase().includes('macho') ? 250 : 220
    const monthlyGain = sexo && sexo.toLowerCase().includes('macho') ? 15 : 12
    
    return baseWeight + (idadeMeses * monthlyGain)
  }

  /**
   * Analisa saÃºde do animal
   */
  analyzeHealth(animal) {
    const alerts = []
    const idadeMeses = this.calculateAgeInMonths(animal.dataNascimento || animal.data_nascimento)

    // Verificar vacinaÃ§Ã£o
    if (idadeMeses > 6 && !animal.vacinado) {
      alerts.push({
        type: 'health',
        priority: 'high',
        title: 'VacinaÃ§Ã£o pendente',
        description: 'Animal com mais de 6 meses sem registro de vacinaÃ§Ã£o',
        action: 'Verificar calendÃ¡rio de vacinaÃ§Ã£o'
      })
    }

    // Verificar ocorrÃªncias recentes
    if (animal.ultima_ocorrencia) {
      const diasDesdeOcorrencia = this.calculateDaysSince(animal.ultima_ocorrencia)
      if (diasDesdeOcorrencia < 30) {
        alerts.push({
          type: 'health',
          priority: 'medium',
          title: 'OcorrÃªncia recente',
          description: `ÃÅ¡ltima ocorrÃªncia hÃ¡ ${diasDesdeOcorrencia} dias`,
          action: 'Monitorar recuperaÃ§Ã£o'
        })
      }
    }

    return { alerts }
  }

  /**
   * Analisa reproduÃ§Ã£o (para fÃªmeas)
   */
  analyzeReproduction(animal) {
    const recommendations = []
    const idadeMeses = this.calculateAgeInMonths(animal.dataNascimento || animal.data_nascimento)

    // Verificar idade para reproduÃ§Ã£o
    if (idadeMeses >= 14 && idadeMeses <= 18 && !animal.prenha) {
      recommendations.push({
        type: 'reproduction',
        priority: 'medium',
        title: 'Idade ideal para reproduÃ§Ã£o',
        description: 'Animal na faixa etÃ¡ria ideal para primeira cobertura',
        action: 'Considerar inseminaÃ§Ã£o ou monta natural'
      })
    }

    // Verificar intervalo entre partos
    if (animal.ultimo_parto) {
      const mesesDesdeParto = this.calculateMonthsSince(animal.ultimo_parto)
      if (mesesDesdeParto >= 3 && mesesDesdeParto <= 6 && !animal.prenha) {
        recommendations.push({
          type: 'reproduction',
          priority: 'high',
          title: 'PerÃ­odo ideal para nova gestaÃ§Ã£o',
          description: `ÃÅ¡ltimo parto hÃ¡ ${mesesDesdeParto} meses`,
          action: 'Considerar nova cobertura'
        })
      }
    }

    return { recommendations }
  }

  /**
   * Analisa custos
   */
  analyzeCosts(animal) {
    const insights = []
    const custoTotal = parseFloat(animal.custoTotal || animal.custo_total) || 0
    const idadeMeses = this.calculateAgeInMonths(animal.dataNascimento || animal.data_nascimento)

    if (custoTotal > 0 && idadeMeses > 0) {
      const custoMensal = custoTotal / idadeMeses
      
      if (custoMensal > 200) {
        insights.push({
          type: 'cost',
          title: 'Custo mensal elevado',
          description: `Custo mÃ©dio de R$ ${custoMensal.toFixed(2)}/mÃªs`,
          action: 'Revisar custos e otimizar gastos'
        })
      }
    }

    return { insights }
  }

  /**
   * PrevisÃ£o de ganho de peso
   */
  predictWeightGain(animal) {
    const pesoAtual = parseFloat(animal.peso) || 0
    const idadeMeses = this.calculateAgeInMonths(animal.dataNascimento || animal.data_nascimento)

    if (pesoAtual > 0 && idadeMeses > 0) {
      const ganhoMensalMedio = pesoAtual / idadeMeses
      const pesoEm6Meses = pesoAtual + (ganhoMensalMedio * 6)
      const pesoEm12Meses = pesoAtual + (ganhoMensalMedio * 12)

      return `PrevisÃ£o: ${pesoEm6Meses.toFixed(0)}kg em 6 meses, ${pesoEm12Meses.toFixed(0)}kg em 12 meses (baseado em ganho mÃ©dio atual)`
    }

    return null
  }

  /**
   * PrevisÃ£o de risco de saÃºde
   */
  predictHealthRisk(animal) {
    // Implementar modelo de prediÃ§Ã£o de saÃºde
    return {
      risk_level: 'low',
      factors: []
    }
  }

  /**
   * PrevisÃ£o de sucesso reprodutivo
   */
  predictReproductionSuccess(animal) {
    // Implementar modelo de prediÃ§Ã£o reprodutiva
    return {
      success_probability: 0.75,
      factors: []
    }
  }

  /**
   * PrevisÃ£o de melhor momento para venda
   */
  predictOptimalSaleTime(animal) {
    const idadeMeses = this.calculateAgeInMonths(animal.dataNascimento || animal.data_nascimento)
    const pesoAtual = parseFloat(animal.peso) || 0

    if (pesoAtual >= 450 && idadeMeses >= 24) {
      return {
        optimal: true,
        message: 'Animal no peso e idade ideais para venda'
      }
    }

    const mesesParaPesoIdeal = pesoAtual > 0 ? Math.ceil((450 - pesoAtual) / 15) : null
    const mesesParaIdadeIdeal = idadeMeses < 24 ? 24 - idadeMeses : 0

    return {
      optimal: false,
      meses_para_peso_ideal: mesesParaPesoIdeal,
      meses_para_idade_ideal: mesesParaIdadeIdeal,
      message: `Aguardar aproximadamente ${Math.max(mesesParaPesoIdeal || 0, mesesParaIdadeIdeal)} meses para condiÃ§Ãµes ideais`
    }
  }

  /**
   * Calcula idade em meses
   */
  calculateAgeInMonths(dataNascimento) {
    if (!dataNascimento) return 0
    try {
      const nascimento = new Date(dataNascimento)
      const hoje = new Date()
      const diffTime = Math.abs(hoje - nascimento)
      return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30))
    } catch {
      return 0
    }
  }

  /**
   * Calcula dias desde uma data
   */
  calculateDaysSince(date) {
    if (!date) return 0
    try {
      const data = new Date(date)
      const hoje = new Date()
      const diffTime = Math.abs(hoje - data)
      return Math.floor(diffTime / (1000 * 60 * 60 * 24))
    } catch {
      return 0
    }
  }

  /**
   * Calcula meses desde uma data
   */
  calculateMonthsSince(date) {
    if (!date) return 0
    try {
      const data = new Date(date)
      const hoje = new Date()
      const diffTime = Math.abs(hoje - data)
      return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30))
    } catch {
      return 0
    }
  }
}

export default new AIIntelligenceService()
