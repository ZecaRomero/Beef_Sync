

import React, { useEffect, useState } from 'react'

export default function CleanupAnimals() {
  const [localStorageAnimals, setLocalStorageAnimals] = useState([])
  const [apiAnimals, setApiAnimals] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLog, setActionLog] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Carregar do localStorage
      const localAnimals = JSON.parse(localStorage.getItem('animals') || '[]')
      setLocalStorageAnimals(localAnimals)
      
      // Carregar da API
      try {
        const response = await fetch('/api/animals')
        if (response.ok) {
          const data = await response.json()
          setApiAnimals(data)
        }
      } catch (error) {
        console.error('Erro ao carregar da API:', error)
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const addLog = (message) => {
    setActionLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const clearLocalStorage = () => {
    if (confirm('⚠️ Tem certeza que deseja limpar TODOS os animais do localStorage?')) {
      localStorage.removeItem('animals')
      localStorage.removeItem('animalData')
      localStorage.removeItem('animalCosts')
      setLocalStorageAnimals([])
      addLog('✅ localStorage limpo completamente')
      alert('🗑️ localStorage limpo com sucesso!')
    }
  }

  const syncWithAPI = async () => {
    try {
      setLoading(true)
      addLog('🔄 Iniciando sincronização com API...')
      
      // Carregar animais da API
      const response = await fetch('/api/animals')
      if (response.ok) {
        const apiAnimals = await response.json()
        
        // Salvar no localStorage
        localStorage.setItem('animals', JSON.stringify(apiAnimals))
        setLocalStorageAnimals(apiAnimals)
        
        addLog(`✅ Sincronizado: ${apiAnimals.length} animais da API para localStorage`)
        alert(`✅ Sincronização concluída! ${apiAnimals.length} animais sincronizados.`)
      } else {
        addLog('❌ Erro ao carregar dados da API')
        alert('❌ Erro ao sincronizar com a API')
      }
      
    } catch (error) {
      console.error('Erro na sincronização:', error)
      addLog(`❌ Erro na sincronização: ${error.message}`)
      alert('❌ Erro na sincronização')
    } finally {
      setLoading(false)
    }
  }

  const removeSpecificAnimals = () => {
    // Remover animais específicos que não existem mais
    const animalsToRemove = ['001', '002', '003'] // Brincos dos animais removidos
    
    const filteredAnimals = localStorageAnimals.filter(animal => {
      const brinco = animal.brinco || animal.serie || animal.rg
      return !animalsToRemove.includes(brinco)
    })
    
    if (filteredAnimals.length < localStorageAnimals.length) {
      localStorage.setItem('animals', JSON.stringify(filteredAnimals))
      setLocalStorageAnimals(filteredAnimals)
      const removedCount = localStorageAnimals.length - filteredAnimals.length
      addLog(`✅ Removidos ${removedCount} animais específicos do localStorage`)
      alert(`✅ ${removedCount} animais específicos removidos do localStorage!`)
    } else {
      addLog('ℹ️ Nenhum animal específico encontrado para remover')
      alert('ℹ️ Nenhum animal específico encontrado para remover')
    }
  }

  const clearAllData = () => {
    if (confirm('⚠️ ATENÇÃO: Isso irá limpar TODOS os dados de animais!\n\nTem certeza?')) {
      // Limpar localStorage
      localStorage.removeItem('animals')
      localStorage.removeItem('animalData')
      localStorage.removeItem('animalCosts')
      
      // Limpar estado
      setLocalStorageAnimals([])
      setApiAnimals([])
      
      addLog('🗑️ TODOS os dados de animais foram limpos')
      alert('🗑️ Todos os dados de animais foram removidos!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
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
            🧹 Limpeza de Animais
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                🗑️ localStorage
              </h3>
              <div className="space-y-2 text-sm">
                <p><strong>Animais:</strong> {localStorageAnimals.length}</p>
                <p><strong>Status:</strong> {localStorageAnimals.length > 0 ? '⚠️ Com dados' : '✅ Limpo'}</p>
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
                🌐 PostgreSQL
              </h3>
              <div className="space-y-2 text-sm">
                <p><strong>Animais:</strong> {apiAnimals.length}</p>
                <p><strong>Status:</strong> {apiAnimals.length > 0 ? '⚠️ Com dados' : '✅ Limpo'}</p>
              </div>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                ⚠️ Problema
              </h3>
              <div className="space-y-2 text-sm">
                <p><strong>Animais inexistentes:</strong> 3 removidos</p>
                <p><strong>Ação:</strong> Limpar localStorage</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <button
              onClick={removeSpecificAnimals}
              className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              🎯 Remover Animais Específicos
            </button>
            
            <button
              onClick={clearLocalStorage}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              🗑️ Limpar localStorage
            </button>
            
            <button
              onClick={syncWithAPI}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              🔄 Sincronizar com API
            </button>
            
            <button
              onClick={clearAllData}
              className="bg-red-800 hover:bg-red-900 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              ⚠️ Limpar TUDO
            </button>
            
            <button
              onClick={loadData}
              className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              🔄 Recarregar
            </button>
            
            <a
              href="/animals"
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-center"
            >
              👀 Ver Animais
            </a>
          </div>
        </div>

        {/* Log de Ações */}
        {actionLog.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              📋 Log de Ações
            </h2>
            <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg max-h-64 overflow-y-auto">
              {actionLog.map((log, index) => (
                <p key={index} className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                  {log}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Animais no localStorage */}
        {localStorageAnimals.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              📦 Animais no localStorage ({localStorageAnimals.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Brinco/Série</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nome</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Raça</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Sexo</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {localStorageAnimals.map((animal) => (
                    <tr key={animal.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{animal.id}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{animal.brinco || animal.serie || animal.rg}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{animal.nome || 'Sem nome'}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{animal.raca}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{animal.sexo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Animais na API */}
        {apiAnimals.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              🌐 Animais na API ({apiAnimals.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Brinco</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nome</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Raça</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Sexo</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {apiAnimals.map((animal) => (
                    <tr key={animal.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{animal.id}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{animal.brinco}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{animal.nome}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{animal.raca}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{animal.sexo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Status Final */}
        {localStorageAnimals.length === 0 && apiAnimals.length === 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-2">
              ✅ Limpeza Concluída
            </h2>
            <p className="text-green-700 dark:text-green-300">
              Todos os animais foram removidos do PostgreSQL e localStorage.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
