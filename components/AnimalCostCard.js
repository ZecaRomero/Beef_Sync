
import React, { useEffect, useState } from 'react'

import { 
  CurrencyDollarIcon, 
  ChartBarIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

export default function AnimalCostCard({ animal, onUpdateCosts }) {
  const [custos, setCustos] = useState([])
  const [custoTotal, setCustoTotal] = useState(0)
  const [protocoloStatus, setProtocoloStatus] = useState('pendente')
  const [dnaStatus, setDnaStatus] = useState('pendente')

  useEffect(() => {
    loadCustos()
  }, [animal])

  const loadCustos = async () => {
    if (typeof window === 'undefined') return

    try {
      const { default: costManager } = await import('../services/costManager')
      
      const custosAnimal = await costManager.getCustosAnimal(animal.id)
      const arr = Array.isArray(custosAnimal) ? custosAnimal : []
      const total = arr.reduce((sum, custo) => sum + (parseFloat(custo.valor || 0) || 0), 0)
      
      setCustos(arr)
      setCustoTotal(total)
      
      const temProtocolo = arr.some(c => c.tipo === 'Protocolo Sanitário')
      const temDNA = arr.some(c => c.tipo === 'DNA')
      
      setProtocoloStatus(temProtocolo ? 'completo' : 'pendente')
      setDnaStatus(temDNA ? 'completo' : 'pendente')
      
      if (onUpdateCosts) {
        onUpdateCosts(animal.id, total)
      }
    } catch (error) {
      console.error('Erro ao carregar custos:', error)
    }
  }

  const aplicarProtocoloAutomatico = async () => {
    if (typeof window === 'undefined') return

    try {
      const { default: costManager } = await import('../services/costManager')
      
      const resultado = await costManager.aplicarProtocolo(animal.id, animal, 'Aplicação automática via card')
      
      if (resultado) {
        loadCustos()
        alert(`✅ Protocolo aplicado!\n\n📋 ${resultado.protocolo}\n💰 Custo: R$ ${resultado.total.toFixed(2)}`)
      } else {
        alert('ℹ️ Nenhum protocolo aplicável para este animal')
      }
    } catch (error) {
      console.error('Erro ao aplicar protocolo:', error)
      alert('❌ Erro ao aplicar protocolo')
    }
  }

  const aplicarDNAAutomatico = async () => {
    if (typeof window === 'undefined') return

    try {
      const { default: costManager } = await import('../services/costManager')
      
      const custosDNA = await costManager.adicionarCustoDNA(animal.id, animal)
      
      if (Array.isArray(custosDNA) && custosDNA.length > 0) {
        loadCustos()
        const total = custosDNA.reduce((sum, c) => sum + c.valor, 0)
        const tipos = custosDNA.map(c => c.subtipo).join(', ')
        alert(`✅ DNA aplicado!\n\n🧬 ${tipos}\n💰 Custo: R$ ${total.toFixed(2)}`)
      } else {
        alert('ℹ️ Nenhum DNA aplicável para este animal')
      }
    } catch (error) {
      console.error('Erro ao aplicar DNA:', error)
      alert('❌ Erro ao aplicar DNA')
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completo': return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      case 'parcial': return <ClockIcon className="h-4 w-4 text-yellow-500" />
      default: return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completo': return 'text-green-600 dark:text-green-400'
      case 'parcial': return 'text-yellow-600 dark:text-yellow-400'
      default: return 'text-red-600 dark:text-red-400'
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
          <h3 className="font-medium text-gray-900 dark:text-white">
            Custos Individuais
          </h3>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-green-600 dark:text-green-400">
            R$ {custoTotal.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {custos.length} itens
          </div>
        </div>
      </div>

      {/* Status dos Protocolos */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon(protocoloStatus)}
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Protocolo Sanitário
            </span>
          </div>
          <div className={`text-sm font-medium ${getStatusColor(protocoloStatus)}`}>
            {protocoloStatus === 'completo' ? 'Aplicado' : 'Pendente'}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon(dnaStatus)}
            <span className="text-sm text-gray-700 dark:text-gray-300">
              DNA
            </span>
          </div>
          <div className={`text-sm font-medium ${getStatusColor(dnaStatus)}`}>
            {dnaStatus === 'completo' ? 'Aplicado' : 'Pendente'}
          </div>
        </div>
      </div>

      {/* Informações do Animal */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="font-medium">Era:</span> {animal.meses} meses
          </div>
          <div>
            <span className="font-medium">Sexo:</span> {animal.sexo === 'M' ? 'Macho' : 'Fêmea'}
          </div>
          <div>
            <span className="font-medium">FIV:</span> {animal.isFiv ? 'Sim' : 'Não'}
          </div>
          <div>
            <span className="font-medium">Situação:</span> {animal.situacao}
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="flex space-x-2">
        {protocoloStatus === 'pendente' && (
          <button
            onClick={aplicarProtocoloAutomatico}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded-md transition-colors"
          >
            Aplicar Protocolo
          </button>
        )}
        
        {dnaStatus === 'pendente' && (
          <button
            onClick={aplicarDNAAutomatico}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs py-2 px-3 rounded-md transition-colors"
          >
            Aplicar DNA
          </button>
        )}

        {protocoloStatus === 'completo' && dnaStatus === 'completo' && (
          <div className="flex-1 text-center text-xs text-green-600 dark:text-green-400 py-2">
            ✅ Protocolos Completos
          </div>
        )}
      </div>

      {/* Últimos Custos */}
      {custos.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
          <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Últimos Custos:
          </h4>
          <div className="space-y-1">
            {custos.slice(-3).map(custo => (
              <div key={custo.id} className="flex justify-between items-center text-xs">
                <span className="text-gray-600 dark:text-gray-400 truncate">
                  {custo.tipo} {custo.subtipo && `• ${custo.subtipo}`}
                </span>
                <span className="font-medium text-green-600 dark:text-green-400 ml-2">
                  R$ {custo.valor.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}