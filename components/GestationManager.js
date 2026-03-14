
import React, { useEffect, useState } from 'react'
import animalDataManager from '../services/animalDataManager'
import DGStatistics from './reports/DGStatistics'

export default function GestationManager() {
  const [receptoras, setReceptoras] = useState([])
  const [gestacoes, setGestacoes] = useState([])
  const [showNewGestacao, setShowNewGestacao] = useState(false)
  const [selectedReceptora, setSelectedReceptora] = useState('')
  const [dadosGestacao, setDadosGestacao] = useState({
    dataInseminacao: '',
    paiSerie: '',
    paiRg: '',
    maeSerie: '',
    maeRg: '',
    previsaoNascimento: '',
    observacoes: ''
  })

  useEffect(() => {
    loadReceptoras()
    loadGestacoes()
  }, [])

  const loadReceptoras = async () => {
    try {
      const animals = await animalDataManager.getAllAnimals()
      const receptorasAtivas = animals.filter(animal => 
        animal.raca === 'Receptora' && animal.situacao === 'Ativo'
      )
      setReceptoras(receptorasAtivas)
    } catch (error) {
      console.error('Erro ao carregar receptoras:', error)
      setReceptoras([])
    }
  }

  const loadGestacoes = async () => {
    try {
      const response = await fetch('/api/gestacoes')
      if (response.ok) {
        const data = await response.json()
        // Garantir que data seja sempre um array
        const gestacoesArray = Array.isArray(data) ? data : (data.data || [])
        setGestacoes(gestacoesArray)
      } else {
        console.error('Erro ao carregar gestações:', response.status)
        setGestacoes([])
      }
    } catch (error) {
      console.error('Erro ao carregar gestações:', error)
      setGestacoes([])
    }
  }

  const calcularDiasGestacao = (dataInseminacao) => {
    if (!dataInseminacao) return 0
    const hoje = new Date()
    const inseminacao = new Date(dataInseminacao)
    const diffTime = hoje - inseminacao
    return Math.floor(diffTime / (1000 * 60 * 60 * 24))
  }

  const calcularPrevisaoNascimento = (dataInseminacao) => {
    if (!dataInseminacao) return ''
    const inseminacao = new Date(dataInseminacao)
    inseminacao.setDate(inseminacao.getDate() + 280) // Gestação bovina ~280 dias
    return inseminacao.toISOString().split('T')[0]
  }

  const handleDataInseminacaoChange = (data) => {
    setDadosGestacao({
      ...dadosGestacao,
      dataInseminacao: data,
      previsaoNascimento: calcularPrevisaoNascimento(data)
    })
  }

  const registrarGestacao = () => {
    if (!selectedReceptora || !dadosGestacao.dataInseminacao) {
      alert('Selecione uma receptora e informe a data de T.E Embrião')
      return
    }

    const receptora = receptoras.find(r => r.id === parseInt(selectedReceptora))
    const novaGestacao = {
      id: (gestacoes || []).length + 1,
      receptoraId: receptora.id,
      receptoraNome: `${receptora.serie} ${receptora.rg}`,
      ...dadosGestacao,
      status: 'Em Gestação',
      isFiv: true,
      custoAcumulado: receptora.custoTotal,
      diasGestacao: calcularDiasGestacao(dadosGestacao.dataInseminacao)
    }

    setGestacoes([...gestacoes, novaGestacao])
    setShowNewGestacao(false)
    setSelectedReceptora('')
    setDadosGestacao({
      dataInseminacao: '',
      paiSerie: '',
      paiRg: '',
      maeSerie: '',
      maeRg: '',
      previsaoNascimento: '',
      observacoes: ''
    })
  }

  const [showNascimentoForm, setShowNascimentoForm] = useState(false)
  const [gestacaoSelecionada, setGestacaoSelecionada] = useState(null)
  const [dadosNascimento, setDadosNascimento] = useState({
    dataNascimento: new Date().toISOString().split('T')[0],
    horaNascimento: '',
    serie: 'CJCJ',
    rg: '',
    tatuagem: '',
    sexo: '',
    peso: '',
    cor: '',
    tipoNascimento: 'Normal',
    observacoes: '',
    custoNascimento: 150.00,
    custoDNA: 120.00, // DNA Paternidade + Genômica
    veterinario: '',
    dificuldadeParto: 'Normal'
  })

  const abrirFormNascimento = (gestacao) => {
    setGestacaoSelecionada(gestacao)
    setDadosNascimento({
      ...dadosNascimento,
      rg: `${Date.now()}`.slice(-6), // RG baseado em timestamp
      tatuagem: `T${Date.now()}`.slice(-8)
    })
    setShowNascimentoForm(true)
  }

  const registrarNascimento = () => {
    const camposFaltando = [];
    
    if (!dadosNascimento.sexo) camposFaltando.push('Sexo');
    if (!dadosNascimento.peso) camposFaltando.push('Peso');
    if (!dadosNascimento.rg) camposFaltando.push('RG');
    
    if (camposFaltando.length > 0) {
      let mensagem = '❌ Campos obrigatórios não preenchidos:\n\n';
      camposFaltando.forEach((campo, index) => {
        mensagem += `${index + 1}. ${campo}\n`;
      });
      mensagem += '\nPor favor, preencha todos os campos obrigatórios antes de registrar o nascimento.';
      alert(mensagem);
      return;
    }

    const gestacao = gestacaoSelecionada
    const custoReceptora = gestacao.custoAcumulado * 0.3 // 30% do custo da receptora
    const custoTotalInicial = dadosNascimento.custoNascimento + dadosNascimento.custoDNA + custoReceptora

    // Criar novo bezerro com dados completos
    const novoBezerro = {
      id: mockAnimals.length + 1,
      serie: dadosNascimento.serie,
      rg: dadosNascimento.rg,
      tatuagem: dadosNascimento.tatuagem,
      sexo: dadosNascimento.sexo,
      raca: 'Nelore', // Padrão para FIV
      dataNascimento: dadosNascimento.dataNascimento,
      horaNascimento: dadosNascimento.horaNascimento,
      peso: parseFloat(dadosNascimento.peso),
      cor: dadosNascimento.cor,
      tipoNascimento: dadosNascimento.tipoNascimento,
      dificuldadeParto: dadosNascimento.dificuldadeParto,
      meses: 0,
      situacao: 'Ativo',
      pai: `${gestacao.paiSerie} ${gestacao.paiRg}`,
      mae: `${gestacao.maeSerie} ${gestacao.maeRg}`,
      receptora: gestacao.receptoraNome,
      isFiv: true,
      custoTotal: custoTotalInicial,
      valorVenda: null,
      valorReal: null,
      veterinario: dadosNascimento.veterinario,
      custos: [
        {
          id: Date.now(),
          tipo: 'Nascimento',
          valor: dadosNascimento.custoNascimento,
          data: dadosNascimento.dataNascimento,
          observacoes: `Nascimento ${dadosNascimento.tipoNascimento} - Peso: ${dadosNascimento.peso}kg - ${dadosNascimento.observacoes}`
        },
        {
          id: Date.now() + 1,
          tipo: 'DNA',
          subtipo: 'Paternidade + Genômica',
          valor: dadosNascimento.custoDNA,
          data: dadosNascimento.dataNascimento,
          observacoes: 'FIV - Confirmação paternidade e análise genômica'
        },
        {
          id: Date.now() + 2,
          tipo: 'Receptora',
          valor: custoReceptora,
          data: dadosNascimento.dataNascimento,
          observacoes: `Rateio 30% da receptora ${gestacao.receptoraNome} (R$ ${gestacao.custoAcumulado.toFixed(2)})`
        }
      ]
    }

    // Atualizar status da gestação
    const gestacoesAtualizadas = (gestacoes || []).map(g => 
      g.id === gestacao.id 
        ? { 
            ...g, 
            status: 'Nascido', 
            dataNascimento: dadosNascimento.dataNascimento,
            bezerroId: novoBezerro.id,
            dadosBezerro: {
              serie: novoBezerro.serie,
              rg: novoBezerro.rg,
              sexo: novoBezerro.sexo,
              peso: novoBezerro.peso
            }
          }
        : g
    )
    setGestacoes(gestacoesAtualizadas)

    // Registrar no sistema centralizado
    const bezerroRegistrado = animalDataManager.registrarNascimento(gestacao, dadosNascimento)
    console.log('Novo bezerro registrado:', bezerroRegistrado)
    
    alert(`✅ Bezerro registrado com sucesso!
    
📋 Dados:
• Identificação: ${novoBezerro.serie} ${novoBezerro.rg}
• Tatuagem: ${novoBezerro.tatuagem}
• Sexo: ${novoBezerro.sexo}
• Peso: ${novoBezerro.peso}kg
• Cor: ${novoBezerro.cor}

💰 Custos Iniciais:
• Nascimento: R$ ${dadosNascimento.custoNascimento.toFixed(2)}
• DNA: R$ ${dadosNascimento.custoDNA.toFixed(2)}
• Receptora (30%): R$ ${custoReceptora.toFixed(2)}
• Total: R$ ${custoTotalInicial.toFixed(2)}`)

    // Resetar formulário
    setShowNascimentoForm(false)
    setGestacaoSelecionada(null)
    setDadosNascimento({
      dataNascimento: new Date().toISOString().split('T')[0],
      horaNascimento: '',
      serie: 'CJCJ',
      rg: '',
      tatuagem: '',
      sexo: '',
      peso: '',
      cor: '',
      tipoNascimento: 'Normal',
      observacoes: '',
      custoNascimento: 150.00,
      custoDNA: 120.00,
      veterinario: '',
      dificuldadeParto: 'Normal'
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Em Gestação': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'Nascido': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'Atrasado': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getDiasRestantes = (previsaoNascimento) => {
    if (!previsaoNascimento) return 0
    const hoje = new Date()
    const previsao = new Date(previsaoNascimento)
    const diffTime = previsao - hoje
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas de Diagnóstico de Gestação */}
      <DGStatistics />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            🐄 Gestão de Gestações
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Controle de receptoras, gestações e nascimentos FIV
          </p>
        </div>
        <button
          onClick={() => setShowNewGestacao(true)}
          className="btn-primary flex items-center"
        >
          ➕ Nova Gestação
        </button>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {(gestacoes || []).filter(g => g.status === 'Em Gestação').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Em Gestação</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {(gestacoes || []).filter(g => g.status === 'Nascido').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Nascidos</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {receptoras.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Receptoras Ativas</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            R$ {gestacoes.reduce((acc, g) => acc + (parseFloat(g.custoAcumulado || g.custo_acumulado) || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Investimento Total</div>
        </div>
      </div>

      {/* Lista de Gestações */}
      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Gestações em Andamento
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {(gestacoes || []).map((gestacao) => {
              const diasRestantes = getDiasRestantes(gestacao.previsaoNascimento)
              const diasGestacao = calcularDiasGestacao(gestacao.dataInseminacao)
              const progressoGestacao = Math.min((diasGestacao / 280) * 100, 100)

              return (
                <div
                  key={gestacao.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">🐄</div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          Receptora: {gestacao.receptoraNome}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Pai: {gestacao.paiSerie} {gestacao.paiRg} • Mãe: {gestacao.maeSerie} {gestacao.maeRg}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(gestacao.status)}`}>
                        {gestacao.status}
                      </span>
                      {gestacao.status === 'Em Gestação' && (
                        <button
                          onClick={() => abrirFormNascimento(gestacao)}
                          className="btn-success text-sm"
                        >
                          🍼 Registrar Nascimento
                        </button>
                      )}
                    </div>
                  </div>

                  {gestacao.status === 'Em Gestação' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Progresso da Gestação: {diasGestacao}/280 dias
                        </span>
                        <span className={`font-medium ${
                          diasRestantes > 0 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {diasRestantes > 0 
                            ? `${diasRestantes} dias restantes` 
                            : `${Math.abs(diasRestantes)} dias atrasado`
                          }
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${progressoGestacao}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600 dark:text-gray-400">T.E Embrião</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {gestacao.dataInseminacao 
                          ? new Date(gestacao.dataInseminacao).toLocaleDateString('pt-BR')
                          : 'Não informado'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600 dark:text-gray-400">Previsão Nascimento</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {gestacao.previsaoNascimento 
                          ? new Date(gestacao.previsaoNascimento).toLocaleDateString('pt-BR')
                          : 'Não informado'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600 dark:text-gray-400">Custo Acumulado</div>
                      <div className="font-medium text-red-600 dark:text-red-400">
                        R$ {(gestacao.custoAcumulado || gestacao.custo_acumulado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600 dark:text-gray-400">Tipo</div>
                      <div className="font-medium text-purple-600 dark:text-purple-400">
                        {gestacao.isFiv || gestacao.is_fiv ? 'FIV' : 'Natural'}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Modal Nova Gestação */}
      {showNewGestacao && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Registrar Nova Gestação
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Receptora
                </label>
                <select
                  value={selectedReceptora}
                  onChange={(e) => setSelectedReceptora(e.target.value)}
                  className="input-field"
                >
                  <option value="">Selecione uma receptora</option>
                  {receptoras.map((receptora) => (
                    <option key={receptora.id} value={receptora.id}>
                      {receptora.serie} {receptora.rg} - R$ {(parseFloat(receptora.custoTotal || receptora.custo_total) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data da T.E Embrião
                  </label>
                  <input
                    type="date"
                    value={dadosGestacao.dataInseminacao}
                    onChange={(e) => handleDataInseminacaoChange(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Previsão Nascimento
                  </label>
                  <input
                    type="date"
                    value={dadosGestacao.previsaoNascimento}
                    readOnly
                    className="input-field bg-gray-100 dark:bg-gray-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pai - Série
                  </label>
                  <input
                    type="text"
                    value={dadosGestacao.paiSerie}
                    onChange={(e) => setDadosGestacao({...dadosGestacao, paiSerie: e.target.value})}
                    placeholder="Série Mãe"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pai - RG
                  </label>
                  <input
                    type="text"
                    value={dadosGestacao.paiRg}
                    onChange={(e) => setDadosGestacao({...dadosGestacao, paiRg: e.target.value})}
                    placeholder="Ex: 100001"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mãe - Série
                  </label>
                  <input
                    type="text"
                    value={dadosGestacao.maeSerie}
                    onChange={(e) => setDadosGestacao({...dadosGestacao, maeSerie: e.target.value})}
                    placeholder="Ex: BENT"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mãe - RG
                  </label>
                  <input
                    type="text"
                    value={dadosGestacao.maeRg}
                    onChange={(e) => setDadosGestacao({...dadosGestacao, maeRg: e.target.value})}
                    placeholder="Ex: 200001"
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Observações
                </label>
                <textarea
                  value={dadosGestacao.observacoes}
                  onChange={(e) => setDadosGestacao({...dadosGestacao, observacoes: e.target.value})}
                  rows={3}
                  className="input-field"
                  placeholder="Observações sobre a gestação..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => setShowNewGestacao(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={registrarGestacao}
                className="btn-primary"
              >
                Registrar Gestação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Registrar Nascimento */}
      {showNascimentoForm && gestacaoSelecionada && (
        <div className="modal-overlay">
          <div className="modal-content max-w-4xl">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                🍼 Registrar Nascimento - {gestacaoSelecionada.receptoraNome}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Pai: {gestacaoSelecionada.paiSerie} {gestacaoSelecionada.paiRg} • 
                Mãe: {gestacaoSelecionada.maeSerie} {gestacaoSelecionada.maeRg}
              </p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Dados Básicos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white border-b pb-2">
                    📋 Dados Básicos do Bezerro
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Data de Nascimento *
                      </label>
                      <input
                        type="date"
                        value={dadosNascimento.dataNascimento}
                        onChange={(e) => setDadosNascimento({...dadosNascimento, dataNascimento: e.target.value})}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Hora do Nascimento
                      </label>
                      <input
                        type="time"
                        value={dadosNascimento.horaNascimento}
                        onChange={(e) => setDadosNascimento({...dadosNascimento, horaNascimento: e.target.value})}
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Série *
                      </label>
                      <select
                        value={dadosNascimento.serie}
                        onChange={(e) => setDadosNascimento({...dadosNascimento, serie: e.target.value})}
                        className="input-field"
                      >
                        <option value="CJCJ">CJCJ (Nelore)</option>
                        <option value="BENT">BENT (Brahman)</option>
                        <option value="CJCG">CJCG (Gir)</option>
                        <option value="PA">PA (Nelore PA)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        RG *
                      </label>
                      <input
                        type="text"
                        value={dadosNascimento.rg}
                        onChange={(e) => setDadosNascimento({...dadosNascimento, rg: e.target.value})}
                        className="input-field"
                        placeholder="Ex: 123456"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tatuagem
                    </label>
                    <input
                      type="text"
                      value={dadosNascimento.tatuagem}
                      onChange={(e) => setDadosNascimento({...dadosNascimento, tatuagem: e.target.value})}
                      className="input-field"
                      placeholder="Ex: T123456"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Sexo *
                      </label>
                      <select
                        value={dadosNascimento.sexo}
                        onChange={(e) => setDadosNascimento({...dadosNascimento, sexo: e.target.value})}
                        className="input-field"
                      >
                        <option value="">Selecione</option>
                        <option value="Macho">🐂 Macho</option>
                        <option value="Fêmea">🐄 Fêmea</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Peso (kg) *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={dadosNascimento.peso}
                        onChange={(e) => setDadosNascimento({...dadosNascimento, peso: e.target.value})}
                        className="input-field"
                        placeholder="Ex: 32.5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cor/Pelagem
                    </label>
                    <select
                      value={dadosNascimento.cor}
                      onChange={(e) => setDadosNascimento({...dadosNascimento, cor: e.target.value})}
                      className="input-field"
                    >
                      <option value="">Selecione a cor</option>
                      <option value="Branco">Branco</option>
                      <option value="Cinza">Cinza</option>
                      <option value="Vermelho">Vermelho</option>
                      <option value="Preto">Preto</option>
                      <option value="Amarelo">Amarelo</option>
                      <option value="Malhado">Malhado</option>
                      <option value="Baio">Baio</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white border-b pb-2">
                    🏥 Dados do Parto
                  </h4>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tipo de Nascimento
                    </label>
                    <select
                      value={dadosNascimento.tipoNascimento}
                      onChange={(e) => setDadosNascimento({...dadosNascimento, tipoNascimento: e.target.value})}
                      className="input-field"
                    >
                      <option value="Normal">Normal</option>
                      <option value="Assistido">Assistido</option>
                      <option value="Cesariana">Cesariana</option>
                      <option value="Complicado">Complicado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Dificuldade do Parto
                    </label>
                    <select
                      value={dadosNascimento.dificuldadeParto}
                      onChange={(e) => setDadosNascimento({...dadosNascimento, dificuldadeParto: e.target.value})}
                      className="input-field"
                    >
                      <option value="Normal">Normal</option>
                      <option value="Leve">Leve</option>
                      <option value="Moderada">Moderada</option>
                      <option value="Severa">Severa</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Veterinário Responsável
                    </label>
                    <input
                      type="text"
                      value={dadosNascimento.veterinario}
                      onChange={(e) => setDadosNascimento({...dadosNascimento, veterinario: e.target.value})}
                      className="input-field"
                      placeholder="Nome do veterinário"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Observações do Nascimento
                    </label>
                    <textarea
                      value={dadosNascimento.observacoes}
                      onChange={(e) => setDadosNascimento({...dadosNascimento, observacoes: e.target.value})}
                      rows={4}
                      className="input-field"
                      placeholder="Observações sobre o parto, condições do bezerro, etc..."
                    />
                  </div>
                </div>
              </div>

              {/* Custos */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                  💰 Custos do Nascimento
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Custo do Nascimento (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={dadosNascimento.custoNascimento}
                      onChange={(e) => setDadosNascimento({...dadosNascimento, custoNascimento: parseFloat(e.target.value) || 0})}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Custo DNA (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={dadosNascimento.custoDNA}
                      onChange={(e) => setDadosNascimento({...dadosNascimento, custoDNA: parseFloat(e.target.value) || 0})}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Rateio Receptora (30%)
                    </label>
                    <input
                      type="text"
                      value={`R$ ${(gestacaoSelecionada.custoAcumulado * 0.3).toFixed(2)}`}
                      readOnly
                      className="input-field bg-gray-100 dark:bg-gray-600"
                    />
                  </div>
                </div>

                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900 dark:text-white">
                      Custo Total Inicial:
                    </span>
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      R$ {(dadosNascimento.custoNascimento + dadosNascimento.custoDNA + (gestacaoSelecionada.custoAcumulado * 0.3)).toFixed(2)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Este será o custo inicial do bezerro, incluindo rateio da receptora
                  </div>
                </div>
              </div>

              {/* Preview dos Dados */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                  👁️ Preview do Registro
                </h4>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Identificação:</span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {dadosNascimento.serie} {dadosNascimento.rg}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Sexo/Peso:</span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {dadosNascimento.sexo} • {dadosNascimento.peso}kg
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Cor:</span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {dadosNascimento.cor || 'Não informada'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Tipo FIV:</span>
                      <div className="font-medium text-purple-600 dark:text-purple-400">
                        Sim
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowNascimentoForm(false)
                  setGestacaoSelecionada(null)
                }}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={registrarNascimento}
                className="btn-success flex items-center"
                disabled={!dadosNascimento.sexo || !dadosNascimento.peso || !dadosNascimento.rg}
              >
                🍼 Registrar Nascimento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}