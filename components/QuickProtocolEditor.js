
import React, { useEffect, useState } from 'react'

import { PencilIcon, PlusIcon, SaveIcon } from './ui/Icons'
import EditableMedicineItem from './EditableMedicineItem'

export default function QuickProtocolEditor() {
  const [protocolos, setProtocolos] = useState(null)
  const [medicamentos, setMedicamentos] = useState(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Tentar carregar dados customizados primeiro
      const customProtocolos = localStorage.getItem('customProtocolos')
      const customMedicamentos = localStorage.getItem('customMedicamentos')
      
      if (customProtocolos && customMedicamentos) {
        setProtocolos(JSON.parse(customProtocolos))
        setMedicamentos(JSON.parse(customMedicamentos))
      } else {
        // Carregar dados padrão do costManager
        const { default: costManager } = await import('../services/costManager')
        setProtocolos(costManager.protocolos)
        setMedicamentos(costManager.medicamentos)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  const updateMedicineInProtocol = (sexo, era, medicineIndex, updatedMedicine) => {
    const newProtocolos = { ...protocolos }
    newProtocolos[sexo][era].medicamentos[medicineIndex] = updatedMedicine
    setProtocolos(newProtocolos)
    localStorage.setItem('customProtocolos', JSON.stringify(newProtocolos))
  }

  const addMedicineToProtocol = (sexo, era) => {
    const newMedicine = {
      nome: 'NOVO MEDICAMENTO',
      quantidade: 1,
      unidade: 'ML'
    }
    
    const newProtocolos = { ...protocolos }
    newProtocolos[sexo][era].medicamentos.push(newMedicine)
    setProtocolos(newProtocolos)
    localStorage.setItem('customProtocolos', JSON.stringify(newProtocolos))
  }

  const removeMedicineFromProtocol = (sexo, era, medicineIndex) => {
    const newProtocolos = { ...protocolos }
    newProtocolos[sexo][era].medicamentos.splice(medicineIndex, 1)
    setProtocolos(newProtocolos)
    localStorage.setItem('customProtocolos', JSON.stringify(newProtocolos))
  }

  if (!protocolos || !medicamentos) {
    return null
  }

  return (
    <>
      {/* Botão Flutuante */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg z-40 transition-all duration-300 transform hover:scale-110"
        title="Editor Rápido de Protocolos"
      >
        <PencilIcon className="h-6 w-6" />
      </button>

      {/* Modal de Edição Rápida */}
      {isVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">⚡ Editor Rápido de Protocolos</h2>
                <button
                  onClick={() => setIsVisible(false)}
                  className="bg-white/20 hover:bg-white/30 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold transition-colors"
                >
                  ×
                </button>
              </div>
              <p className="text-blue-100 mt-3 text-lg">🖱️ Clique em qualquer medicamento para editar nome, quantidade e preço</p>
            </div>

            {/* Conteúdo */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Protocolos Machos */}
                <div>
                  <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4 flex items-center">
                    🐂 Protocolos para Machos
                  </h3>
                  
                  <div className="space-y-4">
                    {Object.entries(protocolos.machos).map(([era, protocolo]) => (
                      <div key={era} className="border-2 border-blue-300 dark:border-blue-600 rounded-xl p-5 bg-blue-50 dark:bg-blue-900/30 shadow-md">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-bold text-blue-900 dark:text-blue-100 text-lg">
                            🐂 {protocolo.nome}
                          </h4>
                          <button
                            onClick={() => addMedicineToProtocol('machos', era)}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors shadow-md"
                            title="Adicionar medicamento"
                          >
                            <PlusIcon className="h-5 w-5" />
                          </button>
                        </div>
                        
                        <div className="space-y-2">
                          {protocolo.medicamentos.map((med, idx) => (
                            <EditableMedicineItem
                              key={idx}
                              medicine={med}
                              medicamentos={medicamentos}
                              showDelete={true}
                              onUpdate={(updatedMedicine) => updateMedicineInProtocol('machos', era, idx, updatedMedicine)}
                              onDelete={() => removeMedicineFromProtocol('machos', era, idx)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Protocolos Fêmeas */}
                <div>
                  <h3 className="text-xl font-bold text-pink-600 dark:text-pink-400 mb-4 flex items-center">
                    🐄 Protocolos para Fêmeas
                  </h3>
                  
                  <div className="space-y-4">
                    {Object.entries(protocolos.femeas).map(([era, protocolo]) => (
                      <div key={era} className="border-2 border-pink-300 dark:border-pink-600 rounded-xl p-5 bg-pink-50 dark:bg-pink-900/30 shadow-md">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-bold text-pink-900 dark:text-pink-100 text-lg">
                            🐄 {protocolo.nome}
                          </h4>
                          <button
                            onClick={() => addMedicineToProtocol('femeas', era)}
                            className="bg-pink-600 hover:bg-pink-700 text-white p-2 rounded-lg transition-colors shadow-md"
                            title="Adicionar medicamento"
                          >
                            <PlusIcon className="h-5 w-5" />
                          </button>
                        </div>
                        
                        <div className="space-y-2">
                          {protocolo.medicamentos.map((med, idx) => (
                            <EditableMedicineItem
                              key={idx}
                              medicine={med}
                              medicamentos={medicamentos}
                              showDelete={true}
                              onUpdate={(updatedMedicine) => updateMedicineInProtocol('femeas', era, idx, updatedMedicine)}
                              onDelete={() => removeMedicineFromProtocol('femeas', era, idx)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-100 dark:bg-gray-800 p-6 flex items-center justify-between border-t-2 border-gray-200 dark:border-gray-600">
              <div className="text-base text-gray-800 dark:text-gray-200 font-medium">
                💡 Dica: Clique nos botões azuis/rosa para editar os medicamentos
              </div>
              <button
                onClick={() => {
                  setIsVisible(false)
                  alert('✅ Alterações salvas automaticamente!')
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 font-semibold text-lg shadow-lg transition-colors"
              >
                <SaveIcon className="h-5 w-5" />
                <span>✅ Concluir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}