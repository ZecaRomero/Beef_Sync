
import React, { useEffect, useState } from 'react'

import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  XMarkIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  CalendarIcon
} from '../ui/Icons'

// Ícone adicional que não está no arquivo Icons.js
const AdjustmentsHorizontalIcon = ({ className = "h-6 w-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m0 0a1.5 1.5 0 013 0m-3 0a1.5 1.5 0 00-3 0m0 0V18a1.5 1.5 0 001.5 1.5h9a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H7.5z" />
  </svg>
)

export default function AdvancedSearch({ onSearch, placeholder = "Buscar..." }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    category: 'all', // all, animals, nascimentos, custos, semen, notasfiscais
    dateRange: 'all', // all, 7dias, 30dias, 90dias, ano
    status: 'all', // all, ativo, vendido, morto
    minValue: '',
    maxValue: '',
    raca: 'all',
    sexo: 'all'
  })
  const [searchHistory, setSearchHistory] = useState([])
  const [suggestions, setSuggestions] = useState([])

  useEffect(() => {
    loadSearchHistory()
  }, [])

  useEffect(() => {
    if (searchTerm.length > 2) {
      generateSuggestions()
    } else {
      setSuggestions([])
    }
  }, [searchTerm])

  const loadSearchHistory = () => {
    try {
      const history = JSON.parse(localStorage.getItem('beefsync_search_history') || '[]')
      setSearchHistory(history.slice(0, 10)) // Últimas 10 buscas
    } catch (error) {
      console.error('Erro ao carregar histórico de busca:', error)
    }
  }

  const generateSuggestions = () => {
    try {
      const suggestions = []
      
      // Buscar em animais
      const animais = JSON.parse(localStorage.getItem('animals') || '[]')
      const animaisMatches = (animais || []).filter(animal => 
        animal.serie?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        animal.tatuagem?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        animal.raca?.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 3)
      
      animaisMatches.forEach(animal => {
        suggestions.push({
          type: 'animal',
          id: animal.id,
          title: `${animal.serie || animal.tatuagem} - ${animal.raca}`,
          subtitle: `Status: ${animal.situacao}`,
          icon: UserGroupIcon
        })
      })

      // Buscar em nascimentos
      const nascimentos = JSON.parse(localStorage.getItem('birthData') || '[]')
      const nascimentosMatches = nascimentos.filter(nascimento =>
        nascimento.receptora?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nascimento.doadora?.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 2)

      nascimentosMatches.forEach(nascimento => {
        suggestions.push({
          type: 'nascimento',
          id: nascimento.id,
          title: `Nascimento - ${nascimento.receptora || 'N/A'}`,
          subtitle: `Status: ${nascimento.status}`,
          icon: CalendarIcon
        })
      })

      // Buscar em notas fiscais
      const notasFiscais = JSON.parse(localStorage.getItem('notasFiscais') || '[]')
      const nfMatches = notasFiscais.filter(nf =>
        nf.numeroNF?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nf.fornecedor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nf.destino?.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 2)

      nfMatches.forEach(nf => {
        suggestions.push({
          type: 'notafiscal',
          id: nf.id,
          title: `NF ${nf.numeroNF}`,
          subtitle: `${nf.tipo} - ${nf.fornecedor || nf.destino}`,
          icon: DocumentTextIcon
        })
      })

      setSuggestions(suggestions)
    } catch (error) {
      console.error('Erro ao gerar sugestões:', error)
    }
  }

  const handleSearch = (term = searchTerm) => {
    if (!term.trim()) return

    // Salvar no histórico
    const newHistory = [term, ...searchHistory.filter(h => h !== term)].slice(0, 10)
    setSearchHistory(newHistory)
    localStorage.setItem('beefsync_search_history', JSON.stringify(newHistory))

    // Executar busca
    const searchResults = performSearch(term, filters)
    onSearch(searchResults, term, filters)
    
    setSuggestions([])
  }

  const performSearch = (term, currentFilters) => {
    const results = {
      animals: [],
      nascimentos: [],
      custos: [],
      semen: [],
      notasfiscais: [],
      total: 0
    }

    try {
      const termLower = term.toLowerCase()

      // Buscar animais
      if (currentFilters.category === 'all' || currentFilters.category === 'animals') {
        const animais = JSON.parse(localStorage.getItem('animals') || '[]')
        results.animals = (animais || []).filter(animal => {
          const matchesTerm = 
            animal.serie?.toLowerCase().includes(termLower) ||
            animal.tatuagem?.toLowerCase().includes(termLower) ||
            animal.raca?.toLowerCase().includes(termLower) ||
            animal.sexo?.toLowerCase().includes(termLower)

          const matchesStatus = currentFilters.status === 'all' || animal.situacao === currentFilters.status
          const matchesRaca = currentFilters.raca === 'all' || animal.raca === currentFilters.raca
          const matchesSexo = currentFilters.sexo === 'all' || animal.sexo === currentFilters.sexo

          return matchesTerm && matchesStatus && matchesRaca && matchesSexo
        })
      }

      // Buscar nascimentos
      if (currentFilters.category === 'all' || currentFilters.category === 'nascimentos') {
        const nascimentos = JSON.parse(localStorage.getItem('birthData') || '[]')
        results.nascimentos = nascimentos.filter(nascimento => {
          return nascimento.receptora?.toLowerCase().includes(termLower) ||
                 nascimento.doadora?.toLowerCase().includes(termLower) ||
                 nascimento.touro?.toLowerCase().includes(termLower)
        })
      }

      // Buscar custos
      if (currentFilters.category === 'all' || currentFilters.category === 'custos') {
        const custos = JSON.parse(localStorage.getItem('custos') || '[]')
        results.custos = custos.filter(custo => {
          const matchesTerm = 
            custo.tipo?.toLowerCase().includes(termLower) ||
            custo.subtipo?.toLowerCase().includes(termLower) ||
            custo.observacoes?.toLowerCase().includes(termLower)

          const matchesValue = 
            (!currentFilters.minValue || parseFloat(custo.valor) >= parseFloat(currentFilters.minValue)) &&
            (!currentFilters.maxValue || parseFloat(custo.valor) <= parseFloat(currentFilters.maxValue))

          return matchesTerm && matchesValue
        })
      }

      // Buscar sêmen
      if (currentFilters.category === 'all' || currentFilters.category === 'semen') {
        const semen = JSON.parse(localStorage.getItem('estoqueSemen') || '[]')
        results.semen = semen.filter(s => {
          return s.nomeTouro?.toLowerCase().includes(termLower) ||
                 s.raca?.toLowerCase().includes(termLower) ||
                 s.fornecedor?.toLowerCase().includes(termLower)
        })
      }

      // Buscar notas fiscais
      if (currentFilters.category === 'all' || currentFilters.category === 'notasfiscais') {
        const notasFiscais = JSON.parse(localStorage.getItem('notasFiscais') || '[]')
        results.notasfiscais = notasFiscais.filter(nf => {
          return nf.numeroNF?.toLowerCase().includes(termLower) ||
                 nf.fornecedor?.toLowerCase().includes(termLower) ||
                 nf.destino?.toLowerCase().includes(termLower) ||
                 nf.naturezaOperacao?.toLowerCase().includes(termLower)
        })
      }

      // Calcular total
      results.total = results.animals.length + results.nascimentos.length + 
                     results.custos.length + results.semen.length + results.notasfiscais.length

    } catch (error) {
      console.error('Erro ao executar busca:', error)
    }

    return results
  }

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion.title)
    handleSearch(suggestion.title)
  }

  const clearFilters = () => {
    setFilters({
      category: 'all',
      dateRange: 'all',
      status: 'all',
      minValue: '',
      maxValue: '',
      raca: 'all',
      sexo: 'all'
    })
  }

  const getFilterCount = () => {
    let count = 0
    if (filters.category !== 'all') count++
    if (filters.dateRange !== 'all') count++
    if (filters.status !== 'all') count++
    if (filters.minValue || filters.maxValue) count++
    if (filters.raca !== 'all') count++
    if (filters.sexo !== 'all') count++
    return count
  }

  return (
    <div className="relative">
      {/* Barra de Busca */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="block w-full pl-10 pr-20 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={placeholder}
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 space-x-1">
          {/* Botão de Filtros */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1 rounded-md transition-colors ${
              getFilterCount() > 0 
                ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30' 
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <FunnelIcon className="h-5 w-5" />
            {getFilterCount() > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {getFilterCount()}
              </span>
            )}
          </button>
          
          {/* Botão de Buscar */}
          <button
            onClick={() => handleSearch()}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            Buscar
          </button>
        </div>
      </div>

      {/* Sugestões */}
      {suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3"
            >
              <suggestion.icon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {suggestion.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {suggestion.subtitle}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Painel de Filtros */}
      {showFilters && (
        <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Filtros Avançados
            </h3>
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Limpar filtros
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Categoria
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas</option>
                <option value="animals">Animais</option>
                <option value="nascimentos">Nascimentos</option>
                <option value="custos">Custos</option>
                <option value="semen">Sêmen</option>
                <option value="notasfiscais">Notas Fiscais</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos</option>
                <option value="Ativo">Ativo</option>
                <option value="Vendido">Vendido</option>
                <option value="Morto">Morto</option>
                <option value="Transferido">Transferido</option>
              </select>
            </div>

            {/* Raça */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Raça
              </label>
              <select
                value={filters.raca}
                onChange={(e) => setFilters(prev => ({ ...prev, raca: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas</option>
                <option value="Nelore">Nelore</option>
                <option value="Angus">Angus</option>
                <option value="Brahman">Brahman</option>
                <option value="Gir">Gir</option>
                <option value="Guzerá">Guzerá</option>
              </select>
            </div>

            {/* Sexo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sexo
              </label>
              <select
                value={filters.sexo}
                onChange={(e) => setFilters(prev => ({ ...prev, sexo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos</option>
                <option value="M">Macho</option>
                <option value="F">Fêmea</option>
              </select>
            </div>

            {/* Valor Mínimo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Valor Mínimo (R$)
              </label>
              <input
                type="number"
                value={filters.minValue}
                onChange={(e) => setFilters(prev => ({ ...prev, minValue: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>

            {/* Valor Máximo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Valor Máximo (R$)
              </label>
              <input
                type="number"
                value={filters.maxValue}
                onChange={(e) => setFilters(prev => ({ ...prev, maxValue: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="999999"
              />
            </div>
          </div>

          <div className="flex justify-end mt-4 space-x-2">
            <button
              onClick={() => setShowFilters(false)}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                handleSearch()
                setShowFilters(false)
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}

      {/* Histórico de Busca */}
      {searchHistory.length > 0 && !searchTerm && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto">
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Buscas Recentes
            </p>
          </div>
          {searchHistory.map((term, index) => (
            <button
              key={index}
              onClick={() => {
                setSearchTerm(term)
                handleSearch(term)
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm text-gray-600 dark:text-gray-400"
            >
              {term}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
