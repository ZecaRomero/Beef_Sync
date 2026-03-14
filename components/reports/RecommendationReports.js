
import React, { useEffect, useState } from 'react'


export default function RecommendationReports() {
  const [selectedRecommendation, setSelectedRecommendation] = useState('all')
  const [sortBy, setSortBy] = useState('roi')
  const [showExportModal, setShowExportModal] = useState(false)
  const [analysisData, setAnalysisData] = useState(null)

  useEffect(() => {
    generateAnalysis()
  }, [])

  const generateAnalysis = () => {
    // Simular estimativa de peso por idade
    const estimateWeight = (months, sex) => {
      const baseWeight = sex === 'Macho' ? 15 : 12 // kg por mÃªs
      return Math.min(months * baseWeight, sex === 'Macho' ? 550 : 450)
    }

    // Simular preÃ§os de mercado atuais
    const marketPrices = {
      boi_gordo: 280, // R$/arroba
      vaca_gorda: 260, // R$/arroba
      bezerro_macho: 1800, // R$/cabeÃ§a
      bezerro_femea: 1600 // R$/cabeÃ§a
    }

    const analyzedAnimals = mockAnimals.map(animal => {
      const weight = estimateWeight(animal.meses, animal.sexo)
      const arrobas = weight / 15 // 1 arroba = 15kg
      
      let marketValue = 0
      if (animal.meses >= 30) {
        // Boi/Vaca gordo
        marketValue = animal.sexo === 'Macho' 
          ? marketPrices.boi_gordo * arrobas
          : marketPrices.vaca_gorda * arrobas
      } else if (animal.meses <= 12) {
        // Bezerro
        marketValue = animal.sexo === 'Macho'
          ? marketPrices.bezerro_macho
          : marketPrices.bezerro_femea
      } else {
        // Garrote/Novilha (interpolaÃ§Ã£o)
        const adultPrice = animal.sexo === 'Macho' 
          ? marketPrices.boi_gordo * arrobas
          : marketPrices.vaca_gorda * arrobas
        const calfPrice = animal.sexo === 'Macho'
          ? marketPrices.bezerro_macho
          : marketPrices.bezerro_femea
        
        const ageRatio = (animal.meses - 12) / (30 - 12)
        marketValue = calfPrice + (adultPrice - calfPrice) * ageRatio
      }

      const potentialProfit = marketValue - animal.custoTotal
      const potentialROI = animal.custoTotal > 0 ? (potentialProfit / animal.custoTotal * 100) : 0
      
      // Determinar recomendaÃ§Ã£o
      let recommendation = 'hold'
      let recommendationReason = ''
      let priority = 'medium'
      
      if (potentialROI >= 25) {
        recommendation = 'sell'
        recommendationReason = 'ROI excelente - momento ideal para venda'
        priority = 'high'
      } else if (potentialROI >= 15) {
        recommendation = 'sell'
        recommendationReason = 'ROI bom - considere vender'
        priority = 'medium'
      } else if (potentialROI >= 5) {
        recommendation = 'hold'
        recommendationReason = 'ROI moderado - aguarde melhor momento'
        priority = 'low'
      } else if (potentialROI >= 0) {
        recommendation = 'improve'
        recommendationReason = 'ROI baixo - otimize custos'
        priority = 'medium'
      } else {
        recommendation = 'improve'
        recommendationReason = 'PrejuÃ­zo potencial - aÃ§Ã£o urgente necessÃ¡ria'
        priority = 'high'
      }

      // Fatores adicionais
      if (animal.meses > 36 && animal.situacao === 'Ativo') {
        recommendation = 'sell'
        recommendationReason = 'Animal maduro - considere venda'
        priority = 'high'
      }

      if (animal.custoTotal > 5000) {
        priority = 'high'
        if (recommendation === 'improve') {
          recommendationReason = 'Alto investimento com baixo retorno'
        }
      }

      return {
        ...animal,
        estimatedWeight: weight,
        estimatedArrobas: arrobas,
        marketValue,
        potentialProfit,
        potentialROI,
        recommendation,
        recommendationReason,
        priority,
        costPerMonth: animal.meses > 0 ? animal.custoTotal / animal.meses : 0,
        profitability: potentialROI >= 15 ? 'high' : potentialROI >= 5 ? 'medium' : 'low'
      }
    })

    setAnalysisData(analyzedAnimals)
  }

  const recommendations = [
    {
      id: 'all',
      label: 'ðÅ¸â€œÅ  Todos',
      description: 'Todos os animais',
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    },
    {
      id: 'sell',
      label: 'ðÅ¸Å¸¢ Vender',
      description: 'Recomendados para venda',
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    },
    {
      id: 'hold',
      label: 'ðÅ¸Å¸¡ Manter',
      description: 'Aguardar melhor momento',
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    },
    {
      id: 'improve',
      label: 'ðÅ¸â€�´ Melhorar',
      description: 'Necessitam otimizaÃ§Ã£o',
      color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    }
  ]

  const getFilteredAnimals = () => {
    if (!analysisData) return []
    
    let filtered = selectedRecommendation === 'all' 
      ? analysisData 
      : analysisData.filter(a => a.recommendation === selectedRecommendation)

    // OrdenaÃ§Ã£o
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'roi': return b.potentialROI - a.potentialROI
        case 'profit': return b.potentialProfit - a.potentialProfit
        case 'investment': return b.custoTotal - a.custoTotal
        case 'age': return b.meses - a.meses
        case 'priority': 
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        default: return 0
      }
    })
  }

  const getRecommendationStats = () => {
    if (!analysisData) return {}
    
    return {
      sell: analysisData.filter(a => a.recommendation === 'sell'),
      hold: analysisData.filter(a => a.recommendation === 'hold'),
      improve: analysisData.filter(a => a.recommendation === 'improve'),
      totalValue: analysisData.reduce((acc, a) => acc + a.marketValue, 0),
      totalInvested: analysisData.reduce((acc, a) => acc + a.custoTotal, 0),
      totalPotentialProfit: analysisData.reduce((acc, a) => acc + a.potentialProfit, 0)
    }
  }

  const exportReport = (format) => {
    const animals = getFilteredAnimals()
    const stats = getRecommendationStats()
    
    let content = ''
    
    if (format === 'whatsapp') {
      content = `ðÅ¸â€œÅ  *RelatÃ³rio de RecomendaÃ§Ãµes - Beef_Sync*\n\n`
      content += `ðÅ¸�â€ž *Resumo Geral:*\n`
      content += `ââ‚¬¢ Total de Animais: ${analysisData.length}\n`
      content += `ââ‚¬¢ ðÅ¸Å¸¢ Vender: ${stats.sell?.length || 0}\n`
      content += `ââ‚¬¢ ðÅ¸Å¸¡ Manter: ${stats.hold?.length || 0}\n`
      content += `ââ‚¬¢ ðÅ¸â€�´ Melhorar: ${stats.improve?.length || 0}\n\n`
      content += `ðÅ¸â€™° *Financeiro:*\n`
      content += `ââ‚¬¢ Valor de Mercado: R$ ${stats.totalValue?.toLocaleString('pt-BR') || 0}\n`
      content += `ââ‚¬¢ Investido: R$ ${stats.totalInvested?.toLocaleString('pt-BR') || 0}\n`
      content += `ââ‚¬¢ Lucro Potencial: R$ ${stats.totalPotentialProfit?.toLocaleString('pt-BR') || 0}\n\n`
      content += `ðÅ¸â€œË† Gerado pelo Beef_Sync v3.0 Pro`
      
      const url = `https://wa.me/?text=${encodeURIComponent(content)}`
      window.open(url, '_blank')
    } else if (format === 'email') {
      const subject = `RelatÃ³rio de RecomendaÃ§Ãµes - ${selectedRecommendation === 'all' ? 'Todos os Animais' : recommendations.find(r => r.id === selectedRecommendation)?.description}`
      
      content = `RelatÃ³rio de RecomendaÃ§Ãµes - Beef_Sync\n\n`
      content += `Filtro: ${recommendations.find(r => r.id === selectedRecommendation)?.description}\n`
      content += `Data: ${new Date().toLocaleDateString('pt-BR')}\n\n`
      content += `RESUMO EXECUTIVO:\n`
      content += `ââ‚¬¢ Total de Animais Analisados: ${analysisData.length}\n`
      content += `ââ‚¬¢ Recomendados para Venda: ${stats.sell?.length || 0}\n`
      content += `ââ‚¬¢ Para Manter: ${stats.hold?.length || 0}\n`
      content += `ââ‚¬¢ Para Melhorar: ${stats.improve?.length || 0}\n\n`
      content += `ANÃ�LISE FINANCEIRA:\n`
      content += `ââ‚¬¢ Valor Total de Mercado: R$ ${stats.totalValue?.toLocaleString('pt-BR') || 0}\n`
      content += `ââ‚¬¢ Total Investido: R$ ${stats.totalInvested?.toLocaleString('pt-BR') || 0}\n`
      content += `ââ‚¬¢ Lucro Potencial: R$ ${stats.totalPotentialProfit?.toLocaleString('pt-BR') || 0}\n\n`
      
      if (animals.length > 0) {
        content += `DETALHAMENTO (Top 10):\n`
        animals.slice(0, 10).forEach((animal, index) => {
          content += `${index + 1}. ${animal.serie} ${animal.rg}\n`
          content += `   ââ‚¬¢ RecomendaÃ§Ã£o: ${animal.recommendation === 'sell' ? 'VENDER' : animal.recommendation === 'hold' ? 'MANTER' : 'MELHORAR'}\n`
          content += `   ââ‚¬¢ ROI Potencial: ${animal.potentialROI.toFixed(1)}%\n`
          content += `   ââ‚¬¢ Valor de Mercado: R$ ${(animal.marketValue || 0).toLocaleString('pt-BR')}\n`
          content += `   ââ‚¬¢ Motivo: ${animal.recommendationReason}\n\n`
        })
      }
      
      content += `\nRelatÃ³rio gerado automaticamente pelo Beef_Sync v3.0 Pro\n`
      content += `Sistema de GestÃ£o Bovina Inteligente`
      
      const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(content)}`
      window.open(url)
    }
    
    setShowExportModal(false)
  }

  const filteredAnimals = getFilteredAnimals()
  const stats = getRecommendationStats()

  if (!analysisData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">ðÅ¸â€œÅ </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            Analisando recomendaÃ§Ãµes...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-700 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-3 flex items-center">
                ðÅ¸Å½¯ RelatÃ³rios de RecomendaÃ§Ãµes
                <span className="ml-4 px-4 py-2 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">
                  IA Analytics
                </span>
              </h1>
              <p className="text-green-100 text-lg">
                AnÃ¡lise inteligente com recomendaÃ§Ãµes personalizadas para cada animal
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{analysisData.length}</div>
              <div className="text-green-200">Animais Analisados</div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
      </div>

      {/* Resumo das RecomendaÃ§Ãµes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.sell?.length || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Vender</div>
            </div>
            <div className="text-3xl">ðÅ¸Å¸¢</div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            ROI &gt; 15% ou animais maduros
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.hold?.length || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Manter</div>
            </div>
            <div className="text-3xl">ðÅ¸Å¸¡</div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            ROI 5-15% - aguardar
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.improve?.length || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Melhorar</div>
            </div>
            <div className="text-3xl">ðÅ¸â€�´</div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            ROI &lt; 5% - otimizar
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                R$ {(stats.totalPotentialProfit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Lucro Potencial</div>
            </div>
            <div className="text-3xl">ðÅ¸â€™°</div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Se vendidos hoje
          </div>
        </div>
      </div>

      {/* Filtros e Controles */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {recommendations.map(rec => (
              <button
                key={rec.id}
                onClick={() => setSelectedRecommendation(rec.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedRecommendation === rec.id
                    ? 'bg-blue-500 text-white shadow-lg transform scale-105'
                    : `${rec.color} hover:shadow-md`
                }`}
              >
                {rec.label}
                {rec.id !== 'all' && (
                  <span className="ml-2 px-2 py-1 bg-black/10 rounded-full text-xs">
                    {rec.id === 'sell' ? stats.sell?.length : 
                     rec.id === 'hold' ? stats.hold?.length : 
                     stats.improve?.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="roi">ROI Potencial</option>
              <option value="profit">Lucro Potencial</option>
              <option value="investment">Investimento</option>
              <option value="age">Idade</option>
              <option value="priority">Prioridade</option>
            </select>

            <button
              onClick={() => setShowExportModal(true)}
              className="px-6 py-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
            >
              <span>ðÅ¸â€œ¤</span>
              <span>Exportar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabela de Animais */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            ðÅ¸�â€ž {recommendations.find(r => r.id === selectedRecommendation)?.description}
            <span className="ml-3 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium rounded-full">
              {filteredAnimals.length} animais
            </span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-900 dark:text-white">Animal</th>
                <th className="text-center p-4 font-semibold text-gray-900 dark:text-white">Idade</th>
                <th className="text-center p-4 font-semibold text-gray-900 dark:text-white">Peso Est.</th>
                <th className="text-center p-4 font-semibold text-gray-900 dark:text-white">Investido</th>
                <th className="text-center p-4 font-semibold text-gray-900 dark:text-white">Valor Mercado</th>
                <th className="text-center p-4 font-semibold text-gray-900 dark:text-white">Lucro Pot.</th>
                <th className="text-center p-4 font-semibold text-gray-900 dark:text-white">ROI Pot.</th>
                <th className="text-center p-4 font-semibold text-gray-900 dark:text-white">RecomendaÃ§Ã£o</th>
              </tr>
            </thead>
            <tbody>
              {filteredAnimals.map((animal, index) => (
                <tr key={animal.id} className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  animal.priority === 'high' ? 'bg-red-50 dark:bg-red-900/10' : ''
                }`}>
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        animal.priority === 'high' ? 'bg-red-500' :
                        animal.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}></div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {animal.serie} {animal.rg}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {animal.raca} ââ‚¬¢ {animal.sexo}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-center text-gray-600 dark:text-gray-400">
                    {animal.meses}m
                  </td>
                  <td className="p-4 text-center text-gray-600 dark:text-gray-400">
                    {animal.estimatedWeight.toFixed(0)}kg
                    <div className="text-xs text-gray-500">
                      ({animal.estimatedArrobas.toFixed(1)}@)
                    </div>
                  </td>
                  <td className="p-4 text-center text-red-600 dark:text-red-400 font-medium">
                    R$ {(animal.custoTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-4 text-center text-blue-600 dark:text-blue-400 font-medium">
                    R$ {(animal.marketValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`p-4 text-center font-medium ${
                    animal.potentialProfit >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    R$ {animal.potentialProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`p-4 text-center font-bold ${
                    animal.potentialROI >= 15 ? 'text-green-600 dark:text-green-400' :
                    animal.potentialROI >= 5 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                  }`}>
                    {animal.potentialROI.toFixed(1)}%
                  </td>
                  <td className="p-4 text-center">
                    <div className="space-y-1">
                      <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                        animal.recommendation === 'sell' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        animal.recommendation === 'hold' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {animal.recommendation === 'sell' ? 'ðÅ¸Å¸¢ Vender' :
                         animal.recommendation === 'hold' ? 'ðÅ¸Å¸¡ Manter' : 'ðÅ¸â€�´ Melhorar'}
                      </span>
                      <div className="text-xs text-gray-500 dark:text-gray-400 max-w-32">
                        {animal.recommendationReason}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAnimals.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">ðÅ¸â€��</div>
            <div className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhum animal encontrado
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              Tente alterar os filtros para ver mais resultados
            </div>
          </div>
        )}
      </div>

      {/* Modal de ExportaÃ§Ã£o */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                ðÅ¸â€œ¤ Exportar RelatÃ³rio
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Escolha como deseja compartilhar
              </p>
            </div>

            <div className="p-6 space-y-4">
              <button
                onClick={() => exportReport('whatsapp')}
                className="w-full p-4 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center space-x-3"
              >
                <span className="text-2xl">ðÅ¸â€œ±</span>
                <div className="text-left">
                  <div className="font-medium">WhatsApp</div>
                  <div className="text-sm opacity-90">Compartilhar resumo</div>
                </div>
              </button>

              <button
                onClick={() => exportReport('email')}
                className="w-full p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center space-x-3"
              >
                <span className="text-2xl">ðÅ¸â€œ§</span>
                <div className="text-left">
                  <div className="font-medium">Email</div>
                  <div className="text-sm opacity-90">RelatÃ³rio detalhado</div>
                </div>
              </button>

              <button
                onClick={() => {
                  window.print()
                  setShowExportModal(false)
                }}
                className="w-full p-4 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center space-x-3"
              >
                <span className="text-2xl">ðÅ¸â€“¨ï¸�</span>
                <div className="text-left">
                  <div className="font-medium">Imprimir</div>
                  <div className="text-sm opacity-90">VersÃ£o para impressÃ£o</div>
                </div>
              </button>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowExportModal(false)}
                className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}