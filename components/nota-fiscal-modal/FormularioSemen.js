import React from 'react'
import { PlusIcon } from '../ui/Icons'
import { formatCurrencyInput, parseCurrencyValue } from './utils'

export default function FormularioSemen({ novoItem, setNovoItem, adicionarItem }) {
  const calcularValorTotal = () => {
    const doses = parseInt(novoItem.quantidadeDoses) || 0
    const valorUnit = parseCurrencyValue(novoItem.valorUnitario)
    return Math.round(doses * valorUnit * 100) / 100
  }

  return (
    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
      <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-3">
        🧬 Adicionar Sêmen
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nome do Touro *
          </label>
          <input
            type="text"
            value={novoItem.nomeTouro}
            onChange={(e) => setNovoItem(prev => ({ ...prev, nomeTouro: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
            placeholder="Digite aqui... "
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            RG do Touro
          </label>
          <input
            type="text"
            value={novoItem.rgTouro}
            onChange={(e) => setNovoItem(prev => ({ ...prev, rgTouro: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
            placeholder="Digite aqui... "
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
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
            placeholder="Ex: Nelore"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Quantidade de Doses *
          </label>
          <input
            type="number"
            value={novoItem.quantidadeDoses}
            onChange={(e) => setNovoItem(prev => ({ ...prev, quantidadeDoses: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Valor Unitário/Dose * (R$)
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
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
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
            Botijão
          </label>
          <input
            type="text"
            value={novoItem.botijao}
            onChange={(e) => setNovoItem(prev => ({ ...prev, botijao: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
            placeholder="Ex: B001"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Caneca
          </label>
          <input
            type="text"
            value={novoItem.caneca}
            onChange={(e) => setNovoItem(prev => ({ ...prev, caneca: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
            placeholder="Ex: C001"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Certificado
          </label>
          <input
            type="text"
            value={novoItem.certificado}
            onChange={(e) => setNovoItem(prev => ({ ...prev, certificado: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
            placeholder="Número do certificado"
          />
        </div>

        <div className="md:col-span-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Data de Validade
          </label>
          <input
            type="date"
            value={novoItem.dataValidade}
            onChange={(e) => setNovoItem(prev => ({ ...prev, dataValidade: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={adicionarItem}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Adicionar Sêmen</span>
        </button>
      </div>
    </div>
  )
}
