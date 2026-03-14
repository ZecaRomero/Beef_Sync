import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody } from '../ui/Card'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Modal from '../ui/Modal'
import Toast from '../ui/Toast'

const AnimalLocationManager = ({ animalId, animalInfo }) => {
  const [localizacoes, setLocalizacoes] = useState([])
  const [localizacaoAtual, setLocalizacaoAtual] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingLocation, setEditingLocation] = useState(null)
  const [toast, setToast] = useState(null)

  // FormulÃ¡rio para nova localizaÃ§Ã£o
  const [formData, setFormData] = useState({
    piquete: '',
    data_entrada: new Date().toISOString().split('T')[0],
    motivo_movimentacao: '',
    observacoes: '',
    usuario_responsavel: ''
  })

  // Lista de piquetes disponÃ­veis
  const piquetesDisponiveis = [
    'Piquete 01', 'Piquete 02', 'Piquete 03', 'Piquete 04', 'Piquete 05',
    'Piquete 06', 'Piquete 07', 'Piquete 08', 'Piquete 09', 'Piquete 10',
    'Curral', 'ApartaÃ§Ã£o', 'Enfermaria', 'Quarentena'
  ]

  // Motivos de movimentaÃ§Ã£o
  const motivosMovimentacao = [
    'InseminaÃ§Ã£o Artificial',
    'TransferÃªncia de EmbriÃ£o',
    'DiagnÃ³stico de GestaÃ§Ã£o',
    'VacinaÃ§Ã£o',
    'Tratamento VeterinÃ¡rio',
    'ApartaÃ§Ã£o',
    'Desmame',
    'Manejo Reprodutivo',
    'RotaÃ§Ã£o de Pastagem',
    'Outros'
  ]

  useEffect(() => {
    if (animalId) {
      carregarLocalizacoes()
    }
  }, [animalId])

  const carregarLocalizacoes = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/animais/${animalId}/localizacoes`)
      const data = await response.json()

      if (data.success) {
        setLocalizacoes(data.historico)
        setLocalizacaoAtual(data.localizacao_atual)
      } else {
        showToast('Erro ao carregar localizaÃ§Ãµes', 'error')
      }
    } catch (error) {
      console.error('Erro ao carregar localizaÃ§Ãµes:', error)
      showToast('Erro ao carregar localizaÃ§Ãµes', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingLocation 
        ? `/api/localizacoes/${editingLocation.id}`
        : `/api/animais/${animalId}/localizacoes`
      
      const method = editingLocation ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        showToast(
          editingLocation ? 'LocalizaÃ§Ã£o atualizada!' : 'Nova localizaÃ§Ã£o registrada!',
          'success'
        )
        setShowModal(false)
        resetForm()
        carregarLocalizacoes()
      } else {
        showToast(data.error || 'Erro ao salvar localizaÃ§Ã£o', 'error')
      }
    } catch (error) {
      console.error('Erro ao salvar localizaÃ§Ã£o:', error)
      showToast('Erro ao salvar localizaÃ§Ã£o', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (localizacao) => {
    setEditingLocation(localizacao)
    setFormData({
      piquete: localizacao.piquete,
      data_entrada: localizacao.data_entrada,
      data_saida: localizacao.data_saida || '',
      motivo_movimentacao: localizacao.motivo_movimentacao || '',
      observacoes: localizacao.observacoes || '',
      usuario_responsavel: localizacao.usuario_responsavel || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja remover esta localizaÃ§Ã£o?')) return

    setLoading(true)
    try {
      const response = await fetch(`/api/localizacoes/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        showToast('LocalizaÃ§Ã£o removida!', 'success')
        carregarLocalizacoes()
      } else {
        showToast(data.error || 'Erro ao remover localizaÃ§Ã£o', 'error')
      }
    } catch (error) {
      console.error('Erro ao remover localizaÃ§Ã£o:', error)
      showToast('Erro ao remover localizaÃ§Ã£o', 'error')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      piquete: '',
      data_entrada: new Date().toISOString().split('T')[0],
      motivo_movimentacao: '',
      observacoes: '',
      usuario_responsavel: ''
    })
    setEditingLocation(null)
  }

  const showToast = (message, type) => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  return (
    <div className="space-y-6">
      {/* LocalizaÃ§Ã£o Atual */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              ðÅ¸â€œ� LocalizaÃ§Ã£o Atual
            </h3>
            <Button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              + Nova LocalizaÃ§Ã£o
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          {localizacaoAtual ? (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Piquete</p>
                  <p className="font-semibold text-green-700 dark:text-green-300">
                    {localizacaoAtual.piquete}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Desde</p>
                  <p className="font-semibold">
                    {formatDate(localizacaoAtual.data_entrada)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Motivo</p>
                  <p className="font-semibold">
                    {localizacaoAtual.motivo_movimentacao || 'NÃ£o informado'}
                  </p>
                </div>
              </div>
              {localizacaoAtual.observacoes && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">ObservaÃ§Ãµes</p>
                  <p className="text-sm">{localizacaoAtual.observacoes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhuma localizaÃ§Ã£o atual registrada</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* HistÃ³rico de LocalizaÃ§Ãµes */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            ðÅ¸â€œâ€¹ HistÃ³rico de LocalizaÃ§Ãµes
          </h3>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="text-center py-8">
              <p>Carregando...</p>
            </div>
          ) : localizacoes.length > 0 ? (
            <div className="space-y-3">
              {localizacoes.map((loc) => (
                <div
                  key={loc.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Piquete</p>
                        <p className="font-semibold">{loc.piquete}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Entrada</p>
                        <p className="font-semibold">{formatDate(loc.data_entrada)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">SaÃ­da</p>
                        <p className="font-semibold">{formatDate(loc.data_saida)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          loc.data_saida 
                            ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        }`}>
                          {loc.data_saida ? 'HistÃ³rico' : 'Atual'}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button
                        onClick={() => handleEdit(loc)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs px-2 py-1"
                      >
                        Editar
                      </Button>
                      <Button
                        onClick={() => handleDelete(loc.id)}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1"
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                  {loc.motivo_movimentacao && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Motivo: {loc.motivo_movimentacao}</p>
                    </div>
                  )}
                  {loc.observacoes && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Obs: {loc.observacoes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhuma localizaÃ§Ã£o registrada</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal para Nova/Editar LocalizaÃ§Ã£o */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        title={editingLocation ? 'Editar LocalizaÃ§Ã£o' : 'Nova LocalizaÃ§Ã£o'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Piquete *
            </label>
            <Select
              value={formData.piquete}
              onChange={(e) => setFormData({ ...formData, piquete: e.target.value })}
              required
            >
              <option value="">Selecione o piquete</option>
              {piquetesDisponiveis.map((piquete) => (
                <option key={piquete} value={piquete}>
                  {piquete}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data de Entrada *
              </label>
              <Input
                type="date"
                value={formData.data_entrada}
                onChange={(e) => setFormData({ ...formData, data_entrada: e.target.value })}
                required
              />
            </div>

            {editingLocation && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data de SaÃ­da
                </label>
                <Input
                  type="date"
                  value={formData.data_saida}
                  onChange={(e) => setFormData({ ...formData, data_saida: e.target.value })}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Motivo da MovimentaÃ§Ã£o
            </label>
            <Select
              value={formData.motivo_movimentacao}
              onChange={(e) => setFormData({ ...formData, motivo_movimentacao: e.target.value })}
            >
              <option value="">Selecione o motivo</option>
              {motivosMovimentacao.map((motivo) => (
                <option key={motivo} value={motivo}>
                  {motivo}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              UsuÃ¡rio ResponsÃ¡vel
            </label>
            <Input
              type="text"
              value={formData.usuario_responsavel}
              onChange={(e) => setFormData({ ...formData, usuario_responsavel: e.target.value })}
              placeholder="Nome do responsÃ¡vel"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              ObservaÃ§Ãµes
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              rows="3"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="ObservaÃ§Ãµes adicionais..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              onClick={() => {
                setShowModal(false)
                resetForm()
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Salvando...' : (editingLocation ? 'Atualizar' : 'Salvar')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default AnimalLocationManager
