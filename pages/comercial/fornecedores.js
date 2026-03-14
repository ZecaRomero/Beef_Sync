import React, { useState, useEffect } from 'react'
import { Card } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { CubeIcon, PlusIcon, CurrencyDollarIcon, DocumentTextIcon, CalendarIcon, XMarkIcon, ArrowDownIcon } from '../../components/ui/Icons'

export default function Suppliers() {
  const [mounted, setMounted] = useState(false)
  const [fornecedores, setFornecedores] = useState([])
  const [loading, setLoading] = useState(false)
  const [showNewSupplier, setShowNewSupplier] = useState(false)
  const [showDetalhes, setShowDetalhes] = useState(false)
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState(null)
  const [notasFornecedor, setNotasFornecedor] = useState([])
  const [loadingNotas, setLoadingNotas] = useState(false)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      loadFornecedores()
    }
  }, [mounted])

  const loadFornecedores = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/comercial/fornecedores-stats')
      if (response.ok) {
        const data = await response.json()
        setFornecedores(data.data || [])
      } else {
        console.error('Erro ao carregar fornecedores')
      }
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadNotasFornecedor = async (nomeFornecedor) => {
    try {
      setLoadingNotas(true)
      const response = await fetch('/api/notas-fiscais')
      if (response.ok) {
        const data = await response.json()
        // Filtrar notas de entrada do fornecedor específico
        const notasFiltradas = (data.data || []).filter(nota => 
          nota.tipo === 'entrada' && 
          nota.fornecedor && 
          nota.fornecedor.toLowerCase() === nomeFornecedor.toLowerCase()
        )
        setNotasFornecedor(notasFiltradas)
      }
    } catch (error) {
      console.error('Erro ao carregar notas:', error)
    } finally {
      setLoadingNotas(false)
    }
  }

  const handleVerDetalhes = async (fornecedor) => {
    setFornecedorSelecionado(fornecedor)
    setShowDetalhes(true)
    await loadNotasFornecedor(fornecedor.nome)
  }

  const fornecedoresFiltrados = fornecedores.filter(f => 
    !busca || 
    f.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (f.cnpj_cpf && f.cnpj_cpf.includes(busca)) ||
    (f.municipio && f.municipio.toLowerCase().includes(busca.toLowerCase()))
  )

  const totalGeral = fornecedores.reduce((sum, f) => sum + (f.valor_total || 0), 0)
  const totalNotas = fornecedores.reduce((sum, f) => sum + (f.total_notas || 0), 0)

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CubeIcon className="h-8 w-8 text-blue-600" />
            Gestão de Fornecedores
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Fornecedores extraídos das notas fiscais de entrada
          </p>
        </div>
        <Button onClick={() => setShowNewSupplier(true)} className="flex items-center gap-2">
          <PlusIcon className="h-5 w-5" />
          Novo Fornecedor
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <CubeIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Fornecedores</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {fornecedores.length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <DocumentTextIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Notas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalNotas}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <CurrencyDollarIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Valor Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                R$ {totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Busca */}
      <Card className="p-4">
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar fornecedor por nome, CNPJ ou município..."
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
      </Card>

      {/* Tabela de Fornecedores */}
      {loading ? (
        <Card className="p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando fornecedores...</p>
        </Card>
      ) : fornecedoresFiltrados.length === 0 ? (
        <Card className="p-12 text-center">
          <CubeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Nenhum fornecedor encontrado
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {busca ? 'Tente ajustar os filtros de busca' : 'Nenhum fornecedor registrado nas notas fiscais'}
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Fornecedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    CNPJ/CPF
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Município
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total de Notas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Valor Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Última Compra
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {fornecedoresFiltrados.map((fornecedor, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {fornecedor.nome}
                          </div>
                          {fornecedor.cadastrado && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Cadastrado
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {fornecedor.cnpj_cpf || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {fornecedor.municipio || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {fornecedor.total_notas || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                      R$ {(fornecedor.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {fornecedor.ultima_compra ? new Date(fornecedor.ultima_compra).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleVerDetalhes(fornecedor)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Ver Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal de Detalhes */}
      {showDetalhes && fornecedorSelecionado && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
              onClick={() => setShowDetalhes(false)}
            ></div>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Detalhes do Fornecedor
                  </h3>
                  <button
                    onClick={() => setShowDetalhes(false)}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Informações Gerais */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Nome
                      </label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {fornecedorSelecionado.nome}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        CNPJ/CPF
                      </label>
                      <p className="text-base text-gray-900 dark:text-white">
                        {fornecedorSelecionado.cnpj_cpf || '-'}
                      </p>
                    </div>
                    {fornecedorSelecionado.endereco && (
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Endereço
                        </label>
                        <p className="text-base text-gray-900 dark:text-white">
                          {fornecedorSelecionado.endereco}
                        </p>
                      </div>
                    )}
                    {fornecedorSelecionado.municipio && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Município/Estado
                        </label>
                        <p className="text-base text-gray-900 dark:text-white">
                          {fornecedorSelecionado.municipio} {fornecedorSelecionado.estado ? `- ${fornecedorSelecionado.estado}` : ''}
                        </p>
                      </div>
                    )}
                    {fornecedorSelecionado.telefone && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Telefone
                        </label>
                        <p className="text-base text-gray-900 dark:text-white">
                          {fornecedorSelecionado.telefone}
                        </p>
                      </div>
                    )}
                    {fornecedorSelecionado.email && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Email
                        </label>
                        <p className="text-base text-gray-900 dark:text-white">
                          {fornecedorSelecionado.email}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Estatísticas */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Estatísticas
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Total de Notas
                        </label>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {fornecedorSelecionado.total_notas || 0}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Valor Total
                        </label>
                        <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                          R$ {(fornecedorSelecionado.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Total de Itens
                        </label>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {fornecedorSelecionado.total_itens || 0}
                        </p>
                      </div>
                      {fornecedorSelecionado.primeira_compra && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Primeira Compra
                          </label>
                          <p className="text-base text-gray-900 dark:text-white">
                            {new Date(fornecedorSelecionado.primeira_compra).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      )}
                      {fornecedorSelecionado.ultima_compra && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Última Compra
                          </label>
                          <p className="text-base text-gray-900 dark:text-white">
                            {new Date(fornecedorSelecionado.ultima_compra).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Histórico de Notas Fiscais */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Histórico de Notas Fiscais ({notasFornecedor.length})
                    </h4>
                    {loadingNotas ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Carregando...</p>
                      </div>
                    ) : notasFornecedor.length === 0 ? (
                      <p className="text-gray-600 dark:text-gray-400">Nenhuma nota fiscal encontrada</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                NF
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                Data
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                Valor
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                Itens
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {notasFornecedor.map((nota) => (
                              <tr key={nota.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                  {nota.numero_nf || nota.numeroNF}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                  {new Date(nota.data || nota.data_compra || nota.created_at).toLocaleDateString('pt-BR')}
                                </td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                                  R$ {(nota.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                  {nota.total_itens || 0}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => setShowDetalhes(false)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Fornecedor - manter funcionalidade existente se necessário */}
    </div>
  )
}
