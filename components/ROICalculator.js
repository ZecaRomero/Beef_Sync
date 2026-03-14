

import React, { useEffect, useState } from 'react'

export default function ROICalculator({ isOpen, onClose }) {
  const [investment, setInvestment] = useState('')
  const [revenue, setRevenue] = useState('')
  const [period, setPeriod] = useState('')
  const [results, setResults] = useState(null)

  const calculateROI = () => {
    const inv = parseFloat(investment) || 0
    const rev = parseFloat(revenue) || 0
    const per = parseFloat(period) || 1

    if (inv > 0) {
      const profit = rev - inv
      const roi = (profit / inv) * 100
      const monthlyROI = roi / per
      const breakEven = inv / (rev / per)

      setResults({
        profit,
        roi,
        monthlyROI,
        breakEven: breakEven > 0 ? breakEven : 0,
        profitMargin: rev > 0 ? (profit / rev) * 100 : 0
      })
    }
  }

  useEffect(() => {
    calculateROI()
  }, [investment, revenue, period])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            🧮 Calculadora ROI
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              💰 Investimento Total (R$)
            </label>
            <input
              type="number"
              value={investment}
              onChange={(e) => setInvestment(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Ex: 3500.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              📈 Receita Esperada (R$)
            </label>
            <input
              type="number"
              value={revenue}
              onChange={(e) => setRevenue(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Ex: 4500.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              📅 Período (meses)
            </label>
            <input
              type="number"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Ex: 18"
            />
          </div>
        </div>

        {/* Results */}
        {results && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📊 Resultados
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className={`text-lg font-bold ${results.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {results.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-gray-500">Lucro</div>
              </div>
              
              <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className={`text-lg font-bold ${results.roi >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {results.roi.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">ROI Total</div>
              </div>
              
              <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-lg font-bold text-purple-600">
                  {results.monthlyROI.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">ROI Mensal</div>
              </div>
              
              <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-lg font-bold text-orange-600">
                  {results.profitMargin.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">Margem</div>
              </div>
            </div>

            {results.breakEven > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⏱️ Ponto de equilíbrio: {results.breakEven.toFixed(1)} meses
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}