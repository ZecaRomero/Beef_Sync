// Sistema de anÃ¡lise avanÃ§ada para Beef Sync
import { query } from '../lib/database'

class AdvancedAnalytics {
  constructor() {
    this.cache = new Map()
    this.cacheTTL = 10 * 60 * 1000 // 10 minutos
  }

  // AnÃ¡lise de performance do rebanho
  async analyzeHerdPerformance() {
    try {
      console.log('ðÅ¸â€œÅ  Analisando performance do rebanho...')

      const analysis = {
        timestamp: new Date(),
        overview: {},
        trends: {},
        recommendations: []
      }

      // Dados bÃ¡sicos do rebanho
      const herdData = await query(`
        SELECT 
          COUNT(*) as total_animais,
          COUNT(CASE WHEN situacao = 'Ativo' THEN 1 END) as animais_ativos,
          COUNT(CASE WHEN situacao = 'Vendido' THEN 1 END) as animais_vendidos,
          COUNT(CASE WHEN situacao = 'Morto' THEN 1 END) as animais_mortos,
          AVG(meses) as idade_media,
          COUNT(CASE WHEN sexo = 'Macho' THEN 1 END) as machos,
          COUNT(CASE WHEN sexo = 'FÃªmea' THEN 1 END) as femeas
        FROM animais
      `)

      analysis.overview = herdData.rows[0]

      // AnÃ¡lise de custos
      const costAnalysis = await query(`
        SELECT 
          AVG(c.total_custo) as custo_medio,
          MAX(c.total_custo) as custo_maximo,
          MIN(c.total_custo) as custo_minimo,
          COUNT(CASE WHEN c.total_custo > 8000 THEN 1 END) as animais_custo_alto
        FROM (
          SELECT animal_id, SUM(valor) as total_custo
          FROM custos
          GROUP BY animal_id
        ) c
      `)

      analysis.overview.custo_medio = costAnalysis.rows[0]?.custo_medio || 0
      analysis.overview.custo_maximo = costAnalysis.rows[0]?.custo_maximo || 0
      analysis.overview.custo_minimo = costAnalysis.rows[0]?.custo_minimo || 0
      analysis.overview.animais_custo_alto = costAnalysis.rows[0]?.animais_custo_alto || 0

      // TendÃªncias de nascimentos
      const birthTrends = await query(`
        SELECT 
          DATE_TRUNC('month', data_nascimento) as mes,
          COUNT(*) as nascimentos
        FROM nascimentos
        WHERE data_nascimento >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', data_nascimento)
        ORDER BY mes
      `)

      analysis.trends.nascimentos = birthTrends.rows

      // TendÃªncias de vendas
      const salesTrends = await query(`
        SELECT 
          DATE_TRUNC('month', updated_at) as mes,
          COUNT(*) as vendas
        FROM animais
        WHERE situacao = 'Vendido' 
          AND updated_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', updated_at)
        ORDER BY mes
      `)

      analysis.trends.vendas = salesTrends.rows

      // Gerar recomendaÃ§Ãµes
      if (analysis.overview.animais_custo_alto > analysis.overview.total_animais * 0.2) {
        analysis.recommendations.push({
          type: 'cost',
          priority: 'high',
          message: `${analysis.overview.animais_custo_alto} animais com custo alto (>R$ 8.000)`,
          action: 'Revisar estratÃ©gia de custos para animais de alto valor'
        })
      }

      if (analysis.overview.idade_media > 30) {
        analysis.recommendations.push({
          type: 'age',
          priority: 'medium',
          message: `Idade mÃ©dia do rebanho: ${analysis.overview.idade_media.toFixed(1)} meses`,
          action: 'Considerar renovaÃ§Ã£o do rebanho'
        })
      }

      return analysis

    } catch (error) {
      console.error('â�Å’ Erro na anÃ¡lise de performance do rebanho:', error)
      throw error
    }
  }

