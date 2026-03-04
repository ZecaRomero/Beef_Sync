import React, { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'

export default function EditGeneticaModal({ isOpen, onClose, animal, onSave }) {
  const [formData, setFormData] = useState({
    situacao_abcz: '',
    abczg: '',
    deca: '',
    iqg: '',
    pt_iqg: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (animal) {
      setFormData({
        situacao_abcz: animal.situacao_abcz || animal.situacaoAbcz || '',
        abczg: animal.abczg || '',
        deca: animal.deca || '',
        iqg: animal.iqg ?? animal.genetica_2 ?? '',
        pt_iqg: animal.pt_iqg ?? animal.decile_2 ?? ''
      })
    }
  }, [animal])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...formData
      }
      
      // Call API
      const res = await fetch(`/api/animals/${animal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      if (!res.ok) throw new Error('Falha ao atualizar')
      
      const data = await res.json()
      if (data.success) {
        onSave(data.data)
        onClose()
      }
    } catch (error) {
      console.error(error)
      alert('Erro ao salvar dados')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Dados Genéticos">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Situação ABCZ</label>
          <input
            type="text"
            value={formData.situacao_abcz}
            onChange={e => setFormData({...formData, situacao_abcz: e.target.value})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2 border"
            placeholder="Ex: REGISTRADO"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">iABCZ</label>
            <input
              type="number"
              step="0.01"
              value={formData.abczg}
              onChange={e => setFormData({...formData, abczg: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">DECA</label>
            <input
              type="number"
              value={formData.deca}
              onChange={e => setFormData({...formData, deca: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">IQG</label>
            <input
              type="number"
              step="0.01"
              value={formData.iqg}
              onChange={e => setFormData({...formData, iqg: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pt IQG</label>
            <input
              type="number"
              step="0.01"
              value={formData.pt_iqg}
              onChange={e => setFormData({...formData, pt_iqg: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2 border"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
