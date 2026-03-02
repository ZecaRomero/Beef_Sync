
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'

import { 
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import { Card, CardHeader, CardBody } from '../ui/Card'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Badge from '../ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell } from '../ui/Table'
import LoadingSpinner from '../ui/LoadingSpinner'
import EmptyState from '../ui/EmptyState'
import Modal from '../ui/Modal'
import ModernAnimalForm from './ModernAnimalForm'
import { useAnimals } from '../../hooks/useAnimals'

// Memoizar o componente AnimalCard para evitar re-renderizações desnecessárias
const AnimalCard = memo(({ animal, onView, onEdit, onDelete }) => {
  const getSituationBadge = useCallback((situacao) => {
    const variants = {
      'Ativo': 'success',
      'Vendido': 'primary',
      'Morto': 'danger',
      'Doado': 'warning'
    }
    return variants[situacao] || 'neutral'
  }, [])

  const badgeVariant = useMemo(() => getSituationBadge(animal.situacao), [animal.situacao, getSituationBadge])
  
  // Calcular idade em meses
  const idadeMeses = useMemo(() => {
    if (!animal.data_nascimento) return null
    const nascimento = new Date(animal.data_nascimento)
    const hoje = new Date()
    const diffTime = Math.abs(hoje - nascimento)
    const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44))
    return diffMonths
  }, [animal.data_nascimento])
  
  // Pegar localização
  const localizacao = animal.pasto_atual || animal.piquete_atual || animal.pastoAtual || animal.piqueteAtual

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardBody>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {animal.serie}{animal.rg}
              </h3>
              <Badge variant={badgeVariant}>
                {animal.situacao}
              </Badge>
            </div>
            
            {animal.nome && (
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {animal.nome}
              </p>
            )}
            
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-4">
                <p><span className="font-medium">Sexo:</span> {animal.sexo}</p>
                <p><span className="font-medium">Raça:</span> {animal.raca}</p>
              </div>
              
              {idadeMeses !== null && (
                <p><span className="font-medium">Idade:</span> {idadeMeses} meses</p>
              )}
              
              {animal.peso && (
                <p><span className="font-medium">Peso:</span> {animal.peso}kg</p>
              )}
              
              {localizacao && (
                <p className="flex items-center gap-1">
                  <span className="font-medium">📍 Local:</span> 
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">{localizacao}</span>
                </p>
              )}
              
              {(animal.abczg || animal.abczg === 0) && (
                <p className="flex items-center gap-1">
                  <span className="font-medium">🏆 iABCZ:</span> 
                  <span className="text-blue-600 dark:text-blue-400 font-bold">{animal.abczg}</span>
                </p>
              )}
              {(animal.deca || animal.deca === 0) && (
                <p className="flex items-center gap-1">
                  <span className="font-medium">DECA:</span> 
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{animal.deca}</span>
                </p>
              )}
              {(animal.genetica_2 || animal.genetica_2 === 0) && (
                <p className="flex items-center gap-1">
                  <span className="font-medium">Aval2:</span> 
                  <span className="text-purple-600 dark:text-purple-400 font-bold">{animal.genetica_2}</span>
                </p>
              )}
              {(animal.decile_2 || animal.decile_2 === 0) && (
                <p className="flex items-center gap-1">
                  <span className="font-medium">Dec2:</span> 
                  <span className="text-amber-600 dark:text-amber-400 font-bold">{animal.decile_2}</span>
                </p>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(animal)}
              className="text-blue-600 hover:text-blue-800"
            >
              <EyeIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(animal)}
              className="text-green-600 hover:text-green-800"
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(animal)}
              className="text-red-600 hover:text-red-800"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  )
})

AnimalCard.displayName = 'AnimalCard'

