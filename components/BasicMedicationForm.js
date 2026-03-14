import React, { useState } from 'react'

export default function BasicMedicationForm() {
  const [showForm, setShowForm] = useState(false)
  const [occurrences, setOccurrences] = useState([])
  const [formData, setFormData] = useState({
    medicamento: '',
    animal: '',
    data: new Date().toISOString().split('T')[0],
    hora: new Date().toTimeString().split(' ')[0].substring(0, 5),
    responsavel: '',
    observacoes: '',
    custo: ''
  })

  // Dados básicos fixos
  const medicamentos = [
    { id: 'panacoxx', nome: 'PANACOXX', custo: 9.10 },
    { id: 'vitamina', nome: 'Vitamina A', custo: 5.50 },
    { id: 'antibiotico', nome: 'Antibiótico', custo: 12.00 }
  ]

  const animais = [
    { id: 'br001', brinco: 'BR001', sexo: 'Macho' },
    { id: 'br002', brinco: 'BR002', sexo: 'Fêmea' },
    { id: 'br003', brinco: 'BR003', sexo: 'Macho' },
    { id: 'br004', brinco: 'BR004', sexo: 'Fêmea' }
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.medicamento || !formData.animal) {
      alert('Preencha medicamento e animal')
      return
    }

    const medicamento = medicamentos.find(m => m.id === formData.medicamento)
    const animal = animais.find(a => a.id === formData.animal)

    const newOccurrence = {
      id: Date.now(),
      medicamentoNome: medicamento.nome,
      animalBrinco: animal.brinco,
      data: formData.data,
      hora: formData.hora,
      responsavel: formData.responsavel,
      observacoes: formData.observacoes,
      custo: formData.custo || medicamento.custo,
      timestamp: new Date().toISOString()
    }

    const updated = [...occurrences, newOccurrence]
    setOccurrences(updated)
    
    // Salvar no localStorage
    try {
      localStorage.setItem('basicMedicationOccurrences', JSON.stringify(updated))
    } catch (error) {
      console.log('Erro ao salvar:', error)
    }

    // Reset form
    setFormData({
      medicamento: '',
      animal: '',
      data: new Date().toISOString().split('T')[0],
      hora: new Date().toTimeString().split(' ')[0].substring(0, 5),
      responsavel: '',
      observacoes: '',
      custo: ''
    })
    setShowForm(false)
    alert('Medicação registrada!')
  }

  // Carregar dados salvos
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('basicMedicationOccurrences')
      if (saved) {
        setOccurrences(JSON.parse(saved))
      }
    } catch (error) {
      console.log('Erro ao carregar:', error)
    }
  }, [])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6 rounded-lg mb-6">
        <h1 className="text-2xl font-bold">💉 Registro de Medicação</h1>
        <p>Sistema básico para registrar medicações aplicadas</p>
      </div>

      {/* Botão Nova Medicação */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">📋 Ocorrências Registradas</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          ➕ Nova Medicação
        </button>
      </div>

      {/* Lista de Ocorrências */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        {occurrences.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🧪</div>
            <p>Nenhuma medicação registrada ainda</p>
          </div>
        ) : (
          <div className="space-y-3">
            {occurrences.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded p-3 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.medicamentoNome}</h3>
                    <p className="text-sm text-gray-600">
                      Animal: {item.animalBrinco} | Data: {item.data} | Hora: {item.hora}
                    </p>
                    {item.responsavel && (
                      <p className="text-sm text-gray-600">Responsável: {item.responsavel}</p>
                    )}
                    {item.observacoes && (
                      <p className="text-sm text-gray-600">Obs: {item.observacoes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      R$ {Number(item.custo).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal do Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Nova Medicação</h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ❌
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">💊 Medicamento *</label>
                <select
                  value={formData.medicamento}
                  onChange={(e) => setFormData({...formData, medicamento: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Selecione...</option>
                  {medicamentos.map(med => (
                    <option key={med.id} value={med.id}>
                      {med.nome} - R$ {med.custo.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">🐄 Animal *</label>
                <select
                  value={formData.animal}
                  onChange={(e) => setFormData({...formData, animal: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Selecione...</option>
                  {animais.map(animal => (
                    <option key={animal.id} value={animal.id}>
                      {animal.brinco} - {animal.sexo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">📅 Data</label>
                  <input
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({...formData, data: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">🕐 Hora</label>
                  <input
                    type="time"
                    value={formData.hora}
                    onChange={(e) => setFormData({...formData, hora: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">💰 Custo (opcional)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.custo}
                  onChange={(e) => setFormData({...formData, custo: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Deixe vazio para usar custo padrão"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">👤 Responsável</label>
                <input
                  type="text"
                  value={formData.responsavel}
                  onChange={(e) => setFormData({...formData, responsavel: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nome do responsável"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">📝 Observações</label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Observações sobre a aplicação..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 font-medium"
                >
                  Registrar
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 font-medium"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}