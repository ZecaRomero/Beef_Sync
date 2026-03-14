import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody } from './ui/Card'
import Button from './ui/Button'
import Input from './ui/Input'
import Select from './ui/Select'
import { 
  MapPinIcon, 
  UserGroupIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ArrowRightIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

export default function BatchLocationManager({ animals, onBatchMove, onClose }) {
  const [selectedAnimals, setSelectedAnimals] = useState([])
  const [targetLocation, setTargetLocation] = useState('')
  const [moveDate, setMoveDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSex, setFilterSex] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Lista de piquetes disponíveis (você pode expandir isso)
  const availableLocations = [
    'Piquete A', 'Piquete B', 'Piquete C', 'Piquete D', 'Piquete E',
    'Piquete F', 'Piquete G', 'Piquete H', 'Piquete I', 'Piquete J',
    'Campo 1', 'Campo 2', 'Campo 3', 'Campo 4', 'Campo 5',
    'Pastagem Norte', 'Pastagem Sul', 'Pastagem Leste', 'Pastagem Oeste',
    'Curral Principal', 'Curral Secundário', 'Quarentena', 'Reprodução'
  ]

  // Filtrar animais
  const filteredAnimals = animals.filter(animal => {
    const matchesSearch = animal.serie?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         animal.rg?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         animal.raca?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSex = !filterSex || animal.sexo === filterSex
    const matchesStatus = !filterStatus || animal.situacao === filterStatus
    
    return matchesSearch && matchesSex && matchesStatus
  })

  // Selecionar/deselecionar animal
  const toggleAnimalSelection = (animal) => {
    setSelectedAnimals(prev => {
      const isSelected = prev.some(a => a.id === animal.id)
      if (isSelected) {
        return prev.filter(a => a.id !== animal.id)
      } else {
        return [...prev, animal]
      }
    })
  }

  // Selecionar todos os animais filtrados
  const selectAllFiltered = () => {
    setSelectedAnimals(filteredAnimals)
  }

  // Deselecionar todos
  const deselectAll = () => {
    setSelectedAnimals([])
  }

  // Processar movimentação em lote
  const handleBatchMove = async () => {
    if (selectedAnimals.length === 0) {
      alert('Selecione pelo menos um animal para movimentar')
      return
    }

    if (!targetLocation) {
      alert('Selecione uma localização de destino')
      return
    }

    setIsProcessing(true)
    try {
      const moveData = {
        animals: selectedAnimals.map(animal => ({
          id: animal.id,
          serie: animal.serie,
          rg: animal.rg
        })),
        targetLocation,
        moveDate,
        notes,
        timestamp: new Date().toISOString()
      }

      await onBatchMove(moveData)
      
      // Limpar seleção após sucesso
      setSelectedAnimals([])
      setTargetLocation('')
      setNotes('')
      
      alert(`✅ ${selectedAnimals.length} animais movidos para ${targetLocation} com sucesso!`)
    } catch (error) {
      console.error('Erro na movimentação em lote:', error)
      alert('❌ Erro ao movimentar animais. Tente novamente.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Cabeçalho */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <UserGroupIcon className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">Movimentação em Lote</h2>
                <p className="text-blue-100">Mova vários animais para uma localização específica</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <XCircleIcon className="h-6 w-6" />
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Painel de Seleção de Animais */}
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-4 rounded-xl border">
                <h3 className="text-lg font-bold text-green-800 dark:text-green-200 mb-4 flex items-center space-x-2">
                  <UserGroupIcon className="h-5 w-5" />
                  <span>Selecionar Animais ({selectedAnimals.length} selecionados)</span>
                </h3>

                {/* Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <Input
                    label="Buscar"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Série, RG ou raça..."
                  />
                  <Select
                    label="Sexo"
                    value={filterSex}
                    onChange={(e) => setFilterSex(e.target.value)}
                  >
                    <option value="">Todos</option>
                    <option value="Macho">Macho</option>
                    <option value="Fêmea">Fêmea</option>
                  </Select>
                  <Select
                    label="Status"
                    value={filterStatus}
                    onChange={(e) => setFilterSex(e.target.value)}
                  >
                    <option value="">Todos</option>
                    <option value="Ativo">Ativo</option>
                    <option value="Morto">Morto</option>
                    <option value="Vendido">Vendido</option>
                  </Select>
                </div>

                {/* Controles de seleção */}
                <div className="flex space-x-2 mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllFiltered}
                    className="flex items-center space-x-1"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    <span>Selecionar Todos ({filteredAnimals.length})</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deselectAll}
                    className="flex items-center space-x-1"
                  >
                    <XCircleIcon className="h-4 w-4" />
                    <span>Limpar Seleção</span>
                  </Button>
                </div>

                {/* Lista de animais */}
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {filteredAnimals.map(animal => {
                    const isSelected = selectedAnimals.some(a => a.id === animal.id)
                    const sexoIcon = animal.sexo === 'Macho' ? '🐂' : '🐄'
                    
                    return (
                      <div
                        key={animal.id}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                          isSelected 
                            ? 'bg-blue-100 border-blue-400 dark:bg-blue-900/30 dark:border-blue-600' 
                            : 'bg-white border-gray-200 hover:border-gray-300 dark:bg-gray-700 dark:border-gray-600'
                        }`}
                        onClick={() => toggleAnimalSelection(animal)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{sexoIcon}</span>
                            <div>
                              <div className="font-bold text-gray-900 dark:text-white">
                                {animal.serie} - {animal.rg}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {animal.raca} • {animal.sexo} • {animal.situacao}
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Painel de Configuração da Movimentação */}
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl border">
                <h3 className="text-lg font-bold text-purple-800 dark:text-purple-200 mb-4 flex items-center space-x-2">
                  <MapPinIcon className="h-5 w-5" />
                  <span>Configurar Movimentação</span>
                </h3>

                <div className="space-y-4">
                  <Select
                    label="Localização de Destino"
                    value={targetLocation}
                    onChange={(e) => setTargetLocation(e.target.value)}
                    required
                  >
                    <option value="">Selecione uma localização...</option>
                    {availableLocations.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </Select>

                  <Input
                    label="Data da Movimentação"
                    type="date"
                    value={moveDate}
                    onChange={(e) => setMoveDate(e.target.value)}
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Observações (opcional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Adicione observações sobre a movimentação..."
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      rows={3}
                    />
                  </div>

                  {/* Resumo da movimentação */}
                  {selectedAnimals.length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                      <h4 className="font-bold text-blue-800 dark:text-blue-200 mb-2">
                        Resumo da Movimentação
                      </h4>
                      <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                        <div>• {selectedAnimals.length} animais selecionados</div>
                        <div>• Destino: {targetLocation || 'Não selecionado'}</div>
                        <div>• Data: {new Date(moveDate).toLocaleDateString('pt-BR')}</div>
                      </div>
                    </div>
                  )}

                  {/* Botões de ação */}
                  <div className="flex space-x-3 pt-4">
                    <Button
                      onClick={handleBatchMove}
                      disabled={selectedAnimals.length === 0 || !targetLocation || isProcessing}
                      className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Processando...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <ArrowRightIcon className="h-5 w-5" />
                          <span>Mover {selectedAnimals.length} Animais</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
