import { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  UserIcon,
  DocumentTextIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import LoteOperacaoDetalhes from './LoteOperacaoDetalhes';

export default function HistoricoLancamentos() {
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLote, setSelectedLote] = useState(null);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [filtros, setFiltros] = useState({
    search: '',
    modulo: '',
    tipo_operacao: '',
    status: '',
    data_inicio: '',
    data_fim: '',
    usuario: ''
  });

  const [showFiltros, setShowFiltros] = useState(false);

  const modulos = [
    'ANIMAIS', 'CONTABILIDADE', 'GESTACAO', 'NASCIMENTOS', 
    'MORTES', 'SEMEN', 'RECEPTORAS', 'TRANSFERENCIAS', 'SISTEMA'
  ];

  const statusOptions = [
    { value: 'concluido', label: 'Concluído', color: 'green' },
    { value: 'pendente', label: 'Pendente', color: 'yellow' },
    { value: 'erro', label: 'Erro', color: 'red' }
  ];

  useEffect(() => {
    fetchLotes();
  }, [pagination.page, pagination.limit, filtros]);

  const fetchLotes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...Object.fromEntries(
          Object.entries(filtros).filter(([_, value]) => value !== '')
        )
      });

      const response = await fetch(`/api/lotes?${params}`);
      if (response.ok) {
        const result = await response.json();
        const data = result.data || result; // Suporte para ambos os formatos
        setLotes(data.lotes || []);
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 0
        }));
        setStats(data.stats || {});
      }
    } catch (error) {
      console.error('Erro ao carregar lotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const limparFiltros = () => {
    setFiltros({
      search: '',
      modulo: '',
      tipo_operacao: '',
      status: '',
      data_inicio: '',
      data_fim: '',
      usuario: ''
    });
  };

  const exportarDados = async () => {
    try {
      const params = new URLSearchParams({
        ...Object.fromEntries(
          Object.entries(filtros).filter(([_, value]) => value !== '')
        ),
        export: 'true'
      });

      const response = await fetch(`/api/lotes/export?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `historico-lotes-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'concluido':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'erro':
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      case 'pendente':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  const handleSelectItem = (loteId) => {
    setSelectedItems(prev => {
      if (prev.includes(loteId)) {
        return prev.filter(id => id !== loteId);
      } else {
        return [...prev, loteId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      setSelectedItems(lotes.map(lote => lote.id));
    }
    setSelectAll(!selectAll);
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) return;

    try {
      const response = await fetch('/api/lotes/delete-multiple', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: selectedItems })
      });

      if (response.ok) {
        // Recarregar dados
        await fetchLotes();
        setSelectedItems([]);
        setSelectAll(false);
        setShowDeleteModal(false);
        
        // Mostrar mensagem de sucesso
        alert(`${selectedItems.length} lotes excluídos com sucesso!`);
      } else {
        throw new Error('Erro ao excluir lotes');
      }
    } catch (error) {
      console.error('Erro ao excluir lotes:', error);
      alert('Erro ao excluir lotes. Tente novamente.');
    }
  };

  const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
      setSelectedItems([]);
      setSelectAll(false);
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'concluido':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'erro':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'pendente':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header com Estatísticas */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Histórico de Lançamentos
          </h2>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowFiltros(!showFiltros)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filtros
            </button>
            <button
              onClick={exportarDados}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors duration-200"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Exportar
            </button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-800/50 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total de Lotes</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {stats.total_lotes?.toLocaleString('pt-BR') || '0'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-800/50 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Concluídos</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {stats.lotes_concluidos?.toLocaleString('pt-BR') || '0'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-100 dark:border-yellow-800">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-800/50 rounded-lg">
                <ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                  {stats.lotes_pendentes?.toLocaleString('pt-BR') || '0'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-800/50 rounded-lg">
                <XCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">Com Erro</p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                  {stats.lotes_erro?.toLocaleString('pt-BR') || '0'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        {showFiltros && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Buscar
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    value={filtros.search}
                    onChange={(e) => handleFiltroChange('search', e.target.value)}
                    placeholder="Número do lote ou descrição..."
                    className="pl-10 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Módulo
                </label>
                <select
                  value={filtros.modulo}
                  onChange={(e) => handleFiltroChange('modulo', e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos os módulos</option>
                  {modulos.map(modulo => (
                    <option key={modulo} value={modulo}>{modulo}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={filtros.status}
                  onChange={(e) => handleFiltroChange('status', e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos os status</option>
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data Início
                </label>
                <input
                  type="date"
                  value={filtros.data_inicio}
                  onChange={(e) => handleFiltroChange('data_inicio', e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data Fim
                </label>
                <input
                  type="date"
                  value={filtros.data_fim}
                  onChange={(e) => handleFiltroChange('data_fim', e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={limparFiltros}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  Limpar Filtros
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Barra de Ações para Seleção Múltipla */}
      {selectedItems.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedItems.length} item(s) selecionado(s)
              </span>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setSelectedItems([]);
                  setSelectAll(false);
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                Cancelar seleção
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                🗑️ Excluir Selecionados
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabela de Lotes */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2">Selecionar</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Lote
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Módulo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Operação
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Data/Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Qtd
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-500">Carregando...</span>
                    </div>
                  </td>
                </tr>
              ) : lotes.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center text-gray-500">
                    Nenhum lote encontrado
                  </td>
                </tr>
              ) : (
                lotes.map((lote) => (
                  <tr 
                    key={lote.id} 
                    onClick={() => setSelectedLote(lote)}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 cursor-pointer ${selectedItems.includes(lote.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(lote.id)}
                        onChange={() => handleSelectItem(lote.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100">
                        {lote.numero_lote}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                        {lote.modulo}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">{lote.tipo_operacao}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">
                        {lote.descricao}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                        <span className="text-sm text-gray-900 dark:text-gray-100">{lote.usuario}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {formatDateTime(lote.data_criacao)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {lote.quantidade_registros?.toLocaleString('pt-BR') || '0'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(lote.status)}
                        <span className={`ml-2 ${getStatusBadge(lote.status)}`}>
                          {lote.status?.toUpperCase() || 'DESCONHECIDO'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedLote(lote)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 flex items-center transition-colors duration-200"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        Detalhes
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {pagination.totalPages > 1 && (
          <div className="bg-white dark:bg-gray-900 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                disabled={pagination.page === pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Próximo
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Mostrando{' '}
                  <span className="font-medium">
                    {((pagination.page - 1) * pagination.limit) + 1}
                  </span>{' '}
                  até{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  de{' '}
                  <span className="font-medium">{pagination.total}</span>{' '}
                  resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => changePage(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  
                  {/* Números das páginas */}
                  {Array.from({ length: Math.min(10, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 10) {
                      pageNum = i + 1;
                    } else {
                      const start = Math.max(1, pagination.page - 5);
                      pageNum = start + i;
                      if (pageNum > pagination.totalPages) return null;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => changePage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors duration-200 ${
                          pagination.page === pageNum
                            ? 'z-10 bg-blue-50 dark:bg-blue-900/50 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-300'
                            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }).filter(Boolean)}
                  
                  <button
                    onClick={() => changePage(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      {selectedLote && (
        <LoteOperacaoDetalhes
          lote={selectedLote}
          onClose={() => setSelectedLote(null)}
        />
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Confirmar Exclusão
                  </h3>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Tem certeza que deseja excluir <strong>{selectedItems.length}</strong> lote(s) selecionado(s)?
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                  ⚠️ Esta ação não pode ser desfeita!
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteSelected}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  🗑️ Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}