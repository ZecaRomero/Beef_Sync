import React, { useState } from 'react';

export default function NFSelectionSection({ 
  formData, 
  updateField, 
  nfsCadastradas, 
  setShowImportModal, 
  setShowNFModal 
}) {
  return (
    <div className="space-y-4">
      <h4 className="text-base font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 flex justify-between items-center">
        <span>Nota Fiscal de Entrada</span>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
          >
            📊 Importar Excel
          </button>
          <button
            type="button"
            onClick={() => setShowNFModal(true)}
            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
          >
            ➕ Nova NF
          </button>
        </div>
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Seleção de NF */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Vincular Nota Fiscal
          </label>
          <select
            value={formData.nfCompra}
            onChange={(e) => {
              const selectedId = e.target.value;
              updateField('nfCompra', selectedId);
              
              // Auto-fill values based on NF
              if (selectedId) {
                const nf = nfsCadastradas.find(n => n.id.toString() === selectedId.toString());
                if (nf) {
                  updateField('valorCompra', nf.valorPorReceptora || '');
                  updateField('origem', nf.origem || '');
                  updateField('dataEntrada', nf.dataCompra || '');
                }
              }
            }}
            className="input-field"
          >
            <option value="">Selecione uma NF...</option>
            {nfsCadastradas.map(nf => (
              <option key={nf.id} value={nf.id}>
                NF: {nf.numeroNF} - {nf.origem} ({new Date(nf.dataCompra).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>

        {/* Valor de Compra */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Valor de Compra (R$)
          </label>
          <input
            type="number"
            value={formData.valorCompra}
            onChange={(e) => updateField('valorCompra', e.target.value)}
            className="input-field"
            placeholder="0.00"
            step="0.01"
          />
        </div>

        {/* Peso de Entrada */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Peso de Entrada (kg)
          </label>
          <input
            type="number"
            value={formData.pesoEntrada}
            onChange={(e) => updateField('pesoEntrada', e.target.value)}
            className="input-field"
            placeholder="0.0"
            step="0.1"
          />
        </div>
      </div>
    </div>
  );
}
