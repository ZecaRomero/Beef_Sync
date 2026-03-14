import React, { useState, useEffect } from 'react'
import { Card } from '../ui/Card'
import {
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  TrendingUpIcon,
  SparklesIcon
} from '../ui/Icons'

export default function DGStatistics() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('all')

  useEffect(() => {
    loadStatistics()
  }, [period])

  const loadStatistics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reproducao/diagnostico-gestacao/statistics?period=${period}`)
      if (response.ok) {
        const result = await response.json()
        setStats(result.data)
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas de DG:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!stats) return null

  const taxaPositiva = stats.total_dgs > 0
    ? ((stats.total_positivas / stats.total_dgs) * 100).toFixed(1)
    : 0

  const taxaNegativa = stats.total_dgs > 0
    ? ((stats.total_negativas / stats.total_dgs) * 100).toFixed(1)
    : 0

  return (
    <div className="space-y-6">
      {/* Filtro de Período */}
      <div className="flex gap-2">
        {['all', 'month', 'quarter', 'year'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === p
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {p === 'all' ? 'Todos' : p === 'month' ? 'Este Mês' : p === 'quarter' ? 'Trimestre' : 'Ano'}
          </button>
        ))}
      </div>

      {/* Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total de DGs</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.total_dgs || 0}
              </p>
            </div>
            <ChartBarIcon className="h-12 w-12 text-blue-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Taxa Positiva</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {taxaPositiva}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stats.total_positivas || 0} gestantes
              </p>
            </div>
            <CheckCircleIcon className="h-12 w-12 text-green-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Taxa Negativa</p>
              <p className="text-3xl font-bold text-red-600 mt-1">
                {taxaNegativa}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stats.total_negativas || 0} vazias
              </p>
            </div>
            <XCircleIcon className="h-12 w-12 text-red-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Animais Diagnosticados</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.total_animais || 0}
              </p>
            </div>
            <TrendingUpIcon className="h-12 w-12 text-purple-600 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Estatísticas Detalhadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendência Mensal */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
            Tendência Mensal
          </h3>
          <div className="space-y-3">
            {stats.tendencia_mensal && stats.tendencia_mensal.length > 0 ? (
              stats.tendencia_mensal.slice(-6).map((mes, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {mes.mes}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {mes.total || 0} DGs
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${((mes.total || 0) / (stats.max_mensal || 1)) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span className="text-green-600">✓ {mes.positivas || 0}</span>
                      <span className="text-red-600">✗ {mes.negativas || 0}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                Nenhum dado disponível
              </p>
            )}
          </div>
        </Card>

        {/* Estatísticas por Raça */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-yellow-600" />
            Taxa de Sucesso por Raça
          </h3>
          <div className="space-y-3">
            {stats.por_raca && stats.por_raca.length > 0 ? (
              stats.por_raca.map((raca, idx) => (
                <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">{raca.raca}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {raca.total || 0} DGs
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${raca.taxa_positiva || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-green-600">
                      {raca.taxa_positiva || 0}%
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                Nenhum dado disponível
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
