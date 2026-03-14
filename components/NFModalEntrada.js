
import React, { useState } from 'react'

import { TrashIcon } from './ui/Icons'

// Componente NFModal melhorado com campos de animais
function NFModal({ onSave, onClose, naturezasOperacao = [] }) {
  const [formData, setFormData] = useState({
    numeroNF: '',
    dataCompra: '',
    fornecedor: '',
    naturezaOperacaoId: '',
    observacoes: '',
    itens: []
  })
  
  const [novoItem, setNovoItem] = useState({
    tatuagem: '',
    sexo: '',
    era: '',
    valorUnitario: '',
    peso: '',
    raca: '',
    observacoes: ''
  })

  const adicionarItem = () => {
    if (novoItem.tatuagem && novoItem.sexo && novoItem.era && novoItem.valorUnitario) {
      const item = {
        ...novoItem,
        valorUnitario: parseFloat(novoItem.valorUnitario),
        peso: novoItem.peso ? parseFloat(novoItem.peso) : null
      }
      
      setFormData(prev => ({
        ...prev,
        itens: [...prev.itens, item]
      }))
      
      setNovoItem({
        tatuagem: '',
        sexo: '',
        era: '',
        valorUnitario: '',
        peso: '',
        raca: '',
        observacoes: ''
      })
    }
  }
  
  const removerItem = (index) => {
    setFormData(prev => ({
      ...prev,
      itens: prev.itens.filter((_, i) => i !== index)
    }))
  }
  
  const calcularValorTotal = () => {
    return formData.itens.reduce((total, item) => total + item.valorUnitario, 0)
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.numeroNF && formData.dataCompra && formData.fornecedor && formData.itens.length > 0) {
      const dadosCompletos = {
        ...formData,
        valorTotal: calcularValorTotal(),
        quantidadeAnimais: formData.itens.length
      }
      onSave(dadosCompletos)
      setFormData({
        numeroNF: '',
        dataCompra: '',
        fornecedor: '',
        naturezaOperacaoId: '',
        observacoes: '',
        itens: []
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Nova Nota Fiscal de Entrada
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados da NF */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Dados da Nota Fiscal</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Número da NF *
                </label>
                <input
                  type="text"
                  required
                  value={formData.numeroNF}
                  onChange={(e) => setFormData(prev => ({ ...prev, numeroNF: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data da Compra *
                </label>
                <input
                  type="date"
                  required
                  value={formData.dataCompra}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataCompra: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fornecedor *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fornecedor}
                  onChange={(e) => setFormData(prev => ({ ...prev, fornecedor: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Natureza da Operação
                </label>
                <select
                  value={formData.naturezaOperacaoId}
                  onChange={(e) => setFormData(prev => ({ ...prev, naturezaOperacaoId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Selecione...</option>
                  {naturezasOperacao.map((natureza) => (
                    <option key={natureza.id} value={natureza.id}>
                      {natureza.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Adicionar Animal */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">Adicionar Animal</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tatuagem *
                </label>
                <input
                  type="text"
                  required
                  value={novoItem.tatuagem}
                  onChange={(e) => setNovoItem(prev => ({ ...prev, tatuagem: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sexo *
                </label>
                <select
                  required
                  value={novoItem.sexo}
                  onChange={(e) => setNovoItem(prev => ({ ...prev, sexo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Selecione...</option>
                  <option value="macho">Macho</option>
                  <option value="femea">Fêmea</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Era *
                </label>
                <input
                  type="text"
                  required
                  value={novoItem.era}
                  onChange={(e) => setNovoItem(prev => ({ ...prev, era: e.target.value }))}
                  placeholder="0/3 - 4/8 - 9/12 - 13/24 - 25/36 - +36, touro"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valor Unitário *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={novoItem.valorUnitario}
                  onChange={(e) => setNovoItem(prev => ({ ...prev, valorUnitario: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={novoItem.peso}
                  onChange={(e) => setNovoItem(prev => ({ ...prev, peso: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="mt-3">
              <button
                type="button"
                onClick={adicionarItem}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Adicionar Animal
              </button>
            </div>
          </div>

          {/* Lista de Animais */}
          {formData.itens.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Animais Adicionados ({formData.itens.length}) - Total: {formatCurrency(calcularValorTotal())}
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                  <thead className="bg-gray-100 dark:bg-gray-600">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Tatuagem
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Sexo
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Era
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Valor Unit.
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Peso
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Raça
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                    {formData.itens.map((item, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2 text-xs text-gray-900 dark:text-white font-medium">
                          {item.tatuagem}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-900 dark:text-white">
                          {item.sexo}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-900 dark:text-white">
                          {item.era}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-900 dark:text-white">
                          {formatCurrency(item.valorUnitario)}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-900 dark:text-white">
                          {item.peso ? `${item.peso} kg` : '-'}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-900 dark:text-white">
                          {item.raca || '-'}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          <button
                            type="button"
                            onClick={() => removerItem(index)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Observações
            </label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={formData.itens.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Salvar NF ({formData.itens.length} animais)
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NFModal
