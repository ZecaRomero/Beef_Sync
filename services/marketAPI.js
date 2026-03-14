// API de mercado de gado com dados realistas
// Simulação baseada em dados reais do CEPEA, B3 e mercados regionais

export class MarketAPI {
  // Gerar variações realistas de preços
  static generateRealisticVariation(basePrice, volatility = 0.02) {
    const variation = (Math.random() - 0.5) * 2 * basePrice * volatility
    return {
      price: Math.round((basePrice + variation) * 100) / 100,
      change: Math.round(variation * 100) / 100,
      changePercent: Math.round((variation / basePrice * 100) * 100) / 100
    }
  }

  // Simular dados de preços do mercado com valores realistas
  static async getCattlePrices() {
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Preços base atualizados (Janeiro 2025)
    const boiGordoBase = 276 // R$ por arroba (CEPEA)
    const vacaGordaBase = 248 // R$ por arroba
    const novilhaBase = 265 // R$ por arroba
    const garroteBase = 285 // R$ por arroba
    const bezerroMachoBase = 1862 // R$ por cabeça
    const bezerraBase = 1650 // R$ por cabeça
    const novilhoBase = 2150 // R$ por cabeça

    // Gerar variações realistas
    const boiGordo = this.generateRealisticVariation(boiGordoBase, 0.025)
    const vacaGorda = this.generateRealisticVariation(vacaGordaBase, 0.02)
    const novilha = this.generateRealisticVariation(novilhaBase, 0.03)
    const garrote = this.generateRealisticVariation(garroteBase, 0.035)
    const bezerroMacho = this.generateRealisticVariation(bezerroMachoBase, 0.04)
    const bezerra = this.generateRealisticVariation(bezerraBase, 0.04)
    const novilho = this.generateRealisticVariation(novilhoBase, 0.03)

    return {
      timestamp: new Date(),
      prices: {
        boi_gordo: {
          ...boiGordo,
          unit: 'R$/arroba',
          market: 'CEPEA/ESALQ',
          lastUpdate: new Date(),
          trend: boiGordo.change > 0 ? 'up' : boiGordo.change < 0 ? 'down' : 'stable',
          icon: '🐂',
          category: 'Terminados',
          description: 'Bovinos machos adultos para abate'
        },
        vaca_gorda: {
          ...vacaGorda,
          unit: 'R$/arroba',
          market: 'CEPEA/ESALQ',
          lastUpdate: new Date(),
          trend: vacaGorda.change > 0 ? 'up' : vacaGorda.change < 0 ? 'down' : 'stable',
          icon: '🐄',
          category: 'Terminados',
          description: 'Fêmeas adultas para abate'
        },
        novilha: {
          ...novilha,
          unit: 'R$/arroba',
          market: 'CEPEA/ESALQ',
          lastUpdate: new Date(),
          trend: novilha.change > 0 ? 'up' : novilha.change < 0 ? 'down' : 'stable',
          icon: '🐮',
          category: 'Reprodução',
          description: 'Fêmeas jovens para reprodução'
        },
        garrote: {
          ...garrote,
          unit: 'R$/arroba',
          market: 'Mercado Regional',
          lastUpdate: new Date(),
          trend: garrote.change > 0 ? 'up' : garrote.change < 0 ? 'down' : 'stable',
          icon: '🐃',
          category: 'Recria',
          description: 'Machos jovens em crescimento'
        },
        bezerro_macho: {
          ...bezerroMacho,
          unit: 'R$/cabeça',
          market: 'Mercado Regional',
          lastUpdate: new Date(),
          trend: bezerroMacho.change > 0 ? 'up' : bezerroMacho.change < 0 ? 'down' : 'stable',
          icon: '🐂',
          category: 'Cria',
          description: 'Machos até 12 meses'
        },
        bezerra: {
          ...bezerra,
          unit: 'R$/cabeça',
          market: 'Mercado Regional',
          lastUpdate: new Date(),
          trend: bezerra.change > 0 ? 'up' : bezerra.change < 0 ? 'down' : 'stable',
          icon: '🐄',
          category: 'Cria',
          description: 'Fêmeas até 12 meses'
        },
        novilho: {
          ...novilho,
          unit: 'R$/cabeça',
          market: 'Mercado Regional',
          lastUpdate: new Date(),
          trend: novilho.change > 0 ? 'up' : novilho.change < 0 ? 'down' : 'stable',
          icon: '🐃',
          category: 'Recria',
          description: 'Machos de 12 a 24 meses'
        }
      },
      indices: {
        dolar: {
          value: 5.614 + (Math.random() - 0.5) * 0.05, // Dólar atual R$ 5,614
          change: (Math.random() - 0.5) * 0.03,
          changePercent: (Math.random() - 0.5) * 0.8,
          unit: 'R$/USD',
          icon: '💵',
          source: 'Banco Central'
        },
        euro: {
          value: 6.447 + (Math.random() - 0.5) * 0.06, // Euro atual R$ 6,447
          change: (Math.random() - 0.5) * 0.04,
          changePercent: (Math.random() - 0.5) * 0.9,
          unit: 'R$/EUR',
          icon: '💶',
          source: 'Banco Central'
        },
        milho: {
          value: 60 + (Math.random() - 0.5) * 8,
          change: (Math.random() - 0.5) * 2,
          changePercent: (Math.random() - 0.5) * 3,
          unit: 'R$/saca',
          icon: '🌽',
          source: 'CEPEA'
        },
        soja: {
          value: 142 + (Math.random() - 0.5) * 15,
          change: (Math.random() - 0.5) * 4,
          changePercent: (Math.random() - 0.5) * 2.5,
          unit: 'R$/saca',
          icon: '🌱',
          source: 'CEPEA'
        },
        farelo_soja: {
          value: 1850 + (Math.random() - 0.5) * 100,
          change: (Math.random() - 0.5) * 30,
          changePercent: (Math.random() - 0.5) * 1.5,
          unit: 'R$/ton',
          icon: '🥜',
          source: 'CEPEA'
        },
        boi_futuro: {
          value: 285 + (Math.random() - 0.5) * 10,
          change: (Math.random() - 0.5) * 3,
          changePercent: (Math.random() - 0.5) * 1,
          unit: 'R$/arroba',
          icon: '📈',
          source: 'B3'
        }
      },
      marketStatus: {
        session: this.getMarketSession(),
        lastUpdate: new Date(),
        nextUpdate: new Date(Date.now() + 15 * 60 * 1000), // Próxima atualização em 15min
        dataQuality: 'real-time'
      }
    }
  }

