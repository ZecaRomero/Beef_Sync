
import React, { useEffect, useState } from 'react'

import { XMarkIcon } from './ui/Icons'
import { useAutocomplete } from '../hooks/useAutocomplete'

export default function BirthForm({ birth, onSave, onClose }) {
  const [formData, setFormData] = useState({
    receptora: '',
    doador: '',
    rg: 'CJCJ',
    prevParto: '',
    nascimento: '',
    tatuagem: '',
    cc: '',
    ps1: '',
    ps2: '',
    morte: '',
    observacao: '',
    sexo: '',
    touro: '',
    data: '',
    status: 'gestante',
    peso: '',
    cor: '',
    dificuldadeParto: 'normal',
    veterinario: '',
    horaNascimento: '',
    tipoCobertura: 'FIV',
    custoDNA: 50.00,
    descarte: false
  })

  useEffect(() => {
    if (birth) {
      setFormData(birth)
    }
  }, [birth])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Calcular custo DNA automaticamente baseado no tipo de cobertura e status
    let custoDNA = 0
    if (formData.status === 'nascido') {
      if (formData.tipoCobertura === 'FIV') {
        custoDNA = 50.00 // DNA Paternidade para FIV
      } else if (formData.tipoCobertura === 'IA') {
        custoDNA = 80.00 // DNA Genômica para IA
      }
    }
    
    const birthData = {
      ...formData,
      custoDNA: formData.custoDNA || custoDNA,
      id: birth ? birth.id : Date.now()
    }

    onSave(birthData)
    onClose()
  }

  // Atualizar custo DNA automaticamente quando mudar tipo de cobertura ou status
  useEffect(() => {
    if (formData.status === 'nascido') {
      if (formData.tipoCobertura === 'FIV') {
        setFormData(prev => ({ ...prev, custoDNA: 50.00 }))
      } else if (formData.tipoCobertura === 'IA') {
        setFormData(prev => ({ ...prev, custoDNA: 80.00 }))
      }
    } else {
      setFormData(prev => ({ ...prev, custoDNA: 0 }))
    }
  }, [formData.tipoCobertura, formData.status])

  const { data: acInseminacoes } = useAutocomplete('inseminacoes')
  const touros = [
    'A3139 FIV GUADALUPE-IDEAL',
    'ORIGINAL NATIMORTO',
    'ORIGINAL 16/1/24',
    'B2847 FIV SUPREMO',
    'C1234 FIV CAMPEÃO',
    'D5678 FIV ELITE',
    ...(acInseminacoes?.touro_nome || [])
  ].filter(Boolean)

  const { data: acAnimais } = useAutocomplete('animais')
  const { data: acGestacoes } = useAutocomplete('gestacoes')
  const receptoraSugestoes = [...new Set([...(acAnimais?.serie || []), ...(acGestacoes?.receptora_nome || []), ...(acGestacoes?.receptora_serie || [])])]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {birth ? 'Editar Nascimento' : 'Novo Nascimento'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Dados da Receptora */}
            <div className="lg:col-span-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                🐄 Dados da Receptora
              </h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Receptora *
              </label>
              <input
                type="text"
                list="datalist-birth-receptora"
                value={formData.receptora}
                onChange={(e) => setFormData({...formData, receptora: e.target.value})}
                className="input-field"
                placeholder="Ex: AF 6039"
                required
              />
              <datalist id="datalist-birth-receptora">
                {receptoraSugestoes.map((v, i) => <option key={i} value={v} />)}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Doador
              </label>
              <input
                type="text"
                list="datalist-birth-doador"
                value={formData.doador}
                onChange={(e) => setFormData({...formData, doador: e.target.value})}
                className="input-field"
                placeholder="Ex: AF 6039"
              />
              <datalist id="datalist-birth-doador">
                {receptoraSugestoes.map((v, i) => <option key={i} value={v} />)}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                RG/Série
              </label>
              <select
                value={formData.rg}
                onChange={(e) => setFormData({...formData, rg: e.target.value})}
                className="input-field"
              >
                <option value="CJCJ">CJCJ</option>
                <option value="BENT">BENT</option>
                <option value="CJCG">CJCG</option>
                <option value="RPT">RPT</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prev. Parto
              </label>
              <input
                type="text"
                value={formData.prevParto}
                onChange={(e) => setFormData({...formData, prevParto: e.target.value})}
                className="input-field"
                placeholder="Ex: 15785"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data Nascimento Prevista
              </label>
              <input
                type="text"
                value={formData.nascimento}
                onChange={(e) => setFormData({...formData, nascimento: e.target.value})}
                className="input-field"
                placeholder="Ex: 01/25"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Touro *
              </label>
              <input
                type="text"
                list="datalist-birth-touro"
                value={formData.touro}
                onChange={(e) => setFormData({...formData, touro: e.target.value})}
                className="input-field"
                placeholder="Selecione ou digite o touro"
                required
              />
              <datalist id="datalist-birth-touro">
                {[...new Set(touros)].map((v, i) => <option key={i} value={v} />)}
              </datalist>
            </div>

            {/* Dados do Nascimento */}
            <div className="lg:col-span-3 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                🐄 Dados do Nascimento
              </h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="input-field"
                required
              >
                <option value="gestante">Gestante</option>
                <option value="gestante_atrasada">Gestante Atrasada</option>
                <option value="nascido">Nascido</option>
                <option value="morto">Morto</option>
                <option value="aborto">Aborto</option>
                <option value="cio">Cio (Repetiu)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de Cobertura *
              </label>
              <select
                value={formData.tipoCobertura}
                onChange={(e) => setFormData({...formData, tipoCobertura: e.target.value})}
                className="input-field"
                required
              >
                <option value="FIV">FIV (Receptora)</option>
                <option value="IA">IA (Inseminação Artificial)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data Real do Parto
              </label>
              <input
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({...formData, data: e.target.value})}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hora do Nascimento
              </label>
              <input
                type="time"
                value={formData.horaNascimento}
                onChange={(e) => setFormData({...formData, horaNascimento: e.target.value})}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sexo
              </label>
              <select
                value={formData.sexo}
                onChange={(e) => setFormData({...formData, sexo: e.target.value})}
                className="input-field"
              >
                <option value="">Não definido</option>
                <option value="M">Macho</option>
                <option value="F">Fêmea</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tatuagem
              </label>
              <input
                type="text"
                value={formData.tatuagem}
                onChange={(e) => setFormData({...formData, tatuagem: e.target.value})}
                className="input-field"
                placeholder="Ex: 02/08/25"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                CC (Controle)
              </label>
              <input
                type="text"
                value={formData.cc}
                onChange={(e) => setFormData({...formData, cc: e.target.value})}
                className="input-field"
                placeholder="Ex: 17234"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Peso (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.peso}
                onChange={(e) => setFormData({...formData, peso: e.target.value})}
                className="input-field"
                placeholder="Ex: 35.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cor
              </label>
              <select
                value={formData.cor}
                onChange={(e) => setFormData({...formData, cor: e.target.value})}
                className="input-field"
              >
                <option value="">Selecione</option>
                <option value="branco">Branco</option>
                <option value="cinza">Cinza</option>
                <option value="vermelho">Vermelho</option>
                <option value="preto">Preto</option>
                <option value="malhado">Malhado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                PS1
              </label>
              <input
                type="text"
                value={formData.ps1}
                onChange={(e) => setFormData({...formData, ps1: e.target.value})}
                className="input-field"
                placeholder="Ex: BR"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                PS2
              </label>
              <input
                type="text"
                value={formData.ps2}
                onChange={(e) => setFormData({...formData, ps2: e.target.value})}
                className="input-field"
                placeholder="Ex: 39"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dificuldade do Parto
              </label>
              <select
                value={formData.dificuldadeParto}
                onChange={(e) => setFormData({...formData, dificuldadeParto: e.target.value})}
                className="input-field"
              >
                <option value="normal">Normal</option>
                <option value="assistido">Assistido</option>
                <option value="cesariana">Cesariana</option>
                <option value="dificil">Difícil</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Veterinário
              </label>
              <input
                type="text"
                value={formData.veterinario}
                onChange={(e) => setFormData({...formData, veterinario: e.target.value})}
                className="input-field"
                placeholder="Nome do veterinário"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Custo DNA (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.custoDNA}
                onChange={(e) => setFormData({...formData, custoDNA: parseFloat(e.target.value) || 0})}
                className="input-field"
                placeholder="Custo automático baseado no tipo"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                FIV: R$ 50,00 (Paternidade) | IA: R$ 80,00 (Genômica)
              </div>
            </div>

            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Observações
              </label>
              <textarea
                value={formData.observacao}
                onChange={(e) => setFormData({...formData, observacao: e.target.value})}
                className="input-field"
                rows="3"
                placeholder="Ex: FIV nelore, suspeita de aborto, etc."
              />
            </div>

            {/* Checkboxes */}
            <div className="lg:col-span-3 space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.morte === 'X'}
                  onChange={(e) => setFormData({...formData, morte: e.target.checked ? 'X' : ''})}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Marcar como morto
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.descarte}
                  onChange={(e) => setFormData({...formData, descarte: e.target.checked})}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Marcar para descarte (defeitos, rabo branco, etc.)
                </span>
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
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
              {birth ? 'Atualizar' : 'Salvar'} Nascimento
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}