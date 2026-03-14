import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Card } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import Toast from '../components/ui/Toast'
import {
  PlusIcon,
  BeakerIcon,
  CalendarIcon,
  TruckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  PhoneIcon,
  TrashIcon,
  InformationCircleIcon
} from '../components/ui/Icons'

// Funções utilitárias
const calcularDiasRestantes = (proximoAbastecimento) => {
  if (!proximoAbastecimento) return null
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const proximo = new Date(proximoAbastecimento)
  proximo.setHours(0, 0, 0, 0)
  return Math.ceil((proximo - hoje) / (1000 * 60 * 60 * 24))
}

const calcularValorTotal = (quantidade, valorUnitario) => {
  if (!quantidade || !valorUnitario) {
    return '0.00'
  }

  const qtd = parseFloat(quantidade) || 0
  // Remove R$, spaces and dots (thousand separators), then replace comma with dot
  const valorString = String(valorUnitario).replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.')
  const valor = parseFloat(valorString) || 0
  return (qtd * valor).toFixed(2)
}

const formatarMoeda = (valor) => {
  if (!valor) return 'R$ 0,00'
  
  // Se já é string formatada, retorna como está
  if (typeof valor === 'string' && valor.includes('R$')) {
    return valor
  }

  // Limpa o valor e converte para número
  let valorLimpo = String(valor).replace(/[^\d,.]/g, '')
  valorLimpo = valorLimpo.replace(',', '.')
  const numero = parseFloat(valorLimpo) || 0
  
  return numero.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleDateString('pt-BR')
  } catch {
    return dateString
  }
}

const INITIAL_FORM_DATA = {
  data_abastecimento: '',
  quantidade_litros: '',
  valor_unitario: '',
  valor_total: '',
  motorista: '',
  observacoes: ''
}

