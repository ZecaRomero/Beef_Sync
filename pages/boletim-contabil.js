
import React, { useEffect, useState } from 'react'

import { useRouter } from 'next/router'
import { 
  DocumentTextIcon, 
  ArrowDownTrayIcon,
  PaperAirplaneIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  PlusIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import boletimContabilService from '../services/boletimContabilService'

export default function BoletimContabil() {
  const router = useRouter()
  const [boletimAtual, setBoletimAtual] = useState(null)
  const [boletins, setBoletins] = useState([])
  const [periodoSelecionado, setPeriodoSelecionado] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('resumo')
  const [showExportModal, setShowExportModal] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [localidadeBoletim, setLocalidadeBoletim] = useState('')
  const [salvandoLocalidade, setSalvandoLocalidade] = useState(false)

  useEffect(() => {
    loadBoletimAtual()
    loadBoletins()
  }, [])

  const loadBoletimAtual = async () => {
    try {
      setIsLoading(true)
      const boletim = await boletimContabilService.inicializarBoletim()
      setBoletimAtual(boletim)
      setPeriodoSelecionado(boletim.periodo)
      
      // Buscar localidade do boletim da API
      try {
        const response = await fetch(`/api/boletim-contabil?periodo=${boletim.periodo}`)
        if (response.ok) {
          const data = await response.json()
          if (data.data && data.data.boletim) {
            setLocalidadeBoletim(data.data.boletim.localidade || '')
          }
        }
      } catch (error) {
        console.error('Erro ao buscar localidade:', error)
      }
    } catch (error) {
      console.error('Erro ao carregar boletim atual:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const salvarLocalidade = async () => {
    if (!periodoSelecionado) return
    
    setSalvandoLocalidade(true)
    try {
      const response = await fetch('/api/boletim-contabil', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          periodo: periodoSelecionado,
          localidade: localidadeBoletim || null
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          alert('Localidade salva com sucesso!')
          // Atualizar lista de boletins
          loadBoletins()
        }
      } else {
        throw new Error('Erro ao salvar localidade')
      }
    } catch (error) {
      console.error('Erro ao salvar localidade:', error)
      alert('Erro ao salvar localidade')
    } finally {
      setSalvandoLocalidade(false)
    }
  }

  const loadBoletins = async () => {
    try {
      // Tentar buscar da API primeiro
      const response = await fetch('/api/boletim-contabil')
      if (response.ok) {
        const data = await response.json()
        const lista = data.success && data.data ? data.data : (Array.isArray(data) ? data : [])
        setBoletins(lista)
      } else {
        // Fallback para localStorage
        const listaBoletins = await boletimContabilService.listarBoletins()
        setBoletins(listaBoletins)
      }
    } catch (error) {
      console.error('Erro ao carregar boletins:', error)
      // Fallback para localStorage
      const listaBoletins = await boletimContabilService.listarBoletins()
      setBoletins(listaBoletins)
    }
  }

  const handlePeriodoChange = async (periodo) => {
    // Buscar localidade do boletim selecionado
    try {
      const response = await fetch(`/api/boletim-contabil?periodo=${periodo}`)
      if (response.ok) {
        const data = await response.json()
        if (data.data && data.data.boletim) {
          setLocalidadeBoletim(data.data.boletim.localidade || '')
        } else {
          setLocalidadeBoletim('')
        }
      }
    } catch (error) {
      console.error('Erro ao buscar localidade:', error)
      setLocalidadeBoletim('')
    }
    if (periodo === periodoSelecionado) return
    
    try {
      setIsLoading(true)
      const boletim = await boletimContabilService.inicializarBoletim(periodo)
      setBoletimAtual(boletim)
      setPeriodoSelecionado(periodo)
    } catch (error) {
      console.error('Erro ao carregar boletim:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const sincronizarOperacoes = async () => {
    try {
      setIsLoading(true)
      await boletimContabilService.sincronizarOperacoesExistentes()
      await loadBoletimAtual()
      await loadBoletins()
      alert('✅ Sincronização concluída com sucesso!')
    } catch (error) {
      console.error('Erro na sincronização:', error)
      alert('❌ Erro na sincronização. Verifique o console.')
    } finally {
      setIsLoading(false)
    }
  }

  const exportarBoletim = async (formato) => {
    try {
      const dados = await boletimContabilService.exportarParaContabilidade(periodoSelecionado, formato)
      
      if (formato === 'csv') {
        const blob = new Blob([dados], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `boletim-contabil-${periodoSelecionado}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
      } else {
        const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `boletim-contabil-${periodoSelecionado}.json`
        a.click()
        window.URL.revokeObjectURL(url)
      }
      
      alert(`✅ Boletim exportado em formato ${formato.toUpperCase()}!`)
    } catch (error) {
      console.error('Erro ao exportar:', error)
      alert('❌ Erro ao exportar boletim')
    }
  }

  const fecharBoletim = async () => {
    if (!confirm('Tem certeza que deseja fechar este boletim? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      await boletimContabilService.fecharBoletim(periodoSelecionado)
      await loadBoletimAtual()
      await loadBoletins()
      alert('✅ Boletim fechado com sucesso!')
    } catch (error) {
      console.error('Erro ao fechar boletim:', error)
      alert('❌ Erro ao fechar boletim')
    }
  }

  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando boletim contábil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Boletim Contábil</h1>
              <p className="text-gray-600">Controle automático das operações financeiras dos animais</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={sincronizarOperacoes}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Sincronizar
              </button>
              <button
                onClick={() => setShowExportModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                Exportar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Seletor de Período */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4 flex-1 min-w-[200px]">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Período</label>
                <select
                  value={periodoSelecionado}
                  onChange={(e) => handlePeriodoChange(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  {boletins.map(boletim => (
                    <option key={boletim.periodo} value={boletim.periodo}>
                      {boletim.periodo} - {boletim.status === 'fechado' ? 'Fechado' : 'Aberto'}
                      {boletim.localidade ? ` - ${boletim.localidade}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center space-x-4 flex-1 min-w-[300px]">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Localidade (Pardinho/Rancharia)</label>
                <div className="flex items-center space-x-2 mt-1">
                  <select
                    value={localidadeBoletim}
                    onChange={(e) => setLocalidadeBoletim(e.target.value)}
                    className="flex-1 block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="">Selecione...</option>
                    <option value="Pardinho">Pardinho</option>
                    <option value="Rancharia">Rancharia</option>
                  </select>
                  <button
                    onClick={salvarLocalidade}
                    disabled={salvandoLocalidade || !periodoSelecionado}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium whitespace-nowrap"
                  >
                    {salvandoLocalidade ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
                {localidadeBoletim && (
                  <p className="mt-1 text-xs text-blue-600 font-medium">
                    📍 Gado entrará em: <strong>{localidadeBoletim}</strong>
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {boletimAtual?.status === 'fechado' ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <XCircleIcon className="h-3 w-3 mr-1" />
                  Fechado
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircleIcon className="h-3 w-3 mr-1" />
                  Aberto
                </span>
              )}
              {boletimAtual?.status === 'aberto' && (
                <button
                  onClick={fecharBoletim}
                  className="inline-flex items-center px-3 py-1.5 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                >
                  Fechar Boletim
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Resumo Financeiro */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Entradas</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatarValor(boletimAtual?.resumo.totalEntradas || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Saídas</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatarValor(boletimAtual?.resumo.totalSaidas || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Custos</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatarValor(boletimAtual?.resumo.totalCustos || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className={`h-8 w-8 ${(boletimAtual?.resumo.saldoPeriodo || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Saldo do Período</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatarValor(boletimAtual?.resumo.saldoPeriodo || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs de Navegação */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'resumo', name: 'Resumo', icon: ChartBarIcon },
                { id: 'entradas', name: 'Entradas', icon: ArrowDownTrayIcon },
                { id: 'saidas', name: 'Saídas', icon: ArrowDownTrayIcon },
                { id: 'custos', name: 'Custos', icon: CurrencyDollarIcon },
                { id: 'receitas', name: 'Receitas', icon: CurrencyDollarIcon }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4 inline mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Conteúdo das Tabs */}
          <div className="p-6">
            {activeTab === 'resumo' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Resumo do Período</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Entradas</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Nascimentos:</span>
                        <span className="text-sm font-medium">{boletimAtual?.entradas.nascimentos.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Compras:</span>
                        <span className="text-sm font-medium">{boletimAtual?.entradas.compras.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Outras:</span>
                        <span className="text-sm font-medium">{boletimAtual?.entradas.outrasEntradas.length || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Saídas</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Vendas:</span>
                        <span className="text-sm font-medium">{boletimAtual?.saidas.vendas.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Mortes:</span>
                        <span className="text-sm font-medium">{boletimAtual?.saidas.mortes.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Outras:</span>
                        <span className="text-sm font-medium">{boletimAtual?.saidas.outrasSaidas.length || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'entradas' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Entradas do Período</h3>
                
                {/* Compras */}
                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-3">Compras ({boletimAtual?.entradas.compras.length || 0})</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Animal</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fornecedor</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NF</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {boletimAtual?.entradas.compras.map((item) => (
                          <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatarData(item.data)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.animal.serie} {item.animal.rg} - {item.animal.sexo}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatarValor(item.valor)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.fornecedor || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.notaFiscal || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Nascimentos */}
                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-3">Nascimentos ({boletimAtual?.entradas.nascimentos.length || 0})</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Animal</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observações</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {boletimAtual?.entradas.nascimentos.map((item) => (
                          <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatarData(item.data)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.animal.serie} {item.animal.rg} - {item.animal.sexo}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatarValor(item.valor)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {item.observacoes}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'saidas' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Saídas do Período</h3>
                
                {/* Vendas */}
                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-3">Vendas ({boletimAtual?.saidas.vendas.length || 0})</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Animal</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comprador</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {boletimAtual?.saidas.vendas.map((item) => (
                          <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatarData(item.data)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.animal.serie} {item.animal.rg} - {item.animal.sexo}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatarValor(item.valor)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.comprador || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mortes */}
                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-3">Mortes ({boletimAtual?.saidas.mortes.length || 0})</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Animal</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Causa</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Perda</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {boletimAtual?.saidas.mortes.map((item) => (
                          <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatarData(item.data)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.animal.serie} {item.animal.rg} - {item.animal.sexo}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.causa}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatarValor(item.valor)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'custos' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Custos do Período ({boletimAtual?.custos.length || 0})</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Animal</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observações</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {boletimAtual?.custos.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatarData(item.data)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.tipo} {item.subtipo && `- ${item.subtipo}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.animal ? `${item.animal.serie} ${item.animal.rg}` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatarValor(item.valor)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.observacoes}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'receitas' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Receitas do Período ({boletimAtual?.receitas.length || 0})</h3>
                <div className="text-center py-12 text-gray-500">
                  <CurrencyDollarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhuma receita registrada neste período</p>
                  <p className="text-sm">As receitas serão registradas automaticamente conforme as operações</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Exportação */}
      {showExportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Exportar Boletim</h3>
              <div className="space-y-3">
                <button
                  onClick={() => exportarBoletim('json')}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  Exportar JSON
                </button>
                <button
                  onClick={() => exportarBoletim('csv')}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  Exportar CSV
                </button>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
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
