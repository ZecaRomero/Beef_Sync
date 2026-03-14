import React, { useState } from 'react';
import { XMarkIcon } from '../ui/Icons';

// Modal de NF para Receptoras
export default function NFModal({ isOpen, onClose, onSave }) {
  const [dadosNF, setDadosNF] = useState({
    numeroNF: "",
    origem: "",
    fornecedor: "",
    dataCompra: "",
    valorTotal: "",
    quantidadeReceptoras: "",
    observacoes: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Calcular valor por receptora
    const valorTotal = parseFloat(dadosNF.valorTotal) || 0;
    const qtd = parseInt(dadosNF.quantidadeReceptoras) || 1;
    const valorPorReceptora = valorTotal / qtd;

    const novaNF = {
      id: Date.now(),
      ...dadosNF,
      valorTotal,
      quantidadeReceptoras: qtd,
      valorPorReceptora
    };

    onSave(novaNF);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[600px] max-w-full m-4">
        <div className="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            🧾 Nova Nota Fiscal
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Número da NF
              </label>
              <input
                type="text"
                value={dadosNF.numeroNF}
                onChange={(e) => setDadosNF({...dadosNF, numeroNF: e.target.value})}
                className="input-field"
                required
                placeholder="Ex: 123456"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data da Compra
              </label>
              <input
                type="date"
                value={dadosNF.dataCompra}
                onChange={(e) => setDadosNF({...dadosNF, dataCompra: e.target.value})}
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Origem / Fazenda
              </label>
              <input
                type="text"
                value={dadosNF.origem}
                onChange={(e) => setDadosNF({...dadosNF, origem: e.target.value})}
                className="input-field"
                required
                placeholder="Ex: Fazenda Santa Maria"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fornecedor (Opcional)
              </label>
              <input
                type="text"
                value={dadosNF.fornecedor}
                onChange={(e) => setDadosNF({...dadosNF, fornecedor: e.target.value})}
                className="input-field"
                placeholder="Nome do fornecedor"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Valor Total (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={dadosNF.valorTotal}
                onChange={(e) => setDadosNF({...dadosNF, valorTotal: e.target.value})}
                className="input-field"
                required
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Qtd. Animais na NF
              </label>
              <input
                type="number"
                value={dadosNF.quantidadeReceptoras}
                onChange={(e) => setDadosNF({...dadosNF, quantidadeReceptoras: e.target.value})}
                className="input-field"
                required
                min="1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Observações
            </label>
            <textarea
              value={dadosNF.observacoes}
              onChange={(e) => setDadosNF({...dadosNF, observacoes: e.target.value})}
              className="input-field"
              rows={2}
              placeholder="Detalhes adicionais..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Adicionar NF
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