function Nitrogenio() {
  const [abastecimentos, setAbastecimentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [toast, setToast] = useState(null)
  const [motoristas, setMotoristas] = useState([])
  const [showObservationModal, setShowObservationModal] = useState(false)
  const [observationItem, setObservationItem] = useState(null)

  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [totalLitrosFromAPI, setTotalLitrosFromAPI] = useState(0)

  // Estados para seleção múltipla
  const [selectedItems, setSelectedItems] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [deletingMultiple, setDeletingMultiple] = useState(false)

  const [formData, setFormData] = useState(INITIAL_FORM_DATA)
  
  // Estados para gerenciar contatos WhatsApp
  const [whatsappContatos, setWhatsappContatos] = useState([])
  const [showWhatsappModal, setShowWhatsappModal] = useState(false)
  const [newContato, setNewContato] = useState({ nome: '', whatsapp: '' })

  // Função para atualizar formData com cálculo automático
  const updateFormData = useCallback((field, value) => {
    setFormData(prev => {
      const newFormData = { ...prev, [field]: value }

      if (field === 'quantidade_litros' || field === 'valor_unitario') {
        const valorTotal = calcularValorTotal(
          field === 'quantidade_litros' ? value : newFormData.quantidade_litros,
          field === 'valor_unitario' ? value : newFormData.valor_unitario
        )
        newFormData.valor_total = formatarMoeda(valorTotal)
      }

      return newFormData
    })
  }, [])

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const fetchAbastecimentos = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(itemsPerPage)
      })

      const response = await fetch(`/api/nitrogenio?${params}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Erro HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      setAbastecimentos(Array.isArray(result.data) ? result.data : [])
      setTotalItems(result.meta?.pagination?.totalItems || result.data?.length || 0)
      setTotalLitrosFromAPI(result.meta?.stats?.totalLitros || 0)
    } catch (error) {
      console.error('Erro ao buscar abastecimentos:', error)
      const errorMessage = error.message || 'Erro ao carregar dados. Tente novamente.'
      showToast(errorMessage, 'error')
      setAbastecimentos([])
      setTotalItems(0)
      setTotalLitrosFromAPI(0)
    } finally {
      setLoading(false)
    }
  }, [currentPage, itemsPerPage, showToast])

  const fetchMotoristas = useCallback(async () => {
    try {
      const response = await fetch('/api/motoristas-nitrogenio')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      setMotoristas(Array.isArray(result.data) ? result.data : [])
    } catch (error) {
      console.error('Erro ao buscar motoristas:', error)
      setMotoristas([])
    }
  }, [])

  const fetchWhatsappContatos = useCallback(async () => {
    try {
      const response = await fetch('/api/nitrogenio/whatsapp-contatos')
      if (response.ok) {
        const result = await response.json()
        setWhatsappContatos(result.data?.contatos || [])
      }
    } catch (error) {
      console.error('Erro ao buscar contatos WhatsApp:', error)
    }
  }, [])

  useEffect(() => {
    fetchAbastecimentos()
    fetchMotoristas()
    fetchWhatsappContatos()
  }, [fetchAbastecimentos, fetchMotoristas, fetchWhatsappContatos])

  useEffect(() => {
    setSelectedItems([])
    setSelectAll(false)
  }, [currentPage])

  const limparValorMoeda = useCallback((valor) => {
    if (!valor) return null
    // Remove R$, spaces and dots (thousand separators), then replace comma with dot
    return String(valor).replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.')
  }, [])

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA)
    setEditingId(null)
  }, [])

  const handleEdit = useCallback((abastecimento) => {
    if (!abastecimento || !abastecimento.id) {
      showToast('Dados do abastecimento inválidos', 'error')
      return
    }

    setEditingId(abastecimento.id)
    setFormData({
      data_abastecimento: abastecimento.data_abastecimento || '',
      quantidade_litros: abastecimento.quantidade_litros || '',
      valor_unitario: formatarMoeda(abastecimento.valor_unitario) || '',
      valor_total: formatarMoeda(abastecimento.valor_total) || '',
      motorista: abastecimento.motorista || '',
      observacoes: abastecimento.observacoes || ''
    })
    setShowModal(true)
  }, [showToast])

  const handleDelete = useCallback(async (id) => {
    if (!id) {
      showToast('ID inválido', 'error')
      return
    }

    if (!window.confirm('Tem certeza que deseja excluir este registro?')) return

    try {
      const response = await fetch(`/api/nitrogenio/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Erro HTTP ${response.status}: ${response.statusText}`)
      }

      showToast('Abastecimento excluído com sucesso!')
      await fetchAbastecimentos()
      setSelectedItems(prev => prev.filter(itemId => itemId !== id))
    } catch (error) {
      console.error('Erro ao excluir:', error)
      const errorMessage = error.message || 'Erro ao excluir abastecimento. Tente novamente.'
      showToast(errorMessage, 'error')
    }
  }, [showToast, fetchAbastecimentos])

  const handleSelectItem = useCallback((id) => {
    setSelectedItems(prev => {
      if (prev.includes(id)) {
        return prev.filter(itemId => itemId !== id)
      } else {
        return [...prev, id]
      }
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    if (selectAll) {
      setSelectedItems([])
      setSelectAll(false)
    } else {
      const currentPageIds = abastecimentos
        .filter(item => item && item.id)
        .map(item => item.id)
      setSelectedItems(currentPageIds)
      setSelectAll(true)
    }
  }, [selectAll, abastecimentos])

  const handleDeleteMultiple = useCallback(async () => {
    if (selectedItems.length === 0) {
      showToast('Selecione pelo menos um item para excluir', 'error')
      return
    }

    if (!window.confirm(`Tem certeza que deseja excluir ${selectedItems.length} registro(s) selecionado(s)?`)) {
      return
    }

    setDeletingMultiple(true)
    try {
      const response = await fetch('/api/nitrogenio/bulk-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedItems })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Erro HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      const deletedCount = result.data?.deletedCount || selectedItems.length

      showToast(`${deletedCount} abastecimento(s) excluído(s) com sucesso!`)
      setSelectedItems([])
      setSelectAll(false)
      await fetchAbastecimentos()
    } catch (error) {
      console.error('Erro ao excluir múltiplos:', error)
      const errorMessage = error.message || 'Erro ao excluir registros selecionados. Tente novamente.'
      showToast(errorMessage, 'error')
    } finally {
      setDeletingMultiple(false)
    }
  }, [selectedItems, showToast, fetchAbastecimentos])

  const openObservation = useCallback((item) => {
    console.log('🔍 openObservation chamado com:', item)
    console.log('📝 Observação:', item?.observacoes)
    setObservationItem(item)
    setShowObservationModal(true)
    console.log('✅ Modal de observação deve estar aberto agora')
  }, [])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()

    // Validação dos campos obrigatórios
    if (!formData.data_abastecimento || !formData.quantidade_litros || !formData.motorista?.trim()) {
      showToast('Preencha todos os campos obrigatórios: Data, Quantidade e Motorista', 'error')
      return
    }

    // Validação de valores numéricos
    const quantidade = parseFloat(formData.quantidade_litros)
    if (isNaN(quantidade) || quantidade <= 0) {
      showToast('A quantidade deve ser um valor numérico maior que zero', 'error')
      return
    }

    try {
      const url = editingId ? `/api/nitrogenio/${editingId}` : '/api/nitrogenio'
      const method = editingId ? 'PUT' : 'POST'

      const cleanFormData = {
        ...formData,
        quantidade_litros: String(quantidade),
        valor_unitario: limparValorMoeda(formData.valor_unitario),
        valor_total: limparValorMoeda(formData.valor_total),
        motorista: formData.motorista.trim()
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanFormData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      showToast(editingId ? 'Abastecimento atualizado com sucesso!' : 'Abastecimento registrado com sucesso!')
      setShowModal(false)
      resetForm()
      await fetchAbastecimentos()
      await fetchMotoristas()
    } catch (error) {
      console.error('Erro ao salvar:', error)
      showToast(error.message || 'Erro ao salvar abastecimento. Tente novamente.', 'error')
    }
  }, [formData, editingId, showToast, limparValorMoeda, fetchAbastecimentos, fetchMotoristas, resetForm])

  // Cálculos memoizados
  const totalPages = useMemo(() => Math.ceil(totalItems / itemsPerPage), [totalItems, itemsPerPage])
  const startItem = useMemo(() => (currentPage - 1) * itemsPerPage + 1, [currentPage, itemsPerPage])
  const endItem = useMemo(() => Math.min(currentPage * itemsPerPage, totalItems), [currentPage, itemsPerPage, totalItems])

  // Estatísticas memoizadas
  const totalLitros = useMemo(() => {
    // Usar o valor da API se disponível, caso contrário calcular da página atual
    if (totalLitrosFromAPI > 0) {
      return totalLitrosFromAPI
    }
    if (!Array.isArray(abastecimentos)) return 0
    return abastecimentos.reduce((sum, item) => {
      const litros = parseFloat(item.quantidade_litros) || 0
      return sum + litros
    }, 0)
  }, [abastecimentos, totalLitrosFromAPI])

  const proximosVencimentos = useMemo(() => {
    if (!Array.isArray(abastecimentos)) return 0
    
    return abastecimentos.filter(item => {
      if (!item.proximo_abastecimento) return false
      const diasRestantes = calcularDiasRestantes(item.proximo_abastecimento)
      return diasRestantes !== null && diasRestantes <= 5
    }).length
  }, [abastecimentos])

  const observacoesCount = useMemo(() => {
    if (!Array.isArray(abastecimentos)) return 0
    return abastecimentos.filter(a => a?.observacoes && String(a.observacoes).trim().length > 0).length
  }, [abastecimentos])

  const handleAddWhatsappContato = useCallback(async () => {
    if (!newContato.nome.trim() || !newContato.whatsapp.trim()) {
      showToast('Preencha nome e WhatsApp', 'error')
      return
    }

    try {
      const response = await fetch('/api/nitrogenio/whatsapp-contatos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContato)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Erro ao cadastrar contato')
      }

      showToast('Contato WhatsApp cadastrado com sucesso!')
      setNewContato({ nome: '', whatsapp: '' })
      setShowWhatsappModal(false)
      await fetchWhatsappContatos()
    } catch (error) {
      console.error('Erro ao cadastrar contato:', error)
      showToast(error.message || 'Erro ao cadastrar contato', 'error')
    }
  }, [newContato, showToast, fetchWhatsappContatos])

  const handleRemoveWhatsappContato = useCallback(async (id) => {
    if (!window.confirm('Tem certeza que deseja remover este contato?')) return

    try {
      const response = await fetch(`/api/nitrogenio/whatsapp-contatos?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Erro ao remover contato')
      }

      showToast('Contato removido com sucesso!')
      await fetchWhatsappContatos()
    } catch (error) {
      console.error('Erro ao remover contato:', error)
      showToast(error.message || 'Erro ao remover contato', 'error')
    }
  }, [showToast, fetchWhatsappContatos])

  const getStatusInfo = useCallback((proximoAbastecimento, superseded = false) => {
    if (superseded) {
      return {
        color: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
        icon: <CheckCircleIcon className="h-5 w-5" />,
        text: 'OK'
      }
    }
    const diasRestantes = calcularDiasRestantes(proximoAbastecimento)
    
    if (diasRestantes === null) {
      return { 
        color: 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20', 
        icon: null, 
        text: 'Não definido' 
      }
    }
    
    if (diasRestantes <= 0) {
      return {
        color: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
        icon: <ExclamationTriangleIcon className="h-5 w-5" />,
        text: 'Vencido'
      }
    }
    
    if (diasRestantes <= 5) {
      return {
        color: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
        icon: <ExclamationTriangleIcon className="h-5 w-5" />,
        text: `${diasRestantes} dias restantes`
      }
    }
    
    if (diasRestantes <= 15) {
      return {
        color: 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
        icon: <ClockIcon className="h-5 w-5" />,
        text: `${diasRestantes} dias restantes`
      }
    }
    
    return {
      color: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
      icon: <CheckCircleIcon className="h-5 w-5" />,
      text: `${diasRestantes} dias restantes`
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BeakerIcon className="h-8 w-8 text-blue-600" />
            Controle de Nitrogênio
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Gerencie o abastecimento de nitrogênio e receba lembretes automáticos
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowWhatsappModal(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <PhoneIcon className="h-5 w-5" />
            Contatos WhatsApp
          </Button>
          <Button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Novo Abastecimento
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total de Abastecimentos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalItems}</p>
            </div>
            <BeakerIcon className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total de Litros</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalLitros.toFixed(1)}L
              </p>
            </div>
            <BeakerIcon className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Motoristas Cadastrados</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Array.isArray(motoristas) ? motoristas.length : 0}
              </p>
            </div>
            <TruckIcon className="h-8 w-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Próximos Vencimentos</p>
              <p className="text-2xl font-bold text-red-600">
                {proximosVencimentos}
              </p>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6">
          {observacoesCount > 0 && (
            <div className="mb-4 p-3 rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800 flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
              <span className="text-sm text-yellow-800 dark:text-yellow-300">
                {observacoesCount === 1 ? 'Há 1 abastecimento com observação.' : `Há ${observacoesCount} abastecimentos com observação.`}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Histórico de Abastecimentos</h2>
            {selectedItems.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {selectedItems.length} selecionado(s)
                </span>
                <Button
                  onClick={handleDeleteMultiple}
                  disabled={deletingMultiple}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1"
                >
                  {deletingMultiple ? 'Excluindo...' : `Excluir (${selectedItems.length})`}
                </Button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-300 mt-2">Carregando...</p>
            </div>
          ) : !Array.isArray(abastecimentos) || abastecimentos.length === 0 ? (
            <div className="text-center py-8">
              <BeakerIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300">Nenhum abastecimento registrado</p>
              <Button
                onClick={() => {
                  resetForm()
                  setShowModal(true)
                }}
                className="mt-4"
              >
                Registrar Primeiro Abastecimento
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-12">
                        <input
                          type="checkbox"
                          checked={selectAll && abastecimentos.length > 0}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Quantidade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Valor Unitário
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Valor Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Motorista
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Próximo Abastecimento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {Array.isArray(abastecimentos) && abastecimentos.map((item, index) => (
                      <tr key={item.id || `item-${index}`} className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${selectedItems.includes(item.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item.id)}
                            onChange={() => handleSelectItem(item.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900 dark:text-white">
                              {formatDate(item.data_abastecimento)}
                            </span>
                            {item.observacoes && String(item.observacoes).trim().length > 0 && (
                              <Badge
                                variant="warning"
                                size="sm"
                                className="ml-2 cursor-pointer"
                                title={String(item.observacoes)}
                                onClick={() => openObservation(item)}
                              >
                                Observação
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {(parseFloat(item.quantidade_litros) || 0).toFixed(1)}L
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {item.valor_unitario ? formatarMoeda(item.valor_unitario) : 'R$ 0,00'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.valor_total ? formatarMoeda(item.valor_total) : 'R$ 0,00'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <TruckIcon className="h-5 w-5 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900 dark:text-white">{item.motorista}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {formatDate(item.proximo_abastecimento)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(() => {
                            const superseded = Array.isArray(abastecimentos) && abastecimentos.some(other => {
                              if (!other?.data_abastecimento) return false
                              if (other?.id === item.id) return false
                              return new Date(other.data_abastecimento) > new Date(item.data_abastecimento)
                            })
                            const status = getStatusInfo(item.proximo_abastecimento, superseded)
                            return (
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                {status.icon}
                                {status.text}
                              </span>
                            )
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-2"
                              title="Editar"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="Excluir"
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <span>
                      Mostrando {startItem} a {endItem} de {totalItems} registros
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      variant="secondary"
                      size="sm"
                    >
                      Anterior
                    </Button>

                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-1 text-sm rounded-md ${pageNum === currentPage
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                              }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <Button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      variant="secondary"
                      size="sm"
                    >
                      Próximo
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        title={editingId ? 'Editar Abastecimento' : 'Novo Abastecimento'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data do Abastecimento *
                </label>
                <Input
                  type="date"
                  value={formData.data_abastecimento}
                  onChange={(e) => updateFormData('data_abastecimento', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Quantidade (Litros) *
            </label>
            <Input
              type="number"
              step="0.1"
              min="0"
              value={formData.quantidade_litros}
              onChange={(e) => updateFormData('quantidade_litros', e.target.value)}
              placeholder="Ex: 50.5"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Valor Unitário *
            </label>
            <Input
              type="text"
              value={formData.valor_unitario}
              onChange={(e) => {
                let valor = e.target.value
                valor = valor.replace(/[^\d,.]/g, '')

                if (/^\d+$/.test(valor) && valor.length > 2) {
                  valor = valor.slice(0, -2) + ',' + valor.slice(-2)
                }

                updateFormData('valor_unitario', valor)
              }}
              onBlur={(e) => {
                const valor = e.target.value
                if (valor) {
                  updateFormData('valor_unitario', formatarMoeda(valor))
                }
              }}
              placeholder="Ex: 9,90"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Valor Total
            </label>
            <Input
              type="text"
              value={formData.valor_total}
              readOnly
              className="bg-gray-100 dark:bg-gray-800"
              placeholder="R$ 0,00"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Calculado automaticamente (Quantidade × Valor Unitário)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Motorista *
            </label>
            <div className="relative">
              <Input
                type="text"
                value={formData.motorista}
                onChange={(e) => updateFormData('motorista', e.target.value)}
                placeholder="Nome do motorista"
                list="motoristas"
                required
              />
              <datalist id="motoristas">
                {motoristas.map((motorista, index) => (
                  <option key={motorista || index} value={motorista} />
                ))}
              </datalist>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Digite o nome ou selecione um motorista já cadastrado
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Observações
            </label>
            <textarea
              value={formData.observacoes || ''}
              onChange={(e) => updateFormData('observacoes', e.target.value)}
              placeholder="Observações adicionais..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              rows="3"
              name="observacoes"
              id="observacoes"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModal(false)
                resetForm()
              }}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {editingId ? 'Atualizar' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showObservationModal}
        onClose={() => {
          console.log('🔒 Fechando modal de observação')
          setShowObservationModal(false)
          setObservationItem(null)
        }}
        title="Observação do Abastecimento"
        size="lg"
      >
        <div className="space-y-3">
          {console.log('🎯 Renderizando modal - observationItem:', observationItem)}
          {console.log('🎯 showObservationModal:', showObservationModal)}
          {observationItem ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
                <CalendarIcon className="h-4 w-4 text-gray-500" />
                <span>{formatDate(observationItem.data_abastecimento)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
                <TruckIcon className="h-4 w-4 text-gray-500" />
                <span>{observationItem.motorista}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
                <BeakerIcon className="h-4 w-4 text-gray-500" />
                <span>{(parseFloat(observationItem.quantidade_litros) || 0).toFixed(1)}L</span>
              </div>
              <div className="mt-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-sm text-yellow-900 dark:text-yellow-200 flex items-start gap-2">
                <InformationCircleIcon className="h-5 w-5 flex-shrink-0" />
                <span>{String(observationItem.observacoes)}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">Nenhuma observação selecionada</p>
              <p className="text-xs text-gray-400 mt-1">observationItem: {JSON.stringify(observationItem)}</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal de Contatos WhatsApp */}
      <Modal
        isOpen={showWhatsappModal}
        onClose={() => {
          setShowWhatsappModal(false)
          setNewContato({ nome: '', whatsapp: '' })
        }}
        title="Gerenciar Contatos WhatsApp"
      >
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>ℹ️ Como funciona:</strong> Quando faltarem 2 dias para o próximo abastecimento de nitrogênio, 
              todos os contatos cadastrados receberão uma notificação automática via WhatsApp.
            </p>
          </div>

          {/* Formulário para adicionar novo contato */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Adicionar Novo Contato
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome *
                </label>
                <Input
                  type="text"
                  value={newContato.nome}
                  onChange={(e) => setNewContato({ ...newContato, nome: e.target.value })}
                  placeholder="Ex: João Silva"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  WhatsApp *
                </label>
                <Input
                  type="text"
                  value={newContato.whatsapp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '')
                    setNewContato({ ...newContato, whatsapp: value })
                  }}
                  placeholder="Ex: 11987654321"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Apenas números (com DDD)
                </p>
              </div>
            </div>
            <Button
              onClick={handleAddWhatsappContato}
              className="mt-3 w-full"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Adicionar Contato
            </Button>
          </div>

          {/* Lista de contatos cadastrados */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Contatos Cadastrados ({whatsappContatos.length})
            </h3>
            {whatsappContatos.length === 0 ? (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                <PhoneIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum contato cadastrado</p>
                <p className="text-xs mt-1">Adicione contatos para receber notificações automáticas</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {whatsappContatos.map((contato) => (
                  <div
                    key={contato.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <PhoneIcon className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {contato.nome}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {contato.whatsapp.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveWhatsappContato(contato.id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      title="Remover contato"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

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

export default Nitrogenio