  // AnÃ¡lise de rentabilidade
  async analyzeProfitability() {
    try {
      console.log('ðÅ¸â€™° Analisando rentabilidade...')

      const analysis = {
        timestamp: new Date(),
        metrics: {},
        trends: {},
        recommendations: []
      }

      // MÃ©tricas de rentabilidade
      const profitabilityMetrics = await query(`
        SELECT 
          a.id,
          a.serie,
          a.rg,
          a.meses,
          a.situacao,
          COALESCE(c.total_custo, 0) as custo_total,
          COALESCE(v.valor_venda, 0) as valor_venda,
          CASE 
            WHEN v.valor_venda > 0 THEN v.valor_venda - COALESCE(c.total_custo, 0)
            ELSE 0
          END as lucro,
          CASE 
            WHEN c.total_custo > 0 THEN 
              ((v.valor_venda - COALESCE(c.total_custo, 0)) / c.total_custo) * 100
            ELSE 0
          END as roi_percentual
        FROM animais a
        LEFT JOIN (
          SELECT animal_id, SUM(valor) as total_custo
          FROM custos
          GROUP BY animal_id
        ) c ON a.id = c.animal_id
        LEFT JOIN (
          SELECT animal_id, MAX(valor) as valor_venda
          FROM custos
          WHERE tipo = 'Venda'
          GROUP BY animal_id
        ) v ON a.id = v.animal_id
        WHERE a.situacao = 'Vendido'
      `)

      const vendidos = profitabilityMetrics.rows
      const totalVendidos = vendidos.length
      const totalCusto = vendidos.reduce((sum, a) => sum + a.custo_total, 0)
      const totalReceita = vendidos.reduce((sum, a) => sum + a.valor_venda, 0)
      const totalLucro = vendidos.reduce((sum, a) => sum + a.lucro, 0)

      analysis.metrics = {
        total_vendidos: totalVendidos,
        total_custo: totalCusto,
        total_receita: totalReceita,
        total_lucro: totalLucro,
        roi_medio: totalVendidos > 0 ? (totalLucro / totalCusto) * 100 : 0,
        margem_bruta: totalReceita > 0 ? (totalLucro / totalReceita) * 100 : 0
      }

      // AnÃ¡lise por faixa etÃ¡ria
      const ageAnalysis = await query(`
        SELECT 
          CASE 
            WHEN meses <= 12 THEN '0-12 meses'
            WHEN meses <= 24 THEN '13-24 meses'
            WHEN meses <= 36 THEN '25-36 meses'
            ELSE '36+ meses'
          END as faixa_etaria,
          COUNT(*) as quantidade,
          AVG(custo_total) as custo_medio,
          AVG(valor_venda) as receita_media,
          AVG(lucro) as lucro_medio,
          AVG(roi_percentual) as roi_medio
        FROM (
          SELECT 
            a.meses,
            COALESCE(c.total_custo, 0) as custo_total,
            COALESCE(v.valor_venda, 0) as valor_venda,
            CASE 
              WHEN v.valor_venda > 0 THEN v.valor_venda - COALESCE(c.total_custo, 0)
              ELSE 0
            END as lucro,
            CASE 
              WHEN c.total_custo > 0 THEN 
                ((v.valor_venda - COALESCE(c.total_custo, 0)) / c.total_custo) * 100
              ELSE 0
            END as roi_percentual
          FROM animais a
          LEFT JOIN (
            SELECT animal_id, SUM(valor) as total_custo
            FROM custos
            GROUP BY animal_id
          ) c ON a.id = c.animal_id
          LEFT JOIN (
            SELECT animal_id, MAX(valor) as valor_venda
            FROM custos
            WHERE tipo = 'Venda'
            GROUP BY animal_id
          ) v ON a.id = v.animal_id
          WHERE a.situacao = 'Vendido'
        ) subquery
        GROUP BY faixa_etaria
        ORDER BY faixa_etaria
      `)

      analysis.trends.por_faixa_etaria = ageAnalysis.rows

      // Gerar recomendaÃ§Ãµes
      if (analysis.metrics.roi_medio < 15) {
        analysis.recommendations.push({
          type: 'profitability',
          priority: 'high',
          message: `ROI mÃ©dio baixo: ${analysis.metrics.roi_medio.toFixed(1)}%`,
          action: 'Otimizar custos ou melhorar preÃ§os de venda'
        })
      }

      if (analysis.metrics.margem_bruta < 20) {
        analysis.recommendations.push({
          type: 'margin',
          priority: 'medium',
          message: `Margem bruta baixa: ${analysis.metrics.margem_bruta.toFixed(1)}%`,
          action: 'Revisar estratÃ©gia de precificaÃ§Ã£o'
        })
      }

      return analysis

    } catch (error) {
      console.error('â�Å’ Erro na anÃ¡lise de rentabilidade:', error)
      throw error
    }
  }

