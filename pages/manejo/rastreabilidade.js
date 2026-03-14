import React, { useState, useEffect } from 'react'
import { MapPinIcon, PlusIcon, ClockIcon } from '../../components/ui/Icons'

export default function Rastreabilidade() {
  const [mounted, setMounted] = useState(false)
  const [historiaData, setHistoriaData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAnimal, setSelectedAnimal] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      loadHistoriaData()
    }
  }, [mounted, selectedAnimal])

  const loadHistoriaData = () => {
    try {
      setIsLoading(true)
      if (typeof window === 'undefined') {
        setIsLoading(false)
        return
      }

      const savedData = localStorage.getItem('historiaMovimentos')
      if (savedData) {
        const allData = JSON.parse(savedData)
        if (selectedAnimal) {
          setHistoriaData(allData.filter(item => item.animal === selectedAnimal))
        } else {
          setHistoriaData(allData)
        }
      } else {
        setHistoriaData([])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setHistoriaData([])
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MapPinIcon className="w-8 h-8 text-amber-600" />
            Rastreabilidade
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Histórico completo de movimentos dos animais</p>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Filtrar por animal/RG..."
          value={selectedAnimal}
          onChange={(e) => setSelectedAnimal(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Carregando histórico...</div>
        </div>
      ) : historiaData.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-12 text-center">
          <MapPinIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Nenhum registro de movimento
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {selectedAnimal ? 'Nenhum movimento encontrado para este animal' : 'Comece registrando movimentos dos animais'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {historiaData.map((item, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white">{item.animal || 'Animal não identificado'}</span>
                      {item.rg && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">RG: {item.rg}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <MapPinIcon className="w-4 h-4" />
                      <span>De: {item.origem || '-'}</span>
                    </div>
                    <span>→</span>
                    <div className="flex items-center gap-1">
                      <MapPinIcon className="w-4 h-4" />
                      <span>Para: {item.destino || '-'}</span>
                    </div>
                  </div>
                  {item.data && (
                    <div className="flex items-center gap-1 mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <ClockIcon className="w-4 h-4" />
                      <span>{new Date(item.data).toLocaleString('pt-BR')}</span>
                    </div>
                  )}
                  {item.observacoes && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{item.observacoes}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

