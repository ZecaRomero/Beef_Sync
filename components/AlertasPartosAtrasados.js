import React, { useState, useEffect } from 'react'
import { ExclamationTriangleIcon, ClockIcon } from './ui/Icons'

export default function AlertasPartosAtrasados() {
  const [alertas, setAlertas] = useState([])
  const [loading, setLoading] = useState(true)
  const [proximos, setProximos] = useState([])

  useEffect(() => {
    loadAlertas()
    // Atualizar a cada 5 minutos
    const interval = setInterval(loadAlertas, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const loadAlertas = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/verificar-partos-atrasados')
      if (response.ok) {
        const data = await response.json()
        setAlertas(data.data?.partosAtrasados || [])
        setProximos(data.data?.partosProximos || [])
      }
    } catch (error) {
      console.error('Erro ao carregar alertas:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (alertas.length === 0 && proximos.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Alertas de Partos Atrasados */}
      {alertas.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">
              Partos Atrasados ({alertas.length})
            </h3>
          </div>
          <div className="space-y-2">
            {alertas.slice(0, 10).map((alerta, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded p-3 border border-red-200 dark:border-red-800">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {alerta.receptora_nome}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Data esperada: <span className="font-semibold">{formatDate(alerta.data_esperada_parto)}</span>
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400 font-semibold">
                      {alerta.dias_atraso} dia(s) de atraso
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      TE realizada em {formatDate(alerta.data_te)} • Doadora: {alerta.doadora_nome}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {alertas.length > 10 && (
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center pt-2">
                ... e mais {alertas.length - 10} parto(s) atrasado(s)
              </p>
            )}
          </div>
        </div>
      )}

      {/* Partos Próximos */}
      {proximos.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <ClockIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300">
              Partos Próximos ({proximos.length})
            </h3>
          </div>
          <div className="space-y-2">
            {proximos.slice(0, 5).map((proximo, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded p-3 border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {proximo.receptora_nome}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Previsão: <span className="font-semibold">{formatDate(proximo.data_esperada_parto)}</span>
                    </p>
                    <p className="text-sm text-yellow-600 dark:text-yellow-400 font-semibold">
                      {proximo.dias_restantes > 0 ? `${proximo.dias_restantes} dia(s) restante(s)` : 'Parto esperado hoje'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
