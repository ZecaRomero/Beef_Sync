import React from 'react';
import CostPreview from './CostPreview';

export default function ProtocolSection({ formData, updateField }) {
  return (
    <div className="space-y-4">
      <h4 className="text-base font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
        Protocolos e Custos Iniciais
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Aplicar Protocolo */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-300 dark:border-blue-600">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.aplicarProtocolo}
              onChange={(e) => updateField('aplicarProtocolo', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3 h-5 w-5"
            />
            <div>
              <span className="font-medium text-gray-900 dark:text-white block">
                🧪 Aplicar Protocolo Automático
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Protocolo sanitário baseado na idade e sexo
              </p>
            </div>
          </label>
        </div>

        {/* Aplicar DNA */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-300 dark:border-purple-600">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.aplicarDNA}
              onChange={(e) => updateField('aplicarDNA', e.target.checked)}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 mr-3 h-5 w-5"
            />
            <div>
              <span className="font-medium text-gray-900 dark:text-white block">
                🧬 Aplicar DNA Automático
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                DNA Virgem (FIV) e Genômica (0-7 meses)
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Preview dos Custos */}
      {(formData.aplicarProtocolo || formData.aplicarDNA) && formData.sexo && formData.meses >= 0 && (
        <CostPreview
          animal={formData}
          aplicarProtocolo={formData.aplicarProtocolo}
          aplicarDNA={formData.aplicarDNA}
        />
      )}
    </div>
  );
}
