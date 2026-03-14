
import React, { useEffect, useState } from 'react'

import { 
  CurrencyDollarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CalendarIcon,
  ScaleIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { Card, CardHeader, CardBody } from '../ui/Card'
import Button from '../ui/Button'
import Badge from '../ui/Badge'

const ROI_THRESHOLDS = {
  EXCELLENT: 30, // ROI > 30%
  GOOD: 15,      // ROI > 15%
  FAIR: 5,       // ROI > 5%
  POOR: 0        // ROI > 0%
}

const SALE_RECOMMENDATIONS = {
  IMMEDIATE: 'immediate',
  SOON: 'soon',
  WAIT: 'wait',
  HOLD: 'hold'
}

export default function ROIAnalyzer({ animal, onClose, onRecommendSale }) {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [projectedSalePrice, setProjectedSalePrice] = useState('')
  const [customAnalysis, setCustomAnalysis] = useState(null)

  useEffect(() => {
    if (animal) {
      loadROIAnalysis()
    }
  }, [animal])

  const loadROIAnalysis = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/animals/${animal.animalId}/roi-analysis`)
      if (!response.ok) throw new Error('Erro ao carregar análise')
      
      const data = await response.json()
      setAnalysis(data)
      setProjectedSalePrice(data.suggestedSalePrice || '')
    } catch (error) {
      console.error('Erro ao carregar análise ROI:', error)
      alert('❌ Erro: Não foi possível carregar a análise ROI')
    } finally {
      setLoading(false)
    }
  }

  const calculateCustomROI = () => {
    if (!projectedSalePrice || !analysis) return

    const salePrice = parseFloat(projectedSalePrice)
    const totalCosts = analysis.totalCosts
    const profit = salePrice - totalCosts
    const roi = ((profit / totalCosts) * 100)

    setCustomAnalysis({
      salePrice,
      profit,
      roi,
      recommendation: getRecommendation(roi, analysis),
      profitMargin: (profit / salePrice) * 100
    })
  }

  const getRecommendation = (roi, analysisData) => {
    const age = analysisData.ageInMonths
    const weight = analysisData.currentWeight
    const isBreeder = analysisData.isBreeder
    const marketConditions = analysisData.marketConditions

    // Lógica de recomendação baseada em múltiplos fatores
    if (roi >= ROI_THRESHOLDS.EXCELLENT && age >= 18) {
      return {
        type: SALE_RECOMMENDATIONS.IMMEDIATE,
        reason: 'ROI excelente e idade ideal para venda',
        urgency: 'high'
      }
    }

    if (roi >= ROI_THRESHOLDS.GOOD && age >= 15) {
      return {
        type: SALE_RECOMMENDATIONS.SOON,
        reason: 'Bom ROI, considere vender nos próximos meses',
        urgency: 'medium'
      }
    }

    if (roi >= ROI_THRESHOLDS.FAIR && age >= 12) {
      return {
        type: SALE_RECOMMENDATIONS.WAIT,
        reason: 'ROI razoável, aguarde melhor momento',
        urgency: 'low'
      }
    }

    if (isBreeder && roi < ROI_THRESHOLDS.POOR) {
      return {
        type: SALE_RECOMMENDATIONS.HOLD,
        reason: 'Animal reprodutor, manter para reprodução',
        urgency: 'none'
      }
    }

    return {
      type: SALE_RECOMMENDATIONS.WAIT,
      reason: 'Aguardar crescimento e melhores condições',
      urgency: 'low'
    }
  }

  const getROIBadgeVariant = (roi) => {
    if (roi >= ROI_THRESHOLDS.EXCELLENT) return 'success'
    if (roi >= ROI_THRESHOLDS.GOOD) return 'primary'
    if (roi >= ROI_THRESHOLDS.FAIR) return 'warning'
    return 'danger'
  }

  const getRecommendationBadge = (recommendation) => {
    const variants = {
      [SALE_RECOMMENDATIONS.IMMEDIATE]: { variant: 'success', text: 'Vender Agora' },
      [SALE_RECOMMENDATIONS.SOON]: { variant: 'primary', text: 'Vender em Breve' },
      [SALE_RECOMMENDATIONS.WAIT]: { variant: 'warning', text: 'Aguardar' },
      [SALE_RECOMMENDATIONS.HOLD]: { variant: 'neutral', text: 'Manter' }
    }
    return variants[recommendation.type] || { variant: 'neutral', text: 'Indefinido' }
  }

  const handleRecommendForSale = () => {
    const saleData = customAnalysis || analysis
    onRecommendSale({
      animalId: animal.animalId,
      suggestedPrice: saleData.salePrice || saleData.suggestedSalePrice,
      expectedProfit: saleData.profit,
      roi: saleData.roi,
      recommendation: saleData.recommendation
    })
    alert('✅ Sucesso! Animal recomendado para venda')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner" />
        <span className="ml-2">Analisando ROI...</span>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="text-center py-8">
        <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          Não foi possível carregar a análise ROI
        </p>
      </div>
    )
  }

  const currentAnalysis = customAnalysis || analysis

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Análise ROI - {animal.animalInfo?.serie || 'N/A'}{animal.animalInfo?.rg || 'N/A'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Análise de retorno sobre investimento e aptidão para venda
          </p>
        </div>
        <Button variant="secondary" onClick={onClose}>
          Fechar
        </Button>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <CurrencyDollarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Custo Total
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  R$ {analysis.totalCosts.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
                <TrendingUpIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  ROI Atual
                </p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentAnalysis.roi.toFixed(1)}%
                  </p>
                  <Badge variant={getROIBadgeVariant(currentAnalysis.roi)}>
                    {currentAnalysis.roi >= 0 ? 'Lucro' : 'Prejuízo'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                <ScaleIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Peso Atual
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analysis.currentWeight || 'N/A'} kg
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                <CalendarIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Idade
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analysis.ageInMonths} meses
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recommendation */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2" />
            Recomendação de Venda
          </h3>
        </CardHeader>
        <CardBody>
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              {currentAnalysis.recommendation.urgency === 'high' ? (
                <CheckCircleIcon className="h-8 w-8 text-green-500" />
              ) : currentAnalysis.recommendation.urgency === 'medium' ? (
                <ClockIcon className="h-8 w-8 text-yellow-500" />
              ) : (
                <ExclamationTriangleIcon className="h-8 w-8 text-gray-500" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <Badge variant={getRecommendationBadge(currentAnalysis.recommendation).variant}>
                  {getRecommendationBadge(currentAnalysis.recommendation).text}
                </Badge>
                <span className="text-sm text-gray-500">
                  Urgência: {currentAnalysis.recommendation.urgency === 'high' ? 'Alta' : 
                           currentAnalysis.recommendation.urgency === 'medium' ? 'Média' : 'Baixa'}
                </span>
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                {currentAnalysis.recommendation.reason}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Cost Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Breakdown de Custos
            </h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {analysis.costBreakdown.map((cost, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {cost.category}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    R$ {cost.amount.toLocaleString('pt-BR')}
                  </span>
                </div>
              ))}
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center font-bold">
                  <span>Total</span>
                  <span>R$ {analysis.totalCosts.toLocaleString('pt-BR')}</span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Simulação de Venda
            </h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Preço de Venda Projetado (R$)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={projectedSalePrice}
                    onChange={(e) => setProjectedSalePrice(e.target.value)}
                    className="input-field flex-1"
                    placeholder="Digite o valor"
                  />
                  <Button
                    variant="secondary"
                    onClick={calculateCustomROI}
                    disabled={!projectedSalePrice}
                  >
                    Calcular
                  </Button>
                </div>
              </div>

              {customAnalysis && (
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Lucro/Prejuízo:</span>
                    <span className={`font-medium ${
                      customAnalysis.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      R$ {customAnalysis.profit.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">ROI:</span>
                    <span className={`font-medium ${
                      customAnalysis.roi >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {customAnalysis.roi.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Margem de Lucro:</span>
                    <span className={`font-medium ${
                      customAnalysis.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {customAnalysis.profitMargin.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Market Analysis */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Análise de Mercado
          </h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Preço Médio de Mercado</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                R$ {analysis.marketPrice.toLocaleString('pt-BR')}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Tendência</p>
              <div className="flex items-center justify-center space-x-1">
                {analysis.marketTrend === 'up' ? (
                  <TrendingUpIcon className="h-5 w-5 text-green-500" />
                ) : (
                  <TrendingDownIcon className="h-5 w-5 text-red-500" />
                )}
                <span className={`font-medium ${
                  analysis.marketTrend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {analysis.marketTrend === 'up' ? 'Alta' : 'Baixa'}
                </span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Demanda</p>
              <Badge variant={analysis.marketDemand === 'high' ? 'success' : 
                            analysis.marketDemand === 'medium' ? 'warning' : 'danger'}>
                {analysis.marketDemand === 'high' ? 'Alta' : 
                 analysis.marketDemand === 'medium' ? 'Média' : 'Baixa'}
              </Badge>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        <Button variant="secondary" onClick={onClose}>
          Fechar
        </Button>
        {currentAnalysis.recommendation.type === SALE_RECOMMENDATIONS.IMMEDIATE && (
          <Button 
            variant="success" 
            onClick={handleRecommendForSale}
            leftIcon={<CheckCircleIcon className="h-4 w-4" />}
          >
            Recomendar para Venda
          </Button>
        )}
        {currentAnalysis.recommendation.type === SALE_RECOMMENDATIONS.SOON && (
          <Button 
            variant="primary" 
            onClick={handleRecommendForSale}
            leftIcon={<ClockIcon className="h-4 w-4" />}
          >
            Agendar Venda
          </Button>
        )}
      </div>
    </div>
  )
}