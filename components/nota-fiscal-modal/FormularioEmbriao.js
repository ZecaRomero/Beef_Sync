import React from 'react'
import { PlusIcon } from '../ui/Icons'
import { formatCurrencyInput, parseCurrencyValue } from './utils'

export default function FormularioEmbriao({ novoItem, setNovoItem, adicionarItem }) {
  const calcularValorTotal = () => {
    const embrioes = parseInt(novoItem.quantidadeEmbrioes) || 0
    const valorUnit = parseCurrencyValue(novoItem.valorUnitario)
    return Math.round(embrioes * valorUnit * 100) / 100
  }

  return (
    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
      <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-3">
        🧫 Adicionar Embrião
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Doadora *
          </label>
          <input
            type="text"
            value={novoItem.doadora}
            onChange={(e) => setNovoItem(prev => ({ ...prev, doadora: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            placeholder="Nome/ID da doadora"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Touro *
          </label>
          <input
            type="text"
            value={novoItem.touro}
            onChange={(e) => setNovoItem(prev => ({ ...prev, touro: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            placeholder="Nome/ID do touro"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Raça
          </label>
          <input
            type="text"
            value={novoItem.raca}
            onChange={(e) => setNovoItem(prev => ({ ...prev, raca: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            placeholder="Ex: Nelore"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Quantidade de Embriões *
          </label>
          <input
            type="number"
            value={novoItem.quantidadeEmbrioes}
            onChange={(e) => setNovoItem(prev => ({ ...prev, quantidadeEmbrioes: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Valor Unitário * (R$)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400">R$</span>
            <input
              type="text"
              value={novoItem.valorUnitario || ''}
              onChange={(e) => {
                const formatted = formatCurrencyInput(e.target.value)
                setNovoItem(prev => ({ ...prev, valorUnitario: formatted }))
              }}
              onBlur={(e) => {
                const numValue = parseCurrencyValue(e.target.value)
                if (numValue > 0) {
                  const formatted = numValue.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })
                  setNovoItem(prev => ({ ...prev, valorUnitario: formatted }))
                }
              }}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="0,00"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Valor Total
          </label>
          <input
            type="text"
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calcularValorTotal())}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tipo de Embrião
          </label>
          <select
            value={novoItem.tipoEmbriao}
            onChange={(e) => setNovoItem(prev => ({ ...prev, tipoEmbriao: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Selecione...</option>
            <option value="in_vitro">In Vitro (FIV)</option>
            <option value="in_vivo">In Vivo (TE)</option>
            <option value="fresco">Fresco</option>
            <option value="congelado">Congelado</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Qualidade
          </label>
          <select
            value={novoItem.qualidade}
            onChange={(e) => setNovoItem(prev => ({ ...prev, qualidade: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Selecione...</option>
            <option value="A">A - Excelente</option>
            <option value="B">B - Bom</option>
            <option value="C">C - Regular</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Data de Coleta
          </label>
          <input
            type="date"
            value={novoItem.dataColeta}
            onChange={(e) => setNovoItem(prev => ({ ...prev, dataColeta: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={adicionarItem}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Adicionar Embrião</span>
        </button>
      </div>
    </div>
  )
}