const ModernAnimalList = memo(() => {
  const { animals, loading, createAnimal, updateAnimal, deleteAnimal } = useAnimals()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSituacao, setFilterSituacao] = useState('')
  const [filterSexo, setFilterSexo] = useState('')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'table'
  const [selectedAnimal, setSelectedAnimal] = useState(null)
  const [showAnimalModal, setShowAnimalModal] = useState(false)
  const [showAnimalForm, setShowAnimalForm] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const filteredAnimals = (Array.isArray(animals) ? animals : []).filter(animal => {
    const search = searchTerm.toLowerCase().trim()
    const searchNormalized = search.replace(/[-\s]/g, '')
    
    // Preparar campos para busca
    const serieRg = `${animal.serie}${animal.rg}`.toLowerCase()
    const serieRgEspaco = `${animal.serie} ${animal.rg}`.toLowerCase()
    const serieRgHifen = `${animal.serie}-${animal.rg}`.toLowerCase()
    const nome = (animal.nome || '').toLowerCase()
    const raca = (animal.raca || '').toLowerCase()
    const pai = (animal.pai || '').toLowerCase()
    const mae = (animal.mae || '').toLowerCase()

    const matchesSearch = !search || 
      serieRg.includes(searchNormalized) ||
      serieRgEspaco.includes(search) ||
      serieRgHifen.includes(search) ||
      nome.includes(search) ||
      raca.includes(search) ||
      pai.includes(search) ||
      mae.includes(search)
    
    const matchesSituacao = !filterSituacao || animal.situacao === filterSituacao
    const matchesSexo = !filterSexo || animal.sexo === filterSexo
    
    return matchesSearch && matchesSituacao && matchesSexo
  })

  const handleView = (animal) => {
    setSelectedAnimal(animal)
    setShowAnimalModal(true)
  }

  const handleEdit = (animal) => {
    setSelectedAnimal(animal)
    setShowAnimalForm(true)
  }

  const handleDelete = (animal) => {
    setSelectedAnimal(animal)
    setShowDeleteModal(true)
  }

  const handleNewAnimal = () => {
    setSelectedAnimal(null)
    setShowAnimalForm(true)
  }

  const handleSaveAnimal = async (animalData) => {
    if (selectedAnimal) {
      await updateAnimal(selectedAnimal.id, animalData)
    } else {
      await createAnimal(animalData)
    }
  }

  const handleImportAnimals = async (animalsToImport) => {
    try {
      let successCount = 0
      let failCount = 0
      const errors = []

      for (const animalData of animalsToImport) {
        try {
          await createAnimal(animalData)
          successCount++
        } catch (error) {
          failCount++
          errors.push({ animal: `${animalData.serie}-${animalData.rg}`, error: error.message })
        }
      }

      if (failCount === 0) {
        alert(`✅ Sucesso! ${successCount} animais importados com sucesso!`)
      } else if (successCount === 0) {
        alert(`❌ Erro! Não foi possível importar nenhum animal. Verifique os dados e tente novamente.`)
      } else {
        alert(`⚠️ Importação parcial: ${successCount} animais importados com sucesso, ${failCount} falharam.`)
      }

      setShowAnimalForm(false)
    } catch (error) {
      alert('❌ Erro: Não foi possível importar os animais')
      console.error('Erro na importação:', error)
    }
  }

  const confirmDelete = async () => {
    try {
      await deleteAnimal(selectedAnimal.id)
      alert('✅ Sucesso! Animal removido do rebanho com sucesso!')
      setShowDeleteModal(false)
      setSelectedAnimal(null)
    } catch (error) {
      alert('❌ Erro: Não foi possível excluir o animal')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Carregando animais..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Animais
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie seu rebanho
          </p>
        </div>
        <Button 
          variant="primary" 
          leftIcon={<PlusIcon className="h-4 w-4" />}
          onClick={handleNewAnimal}
        >
          Novo Animal
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por série, RG, raça, pai ou mãe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={filterSituacao}
                onChange={(e) => setFilterSituacao(e.target.value)}
                className="input-field w-32"
              >
                <option value="">Todas situações</option>
                <option value="Ativo">Ativo</option>
                <option value="Vendido">Vendido</option>
                <option value="Morto">Morto</option>
                <option value="Doado">Doado</option>
              </select>
              
              <select
                value={filterSexo}
                onChange={(e) => setFilterSexo(e.target.value)}
                className="input-field w-32"
              >
                <option value="">Todos sexos</option>
                <option value="Macho">Macho</option>
                <option value="Fêmea">Fêmea</option>
              </select>
              
              <Button
                variant="secondary"
                leftIcon={<FunnelIcon className="h-4 w-4" />}
              >
                Filtros
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Results */}
      {filteredAnimals.length === 0 ? (
        <EmptyState
          icon={<UserGroupIcon className="h-12 w-12" />}
          title="Nenhum animal encontrado"
          description={searchTerm || filterSituacao || filterSexo 
            ? "Tente ajustar os filtros de busca."
            : "Comece adicionando seu primeiro animal ao rebanho."
          }
          action={
            <Button 
              variant="primary" 
              leftIcon={<PlusIcon className="h-4 w-4" />}
              onClick={handleNewAnimal}
            >
              Adicionar Animal
            </Button>
          }
        />
      ) : (
        <>
          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>
              Mostrando {filteredAnimals.length} de {animals.length} animais
            </span>
            <div className="flex items-center space-x-2">
              <span>Visualização:</span>
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                Cards
              </Button>
              <Button
                variant={viewMode === 'table' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                Tabela
              </Button>
            </div>
          </div>

          {/* Content */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAnimals.map((animal) => (
                <AnimalCard
                  key={animal.id}
                  animal={animal}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Animal</TableHeaderCell>
                    <TableHeaderCell>Sexo</TableHeaderCell>
                    <TableHeaderCell>Raça</TableHeaderCell>
                    <TableHeaderCell>Idade</TableHeaderCell>
                    <TableHeaderCell>Situação</TableHeaderCell>
                    <TableHeaderCell>Ações</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAnimals.map((animal) => (
                    <TableRow key={animal.id}>
                      <TableCell>
                        <div className="font-medium">
                          {animal.serie}{animal.rg}
                        </div>
                      </TableCell>
                      <TableCell>{animal.sexo}</TableCell>
                      <TableCell>{animal.raca}</TableCell>
                      <TableCell>{animal.meses} meses</TableCell>
                      <TableCell>
                        <Badge variant={getSituationBadge(animal.situacao)}>
                          {animal.situacao}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(animal)}
                            className="p-1"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(animal)}
                            className="p-1"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(animal)}
                            className="p-1 text-red-600"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </>
      )}

      {/* Animal Details Modal */}
      <Modal
        isOpen={showAnimalModal}
        onClose={() => setShowAnimalModal(false)}
        title="Detalhes do Animal"
        size="lg"
      >
        {selectedAnimal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Identificação
                </label>
                <p className="text-lg font-semibold">
                  {selectedAnimal.serie}{selectedAnimal.rg}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Situação
                </label>
                <Badge variant={getSituationBadge(selectedAnimal.situacao)}>
                  {selectedAnimal.situacao}
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sexo
                </label>
                <p>{selectedAnimal.sexo}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Raça
                </label>
                <p>{selectedAnimal.raca}</p>
              </div>
            </div>
            
            {selectedAnimal.pai && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Pai
                </label>
                <p>{selectedAnimal.pai}</p>
              </div>
            )}
            
            {selectedAnimal.mae && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mãe
                </label>
                <p>{selectedAnimal.mae}</p>
              </div>
            )}
            
            {selectedAnimal.observacoes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Observações
                </label>
                <p>{selectedAnimal.observacoes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Animal Form Modal */}
      <ModernAnimalForm
        isOpen={showAnimalForm}
        onClose={() => setShowAnimalForm(false)}
        animal={selectedAnimal}
        onSave={handleSaveAnimal}
        onImportAnimals={handleImportAnimals}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmar Exclusão"
      >
        {selectedAnimal && (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Tem certeza que deseja excluir o animal{' '}
              <strong>{selectedAnimal.serie}{selectedAnimal.rg}</strong>?
              Esta ação não pode ser desfeita.
            </p>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={confirmDelete}
              >
                Excluir
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
})

export default ModernAnimalList