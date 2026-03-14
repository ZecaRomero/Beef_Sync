
import React, { useEffect, useState } from 'react'

import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

export default function ServicosManager() {
  const [servicos, setServicos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingServico, setEditingServico] = useState(null)
  const [formData, setFormData] = useState({
    nome: '',
    categoria: '',
    valor_padrao: '',
    aplicavel_macho: true,
    aplicavel_femea: true,
    descricao: '',
    ativo: true
  })

  useEffect(() => {
    loadServicos()
    loadCategorias()
  }, [])

  const loadServicos = async () => {
    try {
      const response = await fetch('/api/servicos')
      if (response.ok) {
        const data = await response.json()
        setServicos(data)
      }
    } catch (error) {
      console.error('Erro ao carregar serviços:', error)
    }
  }

  const loadCategorias = async () => {
    try {
      const response = await fetch('/api/servicos/categorias')
      if (response.ok) {
        const data = await response.json()
        setCategorias(data)
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const camposFaltando = [];
    
    if (!formData.nome) camposFaltando.push('Nome do Serviço');
    if (!formData.categoria) camposFaltando.push('Categoria');
    if (!formData.valor_padrao) camposFaltando.push('Valor Padrão');
    
    if (camposFaltando.length > 0) {
      let mensagem = '❌ Campos obrigatórios não preenchidos:\n\n';
      camposFaltando.forEach((campo, index) => {
        mensagem += `${index + 1}. ${campo}\n`;
      });
      mensagem += '\nPor favor, preencha todos os campos obrigatórios antes de salvar.';
      alert(mensagem);
      return;
    }

    try {
      const url = editingServico 
        ? `/api/servicos/${editingServico.id}`
        : '/api/servicos'
      
      const method = editingServico ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        alert(editingServico ? 'Serviço atualizado!' : 'Serviço cadastrado!')
        resetForm()
        loadServicos()
        loadCategorias()
      } else {
        const error = await response.json()
        alert(`Erro: ${error.message}`)
      }
    } catch (error) {
      console.error('Erro ao salvar serviço:', error)
      alert('Erro ao salvar serviço')
    }
  }

  const handleEdit = (servico) => {
    setEditingServico(servico)
    setFormData({
      nome: servico.nome,
      categoria: servico.categoria,
      valor_padrao: servico.valor_padrao,
      aplicavel_macho: servico.aplicavel_macho,
      aplicavel_femea: servico.aplicavel_femea,
      descricao: servico.descricao || '',
      ativo: servico.ativo
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return

    try {
      const response = await fetch(`/api/servicos/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Serviço excluído com sucesso!')
        loadServicos()
        loadCategorias()
      }
    } catch (error) {
      console.error('Erro ao excluir serviço:', error)
      alert('Erro ao excluir serviço')
    }
  }

  const resetForm = () => {
    setFormData({
      nome: '',
      categoria: '',
      valor_padrao: '',
      aplicavel_macho: true,
      aplicavel_femea: true,
      descricao: '',
      ativo: true
    })
    setEditingServico(null)
    setShowForm(false)
  }

  const filteredServicos = servicos.filter(s => {
    const matchSearch = s.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       s.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCategoria = !filtroCategoria || s.categoria === filtroCategoria
    return matchSearch && matchCategoria
  })

  const servicosPorCategoria = filteredServicos.reduce((acc, servico) => {
    if (!acc[servico.categoria]) {
      acc[servico.categoria] = []
    }
    acc[servico.categoria].push(servico)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            💼 Cadastro de Serviços e Custos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie os tipos de serviços que podem ser aplicados aos animais
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="mt-4 sm:mt-0 btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Novo Serviço
        </button>
      </div>

      {/* Filtros */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              🔍 Buscar
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <FunnelIcon className="inline h-4 w-4 mr-1" />
              Categoria
            </label>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="input-field"
            >
              <option value="">Todas as categorias</option>
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Serviços por Categoria */}
      <div className="space-y-4">
        {Object.keys(servicosPorCategoria).sort().map(categoria => (
          <div key={categoria} className="card">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                📋 {categoria} ({servicosPorCategoria[categoria].length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Nome do Serviço
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Valor Padrão
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Aplicável
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {servicosPorCategoria[categoria].map(servico => (
                    <tr key={servico.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {servico.nome}
                          </div>
                          {servico.descricao && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {servico.descricao}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                          R$ {parseFloat(servico.valor_padrao).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          {servico.aplicavel_macho && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              🐂 Machos
                            </span>
                          )}
                          {servico.aplicavel_femea && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200">
                              🐄 Fêmeas
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {servico.ativo ? (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <CheckIcon className="h-3 w-3 mr-1" />
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                            <XMarkIcon className="h-3 w-3 mr-1" />
                            Inativo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(servico)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                            title="Editar"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(servico.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400"
                            title="Excluir"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {filteredServicos.length === 0 && (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">💼</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Nenhum serviço encontrado
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Comece cadastrando os serviços que você utiliza na fazenda
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              Cadastrar Primeiro Serviço
            </button>
          </div>
        )}
      </div>

      {/* Modal de Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingServico ? '✏️ Editar Serviço' : '➕ Novo Serviço'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nome do Serviço *
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    className="input-field"
                    placeholder="Ex: Exame Andrológico"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                    className="input-field"
                    required
                  >
                    <option value="">Selecione...</option>
                    <option value="Veterinários">Veterinários</option>
                    <option value="Reprodução">Reprodução</option>
                    <option value="Medicamentos">Medicamentos</option>
                    <option value="Manejo">Manejo</option>
                    <option value="DNA">DNA</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Valor Padrão (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.valor_padrao}
                    onChange={(e) => setFormData({...formData, valor_padrao: e.target.value})}
                    className="input-field"
                    placeholder="165.00"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Aplicável a:
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.aplicavel_macho}
                        onChange={(e) => setFormData({...formData, aplicavel_macho: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                      />
                      <span className="text-sm text-gray-900 dark:text-white">
                        🐂 Machos
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.aplicavel_femea}
                        onChange={(e) => setFormData({...formData, aplicavel_femea: e.target.checked})}
                        className="rounded border-gray-300 text-pink-600 focus:ring-pink-500 mr-2"
                      />
                      <span className="text-sm text-gray-900 dark:text-white">
                        🐄 Fêmeas
                      </span>
                    </label>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                    className="input-field h-20 resize-none"
                    placeholder="Detalhes sobre o serviço..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.ativo}
                      onChange={(e) => setFormData({...formData, ativo: e.target.checked})}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500 mr-2"
                    />
                    <span className="text-sm text-gray-900 dark:text-white">
                      Serviço ativo (disponível para uso)
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {editingServico ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

