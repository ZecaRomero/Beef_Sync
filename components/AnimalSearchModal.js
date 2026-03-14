import React, { useState, useMemo } from 'react'
import { 
  MagnifyingGlassIcon, 
  XMarkIcon,
  FunnelIcon,
  CalendarIcon,
  ScaleIcon
} from '@heroicons/react/24/outline'

export default function AnimalSearchModal({ 
  isOpen, 
  onClose, 
  animals, 
  onSelectAnimal 
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    sexo: '',
    raca: '',
    situacao: '',
    pesoMin: '',
    pesoMax: '',
    idadeMin: '',
    idadeMax: ''
  })

  // Obter raças únicas
  const racasUnicas = useMemo(() => {
    const racas = new Set()
    animals.forEach(animal => {
      if (animal.raca) racas.add(animal.raca)
    })
    return Array.from(racas).sort()
  }, [animals])

  // Filtrar animais
  const animaisFiltrados = useMemo(() => {
    return animals.filter(animal => {
      // Busca por texto
      const matchText = !searchTerm || 
        animal.serie?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        animal.rg?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        animal.raca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        animal.observacoes?.toLowerCase().includes(searchTerm.toLowerCase())

      // Filtros específicos
      const matchSexo = !filters.sexo || animal.sexo === filters.sexo
      const matchRaca = !filters.raca || animal.raca === filters.raca
      const matchSituacao = !filters.situacao || animal.situacao === filters.situacao
      
      // Filtro de peso
      const peso = parseFloat(animal.peso) || 0
      const matchPesoMin = !filters.pesoMin || peso >= parseFloat(filters.pesoMin)
      const matchPesoMax = !filters.pesoMax || peso <= parseFloat(filters.pesoMax)

      // Filtro de idade (baseado na data de nascimento)
      let matchIdade = true
      if (animal.data_nascimento && (filters.idadeMin || filters.idadeMax)) {
        const nascimento = new Date(animal.data_nascimento)
        const hoje = new Date()
        const idadeAnos = (hoje - nascimento) / (365.25 * 24 * 60 * 60 * 1000)
        
        if (filters.idadeMin) matchIdade = matchIdade && idadeAnos >= parseFloat(filters.idadeMin)
        if (filters.idadeMax) matchIdade = matchIdade && idadeAnos <= parseFloat(filters.idadeMax)
      }

      return matchText && matchSexo && matchRaca && matchSituacao && 
             matchPesoMin && matchPesoMax && matchIdade
    })
  }, [animals, searchTerm, filters])

  const clearFilters = () => {
    setSearchTerm('')
    setFilters({
      sexo: '',
      raca: '',
      situacao: '',
      pesoMin: '',
      pesoMax: '',
      idadeMin: '',
      idadeMax: ''
    })
  }

  const handleSelectAnimal = (animal) => {
    onSelectAnimal(animal)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MagnifyingGlassIcon className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">Busca Avançada de Animais</h2>
                <p className="text-blue-100">Encontre animais com filtros detalhados</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 p-2 rounded-full hover:bg-white/20"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          {/* Main search */}
          <div className="mb-6">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por série, RG, raça ou observações..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sexo
              </label>
              <select
                value={filters.sexo}
                onChange={(e) => setFilters({...filters, sexo: e.target.value})}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Todos</option>
                <option value="Macho">🐂 Macho</option>
                <option value="Femea">🐄 Fêmea</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Raça
              </label>
              <select
                value={filters.raca}
                onChange={(e) => setFilters({...filters, raca: e.target.value})}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Todas</option>
                {racasUnicas.map(raca => (
                  <option key={raca} value={raca}>{raca}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Situação
              </label>
              <select
                value={filters.situacao}
                onChange={(e) => setFilters({...filters, situacao: e.target.value})}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Todas</option>
                <option value="Ativo">🟢 Ativo</option>
                <option value="Inativo">🟡 Inativo</option>
                <option value="Morto">🔴 Morto</option>
                <option value="Vendido">💰 Vendido</option>
              </select>
            </div>

            <div className="flex space-x-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Peso Min (kg)
                </label>
                <input
                  type="number"
                  value={filters.pesoMin}
                  onChange={(e) => setFilters({...filters, pesoMin: e.target.value})}
                  placeholder="0"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Peso Max (kg)
                </label>
                <input
                  type="number"
                  value={filters.pesoMax}
                  onChange={(e) => setFilters({...filters, pesoMax: e.target.value})}
                  placeholder="1000"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Clear filters button */}
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {animaisFiltrados.length} animal(is) encontrado(s) de {animals.length} total
            </div>
            <button
              onClick={clearFilters}
              className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center space-x-1"
            >
              <XMarkIcon className="h-4 w-4" />
              <span>Limpar Filtros</span>
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto max-h-96 p-6">
          {animaisFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <MagnifyingGlassIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Nenhum animal encontrado
              </h3>
              <p className="text-gray-500">
                Tente ajustar os filtros ou termo de busca
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {animaisFiltrados.map(animal => {
                const sexoIcon = animal.sexo === 'Macho' ? '🐂' : '🐄'
                const idade = animal.data_nascimento ? 
                  Math.floor((new Date() - new Date(animal.data_nascimento)) / (365.25 * 24 * 60 * 60 * 1000)) : null

                return (
                  <div
                    key={animal.id}
                    onClick={() => handleSelectAnimal(animal)}
                    className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:shadow-lg cursor-pointer transition-all bg-white dark:bg-gray-700"
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-3xl">{sexoIcon}</span>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                          {animal.serie} - {animal.rg}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          {animal.raca} • {animal.sexo}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            animal.situacao === 'Ativo' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            animal.situacao === 'Morto' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
                          }`}>
                            {animal.situacao}
                          </span>
                          
                          {animal.peso && (
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium">
                              ⚖️ {animal.peso}kg
                            </span>
                          )}
                          
                          {idade && (
                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-xs font-medium">
                              📅 {idade} anos
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}