import React, { useState, useEffect } from 'react'
import { MapPinIcon, PlusIcon, PencilIcon, XMarkIcon, BeakerIcon } from '../../components/ui/Icons'
import AplicarMedicamentosLote from '../../components/AplicarMedicamentosLote'

export default function Piquetes() {
  const [mounted, setMounted] = useState(false)
  const [piquetes, setPiquetes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showAplicarMedicamentos, setShowAplicarMedicamentos] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    nome: '',
    area: '',
    capacidade: '',
    tipo: '',
    observacoes: ''
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      loadPiquetes()
    }
  }, [mounted])

  const loadPiquetes = async () => {
    try {
      setIsLoading(true)
      if (typeof window === 'undefined') {
        setIsLoading(false)
        return
      }

      // Tentar carregar da API primeiro
      try {
        const response = await fetch('/api/piquetes')
        if (response.ok) {
          const data = await response.json()
          if (data.piquetes && data.piquetes.length > 0) {
            setPiquetes(data.piquetes)
            setIsLoading(false)
            return
          }
        }
      } catch (error) {
        console.error('Erro ao carregar piquetes da API:', error)
      }

      // Fallback para localStorage
      const savedData = localStorage.getItem('piquetes')
      if (savedData) {
        setPiquetes(JSON.parse(savedData))
      } else {
        setPiquetes([])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setPiquetes([])
    } finally {
      setIsLoading(false)
    }
  }

  const savePiquetes = (newData) => {
    setPiquetes(newData)
    if (typeof window !== 'undefined') {
      localStorage.setItem('piquetes', JSON.stringify(newData))
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este piquete?')) {
      return
    }

    try {
      // Tentar deletar na API primeiro
      const response = await fetch(`/api/piquetes?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Remover da lista local
        const updatedData = piquetes.filter(item => item.id !== id)
        setPiquetes(updatedData)
        
        // Atualizar localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('piquetes', JSON.stringify(updatedData))
        }
        
        alert('✅ Piquete excluído com sucesso!')
      } else {
        throw new Error('Erro ao excluir piquete na API')
      }
    } catch (error) {
      console.error('Erro ao excluir piquete:', error)
      
      // Fallback: remover apenas do localStorage
      const updatedData = piquetes.filter(item => item.id !== id)
      savePiquetes(updatedData)
      
      alert('⚠️ Piquete removido localmente. Verifique a conexão com o servidor para sincronização completa.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.nome) {
      alert('Por favor, preencha o nome do piquete')
      return
    }

    try {
      // Tentar salvar na API primeiro
      const apiData = {
        nome: formData.nome,
        area: parseFloat(formData.area) || null,
        capacidade: parseInt(formData.capacidade) || null,
        tipo: formData.tipo,
        observacoes: formData.observacoes
      }

      let response
      if (editingItem && editingItem.id) {
        // Atualizar piquete existente via API
        response = await fetch('/api/piquetes', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: editingItem.id,
            ...apiData
          })
        })
      } else {
        // Criar novo piquete via API
        response = await fetch('/api/piquetes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(apiData)
        })
      }

      if (response.ok) {
        const result = await response.json()
        const savedPiquete = result.piquete || result.data?.piquete
        
        // Atualizar lista local
        let updatedData
        if (editingItem && editingItem.id) {
          updatedData = piquetes.map(item => 
            item.id === editingItem.id ? { ...item, ...savedPiquete } : item
          )
        } else {
          updatedData = [...piquetes, savedPiquete]
        }
        
        setPiquetes(updatedData)
        
        // Também salvar no localStorage como fallback
        if (typeof window !== 'undefined') {
          localStorage.setItem('piquetes', JSON.stringify(updatedData))
        }
        
        handleCloseForm()
        
        const action = editingItem ? 'atualizado' : 'adicionado'
        alert(`✅ Piquete ${action} com sucesso! Agora está disponível para uso na Localização de Animais.`)
        
        // Recarregar lista de piquetes
        loadPiquetes()
      } else {
        throw new Error('Erro ao salvar piquete na API')
      }
    } catch (error) {
      console.error('Erro ao salvar piquete:', error)
      
      // Fallback: salvar apenas no localStorage
      const newItem = {
        id: editingItem ? editingItem.id : Date.now(),
        nome: formData.nome,
        area: parseFloat(formData.area) || null,
        capacidade: parseInt(formData.capacidade) || null,
        tipo: formData.tipo,
        observacoes: formData.observacoes,
        createdAt: editingItem ? editingItem.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      let updatedData
      if (editingItem) {
        updatedData = piquetes.map(item => 
          item.id === editingItem.id ? newItem : item
        )
      } else {
        updatedData = [...piquetes, newItem]
      }

      savePiquetes(updatedData)
      handleCloseForm()
      
      const action = editingItem ? 'atualizado' : 'adicionado'
      alert(`⚠️ Piquete ${action} localmente. Verifique a conexão com o servidor para sincronização completa.`)
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      nome: item.nome || '',
      area: item.area || '',
      capacidade: item.capacidade || '',
      tipo: item.tipo || '',
      observacoes: item.observacoes || ''
    })
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingItem(null)
    setFormData({
      nome: '',
      area: '',
      capacidade: '',
      tipo: '',
      observacoes: ''
    })
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MapPinIcon className="w-8 h-8 text-amber-600" />
            Gestão de Piquetes
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Gerenciar áreas e piquetes</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAplicarMedicamentos(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            title="Aplicar medicamentos em lote"
          >
            <BeakerIcon className="w-5 h-5" />
            Aplicar Medicamentos
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Novo Piquete
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Carregando dados...</div>
        </div>
      ) : piquetes.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-12 text-center">
          <MapPinIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Nenhum piquete cadastrado
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Comece cadastrando o primeiro piquete
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700"
          >
            <PlusIcon className="w-5 h-5" />
            Adicionar Piquete
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {piquetes.map((item) => (
            <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">{item.nome || '-'}</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEdit(item)}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                    title="Editar piquete"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Área: {item.area || '-'} {item.unidade || 'hectares'}
              </p>
              {item.capacidade && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Capacidade: {item.capacidade} animais
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal do Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingItem ? 'Editar Piquete' : 'Novo Piquete'}
              </h2>
              <button
                onClick={handleCloseForm}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome do Piquete *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: Piquete 1, Pastagem Norte..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Área (hectares)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.area}
                    onChange={(e) => setFormData({...formData, area: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Ex: 10.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Capacidade (animais)
                  </label>
                  <input
                    type="number"
                    value={formData.capacidade}
                    onChange={(e) => setFormData({...formData, capacidade: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Ex: 50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de Pastagem
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Selecione o tipo...</option>
                  <option value="Brachiaria">Brachiaria</option>
                  <option value="Panicum">Panicum</option>
                  <option value="Tifton">Tifton</option>
                  <option value="Mombaça">Mombaça</option>
                  <option value="Tanzânia">Tanzânia</option>
                  <option value="Nativa">Pastagem Nativa</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Observações
                </label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                  rows="3"
                  placeholder="Informações adicionais sobre o piquete..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 text-white py-2 px-4 rounded-lg hover:bg-amber-700 transition-colors"
                >
                  {editingItem ? 'Atualizar' : 'Salvar'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Aplicar Medicamentos em Lote */}
      <AplicarMedicamentosLote 
        isOpen={showAplicarMedicamentos}
        onClose={() => setShowAplicarMedicamentos(false)}
      />
    </div>
  )
}