  // AnÃ¡lise de reproduÃ§Ã£o
  async analyzeReproduction() {
    try {
      console.log('ðÅ¸�â€ž Analisando performance reprodutiva...')

      const analysis = {
        timestamp: new Date(),
        metrics: {},
        trends: {},
        recommendations: []
      }

      // MÃ©tricas de reproduÃ§Ã£o
      const reproductionMetrics = await query(`
        SELECT 
          COUNT(DISTINCT g.animal_id) as femeas_gestantes,
          COUNT(g.id) as total_gestacoes,
          COUNT(n.id) as total_nascimentos,
          COUNT(CASE WHEN n.id IS NOT NULL THEN 1 END) as gestacoes_sucesso,
          AVG(EXTRACT(DAYS FROM (n.data_nascimento - g.data_gestacao))) as gestacao_media_dias
        FROM gestacoes g
        LEFT JOIN nascimentos n ON g.animal_id = n.animal_id
        WHERE g.data_gestacao >= NOW() - INTERVAL '24 months'
      `)

      analysis.metrics = reproductionMetrics.rows[0] || {}

      // Taxa de sucesso reprodutivo
      const successRate = analysis.metrics.total_gestacoes > 0 ? 
        (analysis.metrics.gestacoes_sucesso / analysis.metrics.total_gestacoes) * 100 : 0

      analysis.metrics.taxa_sucesso = successRate

      // AnÃ¡lise por mÃªs
      const monthlyAnalysis = await query(`
        SELECT 
          DATE_TRUNC('month', g.data_gestacao) as mes,
          COUNT(g.id) as gestacoes,
          COUNT(n.id) as nascimentos,
          CASE 
            WHEN COUNT(g.id) > 0 THEN (COUNT(n.id) / COUNT(g.id)) * 100
            ELSE 0
          END as taxa_sucesso
        FROM gestacoes g
        LEFT JOIN nascimentos n ON g.animal_id = n.animal_id
        WHERE g.data_gestacao >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', g.data_gestacao)
        ORDER BY mes
      `)

      analysis.trends.mensal = monthlyAnalysis.rows

      // AnÃ¡lise por idade da fÃªmea
      const ageAnalysis = await query(`
        SELECT 
          CASE 
            WHEN a.meses <= 24 THEN '18-24 meses'
            WHEN a.meses <= 36 THEN '25-36 meses'
            WHEN a.meses <= 48 THEN '37-48 meses'
            ELSE '48+ meses'
          END as faixa_idade,
          COUNT(g.id) as gestacoes,
          COUNT(n.id) as nascimentos,
          CASE 
            WHEN COUNT(g.id) > 0 THEN (COUNT(n.id) / COUNT(g.id)) * 100
            ELSE 0
          END as taxa_sucesso
        FROM gestacoes g
        JOIN animais a ON g.animal_id = a.id
        LEFT JOIN nascimentos n ON g.animal_id = n.animal_id
        WHERE g.data_gestacao >= NOW() - INTERVAL '24 months'
        GROUP BY faixa_idade
        ORDER BY faixa_idade
      `)

      analysis.trends.por_idade = ageAnalysis.rows

      // Gerar recomendaÃ§Ãµes
      if (successRate < 70) {
        analysis.recommendations.push({
          type: 'reproduction',
          priority: 'high',
          message: `Taxa de sucesso reprodutivo baixa: ${successRate.toFixed(1)}%`,
          action: 'Investigar causas de falhas reprodutivas'
        })
      }

      if (analysis.metrics.gestacao_media_dias > 285) {
        analysis.recommendations.push({
          type: 'gestation',
          priority: 'medium',
          message: `GestaÃ§Ã£o mÃ©dia longa: ${analysis.metrics.gestacao_media_dias.toFixed(0)} dias`,
          action: 'Verificar precisÃ£o dos dados de gestaÃ§Ã£o'
        })
      }

      return analysis

    } catch (error) {
      console.error('â�Å’ Erro na anÃ¡lise de reproduÃ§Ã£o:', error)
      throw error
    }
  }

  // AnÃ¡lise de custos
  async analyzeCosts() {
    try {
      console.log('ðÅ¸â€™¸ Analisando custos...')

      const analysis = {
        timestamp: new Date(),
        metrics: {},
        trends: {},
        recommendations: []
      }

      // MÃ©tricas de custos
      const costMetrics = await query(`
        SELECT 
          COUNT(*) as total_custos,
          SUM(valor) as valor_total,
          AVG(valor) as valor_medio,
          MAX(valor) as valor_maximo,
          MIN(valor) as valor_minimo,
          COUNT(DISTINCT animal_id) as animais_com_custo
        FROM custos
        WHERE data >= NOW() - INTERVAL '12 months'
      `)

      analysis.metrics = costMetrics.rows[0] || {}

      // AnÃ¡lise por tipo de custo
      const costByType = await query(`
        SELECT 
          tipo,
          COUNT(*) as quantidade,
          SUM(valor) as valor_total,
          AVG(valor) as valor_medio,
          (SUM(valor) / (SELECT SUM(valor) FROM custos WHERE data >= NOW() - INTERVAL '12 months')) * 100 as percentual
        FROM custos
        WHERE data >= NOW() - INTERVAL '12 months'
        GROUP BY tipo
        ORDER BY valor_total DESC
      `)

      analysis.trends.por_tipo = costByType.rows

      // AnÃ¡lise mensal
      const monthlyCosts = await query(`
        SELECT 
          DATE_TRUNC('month', data) as mes,
          COUNT(*) as quantidade,
          SUM(valor) as valor_total,
          AVG(valor) as valor_medio
        FROM custos
        WHERE data >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', data)
        ORDER BY mes
      `)

      analysis.trends.mensal = monthlyCosts.rows

      // AnÃ¡lise por animal
      const costByAnimal = await query(`
        SELECT 
          a.serie,
          a.rg,
          a.meses,
          COUNT(c.id) as total_custos,
          SUM(c.valor) as custo_total,
          AVG(c.valor) as custo_medio,
          MAX(c.valor) as custo_maximo
        FROM animais a
        JOIN custos c ON a.id = c.animal_id
        WHERE c.data >= NOW() - INTERVAL '12 months'
        GROUP BY a.id, a.serie, a.rg, a.meses
        ORDER BY custo_total DESC
        LIMIT 10
      `)

      analysis.trends.por_animal = costByAnimal.rows

      // Gerar recomendaÃ§Ãµes
      if (analysis.metrics.valor_medio > 500) {
        analysis.recommendations.push({
          type: 'cost',
          priority: 'medium',
          message: `Custo mÃ©dio alto: R$ ${analysis.metrics.valor_medio.toFixed(2)}`,
          action: 'Revisar estratÃ©gia de custos'
        })
      }

      const protocolosPercentual = analysis.trends.por_tipo.find(t => t.tipo === 'Protocolo')?.percentual || 0
      if (protocolosPercentual > 40) {
        analysis.recommendations.push({
          type: 'protocol',
          priority: 'low',
          message: `Protocolos representam ${protocolosPercentual.toFixed(1)}% dos custos`,
          action: 'Otimizar protocolos sanitÃ¡rios'
        })
      }

      return analysis

    } catch (error) {
      console.error('â�Å’ Erro na anÃ¡lise de custos:', error)
      throw error
    }
  }

