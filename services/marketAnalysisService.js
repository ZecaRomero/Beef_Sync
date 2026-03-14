/**
 * ServiÃ§o de AnÃ¡lise de Mercado e RecomendaÃ§Ã£o de Vendas
 * Analisa condiÃ§Ãµes de mercado e determina se animais estÃ£o aptos para venda
 */

import logger from '../utils/logger'

class MarketAnalysisService {
  constructor() {
    this.marketPrices = {
      // PreÃ§os mÃ©dios por categoria (R$/@)
      novilho_gordo: { min: 280, max: 320, media: 300 },
      boi_gordo: { min: 270, max: 310, media: 290 },
      vaca_gorda: { min: 250, max: 290, media: 270 },
      novilha_gorda: { min: 260, max: 300, media: 280 },
      touro: { min: 300, max: 350, media: 325 },
      bezerro: { min: 150, max: 200, media: 175 }
    }
    
    this.seasonalFactors = {
      // Fatores sazonais (multiplicadores)
      janeiro: 1.05, fevereiro: 1.03, marco: 1.00,
      abril: 0.98, maio: 0.95, junho: 0.97,
      julho: 0.99, agosto: 1.02, setembro: 1.04,
      outubro: 1.06, novembro: 1.08, dezembro: 1.10
    }
  }

  /**
   * Analisa se um animal estÃ¡ apto para venda conforme mercado
   * @param {Object} animal - Dados do animal
   * @returns {Object} AnÃ¡lise de aptidÃ£o para venda
   */
  async analyzeSaleReadiness(animal) {
    try {
      const analysis = {
        animal_id: animal.id,
        identificacao: `${animal.serie || ''}${animal.rg || ''}`,
        apto_venda: false,
        recomendacao: 'NÃ£o recomendado',
        score: 0,
        fatores: [],
        valor_estimado_mercado: 0,
        valor_atual: parseFloat(animal.custoTotal || animal.custo_total) || 0,
        roi_estimado: 0,
        justificativa: []
      }

      // 1. Verificar idade e peso mÃ­nimo
      const idadeMeses = this.calculateAgeInMonths(animal.dataNascimento || animal.data_nascimento)
      const peso = parseFloat(animal.peso) || 0
      
      if (idadeMeses >= 18 && peso >= 300) {
        analysis.fatores.push('Idade e peso adequados')
        analysis.score += 30
      } else {
        analysis.justificativa.push(`Idade: ${idadeMeses} meses, Peso: ${peso}kg - Abaixo do ideal para venda`)
      }

      // 2. Verificar custo acumulado vs valor de mercado
      const valorMercado = this.estimateMarketValue(animal, peso)
      analysis.valor_estimado_mercado = valorMercado
      
      if (valorMercado > analysis.valor_atual * 1.2) {
        analysis.fatores.push('Valor de mercado favorÃ¡vel')
        analysis.score += 25
        analysis.roi_estimado = ((valorMercado - analysis.valor_atual) / analysis.valor_atual) * 100
      } else {
        analysis.justificativa.push(`ROI estimado: ${(((valorMercado - analysis.valor_atual) / analysis.valor_atual) * 100).toFixed(1)}% - Abaixo do ideal`)
      }

      // 3. Verificar saÃºde e status
      if (animal.situacao === 'Ativo' && !animal.doente) {
        analysis.fatores.push('Animal saudÃ¡vel')
        analysis.score += 20
      } else {
        analysis.justificativa.push('Animal com problemas de saÃºde ou status inadequado')
      }

      // 4. Verificar sazonalidade
      const seasonalFactor = this.getSeasonalFactor()
      if (seasonalFactor >= 1.0) {
        analysis.fatores.push('Ãâ€°poca favorÃ¡vel para venda')
        analysis.score += 15
      } else {
        analysis.justificativa.push(`Fator sazonal: ${(seasonalFactor * 100).toFixed(0)}% - NÃ£o Ã© a melhor Ã©poca`)
      }

      // 5. Verificar raÃ§a e genÃ©tica
      if (animal.raca && ['Nelore', 'Angus', 'Brahman', 'Hereford'].includes(animal.raca)) {
        analysis.fatores.push('RaÃ§a valorizada no mercado')
        analysis.score += 10
      }

      // Determinar recomendaÃ§Ã£o final
      if (analysis.score >= 70) {
        analysis.apto_venda = true
        analysis.recomendacao = 'Altamente Recomendado'
      } else if (analysis.score >= 50) {
        analysis.apto_venda = true
        analysis.recomendacao = 'Recomendado'
      } else if (analysis.score >= 30) {
        analysis.recomendacao = 'Avaliar com Cautela'
      } else {
        analysis.recomendacao = 'NÃ£o Recomendado'
      }

      return analysis
    } catch (error) {
      logger.error('Erro ao analisar aptidÃ£o para venda:', error)
      throw error
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
      const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30))
      return diffMonths
    } catch {
      return 0
    }
  }

  /**
   * Estima valor de mercado do animal
   */
  estimateMarketValue(animal, peso) {
    const sexo = (animal.sexo || '').toLowerCase()
    const idadeMeses = this.calculateAgeInMonths(animal.dataNascimento || animal.data_nascimento)
    
    let categoria = 'novilho_gordo'
    
    if (sexo.includes('fÃªmea') || sexo.includes('femea')) {
      if (idadeMeses < 24) {
        categoria = 'novilha_gorda'
      } else {
        categoria = 'vaca_gorda'
      }
    } else if (sexo.includes('macho')) {
      if (idadeMeses < 24) {
        categoria = 'novilho_gordo'
      } else if (idadeMeses < 36) {
        categoria = 'boi_gordo'
      } else {
        categoria = 'touro'
      }
    }

    const precoBase = this.marketPrices[categoria] || this.marketPrices.novilho_gordo
    const fatorSazonal = this.getSeasonalFactor()
    const precoAjustado = precoBase.media * fatorSazonal
    
    // Calcular valor total (preÃ§o por @ * peso em arrobas)
    const pesoArrobas = peso / 15 // 1 arroba = 15kg
    const valorTotal = precoAjustado * pesoArrobas
    
    return Math.round(valorTotal)
  }

  /**
   * ObtÃ©m fator sazonal do mÃªs atual
   */
  getSeasonalFactor() {
    const mes = new Date().toLocaleString('pt-BR', { month: 'long' }).toLowerCase()
    return this.seasonalFactors[mes] || 1.0
  }

  /**
   * Analisa mÃºltiplos animais e retorna os mais aptos para venda
   */
  async analyzeMultipleAnimals(animais) {
    try {
      const analyses = await Promise.all(
        animais.map(animal => this.analyzeSaleReadiness(animal))
      )
      
      // Ordenar por score (maior primeiro)
      analyses.sort((a, b) => b.score - a.score)
      
      return {
        total_analisados: analyses.length,
        aptos_venda: analyses.filter(a => a.apto_venda).length,
        recomendados: analyses.filter(a => a.score >= 70).length,
        analises: analyses
      }
    } catch (error) {
      logger.error('Erro ao analisar mÃºltiplos animais:', error)
      throw error
    }
  }

  /**
   * Atualiza preÃ§os de mercado (pode ser chamado periodicamente)
   */
  updateMarketPrices(newPrices) {
    this.marketPrices = { ...this.marketPrices, ...newPrices }
    logger.info('PreÃ§os de mercado atualizados')
  }
}

export default new MarketAnalysisService()
