
import React, { useEffect, useState } from 'react'

import { useRouter } from 'next/router'
import { 
  PlusIcon, 
  DocumentTextIcon, 
  CalendarIcon, 
  FunnelIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import * as XLSX from 'xlsx'

export default function AnimalHistory() {
  const router = useRouter()
  const [events, setEvents] = useState([])
  const [animals, setAnimals] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [filters, setFilters] = useState({
    animal: '',
    tipo: '',
    dataInicio: '',
    dataFim: '',
    mes: '',
    ano: ''
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Tipos de ocorrências disponíveis
  const tiposOcorrencia = [
    { id: 'parto', label: 'Parto', icon: '🐄', color: 'bg-green-500' },
    { id: 'pesagem', label: 'Pesagem', icon: '⚖️', color: 'bg-blue-500' },
    { id: 'leilao', label: 'Separação para Leilão', icon: '🏆', color: 'bg-yellow-500' },
    { id: 'venda', label: 'Venda', icon: '💰', color: 'bg-emerald-500' },
    { id: 'medicacao', label: 'Medicação/Tratamento', icon: '💊', color: 'bg-red-500' },
    { id: 'vacinacao', label: 'Vacinação', icon: '💉', color: 'bg-purple-500' },
    { id: 'inseminacao', label: 'Inseminação', icon: '🧬', color: 'bg-pink-500' },
    { id: 'desmame', label: 'Desmame', icon: '🍼', color: 'bg-orange-500' },
    { id: 'transferencia', label: 'Transferência de Pasto', icon: '🌱', color: 'bg-teal-500' },
    { id: 'exame', label: 'Exame Veterinário', icon: '🔬', color: 'bg-indigo-500' },
    { id: 'morte', label: 'Morte/Descarte', icon: '💀', color: 'bg-gray-500' },
    { id: 'outros', label: 'Outros', icon: '📝', color: 'bg-slate-500' }
  ]

  const [newEvent, setNewEvent] = useState({
    animalId: '',
    tipo: '',
    data: new Date().toISOString().split('T')[0],
    descricao: '',
    observacoes: '',
    peso: '',
    valor: '',
    veterinario: '',
    medicamento: '',
    dosagem: '',
    proximaAplicacao: '',
    local: '',
    responsavel: ''
  })

  // Carregar dados
  useEffect(() => {
    loadEvents()
    loadAnimals()
  }, [])

  const loadEvents = () => {
    if (typeof window === 'undefined') return
    const savedEvents = localStorage.getItem('animalHistory')
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents))
    }
  }

  const loadAnimals = () => {
    if (typeof window === 'undefined') return
    const savedAnimals = localStorage.getItem('animals')
    if (savedAnimals) {
      setAnimals(JSON.parse(savedAnimals))
    }
  }

  const saveEvents = (newEvents) => {
    setEvents(newEvents)
    if (typeof window !== 'undefined') {
      localStorage.setItem('animalHistory', JSON.stringify(newEvents))
    }
  }

  const handleAddEvent = () => {
    if (!newEvent.animalId || !newEvent.tipo || !newEvent.data) {
      alert('Preencha os campos obrigatórios: Animal, Tipo e Data')
      return
    }

    const event = {
      id: Date.now(),
      ...newEvent,
      createdAt: new Date().toISOString(),
      createdBy: 'Sistema'
    }

    const updatedEvents = [...events, event]
    saveEvents(updatedEvents)
    
    setNewEvent({
      animalId: '',
      tipo: '',
      data: new Date().toISOString().split('T')[0],
      descricao: '',
      observacoes: '',
      peso: '',
      valor: '',
      veterinario: '',
      medicamento: '',
      dosagem: '',
      proximaAplicacao: '',
      local: '',
      responsavel: ''
    })
    
    setShowAddModal(false)
    alert('Ocorrência registrada com sucesso!')
  }

  const handleDeleteEvent = (eventId) => {
    if (confirm('Tem certeza que deseja excluir esta ocorrência?')) {
      const updatedEvents = events.filter(e => e.id !== eventId)
      saveEvents(updatedEvents)
    }
  }

  const getAnimalName = (animalId) => {
    const animal = animals.find(a => a.id === parseInt(animalId))
    return animal ? `${animal.serie} ${animal.rg}` : 'Animal não encontrado'
  }

  const getTipoInfo = (tipo) => {
    return tiposOcorrencia.find(t => t.id === tipo) || tiposOcorrencia.find(t => t.id === 'outros')
  }

  // Filtrar eventos
  const filteredEvents = events.filter(event => {
    const animal = animals.find(a => a.id === parseInt(event.animalId))
    const animalName = animal ? `${animal.serie} ${animal.rg}`.toLowerCase() : ''
    
    const matchesSearch = 
      animalName.includes(searchTerm.toLowerCase()) ||
      event.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.observacoes.toLowerCase().includes(searchTerm.toLowerCase())

    const eventDate = new Date(event.data)
    const startDate = filters.dataInicio ? new Date(filters.dataInicio) : null
    const endDate = filters.dataFim ? new Date(filters.dataFim) : null

    const matchesFilters =
      (!filters.animal || event.animalId === filters.animal) &&
      (!filters.tipo || event.tipo === filters.tipo) &&
      (!startDate || eventDate >= startDate) &&
      (!endDate || eventDate <= endDate) &&
      (!filters.mes || eventDate.getMonth() + 1 === parseInt(filters.mes)) &&
      (!filters.ano || eventDate.getFullYear() === parseInt(filters.ano))

    return matchesSearch && matchesFilters
  })

  // Paginação
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedEvents = filteredEvents.slice(startIndex, startIndex + itemsPerPage)

  // Estatísticas
  const stats = {
    total: events.length,
    porTipo: tiposOcorrencia.map(tipo => ({
      ...tipo,
      count: events.filter(e => e.tipo === tipo.id).length
    })),
    ultimaSemana: events.filter(e => {
      const eventDate = new Date(e.data)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return eventDate >= weekAgo
    }).length,
    mesAtual: events.filter(e => {
      const eventDate = new Date(e.data)
      const now = new Date()
      return eventDate.getMonth() === now.getMonth() && 
             eventDate.getFullYear() === now.getFullYear()
    }).length
  }

  // Exportar para Excel
  const exportToExcel = () => {
    try {
      const dataToExport = filteredEvents.map(event => {
        const animal = animals.find(a => a.id === parseInt(event.animalId))
        const tipoInfo = getTipoInfo(event.tipo)
        
        return [
          new Date(event.data).toLocaleDateString('pt-BR'),
          animal ? `${animal.serie} ${animal.rg}` : 'N/A',
          animal ? animal.raca : 'N/A',
          tipoInfo.label,
          event.descricao,
          event.observacoes,
          event.peso || '',
          event.valor ? `R$ ${parseFloat(event.valor).toFixed(2)}` : '',
          event.veterinario || '',
          event.medicamento || '',
          event.dosagem || '',
          event.proximaAplicacao || '',
          event.local || '',
          event.responsavel || '',
          new Date(event.createdAt).toLocaleDateString('pt-BR')
        ]
      })

      const headers = [
        'Data', 'Animal', 'Raça', 'Tipo de Ocorrência', 'Descrição', 'Observações',
        'Peso (kg)', 'Valor (R$)', 'Veterinário', 'Medicamento', 'Dosagem',
        'Próxima Aplicação', 'Local', 'Responsável', 'Data de Registro'
      ]

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet([headers, ...dataToExport])
      
      // Definir larguras das colunas
      ws['!cols'] = [
        { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 30 }, { wch: 30 },
        { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 10 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }
      ]

      XLSX.utils.book_append_sheet(wb, ws, 'Histórico de Ocorrências')

      // Planilha de resumo por tipo
      const resumoPorTipo = stats.porTipo.map(tipo => [
        tipo.label,
        tipo.count,
        ((tipo.count / stats.total) * 100).toFixed(1) + '%'
      ])

      const wsResumo = XLSX.utils.aoa_to_sheet([
        ['Tipo de Ocorrência', 'Quantidade', 'Percentual'],
        ...resumoPorTipo
      ])
      
      wsResumo['!cols'] = [{ wch: 25 }, { wch: 12 }, { wch: 12 }]
      XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo por Tipo')

      const fileName = `Historico_Animais_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`
      XLSX.writeFile(wb, fileName)

      alert('✅ Relatório exportado com sucesso!')
    } catch (error) {
      console.error('Erro ao exportar:', error)
      alert('❌ Erro ao exportar relatório')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            📋 Histórico de Ocorrências
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Registre e acompanhe todos os eventos dos animais
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={exportToExcel}
            className="btn-secondary flex items-center"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Exportar Excel
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nova Ocorrência
          </button>
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.total}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total de Ocorrências</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.ultimaSemana}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Última Semana</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {stats.mesAtual}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Mês Atual</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {stats.porTipo.filter(t => t.count > 0).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Tipos Diferentes</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filtros e Busca
          </h3>
          <button
            onClick={() => {
              setFilters({
                animal: '',
                tipo: '',
                dataInicio: '',
                dataFim: '',
                mes: '',
                ano: ''
              })
              setSearchTerm('')
              setCurrentPage(1)
            }}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
          >
            Limpar Filtros
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Animal
            </label>
            <select
              value={filters.animal}
              onChange={(e) => setFilters(prev => ({ ...prev, animal: e.target.value }))}
              className="input"
            >
              <option value="">Todos os animais</option>
              {animals.map(animal => (
                <option key={animal.id} value={animal.id}>
                  {animal.serie} {animal.rg} - {animal.raca}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo de Ocorrência
            </label>
            <select
              value={filters.tipo}
              onChange={(e) => setFilters(prev => ({ ...prev, tipo: e.target.value }))}
              className="input"
            >
              <option value="">Todos os tipos</option>
              {tiposOcorrencia.map(tipo => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.icon} {tipo.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data Início
            </label>
            <input
              type="date"
              value={filters.dataInicio}
              onChange={(e) => setFilters(prev => ({ ...prev, dataInicio: e.target.value }))}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data Fim
            </label>
            <input
              type="date"
              value={filters.dataFim}
              onChange={(e) => setFilters(prev => ({ ...prev, dataFim: e.target.value }))}
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Buscar por descrição ou observações
          </label>
          <input
            type="text"
            placeholder="Digite para buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
          />
        </div>
      </div>

      {/* Lista de Ocorrências */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Ocorrências Registradas
            </h3>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {filteredEvents.length} registros encontrados • Página {currentPage} de {totalPages}
            </div>
          </div>
        </div>

        {paginatedEvents.length === 0 ? (
          <div className="p-8 text-center">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhuma ocorrência encontrada
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {events.length === 0 
                ? 'Comece registrando a primeira ocorrência dos seus animais'
                : 'Tente ajustar os filtros ou termos de busca'
              }
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
            >
              Registrar Primeira Ocorrência
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Data
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Animal
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Tipo
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Descrição
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Detalhes
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedEvents.map((event) => {
                    const tipoInfo = getTipoInfo(event.tipo)
                    return (
                      <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {new Date(event.data).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {getAnimalName(event.animalId)}
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${tipoInfo.color}`}>
                            <span className="mr-1">{tipoInfo.icon}</span>
                            {tipoInfo.label}
                          </span>
                        </td>
                        <td className="px-3 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {event.descricao}
                          </div>
                          {event.observacoes && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {event.observacoes.substring(0, 50)}
                              {event.observacoes.length > 50 && '...'}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {event.peso && <div>Peso: {event.peso}kg</div>}
                          {event.valor && <div>Valor: R$ {parseFloat(event.valor).toFixed(2)}</div>}
                          {event.medicamento && <div>Med: {event.medicamento}</div>}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedEvent(event)
                                setShowViewModal(true)
                              }}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                              title="Ver detalhes"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(event.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400"
                              title="Excluir"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredEvents.length)} de {filteredEvents.length} registros
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <span className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                      {currentPage} de {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de Adicionar Ocorrência */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Registrar Nova Ocorrência
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Animal *
                  </label>
                  <select
                    value={newEvent.animalId}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, animalId: e.target.value }))}
                    className="input"
                    required
                  >
                    <option value="">Selecione o animal</option>
                    {animals.map(animal => (
                      <option key={animal.id} value={animal.id}>
                        {animal.serie} {animal.rg} - {animal.raca}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo de Ocorrência *
                  </label>
                  <select
                    value={newEvent.tipo}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, tipo: e.target.value }))}
                    className="input"
                    required
                  >
                    <option value="">Selecione o tipo</option>
                    {tiposOcorrencia.map(tipo => (
                      <option key={tipo.id} value={tipo.id}>
                        {tipo.icon} {tipo.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Data *
                  </label>
                  <input
                    type="date"
                    value={newEvent.data}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, data: e.target.value }))}
                    className="input"
                    required
                  />
                </div>
              </div>

              {/* Descrição e Observações */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descrição
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Pesagem mensal, Aplicação de vacina..."
                    value={newEvent.descricao}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, descricao: e.target.value }))}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Responsável
                  </label>
                  <input
                    type="text"
                    placeholder="Nome do responsável"
                    value={newEvent.responsavel}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, responsavel: e.target.value }))}
                    className="input"
                  />
                </div>
              </div>

              {/* Campos Específicos por Tipo */}
              {(newEvent.tipo === 'pesagem' || newEvent.tipo === 'leilao') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Peso (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 450.5"
                      value={newEvent.peso}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, peso: e.target.value }))}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Local
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Pasto 1, Curral A..."
                      value={newEvent.local}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, local: e.target.value }))}
                      className="input"
                    />
                  </div>
                </div>
              )}

              {(newEvent.tipo === 'venda' || newEvent.tipo === 'leilao') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 2500.00"
                    value={newEvent.valor}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, valor: e.target.value }))}
                    className="input"
                  />
                </div>
              )}

              {(newEvent.tipo === 'medicacao' || newEvent.tipo === 'vacinacao') && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Medicamento/Vacina
                    </label>
                    <input
                      type="text"
                      placeholder="Nome do medicamento"
                      value={newEvent.medicamento}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, medicamento: e.target.value }))}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Dosagem
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 5ml, 1 dose..."
                      value={newEvent.dosagem}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, dosagem: e.target.value }))}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Próxima Aplicação
                    </label>
                    <input
                      type="date"
                      value={newEvent.proximaAplicacao}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, proximaAplicacao: e.target.value }))}
                      className="input"
                    />
                  </div>
                </div>
              )}

              {(newEvent.tipo === 'exame' || newEvent.tipo === 'medicacao') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Veterinário
                  </label>
                  <input
                    type="text"
                    placeholder="Nome do veterinário"
                    value={newEvent.veterinario}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, veterinario: e.target.value }))}
                    className="input"
                  />
                </div>
              )}

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Observações
                </label>
                <textarea
                  rows={3}
                  placeholder="Observações adicionais sobre a ocorrência..."
                  value={newEvent.observacoes}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, observacoes: e.target.value }))}
                  className="input"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddEvent}
                className="btn-primary"
              >
                Registrar Ocorrência
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização */}
      {showViewModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Detalhes da Ocorrência
                </h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Data</label>
                  <div className="text-lg text-gray-900 dark:text-white">
                    {new Date(selectedEvent.data).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Animal</label>
                  <div className="text-lg text-gray-900 dark:text-white">
                    {getAnimalName(selectedEvent.animalId)}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Tipo</label>
                <div className="flex items-center mt-1">
                  {(() => {
                    const tipoInfo = getTipoInfo(selectedEvent.tipo)
                    return (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white ${tipoInfo.color}`}>
                        <span className="mr-2">{tipoInfo.icon}</span>
                        {tipoInfo.label}
                      </span>
                    )
                  })()}
                </div>
              </div>

              {selectedEvent.descricao && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Descrição</label>
                  <div className="text-gray-900 dark:text-white">{selectedEvent.descricao}</div>
                </div>
              )}

              {selectedEvent.observacoes && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Observações</label>
                  <div className="text-gray-900 dark:text-white">{selectedEvent.observacoes}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {selectedEvent.peso && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Peso</label>
                    <div className="text-gray-900 dark:text-white">{selectedEvent.peso} kg</div>
                  </div>
                )}

                {selectedEvent.valor && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Valor</label>
                    <div className="text-gray-900 dark:text-white">R$ {parseFloat(selectedEvent.valor).toFixed(2)}</div>
                  </div>
                )}

                {selectedEvent.medicamento && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Medicamento</label>
                    <div className="text-gray-900 dark:text-white">{selectedEvent.medicamento}</div>
                  </div>
                )}

                {selectedEvent.dosagem && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Dosagem</label>
                    <div className="text-gray-900 dark:text-white">{selectedEvent.dosagem}</div>
                  </div>
                )}

                {selectedEvent.veterinario && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Veterinário</label>
                    <div className="text-gray-900 dark:text-white">{selectedEvent.veterinario}</div>
                  </div>
                )}

                {selectedEvent.local && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Local</label>
                    <div className="text-gray-900 dark:text-white">{selectedEvent.local}</div>
                  </div>
                )}

                {selectedEvent.responsavel && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Responsável</label>
                    <div className="text-gray-900 dark:text-white">{selectedEvent.responsavel}</div>
                  </div>
                )}

                {selectedEvent.proximaAplicacao && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Próxima Aplicação</label>
                    <div className="text-gray-900 dark:text-white">
                      {new Date(selectedEvent.proximaAplicacao).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Registrado em: {new Date(selectedEvent.createdAt).toLocaleString('pt-BR')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}