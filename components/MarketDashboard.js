
import React, { useEffect, useState } from 'react'

import { MarketAPI } from '../services/marketAPI'

export default function MarketDashboard() {
  const [marketData, setMarketData] = useState(null)
  const [news, setNews] = useState([])
  const [analysis, setAnalysis] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState('prices')
  const [selectedState, setSelectedState] = useState('SP')

  useEffect(() => {
    loadMarketData()
    const interval = setInterval(loadMarketData, 60000) // Atualizar a cada minuto
    return () => clearInterval(interval)
  }, [])

  const loadMarketData = async () => {
    try {
      setLoading(true)
      const [prices, marketNews, marketAnalysis, priceForecast] = await Promise.all([
        MarketAPI.getCattlePrices(),
        MarketAPI.getMarketNews(),
        MarketAPI.getMarketAnalysis(),
        MarketAPI.getPriceForecast()
      ])
      
      setMarketData(prices)
      setNews(marketNews)
      setAnalysis(marketAnalysis)
      setForecast(priceForecast)
    } catch (error) {
      console.error('Erro ao carregar dados do mercado:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return '📈'
      case 'down': return '📉'
      default: return '➡️'
    }
  }

  const getTrendColor = (change) => {
    if (change > 0) return 'text-green-600 dark:text-green-400'
    if (change < 0) return 'text-red-600 dark:text-red-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value)
  }

  const formatPercent = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  const renderPricesTab = () => (
    <div className="space-y-6">
      {/* Preços por Categoria */}
      {marketData && (
        <>
          {/* Animais Terminados */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              🥩 Animais Terminados (Para Abate)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(marketData.prices)
                .filter(([key, data]) => data.category === 'Terminados')
                .map(([key, data]) => (
                <div key={key} className="p-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl border border-red-200 dark:border-red-800 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{data.icon}</span>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {key === 'boi_gordo' ? 'Boi Gordo' :
                         key === 'vaca_gorda' ? 'Vaca Gorda' : key}
                      </h4>
                    </div>
                    <span className="text-xl">{getTrendIcon(data.trend)}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      R$ {data.price.toFixed(0)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {data.unit} • {data.market}
                    </div>
                    <div className={`text-sm font-medium flex items-center ${getTrendColor(data.change)}`}>
                      <span className="mr-1">{data.change >= 0 ? '↗️' : '↘️'}</span>
                      {formatPercent(data.changePercent)} ({data.change >= 0 ? '+' : ''}R$ {data.change.toFixed(2)})
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {data.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Animais de Recria */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              🌱 Animais de Recria (Crescimento)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(marketData.prices)
                .filter(([key, data]) => data.category === 'Recria')
                .map(([key, data]) => (
                <div key={key} className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{data.icon}</span>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {key === 'garrote' ? 'Garrote' :
                         key === 'novilho' ? 'Novilho' :
                         key === 'novilha' ? 'Novilha' : key}
                      </h4>
                    </div>
                    <span className="text-xl">{getTrendIcon(data.trend)}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {data.unit.includes('arroba') ? 
                        `R$ ${data.price.toFixed(0)}` : 
                        formatCurrency(data.price)
                      }
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {data.unit} • {data.market}
                    </div>
                    <div className={`text-sm font-medium flex items-center ${getTrendColor(data.change)}`}>
                      <span className="mr-1">{data.change >= 0 ? '↗️' : '↘️'}</span>
                      {formatPercent(data.changePercent)} ({data.change >= 0 ? '+' : ''}R$ {data.change.toFixed(2)})
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {data.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Animais de Cria */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              🍼 Animais de Cria (Até 12 meses)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(marketData.prices)
                .filter(([key, data]) => data.category === 'Cria')
                .map(([key, data]) => (
                <div key={key} className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{data.icon}</span>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {key === 'bezerro_macho' ? 'Bezerro Macho' :
                         key === 'bezerra' ? 'Bezerra' : key}
                      </h4>
                    </div>
                    <span className="text-xl">{getTrendIcon(data.trend)}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(data.price)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {data.unit} • {data.market}
                    </div>
                    <div className={`text-sm font-medium flex items-center ${getTrendColor(data.change)}`}>
                      <span className="mr-1">{data.change >= 0 ? '↗️' : '↘️'}</span>
                      {formatPercent(data.changePercent)} ({data.change >= 0 ? '+' : ''}R$ {data.change.toFixed(2)})
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {data.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Índices Econômicos */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          📊 Índices Econômicos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {marketData && Object.entries(marketData.indices).map(([key, data]) => (
            <div key={key} className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all">
              <div className="text-center">
                <div className="text-3xl mb-2">{data.icon}</div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {key === 'dolar' ? 'Dólar USD' :
                   key === 'milho' ? 'Milho' :
                   key === 'soja' ? 'Soja' :
                   key === 'farelo_soja' ? 'Farelo Soja' :
                   key === 'boi_futuro' ? 'Boi Futuro' : key}
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {key === 'dolar' ? `USD ${data.value.toFixed(2)}` : `R$ ${data.value.toFixed(0)}`}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {data.unit} • {data.source}
                </div>
                <div className={`text-sm font-medium flex items-center justify-center ${getTrendColor(data.change)}`}>
                  <span className="mr-1">{data.change >= 0 ? '↗️' : '↘️'}</span>
                  {formatPercent(data.changePercent)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status do Mercado */}
      {marketData && marketData.marketStatus && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            🕐 Status do Mercado
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-4 h-4 rounded-full ${
                marketData.marketStatus.session.status === 'open' ? 'bg-green-500 animate-pulse' :
                marketData.marketStatus.session.status === 'closing' ? 'bg-yellow-500 animate-pulse' :
                'bg-red-500'
              }`}></div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {marketData.marketStatus.session.label}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Qualidade dos dados: {marketData.marketStatus.dataQuality}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Última atualização: {marketData.marketStatus.lastUpdate.toLocaleTimeString('pt-BR')}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Próxima: {marketData.marketStatus.nextUpdate.toLocaleTimeString('pt-BR')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderNewsTab = () => (
    <div className="space-y-4">
      {news.map((item) => (
        <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                  item.impact === 'positive' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  item.impact === 'negative' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}>
                  {item.impact === 'positive' ? '📈 Positivo' : 
                   item.impact === 'negative' ? '📉 Negativo' : '➡️ Neutro'}
                </span>
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                  item.relevance === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                  item.relevance === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}>
                  {item.relevance === 'high' ? '🔥 Alta' : 
                   item.relevance === 'medium' ? '⚡ Média' : '📊 Baixa'}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {item.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                {item.summary}
              </p>
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>{item.source}</span>
                <span>{new Date(item.publishedAt).toLocaleString('pt-BR')}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderAnalysisTab = () => (
    <div className="space-y-6">
      {analysis && (
        <>
          {/* Sentiment do Mercado */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              🎯 Sentimento do Mercado
            </h3>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Score</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {analysis.marketSentiment.score}/100
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-1000 ${
                      analysis.marketSentiment.score >= 70 ? 'bg-green-500' :
                      analysis.marketSentiment.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${analysis.marketSentiment.score}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analysis.marketSentiment.label}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {analysis.marketSentiment.description}
                </div>
              </div>
            </div>
          </div>

          {/* Fatores de Mercado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-4 flex items-center">
                ✅ Fatores Positivos
              </h3>
              <ul className="space-y-2">
                {analysis.factors.positive.map((factor, index) => (
                  <li key={index} className="flex items-center text-gray-700 dark:text-gray-300">
                    <span className="text-green-500 mr-2">•</span>
                    {factor}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center">
                ⚠️ Fatores Negativos
              </h3>
              <ul className="space-y-2">
                {analysis.factors.negative.map((factor, index) => (
                  <li key={index} className="flex items-center text-gray-700 dark:text-gray-300">
                    <span className="text-red-500 mr-2">•</span>
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recomendações */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              💡 Recomendações de Investimento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analysis.recommendations.map((rec, index) => (
                <div key={index} className={`p-4 rounded-lg border-2 ${
                  rec.type === 'buy' ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' :
                  rec.type === 'sell' ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' :
                  'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 text-xs rounded-full font-bold ${
                      rec.type === 'buy' ? 'bg-green-500 text-white' :
                      rec.type === 'sell' ? 'bg-red-500 text-white' :
                      'bg-yellow-500 text-white'
                    }`}>
                      {rec.type === 'buy' ? '🟢 COMPRAR' :
                       rec.type === 'sell' ? '🔴 VENDER' : '🟡 MANTER'}
                    </span>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {rec.confidence}%
                    </span>
                  </div>
                  <div className="font-semibold text-gray-900 dark:text-white mb-1">
                    {rec.category}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {rec.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )

  const renderForecastTab = () => (
    <div className="space-y-6">
      {forecast && (
        <>
          {/* Info do Modelo */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  🤖 {forecast.model}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Precisão: {forecast.accuracy} • Último treino: {new Date(forecast.lastTrained).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {forecast.accuracy}
                </div>
                <div className="text-sm text-gray-500">Precisão</div>
              </div>
            </div>
          </div>

          {/* Previsões */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              📈 Previsão de Preços - Próximos 7 dias
            </h3>
            <div className="space-y-3">
              {forecast.forecast.map((day, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(day.date).toLocaleDateString('pt-BR', { 
                        weekday: 'short', 
                        day: '2-digit', 
                        month: '2-digit' 
                      })}
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      day.trend === 'bullish' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      day.trend === 'bearish' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {day.trend === 'bullish' ? '📈 Alta' :
                       day.trend === 'bearish' ? '📉 Baixa' : '➡️ Estável'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-bold text-gray-900 dark:text-white">
                        {formatCurrency(day.predictedPrice)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Confiança: {day.confidence.toFixed(0)}%
                      </div>
                    </div>
                    <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${day.confidence}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )

  const tabs = [
    { id: 'prices', label: '💰 Preços', component: renderPricesTab },
    { id: 'news', label: '📰 Notícias', component: renderNewsTab },
    { id: 'analysis', label: '📊 Análise', component: renderAnalysisTab },
    { id: 'forecast', label: '🔮 Previsão IA', component: renderForecastTab }
  ]

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">📊</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            Carregando dados do mercado...
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            Conectando com APIs de mercado
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              📈 Market Intelligence
              <span className="ml-3 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm font-medium rounded-full">
                Ao Vivo
              </span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Dados em tempo real do mercado de gado • Última atualização: {marketData?.timestamp.toLocaleTimeString('pt-BR')}
            </p>
          </div>
          <button
            onClick={loadMarketData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
          >
            <span>🔄</span>
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-all duration-300 ${
              selectedTab === tab.id
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {tabs.find(tab => tab.id === selectedTab)?.component()}
      </div>
    </div>
  )
}