

import React, { useEffect, useState } from 'react'

export default function DebugAnimals() {
  const [localStorageData, setLocalStorageData] = useState({})
  const [apiData, setApiData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Carregar dados do localStorage
      const animals = JSON.parse(localStorage.getItem('animals') || '[]')
      const animalData = JSON.parse(localStorage.getItem('animalData') || '[]')
      const animalCosts = JSON.parse(localStorage.getItem('animalCosts') || '[]')
      
      setLocalStorageData({
        animals,
        animalData,
        animalCosts,
        animalsCount: animals.length,
        animalDataCount: animalData.length,
        animalCostsCount: animalCosts.length
      })

      // Tentar carregar da API
      try {
        const response = await fetch('/api/animals')
        if (response.ok) {
          const data = await response.json()
          setApiData(data)
        } else {
          console.error('Erro na API:', response.status)
        }
      } catch (apiError) {
        console.error('Erro ao conectar com API:', apiError)
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const syncData = async () => {
    // Sincronizar dados do localStorage para a API
    const animals = JSON.parse(localStorage.getItem('animals') || '[]')
    
    if (animals.length === 0) {
      alert('�š�️ Nenhum animal para sincronizar no localStorage.')
      return
    }

    if (!confirm(`Deseja sincronizar ${animals.length} animais? Isso pode levar alguns instantes.`)) {
      return
    }

    setLoading(true)
    let successCount = 0
    let errorCount = 0
    
    console.log('�Ÿ”„ Iniciando sincronização de', animals.length, 'animais...')

    for (const animal of animals) {
      try {
        // Prepare payload with defaults for required fields
        const payload = {
          ...animal,
          boletim: animal.boletim || 'Importação Debug',
          pasto_atual: animal.pasto_atual || animal.piquete_atual || 'Sede'
        }

        const response = await fetch('/api/animals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        
        if (response.ok) {
          console.log('�œ… Animal sincronizado:', animal.serie, animal.rg)
          successCount++
        } else {
          const errorData = await response.json().catch(() => ({}))
          console.error('�Œ Erro ao sincronizar:', animal.serie, animal.rg, response.status, errorData)
          errorCount++
        }
      } catch (error) {
        console.error('�Œ Erro ao sincronizar animal:', error)
        errorCount++
      }
    }
    
    setLoading(false)
    alert(`�œ… Sincronização concluída!\nSucessos: ${successCount}\nErros: ${errorCount}\nVerifique o console para detalhes.`)
    loadData()
  }

  const clearAllData = () => {
    if (confirm('�š�️ Tem certeza que deseja limpar TODOS os dados?')) {
      localStorage.removeItem('animals')
      localStorage.removeItem('animalData')
      localStorage.removeItem('animalCosts')
      loadData()
      alert('�Ÿ—‘️ Todos os dados foram removidos!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            �Ÿ”� Debug - Animais
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
                �Ÿ“� localStorage
              </h3>
              <div className="space-y-2 text-sm">
                <p><strong>animals:</strong> {localStorageData.animalsCount} itens</p>
                <p><strong>animalData:</strong> {localStorageData.animalDataCount} itens</p>
                <p><strong>animalCosts:</strong> {localStorageData.animalCostsCount} itens</p>
              </div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                �ŸŒ� API
              </h3>
              <div className="space-y-2 text-sm">
                <p><strong>Animais:</strong> {apiData.length} itens</p>
                <p><strong>Status:</strong> {apiData.length > 0 ? '�œ… Conectada' : '�Œ Vazia'}</p>
              </div>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                �š�️ Problema
              </h3>
              <div className="space-y-2 text-sm">
                <p><strong>Status:</strong> {localStorageData.animalsCount > 0 && apiData.length === 0 ? '�Œ Desincronizado' : '�œ… OK'}</p>
                <p><strong>Ação:</strong> {localStorageData.animalsCount > 0 && apiData.length === 0 ? 'Sincronizar' : 'Nenhuma'}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <button
              onClick={syncData}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              �Ÿ”„ Sincronizar com API
            </button>
            
            <button
              onClick={loadData}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              �Ÿ”„ Recarregar Dados
            </button>
            
            <button
              onClick={clearAllData}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              �Ÿ—‘️ Limpar Tudo
            </button>
            
            <a
              href="/animals"
              className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-center"
            >
              �Ÿ‘€ Voltar para Animais
            </a>
          </div>
        </div>

        {/* Dados do localStorage */}
        {localStorageData.animalsCount > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              �Ÿ“� Animais no localStorage ({localStorageData.animalsCount})
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Série/RG</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Raça/Sexo</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Situação</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {localStorageData.animals.map((animal) => (
                    <tr key={animal.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{animal.id}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{animal.serie} {animal.rg}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{animal.raca} - {animal.sexo}</td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          animal.situacao === 'Ativo' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          animal.situacao === 'Vendido' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {animal.situacao}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Dados da API */}
        {apiData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              �ŸŒ� Animais na API ({apiData.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Série/RG</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Raça/Sexo</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Situação</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {apiData.map((animal) => (
                    <tr key={animal.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{animal.id}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{animal.serie} {animal.rg}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{animal.raca} - {animal.sexo}</td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          animal.situacao === 'Ativo' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          animal.situacao === 'Vendido' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {animal.situacao}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Dados brutos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            �Ÿ”� Dados Brutos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">localStorage</h3>
              <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-xs overflow-auto max-h-64">
                {JSON.stringify(localStorageData, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">API</h3>
              <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-xs overflow-auto max-h-64">
                {JSON.stringify(apiData, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
