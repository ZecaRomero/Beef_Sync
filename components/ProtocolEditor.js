
import React, { useEffect, useState } from 'react'

import {
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  DocumentTextIcon
} from './ui/Icons'
import EditableMedicineItem from './EditableMedicineItem'
import ModernLayout from './ui/ModernLayout'
import ModernCard, { ModernCardHeader, ModernCardBody } from './ui/ModernCard'
import Button from './ui/Button'

export default function ProtocolEditor() {
  const [protocolos, setProtocolos] = useState(null)
  const [medicamentos, setMedicamentos] = useState(null)
  const [highContrast, setHighContrast] = useState(false)
  const [largeText, setLargeText] = useState(false)
  const [editingProtocol, setEditingProtocol] = useState(null)
  const [editingMedicine, setEditingMedicine] = useState(null)
  const [showAddMedicine, setShowAddMedicine] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [newMedicine, setNewMedicine] = useState({
    nome: '',
    preco: '',
    unidade: '',
    quantidadeTotal: '',
    quantidadePorAnimal: '',
    porAnimal: '',
    tipoAplicacao: 'individual', // 'individual' ou 'lote'
    animaisPorLote: 1,
    custoPorLote: ''
  })

  useEffect(() => {
    loadData()
    syncExistingMedicines()
  }, [])

  const syncExistingMedicines = async (force = false) => {
    // Sincronizar medicamentos jÃ¡ cadastrados no histÃ³rico
    try {
      const customMedicamentos = localStorage.getItem('customMedicamentos')
      if (customMedicamentos) {
        const medicamentos = JSON.parse(customMedicamentos)
        const syncStatus = localStorage.getItem('medicinesSynced') === 'true'
        
        if ((!syncStatus || force) && Object.keys(medicamentos).length > 0) {
          setSyncing(true)
          console.log('ðÅ¸â€�â€ž Sincronizando medicamentos existentes no histÃ³rico...')
          
          let successCount = 0
          
          for (const [key, medicine] of Object.entries(medicamentos)) {
            try {
              const response = await fetch('/api/lotes', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  tipo_operacao: 'CADASTRO_MEDICAMENTO',
                  modulo: 'MEDICAMENTOS',
                  descricao: `Medicamento cadastrado: ${medicine.nome || key}`,
                  quantidade_registros: 1,
                  usuario: 'sistema',
                  detalhes: {
                    nome: medicine.nome || key,
                    preco: medicine.preco,
                    unidade: medicine.unidade,
                    tipoAplicacao: medicine.tipoAplicacao,
                    porAnimal: medicine.porAnimal,
                    key: key
                  }
                })
              })

              if (response.ok) {
                console.log(`âÅ“â€¦ ${key} sincronizado com sucesso`)
                successCount++
              } else {
                console.error(`â�Å’ Erro ao sincronizar ${key}:`, await response.text())
              }
            } catch (error) {
              console.error(`â�Å’ Erro ao sincronizar ${key}:`, error)
            }
          }
          
          localStorage.setItem('medicinesSynced', 'true')
          console.log('âÅ“â€¦ SincronizaÃ§Ã£o concluÃ­da!')
          setSyncing(false)
          
          if (successCount > 0) {
            alert(`âÅ“â€¦ ${successCount} medicamento(s) foram registrados no histÃ³rico de lanÃ§amentos!`)
          } else {
            alert('âÅ¡ ï¸� Nenhum medicamento foi registrado. Verifique o console para mais detalhes.')
          }
        }
      }
    } catch (error) {
      console.error('Erro ao sincronizar medicamentos:', error)
      setSyncing(false)
      alert('â�Å’ Erro ao sincronizar medicamentos. Verifique o console.')
    }
  }

  const loadData = async () => {
    try {
      // Tentar carregar dados customizados primeiro
      const customProtocolos = localStorage.getItem('customProtocolos')
      const customMedicamentos = localStorage.getItem('customMedicamentos')

      if (customProtocolos && customMedicamentos) {
        setProtocolos(JSON.parse(customProtocolos))
        setMedicamentos(JSON.parse(customMedicamentos))
      } else {
        // Carregar dados padrÃ£o do costManager
        const costManagerModule = await import('../services/costManager')
        const costManager = costManagerModule.default || costManagerModule
        setProtocolos(costManager.protocolos)

        // Adicionar campo nome aos medicamentos se nÃ£o existir e filtrar itens indesejados
        const medicamentosComNome = {}
        const blacklist = ['SUPLENUT', 'RACAO', 'ALIMENTACAO', 'NUTRICAO']
        
        Object.entries(costManager.medicamentos).forEach(([key, medicine]) => {
          if (!blacklist.some(term => key.toUpperCase().includes(term))) {
            medicamentosComNome[key] = {
              ...medicine,
              nome: medicine.nome || key.replace(/_/g, ' ')
            }
          }
        })
        setMedicamentos(medicamentosComNome)

        // Salvar os dados iniciais com nomes no localStorage para futuras ediÃ§Ãµes
        localStorage.setItem('customMedicamentos', JSON.stringify(medicamentosComNome))
        localStorage.setItem('customProtocolos', JSON.stringify(costManager.protocolos))
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      // Fallback com dados bÃ¡sicos
      setProtocolos({
        machos: {},
        femeas: {}
      })
      setMedicamentos({})
    }
  }

  const saveProtocol = (sexo, era, updatedProtocol) => {
    const newProtocolos = { ...protocolos }
    newProtocolos[sexo][era] = updatedProtocol
    setProtocolos(newProtocolos)

    // Salvar no localStorage
    localStorage.setItem('customProtocolos', JSON.stringify(newProtocolos))
    setEditingProtocol(null)
  }

  const saveMedicine = (medicineKey, updatedMedicine) => {
    const newMedicamentos = { ...medicamentos }
    newMedicamentos[medicineKey] = updatedMedicine
    setMedicamentos(newMedicamentos)

    // Salvar no localStorage
    localStorage.setItem('customMedicamentos', JSON.stringify(newMedicamentos))
    setEditingMedicine(null)
  }

  const addNewMedicine = async () => {
    if (!newMedicine.nome || !newMedicine.preco) {
      alert('Nome e preÃ§o sÃ£o obrigatÃ³rios')
      return
    }

    const medicineKey = newMedicine.nome.toUpperCase().replace(/\s+/g, '_')
    const newMedicamentos = { ...medicamentos }

    // Calcular custo por animal baseado no tipo de aplicaÃ§Ã£o
    let custoPorAnimal
    if (newMedicine.tipoAplicacao === 'lote') {
      const custoPorLote = parseFloat(newMedicine.custoPorLote) || parseFloat(newMedicine.preco)
      const animaisPorLote = parseInt(newMedicine.animaisPorLote) || 1
      custoPorAnimal = custoPorLote / animaisPorLote
    } else {
      custoPorAnimal = parseFloat(newMedicine.porAnimal) || parseFloat(newMedicine.preco)
    }

    newMedicamentos[medicineKey] = {
      preco: parseFloat(newMedicine.preco),
      unidade: newMedicine.unidade || 'UNIDADE',
      porAnimal: custoPorAnimal,
      tipoAplicacao: newMedicine.tipoAplicacao,
      animaisPorLote: newMedicine.tipoAplicacao === 'lote' ? parseInt(newMedicine.animaisPorLote) || 1 : undefined,
      custoPorLote: newMedicine.tipoAplicacao === 'lote' ? parseFloat(newMedicine.custoPorLote) || parseFloat(newMedicine.preco) : undefined
    }

    setMedicamentos(newMedicamentos)
    localStorage.setItem('customMedicamentos', JSON.stringify(newMedicamentos))

    // Registrar no histÃ³rico de lotes
    try {
      const response = await fetch('/api/lotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipo_operacao: 'CADASTRO_MEDICAMENTO',
          modulo: 'MEDICAMENTOS',
          descricao: `Medicamento cadastrado: ${newMedicine.nome}`,
          quantidade_registros: 1,
          usuario: 'sistema',
          detalhes: {
            nome: newMedicine.nome,
            preco: newMedicine.preco,
            unidade: newMedicine.unidade,
            tipoAplicacao: newMedicine.tipoAplicacao,
            porAnimal: custoPorAnimal,
            key: medicineKey
          }
        })
      })

      if (!response.ok) {
        console.error('Erro ao registrar no histÃ³rico:', await response.text())
      } else {
        console.log('âÅ“â€¦ Medicamento registrado no histÃ³rico com sucesso')
      }
    } catch (error) {
      console.error('Erro ao registrar medicamento no histÃ³rico:', error)
    }

    setNewMedicine({
      nome: '',
      preco: '',
      unidade: '',
      quantidadeTotal: '',
      quantidadePorAnimal: '',
      porAnimal: '',
      tipoAplicacao: 'individual',
      animaisPorLote: 1,
      custoPorLote: ''
    })
    setShowAddMedicine(false)
  }

  const deleteMedicine = (medicineKey) => {
    if (confirm(`Tem certeza que deseja excluir ${medicineKey}?`)) {
      const newMedicamentos = { ...medicamentos }
      delete newMedicamentos[medicineKey]
      setMedicamentos(newMedicamentos)
      localStorage.setItem('customMedicamentos', JSON.stringify(newMedicamentos))
    }
  }

  const addMedicineToProtocol = (sexo, era, medicineName) => {
    const newProtocolos = { ...protocolos }
    const newMedicine = {
      nome: medicineName,
      quantidade: 1,
      unidade: 'ML'
    }

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

  const updateMedicineInProtocol = (sexo, era, medicineIndex, updatedMedicine) => {
    const newProtocolos = { ...protocolos }
    newProtocolos[sexo][era].medicamentos[medicineIndex] = updatedMedicine
    setProtocolos(newProtocolos)
    localStorage.setItem('customProtocolos', JSON.stringify(newProtocolos))
  }

  if (!protocolos || !medicamentos) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl mx-auto flex items-center justify-center animate-pulse">
              <span className="text-4xl animate-spin">âÅ¡â„¢ï¸�</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-3xl animate-ping"></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Carregando protocolos...</h3>
            <p className="text-gray-500 dark:text-gray-400">Preparando medicamentos e configuraÃ§Ãµes</p>
          </div>
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ModernLayout
      title="Editor de Protocolos"
      subtitle="Edite medicamentos, preÃ§os e protocolos sanitÃ¡rios"
      icon="âÅ¡â„¢ï¸�"
      className={`${highContrast ? 'high-contrast' : ''} ${largeText ? 'text-[15px] md:text-base' : ''}`}
    >
      <div className="space-y-8">

        {/* ExplicaÃ§Ã£o dos tipos de medicaÃ§Ã£o */}
        <ModernCard variant="glass" modern={true}>
          <ModernCardHeader
            icon={<span className="text-2xl">ðÅ¸â€™¡</span>}
            title="Tipos de MedicaÃ§Ã£o"
            subtitle="Entenda as diferentes formas de aplicaÃ§Ã£o"
          />
          <ModernCardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white">
                    <span className="text-xl">ðÅ¸�â€ž</span>
                  </div>
                  <strong className="text-blue-800 dark:text-blue-200 text-lg">Individual</strong>
                </div>
                <p className="text-blue-700 dark:text-blue-300 leading-relaxed">
                  Cada animal recebe sua prÃ³pria dose. Ideal para medicamentos aplicados individualmente.
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center text-white">
                    <span className="text-xl">ðÅ¸â€œ¦</span>
                  </div>
                  <strong className="text-purple-800 dark:text-purple-200 text-lg">Em Lote</strong>
                </div>
                <p className="text-purple-700 dark:text-purple-300 leading-relaxed">
                  Um produto trata vÃ¡rios animais. Ideal para medicamentos na Ã¡gua ou aplicaÃ§Ã£o coletiva.
                </p>
              </div>
            </div>
          </ModernCardBody>
        </ModernCard>

        {/* SeÃ§Ã£o de Medicamentos Moderna */}
        <ModernCard variant="gradient" modern={true} hover={true}>
          <ModernCardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl text-white shadow-lg">
                  <span className="text-2xl">ðÅ¸â€™Å </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Medicamentos e PreÃ§os
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Gerencie medicamentos, custos e aplicaÃ§Ãµes
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowAddMedicine(true)}
                  variant="primary"
                  size="md"
                  modern={true}
                  glow={true}
                  leftIcon={<PlusIcon className="h-5 w-5" />}
                >
                  Novo Medicamento
                </Button>
                <Button
                  onClick={async () => {
                    if (confirm('Sincronizar medicamentos cadastrados no histÃ³rico de lanÃ§amentos?')) {
                      await syncExistingMedicines(true)
                    }
                  }}
                  disabled={syncing}
                  variant="secondary"
                  size="md"
                  modern={true}
                >
                  {syncing ? 'ðÅ¸â€�â€ž Sincronizando...' : 'ðÅ¸â€�â€ž Sincronizar HistÃ³rico'}
                </Button>
                <Button
                  onClick={() => {
                    if (confirm('Tem certeza que deseja resetar todos os dados para os valores padrÃ£o?')) {
                      localStorage.removeItem('customMedicamentos')
                      localStorage.removeItem('customProtocolos')
                      window.location.reload()
                    }
                  }}
                  variant="warning"
                  size="md"
                  modern={true}
                  leftIcon={<DocumentTextIcon className="h-5 w-5" />}
                >
                  Reset
                </Button>
              </div>
            </div>
          </ModernCardHeader>
          <ModernCardBody>

            {/* Controles de Acessibilidade Modernos */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700/50 px-4 py-2 rounded-2xl">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Acessibilidade:</span>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={highContrast} 
                    onChange={(e) => setHighContrast(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Alto contraste</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={largeText} 
                    onChange={(e) => setLargeText(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Texto maior</span>
                </label>
              </div>
            </div>

            {/* Grid de Medicamentos Moderno */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(medicamentos).map(([key, medicine], index) => (
                <div 
                  key={key} 
                  className="group relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-6 hover:shadow-2xl transition-all duration-500 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transform hover:scale-105"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
              {editingMedicine === key ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ðÅ¸â€™Å  Nome do Medicamento
                    </label>
                    <input
                      type="text"
                      value={medicine.nome || key}
                      onChange={(e) => setMedicamentos({
                        ...medicamentos,
                        [key]: { ...medicine, nome: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Ex: PANACOXX, DNA VIRGEM, RGNiveloir"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ðÅ¸â€™° PreÃ§o Total (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={medicine.preco}
                      onChange={(e) => setMedicamentos({
                        ...medicamentos,
                        [key]: { ...medicine, preco: parseFloat(e.target.value) }
                      })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Ex: 1300.00 (preÃ§o total do produto)"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ðÅ¸â€œ¦ Unidade de Medida
                    </label>
                    <input
                      type="text"
                      value={medicine.unidade}
                      onChange={(e) => setMedicamentos({
                        ...medicamentos,
                        [key]: { ...medicine, unidade: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Ex: FRASCO, LITRO, DOSE, KG"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ðÅ¸Å½¯ Tipo de AplicaÃ§Ã£o
                    </label>
                    <select
                      value={medicine.tipoAplicacao || 'individual'}
                      onChange={(e) => {
                        const tipoAplicacao = e.target.value
                        setMedicamentos({
                          ...medicamentos,
                          [key]: {
                            ...medicine,
                            tipoAplicacao,
                            animaisPorLote: tipoAplicacao === 'lote' ? (medicine.animaisPorLote || 1) : undefined,
                            custoPorLote: tipoAplicacao === 'lote' ? (medicine.custoPorLote || medicine.preco) : undefined
                          }
                        })
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="individual">ðÅ¸�â€ž Individual (por animal)</option>
                      <option value="lote">ðÅ¸â€œ¦ Em Lote (grupo de animais)</option>
                    </select>
                  </div>

                  {medicine.tipoAplicacao === 'lote' ? (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          ðÅ¸â€œÅ  Animais por Lote
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={medicine.animaisPorLote || 1}
                          onChange={(e) => {
                            const animaisPorLote = parseInt(e.target.value) || 1
                            const custoPorLote = medicine.custoPorLote || medicine.preco
                            setMedicamentos({
                              ...medicamentos,
                              [key]: {
                                ...medicine,
                                animaisPorLote,
                                porAnimal: custoPorLote / animaisPorLote
                              }
                            })
                          }}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Ex: 10 (quantos animais por lote)"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          ðÅ¸â€™° Custo por Lote (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={medicine.custoPorLote || medicine.preco}
                          onChange={(e) => {
                            const custoPorLote = parseFloat(e.target.value) || 0
                            const animaisPorLote = medicine.animaisPorLote || 1
                            setMedicamentos({
                              ...medicamentos,
                              [key]: {
                                ...medicine,
                                custoPorLote,
                                porAnimal: custoPorLote / animaisPorLote
                              }
                            })
                          }}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Ex: 91.00 (custo para tratar o lote)"
                        />
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded text-xs">
                        <span className="text-blue-800 dark:text-blue-200">
                          ðÅ¸â€™¡ Custo por animal: R$ {((medicine.custoPorLote || medicine.preco) / (medicine.animaisPorLote || 1)).toFixed(2)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        ðÅ¸�â€ž Custo por Animal (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={medicine.porAnimal}
                        onChange={(e) => setMedicamentos({
                          ...medicamentos,
                          [key]: { ...medicine, porAnimal: parseFloat(e.target.value) }
                        })}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Ex: 9.10 (custo por animal tratado)"
                      />
                    </div>
                  )}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => saveMedicine(key, medicamentos[key])}
                      className="flex-1 text-sm px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors focus:ring-2 focus:ring-green-500"
                    >
                      <CheckIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditingMedicine(null)}
                      className="flex-1 text-sm px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors focus:ring-2 focus:ring-gray-500"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                      {medicine.nome || key.replace(/_/g, ' ')}
                    </h3>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => setEditingMedicine(key)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteMedicine(key)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-gray-800 dark:text-gray-200">
                    <div className="flex items-center space-x-2">
                      <span>ðÅ¸â€™° PreÃ§o: R$ {medicine.preco?.toFixed(2)}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${medicine.tipoAplicacao === 'lote'
                        ? 'bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200'
                        : 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200'
                        }`}>
                        {medicine.tipoAplicacao === 'lote' ? 'ðÅ¸â€œ¦ Lote' : 'ðÅ¸�â€ž Individual'}
                      </span>
                    </div>
                    <div>ðÅ¸â€œ¦ Unidade: {medicine.unidade}</div>
                    {medicine.tipoAplicacao === 'lote' ? (
                      <>
                        <div>ðÅ¸â€œÅ  Animais/lote: {medicine.animaisPorLote || 1}</div>
                        <div>ðÅ¸â€™° Custo/lote: R$ {(medicine.custoPorLote || medicine.preco)?.toFixed(2)}</div>
                        <div className="font-medium text-blue-600 dark:text-blue-400">
                          ðÅ¸�â€ž Por animal: R$ {medicine.porAnimal?.toFixed(2)}
                        </div>
                      </>
                    ) : (
                      <div>ðÅ¸�â€ž Por animal: R$ {medicine.porAnimal?.toFixed(2)}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
          </ModernCardBody>
        </ModernCard>

      {/* Protocolos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Protocolos Machos */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-3">
            ðÅ¸�â€š Protocolos para Machos
          </h2>

          <div className="space-y-2">
            {Object.entries(protocolos.machos).map(([era, protocolo]) => (
              <div key={era} className="border border-blue-200 dark:border-blue-800 rounded-lg p-2 bg-blue-50 dark:bg-blue-900/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-blue-800 dark:text-blue-200 text-sm">
                    {protocolo.nome}
                  </h3>
                  <button
                    onClick={() => setEditingProtocol(`machos-${era}`)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                  >
                    <PencilIcon className="h-3 w-3" />
                  </button>
                </div>

                <div className="space-y-2">
                  {protocolo.medicamentos.map((med, idx) => (
                    <EditableMedicineItem
                      key={idx}
                      medicine={med}
                      medicamentos={medicamentos}
                      showDelete={editingProtocol === `machos-${era}`}
                      onUpdate={(updatedMedicine) => updateMedicineInProtocol('machos', era, idx, updatedMedicine)}
                      onDelete={() => removeMedicineFromProtocol('machos', era, idx)}
                    />
                  ))}

                  {editingProtocol === `machos-${era}` && (
                    <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            addMedicineToProtocol('machos', era, e.target.value)
                            e.target.value = ''
                          }
                        }}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="">Adicionar medicamento...</option>
                        {Object.keys(medicamentos).map(med => (
                          <option key={med} value={med}>{med.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => setEditingProtocol(null)}
                        className="w-full mt-2 text-sm px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors focus:ring-2 focus:ring-green-500"
                      >
                        Concluir EdiÃ§Ã£o
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Protocolos FÃªmeas */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-pink-600 dark:text-pink-400 mb-3">
            ðÅ¸�â€ž Protocolos para FÃªmeas
          </h2>

          <div className="space-y-2">
            {Object.entries(protocolos.femeas).map(([era, protocolo]) => (
              <div key={era} className="border border-pink-200 dark:border-pink-800 rounded-lg p-2 bg-pink-50 dark:bg-pink-900/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-pink-800 dark:text-pink-200 text-sm">
                    {protocolo.nome}
                  </h3>
                  <button
                    onClick={() => setEditingProtocol(`femeas-${era}`)}
                    className="text-pink-600 hover:text-pink-800 p-1"
                  >
                    <PencilIcon className="h-3 w-3" />
                  </button>
                </div>

                <div className="space-y-2">
                  {protocolo.medicamentos.map((med, idx) => (
                    <EditableMedicineItem
                      key={idx}
                      medicine={med}
                      medicamentos={medicamentos}
                      showDelete={editingProtocol === `femeas-${era}`}
                      onUpdate={(updatedMedicine) => updateMedicineInProtocol('femeas', era, idx, updatedMedicine)}
                      onDelete={() => removeMedicineFromProtocol('femeas', era, idx)}
                    />
                  ))}

                  {editingProtocol === `femeas-${era}` && (
                    <div className="mt-3 pt-3 border-t border-pink-200 dark:border-pink-700">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            addMedicineToProtocol('femeas', era, e.target.value)
                            e.target.value = ''
                          }
                        }}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="">Adicionar medicamento...</option>
                        {Object.keys(medicamentos).map(med => (
                          <option key={med} value={med}>{med.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => setEditingProtocol(null)}
                        className="w-full mt-2 text-sm px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors focus:ring-2 focus:ring-green-500"
                      >
                        Concluir EdiÃ§Ã£o
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Novo Medicamento */}
      {showAddMedicine && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Novo Medicamento
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ðÅ¸â€™Å  Nome do Medicamento *
                </label>
                <input
                  type="text"
                  value={newMedicine.nome}
                  onChange={(e) => setNewMedicine({ ...newMedicine, nome: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Ex: Digite o Nome do Medicamento.."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ðÅ¸â€™° PreÃ§o Total do Produto *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newMedicine.preco}
                  onChange={(e) => {
                    const preco = e.target.value
                    let porAnimal = newMedicine.porAnimal
                    
                    // Calcular automaticamente se tiver todos os dados
                    if (newMedicine.quantidadeTotal && newMedicine.quantidadePorAnimal && preco) {
                      const quantidadeTotalNum = parseFloat(newMedicine.quantidadeTotal)
                      const quantidadePorAnimalNum = parseFloat(newMedicine.quantidadePorAnimal)
                      const precoNum = parseFloat(preco)
                      
                      if (quantidadeTotalNum > 0 && quantidadePorAnimalNum > 0) {
                        porAnimal = ((precoNum / quantidadeTotalNum) * quantidadePorAnimalNum).toFixed(2)
                      }
                    }
                    
                    setNewMedicine({ ...newMedicine, preco, porAnimal })
                  }}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Ex: PreÃ§o do medicamento"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ðÅ¸â€œ¦ Unidade de Medida
                </label>
                <input
                  type="text"
                  value={newMedicine.unidade}
                  onChange={(e) => setNewMedicine({ ...newMedicine, unidade: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Ex: LITRO, FRASCO, DOSE, KG, ML"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ðÅ¸â€œÅ  Quantidade Total do Produto ({newMedicine.unidade || 'ML'})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newMedicine.quantidadeTotal}
                  onChange={(e) => {
                    const quantidadeTotal = e.target.value
                    let porAnimal = newMedicine.porAnimal
                    
                    // Calcular automaticamente se tiver todos os dados
                    if (quantidadeTotal && newMedicine.quantidadePorAnimal && newMedicine.preco) {
                      const quantidadeTotalNum = parseFloat(quantidadeTotal)
                      const quantidadePorAnimalNum = parseFloat(newMedicine.quantidadePorAnimal)
                      const precoNum = parseFloat(newMedicine.preco)
                      
                      if (quantidadeTotalNum > 0 && quantidadePorAnimalNum > 0) {
                        porAnimal = ((precoNum / quantidadeTotalNum) * quantidadePorAnimalNum).toFixed(2)
                      }
                    }
                    
                    setNewMedicine({ ...newMedicine, quantidadeTotal, porAnimal })
                  }}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Ex: 500 (ml total do frasco)"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Quantidade total do produto (ex: 500ml do frasco, 1000ml do litro)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ðÅ¸â€™â€° Quantidade por Animal ({newMedicine.unidade || 'ML'})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newMedicine.quantidadePorAnimal}
                  onChange={(e) => {
                    const quantidadePorAnimal = e.target.value
                    let porAnimal = newMedicine.porAnimal
                    
                    // Calcular automaticamente se tiver todos os dados
                    if (newMedicine.quantidadeTotal && quantidadePorAnimal && newMedicine.preco) {
                      const quantidadeTotalNum = parseFloat(newMedicine.quantidadeTotal)
                      const quantidadePorAnimalNum = parseFloat(quantidadePorAnimal)
                      const precoNum = parseFloat(newMedicine.preco)
                      
                      if (quantidadeTotalNum > 0 && quantidadePorAnimalNum > 0) {
                        porAnimal = ((precoNum / quantidadeTotalNum) * quantidadePorAnimalNum).toFixed(2)
                      }
                    }
                    
                    setNewMedicine({ ...newMedicine, quantidadePorAnimal, porAnimal })
                  }}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Ex: 2 (ml aplicado por animal)"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Quantidade aplicada em cada animal (ex: 2ml por animal)
                </p>
              </div>

              {newMedicine.quantidadeTotal && newMedicine.quantidadePorAnimal && newMedicine.preco && (
                <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ðÅ¸â€™¡ <strong>Custo Calculado:</strong> R$ {(
                      (parseFloat(newMedicine.preco) || 0) / 
                      (parseFloat(newMedicine.quantidadeTotal) || 1) * 
                      (parseFloat(newMedicine.quantidadePorAnimal) || 0)
                    ).toFixed(2)} por animal
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                    CÃ¡lculo: (R$ {parseFloat(newMedicine.preco || 0).toFixed(2)} Ã· {newMedicine.quantidadeTotal} {newMedicine.unidade || 'ML'}) Ãâ€” {newMedicine.quantidadePorAnimal} {newMedicine.unidade || 'ML'} = R$ {(
                      (parseFloat(newMedicine.preco) || 0) / 
                      (parseFloat(newMedicine.quantidadeTotal) || 1) * 
                      (parseFloat(newMedicine.quantidadePorAnimal) || 0)
                    ).toFixed(2)}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ðÅ¸Å½¯ Tipo de AplicaÃ§Ã£o
                </label>
                <select
                  value={newMedicine.tipoAplicacao}
                  onChange={(e) => setNewMedicine({ ...newMedicine, tipoAplicacao: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="individual">ðÅ¸�â€ž Individual (por animal)</option>
                  <option value="lote">ðÅ¸â€œ¦ Em Lote (grupo de animais)</option>
                </select>
              </div>

              {newMedicine.tipoAplicacao === 'lote' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ðÅ¸â€œÅ  Quantos Animais por Lote
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newMedicine.animaisPorLote}
                      onChange={(e) => setNewMedicine({ ...newMedicine, animaisPorLote: e.target.value })}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Ex: 10 animais por lote"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ðÅ¸â€™° Custo por Lote (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newMedicine.custoPorLote}
                      onChange={(e) => setNewMedicine({ ...newMedicine, custoPorLote: e.target.value })}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Quanto custa tratar um lote completo"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Se nÃ£o informar, serÃ¡ usado o preÃ§o total do produto
                    </p>
                  </div>
                  {newMedicine.animaisPorLote && (newMedicine.custoPorLote || newMedicine.preco) && (
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        ðÅ¸â€™¡ <strong>Custo por animal:</strong> R$ {(
                          (parseFloat(newMedicine.custoPorLote) || parseFloat(newMedicine.preco) || 0) /
                          (parseInt(newMedicine.animaisPorLote) || 1)
                        ).toFixed(2)}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    ðÅ¸�â€ž Custo por Animal (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newMedicine.porAnimal}
                    onChange={(e) => setNewMedicine({ ...newMedicine, porAnimal: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Quanto custa tratar 1 animal"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {newMedicine.quantidadeTotal && newMedicine.quantidadePorAnimal && newMedicine.preco
                      ? 'Campo calculado automaticamente. VocÃª pode editar manualmente se necessÃ¡rio.'
                      : 'Se nÃ£o informar quantidade, serÃ¡ usado o preÃ§o total. Ou informe manualmente o custo por animal.'}
                  </p>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={addNewMedicine}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors focus:ring-2 focus:ring-blue-500"
              >
                Adicionar
              </button>
              <button
                onClick={() => setShowAddMedicine(false)}
                className="flex-1 px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors focus:ring-2 focus:ring-gray-500"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </ModernLayout>
  )
}