  // AnÃ¡lise completa do sistema
  async generateCompleteAnalysis() {
    try {
      console.log('ðÅ¸â€�� Gerando anÃ¡lise completa do sistema...')

      const [herdAnalysis, profitabilityAnalysis, reproductionAnalysis, costAnalysis] = await Promise.all([
        this.analyzeHerdPerformance(),
        this.analyzeProfitability(),
        this.analyzeReproduction(),
        this.analyzeCosts()
      ])

      const completeAnalysis = {
        timestamp: new Date(),
        herd: herdAnalysis,
        profitability: profitabilityAnalysis,
        reproduction: reproductionAnalysis,
        costs: costAnalysis,
        summary: {
          total_recommendations: [
            ...herdAnalysis.recommendations,
            ...profitabilityAnalysis.recommendations,
            ...reproductionAnalysis.recommendations,
            ...costAnalysis.recommendations
          ].length,
          priority_high: [
            ...herdAnalysis.recommendations,
            ...profitabilityAnalysis.recommendations,
            ...reproductionAnalysis.recommendations,
            ...costAnalysis.recommendations
          ].filter(r => r.priority === 'high').length,
          priority_medium: [
            ...herdAnalysis.recommendations,
            ...profitabilityAnalysis.recommendations,
            ...reproductionAnalysis.recommendations,
            ...costAnalysis.recommendations
          ].filter(r => r.priority === 'medium').length,
          priority_low: [
            ...herdAnalysis.recommendations,
            ...profitabilityAnalysis.recommendations,
            ...reproductionAnalysis.recommendations,
            ...costAnalysis.recommendations
          ].filter(r => r.priority === 'low').length
        }
      }

      return completeAnalysis

    } catch (error) {
      console.error('â�Å’ Erro na anÃ¡lise completa:', error)
      throw error
    }
  }

  // Obter anÃ¡lise com cache
  async getCachedAnalysis(type, forceRefresh = false) {
    const cacheKey = `analysis:${type}`
    
    if (!forceRefresh && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheTTL) {
        console.log(`ðÅ¸â€œ¦ AnÃ¡lise ${type} carregada do cache`)
        return cached.data
      }
    }

    let analysis
    switch (type) {
      case 'herd':
        analysis = await this.analyzeHerdPerformance()
        break
      case 'profitability':
        analysis = await this.analyzeProfitability()
        break
      case 'reproduction':
        analysis = await this.analyzeReproduction()
        break
      case 'costs':
        analysis = await this.analyzeCosts()
        break
      case 'complete':
        analysis = await this.generateCompleteAnalysis()
        break
      default:
        throw new Error(`Tipo de anÃ¡lise nÃ£o suportado: ${type}`)
    }

    this.cache.set(cacheKey, {
      data: analysis,
      timestamp: Date.now()
    })

    return analysis
  }

  // Limpar cache
  clearCache() {
    this.cache.clear()
    console.log('ðÅ¸â€”â€˜ï¸� Cache de anÃ¡lises limpo')
  }
}

// InstÃ¢ncia singleton
const advancedAnalytics = new AdvancedAnalytics()

export default advancedAnalytics
export { AdvancedAnalytics }
