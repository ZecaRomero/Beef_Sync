

import React, { useState } from 'react'

function NFModalSimple({ onSave, onClose, naturezasOperacao = [] }) {
  const [formData, setFormData] = useState({
    numeroNF: '',
    dataCompra: '',
    fornecedor: '',
    naturezaOperacaoId: '',
    observacoes: '',
    itens: []
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.numeroNF && formData.dataCompra && formData.fornecedor) {
      const dadosCompletos = {
        ...formData,
        valorTotal: 0,
        quantidadeAnimais: 0
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
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
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

        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Salvar NF
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NFModalSimple
