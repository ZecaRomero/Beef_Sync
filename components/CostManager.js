
import React, { useEffect, useState } from 'react'

import { 
  PlusIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon, 
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon
} from './ui/Icons'
import costManager from '../services/costManager'

export default function CostManager({ isOpen, onClose, animal: propAnimal, onSave, initialAnimalId }) {
  const [animals, setAnimals] = useState([])
  const [selectedAnimal, setSelectedAnimal] = useState(propAnimal || null)
  const [custosAnimal, setCustosAnimal] = useState([])
  const [showAddCost, setShowAddCost] = useState(false)
  const [showEditCost, setShowEditCost] = useState(false)
  const [editingCusto, setEditingCusto] = useState(null)
  const [applyToAllCustos, setApplyToAllCustos] = useState(false)
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
  const [aplicandoAutomaticos, setAplicandoAutomaticos] = useState(false)

  // Atualizar animal selecionado quando prop mudar
  useEffect(() => {
    if (propAnimal) {
      setSelectedAnimal(propAnimal)
    }
  }, [propAnimal])

  const isStandalone = isOpen === undefined || isOpen === true

  useEffect(() => {
    if (isStandalone) {
      loadAnimals()
      loadRelatorioGeral()
      if (propAnimal) {
        loadServicosCadastrados()
      }
    }
  }, [isStandalone, propAnimal])

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

  useEffect(() => {
    if (initialAnimalId && animals?.length && !selectedAnimal) {
      const id = parseInt(initialAnimalId, 10)
      const found = animals.find(a => a.id === id || String(a.id) === String(initialAnimalId))
      if (found) setSelectedAnimal(found)
    }
  }, [initialAnimalId, animals])

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

  const handleAddCost = async () => {
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

    try {
      await costManager.adicionarCusto(selectedAnimal.id, custo)
      loadCustosAnimal(selectedAnimal.id)
      loadRelatorioGeral()

      setNewCost({ tipo: '', subtipo: '', valor: '', observacoes: '' })
      setShowAddCost(false)

      if (onSave && selectedAnimal) {
        const custos = await costManager.getCustosAnimal(selectedAnimal.id)
        onSave({ ...selectedAnimal, custos })
      }
      
      alert('✅ Custo adicionado com sucesso!')
    } catch (e) {
      alert('❌ Erro ao adicionar custo: ' + (e.message || e))
    }
  }

  const handleEditCost = (custo) => {
    setEditingCusto({
      id: custo.id,
      tipo: custo.tipo || '',
      subtipo: custo.subtipo || '',
      valor: custo.valor ? String(custo.valor) : '',
      data: custo.data || new Date().toISOString().split('T')[0],
      observacoes: custo.observacoes || ''
    })
    setApplyToAllCustos(false)
    setShowEditCost(true)
  }

  const handleSaveEditCost = async () => {
    if (!editingCusto) return
    if (!editingCusto.tipo || !editingCusto.valor) {
      alert('❌ Tipo e Valor são obrigatórios')
      return
    }
    try {
      const res = await fetch(`/api/custos?id=${editingCusto.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: editingCusto.tipo,
          subtipo: editingCusto.subtipo || null,
          valor: parseFloat(editingCusto.valor),
          data: editingCusto.data,
          observacoes: editingCusto.observacoes || null,
          applyToAll: applyToAllCustos
        })
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message || 'Erro ao atualizar')
      loadCustosAnimal(selectedAnimal?.id)
      if (selectedAnimal) loadRelatorioGeral()
      setShowEditCost(false)
      setEditingCusto(null)
      if (onSave && selectedAnimal) {
        const custos = await costManager.getCustosAnimal(selectedAnimal.id)
        onSave({ ...selectedAnimal, custos })
      }
      const msg = data.data?.aplicadosTodos
        ? `✅ Atualizado! Aplicado a ${data.data.aplicadosTodos.atualizados} lançamento(s) em ${data.data.aplicadosTodos.animais} animal(is).`
        : '✅ Custo atualizado! As alterações aparecerão no celular ao recarregar.'
      alert(msg)
    } catch (e) {
      alert('❌ Erro ao atualizar: ' + (e.message || e))
    }
  }

  const handleDeleteCost = async (custo) => {
    if (!confirm(`Excluir custo "${custo.tipo}${custo.subtipo ? ' - ' + custo.subtipo : ''}" de R$ ${parseFloat(custo.valor || 0).toFixed(2)}?`)) return
    try {
      const res = await fetch(`/api/custos?id=${custo.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!data.success) throw new Error(data.message || 'Erro ao excluir')
      loadCustosAnimal(selectedAnimal?.id)
      if (selectedAnimal) loadRelatorioGeral()
      setShowEditCost(false)
      setEditingCusto(null)
      if (onSave && selectedAnimal) {
        const custos = await costManager.getCustosAnimal(selectedAnimal.id)
        onSave({ ...selectedAnimal, custos })
      }
      alert('✅ Custo excluído!')
    } catch (e) {
      alert('❌ Erro ao excluir: ' + (e.message || e))
    }
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
    const porAnimal = relatorioGeral?.custoPorAnimal?.find(p => p.animalId === animalId)
    if (porAnimal) return Number(porAnimal.total) || 0
    if (selectedAnimal?.id === animalId && custosAnimal?.length) {
      return custosAnimal.reduce((t, c) => t + (parseFloat(c.valor || 0) || 0), 0)
    }
    return 0
  }

  const getStatusCusto = (animal) => {
    const porAnimal = relatorioGeral?.custoPorAnimal?.find(p => p.animalId === animal.id)
    const arr = porAnimal?.custos || (selectedAnimal?.id === animal.id ? custosAnimal : []) || []
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
    'Manejo',
    'Pesagens',
    'Transporte',
    'ABCZ',
    'Exame',
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
        <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
          <button
            onClick={async () => {
              if (!confirm('Aplicar custos automáticos (RGN, RGD, Brucelose, DNA, Brinco, Botton, Ração R$120/mês, Andrológico R$165 machos 15-32m)?')) return
              setAplicandoAutomaticos(true)
              try {
                const r = await fetch('/api/custos/aplicar-automaticos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
                const d = await r.json()
                if (d.success) {
                  loadRelatorioGeral()
                  if (selectedAnimal) loadCustosAnimal(selectedAnimal.id)
                  alert(`✅ ${d.message}\n\nRGN: ${d.resultados?.rgn?.aplicados || 0}\nRGD: ${d.resultados?.rgd?.aplicados || 0}\nBrucelose: ${d.resultados?.brucelose?.aplicados || 0}\nDNA VRGEN: ${d.resultados?.dnaVrgen?.aplicados || 0}\nDNA Genômica Receptora: ${d.resultados?.dnaGenomicaReceptora?.aplicados || 0}\nBrinco Amarelo: ${d.resultados?.brincoAmarelo?.aplicados || 0}\nBotton: ${d.resultados?.botton?.aplicados || 0}\nRação: ${d.resultados?.racao?.aplicados || 0}\nAndrológico: ${d.resultados?.andrologico?.aplicados || 0}`)
                } else alert('❌ ' + (d.error || 'Erro ao aplicar'))
              } catch (e) {
                alert('❌ Erro: ' + e.message)
              } finally {
                setAplicandoAutomaticos(false)
              }
            }}
            disabled={aplicandoAutomaticos}
            className="btn-primary flex items-center"
          >
            {aplicandoAutomaticos ? <span className="animate-spin mr-2">⏳</span> : null}
            Aplicar Custos Automáticos
          </button>
          <button
            onClick={() => setShowProtocolos(!showProtocolos)}
            className="btn-secondary flex items-center"
          >
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            Ver Protocolos
          </button>
        </div>
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
              R$ {(Number(relatorioGeral?.totalGeral) || 0).toFixed(2)}
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
              R$ {(Number(relatorioGeral?.mediaPorAnimal) || 0).toFixed(2)}
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
              const valorVenda = parseFloat(animal.valor_venda || animal.valor_real || 0) || 0
              const roi = valorVenda > 0 && custoTotal > 0 ? ((valorVenda - custoTotal) / custoTotal * 100).toFixed(1) : null
              
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
                        R$ {(Number(custoTotal) || 0).toFixed(2)}
                      </div>
                      {valorVenda > 0 && (
                        <div className="text-xs">
                          <span className="text-blue-600 dark:text-blue-400">Venda: R$ {valorVenda.toFixed(2)}</span>
                          {roi != null && (
                            <span className={`ml-1 font-semibold ${parseFloat(roi) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ROI {roi}%
                            </span>
                          )}
                        </div>
                      )}
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
                      title="Adicionar custo manual (Brinco, Botton ou qualquer outro)"
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
                  <div>
                    <span className="font-medium">Custo total:</span>{' '}
                    <span className="font-bold text-green-600 dark:text-green-400">R$ {(Number(getCustoTotal(selectedAnimal.id)) || 0).toFixed(2)}</span>
                  </div>
                  {(parseFloat(selectedAnimal.valor_venda || selectedAnimal.valor_real || 0) || 0) > 0 && (
                    <div className="col-span-2">
                      <span className="font-medium">Valor venda:</span>{' '}
                      <span className="font-bold text-blue-600 dark:text-blue-400">R$ {(parseFloat(selectedAnimal.valor_venda || selectedAnimal.valor_real || 0)).toFixed(2)}</span>
                      {' • '}
                      <span className="font-medium">ROI:</span>{' '}
                      <span className={`font-bold ${((parseFloat(selectedAnimal.valor_venda || selectedAnimal.valor_real || 0) - getCustoTotal(selectedAnimal.id)) / (getCustoTotal(selectedAnimal.id) || 1) * 100) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {(((parseFloat(selectedAnimal.valor_venda || selectedAnimal.valor_real || 0) - getCustoTotal(selectedAnimal.id)) / (getCustoTotal(selectedAnimal.id) || 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Custos do Animal */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    💰 Custos Registrados ({custosAnimal.length})
                  </h4>
                  <button
                    onClick={() => setShowAddCost(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium"
                    title="Adicionar custo manual"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Adicionar Custo
                  </button>
                </div>
                
                {custosAnimal.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {custosAnimal.map(custo => (
                      <div key={custo.id} className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
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
                          <div className="flex items-center gap-1 shrink-0">
                            <div className="font-bold text-green-600 dark:text-green-400 mr-2">
                              R$ {parseFloat(custo.valor || 0).toFixed(2)}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleEditCost(custo)}
                              className="p-1.5 rounded text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-blue-600"
                              title="Editar"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCost(custo)}
                              className="p-1.5 rounded text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-red-600"
                              title="Excluir"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p className="mb-4">Nenhum custo registrado para este animal</p>
                    <button
                      onClick={() => setShowAddCost(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium"
                    >
                      <PlusIcon className="h-5 w-5" />
                      Adicionar Custo
                    </button>
                  </div>
                )}

                {/* Total */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900 dark:text-white">Total:</span>
                    <span className="text-xl font-bold text-green-600 dark:text-green-400">
                      R$ {(Number(getCustoTotal(selectedAnimal.id)) || 0).toFixed(2)}
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
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Acrescente Brinco Amarelo, Botton ou qualquer outro custo manualmente.
            </p>
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
                  placeholder="Ex: Brinco Amarelo, Botton Eletrônico..."
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

      {/* Modal Editar Custo */}
      {showEditCost && editingCusto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <PencilIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Editar Custo
                    </h3>
                    <p className="text-blue-100 text-sm">
                      Altere os dados conforme necessário
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowEditCost(false); setEditingCusto(null); setApplyToAllCustos(false) }}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  As alterações serão sincronizadas automaticamente com o aplicativo móvel
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tipo de Custo */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Tipo de Custo *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      list="tiposCustoList"
                      value={editingCusto.tipo}
                      onChange={(e) => setEditingCusto({...editingCusto, tipo: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                      placeholder="Digite ou selecione um tipo"
                    />
                    <datalist id="tiposCustoList">
                      {tiposCusto.map(tipo => (
                        <option key={tipo} value={tipo} />
                      ))}
                    </datalist>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    💡 Você pode digitar um novo tipo ou selecionar da lista
                  </p>
                </div>

                {/* Subtipo */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Subtipo / Descrição
                  </label>
                  <input
                    type="text"
                    value={editingCusto.subtipo}
                    onChange={(e) => setEditingCusto({...editingCusto, subtipo: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                    placeholder="Ex: Brinco Amarelo, Botton Eletrônico, RGN..."
                  />
                </div>

                {/* Valor */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Valor (R$) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-semibold">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={editingCusto.valor}
                      onChange={(e) => setEditingCusto({...editingCusto, valor: e.target.value})}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Data */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Data
                  </label>
                  <input
                    type="date"
                    value={editingCusto.data}
                    onChange={(e) => setEditingCusto({...editingCusto, data: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                  />
                </div>

                {/* Observações */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Observações
                  </label>
                  <textarea
                    value={editingCusto.observacoes}
                    onChange={(e) => setEditingCusto({...editingCusto, observacoes: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all resize-none"
                    rows="3"
                    placeholder="Detalhes adicionais sobre o custo..."
                  />
                </div>

                {/* Aplicar a todos */}
                <div className="md:col-span-2">
                  <label className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all">
                    <input
                      type="checkbox"
                      checked={applyToAllCustos}
                      onChange={(e) => setApplyToAllCustos(e.target.checked)}
                      className="mt-0.5 h-5 w-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-amber-900 dark:text-amber-100 block">
                        Aplicar a todos os animais
                      </span>
                      <span className="text-xs text-amber-700 dark:text-amber-300">
                        Esta alteração será aplicada a todos os animais que possuem este mesmo tipo e subtipo de custo
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 rounded-b-2xl flex gap-3">
              <button
                onClick={handleSaveEditCost}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
              >
                💾 Salvar Alterações
              </button>
              <button
                onClick={() => { setShowEditCost(false); setEditingCusto(null); setApplyToAllCustos(false) }}
                className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
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
                            R$ {(Number(custoTotal) || 0).toFixed(2)}
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
                      R$ {(Number(valor) || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                <div className="flex justify-between items-center">
                  <div className="font-bold text-gray-900 dark:text-white">TOTAL GERAL</div>
                  <div className="font-bold text-green-600 dark:text-green-400 text-lg">
                    R$ {((Number(relatorioGeral?.totalGeral) || 0).toFixed(2) || '0,00')}
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
                    R$ {((Number(relatorioGeral?.mediaPorAnimal) || 0).toFixed(2) || '0,00')}
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
                          R$ {(Number(custoTotal) || 0).toFixed(2)}
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