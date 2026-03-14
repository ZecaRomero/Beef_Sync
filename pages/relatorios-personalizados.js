
import React, { useEffect, useState } from 'react'

import { 
  ChartBarIcon,
  DocumentTextIcon,
  TableCellsIcon,
  DocumentArrowDownIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  PrinterIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon
} from '../components/ui/Icons'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Toast from '../components/ui/SimpleToast'

export default function RelatoriosPersonalizados() {
  const [relatorios, setRelatorios] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingRelatorio, setEditingRelatorio] = useState(null)
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    tipo: 'animais',
    parametros: {},
    campos_exibicao: [],
    filtros: {},
    agrupamento: {},
    ordenacao: {}
  })

  const tiposRelatorio = [
    { value: 'animais', label: 'Animais', icon: '🐄' },
    { value: 'reprodutivo', label: 'Reprodutivo', icon: '🐄' },
    { value: 'financeiro', label: 'Financeiro', icon: '💰' },
    { value: 'estoque', label: 'Estoque', icon: '📦' },
    { value: 'customizado', label: 'Customizado', icon: '⚙️' }
  ]

  const camposDisponiveis = {
    animais: [
      { campo: 'serie', label: 'Série', tipo: 'texto' },
      { campo: 'rg', label: 'RG', tipo: 'texto' },
      { campo: 'raca', label: 'Raça', tipo: 'texto' },
      { campo: 'data_nascimento', label: 'Data de Nascimento', tipo: 'data' },
      { campo: 'situacao', label: 'Situação', tipo: 'texto' },
      { campo: 'custo_aquisicao', label: 'Custo de Aquisição', tipo: 'numero' },
      { campo: 'custo_total', label: 'Custo Total', tipo: 'numero' },
      { campo: 'valor_venda', label: 'Valor de Venda', tipo: 'numero' }
    ],
    reprodutivo: [
      { campo: 'numero_te', label: 'Número TE', tipo: 'texto' },
      { campo: 'data_te', label: 'Data TE', tipo: 'data' },
      { campo: 'receptora', label: 'Receptora', tipo: 'texto' },
      { campo: 'doadora', label: 'Doadora', tipo: 'texto' },
      { campo: 'touro', label: 'Touro', tipo: 'texto' },
      { campo: 'resultado', label: 'Resultado', tipo: 'texto' },
      { campo: 'status', label: 'Status', tipo: 'texto' }
    ],
    financeiro: [
      { campo: 'animal', label: 'Animal', tipo: 'texto' },
      { campo: 'custo_aquisicao', label: 'Custo Aquisição', tipo: 'numero' },
      { campo: 'custo_total', label: 'Custo Total', tipo: 'numero' },
      { campo: 'valor_venda', label: 'Valor Venda', tipo: 'numero' },
      { campo: 'lucro', label: 'Lucro', tipo: 'numero' },
      { campo: 'roi', label: 'ROI (%)', tipo: 'numero' }
    ],
    estoque: [
      { campo: 'touro', label: 'Touro', tipo: 'texto' },
      { campo: 'raca', label: 'Raça', tipo: 'texto' },
      { campo: 'quantidade', label: 'Quantidade', tipo: 'numero' },
      { campo: 'preco_unitario', label: 'Preço Unitário', tipo: 'numero' },
      { campo: 'valor_total', label: 'Valor Total', tipo: 'numero' }
    ]
  }

  useEffect(() => {
    loadRelatorios()
  }, [])

  const loadRelatorios = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/relatorios-personalizados')
      if (response.ok) {
        const data = await response.json()
        setRelatorios(data)
      }
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error)
      Toast.error('Erro ao carregar relatórios')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      
      const url = editingRelatorio 
        ? `/api/relatorios-personalizados?id=${editingRelatorio.id}`
        : '/api/relatorios-personalizados'
      
      const method = editingRelatorio ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        Toast.success(editingRelatorio ? 'Relatório atualizado!' : 'Relatório criado!')
        setShowModal(false)
        setEditingRelatorio(null)
        resetForm()
        loadRelatorios()
      } else {
        const error = await response.json()
        Toast.error(error.message || 'Erro ao salvar relatório')
      }
    } catch (error) {
      console.error('Erro ao salvar relatório:', error)
      Toast.error('Erro ao salvar relatório')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este relatório?')) return

    try {
      const response = await fetch(`/api/relatorios-personalizados?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        Toast.success('Relatório excluído!')
        loadRelatorios()
      } else {
        Toast.error('Erro ao excluir relatório')
      }
    } catch (error) {
      console.error('Erro ao excluir relatório:', error)
      Toast.error('Erro ao excluir relatório')
    }
  }

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      tipo: 'animais',
      parametros: {},
      campos_exibicao: [],
      filtros: {},
      agrupamento: {},
      ordenacao: {}
    })
  }

  const addCampoExibicao = (campo) => {
    if (!formData.campos_exibicao.includes(campo)) {
      setFormData(prev => ({
        ...prev,
        campos_exibicao: [...prev.campos_exibicao, campo]
      }))
    }
  }

  const removeCampoExibicao = (campo) => {
    setFormData(prev => ({
      ...prev,
      campos_exibicao: prev.campos_exibicao.filter(c => c !== campo)
    }))
  }

  const gerarRelatorio = async (relatorio) => {
    try {
      setLoading(true)
      
      // Gerar relatório em formato JSON (visualização)
      const response = await fetch('/api/relatorios-personalizados/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          relatorioId: relatorio.id,
          formato: 'json'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao gerar relatório')
      }

      const data = await response.json()
      
      // Abrir modal ou mostrar dados do relatório
      console.log('Relatório gerado:', data)
      Toast.success(`Relatório "${relatorio.nome}" gerado com sucesso! Total: ${data.total} registros`)
      
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
      Toast.error(error.message || 'Erro ao gerar relatório')
    } finally {
      setLoading(false)
    }
  }

  const exportarRelatorio = async (relatorio) => {
    try {
      setLoading(true)
      
      // Exportar relatório em formato Excel
      const response = await fetch('/api/relatorios-personalizados/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          relatorioId: relatorio.id,
          formato: 'xlsx'
        })
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Erro ao exportar relatório' }))
        throw new Error(error.message || 'Erro ao exportar relatório')
      }

      // Obter o blob do arquivo Excel
      const blob = await response.blob()
      
      // Criar URL temporária e fazer download
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      // Obter nome do arquivo do header Content-Disposition ou usar nome padrão
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `relatorio-${relatorio.nome}-${new Date().toISOString().split('T')[0]}.xlsx`
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }
      
      a.download = filename
      document.body.appendChild(a)
      a.click()
      
      // Limpar
      setTimeout(() => {
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }, 100)
      
      Toast.success(`Relatório "${relatorio.nome}" exportado com sucesso!`)
      
    } catch (error) {
      console.error('Erro ao exportar relatório:', error)
      Toast.error(error.message || 'Erro ao exportar relatório')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Relatórios Personalizados
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Crie e gerencie relatórios personalizados do sistema
          </p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Novo Relatório</span>
        </Button>
      </div>

      {/* Grid de Relatórios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        ) : (
          relatorios.map((relatorio) => {
            const tipoInfo = tiposRelatorio.find(t => t.value === relatorio.tipo)
            return (
              <div
                key={relatorio.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{tipoInfo?.icon}</div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {relatorio.nome}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {tipoInfo?.label}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => {
                        setEditingRelatorio(relatorio)
                        setFormData({
                          nome: relatorio.nome,
                          descricao: relatorio.descricao || '',
                          tipo: relatorio.tipo,
                          parametros: relatorio.parametros || {},
                          campos_exibicao: relatorio.campos_exibicao || [],
                          filtros: relatorio.filtros || {},
                          agrupamento: relatorio.agrupamento || {},
                          ordenacao: relatorio.ordenacao || {}
                        })
                        setShowModal(true)
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(relatorio.id)}
                      className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {relatorio.descricao && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {relatorio.descricao}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  {Array.isArray(relatorio.campos_exibicao) ? (
                    <>
                      {relatorio.campos_exibicao.slice(0, 3).map((campo, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        >
                          {campo}
                        </span>
                      ))}
                      {relatorio.campos_exibicao.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                          +{relatorio.campos_exibicao.length - 3} mais
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Nenhum campo selecionado</span>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={() => gerarRelatorio(relatorio)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={loading}
                  >
                    <ChartBarIcon className="h-4 w-4 mr-1" />
                    Gerar
                  </Button>
                  <Button
                    onClick={() => exportarRelatorio(relatorio)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={loading}
                  >
                    <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                    Exportar
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal de Criação/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {editingRelatorio ? 'Editar Relatório' : 'Novo Relatório Personalizado'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setEditingRelatorio(null)
                    resetForm()
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <span className="sr-only">Fechar</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informações Básicas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nome do Relatório *
                    </label>
                    <Input
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Ex: Relatório de Animais por Raça"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tipo *
                    </label>
                    <select
                      value={formData.tipo}
                      onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value, campos_exibicao: [] }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    >
                      {tiposRelatorio.map(tipo => (
                        <option key={tipo.value} value={tipo.value}>
                          {tipo.icon} {tipo.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Descreva o propósito deste relatório..."
                  />
                </div>

                {/* Campos de Exibição */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Campos de Exibição
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                    {camposDisponiveis[formData.tipo]?.map((campo) => (
                      <button
                        key={campo.campo}
                        type="button"
                        onClick={() => addCampoExibicao(campo.campo)}
                        disabled={formData.campos_exibicao.includes(campo.campo)}
                        className={`p-2 text-sm rounded-md border transition-colors ${
                          formData.campos_exibicao.includes(campo.campo)
                            ? 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200'
                            : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                      >
                        {campo.label}
                      </button>
                    ))}
                  </div>
                  
                  {formData.campos_exibicao.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.campos_exibicao.map((campo, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        >
                          {camposDisponiveis[formData.tipo]?.find(c => c.campo === campo)?.label}
                          <button
                            type="button"
                            onClick={() => removeCampoExibicao(campo)}
                            className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowModal(false)
                      setEditingRelatorio(null)
                      resetForm()
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? <LoadingSpinner size="sm" /> : (editingRelatorio ? 'Atualizar' : 'Criar')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
