/**
 * Serviço de Inteligência Artificial Avançado
 * Fornece análises preditivas, recomendações inteligentes e insights automáticos
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
   * Gera recomendações inteligentes para um animal
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

      // 1. Análise de mercado
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
        logger.error('Erro na análise de mercado:', error)
      }

      // 2. Análise de peso e crescimento
      const weightAnalysis = this.analyzeWeightGrowth(animal)
      if (weightAnalysis.recommendation) {
        recommendations.recommendations.push(weightAnalysis.recommendation)
      }

      // 3. Análise de saúde
      const healthAnalysis = this.analyzeHealth(animal)
      if (healthAnalysis.alerts.length > 0) {
        recommendations.alerts.push(...healthAnalysis.alerts)
      }

      // 4. Análise reprodutiva (para fêmeas)
      if (animal.sexo && (animal.sexo.toLowerCase().includes('fêmea') || animal.sexo.toLowerCase().includes('femea'))) {
        const reproAnalysis = this.analyzeReproduction(animal)
        if (reproAnalysis.recommendations.length > 0) {
          recommendations.recommendations.push(...reproAnalysis.recommendations)
        }
      }

      // 5. Análise de custos
      const costAnalysis = this.analyzeCosts(animal)
      if (costAnalysis.insights.length > 0) {
        recommendations.insights.push(...costAnalysis.insights)
      }

      // 6. Previsão de ganho de peso
      const weightPrediction = this.predictWeightGain(animal)
      if (weightPrediction) {
        recommendations.insights.push({
          type: 'prediction',
          title: 'Previsão de Peso',
          description: weightPrediction
        })
      }

      return recommendations
    } catch (error) {
      logger.error('Erro ao gerar recomendações:', error)
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
            action: 'Verificar saúde e condições gerais'
          }
        }
      } else if (percentual > 115) {
        return {
          recommendation: {
            type: 'health',
            priority: 'medium',
            title: 'Peso acima do esperado',
            description: `Animal com ${percentual.toFixed(1)}% do peso esperado`,
            action: 'Monitorar saúde'
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
    // Fórmula simplificada baseada em médias da raça Nelore
    const baseWeight = sexo && sexo.toLowerCase().includes('macho') ? 250 : 220
    const monthlyGain = sexo && sexo.toLowerCase().includes('macho') ? 15 : 12
    
    return baseWeight + (idadeMeses * monthlyGain)
  }

  /**
   * Analisa saúde do animal
   */
  analyzeHealth(animal) {
    const alerts = []
    const idadeMeses = this.calculateAgeInMonths(animal.dataNascimento || animal.data_nascimento)

    // Verificar vacinação
    if (idadeMeses > 6 && !animal.vacinado) {
      alerts.push({
        type: 'health',
        priority: 'high',
        title: 'Vacinação pendente',
        description: 'Animal com mais de 6 meses sem registro de vacinação',
        action: 'Verificar calendário de vacinação'
      })
    }

    // Verificar ocorrências recentes
    if (animal.ultima_ocorrencia) {
      const diasDesdeOcorrencia = this.calculateDaysSince(animal.ultima_ocorrencia)
      if (diasDesdeOcorrencia < 30) {
        alerts.push({
          type: 'health',
          priority: 'medium',
          title: 'Ocorrência recente',
          description: `Última ocorrência há ${diasDesdeOcorrencia} dias`,
          action: 'Monitorar recuperação'
        })
      }
    }

    return { alerts }
  }

  /**
   * Analisa reprodução (para fêmeas)
   */
  analyzeReproduction(animal) {
    const recommendations = []
    const idadeMeses = this.calculateAgeInMonths(animal.dataNascimento || animal.data_nascimento)

    // Verificar idade para reprodução
    if (idadeMeses >= 14 && idadeMeses <= 18 && !animal.prenha) {
      recommendations.push({
        type: 'reproduction',
        priority: 'medium',
        title: 'Idade ideal para reprodução',
        description: 'Animal na faixa etária ideal para primeira cobertura',
        action: 'Considerar inseminação ou monta natural'
      })
    }

    // Verificar intervalo entre partos
    if (animal.ultimo_parto) {
      const mesesDesdeParto = this.calculateMonthsSince(animal.ultimo_parto)
      if (mesesDesdeParto >= 3 && mesesDesdeParto <= 6 && !animal.prenha) {
        recommendations.push({
          type: 'reproduction',
          priority: 'high',
          title: 'Período ideal para nova gestação',
          description: `Último parto há ${mesesDesdeParto} meses`,
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
          description: `Custo médio de R$ ${custoMensal.toFixed(2)}/mês`,
          action: 'Revisar custos e otimizar gastos'
        })
      }
    }

    return { insights }
  }

  /**
   * Previsão de ganho de peso
   */
  predictWeightGain(animal) {
    const pesoAtual = parseFloat(animal.peso) || 0
    const idadeMeses = this.calculateAgeInMonths(animal.dataNascimento || animal.data_nascimento)

    if (pesoAtual > 0 && idadeMeses > 0) {
      const ganhoMensalMedio = pesoAtual / idadeMeses
      const pesoEm6Meses = pesoAtual + (ganhoMensalMedio * 6)
      const pesoEm12Meses = pesoAtual + (ganhoMensalMedio * 12)

      return `Previsão: ${pesoEm6Meses.toFixed(0)}kg em 6 meses, ${pesoEm12Meses.toFixed(0)}kg em 12 meses (baseado em ganho médio atual)`
    }

    return null
  }

  /**
   * Previsão de risco de saúde
   */
  predictHealthRisk(animal) {
    // Implementar modelo de predição de saúde
    return {
      risk_level: 'low',
      factors: []
    }
  }

  /**
   * Previsão de sucesso reprodutivo
   */
  predictReproductionSuccess(animal) {
    // Implementar modelo de predição reprodutiva
    return {
      success_probability: 0.75,
      factors: []
    }
  }

  /**
   * Previsão de melhor momento para venda
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
      message: `Aguardar aproximadamente ${Math.max(mesesParaPesoIdeal || 0, mesesParaIdadeIdeal)} meses para condições ideais`
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
