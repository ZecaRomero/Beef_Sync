
import React, { useEffect, useState } from 'react'

import { useRouter } from 'next/router'

export default function BirthDashboard() {
  const router = useRouter()
  const [births, setBirths] = useState([])
  const [stats, setStats] = useState({})

  useEffect(() => {
    loadBirths()
  }, [])

  const loadBirths = () => {
    const savedBirths = localStorage.getItem('birthData')
    if (savedBirths) {
      const birthData = JSON.parse(savedBirths)
      setBirths(birthData)
      calculateStats(birthData)
    }
  }

  const calculateStats = (birthData) => {
    const total = birthData.length
    const nascidos = birthData.filter(b => b.status === 'nascido').length
    const machos = birthData.filter(b => b.sexo === 'M' && b.status === 'nascido').length
    const femeas = birthData.filter(b => b.sexo === 'F' && b.status === 'nascido').length
    const mortos = birthData.filter(b => b.status === 'morto').length
    const abortos = birthData.filter(b => b.status === 'aborto').length
    const gestantes = birthData.filter(b => b.status === 'gestante').length
    const atrasadas = birthData.filter(b => b.status === 'gestante_atrasada').length

    // Taxa de sucesso
    const totalFinalizados = nascidos + mortos + abortos
    const taxaSucesso = totalFinalizados > 0 ? (nascidos / totalFinalizados * 100) : 0

    // Estatísticas por touro
    const statsByTouro = birthData.reduce((acc, birth) => {
      if (!acc[birth.touro]) {
        acc[birth.touro] = { total: 0, nascidos: 0, machos: 0, femeas: 0 }
      }
      acc[birth.touro].total++
      if (birth.status === 'nascido') {
        acc[birth.touro].nascidos++
        if (birth.sexo === 'M') acc[birth.touro].machos++
        if (birth.sexo === 'F') acc[birth.touro].femeas++
      }
      return acc
    }, {})

    // Nascimentos por mês
    const nascimentosPorMes = birthData
      .filter(b => b.data)
      .reduce((acc, birth) => {
        const mes = new Date(birth.data).toISOString().slice(0, 7) // YYYY-MM
        acc[mes] = (acc[mes] || 0) + 1
        return acc
      }, {})

    setStats({
      total,
      nascidos,
      machos,
      femeas,
      mortos,
      abortos,
      gestantes,
      atrasadas,
      taxaSucesso,
      statsByTouro,
      nascimentosPorMes,
      melhorTouro: Object.entries(statsByTouro).reduce((best, [touro, stats]) => {
        const taxa = stats.total > 0 ? (stats.nascidos / stats.total * 100) : 0
        return taxa > (best.taxa || 0) ? { touro, taxa, ...stats } : best
      }, {})
    })
  }

  const cards = [
    {
      title: 'Total de Registros',
      value: stats.total || 0,
      icon: '📊',
      color: 'bg-blue-500',
      textColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Nascimentos',
      value: stats.nascidos || 0,
      icon: '🐄',
      color: 'bg-green-500',
      textColor: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Machos',
      value: stats.machos || 0,
      icon: '🐂',
      color: 'bg-blue-500',
      textColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Fêmeas',
      value: stats.femeas || 0,
      icon: '🐄',
      color: 'bg-pink-500',
      textColor: 'text-pink-600 dark:text-pink-400'
    },
    {
      title: 'Gestantes',
      value: stats.gestantes || 0,
      icon: '🤱',
      color: 'bg-purple-500',
      textColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      title: 'Atrasadas',
      value: stats.atrasadas || 0,
      icon: '⚠️',
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600 dark:text-yellow-400'
    },
    {
      title: 'Taxa de Sucesso',
      value: `${(stats.taxaSucesso || 0).toFixed(1)}%`,
      icon: '📈',
      color: 'bg-green-500',
      textColor: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Mortalidade',
      value: (stats.mortos || 0) + (stats.abortos || 0),
      icon: '💔',
      color: 'bg-red-500',
      textColor: 'text-red-600 dark:text-red-400'
    }
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
          🐄 Dashboard de Nascimentos
        </h2>
        <button
          onClick={() => router.push('/nascimentos')}
          className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
        >
          Ver Detalhes →
        </button>
      </div>

      {births.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-2">🐄</div>
          <div className="text-sm mb-2">Nenhum nascimento registrado</div>
          <button
            onClick={() => router.push('/nascimentos')}
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            Começar a registrar nascimentos
          </button>
        </div>
      ) : (
        <>
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {cards.map((card, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-2xl font-bold ${card.textColor}`}>
                      {card.value}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {card.title}
                    </div>
                  </div>
                  <div className="text-2xl">
                    {card.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Melhor Touro */}
          {stats.melhorTouro?.touro && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                🏆 Melhor Performance
              </h3>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <strong>{stats.melhorTouro.touro}</strong> - {stats.melhorTouro.taxa.toFixed(1)}% de sucesso
                ({stats.melhorTouro.nascidos} nascidos de {stats.melhorTouro.total} tentativas)
              </div>
            </div>
          )}

          {/* Alertas Rápidos */}
          {stats.atrasadas > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg mb-6">
              <div className="flex items-center">
                <div className="text-yellow-600 dark:text-yellow-400 mr-3">⚠️</div>
                <div>
                  <div className="font-semibold text-yellow-800 dark:text-yellow-200">
                    {stats.atrasadas} receptoras com parto atrasado
                  </div>
                  <div className="text-sm text-yellow-700 dark:text-yellow-300">
                    Verificar receptoras que deveriam ter parido
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Top 3 Touros */}
          {Object.keys(stats.statsByTouro || {}).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                📊 Top Touros
              </h3>
              <div className="space-y-3">
                {Object.entries(stats.statsByTouro)
                  .sort(([,a], [,b]) => (b.nascidos / Math.max(b.total, 1)) - (a.nascidos / Math.max(a.total, 1)))
                  .slice(0, 3)
                  .map(([touro, tourosStats], index) => {
                    const taxa = tourosStats.total > 0 ? (tourosStats.nascidos / tourosStats.total * 100) : 0
                    return (
                      <div key={touro} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                            index === 0 ? 'bg-yellow-500' :
                            index === 1 ? 'bg-gray-400' :
                            'bg-orange-600'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white text-sm">
                              {touro.length > 30 ? touro.substring(0, 30) + '...' : touro}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {tourosStats.nascidos} nascidos de {tourosStats.total} tentativas
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600 dark:text-green-400">
                            {taxa.toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            sucesso
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}