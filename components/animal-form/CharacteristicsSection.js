import React from 'react';
import ReceptoraOrigemManager from './ReceptoraOrigemManager';
import { SITUACOES_ANIMAL as SITUACOES } from '../../utils/constants';

export default function CharacteristicsSection({ 
  formData, 
  updateField, 
  handleDateChange, 
  errors 
}) {

  return (
    <div className="space-y-4">
      <h4 className="text-base font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
        CaracterÃ­sticas
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Data de Nascimento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Data de Nascimento
          </label>
          <input
            type="date"
            value={formData.dataNascimento}
            onChange={(e) => handleDateChange(e.target.value)}
            disabled={formData.serie === 'RPT'}
            className="input-field"
          />
        </div>

        {/* Meses */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Idade (Meses)
          </label>
          <input
            type="number"
            value={formData.meses}
            onChange={(e) => updateField('meses', parseInt(e.target.value) || 0)}
            readOnly={formData.serie === 'RPT'}
            className="input-field"
          />
        </div>
      </div>

      {/* Data de Chegada - Para Receptoras */}
      {formData.serie === 'RPT' && (
        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-700">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">ðÅ¸â€œâ€¦</span>
            <h5 className="text-sm font-bold text-orange-800 dark:text-orange-200">
              Data de Chegada (Para DG)
            </h5>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-orange-700 dark:text-orange-300 mb-1">
                Data de Chegada
              </label>
              <input
                type="date"
                value={formData.dataChegada || ''}
                onChange={(e) => updateField('dataChegada', e.target.value)}
                className="input-field border-orange-200 focus:border-orange-500"
              />
            </div>
            {formData.dataChegada && (
              <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-lg">
                <p className="text-xs text-orange-700 dark:text-orange-300 mb-1">
                  ðÅ¸â€œÅ’ DG Previsto (15 dias apÃ³s chegada):
                </p>
                <p className="text-sm font-bold text-orange-900 dark:text-orange-200">
                  {new Date(new Date(formData.dataChegada).getTime() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}
          </div>
          <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
            âÅ¡ ï¸� O sistema calcularÃ¡ automaticamente a data do DG (15 dias apÃ³s a chegada) e emitirÃ¡ alertas quando estiver prÃ³ximo.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* SituaÃ§Ã£o */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            SituaÃ§Ã£o *
          </label>
          <select
            value={formData.situacao}
            onChange={(e) => updateField('situacao', e.target.value)}
            className={`input-field ${errors.situacao ? 'input-error' : ''}`}
          >
            {SITUACOES.map(situacao => (
              <option key={situacao} value={situacao}>
                {situacao}
              </option>
            ))}
          </select>
          {errors.situacao && (
            <p className="text-red-500 text-xs mt-1">{errors.situacao}</p>
          )}
        </div>

        {/* FIV Checkbox */}
        <div>
           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
             Origem FIV?
           </label>
           <div className="flex space-x-4">
             <button
               type="button"
               onClick={() => updateField('isFiv', true)}
               className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                 formData.isFiv === true
                   ? 'border-purple-500 bg-purple-50 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                   : 'border-gray-300 dark:border-gray-600 hover:border-purple-300'
               }`}
             >
               ðÅ¸§¬ Sim (FIV)
             </button>
             <button
               type="button"
               onClick={() => updateField('isFiv', false)}
               className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                 formData.isFiv === false
                   ? 'border-gray-500 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300'
                   : 'border-gray-300 dark:border-gray-600 hover:border-gray-300'
               }`}
             >
               Natural
             </button>
           </div>
        </div>
      </div>

      {/* Dados EspecÃ­ficos para FIV ou Receptora */}
      {formData.isFiv && (
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800 space-y-3">
          <h5 className="text-sm font-medium text-purple-800 dark:text-purple-200">
            Dados da Receptora (MÃ£e de Aluguel)
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
             <div>
               <label className="block text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">
                 RG Receptora
               </label>
               <input 
                 type="text"
                 value={formData.receptoraRg}
                 onChange={(e) => updateField('receptoraRg', e.target.value)}
                 className="input-field border-purple-200 focus:border-purple-500"
                 placeholder="RG da Receptora"
               />
             </div>
             <div>
                <label className="block text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">
                  Origem da Receptora
                </label>
                <ReceptoraOrigemManager 
                  value={formData.origem}
                  onChange={(val) => updateField('origem', val)}
                />
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
