import React, { useState, useEffect } from 'react'
import { 
  PlusIcon, 
  CalendarIcon, 
  ClockIcon,
  CheckIcon,
  XMarkIcon,
  DocumentTextIcon,
  BeakerIcon
} from './ui/Icons'

export default function MedicationOccurrence() {
  const [animals, setAnimals] = useState([])
  const [protocolos, setProtocolos] = useState(null)
  const [medicamentos, setMedicamentos] = useState(null)
  const [selectedAnimals, setSelectedAnimals] = useState([])
  const [medicationForm, setMedicationForm] = useState({
    medicamento: '',
    protocolo: '',
    dataAplicacao: new Date().toISOString().split('T')[0],
    horaAplicacao: new Date().toTimeString().split(' ')[0].substring(0, 5),
    tipoAplicacao: 'individual', // 'individual' ou 'lote'
    loteInfo: {
      nomeLote: '',
      quantidadeAnimais: 1
    },
    observacoes: '',
    responsavel: '',
    custo: 0
  })
  const [showForm, setShowForm] = useState(false)
  const [occurrences, setOccurrences] = useState([])

  useEffect(() => {
    loadData()
    loadOccurrences()
  }, [])

  const loadData = async () => {
    try {
      // Carregar protocolos e medicamentos
      const customProtocolos = localStorage.getItem('customProtocolos')
      const customMedicamentos = localStorage.getItem('customMedicamentos')
      
      if (customProtocolos && customMedicamentos) {
        setProtocolos(JSON.parse(customProtocolos))
        setMedicamentos(JSON.parse(customMedicamentos))
      } else {
        // Fallback com dados básicos se não conseguir carregar
        try {
          const { default: costManager } = await import('../services/costManager')
          setProtocolos(costManager.protocolos || {})
          setMedicamentos(costManager.medicamentos || {})
        } catch (importError) {
          console.warn('Não foi possível carregar costManager, usando dados padrão:', importError)
          // Dados padrão básicos
          setProtocolos({
            machos: {},
            femeas: {}
          })
          setMedicamentos({
            EXEMPLO_MEDICAMENTO: {
              nome: 'Medicamento Exemplo',
              preco: 100,
              unidade: 'FRASCO',
              porAnimal: 10,
              tipoAplicacao: 'individual'
            }
          })
        }
      }

      // Simular lista de animais (você pode integrar com sua API)
      const mockAnimals = [
        { id: 1, brinco: 'BR001', sexo: 'macho', idade: '12 meses', peso: 450 },
        { id: 2, brinco: 'BR002', sexo: 'femea', idade: '8 meses', peso: 380 },
        { id: 3, brinco: 'BR003', sexo: 'macho', idade: '15 meses', peso: 520 },
        { id: 4, brinco: 'BR004', sexo: 'femea', idade: '10 meses', peso: 420 },
        { id: 5, brinco: 'BR005', sexo: 'macho', idade: '6 meses', peso: 280 }
      ]
      setAnimals(mockAnimals)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      // Garantir que sempre temos dados básicos
      setProtocolos({
        machos: {},
        femeas: {}
      })
      setMedicamentos({
        EXEMPLO_MEDICAMENTO: {
          nome: 'Medicamento Exemplo',
          preco: 100,
          unidade: 'FRASCO',
          porAnimal: 10,
          tipoAplicacao: 'individual'
        }
      })
      setAnimals([
        { id: 1, brinco: 'BR001', sexo: 'macho', idade: '12 meses', peso: 450 },
        { id: 2, brinco: 'BR002', sexo: 'femea', idade: '8 meses', peso: 380 }
      ])
    }
  }

  const loadOccurrences = () => {
    try {
      const saved = localStorage.getItem('medicationOccurrences')
      if (saved) {
        setOccurrences(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Erro ao carregar ocorrências:', error)
      setOccurrences([])
    }
  }

  const saveOccurrence = () => {
    try {
      if (!medicationForm.medicamento) {
        alert('Selecione um medicamento')
        return
      }

      if (medicationForm.tipoAplicacao === 'individual' && selectedAnimals.length === 0) {
        alert('Selecione pelo menos um animal para medicação individual')
        return
      }

      if (medicationForm.tipoAplicacao === 'lote' && !medicationForm.loteInfo.nomeLote) {
        alert('Informe o nome do lote')
        return
      }

      const medicineInfo = medicamentos[medicationForm.medicamento]
      if (!medicineInfo) {
        alert('Medicamento não encontrado')
        return
      }

      let custoTotal = 0

      if (medicationForm.tipoAplicacao === 'individual') {
        custoTotal = selectedAnimals.length * (medicineInfo.porAnimal || 0)
      } else {
        custoTotal = medicineInfo.custoPorLote || medicineInfo.preco || 0
      }

      const newOccurrence = {
        id: Date.now(),
        medicamento: medicationForm.medicamento,
        protocolo: medicationForm.protocolo,
        dataAplicacao: medicationForm.dataAplicacao,
        horaAplicacao: medicationForm.horaAplicacao,
        tipoAplicacao: medicationForm.tipoAplicacao,
        loteInfo: medicationForm.loteInfo,
        observacoes: medicationForm.observacoes,
        responsavel: medicationForm.responsavel,
        animais: medicationForm.tipoAplicacao === 'individual' ? [...selectedAnimals] : [],
        custoTotal,
        custoUnitario: medicineInfo.porAnimal || 0,
        dataRegistro: new Date().toISOString()
      }

      const updatedOccurrences = [...occurrences, newOccurrence]
      setOccurrences(updatedOccurrences)
      localStorage.setItem('medicationOccurrences', JSON.stringify(updatedOccurrences))

      // Reset form
      setMedicationForm({
        medicamento: '',
        protocolo: '',
        dataAplicacao: new Date().toISOString().split('T')[0],
        horaAplicacao: new Date().toTimeString().split(' ')[0].substring(0, 5),
        tipoAplicacao: 'individual',
        loteInfo: { nomeLote: '', quantidadeAnimais: 1 },
        observacoes: '',
        responsavel: '',
        custo: 0
      })
      setSelectedAnimals([])
      setShowForm(false)
      
      alert('Ocorrência registrada com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar ocorrência:', error)
      alert('Erro ao registrar medicação. Tente novamente.')
    }
  }

  const toggleAnimalSelection = (animal) => {
    setSelectedAnimals(prev => {
      const isSelected = prev.find(a => a.id === animal.id)
      if (isSelected) {
        return prev.filter(a => a.id !== animal.id)
      } else {
        return [...prev, animal]
      }
    })
  }

  const selectAllAnimals = () => {
    setSelectedAnimals(animals)
  }

  const clearSelection = () => {
    setSelectedAnimals([])
  }

  if (!protocolos || !medicamentos) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⚙️</div>
          <p className="text-gray-600 dark:text-gray-400">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">💉 Lançamento de Medicação</h1>
        <p className="text-green-100">Registre as ocorrências de medicação aplicadas nos animais</p>
      </div>

      {/* Botão para nova ocorrência */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          📋 Ocorrências de Medicação
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Nova Medicação</span>
        </button>
      </div>

      {/* Lista de ocorrências */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        {occurrences.length === 0 ? (
          <div className="text-center py-8">
            <BeakerIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Nenhuma medicação registrada ainda</p>
          </div>
        ) : (
          <div className="space-y-4">
            {occurrences.map((occurrence) => (
              <div key={occurrence.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {occurrence.medicamento.replace(/_/g, ' ')}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <span className="flex items-center space-x-1">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{occurrence.dataAplicacao}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <ClockIcon className="h-4 w-4" />
                        <span>{occurrence.horaAplicacao}</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      R$ {occurrence.custoTotal.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {occurrence.tipoAplicacao === 'individual' 
                        ? `${occurrence.animais.length} animais`
                        : `Lote: ${occurrence.loteInfo.nomeLote}`
                      }
                    </div>
                  </div>
                </div>
                
                {occurrence.tipoAplicacao === 'individual' && occurrence.animais.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Animais medicados:</p>
                    <div className="flex flex-wrap gap-2">
                      {occurrence.animais.map((animal) => (
                        <span key={animal.id} className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs">
                          {animal.brinco}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {occurrence.observacoes && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Observações:</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{occurrence.observacoes}</p>
                  </div>
                )}

                {occurrence.responsavel && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Responsável: {occurrence.responsavel}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal do formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Nova Medicação
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Formulário */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      💊 Medicamento *
                    </label>
                    <select
                      value={medicationForm.medicamento}
                      onChange={(e) => setMedicationForm({...medicationForm, medicamento: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Selecione um medicamento</option>
                      {Object.entries(medicamentos || {}).map(([key, med]) => (
                        <option key={key} value={key}>
                          {med?.nome || key.replace(/_/g, ' ')} - R$ {med?.porAnimal?.toFixed(2) || '0.00'}
                          {med?.tipoAplicacao === 'lote' ? ` (Lote: ${med?.animaisPorLote || 1} animais)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      🎯 Tipo de Aplicação
                    </label>
                    <select
                      value={medicationForm.tipoAplicacao}
                      onChange={(e) => setMedicationForm({...medicationForm, tipoAplicacao: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="individual">🐄 Individual (por animal)</option>
                      <option value="lote">📦 Em Lote (grupo)</option>
                    </select>
                  </div>

                  {medicationForm.tipoAplicacao === 'lote' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          📦 Nome do Lote
                        </label>
                        <input
                          type="text"
                          value={medicationForm.loteInfo.nomeLote}
                          onChange={(e) => setMedicationForm({
                            ...medicationForm,
                            loteInfo: {...medicationForm.loteInfo, nomeLote: e.target.value}
                          })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          placeholder="Ex: Lote A, Pasto 1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          📊 Qtd Animais
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={medicationForm.loteInfo.quantidadeAnimais}
                          onChange={(e) => setMedicationForm({
                            ...medicationForm,
                            loteInfo: {...medicationForm.loteInfo, quantidadeAnimais: parseInt(e.target.value)}
                          })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        📅 Data da Aplicação
                      </label>
                      <input
                        type="date"
                        value={medicationForm.dataAplicacao}
                        onChange={(e) => setMedicationForm({...medicationForm, dataAplicacao: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        🕐 Hora da Aplicação
                      </label>
                      <input
                        type="time"
                        value={medicationForm.horaAplicacao}
                        onChange={(e) => setMedicationForm({...medicationForm, horaAplicacao: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      👤 Responsável
                    </label>
                    <input
                      type="text"
                      value={medicationForm.responsavel}
                      onChange={(e) => setMedicationForm({...medicationForm, responsavel: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="Nome do responsável pela aplicação"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      📝 Observações
                    </label>
                    <textarea
                      value={medicationForm.observacoes}
                      onChange={(e) => setMedicationForm({...medicationForm, observacoes: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="Observações sobre a aplicação..."
                    />
                  </div>
                </div>

                {/* Seleção de animais (apenas para aplicação individual) */}
                {medicationForm.tipoAplicacao === 'individual' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        🐄 Selecionar Animais ({selectedAnimals.length} selecionados)
                      </h4>
                      <div className="space-x-2">
                        <button
                          onClick={selectAllAnimals}
                          className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                        >
                          Todos
                        </button>
                        <button
                          onClick={clearSelection}
                          className="text-sm bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded"
                        >
                          Limpar
                        </button>
                      </div>
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                      {animals.map((animal) => (
                        <div
                          key={animal.id}
                          onClick={() => toggleAnimalSelection(animal)}
                          className={`p-3 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                            selectedAnimals.find(a => a.id === animal.id) 
                              ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-l-green-500' 
                              : ''
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {animal.brinco}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {animal.sexo} • {animal.idade} • {animal.peso}kg
                              </div>
                            </div>
                            {selectedAnimals.find(a => a.id === animal.id) && (
                              <CheckIcon className="h-5 w-5 text-green-600" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Resumo do custo */}
              {medicationForm.medicamento && medicamentos && medicamentos[medicationForm.medicamento] && (
                <div className="mt-6 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">💰 Resumo do Custo:</h4>
                  {medicationForm.tipoAplicacao === 'individual' ? (
                    <div className="text-sm text-green-700 dark:text-green-300">
                      <p>Custo por animal: R$ {(medicamentos[medicationForm.medicamento]?.porAnimal || 0).toFixed(2)}</p>
                      <p>Animais selecionados: {selectedAnimals.length}</p>
                      <p className="font-bold">Total: R$ {(selectedAnimals.length * (medicamentos[medicationForm.medicamento]?.porAnimal || 0)).toFixed(2)}</p>
                    </div>
                  ) : (
                    <div className="text-sm text-green-700 dark:text-green-300">
                      <p>Custo do lote: R$ {(medicamentos[medicationForm.medicamento]?.custoPorLote || medicamentos[medicationForm.medicamento]?.preco || 0).toFixed(2)}</p>
                      <p>Animais no lote: {medicationForm.loteInfo.quantidadeAnimais || 1}</p>
                      <p className="font-bold">Custo por animal: R$ {(((medicamentos[medicationForm.medicamento]?.custoPorLote || medicamentos[medicationForm.medicamento]?.preco || 0) / (medicationForm.loteInfo.quantidadeAnimais || 1))).toFixed(2)}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Botões */}
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={saveOccurrence}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Registrar Medicação
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}