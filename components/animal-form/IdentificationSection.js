import React from 'react';

export default function IdentificationSection({ 
  formData, 
  updateField, 
  handleSerieChange, 
  errors, 
  seriesOptions = [],
  availableLocations = [],
  autocompleteData = {}
}) {
  const ac = autocompleteData
  const SERIES_OPTIONS = [
    { value: 'RPT', label: 'RPT - Receptora' },
    { value: 'BENT', label: 'BENT - Brahman' },
    { value: 'CJCJ', label: 'CJCJ - Nelore' },
    { value: 'CJCG', label: 'CJCG - Gir' },
    { value: 'PA', label: 'PA - Nelore PA' }
  ];

  return (
    <div className="space-y-4">
      <h4 className="text-base font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
        Identificação
      </h4>
      
      {/* Nome */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Nome do Animal
        </label>
        <input
          type="text"
          list="datalist-animal-nome"
          value={formData.nome || ''}
          onChange={(e) => updateField('nome', e.target.value)}
          className="input-field"
          placeholder="Nome do animal (opcional)"
        />
        <datalist id="datalist-animal-nome">
          {(ac.nome || []).map((v, i) => <option key={i} value={v} />)}
        </datalist>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Série */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Série *
          </label>
          <select
            value={formData.serie}
            onChange={(e) => handleSerieChange(e.target.value)}
            className={`input-field ${errors.serie ? 'input-error' : ''}`}
          >
            <option value="">Selecione...</option>
            {SERIES_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.serie && (
            <p className="text-red-500 text-xs mt-1">{errors.serie}</p>
          )}
        </div>

        {/* RG */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            RG *
          </label>
          <input
            type={formData.serie === 'PA' ? "text" : "number"}
            value={formData.rg}
            onChange={(e) => {
              let value = e.target.value;
              if (formData.serie === 'PA') {
                value = value.toUpperCase().replace(/[^A-Z0-9 ]/g, '');
              }
              updateField('rg', value)
            }}
            className={`input-field ${errors.rg ? 'input-error' : ''}`}
            placeholder={formData.serie === 'PA' ? "Ex: AA1234" : "Até 6 dígitos"}
            maxLength={20}
          />
          {errors.rg && (
            <p className="text-red-500 text-xs mt-1">{errors.rg}</p>
          )}
        </div>

        {/* Raça */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Raça *
          </label>
          <input
            type="text"
            list="datalist-animal-raca"
            value={formData.raca}
            onChange={(e) => updateField('raca', e.target.value)}
            className={`input-field ${errors.raca ? 'input-error' : ''}`}
            readOnly={formData.serie === 'RPT'}
          />
          <datalist id="datalist-animal-raca">
            {(ac.raca || []).map((v, i) => <option key={i} value={v} />)}
          </datalist>
          {errors.raca && (
            <p className="text-red-500 text-xs mt-1">{errors.raca}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Boletim (Local de Entrada) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Boletim (Local de Entrada) *
          </label>
          <input
            type="text"
            list="datalist-animal-boletim"
            value={formData.boletim || ''}
            onChange={(e) => updateField('boletim', e.target.value)}
            className={`input-field w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${errors.boletim ? 'border-red-500' : ''}`}
            placeholder="Selecione ou digite..."
          />
          <datalist id="datalist-animal-boletim">
            <option value="AGROPECUARIA PARDINHO" />
            <option value="FAZENDA SANT ANNA RANCHARIA" />
            {(ac.boletim || []).map((v, i) => <option key={i} value={v} />)}
          </datalist>
          {errors.boletim && (
            <p className="text-red-500 text-xs mt-1">{errors.boletim}</p>
          )}
        </div>

        {/* Localização Atual (Piquete) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Localização Atual (Piquete) *
          </label>
          <input
            type="text"
            list="datalist-animal-piquete"
            value={formData.pastoAtual || ''}
            onChange={(e) => updateField('pastoAtual', e.target.value)}
            className={`input-field w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${errors.pastoAtual ? 'border-red-500' : ''}`}
            placeholder="Selecione ou digite..."
          />
          <datalist id="datalist-animal-piquete">
            {[...new Set([...(availableLocations || []), ...(ac.piquete || [])])].map((loc, i) => (
              <option key={`atual-${i}`} value={loc} />
            ))}
          </datalist>
          {errors.pastoAtual && (
            <p className="text-red-500 text-xs mt-1">{errors.pastoAtual}</p>
          )}
        </div>
      </div>

      {/* Sexo Selection - Moved here for visibility */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Sexo *
        </label>
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => updateField('sexo', 'Macho')}
            disabled={formData.serie === 'RPT'}
            className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
              formData.sexo === 'Macho'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 text-gray-700 dark:text-gray-200'
            } ${formData.serie === 'RPT' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            🐂 Macho
          </button>
          <button
            type="button"
            onClick={() => updateField('sexo', 'Fêmea')}
            className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
              formData.sexo === 'Fêmea'
                ? 'border-pink-500 bg-pink-50 dark:bg-pink-900 text-pink-700 dark:text-pink-300'
                : 'border-gray-300 dark:border-gray-600 hover:border-pink-300 text-gray-700 dark:text-gray-200'
            }`}
          >
            🐄 Fêmea
          </button>
        </div>
        {errors.sexo && (
          <p className="text-red-500 text-xs mt-1">{errors.sexo}</p>
        )}
      </div>
    </div>
  );
}
