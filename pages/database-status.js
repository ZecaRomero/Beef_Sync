

import React, { useEffect, useState } from 'react'

export default function DatabaseStatus() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastTest, setLastTest] = useState(null)

  const testConnection = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/database/test')
      const data = await response.json()
      setStatus(data)
      setLastTest(new Date().toISOString())
    } catch (error) {
      setStatus({
        status: 'error',
        message: 'Erro ao testar conexão',
        connected: false,
        error: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    testConnection()
  }, [])

  const isConnected = status?.connected

  return (
    <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">
                Status do Banco de Dados PostgreSQL
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Monitoramento da conectividade e configuração do banco de dados
              </p>
            </div>

            <div className="px-6 py-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  {loading ? (
                    <div className="animate-pulse">
                      <div className="w-24 h-6 bg-gray-200 rounded"></div>
                    </div>
                  ) : (
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      isConnected 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        isConnected ? 'bg-green-400' : 'bg-red-400'
                      }`}></div>
                      {isConnected ? 'Conectado' : 'Desconectado'}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={testConnection}
                  disabled={loading}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    loading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {loading ? 'Testando...' : 'Testar Conexão'}
                </button>
              </div>

              {status && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Status da Conexão
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Conectado:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                          isConnected 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {isConnected ? 'Sim' : 'Não'}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Timestamp:</span>
                        <span className="ml-2 text-sm text-gray-900">
                          {status.timestamp ? new Date(status.timestamp).toLocaleString('pt-BR') : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                          status.status === 'success' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {status.status}
                        </span>
                      </div>
                      {lastTest && (
                        <div>
                          <span className="text-sm text-gray-600">Último Teste:</span>
                          <span className="ml-2 text-sm text-gray-900">
                            {new Date(lastTest).toLocaleString('pt-BR')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {status.config && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Configuração da Conexão
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-gray-600">Host:</span>
                          <span className="ml-2 text-sm text-gray-900">{status.config.host}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Banco:</span>
                          <span className="ml-2 text-sm text-gray-900">{status.config.database}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Usuário:</span>
                          <span className="ml-2 text-sm text-gray-900">{status.config.user}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Porta:</span>
                          <span className="ml-2 text-sm text-gray-900">{status.config.port}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {status.poolInfo && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Informações do Pool
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <span className="text-sm text-gray-600">Total de Conexões:</span>
                          <span className="ml-2 text-sm text-gray-900">{status.poolInfo.totalCount}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Conexões Idle:</span>
                          <span className="ml-2 text-sm text-gray-900">{status.poolInfo.idleCount}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Aguardando:</span>
                          <span className="ml-2 text-sm text-gray-900">{status.poolInfo.waitingCount}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {status.message && (
                    <div className={`rounded-lg p-4 ${
                      isConnected ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      <h3 className={`text-lg font-medium mb-2 ${
                        isConnected ? 'text-green-900' : 'text-red-900'
                      }`}>
                        Mensagem
                      </h3>
                      <p className={`text-sm ${
                        isConnected ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {status.message}
                      </p>
                    </div>
                  )}

                  {status.error && (
                    <div className="bg-red-50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-red-900 mb-2">
                        Erro
                      </h3>
                      <p className="text-sm text-red-700">
                        {status.error}
                      </p>
                    </div>
                  )}

                  {status.suggestion && (
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-yellow-900 mb-2">
                        Sugestão
                      </h3>
                      <p className="text-sm text-yellow-700">
                        {status.suggestion}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {!status && !loading && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhum estado disponível</p>
                  <button
                    onClick={testConnection}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Testar Conexão
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  )
}
