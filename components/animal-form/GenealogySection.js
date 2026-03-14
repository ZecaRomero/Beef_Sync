import React from 'react';

export default function GenealogySection({ formData, updateField, autocompleteData = {} }) {
  const ac = autocompleteData
  return (
    <div className="space-y-4">
      <h4 className="text-base font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
        Genealogia
      </h4>

      {/* Pai */}
      <div className="space-y-2">
        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
          ðÅ¸�â€š Pai
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-1">
            <label className="block text-xs text-gray-500 mb-1">SÃ©rie</label>
            <input
              type="text"
              list="datalist-pai-serie"
              value={formData.paiSerie}
              onChange={(e) => updateField('paiSerie', e.target.value)}
              className="input-field"
              placeholder="SÃ©rie"
            />
            <datalist id="datalist-pai-serie">{(ac.serie || []).map((v, i) => <option key={i} value={v} />)}</datalist>
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs text-gray-500 mb-1">RG</label>
            <input
              type="text"
              list="datalist-pai-rg"
              value={formData.paiRg}
              onChange={(e) => updateField('paiRg', e.target.value)}
              className="input-field"
              placeholder="RG"
            />
            <datalist id="datalist-pai-rg">{(ac.rg || []).map((v, i) => <option key={i} value={v} />)}</datalist>
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs text-gray-500 mb-1">Nome</label>
            <input
              type="text"
              list="datalist-pai-nome"
              value={formData.pai}
              onChange={(e) => updateField('pai', e.target.value)}
              className="input-field"
              placeholder="Nome do Pai"
            />
            <datalist id="datalist-pai-nome">{(ac.pai || []).map((v, i) => <option key={i} value={v} />)}</datalist>
          </div>
        </div>
      </div>

      {/* MÃ£e */}
      <div className="space-y-2">
        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
          ðÅ¸�â€ž MÃ£e
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-1">
            <label className="block text-xs text-gray-500 mb-1">SÃ©rie</label>
            <input
              type="text"
              list="datalist-mae-serie"
              value={formData.maeSerie}
              onChange={(e) => updateField('maeSerie', e.target.value)}
              className="input-field"
              placeholder="SÃ©rie"
            />
            <datalist id="datalist-mae-serie">{(ac.serie || []).map((v, i) => <option key={i} value={v} />)}</datalist>
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs text-gray-500 mb-1">RG</label>
            <input
              type="text"
              list="datalist-mae-rg"
              value={formData.maeRg}
              onChange={(e) => updateField('maeRg', e.target.value)}
              className="input-field"
              placeholder="RG"
            />
            <datalist id="datalist-mae-rg">{(ac.rg || []).map((v, i) => <option key={i} value={v} />)}</datalist>
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs text-gray-500 mb-1">Nome</label>
            <input
              type="text"
              list="datalist-mae-nome"
              value={formData.mae}
              onChange={(e) => updateField('mae', e.target.value)}
              className="input-field"
              placeholder="Nome da MÃ£e"
            />
            <datalist id="datalist-mae-nome">{(ac.mae || []).map((v, i) => <option key={i} value={v} />)}</datalist>
          </div>
        </div>
      </div>

      {/* SituaÃ§Ã£o ABCZ */}
      <div className="space-y-2">
        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
          SituaÃ§Ã£o ABCZ
        </h5>
        <select
          value={formData.situacaoAbcz || ''}
          onChange={(e) => updateField('situacaoAbcz', e.target.value)}
          className="input-field"
        >
          <option value="">Selecione...</option>
          <option value="OK para RG">OK para RG</option>
          <option value="Possui RGD">Possui RGD</option>
          <option value="Possui RGN">Possui RGN</option>
          <option value="Pendente">Pendente</option>
          <option value="NÃ£o informado">NÃ£o informado</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">Status do registro na ABCZ (RG, RGD, RGN)</p>
      </div>
    </div>
  );
}
