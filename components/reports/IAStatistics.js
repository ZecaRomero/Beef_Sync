import React, { useState, useEffect } from 'react'
import { Card } from '../ui/Card'
import {
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CalendarIcon,
  UserGroupIcon,
  TrendingUpIcon,
  SparklesIcon
} from '../ui/Icons'

export default function IAStatistics() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('all') // all, month, quarter, year

  useEffect(() => {
    loadStatistics()
  }, [period])

  const loadStatistics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reproducao/inseminacao/statistics?period=${period}`)
      if (response.ok) {
        const result = await response.json()
        setStats(result.data)
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas de IA:', error)
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

  const taxaSucesso = stats.total_inseminacoes > 0 
    ? ((stats.total_positivas / stats.total_inseminacoes) * 100).toFixed(1)
    : 0

  const taxaFalha = stats.total_inseminacoes > 0
    ? ((stats.total_negativas / stats.total_inseminacoes) * 100).toFixed(1)
    : 0

  return (
    <div className="space-y-6">
      {/* Filtro de Período */}
      <div className="flex gap-2">
        <button
          onClick={() => setPeriod('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            period === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setPeriod('month')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            period === 'month'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Este Mês
        </button>
        <button
          onClick={() => setPeriod('quarter')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            period === 'quarter'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Trimestre
        </button>
        <button
          onClick={() => setPeriod('year')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            period === 'year'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Ano
        </button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total de Inseminações</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.total_inseminacoes || 0}
              </p>
            </div>
            <ChartBarIcon className="h-12 w-12 text-blue-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Taxa de Sucesso</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {taxaSucesso}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stats.total_positivas || 0} positivas
              </p>
            </div>
            <CheckCircleIcon className="h-12 w-12 text-green-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Taxa de Falha</p>
              <p className="text-3xl font-bold text-red-600 mt-1">
                {taxaFalha}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stats.total_negativas || 0} negativas
              </p>
            </div>
            <XCircleIcon className="h-12 w-12 text-red-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Animais Inseminados</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.total_animais || 0}
              </p>
            </div>
            <UserGroupIcon className="h-12 w-12 text-purple-600 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Estatísticas Detalhadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Touros */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-yellow-600" />
            Top Touros
          </h3>
          <div className="space-y-3">
            {stats.top_touros && stats.top_touros.length > 0 ? (
              stats.top_touros.slice(0, 5).map((touro, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{touro.nome || `${touro.serie}${touro.rg}`}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {touro.total_ias || 0} inseminações
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      {touro.taxa_sucesso || 0}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {touro.total_positivas || 0}/{touro.total_ias || 0}
                    </p>
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

        {/* Estatísticas Mensais */}
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
                        {mes.total || 0} IAs
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${((mes.total || 0) / (stats.max_mensal || 1)) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>✓ {mes.positivas || 0}</span>
                      <span>✗ {mes.negativas || 0}</span>
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
      </div>

      {/* Estatísticas por Raça */}
      {stats.por_raca && stats.por_raca.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Estatísticas por Raça
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.por_raca.map((raca, idx) => (
              <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white mb-2">{raca.raca}</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total:</span>
                    <span className="font-medium">{raca.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Taxa Sucesso:</span>
                    <span className="font-medium text-green-600">{raca.taxa_sucesso || 0}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