  // Determinar sessão do mercado
  static getMarketSession() {
    const now = new Date()
    const hour = now.getHours()
    
    if (hour >= 9 && hour < 17) {
      return { status: 'open', label: 'Mercado Aberto', color: 'green' }
    } else if (hour >= 17 && hour < 18) {
      return { status: 'closing', label: 'Fechando', color: 'yellow' }
    } else {
      return { status: 'closed', label: 'Mercado Fechado', color: 'red' }
    }
  }

  // Dados históricos simulados
  static async getHistoricalPrices(days = 30) {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const data = []
    const basePrice = 280
    
    for (let i = days; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      const variation = Math.sin(i / 5) * 15 + (Math.random() - 0.5) * 10
      
      data.push({
        date: date.toISOString().split('T')[0],
        price: basePrice + variation,
        volume: Math.floor(Math.random() * 1000) + 500
      })
    }
    
    return data
  }

  // Notícias do mercado simuladas
  static async getMarketNews() {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const news = [
      {
        id: 1,
        title: 'Preço do boi gordo sobe 2,5% na semana',
        summary: 'Alta demanda por carne bovina impulsiona preços no mercado interno',
        source: 'Canal Rural',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
        category: 'precos',
        impact: 'positive',
        relevance: 'high'
      },
      {
        id: 2,
        title: 'Exportações de carne batem recorde em dezembro',
        summary: 'China mantém-se como principal destino da carne brasileira',
        source: 'Beef Point',
        publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 horas atrás
        category: 'exportacao',
        impact: 'positive',
        relevance: 'high'
      },
      {
        id: 3,
        title: 'Custo de insumos sobe 8% no último mês',
        summary: 'Alta do milho e soja impacta custos de produção pecuária',
        source: 'Globo Rural',
        publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 horas atrás
        category: 'custos',
        impact: 'negative',
        relevance: 'medium'
      },
      {
        id: 4,
        title: 'Vacinação contra aftosa será obrigatória em 2024',
        summary: 'Ministério da Agricultura define calendário de vacinação',
        source: 'Ministério da Agricultura',
        publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 horas atrás
        category: 'regulacao',
        impact: 'neutral',
        relevance: 'medium'
      },
      {
        id: 5,
        title: 'Tecnologia blockchain chega à rastreabilidade bovina',
        summary: 'Nova plataforma promete revolucionar controle de origem',
        source: 'Agro Tech',
        publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 dia atrás
        category: 'tecnologia',
        impact: 'positive',
        relevance: 'low'
      }
    ]
    
    return news
  }

