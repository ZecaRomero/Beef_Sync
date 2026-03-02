
import React, { useEffect, useState } from 'react'

import { 
  CurrencyDollarIcon, 
  TrendingUpIcon, 
  TrendingDownIcon,
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

export default function CostSummaryWidget() {
  const [resumo, setResumo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadResumo()
  }, [])

  const loadResumo = async () => {
    if (typeof window === 'undefined') return

    try {
      const { default: costManager } = await import('../services/costManager')
      const { default: animalDataManager } = await import('../services/animalDataManager')
      
      const relatorioGeral = await costManager.getRelatorioGeral()
      const animals = animalDataManager.getAllAnimals()
      
      // Calcular estatísticas adicionais
      let animaisComProtocolo = 0
      let animaisComDNA = 0
      for (const animal of animals) {
        const custos = await costManager.getCustosAnimal(animal.id)
        const arr = Array.isArray(custos) ? custos : []
        if (arr.some(c => c.tipo === 'Protocolo Sanitário')) animaisComProtocolo++
        if (arr.some(c => c.tipo === 'DNA')) animaisComDNA++
      }

      const animaisPendentes = animals.length - (relatorioGeral?.animaisComCustos || 0)

      // Custos por tipo
      const custosPorTipo = {}
      ;(relatorioGeral?.custoPorAnimal || []).forEach(({ custos }) => {
        ;(custos || []).forEach(custo => {
          if (!custosPorTipo[custo.tipo]) {
            custosPorTipo[custo.tipo] = 0
          }
          custosPorTipo[custo.tipo] += custo.valor
        })
      })

      setResumo({
        ...relatorioGeral,
        totalAnimais: animals.length,
        animaisComProtocolo,
        animaisComDNA,
        animaisPendentes,
        custosPorTipo,
        percentualComCustos: animals.length > 0 ? ((relatorioGeral?.animaisComCustos || 0) / animals.length * 100) : 0
      })
    } catch (error) {
      console.error('Erro ao carregar resumo de custos:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!resumo) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <ExclamationTriangleIcon className="h-8 w-8 mx-auto mb-2" />
          <p>Erro ao carregar dados de custos</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded-lg">
            <CurrencyDollarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Resumo de Custos
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Controle financeiro do rebanho
            </p>
          </div>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            R$ {resumo.totalGeral.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Custo Total</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            R$ {resumo.mediaPorAnimal.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Média/Animal</div>
        </div>
      </div>

      {/* Status dos Animais */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700 dark:text-gray-300">Animais com custos:</span>
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900 dark:text-white">
              {resumo.animaisComCustos}/{resumo.totalAnimais}
            </span>
            <span className="text-xs text-green-600 dark:text-green-400">
              ({resumo.percentualComCustos.toFixed(1)}%)
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700 dark:text-gray-300">Com protocolo:</span>
          <span className="font-medium text-blue-600 dark:text-blue-400">
            {resumo.animaisComProtocolo}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700 dark:text-gray-300">Com DNA:</span>
          <span className="font-medium text-purple-600 dark:text-purple-400">
            {resumo.animaisComDNA}
          </span>
        </div>

        {resumo.animaisPendentes > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700 dark:text-gray-300">Pendentes:</span>
            <span className="font-medium text-red-600 dark:text-red-400">
              {resumo.animaisPendentes}
            </span>
          </div>
        )}
      </div>

      {/* Custos por Tipo */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Custos por Categoria:
        </h4>
        <div className="space-y-2">
          {Object.entries(resumo.custosPorTipo)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([tipo, valor]) => (
              <div key={tipo} className="flex justify-between items-center">
                <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {tipo}
                </span>
                <span className="text-xs font-medium text-gray-900 dark:text-white ml-2">
                  R$ {valor.toFixed(2)}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Alertas */}
      {resumo.animaisPendentes > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <span className="text-xs text-yellow-800 dark:text-yellow-200">
              {resumo.animaisPendentes} animais sem custos registrados
            </span>
          </div>
        </div>
      )}

      {/* Ação Rápida */}
      <div className="mt-4">
        <button
          onClick={() => window.location.href = '/custos'}
          className="w-full bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-4 rounded-md transition-colors flex items-center justify-center space-x-2"
        >
          <ChartBarIcon className="h-4 w-4" />
          <span>Ver Detalhes Completos</span>
        </button>
      </div>
    </div>
  )
}