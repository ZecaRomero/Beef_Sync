import { useState, useEffect } from 'react';
import { 
  ShieldCheckIcon, 
  PlusIcon, 
  DocumentTextIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function ProtocolosSanitarios() {
  const [protocolos, setProtocolos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    tipo: '',
    descricao: '',
    responsavel: '',
    proximaAplicacao: new Date().toISOString().split('T')[0],
    animaisAfetados: '',
    status: 'Ativo',
    observacoes: ''
  });

  useEffect(() => {
    // Carregar protocolos da API ou localStorage
    const loadProtocolos = async () => {
      try {
        // Tentar carregar da API primeiro
        try {
          const response = await fetch('/api/sanidade/protocolos');
          if (response.ok) {
            const data = await response.json();
            const protocolosArray = Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : []);
            setProtocolos(protocolosArray);
            setLoading(false);
            return;
          }
        } catch (apiError) {
          console.warn('API não disponível, usando localStorage:', apiError);
        }

        // Fallback para localStorage
        const existingProtocolos = localStorage.getItem('protocolosSanitarios');
        if (existingProtocolos) {
          try {
            const parsed = JSON.parse(existingProtocolos);
            const protocolosArray = Array.isArray(parsed) ? parsed : [];
            setProtocolos(protocolosArray);
          } catch (parseError) {
            console.error('Erro ao fazer parse do localStorage:', parseError);
            setProtocolos([]);
            localStorage.removeItem('protocolosSanitarios');
          }
        } else {
          setProtocolos([]);
        }
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar protocolos:', error);
        setProtocolos([]);
        setLoading(false);
      }
    };

    loadProtocolos();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Ativo':
        return 'bg-green-100 text-green-800';
      case 'Pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'Inativo':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case 'Vacinação':
        return 'bg-blue-100 text-blue-800';
      case 'Vermifugação':
        return 'bg-purple-100 text-purple-800';
      case 'Exames':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.nome || !formData.tipo || !formData.responsavel) {
      alert('Por favor, preencha os campos obrigatórios (Nome, Tipo e Responsável)');
      return;
    }

    const newProtocolo = {
      id: editingItem ? editingItem.id : Date.now(),
      nome: formData.nome,
      tipo: formData.tipo,
      descricao: formData.descricao,
      responsavel: formData.responsavel,
      proximaAplicacao: formData.proximaAplicacao,
      animaisAfetados: parseInt(formData.animaisAfetados) || 0,
      status: formData.status,
      observacoes: formData.observacoes,
      createdAt: editingItem ? editingItem.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let updatedProtocolos;
    if (editingItem) {
      updatedProtocolos = protocolos.map(item =>
        item.id === editingItem.id ? newProtocolo : item
      );
    } else {
      updatedProtocolos = [...protocolos, newProtocolo];
    }

    setProtocolos(updatedProtocolos);
    localStorage.setItem('protocolosSanitarios', JSON.stringify(updatedProtocolos));
    handleCloseForm();

    const action = editingItem ? 'atualizado' : 'criado';
    alert(`Protocolo ${action} com sucesso!`);
  };

  const handleEdit = (protocolo) => {
    setEditingItem(protocolo);
    setFormData({
      nome: protocolo.nome || '',
      tipo: protocolo.tipo || '',
      descricao: protocolo.descricao || '',
      responsavel: protocolo.responsavel || '',
      proximaAplicacao: protocolo.proximaAplicacao || new Date().toISOString().split('T')[0],
      animaisAfetados: protocolo.animaisAfetados?.toString() || '',
      status: protocolo.status || 'Ativo',
      observacoes: protocolo.observacoes || ''
    });
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({
      nome: '',
      tipo: '',
      descricao: '',
      responsavel: '',
      proximaAplicacao: new Date().toISOString().split('T')[0],
      animaisAfetados: '',
      status: 'Ativo',
      observacoes: ''
    });
  };

  const handleDelete = (id) => {
    if (confirm('Tem certeza que deseja excluir este protocolo?')) {
      const updatedProtocolos = protocolos.filter(item => item.id !== id);
      setProtocolos(updatedProtocolos);
      localStorage.setItem('protocolosSanitarios', JSON.stringify(updatedProtocolos));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando protocolos sanitários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-8 w-8 text-emerald-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Protocolos Sanitários</h1>
                <p className="text-sm text-gray-600">Gerencie os protocolos de saúde do rebanho</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Novo Protocolo
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DocumentTextIcon className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total de Protocolos
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {protocolos.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Protocolos Ativos
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {protocolos.filter(p => p.status === 'Ativo').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CalendarIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pendentes
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {protocolos.filter(p => p.status === 'Pendente').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Animais Cobertos
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {protocolos.reduce((total, p) => total + p.animaisAfetados, 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Protocolos List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Lista de Protocolos
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Protocolos sanitários cadastrados no sistema
            </p>
          </div>
          {protocolos.length === 0 ? (
            <div className="text-center py-12">
              <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum protocolo encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">Comece criando um novo protocolo sanitário.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {protocolos.map((protocolo) => (
                <li key={protocolo.id}>
                  <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <ShieldCheckIcon className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900">
                              {protocolo.nome}
                            </p>
                            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTipoColor(protocolo.tipo)}`}>
                              {protocolo.tipo}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {protocolo.descricao}
                          </p>
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <CalendarIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                            Próxima aplicação: {new Date(protocolo.proximaAplicacao).toLocaleDateString('pt-BR')}
                            <span className="mx-2">•</span>
                            <UserIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                            {protocolo.responsavel}
                            <span className="mx-2">•</span>
                            {protocolo.animaisAfetados} animais
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(protocolo.status)}`}>
                          {protocolo.status}
                        </span>
                        <div className="ml-4 flex-shrink-0 flex gap-2">
                          <button 
                            onClick={() => handleEdit(protocolo)}
                            className="text-emerald-600 hover:text-emerald-900 text-sm font-medium"
                          >
                            Editar
                          </button>
                          <button 
                            onClick={() => handleDelete(protocolo.id)}
                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}