import React, { useState, useEffect } from 'react'
import { BeakerIcon, PlusIcon, PencilIcon, XMarkIcon, ExclamationTriangleIcon } from '../../components/ui/Icons'
import AplicarMedicamentosLote from '../../components/AplicarMedicamentosLote'

export default function Medicamentos() {
  const [mounted, setMounted] = useState(false)
  const [medicamentosData, setMedicamentosData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showAplicarLote, setShowAplicarLote] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    nome: '',
    principioAtivo: '',
    categoria: '',
    fabricante: '',
    lote: '',
    dataVencimento: '',
    quantidadeEstoque: '',
    quantidadeMinima: '',
    unidade: 'ml',
    valorUnitario: '',
    prescricaoVeterinaria: false,
    carenciaLeite: '',
    carenciaCarne: '',
    indicacoes: '',
    dosagem: '',
    viaAplicacao: '',
    observacoes: ''
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      loadMedicamentosData()
    }
  }, [mounted])

  const loadMedicamentosData = async () => {
    try {
      setIsLoading(true)
      if (typeof window === 'undefined') {
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/medicamentos?ativo=all')
      if (response.ok) {
        const data = await response.json()
        // Converter campos snake_case para camelCase
        const medicamentos = (data.data?.medicamentos || data.medicamentos || []).map(med => ({
          id: med.id,
          nome: med.nome,
          principioAtivo: med.principio_ativo,
          categoria: med.categoria,
          fabricante: med.fabricante,
          lote: med.lote,
          dataVencimento: med.data_vencimento,
          quantidadeEstoque: med.quantidade_estoque,
          quantidadeMinima: med.quantidade_minima,
          unidade: med.unidade,
          valorUnitario: med.preco,
          prescricaoVeterinaria: med.prescricao_veterinaria,
          carenciaLeite: med.carencia_leite,
          carenciaCarne: med.carencia_carne,
          indicacoes: med.indicacoes,
          dosagem: med.dosagem,
          viaAplicacao: med.via_aplicacao,
          observacoes: med.observacoes || med.descricao,
          ativo: med.ativo
        }))
        setMedicamentosData(medicamentos)
      } else {
        console.error('Erro ao carregar medicamentos')
        setMedicamentosData([])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setMedicamentosData([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este medicamento?')) {
      return
    }

    try {
      const response = await fetch(`/api/medicamentos?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadMedicamentosData()
        alert('Medicamento removido com sucesso!')
      } else {
        const error = await response.json()
        alert(`Erro ao remover: ${error.message || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error('Erro ao remover medicamento:', error)
      alert('Erro ao remover medicamento')
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      nome: item.nome || '',
      principioAtivo: item.principioAtivo || '',
      categoria: item.categoria || '',
      fabricante: item.fabricante || '',
      lote: item.lote || '',
      dataVencimento: item.dataVencimento ? item.dataVencimento.split('T')[0] : '',
      quantidadeEstoque: item.quantidadeEstoque || '',
      quantidadeMinima: item.quantidadeMinima || '',
      unidade: item.unidade || 'ml',
      valorUnitario: item.valorUnitario || '',
      prescricaoVeterinaria: item.prescricaoVeterinaria || false,
      carenciaLeite: item.carenciaLeite || '',
      carenciaCarne: item.carenciaCarne || '',
      indicacoes: item.indicacoes || '',
      dosagem: item.dosagem || '',
      viaAplicacao: item.viaAplicacao || '',
      observacoes: item.observacoes || ''
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.nome || !formData.categoria) {
      alert('Por favor, preencha os campos obrigatórios (Nome e Categoria)')
      return
    }

    try {
      const payload = {
        nome: formData.nome,
        principioAtivo: formData.principioAtivo || null,
        categoria: formData.categoria,
        fabricante: formData.fabricante || null,
        lote: formData.lote || null,
        dataVencimento: formData.dataVencimento || null,
        quantidadeEstoque: parseFloat(formData.quantidadeEstoque) || 0,
        quantidadeMinima: parseFloat(formData.quantidadeMinima) || 0,
        unidade: formData.unidade,
        preco: parseFloat(formData.valorUnitario) || null,
        prescricaoVeterinaria: formData.prescricaoVeterinaria,
        carenciaLeite: formData.carenciaLeite ? parseInt(formData.carenciaLeite) : null,
        carenciaCarne: formData.carenciaCarne ? parseInt(formData.carenciaCarne) : null,
        indicacoes: formData.indicacoes || null,
        dosagem: formData.dosagem || null,
        viaAplicacao: formData.viaAplicacao || null,
        observacoes: formData.observacoes || null
      }

      const url = editingItem 
        ? `/api/medicamentos?id=${editingItem.id}`
        : '/api/medicamentos'
      
      const method = editingItem ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        await loadMedicamentosData()
        handleCloseForm()
        alert(`Medicamento ${editingItem ? 'atualizado' : 'adicionado'} com sucesso!`)
      } else {
        const error = await response.json()
        alert(`Erro ao salvar: ${error.message || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error('Erro ao salvar medicamento:', error)
      alert('Erro ao salvar medicamento')
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingItem(null)
    setFormData({
      nome: '',
      principioAtivo: '',
      categoria: '',
      fabricante: '',
      lote: '',
      dataVencimento: '',
      quantidadeEstoque: '',
      quantidadeMinima: '',
      unidade: 'ml',
      valorUnitario: '',
      prescricaoVeterinaria: false,
      carenciaLeite: '',
      carenciaCarne: '',
      indicacoes: '',
      dosagem: '',
      viaAplicacao: '',
      observacoes: ''
    })
  }

  const getVencimentoStatus = (dataVencimento) => {
    if (!dataVencimento) return { color: 'bg-gray-100 text-gray-800', text: 'Sem data' }

    const hoje = new Date()
    const vencimento = new Date(dataVencimento)
    const diasParaVencer = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24))

    if (diasParaVencer < 0) {
      return { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', text: 'Vencido' }
    } else if (diasParaVencer <= 30) {
      return { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', text: `${diasParaVencer}d` }
    } else {
      return { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', text: 'OK' }
    }
  }

  const getCategoriaColor = (categoria) => {
    switch (categoria) {
      case 'Antibiótico':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'Anti-inflamatório':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'Vacina':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'Vermífugo':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'Vitamina':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'Hormônio':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="space-y-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BeakerIcon className="w-8 h-8 text-emerald-600" />
              Estoque de Medicamentos
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Controle completo do estoque farmacêutico veterinário</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAplicarLote(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <BeakerIcon className="w-5 h-5" />
              Aplicar em Lote
            </button>
            <button
              onClick={() => {
                setShowForm(!showForm)
              }}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Novo Medicamento
            </button>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                <BeakerIcon className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{medicamentosData.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Vencidos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {medicamentosData.filter(item => {
                    if (!item.dataVencimento) return false
                    const hoje = new Date()
                    const vencimento = new Date(item.dataVencimento)
                    return vencimento < hoje
                  }).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Vencendo</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {medicamentosData.filter(item => {
                    if (!item.dataVencimento) return false
                    const hoje = new Date()
                    const vencimento = new Date(item.dataVencimento)
                    const diasParaVencer = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24))
                    return diasParaVencer >= 0 && diasParaVencer <= 30
                  }).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <BeakerIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Prescrição</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {medicamentosData.filter(item => item.prescricaoVeterinaria).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Carregando dados...</div>
          </div>
        ) : medicamentosData.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-12 text-center">
            <BeakerIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Nenhum medicamento cadastrado
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Comece adicionando o primeiro medicamento ao estoque
            </p>
            <button
              onClick={() => {
                setShowForm(true)
              }}
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
            >
              <PlusIcon className="w-5 h-5" />
              Adicionar Medicamento
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Nome</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Categoria</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Estoque</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Vencimento</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Carência</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Prescrição</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Ações</th>
                </tr>
              </thead>
              <tbody>
                {medicamentosData.map((item) => {
                  const vencimentoStatus = getVencimentoStatus(item.dataVencimento)
                  return (
                    <tr key={item.id} className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        <div>
                          <div>{item.nome || '-'}</div>
                          {item.principioAtivo && (
                            <div className="text-xs text-gray-500">{item.principioAtivo}</div>
                          )}
                          {item.fabricante && (
                            <div className="text-xs text-gray-500">{item.fabricante}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoriaColor(item.categoria)}`}>
                          {item.categoria || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        <div>
                          <div className="font-semibold">
                            {item.quantidadeEstoque} {item.unidade}
                          </div>
                          {item.quantidadeMinima > 0 && (
                            <div className="text-xs text-gray-500">
                              Mín: {item.quantidadeMinima} {item.unidade}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${vencimentoStatus.color}`}>
                          {vencimentoStatus.text}
                        </span>
                        {item.dataVencimento && (
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(item.dataVencimento).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        <div className="text-xs">
                          {item.carenciaLeite && (
                            <div>🥛 {item.carenciaLeite}d</div>
                          )}
                          {item.carenciaCarne && (
                            <div>🥩 {item.carenciaCarne}d</div>
                          )}
                          {!item.carenciaLeite && !item.carenciaCarne && '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {item.prescricaoVeterinaria ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            Sim
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Não
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm flex gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Editar medicamento"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          title="Excluir medicamento"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal do Formulário */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingItem ? 'Editar Medicamento' : 'Novo Medicamento'}
                </h2>
                <button
                  onClick={handleCloseForm}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nome do Medicamento *
                    </label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Ex: Penicilina G"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Princípio Ativo
                    </label>
                    <input
                      type="text"
                      value={formData.principioAtivo}
                      onChange={(e) => setFormData({ ...formData, principioAtivo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Ex: Benzilpenicilina"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Categoria *
                    </label>
                    <select
                      value={formData.categoria}
                      onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="">Selecione a categoria...</option>
                      <option value="Antibiótico">Antibiótico</option>
                      <option value="Anti-inflamatório">Anti-inflamatório</option>
                      <option value="Vacina">Vacina</option>
                      <option value="Vermífugo">Vermífugo</option>
                      <option value="Vitamina">Vitamina</option>
                      <option value="Hormônio">Hormônio</option>
                      <option value="Anestésico">Anestésico</option>
                      <option value="Antisséptico">Antisséptico</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fabricante
                    </label>
                    <input
                      type="text"
                      value={formData.fabricante}
                      onChange={(e) => setFormData({ ...formData, fabricante: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Ex: Zoetis"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Lote
                    </label>
                    <input
                      type="text"
                      value={formData.lote}
                      onChange={(e) => setFormData({ ...formData, lote: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Ex: L2024001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Data de Vencimento
                    </label>
                    <input
                      type="date"
                      value={formData.dataVencimento}
                      onChange={(e) => setFormData({ ...formData, dataVencimento: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Valor Unitário (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.valorUnitario}
                      onChange={(e) => setFormData({ ...formData, valorUnitario: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Ex: 25.50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Quantidade em Estoque
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.quantidadeEstoque}
                      onChange={(e) => setFormData({ ...formData, quantidadeEstoque: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Ex: 10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Quantidade Mínima
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.quantidadeMinima}
                      onChange={(e) => setFormData({ ...formData, quantidadeMinima: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Ex: 2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Unidade
                    </label>
                    <select
                      value={formData.unidade}
                      onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="ml">ml</option>
                      <option value="litro">Litro</option>
                      <option value="mg">mg</option>
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="comprimido">Comprimido</option>
                      <option value="ampola">Ampola</option>
                      <option value="frasco">Frasco</option>
                      <option value="dose">Dose</option>
                      <option value="unidade">Unidade</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Carência Leite (dias)
                    </label>
                    <input
                      type="number"
                      value={formData.carenciaLeite}
                      onChange={(e) => setFormData({ ...formData, carenciaLeite: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Ex: 7"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Carência Carne (dias)
                    </label>
                    <input
                      type="number"
                      value={formData.carenciaCarne}
                      onChange={(e) => setFormData({ ...formData, carenciaCarne: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Ex: 14"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Via de Aplicação
                    </label>
                    <select
                      value={formData.viaAplicacao}
                      onChange={(e) => setFormData({ ...formData, viaAplicacao: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Selecione...</option>
                      <option value="Intramuscular">Intramuscular</option>
                      <option value="Subcutânea">Subcutânea</option>
                      <option value="Intravenosa">Intravenosa</option>
                      <option value="Oral">Oral</option>
                      <option value="Tópica">Tópica</option>
                      <option value="Intramamária">Intramamária</option>
                      <option value="Outras">Outras</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="prescricaoVeterinaria"
                      checked={formData.prescricaoVeterinaria}
                      onChange={(e) => setFormData({ ...formData, prescricaoVeterinaria: e.target.checked })}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                    />
                    <label htmlFor="prescricaoVeterinaria" className="ml-2 block text-sm text-gray-900 dark:text-white">
                      Requer prescrição veterinária
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Indicações
                  </label>
                  <textarea
                    value={formData.indicacoes}
                    onChange={(e) => setFormData({ ...formData, indicacoes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                    rows="2"
                    placeholder="Para que é indicado o medicamento..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Dosagem
                  </label>
                  <textarea
                    value={formData.dosagem}
                    onChange={(e) => setFormData({ ...formData, dosagem: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                    rows="2"
                    placeholder="Ex: 1ml para cada 10kg de peso vivo..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Observações
                  </label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                    rows="3"
                    placeholder="Observações sobre armazenamento, efeitos colaterais, etc..."
                  />
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
                  <h3 className="font-medium text-emerald-900 dark:text-emerald-200 mb-2">
                    💊 Importante - Medicamentos Veterinários
                  </h3>
                  <ul className="text-sm text-emerald-800 dark:text-emerald-300 space-y-1">
                    <li>• Respeite sempre os períodos de carência</li>
                    <li>• Mantenha registros de aplicação</li>
                    <li>• Armazene conforme instruções do fabricante</li>
                    <li>• Verifique datas de vencimento regularmente</li>
                    <li>• Medicamentos com prescrição só devem ser usados com orientação veterinária</li>
                  </ul>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors"
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

        {/* Modal de Aplicar Medicamentos em Lote */}
        <AplicarMedicamentosLote 
          isOpen={showAplicarLote} 
          onClose={() => setShowAplicarLote(false)} 
        />
      </div>
    </div>
  )
}
