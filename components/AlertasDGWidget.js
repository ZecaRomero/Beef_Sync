import React, { useEffect, useState } from 'react'
import { Card, CardBody } from './ui/Card'

export default function AlertasDGWidget() {
  const [alertas, setAlertas] = useState({ proximos: [], atrasados: [] })
  const [loading, setLoading] = useState(true)
  const [mostrarAtrasados, setMostrarAtrasados] = useState(false)
  const [mostrarProximos, setMostrarProximos] = useState(false)

  useEffect(() => {
    carregarAlertas()
    // Atualizar a cada 5 minutos
    const interval = setInterval(carregarAlertas, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const carregarAlertas = async () => {
    try {
      const res = await fetch('/api/alertas-dg')
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setAlertas(data.data)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar alertas:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="mb-6">
        <CardBody className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </CardBody>
      </Card>
    )
  }

  const totalAlertas = alertas.proximos.length + alertas.atrasados.length

  if (totalAlertas === 0) return null

  return (
    <Card className="mb-6 border-2 border-orange-400 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 shadow-xl">
      <CardBody className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-pulse">⚠️</span>
            <div>
              <h3 className="text-xl font-bold text-orange-800 dark:text-orange-300">
                Alertas de Diagnóstico de Gestação
              </h3>
              <p className="text-xs text-orange-700 dark:text-orange-400">DG é feito 15 dias após a chegada dos animais</p>
            </div>
          </div>
          <div className="bg-red-600 text-white px-4 py-1 rounded-full font-bold">
            {totalAlertas} {totalAlertas === 1 ? 'alerta' : 'alertas'}
          </div>
        </div>

        {/* Resumo Estatístico */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-orange-200 dark:border-orange-700">
          <button
            onClick={() => setMostrarAtrasados(!mostrarAtrasados)}
            className="text-center hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg p-2 transition-colors cursor-pointer"
          >
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {alertas.atrasados.length}
            </div>
            <div className="text-xs font-medium text-red-700 dark:text-red-300 uppercase">
              DG Atrasado
            </div>
            {alertas.atrasados.length > 0 && (
              <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                Até {Math.max(...alertas.atrasados.map(a => a.dias_atraso))} dias de atraso
              </div>
            )}
            {alertas.atrasados.length > 0 && (
              <div className="text-xs text-red-500 dark:text-red-400 mt-2 font-medium">
                {mostrarAtrasados ? '▲ Ocultar lista' : '▼ Ver lista'}
              </div>
            )}
          </button>
          
          <button
            onClick={() => setMostrarProximos(!mostrarProximos)}
            className="text-center border-l border-r border-orange-200 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg p-2 transition-colors cursor-pointer"
          >
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {alertas.proximos.filter(a => parseInt(a.dias_restantes) <= 2).length}
            </div>
            <div className="text-xs font-medium text-orange-700 dark:text-orange-300 uppercase">
              Urgente (0-2 dias)
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
              Requer atenção imediata
            </div>
            {alertas.proximos.length > 0 && (
              <div className="text-xs text-orange-500 dark:text-orange-400 mt-2 font-medium">
                {mostrarProximos ? '▲ Ocultar lista' : '▼ Ver lista'}
              </div>
            )}
          </button>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {alertas.proximos.filter(a => parseInt(a.dias_restantes) > 2).length}
            </div>
            <div className="text-xs font-medium text-yellow-700 dark:text-yellow-300 uppercase">
              Próximos (3-7 dias)
            </div>
            <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
              Planeje com antecedência
            </div>
          </div>
        </div>

        {/* Alertas Atrasados - Mostrar apenas se clicar */}
        {mostrarAtrasados && alertas.atrasados.length > 0 && (
          <div className="mb-4">
            <h4 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
              <span>🔴</span>
              <span>DG Atrasado ({alertas.atrasados.length})</span>
            </h4>
            <div className="space-y-2">
              {alertas.atrasados.map(animal => (
                <div
                  key={animal.id}
                  className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-600 p-3 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-red-900 dark:text-red-200">
                        {animal.serie}-{animal.rg}
                      </span>
                      {animal.nome && (
                        <span className="text-red-700 dark:text-red-300 ml-2">
                          ({animal.nome})
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-red-700 dark:text-red-300">
                        DG previsto: {new Date(animal.data_dg_prevista).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-xs font-bold text-red-900 dark:text-red-200">
                        Atrasado há {animal.dias_atraso} {animal.dias_atraso === 1 ? 'dia' : 'dias'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alertas Próximos - Mostrar apenas se clicar */}
        {mostrarProximos && alertas.proximos.length > 0 && (
          <div>
            <h4 className="text-lg font-bold text-orange-700 dark:text-orange-400 mb-2 flex items-center gap-2">
              <span>🟡</span>
              <span>DG Próximo - Próximos 7 dias ({alertas.proximos.length})</span>
            </h4>
            <div className="space-y-2">
              {alertas.proximos.map(animal => {
                const diasRestantes = parseInt(animal.dias_restantes)
                const corAlerta = diasRestantes <= 2 ? 'orange' : 'yellow'
                
                return (
                  <div
                    key={animal.id}
                    className={`bg-${corAlerta}-100 dark:bg-${corAlerta}-900/30 border-l-4 border-${corAlerta}-600 p-3 rounded-lg`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className={`font-bold text-${corAlerta}-900 dark:text-${corAlerta}-200`}>
                          {animal.serie}-{animal.rg}
                        </span>
                        {animal.nome && (
                          <span className={`text-${corAlerta}-700 dark:text-${corAlerta}-300 ml-2`}>
                            ({animal.nome})
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className={`text-sm text-${corAlerta}-700 dark:text-${corAlerta}-300`}>
                          DG previsto: {new Date(animal.data_dg_prevista).toLocaleDateString('pt-BR')}
                        </div>
                        <div className={`text-xs font-bold text-${corAlerta}-900 dark:text-${corAlerta}-200`}>
                          {diasRestantes === 0 ? 'HOJE!' : `Em ${diasRestantes} ${diasRestantes === 1 ? 'dia' : 'dias'}`}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-orange-300 dark:border-orange-700 flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => window.location.href = '/reproducao/gestacao'}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Ver Todos os DGs Pendentes
          </button>
          <a
            href="/api/receptoras/export-dg-pendentes"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Exportar Excel (Receptoras sem DG)
          </a>
        </div>
      </CardBody>
    </Card>
  )
}
