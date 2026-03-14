
import React, { useState } from 'react'

import { PencilIcon, CheckIcon, XMarkIcon, TrashIcon } from './ui/Icons'

export default function EditableMedicineItem({ 
  medicine, 
  onUpdate, 
  onDelete, 
  showDelete = false,
  medicamentos = {} 
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    nome: medicine.nome || '',
    quantidade: medicine.quantidade || 1,
    unidade: medicine.unidade || 'ML',
    condicional: medicine.condicional || ''
  })

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = () => {
    if (!editData.nome.trim()) {
      alert('Nome do medicamento é obrigatório')
      return
    }

    const updatedMedicine = {
      ...medicine,
      nome: editData.nome,
      quantidade: editData.condicional ? undefined : parseFloat(editData.quantidade) || 1,
      unidade: editData.condicional ? undefined : editData.unidade,
      condicional: editData.condicional || undefined
    }

    onUpdate(updatedMedicine)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditData({
      nome: medicine.nome || '',
      quantidade: medicine.quantidade || 1,
      unidade: medicine.unidade || 'ML',
      condicional: medicine.condicional || ''
    })
    setIsEditing(false)
  }

  const getMedicinePrice = (medicineName) => {
    const medicineKey = Object.keys(medicamentos).find(key => 
      key.toLowerCase().includes(medicineName.toLowerCase()) ||
      medicineName.toLowerCase().includes(key.toLowerCase().replace(/_/g, ' '))
    )
    return medicineKey ? medicamentos[medicineKey] : null
  }

  const medicineInfo = getMedicinePrice(medicine.nome)
  
  const formatMedicineInfo = (info) => {
    if (!info) return null
    
    if (info.tipoAplicacao === 'lote') {
      return {
        ...info,
        displayText: `${info.animaisPorLote || 1} animais/lote`,
        priceText: `R$${info.porAnimal?.toFixed(2)}/animal`,
        badgeColor: 'bg-purple-200 dark:bg-purple-700 text-purple-900 dark:text-purple-100'
      }
    } else {
      return {
        ...info,
        displayText: 'Individual',
        priceText: `R$${info.porAnimal?.toFixed(2)}`,
        badgeColor: 'bg-green-200 dark:bg-green-700 text-green-900 dark:text-green-100'
      }
    }
  }

  const formattedMedicineInfo = formatMedicineInfo(medicineInfo)

  if (isEditing) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-400 dark:border-blue-500 p-2 rounded-lg shadow-sm">
        <div className="space-y-2">
          <div>
            <label className="block text-xs font-medium text-gray-800 dark:text-gray-200 mb-1">
              Nome
            </label>
            <input
              type="text"
              value={editData.nome}
              onChange={(e) => setEditData({...editData, nome: e.target.value})}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Nome do medicamento"
              autoFocus
            />
          </div>

          {!editData.condicional && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-800 dark:text-gray-200 mb-1">
                  Qtd
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={editData.quantidade}
                  onChange={(e) => setEditData({...editData, quantidade: e.target.value})}
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-800 dark:text-gray-200 mb-1">
                  Unidade
                </label>
                <select
                  value={editData.unidade}
                  onChange={(e) => setEditData({...editData, unidade: e.target.value})}
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="ML">ML</option>
                  <option value="DOSE">DOSE</option>
                  <option value="KG">KG</option>
                  <option value="APLICACAO">APLIC</option>
                  <option value="PROCEDIMENTO">PROC</option>
                  <option value="KG_DIA">KG/D</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-800 dark:text-gray-200 mb-1">
              Condicional
            </label>
            <select
              value={editData.condicional}
              onChange={(e) => setEditData({...editData, condicional: e.target.value})}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">Nenhuma</option>
              <option value="FIV">FIV</option>
              <option value="TODOS_0_7">0-7 meses</option>
            </select>
          </div>

          <div className="flex space-x-2 pt-1">
            <button
              onClick={handleSave}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors flex items-center justify-center"
            >
              <CheckIcon className="h-3 w-3 mr-1" />
              Salvar
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors flex items-center justify-center"
            >
              <XMarkIcon className="h-3 w-3 mr-1" />
              Cancelar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-1 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-1">
            <span className="font-medium text-gray-900 dark:text-gray-100 text-xs">
              {medicine.nome}
            </span>
            {formattedMedicineInfo && (
              <div className="flex items-center space-x-1">
                <span className={`text-xs px-1 py-0 rounded ${formattedMedicineInfo.badgeColor}`}>
                  {formattedMedicineInfo.priceText}
                </span>
                {formattedMedicineInfo.tipoAplicacao === 'lote' && (
                  <span className="text-xs bg-blue-200 dark:bg-blue-700 text-blue-900 dark:text-blue-100 px-1 py-0 rounded">
                    📦 {formattedMedicineInfo.displayText}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="text-xs text-gray-800 dark:text-gray-200 mt-0.5">
            {medicine.condicional ? (
              <span className="bg-yellow-200 dark:bg-yellow-700 text-yellow-900 dark:text-yellow-100 px-1 py-0 rounded text-xs">
                {medicine.condicional === 'FIV' ? 'FIV' : 
                 medicine.condicional === 'TODOS_0_7' ? '0-7 meses' : 
                 medicine.condicional}
              </span>
            ) : (
              <span className="bg-blue-200 dark:bg-blue-700 text-blue-900 dark:text-blue-100 px-1 py-0 rounded text-xs">
                {medicine.quantidade} {medicine.unidade}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-0.5">
          <button
            onClick={handleEdit}
            className="bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-700 p-0.5 rounded transition-colors"
            title="Editar"
          >
            <PencilIcon className="h-3 w-3" />
          </button>
          {showDelete && (
            <button
              onClick={() => {
                if (confirm(`Remover ${medicine.nome} do protocolo?`)) {
                  onDelete()
                }
              }}
              className="bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-700 p-0.5 rounded transition-colors"
              title="Remover"
            >
              <TrashIcon className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}