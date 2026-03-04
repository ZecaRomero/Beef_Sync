import React, { useEffect, useState } from 'react'

export default function TestApiAnimals() {
  const [apiResponse, setApiResponse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const testAPI = async () => {
      try {
        setLoading(true)
        console.log('🔍 Testando API de animais...')
        
        const response = await fetch('/api/animals')
        console.log('📡 Response status:', response.status)
        console.log('📡 Response ok:', response.ok)
        
        if (response.ok) {
          const data = await response.json()
          console.log('📊 Dados recebidos:', data)
          setApiResponse(data)
        } else {
          throw new Error(`HTTP ${response.status}`)
        }
      } catch (err) {
        console.error('❌ Erro:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    testAPI()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            🧪 Teste da API de Animais
          </h1>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">Carregando...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <h3 className="text-red-800 dark:text-red-200 font-medium">Erro na API</h3>
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {apiResponse && (
            <div className="space-y-6">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h3 className="text-green-800 dark:text-green-200 font-medium mb-2">✅ API Funcionando</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <strong>Success:</strong> {apiResponse.success ? '✅' : '❌'}
                  </div>
                  <div>
                    <strong>Total de Animais:</strong> {apiResponse.data?.length || 0}
                  </div>
                  <div>
                    <strong>Timestamp:</strong> {new Date(apiResponse.timestamp).toLocaleString('pt-BR')}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="text-blue-800 dark:text-blue-200 font-medium mb-4">📊 Dados dos Animais</h3>
                
                {apiResponse.data && apiResponse.data.length > 0 ? (
                  <div className="space-y-4">
                    {apiResponse.data.map((animal, index) => (
                      <div key={animal.id || index} className="bg-white dark:bg-gray-700 rounded-lg p-4 border">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                          <div><strong>ID:</strong> {animal.id}</div>
                          <div><strong>Série:</strong> {animal.serie}</div>
                          <div><strong>RG:</strong> {animal.rg}</div>
                          <div><strong>Sexo:</strong> {animal.sexo}</div>
                          <div><strong>Raça:</strong> {animal.raca}</div>
                          <div><strong>Situação:</strong> 
                            <span className={`ml-1 px-2 py-1 rounded text-xs ${
                              animal.situacao === 'Ativo' ? 'bg-green-100 text-green-800' :
                              animal.situacao === 'Morto' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {animal.situacao}
                            </span>
                          </div>
                          <div><strong>Peso:</strong> {animal.peso} kg</div>
                          <div><strong>Meses:</strong> {animal.meses}</div>
                          <div><strong>Data Nasc:</strong> {animal.data_nascimento ? new Date(animal.data_nascimento).toLocaleDateString('pt-BR') : 'N/A'}</div>
                        </div>
                        {animal.observacoes && (
                          <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                            <strong>Obs:</strong> {animal.observacoes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">Nenhum animal encontrado nos dados da API</p>
                )}
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-gray-800 dark:text-gray-200 font-medium mb-2">🔍 Resposta Completa da API</h3>
                <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto">
                  {JSON.stringify(apiResponse, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <div className="mt-6 flex space-x-4">
            <a
              href="/animals"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              🐄 Ir para Página de Animais
            </a>
            <a
              href="/dashboard"
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              📊 Voltar ao Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}