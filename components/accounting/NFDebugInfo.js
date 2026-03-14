
import React, { useEffect, useState } from 'react'

import { useToast } from '../../contexts/ToastContext'

const NFDebugInfo = () => {
  const [debugInfo, setDebugInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const testConnection = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/notas-fiscais')
      const data = await response.json()
      
      setDebugInfo({
        status: response.status,
        success: data.success,
        connection: data.connection,
        dataCount: data.count,
        rawData: data.data,
        timestamp: new Date().toISOString()
      })
      
      if (data.success) {
        toast.success(`Conexão OK! ${data.count} NFs encontradas`)
      } else {
        toast.error('Erro na conexão com o banco')
      }
      
    } catch (error) {
      setDebugInfo({
        error: error.message,
        timestamp: new Date().toISOString()
      })
      toast.error('Erro ao testar conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-md font-semibold text-gray-900 dark:text-white">
          🔍 Debug - Conexão com Banco de Dados
        </h4>
        <button
          onClick={testConnection}
          disabled={loading}
          className="btn-secondary text-sm disabled:opacity-50"
        >
          {loading ? '🔄 Testando...' : '🔍 Testar Conexão'}
        </button>
      </div>

      {debugInfo && (
        <div className="space-y-4">
          {debugInfo.error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
              <h5 className="font-medium text-red-900 dark:text-red-100 mb-2">❌ Erro de Conexão</h5>
              <p className="text-sm text-red-800 dark:text-red-200">{debugInfo.error}</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                Testado em: {new Date(debugInfo.timestamp).toLocaleString('pt-BR')}
              </p>
            </div>
          ) : (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
              <h5 className="font-medium text-green-900 dark:text-green-100 mb-2">✅ Conexão Estabelecida</h5>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-green-800 dark:text-green-200">Status da API:</span>
                  <p className="text-green-700 dark:text-green-300">{debugInfo.status} - {debugInfo.success ? 'Sucesso' : 'Erro'}</p>
                </div>
                <div>
                  <span className="font-medium text-green-800 dark:text-green-200">NFs Encontradas:</span>
                  <p className="text-green-700 dark:text-green-300">{debugInfo.dataCount} registros</p>
                </div>
                <div>
                  <span className="font-medium text-green-800 dark:text-green-200">Banco PostgreSQL:</span>
                  <p className="text-green-700 dark:text-green-300">
                    {debugInfo.connection?.timestamp ? 'Conectado' : 'Desconectado'}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-green-800 dark:text-green-200">Última Verificação:</span>
                  <p className="text-green-700 dark:text-green-300">
                    {new Date(debugInfo.timestamp).toLocaleTimeString('pt-BR')}
                  </p>
                </div>
              </div>

              {debugInfo.rawData && debugInfo.rawData.length > 0 && (
                <div className="mt-4">
                  <h6 className="font-medium text-green-900 dark:text-green-100 mb-2">
                    📋 Dados Encontrados:
                  </h6>
                  <div className="bg-green-100 dark:bg-green-800 p-3 rounded text-xs font-mono max-h-40 overflow-y-auto">
                    {debugInfo.rawData.map((nf, index) => (
                      <div key={index} className="mb-2 pb-2 border-b border-green-200 dark:border-green-700 last:border-b-0">
                        <strong>NF {nf.numero_nf}:</strong> {nf.tipo} • R$ {nf.valor_total} • {nf.data} • {nf.natureza_operacao}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        💡 Este painel mostra a conexão real com o banco PostgreSQL. 
        Se sua NF não aparecer, clique em "Testar Conexão" para verificar.
      </div>
    </div>
  )
}

export default NFDebugInfo