import React, { useState, useEffect } from 'react'

export default function SimpleMedicationOccurrence() {
  const [animals] = useState([
    { id: 1, brinco: 'BR001', sexo: 'macho', idade: '12 meses', peso: 450 },
    { id: 2, brinco: 'BR002', sexo: 'femea', idade: '8 meses', peso: 380 },
    { id: 3, brinco: 'BR003', sexo: 'macho', idade: '15 meses', peso: 520 },
    { id: 4, brinco: 'BR004', sexo: 'femea', idade: '10 meses', peso: 420 },
    { id: 5, brinco: 'BR005', sexo: 'macho', idade: '6 meses', peso: 280 }
  ])

  const [medicamentos, setMedicamentos] = useState({})
  const [selectedAnimals, setSelectedAnimals] = useState([])
  const [medicationForm, setMedicationForm] = useState({
    medicamento: '',
    dataAplicacao: new Date().toISOString().split('T')[0],
    horaAplicacao: new Date().toTimeString().split(' ')[0].substring(0, 5),
    tipoAplicacao: 'individual',
    loteInfo: {
      nomeLote: '',
      quantidadeAnimais: 1
    },
    observacoes: '',
    responsavel: ''
  })
  const [showForm, setShowForm] = useState(false)
  const [occurrences, setOccurrences] = useState([])

  useEffect(() => {
    loadData()
    loadOccurrences()
  }, [])

  const loadData = () => {
    try {
      // Tentar carregar medicamentos do localStorage
      const customMedicamentos = localStorage.getItem('customMedicamentos')
      
      if (customMedicamentos) {
        setMedicamentos(JSON.parse(customMedicamentos))
      } else {
        // Dados padrÃ£o se nÃ£o houver medicamentos salvos
        const defaultMedicamentos = {
          PANACOXX: {
            nome: 'PANACOXX',
            preco: 1300,
            unidade: 'FRASCO',
            porAnimal: 9.10,
            tipoAplicacao: 'individual'
          },
          MEDICAMENTO_AGUA: {
            nome: 'Medicamento na Ã�gua',
            preco: 500,
            unidade: 'LITRO',
            porAnimal: 10,
            tipoAplicacao: 'lote',
            animaisPorLote: 50,
            custoPorLote: 500
          },
          VITAMINA_A: {
            nome: 'Vitamina A',
            preco: 200,
            unidade: 'FRASCO',
            porAnimal: 5.50,
            tipoAplicacao: 'individual'
          }
        }
        setMedicamentos(defaultMedicamentos)
      }
    } catch (error) {
      console.error('Erro ao carregar medicamentos:', error)
      // Fallback bÃ¡sico
      setMedicamentos({
        EXEMPLO: {
          nome: 'Medicamento Exemplo',
          preco: 100,
          unidade: 'FRASCO',
          porAnimal: 10,
          tipoAplicacao: 'individual'
        }
      })
    }
  }

  const loadOccurrences = () => {
    try {
      const saved = localStorage.getItem('medicationOccurrences')
      if (saved) {
        setOccurrences(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Erro ao carregar ocorrÃªncias:', error)
      setOccurrences([])
    }
  }

  const saveOccurrence = () => {
    try {
      // ValidaÃ§Ãµes
      if (!medicationForm.medicamento) {
        alert('Selecione um medicamento')
        return
      }

      if (medicationForm.tipoAplicacao === 'individual' && selectedAnimals.length === 0) {
        alert('Selecione pelo menos um animal')
        return
      }

      if (medicationForm.tipoAplicacao === 'lote' && !medicationForm.loteInfo.nomeLote) {
        alert('Informe o nome do lote')
        return
      }

      const medicineInfo = medicamentos[medicationForm.medicamento]
      if (!medicineInfo) {
        alert('Medicamento nÃ£o encontrado')
        return
      }

      // Calcular custo
      let custoTotal = 0
      if (medicationForm.tipoAplicacao === 'individual') {
        custoTotal = selectedAnimals.length * (medicineInfo.porAnimal || 0)
      } else {
        custoTotal = medicineInfo.custoPorLote || medicineInfo.preco || 0
      }

      // Criar nova ocorrÃªncia
      const newOccurrence = {
        id: Date.now(),
        medicamento: medicationForm.medicamento,
        medicamentoNome: medicineInfo.nome || medicationForm.medicamento,
        dataAplicacao: medicationForm.dataAplicacao,
        horaAplicacao: medicationForm.horaAplicacao,
        tipoAplicacao: medicationForm.tipoAplicacao,
        loteInfo: { ...medicationForm.loteInfo },
        observacoes: medicationForm.observacoes,
        responsavel: medicationForm.responsavel,
        animais: medicationForm.tipoAplicacao === 'individual' ? [...selectedAnimals] : [],
        custoTotal,
        custoUnitario: medicineInfo.porAnimal || 0,
        dataRegistro: new Date().toISOString()
      }

      // Salvar
      const updatedOccurrences = [...occurrences, newOccurrence]
      setOccurrences(updatedOccurrences)
      localStorage.setItem('medicationOccurrences', JSON.stringify(updatedOccurrences))

      // Reset form
      setMedicationForm({
        medicamento: '',
        dataAplicacao: new Date().toISOString().split('T')[0],
        horaAplicacao: new Date().toTimeString().split(' ')[0].substring(0, 5),
        tipoAplicacao: 'individual',
        loteInfo: { nomeLote: '', quantidadeAnimais: 1 },
        observacoes: '',
        responsavel: ''
      })
      setSelectedAnimals([])
      setShowForm(false)
      
      alert('MedicaÃ§Ã£o registrada com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('Erro ao registrar medicaÃ§Ã£o. Tente novamente.')
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
    setSelectedAnimals([...animals])
  }

  const clearSelection = () => {
    setSelectedAnimals([])
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">ðÅ¸â€™â€° LanÃ§amento de MedicaÃ§Ã£o</h1>
        <p className="text-green-100">Registre as ocorrÃªncias de medicaÃ§Ã£o aplicadas nos animais</p>
      </div>

      {/* BotÃ£o Nova MedicaÃ§Ã£o */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          ðÅ¸â€œâ€¹ OcorrÃªncias de MedicaÃ§Ã£o
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <span>âÅ¾â€¢</span>
          <span>Nova MedicaÃ§Ã£o</span>
        </button>
      </div>

      {/* Lista de OcorrÃªncias */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        {occurrences.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">ðÅ¸§ª</div>
            <p className="text-gray-500 dark:text-gray-400">Nenhuma medicaÃ§Ã£o registrada ainda</p>
          </div>
        ) : (
          <div className="space-y-4">
            {occurrences.map((occurrence) => (
              <div key={occurrence.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {occurrence.medicamentoNome || occurrence.medicamento.replace(/_/g, ' ')}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <span>ðÅ¸â€œâ€¦ {occurrence.dataAplicacao}</span>
                      <span>ðÅ¸â€¢� {occurrence.horaAplicacao}</span>
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
                
                {occurrence.tipoAplicacao === 'individual' && occurrence.animais && occurrence.animais.length > 0 && (
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
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">ObservaÃ§Ãµes:</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{occurrence.observacoes}</p>
                  </div>
                )}

                {occurrence.responsavel && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    ResponsÃ¡vel: {occurrence.responsavel}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal do FormulÃ¡rio */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Nova MedicaÃ§Ã£o
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
                >
                  â�Å’
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* FormulÃ¡rio */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ðÅ¸â€™Å  Medicamento *
                    </label>
                    <select
                      value={medicationForm.medicamento}
                      onChange={(e) => setMedicationForm({...medicationForm, medicamento: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Selecione um medicamento</option>
                      {Object.entries(medicamentos).map(([key, med]) => (
                        <option key={key} value={key}>
                          {med.nome || key.replace(/_/g, ' ')} - R$ {(med.porAnimal || 0).toFixed(2)}
                          {med.tipoAplicacao === 'lote' ? ` (Lote: ${med.animaisPorLote || 1} animais)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ðÅ¸Å½¯ Tipo de AplicaÃ§Ã£o
                    </label>
                    <select
                      value={medicationForm.tipoAplicacao}
                      onChange={(e) => setMedicationForm({...medicationForm, tipoAplicacao: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="individual">ðÅ¸�â€ž Individual (por animal)</option>
                      <option value="lote">ðÅ¸â€œ¦ Em Lote (grupo)</option>
                    </select>
                  </div>

                  {medicationForm.tipoAplicacao === 'lote' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          ðÅ¸â€œ¦ Nome do Lote
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
                          ðÅ¸â€œÅ  Qtd Animais
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={medicationForm.loteInfo.quantidadeAnimais}
                          onChange={(e) => setMedicationForm({
                            ...medicationForm,
                            loteInfo: {...medicationForm.loteInfo, quantidadeAnimais: parseInt(e.target.value) || 1}
                          })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ðÅ¸â€œâ€¦ Data da AplicaÃ§Ã£o
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
                        ðÅ¸â€¢� Hora da AplicaÃ§Ã£o
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
                      ðÅ¸â€˜¤ ResponsÃ¡vel
                    </label>
                    <input
                      type="text"
                      value={medicationForm.responsavel}
                      onChange={(e) => setMedicationForm({...medicationForm, responsavel: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="Nome do responsÃ¡vel"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ðÅ¸â€œ� ObservaÃ§Ãµes
                    </label>
                    <textarea
                      value={medicationForm.observacoes}
                      onChange={(e) => setMedicationForm({...medicationForm, observacoes: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="ObservaÃ§Ãµes sobre a aplicaÃ§Ã£o..."
                    />
                  </div>
                </div>

                {/* SeleÃ§Ã£o de animais */}
                {medicationForm.tipoAplicacao === 'individual' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        ðÅ¸�â€ž Selecionar Animais ({selectedAnimals.length} selecionados)
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
                                {animal.sexo} ââ‚¬¢ {animal.idade} ââ‚¬¢ {animal.peso}kg
                              </div>
                            </div>
                            {selectedAnimals.find(a => a.id === animal.id) && (
                              <span className="text-green-600 text-xl">âÅ“â€¦</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Resumo do custo */}
              {medicationForm.medicamento && medicamentos[medicationForm.medicamento] && (
                <div className="mt-6 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">ðÅ¸â€™° Resumo do Custo:</h4>
                  {medicationForm.tipoAplicacao === 'individual' ? (
                    <div className="text-sm text-green-700 dark:text-green-300">
                      <p>Custo por animal: R$ {(medicamentos[medicationForm.medicamento].porAnimal || 0).toFixed(2)}</p>
                      <p>Animais selecionados: {selectedAnimals.length}</p>
                      <p className="font-bold">Total: R$ {(selectedAnimals.length * (medicamentos[medicationForm.medicamento].porAnimal || 0)).toFixed(2)}</p>
                    </div>
                  ) : (
                    <div className="text-sm text-green-700 dark:text-green-300">
                      <p>Custo do lote: R$ {(medicamentos[medicationForm.medicamento].custoPorLote || medicamentos[medicationForm.medicamento].preco || 0).toFixed(2)}</p>
                      <p>Animais no lote: {medicationForm.loteInfo.quantidadeAnimais}</p>
                      <p className="font-bold">Custo por animal: R$ {(((medicamentos[medicationForm.medicamento].custoPorLote || medicamentos[medicationForm.medicamento].preco || 0) / medicationForm.loteInfo.quantidadeAnimais)).toFixed(2)}</p>
                    </div>
                  )}
                </div>
              )}

              {/* BotÃµes */}
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={saveOccurrence}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Registrar MedicaÃ§Ã£o
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