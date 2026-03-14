/**
 * PÃ¡gina de administraÃ§Ã£o - UsuÃ¡rios Mobile
 * Lista todos os dispositivos que acessaram o sistema mobile
 */
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { 
  DevicePhoneMobileIcon, 
  UserIcon, 
  PhoneIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  ArrowLeftIcon,
  HomeIcon
} from '@heroicons/react/24/outline'

export default function MobileUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAtivo, setFilterAtivo] = useState('todos')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/mobile-users')
      const data = await response.json()
      
      if (data.success) {
        setUsers(data.data || [])
      }
    } catch (error) {
      console.error('Erro ao buscar usuÃ¡rios:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleUserStatus = async (id, currentStatus) => {
    try {
      const response = await fetch('/api/mobile-users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ativo: !currentStatus })
      })

      const data = await response.json()
      
      if (data.success) {
        fetchUsers()
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('pt-BR')
  }

  const formatPhone = (phone) => {
    if (!phone) return '-'
    const digits = phone.replace(/\D/g, '')
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
    }
    return phone
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.telefone?.includes(searchTerm)
    
    const matchesFilter = 
      filterAtivo === 'todos' ||
      (filterAtivo === 'ativos' && user.ativo) ||
      (filterAtivo === 'inativos' && !user.ativo)
    
    return matchesSearch && matchesFilter
  })

  return (
    <>
      <Head>
        <title>UsuÃ¡rios Mobile | Beef-Sync</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header com navegaÃ§Ã£o */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                  <span className="font-medium">Voltar</span>
                </Link>
                <div className="h-6 w-px bg-gray-300" />
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <DevicePhoneMobileIcon className="h-6 w-6 text-amber-600" />
                  UsuÃ¡rios Mobile
                </h1>
              </div>
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <HomeIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <DevicePhoneMobileIcon className="h-8 w-8 text-amber-600" />
                    UsuÃ¡rios Mobile
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Dispositivos que acessaram o sistema mobile
                  </p>
                </div>
                
                <button
                  onClick={fetchUsers}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                  Atualizar
                </button>
              </div>

              {/* Filtros */}
              <div className="flex gap-4 items-center">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>

                <select
                  value={filterAtivo}
                  onChange={(e) => setFilterAtivo(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="todos">Todos</option>
                  <option value="ativos">Ativos</option>
                  <option value="inativos">Inativos</option>
                </select>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total de UsuÃ¡rios</p>
                    <p className="text-3xl font-bold text-gray-900">{users.length}</p>
                  </div>
                  <UserIcon className="h-12 w-12 text-blue-500" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">UsuÃ¡rios Ativos</p>
                    <p className="text-3xl font-bold text-green-600">
                      {users.filter(u => u.ativo).length}
                    </p>
                  </div>
                  <CheckCircleIcon className="h-12 w-12 text-green-500" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total de Acessos</p>
                    <p className="text-3xl font-bold text-amber-600">
                      {users.reduce((sum, u) => sum + (u.access_count || 0), 0)}
                    </p>
                  </div>
                  <ClockIcon className="h-12 w-12 text-amber-500" />
                </div>
              </div>
            </div>

            {/* Tabela */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {loading ? (
                <div className="p-12 text-center">
                  <ArrowPathIcon className="h-12 w-12 text-gray-400 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Carregando usuÃ¡rios...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-12 text-center">
                  <DevicePhoneMobileIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhum usuÃ¡rio encontrado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          UsuÃ¡rio
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Telefone
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Primeiro Acesso
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ÃÅ¡ltimo Acesso
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acessos
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          AÃ§Ãµes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                  {user.nome?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{user.nome}</div>
                                <div className="text-sm text-gray-500">{user.ip_address || '-'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-900">
                              <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                              {formatPhone(user.telefone)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(user.first_access)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(user.last_access)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {user.access_count || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.ativo 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => toggleUserStatus(user.id, user.ativo)}
                              className={`px-3 py-1 rounded-lg transition-colors ${
                                user.ativo
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {user.ativo ? 'Desativar' : 'Ativar'}
                            </button>
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
    </>
  )
}
