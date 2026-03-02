
import React, { useEffect, useState } from 'react'

import { 
  PlusIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon, 
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon
} from './ui/Icons'
import costManager from '../services/costManager'

export default function CostManager({ isOpen, onClose, animal: propAnimal, onSave }) {
  const [animals, setAnimals] = useState([])
  const [selectedAnimal, setSelectedAnimal] = useState(propAnimal || null)
  const [custosAnimal, setCustosAnimal] = useState([])
  const [showAddCost, setShowAddCost] = useState(false)
  const [showProtocolos, setShowProtocolos] = useState(false)
  const [showServicosCadastrados, setShowServicosCadastrados] = useState(false)
  const [showMedicamentosEstoque, setShowMedicamentosEstoque] = useState(false)
  const [servicosCadastrados, setServicosCadastrados] = useState([])
  const [medicamentosEstoque, setMedicamentosEstoque] = useState([])
  const [relatorioGeral, setRelatorioGeral] = useState(null)
  const [showCardDetails, setShowCardDetails] = useState(null)
  const [selectedMedicamento, setSelectedMedicamento] = useState(null)
  const [quantidadeAplicada, setQuantidadeAplicada] = useState('')
  const [newCost, setNewCost] = useState({
    tipo: '',
    subtipo: '',
    valor: '',
    observacoes: ''
  })

  // Atualizar animal selecionado quando prop mudar
  useEffect(() => {
    if (propAnimal) {
      setSelectedAnimal(propAnimal)
    }
  }, [propAnimal])

  useEffect(() => {
    if (isOpen) {
      loadAnimals()
      loadRelatorioGeral()
      if (propAnimal) {
        loadServicosCadastrados()
      }
    }
  }, [isOpen, propAnimal])

  useEffect(() => {
    if (selectedAnimal) {
      loadCustosAnimal(selectedAnimal.id)
      loadServicosCadastrados()
    }
  }, [selectedAnimal])

  const loadAnimals = async () => {
    try {
      // Primeiro tentar carregar da API
      try {
        const response = await fetch('/api/animals')
        if (response.ok) {
          const result = await response.json()
          const animalsData = result.success && result.data ? result.data : (Array.isArray(result) ? result : [])
          setAnimals(animalsData)
          return
        }
      } catch (apiError) {
        console.error('Erro ao carregar animais da API:', apiError)
      }
      
      // Fallback para localStorage
      const allAnimals = JSON.parse(localStorage.getItem('animals') || '[]')
      setAnimals(allAnimals || [])
    } catch (error) {
      console.error('Erro ao carregar animais:', error)
      setAnimals([])
    }
  }

  const loadCustosAnimal = async (animalId) => {
    try {
      // Tentar buscar da API primeiro
      try {
        const response = await fetch(`/api/animals/${animalId}/custos`)
        if (response.ok) {
          const result = await response.json()
          const custos = result.data || result.custos || []
          setCustosAnimal(custos)
          return
        }
      } catch (apiError) {
        console.warn('Erro ao carregar custos da API, usando fallback:', apiError)
      }
      
      // Fallback para costManager
      const custos = await costManager.getCustosAnimal(animalId)
      setCustosAnimal(custos)
    } catch (error) {
      console.error('Erro ao carregar custos:', error)
      setCustosAnimal([])
    }
  }

  const loadRelatorioGeral = async () => {
    try {
      const relatorio = await costManager.getRelatorioGeral()
      setRelatorioGeral(relatorio)
    } catch (e) {
      console.error('Erro ao carregar relatório geral:', e)
      setRelatorioGeral(null)
    }
  }

  const loadServicosCadastrados = async () => {
    try {
      const sexo = selectedAnimal?.sexo
      const aplicavel = sexo === 'Macho' ? 'macho' : sexo === 'Fêmea' ? 'femea' : null
      
      const url = aplicavel 
        ? `/api/servicos?ativo=true&aplicavel=${aplicavel}`
        : '/api/servicos?ativo=true'
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        const lista = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : [])
        setServicosCadastrados(lista)
      } else {
        setServicosCadastrados([])
      }
    } catch (error) {
      console.error('Erro ao carregar serviços:', error)
      setServicosCadastrados([])
    }
  }

  const loadMedicamentosEstoque = async () => {
    try {
      const response = await fetch('/api/medicamentos?ativo=all')
      if (response.ok) {
        const data = await response.json()
        const medicamentos = data.data?.medicamentos || data.medicamentos || []
        // Filtrar apenas medicamentos com preço e estoque disponível
        const medicamentosDisponiveis = medicamentos.filter(med => 
          med.preco && med.preco > 0 && med.ativo !== false
        )
        setMedicamentosEstoque(medicamentosDisponiveis)
      }
    } catch (error) {
      console.error('Erro ao carregar medicamentos:', error)
      setMedicamentosEstoque([])
    }
  }

  const handleSelectMedicamento = (medicamento) => {
    setSelectedMedicamento(medicamento)
    setQuantidadeAplicada('')
    setShowMedicamentosEstoque(false)
  }

  const calcularCustoMedicamento = (quantidadeFrasco = null) => {
    if (!selectedMedicamento || !quantidadeAplicada || parseFloat(quantidadeAplicada) <= 0) {
      return 0
    }
    
    const quantidade = parseFloat(quantidadeAplicada)
    const precoFrasco = parseFloat(selectedMedicamento.preco) || 0
    const qtdFrasco = quantidadeFrasco ? parseFloat(quantidadeFrasco) : null
    
    // Se tiver quantidade do frasco, calcular proporcionalmente
    if (qtdFrasco && qtdFrasco > 0 && precoFrasco > 0) {
      // Fórmula: (preço do frasco / quantidade total do frasco) * quantidade aplicada por animal
      return (precoFrasco / qtdFrasco) * quantidade
    }
    
    // Se não tiver quantidade do frasco, usar preço fixo por animal se disponível
    if (selectedMedicamento.porAnimal) {
      return parseFloat(selectedMedicamento.porAnimal) * quantidade
    }
    
    // Fallback: usar preço do medicamento
    return precoFrasco
  }

  const handleAdicionarMedicamento = async () => {
    if (!selectedMedicamento) {
      alert('Por favor, selecione um medicamento')
      return
    }

    if (!quantidadeAplicada || parseFloat(quantidadeAplicada) <= 0) {
      alert('Por favor, informe a quantidade aplicada')
      return
    }

    if (!selectedAnimal) {
      alert('Por favor, selecione um animal')
      return
    }

    try {
      // Buscar quantidade do frasco do medicamento (se disponível)
      const quantidadeFrasco = selectedMedicamento.quantidadeEstoque || null
      
      // Calcular custo usando a fórmula correta
      const custoCalculado = calcularCustoMedicamento(quantidadeFrasco)
      
      // Registrar via API
      const response = await fetch(`/api/animals/${selectedAnimal.id}/medicamentos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          medicamentoId: selectedMedicamento.id,
          medicamentoNome: selectedMedicamento.nome,
          quantidadeAplicada: parseFloat(quantidadeAplicada),
          quantidadeFrasco: quantidadeFrasco,
          data: new Date().toISOString().split('T')[0],
          observacoes: `Aplicado ${quantidadeAplicada} ${selectedMedicamento.unidade || 'ml'} de ${selectedMedicamento.nome}${selectedMedicamento.categoria ? ` (${selectedMedicamento.categoria})` : ''}`
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao registrar medicamento')
      }

      // Recarregar custos
      await loadCustosAnimal(selectedAnimal.id)
      loadRelatorioGeral()
      
      // Limpar campos
      setSelectedMedicamento(null)
      setQuantidadeAplicada('')
      setShowMedicamentosEstoque(false)
      
      // Chamar callback se fornecido
      if (onSave && selectedAnimal) {
        const updatedAnimal = {
          ...selectedAnimal,
          custos: await costManager.getCustosAnimal(selectedAnimal.id)
        }
        onSave(updatedAnimal)
      }
      
      alert(`✅ Medicamento aplicado com sucesso!\n\n💊 ${selectedMedicamento.nome}\n📊 Quantidade: ${quantidadeAplicada} ${selectedMedicamento.unidade || 'ml'}\n💰 Custo: R$ ${custoCalculado.toFixed(2)}`)
    } catch (error) {
      console.error('Erro ao adicionar medicamento:', error)
      alert(`❌ Erro ao aplicar medicamento: ${error.message}`)
    }
  }

  const handleSelectServico = (servico) => {
    setNewCost({
      tipo: servico.categoria,
      subtipo: servico.nome,
      valor: servico.valor_padrao,
      observacoes: servico.descricao || ''
    })
    setShowServicosCadastrados(false)
    setShowAddCost(true)
  }

  const handleSelectAnimal = (animal) => {
    setSelectedAnimal(animal)
    setShowAddCost(false)
  }

  const handleAddCost = () => {
    const camposFaltando = [];
    
    if (!selectedAnimal) camposFaltando.push('Animal');
    if (!newCost.tipo) camposFaltando.push('Tipo de Custo');
    if (!newCost.valor) camposFaltando.push('Valor');
    
    if (camposFaltando.length > 0) {
      let mensagem = '❌ Campos obrigatórios não preenchidos:\n\n';
      camposFaltando.forEach((campo, index) => {
        mensagem += `${index + 1}. ${campo}\n`;
      });
      mensagem += '\nPor favor, preencha todos os campos obrigatórios antes de adicionar o custo.';
      alert(mensagem);
      return;
    }

    const custo = {
      tipo: newCost.tipo,
      subtipo: newCost.subtipo,
      valor: parseFloat(newCost.valor),
      data: new Date().toISOString().split('T')[0],
      observacoes: newCost.observacoes
    }

    costManager.adicionarCusto(selectedAnimal.id, custo)
    loadCustosAnimal(selectedAnimal.id)
    loadRelatorioGeral()
    
    setNewCost({ tipo: '', subtipo: '', valor: '', observacoes: '' })
    setShowAddCost(false)
    
    // Chamar callback se fornecido
    if (onSave && selectedAnimal) {
      const updatedAnimal = {
        ...selectedAnimal,
        custos: costManager.getCustosAnimal(selectedAnimal.id)
      }
      onSave(updatedAnimal)
    }
    
    alert('✅ Custo adicionado com sucesso!')
  }

  const aplicarProtocolo = (animal) => {
    const resultado = costManager.aplicarProtocolo(animal.id, animal)
    
    if (resultado) {
      loadCustosAnimal(animal.id)
      loadRelatorioGeral()
      alert(`✅ Protocolo aplicado!\n\n📋 ${resultado.protocolo}\n💰 Custo total: R$ ${resultado.total.toFixed(2)}\n📝 ${resultado.custos.length} medicamentos aplicados`)
    } else {
      alert('ℹ️ Nenhum protocolo aplicável para este animal no momento')
    }
  }

  const aplicarDNA = (animal) => {
    const custosDNA = costManager.adicionarCustoDNA(animal.id, animal)
    
    if (custosDNA.length > 0) {
      loadCustosAnimal(animal.id)
      loadRelatorioGeral()
      
      const total = custosDNA.reduce((sum, c) => sum + c.valor, 0)
      const tipos = custosDNA.map(c => c.subtipo).join(', ')
      
      alert(`✅ DNA aplicado!\n\n🧬 Tipos: ${tipos}\n💰 Custo total: R$ ${total.toFixed(2)}`)
    } else {
      alert('ℹ️ Nenhum DNA aplicável para este animal')
    }
  }

  const getCustoTotal = (animalId) => {
    const custos = costManager.getCustosAnimal(animalId)
    const arr = Array.isArray(custos) ? custos : []
    return arr.reduce((total, custo) => total + (parseFloat(custo.valor || 0) || 0), 0)
  }

  const getStatusCusto = (animal) => {
    const custos = costManager.getCustosAnimal(animal.id)
    const arr = Array.isArray(custos) ? custos : []
    const temProtocolo = arr.some(c => c.tipo === 'Protocolo Sanitário')
    const temDNA = arr.some(c => c.tipo === 'DNA')
    
    if (temProtocolo && temDNA) return 'completo'
    if (temProtocolo || temDNA) return 'parcial'
    return 'pendente'
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completo': return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'parcial': return <ClockIcon className="h-5 w-5 text-yellow-500" />
      default: return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completo': return 'Completo'
      case 'parcial': return 'Parcial'
      default: return 'Pendente'
    }
  }

  const tiposCusto = [
    'Protocolo Sanitário',
    'DNA',
    'Medicamento',
    'Vacina',
    'Alimentação',
    'Veterinário',
    'Pesagens',
    'Transporte',
    'Outros'
  ]

  // Se for modal, envolver em estrutura de modal
  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <CurrencyDollarIcon className="h-8 w-8 mr-3 text-green-600" />
            Gestão de Custos Individuais
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Controle detalhado de custos por animal com protocolos automáticos
          </p>
        </div>
        <button
          onClick={() => setShowProtocolos(!showProtocolos)}
          className="btn-secondary flex items-center mt-4 sm:mt-0"
        >
          <DocumentTextIcon className="h-5 w-5 mr-2" />
          Ver Protocolos
        </button>
      </div>

      {/* Resumo Geral */}
      {relatorioGeral && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div 
            className="card p-4 text-center cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
            onClick={() => setShowCardDetails('animais-com-custos')}
            title="Clique para ver detalhes"
          >
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {relatorioGeral?.animaisComCustos || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Animais com Custos</div>
            <div className="text-xs text-blue-500 mt-1">👆 Clique para detalhes</div>
          </div>
          <div 
            className="card p-4 text-center cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
            onClick={() => setShowCardDetails('custo-total')}
            title="Clique para ver detalhes"
          >
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              R$ {(relatorioGeral?.totalGeral || 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Custo Total</div>
            <div className="text-xs text-green-500 mt-1">👆 Clique para detalhes</div>
          </div>
          <div 
            className="card p-4 text-center cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
            onClick={() => setShowCardDetails('media-por-animal')}
            title="Clique para ver detalhes"
          >
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              R$ {(relatorioGeral?.mediaPorAnimal || 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Média por Animal</div>
            <div className="text-xs text-purple-500 mt-1">👆 Clique para detalhes</div>
          </div>
          <div 
            className="card p-4 text-center cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
            onClick={() => setShowCardDetails('total-animais')}
            title="Clique para ver detalhes"
          >
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {animals.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total de Animais</div>
            <div className="text-xs text-orange-500 mt-1">👆 Clique para detalhes</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Animais */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            🐄 Animais Cadastrados
          </h3>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {(animals || []).map(animal => {
              const custoTotal = getCustoTotal(animal.id)
              const status = getStatusCusto(animal)
              
              return (
                <div
                  key={animal.id}
                  onClick={() => handleSelectAnimal(animal)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedAnimal?.id === animal.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {animal.serie} {animal.rg}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {animal.sexo === 'M' ? '🐂' : '🐄'} {animal.raca} • {animal.meses} meses
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(status)}
                        <span className="text-sm font-medium">
                          {getStatusLabel(status)}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-green-600 dark:text-green-400">
                        R$ {(custoTotal || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Detalhes do Animal Selecionado */}
        <div className="card p-6">
          {selectedAnimal ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  📋 {selectedAnimal.serie} {selectedAnimal.rg}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      loadServicosCadastrados()
                      setShowServicosCadastrados(true)
                    }}
                    className="btn-secondary text-sm"
                  >
                    💼 Serviços Cadastrados
                  </button>
                  <button
                    onClick={() => {
                      loadMedicamentosEstoque()
                      setShowMedicamentosEstoque(true)
                    }}
                    className="btn-secondary text-sm bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    💊 Medicamentos do Estoque
                  </button>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => aplicarProtocolo(selectedAnimal)}
                      className="btn-primary text-sm"
                    >
                      Aplicar Protocolo
                    </button>
                    <button
                      onClick={() => aplicarDNA(selectedAnimal)}
                      className="btn-secondary text-sm"
                    >
                      Aplicar DNA
                    </button>
                    <button
                      onClick={() => setShowAddCost(true)}
                      className="btn-success text-sm"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Informações do Animal */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Sexo:</span> {selectedAnimal.sexo === 'M' ? 'Macho' : 'Fêmea'}
                  </div>
                  <div>
                    <span className="font-medium">Idade:</span> {selectedAnimal.meses} meses
                  </div>
                  <div>
                    <span className="font-medium">Raça:</span> {selectedAnimal.raca}
                  </div>
                  <div>
                    <span className="font-medium">FIV:</span> {selectedAnimal.isFiv ? 'Sim' : 'Não'}
                  </div>
                </div>
              </div>

              {/* Custos do Animal */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  💰 Custos Registrados ({custosAnimal.length})
                </h4>
                
                {custosAnimal.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {custosAnimal.map(custo => (
                      <div key={custo.id} className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {custo.tipo}
                              {custo.subtipo && (
                                <span className="text-gray-600 dark:text-gray-400"> • {custo.subtipo}</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {custo.data} • {custo.observacoes}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600 dark:text-green-400">
                              R$ {parseFloat(custo.valor || 0).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Nenhum custo registrado para este animal
                  </div>
                )}

                {/* Total */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900 dark:text-white">Total:</span>
                    <span className="text-xl font-bold text-green-600 dark:text-green-400">
                      R$ {(getCustoTotal(selectedAnimal.id) || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Selecione um animal para ver os detalhes de custos
            </div>
          )}
        </div>
      </div>

      {/* Modal Adicionar Custo */}
      {showAddCost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Adicionar Custo
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de Custo *
                </label>
                <select
                  value={newCost.tipo}
                  onChange={(e) => setNewCost({...newCost, tipo: e.target.value})}
                  className="input w-full"
                >
                  <option value="">Selecione o tipo</option>
                  {tiposCusto.map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subtipo
                </label>
                <input
                  type="text"
                  value={newCost.subtipo}
                  onChange={(e) => setNewCost({...newCost, subtipo: e.target.value})}
                  className="input w-full"
                  placeholder="Ex: Vacina específica, medicamento..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valor (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newCost.valor}
                  onChange={(e) => setNewCost({...newCost, valor: e.target.value})}
                  className="input w-full"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Observações
                </label>
                <textarea
                  value={newCost.observacoes}
                  onChange={(e) => setNewCost({...newCost, observacoes: e.target.value})}
                  className="input w-full"
                  rows="3"
                  placeholder="Detalhes sobre o custo..."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleAddCost}
                className="btn-primary flex-1"
              >
                Adicionar
              </button>
              <button
                onClick={() => setShowAddCost(false)}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Protocolos */}
      {showProtocolos && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                📋 Protocolos Sanitários por Era
              </h3>
              <button
                onClick={() => setShowProtocolos(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Protocolos Machos */}
              <div>
                <h4 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4">
                  🐂 Protocolos para Machos
                </h4>
                <div className="space-y-4">
                  {Object.entries(costManager.protocolos.machos).map(([era, protocolo]) => (
                    <div key={era} className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                        {protocolo.nome}
                      </h5>
                      <div className="space-y-1 text-sm">
                        {protocolo.medicamentos.map((med, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>{med.nome}</span>
                            <span className="text-gray-600 dark:text-gray-400">
                              {med.quantidade ? `${med.quantidade} ${med.unidade}` : med.condicional}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Protocolos Fêmeas */}
              <div>
                <h4 className="text-lg font-semibold text-pink-600 dark:text-pink-400 mb-4">
                  🐄 Protocolos para Fêmeas
                </h4>
                <div className="space-y-4">
                  {Object.entries(costManager.protocolos.femeas).map(([era, protocolo]) => (
                    <div key={era} className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-4">
                      <h5 className="font-medium text-pink-800 dark:text-pink-200 mb-2">
                        {protocolo.nome}
                      </h5>
                      <div className="space-y-1 text-sm">
                        {protocolo.medicamentos.map((med, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>{med.nome}</span>
                            <span className="text-gray-600 dark:text-gray-400">
                              {med.quantidade ? `${med.quantidade} ${med.unidade}` : med.condicional}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Regras DNA */}
            <div className="mt-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-3">
                🧬 Regras para DNA
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="font-medium text-purple-700 dark:text-purple-300 mb-2">
                    DNA Virgem (R$ 50,00)
                  </h5>
                  <p className="text-purple-600 dark:text-purple-400">
                    ✅ Aplicado SOMENTE para animais nascidos de FIV<br/>
                    📝 Finalidade: Confirmação de paternidade
                  </p>
                </div>
                <div>
                  <h5 className="font-medium text-purple-700 dark:text-purple-300 mb-2">
                    DNA Genômica (R$ 80,00)
                  </h5>
                  <p className="text-purple-600 dark:text-purple-400">
                    ✅ Aplicado para TODOS os bezerros de 0 a 7 meses<br/>
                    📝 Finalidade: Análise genética completa
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Serviços Cadastrados */}
      {showServicosCadastrados && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  💼 Serviços Cadastrados
                </h2>
                <button
                  onClick={() => setShowServicosCadastrados(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Selecione um serviço para aplicar ao animal {selectedAnimal?.serie} {selectedAnimal?.rg}
              </p>
            </div>

            <div className="p-6">
              {servicosCadastrados.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">💼</div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Nenhum serviço cadastrado ainda
                  </p>
                  <button
                    onClick={() => {
                      setShowServicosCadastrados(false)
                      window.location.href = '/servicos-cadastrados'
                    }}
                    className="btn-primary"
                  >
                    Cadastrar Serviços
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(
                    servicosCadastrados.reduce((acc, servico) => {
                      if (!acc[servico.categoria]) acc[servico.categoria] = []
                      acc[servico.categoria].push(servico)
                      return acc
                    }, {})
                  ).map(([categoria, servicos]) => (
                    <div key={categoria}>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        📋 {categoria}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {servicos.map(servico => (
                          <button
                            key={servico.id}
                            onClick={() => handleSelectServico(servico)}
                            className="text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {servico.nome}
                              </span>
                              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                R$ {parseFloat(servico.valor_padrao).toFixed(2)}
                              </span>
                            </div>
                            {servico.descricao && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {servico.descricao}
                              </p>
                            )}
                            <div className="flex gap-2 mt-2">
                              {servico.aplicavel_macho && (
                                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                  🐂 Machos
                                </span>
                              )}
                              {servico.aplicavel_femea && (
                                <span className="text-xs px-2 py-1 rounded-full bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200">
                                  🐄 Fêmeas
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setShowServicosCadastrados(false)}
                className="btn-secondary"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Medicamentos do Estoque */}
      {showMedicamentosEstoque && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  💊 Medicamentos do Estoque
                </h2>
                <button
                  onClick={() => {
                    setShowMedicamentosEstoque(false)
                    setSelectedMedicamento(null)
                    setQuantidadeAplicada('')
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Selecione um medicamento para aplicar ao animal {selectedAnimal?.serie} {selectedAnimal?.rg}
              </p>
            </div>

            {selectedMedicamento ? (
              /* Formulário de Aplicação */
              <div className="p-6">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-emerald-900 dark:text-emerald-200 mb-2">
                    Medicamento Selecionado
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-emerald-800 dark:text-emerald-300 font-medium">Nome:</span>
                      <span className="text-emerald-900 dark:text-emerald-100">{selectedMedicamento.nome}</span>
                    </div>
                    {selectedMedicamento.categoria && (
                      <div className="flex justify-between">
                        <span className="text-emerald-800 dark:text-emerald-300 font-medium">Categoria:</span>
                        <span className="text-emerald-900 dark:text-emerald-100">{selectedMedicamento.categoria}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-emerald-800 dark:text-emerald-300 font-medium">Valor Unitário:</span>
                      <span className="text-emerald-900 dark:text-emerald-100 font-bold">
                        R$ {parseFloat(selectedMedicamento.preco || 0).toFixed(2)} / {selectedMedicamento.unidade}
                      </span>
                    </div>
                    {selectedMedicamento.quantidade_estoque !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-emerald-800 dark:text-emerald-300 font-medium">Estoque Disponível:</span>
                        <span className="text-emerald-900 dark:text-emerald-100">
                          {selectedMedicamento.quantidade_estoque} {selectedMedicamento.unidade}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedMedicamento(null)
                      setQuantidadeAplicada('')
                    }}
                    className="mt-4 text-sm text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 underline"
                  >
                    ← Selecionar outro medicamento
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Quantidade Aplicada ({selectedMedicamento.unidade}) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={quantidadeAplicada}
                      onChange={(e) => setQuantidadeAplicada(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Ex: 2"
                      min="0.01"
                    />
                    {selectedMedicamento.quantidade_estoque !== undefined && quantidadeAplicada && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Estoque disponível: {selectedMedicamento.quantidade_estoque} {selectedMedicamento.unidade}
                      </p>
                    )}
                  </div>

                  {quantidadeAplicada && parseFloat(quantidadeAplicada) > 0 && (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-green-800 dark:text-green-200 font-medium">
                          Custo Calculado:
                        </span>
                        <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                          R$ {calcularCustoMedicamento().toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                        {quantidadeAplicada} {selectedMedicamento.unidade} × R$ {parseFloat(selectedMedicamento.preco || 0).toFixed(2)}/{selectedMedicamento.unidade}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleAdicionarMedicamento}
                    className="btn-primary flex-1 bg-emerald-600 hover:bg-emerald-700"
                    disabled={!quantidadeAplicada || parseFloat(quantidadeAplicada) <= 0}
                  >
                    ✅ Aplicar Medicamento
                  </button>
                  <button
                    onClick={() => {
                      setShowMedicamentosEstoque(false)
                      setSelectedMedicamento(null)
                      setQuantidadeAplicada('')
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              /* Lista de Medicamentos */
              <div className="p-6">
                {medicamentosEstoque.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-4">💊</div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Nenhum medicamento cadastrado com preço no estoque
                    </p>
                    <button
                      onClick={() => {
                        setShowMedicamentosEstoque(false)
                        window.location.href = '/sanidade/medicamentos'
                      }}
                      className="btn-primary"
                    >
                      Cadastrar Medicamentos
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(
                      medicamentosEstoque.reduce((acc, med) => {
                        const categoria = med.categoria || 'Outros'
                        if (!acc[categoria]) acc[categoria] = []
                        acc[categoria].push(med)
                        return acc
                      }, {})
                    ).map(([categoria, medicamentos]) => (
                      <div key={categoria}>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                          📋 {categoria}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {medicamentos.map(med => (
                            <button
                              key={med.id}
                              onClick={() => handleSelectMedicamento(med)}
                              className="text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {med.nome}
                                </span>
                                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                  R$ {parseFloat(med.preco || 0).toFixed(2)}
                                </span>
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                {med.unidade && (
                                  <div>Unidade: {med.unidade}</div>
                                )}
                                {med.quantidade_estoque !== undefined && (
                                  <div>Estoque: {med.quantidade_estoque} {med.unidade}</div>
                                )}
                                {med.principio_ativo && (
                                  <div className="text-gray-500 dark:text-gray-500">
                                    {med.principio_ativo}
                                  </div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!selectedMedicamento && (
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <button
                  onClick={() => {
                    setShowMedicamentosEstoque(false)
                  }}
                  className="btn-secondary"
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Detalhes dos Cards */}
      {showCardDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {getCardDetailsTitle(showCardDetails)}
                </h3>
                <button
                  onClick={() => setShowCardDetails(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {getCardDetailsContent(showCardDetails)}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setShowCardDetails(null)}
                className="btn-secondary"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // Se for modal, retornar com estrutura de modal
  if (isOpen !== undefined) {
    if (!isOpen) return null
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {propAnimal ? `Gerenciar Custos - ${propAnimal.serie} ${propAnimal.rg}` : 'Gerenciar Custos'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="p-6">
            {content}
          </div>
        </div>
      </div>
    )
  }

  // Se não for modal, retornar conteúdo diretamente
  return content

  // Função para obter o título do modal
  function getCardDetailsTitle(cardType) {
    switch (cardType) {
      case 'animais-com-custos':
        return '🐄 Animais com Custos Registrados'
      case 'custo-total':
        return '💰 Detalhamento do Custo Total'
      case 'media-por-animal':
        return '📊 Análise da Média por Animal'
      case 'total-animais':
        return '📈 Resumo Geral dos Animais'
      default:
        return 'Detalhes'
    }
  }

  // Função para obter o conteúdo do modal
  function getCardDetailsContent(cardType) {
    switch (cardType) {
      case 'animais-com-custos':
        const animaisComCustos = animals.filter(animal => {
          const custoTotal = getCustoTotal(animal.id)
          return custoTotal > 0
        })
        
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Definição:</strong> Animais que possuem pelo menos um custo registrado no sistema.
              </p>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">Lista de Animais com Custos:</h4>
              {animaisComCustos.length > 0 ? (
                animaisComCustos.map(animal => {
                  const custoTotal = getCustoTotal(animal.id)
                  return (
                    <div key={animal.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {animal.serie} {animal.rg}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {animal.raca} • {animal.sexo}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600 dark:text-green-400">
                            R$ {(custoTotal || 0).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {(() => { const c = costManager.getCustosAnimal(animal.id); return (Array.isArray(c) ? c : []).length; })()} custos
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Nenhum animal com custos registrados
                </div>
              )}
            </div>
          </div>
        )

      case 'custo-total':
        const custosPorTipo = {}
        animals.forEach(animal => {
          const custosAnimal = costManager.getCustosAnimal(animal.id)
          const arrCustos = Array.isArray(custosAnimal) ? custosAnimal : []
          arrCustos.forEach(custo => {
            custosPorTipo[custo.tipo] = (custosPorTipo[custo.tipo] || 0) + custo.valor
          })
        })

        return (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>Definição:</strong> Soma de todos os custos registrados para todos os animais.
              </p>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">Distribuição por Tipo de Custo:</h4>
              {Object.entries(custosPorTipo).map(([tipo, valor]) => (
                <div key={tipo} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="font-medium text-gray-900 dark:text-white">{tipo}</div>
                    <div className="font-bold text-green-600 dark:text-green-400">
                      R$ {(valor || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                <div className="flex justify-between items-center">
                  <div className="font-bold text-gray-900 dark:text-white">TOTAL GERAL</div>
                  <div className="font-bold text-green-600 dark:text-green-400 text-lg">
                    R$ {((relatorioGeral?.totalGeral || 0).toFixed(2) || '0,00')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'media-por-animal':
        const animaisComCustosParaMedia = animals.filter(animal => {
          const custoTotal = getCustoTotal(animal.id)
          return custoTotal > 0
        })

        return (
          <div className="space-y-4">
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <p className="text-sm text-purple-800 dark:text-purple-200">
                <strong>Definição:</strong> Valor médio de custos por animal (apenas animais com custos registrados).
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {animaisComCustosParaMedia.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Animais com Custos</div>
                </div>
                <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    R$ {((relatorioGeral?.mediaPorAnimal || 0).toFixed(2) || '0,00')}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Média por Animal</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-white">Custos por Animal:</h4>
                {animaisComCustosParaMedia.map(animal => {
                  const custoTotal = getCustoTotal(animal.id)
                  return (
                    <div key={animal.id} className="p-2 border border-gray-200 dark:border-gray-700 rounded">
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {animal.serie} {animal.rg}
                        </div>
                        <div className="text-sm font-medium text-purple-600 dark:text-purple-400">
                          R$ {(custoTotal || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )

      case 'total-animais':
        const animaisPorSituacao = animals.reduce((acc, animal) => {
          const situacao = animal.situacao || 'Ativo'
          acc[situacao] = (acc[situacao] || 0) + 1
          return acc
        }, {})

        const animaisPorSexo = animals.reduce((acc, animal) => {
          acc[animal.sexo] = (acc[animal.sexo] || 0) + 1
          return acc
        }, {})

        const animaisPorRaca = animals.reduce((acc, animal) => {
          const raca = animal.raca || 'Não informado'
          acc[raca] = (acc[raca] || 0) + 1
          return acc
        }, {})

        return (
          <div className="space-y-4">
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
              <p className="text-sm text-orange-800 dark:text-orange-200">
                <strong>Definição:</strong> Total de animais cadastrados no sistema.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Distribuição por Situação:</h4>
                <div className="space-y-2">
                  {Object.entries(animaisPorSituacao).map(([situacao, count]) => (
                    <div key={situacao} className="flex justify-between items-center p-2 border border-gray-200 dark:border-gray-700 rounded">
                      <span className="text-sm text-gray-900 dark:text-white">{situacao}</span>
                      <span className="text-sm font-medium text-orange-600 dark:text-orange-400">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Distribuição por Sexo:</h4>
                <div className="space-y-2">
                  {Object.entries(animaisPorSexo).map(([sexo, count]) => (
                    <div key={sexo} className="flex justify-between items-center p-2 border border-gray-200 dark:border-gray-700 rounded">
                      <span className="text-sm text-gray-900 dark:text-white">{sexo}</span>
                      <span className="text-sm font-medium text-orange-600 dark:text-orange-400">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Distribuição por Raça:</h4>
                <div className="space-y-2">
                  {Object.entries(animaisPorRaca).map(([raca, count]) => (
                    <div key={raca} className="flex justify-between items-center p-2 border border-gray-200 dark:border-gray-700 rounded">
                      <span className="text-sm text-gray-900 dark:text-white">{raca}</span>
                      <span className="text-sm font-medium text-orange-600 dark:text-orange-400">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return <div>Detalhes não disponíveis</div>
    }
  }
}