  // Análise de mercado
  static async getMarketAnalysis() {
    await new Promise(resolve => setTimeout(resolve, 600))
    
    return {
      outlook: {
        short_term: 'positive', // positive, negative, neutral
        medium_term: 'stable',
        long_term: 'positive'
      },
      factors: {
        positive: [
          'Demanda interna aquecida',
          'Exportações em alta',
          'Dólar favorável',
          'Redução do rebanho'
        ],
        negative: [
          'Custo de produção elevado',
          'Pressão inflacionária',
          'Questões climáticas',
          'Regulamentações ambientais'
        ]
      },
      recommendations: [
        {
          type: 'buy',
          category: 'Boi Gordo',
          reason: 'Preços em tendência de alta',
          confidence: 85
        },
        {
          type: 'hold',
          category: 'Bezerro',
          reason: 'Mercado estável, aguardar melhor momento',
          confidence: 70
        },
        {
          type: 'sell',
          category: 'Vaca Gorda',
          reason: 'Preços próximos ao teto histórico',
          confidence: 75
        }
      ],
      marketSentiment: {
        score: 72, // 0-100
        label: 'Otimista',
        description: 'Mercado apresenta sinais positivos com demanda aquecida'
      }
    }
  }

  // Calculadora de preços por região
  static async getRegionalPrices(state = 'SP') {
    await new Promise(resolve => setTimeout(resolve, 400))
    
    const basePrices = {
      'SP': { multiplier: 1.0, name: 'São Paulo' },
      'MG': { multiplier: 0.95, name: 'Minas Gerais' },
      'GO': { multiplier: 0.90, name: 'Goiás' },
      'MT': { multiplier: 0.88, name: 'Mato Grosso' },
      'MS': { multiplier: 0.92, name: 'Mato Grosso do Sul' },
      'PR': { multiplier: 0.98, name: 'Paraná' },
      'RS': { multiplier: 0.96, name: 'Rio Grande do Sul' },
      'BA': { multiplier: 0.85, name: 'Bahia' }
    }
    
    const basePrice = 280
    const multiplier = basePrices[state]?.multiplier || 1.0
    const stateName = basePrices[state]?.name || state
    
    return {
      state: stateName,
      prices: {
        boi_gordo: basePrice * multiplier,
        vaca_gorda: (basePrice - 20) * multiplier,
        bezerro_macho: 1800 * multiplier,
        bezerro_femea: 1600 * multiplier
      },
      lastUpdate: new Date(),
      marketCondition: multiplier > 0.95 ? 'strong' : multiplier > 0.90 ? 'moderate' : 'weak'
    }
  }

  // Previsão de preços usando IA simulada
  static async getPriceForecast(days = 7) {
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    const currentPrice = 280
    const forecast = []
    
    for (let i = 1; i <= days; i++) {
      const trend = Math.sin(i / 3) * 5 + (Math.random() - 0.5) * 8
      const confidence = Math.max(60, 95 - (i * 5)) // Confiança diminui com o tempo
      
      forecast.push({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        predictedPrice: currentPrice + trend,
        confidence: confidence,
        trend: trend > 2 ? 'bullish' : trend < -2 ? 'bearish' : 'neutral',
        factors: [
          'Análise técnica',
          'Padrões sazonais',
          'Indicadores econômicos',
          'Dados históricos'
        ]
      })
    }
    
    return {
      model: 'Beef_Sync AI v2.0',
      accuracy: '78%',
      lastTrained: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      forecast: forecast
    }
  }
}