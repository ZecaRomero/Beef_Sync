import React, { useState, useEffect } from 'react'
import ModernCard, { ModernCardHeader, ModernCardBody } from '../../components/ui/ModernCard'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import {
  ChartBarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CurrencyDollarIcon,
  LightBulbIcon,
  SparklesIcon,
  PresentationChartLineIcon,
  ArrowPathIcon
} from '../../components/ui/Icons'

export default function FutureProjections() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)

  // Market Data State
  const [marketData, setMarketData] = useState({
    boiGordo: '245.00',
    bezerro: '2200.00',
    milho: '60.00',
    soja: '130.00'
  })

  // Simulation State
  const [simulationPrice, setSimulationPrice] = useState(245)
  const [simulationMode, setSimulationMode] = useState(false)

  // AI Analysis State
  const [analysis, setAnalysis] = useState(null)

  useEffect(() => {
    setMounted(true)
    setSimulationPrice(parseFloat(marketData.boiGordo) || 245)
  }, [])

  useEffect(() => {
    if (!simulationMode) {
        setSimulationPrice(parseFloat(marketData.boiGordo) || 245)
    }
  }, [marketData.boiGordo, simulationMode])

  const handleInputChange = (field, value) => {
    setMarketData(prev => ({ ...prev, [field]: value }))
  }

  // "AI" Logic Simulation
  const generateAiAnalysis = (useSimulation = false) => {
    setLoading(true)
    
    // Simulate API delay
    setTimeout(() => {
      const currentBoi = parseFloat(marketData.boiGordo)
      const boi = useSimulation ? simulationPrice : currentBoi
      const milho = parseFloat(marketData.milho)
      const relacaoTroca = boi / milho // Crude exchange ratio logic

      let sentiment = 'neutral'
      let strategies = []
      let projection = {}

      // Logic: Price Trend Impact (Simulation vs Current)
      if (useSimulation) {
          const diff = boi - currentBoi
          const percentChange = ((diff / currentBoi) * 100).toFixed(1)
          
          if (diff > 0) {
              strategies.push({
                  title: `Cenário de Alta: +${percentChange}%`,
                  description: `Se a arroba atingir R$ ${boi.toFixed(2)}, sua margem líquida expande significativamente.`,
                  action: 'Estratégia: Segurar animais próximos do acabamento para aproveitar a alta, mas travar custos operacionais agora.',
                  icon: 'trending_up',
                  color: 'green'
              })
          } else if (diff < 0) {
              strategies.push({
                  title: `Cenário de Baixa: ${percentChange}%`,
                  description: `Com a arroba a R$ ${boi.toFixed(2)}, a margem fica comprimida.`,
                  action: 'Estratégia: Acelerar vendas dos animais prontos antes da queda se concretizar. Considere hedge na B3.',
                  icon: 'trending_down',
                  color: 'red'
              })
          }
      }

      // Logic 1: Exchange Ratio (Boi/Milho)
      // If high (> 4.5 bags of corn per arroba), feedlot is favorable
      if (relacaoTroca > 4.5) {
        sentiment = 'positive'
        strategies.push({
          title: 'Oportunidade de Confinamento',
          description: `A relação de troca está favorável (${relacaoTroca.toFixed(2)} sacas/@). O custo de produção está baixo em relação ao preço de venda.`,
          action: 'Recomendamos intensificar o manejo para acelerar o acabamento.',
          icon: 'trending_up',
          color: 'green'
        })
      } else if (relacaoTroca < 3.5) {
        sentiment = 'negative'
        strategies.push({
    title: 'Custo Operacional Elevado',
    description: `Insumos e manutenção estão impactando a margem. Margens operacionais apertadas.`,
    action: 'Foque em eficiência de pastejo e otimização de recursos. Evite gastos desnecessários.',
          icon: 'trending_down',
          color: 'red'
        })
      } else {
        strategies.push({
          title: 'Margens Estáveis',
          description: 'Relação de troca dentro da média histórica.',
          action: 'Mantenha o planejamento operacional padrão e monitore oportunidades de compra de insumos.',
          icon: 'minus',
          color: 'blue'
        })
      }

      // Logic 2: Boi Gordo Price Absolute
      if (boi > 280) {
        strategies.push({
          title: 'Momento de Venda (Preço Alvo)',
          description: 'Preço da arroba em patamares históricos altos.',
          action: 'Considere travar preços futuros ou vender animais prontos imediatamente para realizar lucro.',
          icon: 'dollar',
          color: 'green'
        })
      } else if (boi < 220) {
        strategies.push({
          title: 'Segurar Vendas (Baixa)',
          description: 'Preço da arroba pressionado.',
          action: 'Se possível, segure os animais em pastagem para aguardar recuperação de preços na entressafra.',
          icon: 'clock',
          color: 'yellow'
        })
      }

      // Scenarios
      projection = {
        optimistic: {
          roi: (boi * 1.15 - 200).toFixed(2), // Mock ROI calculation
          label: 'Cenário Otimista (+15%)',
          details: 'Recuperação da demanda interna e exportação aquecida.'
        },
        realistic: {
          roi: (boi - 200).toFixed(2),
          label: 'Cenário Base',
          details: 'Manutenção dos fundamentos atuais de oferta e demanda.'
        },
        pessimistic: {
          roi: (boi * 0.9 - 200).toFixed(2),
          label: 'Cenário Pessimista (-10%)',
          details: 'Pressão de oferta ou queda no consumo.'
        }
      }

      setAnalysis({ sentiment, strategies, projection })
      setLoading(false)
      setShowAnalysis(true)
    }, 800)
  }

  if (!mounted) return null

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <SparklesIcon className="h-8 w-8 text-violet-600" />
            Planejamento Estratégico com IA
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Simule cenários e receba insights inteligentes baseados em dados de mercado.
          </p>
        </div>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Market Data */}
        <ModernCard className="lg:col-span-2 border-t-4 border-violet-500">
          <ModernCardHeader 
            title="Parâmetros de Mercado" 
            subtitle="Informe os indicadores atuais para a IA processar"
            icon={<PresentationChartLineIcon className="h-6 w-6 text-violet-600" />}
          />
          <ModernCardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Arroba do Boi (R$)"
                type="number"
                value={marketData.boiGordo}
                onChange={(e) => handleInputChange('boiGordo', e.target.value)}
                placeholder="0.00"
              />
              <Input
                label="Bezerro (R$/cb)"
                type="number"
                value={marketData.bezerro}
                onChange={(e) => handleInputChange('bezerro', e.target.value)}
                placeholder="0.00"
              />
              <Input
                label="Milho (R$/sc)"
                type="number"
                value={marketData.milho}
                onChange={(e) => handleInputChange('milho', e.target.value)}
                placeholder="0.00"
              />
              <Input
                label="Soja (R$/sc)"
                type="number"
                value={marketData.soja}
                onChange={(e) => handleInputChange('soja', e.target.value)}
                placeholder="0.00"
              />
            </div>
            
            <div className="mt-8 flex justify-end">
              <Button 
                onClick={() => {
                    setSimulationMode(false)
                    generateAiAnalysis(false)
                }}
                loading={loading && !simulationMode}
                className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 text-lg shadow-lg hover:shadow-violet-500/30 transition-all transform hover:-translate-y-1"
              >
                {loading && !simulationMode ? 'Processando...' : (
                  <span className="flex items-center gap-2">
                    <SparklesIcon className="h-5 w-5" />
                    Gerar Análise Atual
                  </span>
                )}
              </Button>
            </div>
          </ModernCardBody>
        </ModernCard>

        {/* Simulation Widget */}
        <ModernCard className="border-t-4 border-fuchsia-500 bg-gradient-to-b from-white to-fuchsia-50 dark:from-gray-800 dark:to-fuchsia-900/10">
            <ModernCardHeader
                title="Simulador de Cenários"
                subtitle="O que acontece se o preço mudar?"
                icon={<ArrowPathIcon className="h-6 w-6 text-fuchsia-600" />}
            />
            <ModernCardBody>
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Simular Preço da @: <span className="text-fuchsia-600 font-bold text-lg">R$ {simulationPrice.toFixed(2)}</span>
                        </label>
                        <input 
                            type="range" 
                            min="150" 
                            max="350" 
                            step="1"
                            value={simulationPrice}
                            onChange={(e) => {
                                setSimulationPrice(parseFloat(e.target.value))
                                setSimulationMode(true)
                            }}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-fuchsia-600"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>R$ 150</span>
                            <span>R$ 350</span>
                        </div>
                    </div>

                    <div className="bg-white/50 dark:bg-black/20 p-4 rounded-xl border border-fuchsia-100 dark:border-fuchsia-900/30">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Variação em relação ao atual:
                            <span className={`font-bold ml-1 ${
                                simulationPrice > parseFloat(marketData.boiGordo) ? 'text-green-600' : 
                                simulationPrice < parseFloat(marketData.boiGordo) ? 'text-red-600' : 'text-gray-600'
                            }`}>
                                {((simulationPrice - parseFloat(marketData.boiGordo)) / parseFloat(marketData.boiGordo) * 100).toFixed(1)}%
                            </span>
                        </p>
                    </div>

                    <Button 
                        onClick={() => {
                            setSimulationMode(true)
                            generateAiAnalysis(true)
                        }}
                        loading={loading && simulationMode}
                        className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
                    >
                        <span className="flex items-center justify-center gap-2">
                            <ChartBarIcon className="h-5 w-5" />
                            Simular Impacto
                        </span>
                    </Button>
                </div>
            </ModernCardBody>
        </ModernCard>
      </div>

      {/* Results Section */}
      {showAnalysis && analysis && (
        <div className="space-y-6 animate-fade-in">
          
          {/* AI Insights Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {analysis.strategies.map((strategy, index) => (
              <div 
                key={index}
                className={`
                  relative overflow-hidden rounded-2xl p-6 shadow-lg border transition-all duration-300 hover:scale-[1.02]
                  ${strategy.color === 'green' ? 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 dark:from-green-900/30 dark:to-emerald-900/30 dark:border-green-800' : ''}
                  ${strategy.color === 'red' ? 'bg-gradient-to-br from-red-50 to-rose-100 border-red-200 dark:from-red-900/30 dark:to-rose-900/30 dark:border-red-800' : ''}
                  ${strategy.color === 'yellow' ? 'bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-200 dark:from-yellow-900/30 dark:to-amber-900/30 dark:border-yellow-800' : ''}
                  ${strategy.color === 'blue' ? 'bg-gradient-to-br from-blue-50 to-cyan-100 border-blue-200 dark:from-blue-900/30 dark:to-cyan-900/30 dark:border-blue-800' : ''}
                `}
              >
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <LightBulbIcon className="h-24 w-24" />
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`p-2 rounded-lg bg-white/50 dark:bg-black/20 backdrop-blur-sm`}>
                      {strategy.icon === 'trending_up' && <TrendingUpIcon className="h-6 w-6 text-green-600" />}
                      {strategy.icon === 'trending_down' && <TrendingDownIcon className="h-6 w-6 text-red-600" />}
                      {strategy.icon === 'dollar' && <CurrencyDollarIcon className="h-6 w-6 text-green-600" />}
                      {strategy.icon === 'clock' && <ArrowPathIcon className="h-6 w-6 text-yellow-600" />}
                      {strategy.icon === 'minus' && <ChartBarIcon className="h-6 w-6 text-blue-600" />}
                    </span>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-tight">
                      {strategy.title}
                    </h3>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm leading-relaxed">
                    {strategy.description}
                  </p>
                  
                  <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3 backdrop-blur-sm border border-white/20">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex gap-2">
                      <span className="text-violet-600">💡 Sugestão:</span>
                      {strategy.action}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Projection Scenarios */}
          <ModernCard>
            <ModernCardHeader 
              title="Cenários Projetados (Margem Estimada / Animal)" 
              icon={<ChartBarIcon className="h-5 w-5 text-gray-500" />}
            />
            <ModernCardBody>
              <div className="space-y-6">
                {/* Optimistic */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-green-700 dark:text-green-400">{analysis.projection.optimistic.label}</span>
                    <span className="font-bold text-green-700 dark:text-green-400">R$ {analysis.projection.optimistic.roi}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div className="bg-green-500 h-3 rounded-full shadow-lg shadow-green-500/50" style={{ width: '85%' }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{analysis.projection.optimistic.details}</p>
                </div>

                {/* Realistic */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-blue-700 dark:text-blue-400">{analysis.projection.realistic.label}</span>
                    <span className="font-bold text-blue-700 dark:text-blue-400">R$ {analysis.projection.realistic.roi}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div className="bg-blue-500 h-3 rounded-full shadow-lg shadow-blue-500/50" style={{ width: '60%' }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{analysis.projection.realistic.details}</p>
                </div>

                {/* Pessimistic */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-red-700 dark:text-red-400">{analysis.projection.pessimistic.label}</span>
                    <span className="font-bold text-red-700 dark:text-red-400">R$ {analysis.projection.pessimistic.roi}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div className="bg-red-500 h-3 rounded-full shadow-lg shadow-red-500/50" style={{ width: '35%' }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{analysis.projection.pessimistic.details}</p>
                </div>
              </div>
            </ModernCardBody>
          </ModernCard>
        </div>
      )}
    </div>
  )
}
