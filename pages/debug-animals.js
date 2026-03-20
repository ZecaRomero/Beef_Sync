/**
 * Debug: localStorage vs GET /api/animals (PostgreSQL)
 */
import Head from 'next/head'
import React, { useEffect, useState } from 'react'

function parseAnimalsFromApiResponse(json) {
  if (!json) return []
  if (Array.isArray(json.data)) return json.data
  if (Array.isArray(json)) return json
  return []
}

const emptyLs = {
  animals: [],
  animalData: [],
  animalCosts: [],
  animalsCount: 0,
  animalDataCount: 0,
  animalCostsCount: 0,
}

export default function DebugAnimals() {
  const [localStorageData, setLocalStorageData] = useState(emptyLs)
  const [apiData, setApiData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      const animals = JSON.parse(localStorage.getItem('animals') || '[]')
      const animalData = JSON.parse(localStorage.getItem('animalData') || '[]')
      const animalCosts = JSON.parse(localStorage.getItem('animalCosts') || '[]')

      setLocalStorageData({
        animals,
        animalData,
        animalCosts,
        animalsCount: animals.length,
        animalDataCount: animalData.length,
        animalCostsCount: animalCosts.length,
      })

      try {
        const response = await fetch('/api/animals')
        const raw = await response.json().catch(() => ({}))
        if (response.ok) {
          setApiData(parseAnimalsFromApiResponse(raw))
        } else {
          console.error('Erro na API:', response.status, raw)
          setApiData([])
        }
      } catch (apiError) {
        console.error('Erro ao conectar com API:', apiError)
        setApiData([])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const syncData = async () => {
    const animals = JSON.parse(localStorage.getItem('animals') || '[]')

    if (animals.length === 0) {
      alert('⚠️ Nenhum animal para sincronizar no localStorage.')
      return
    }

    if (!confirm(`Deseja sincronizar ${animals.length} animais? Isso pode levar alguns instantes.`)) {
      return
    }

    setLoading(true)
    let successCount = 0
    let errorCount = 0

    console.log('🔄 Iniciando sincronização de', animals.length, 'animais...')

    for (const animal of animals) {
      try {
        const payload = {
          ...animal,
          boletim: animal.boletim || 'Importação Debug',
          pasto_atual: animal.pasto_atual || animal.piquete_atual || 'Sede',
        }

        const response = await fetch('/api/animals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (response.ok) {
          console.log('✅ Animal sincronizado:', animal.serie, animal.rg)
          successCount++
        } else {
          const errorData = await response.json().catch(() => ({}))
          console.error('❌ Erro ao sincronizar:', animal.serie, animal.rg, response.status, errorData)
          errorCount++
        }
      } catch (error) {
        console.error('❌ Erro ao sincronizar animal:', error)
        errorCount++
      }
    }

    setLoading(false)
    alert(`✅ Sincronização concluída!\nSucessos: ${successCount}\nErros: ${errorCount}\nVerifique o console para detalhes.`)
    loadData()
  }

  const clearAllData = () => {
    if (confirm('⚠️ Tem certeza que deseja limpar TODOS os dados do navegador (animals, animalData, animalCosts)?')) {
      localStorage.removeItem('animals')
      localStorage.removeItem('animalData')
      localStorage.removeItem('animalCosts')
      loadData()
      alert('🗑️ Chaves removidas do localStorage.')
    }
  }

  if (loading) {
    return (
      <>
        <Head><title>Debug Animais | Beef-Sync</title></Head>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Carregando dados...</p>
          </div>
        </div>
      </>
    )
  }

  const lsAnimals = localStorageData.animals || []

  return (
    <>
      <Head><title>Debug Animais | Beef-Sync</title></Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              🔍 Debug - Animais
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">📦 localStorage</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>animals:</strong> {localStorageData.animalsCount} itens</p>
                  <p><strong>animalData:</strong> {localStorageData.animalDataCount} itens</p>
                  <p><strong>animalCosts:</strong> {localStorageData.animalCostsCount} itens</p>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">🌐 API</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Animais:</strong> {apiData.length} itens</p>
                  <p><strong>Status:</strong> {apiData.length > 0 ? '✅ Lista carregada' : '❌ Vazia ou erro'}</p>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">⚠️ Comparativo</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Status:</strong>{' '}
                    {localStorageData.animalsCount > 0 && apiData.length === 0 ? '❌ Desincronizado' : '✅ OK ou só API'}
                  </p>
                  <p><strong>Sugestão:</strong>{' '}
                    {localStorageData.animalsCount > 0 && apiData.length === 0 ? 'Sincronizar ou corrigir DATABASE_URL' : '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-8">
              <button
                type="button"
                onClick={syncData}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                🔄 Sincronizar com API
              </button>

              <button
                type="button"
                onClick={loadData}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                🔄 Recarregar Dados
              </button>

              <button
                type="button"
                onClick={clearAllData}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                🗑️ Limpar localStorage (debug)
              </button>

              <a
                href="/animals"
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-center inline-flex items-center justify-center"
              >
                👀 Lista de animais
              </a>
            </div>
          </div>

          {localStorageData.animalsCount > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                📦 Animais no localStorage ({localStorageData.animalsCount})
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
                    {lsAnimals.map((animal, idx) => (
                      <tr key={animal.id ?? `ls-${animal.serie}-${animal.rg}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{animal.id ?? '—'}</td>
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

          {apiData.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                🌐 Animais na API ({apiData.length})
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
                    {apiData.map((animal, idx) => (
                      <tr key={animal.id ?? `api-${animal.serie}-${animal.rg}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-800">
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

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">🔧 Dados brutos (trecho)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">localStorage</h3>
                <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-xs overflow-auto max-h-64">
                  {JSON.stringify(localStorageData, null, 2)}
                </pre>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">API (array)</h3>
                <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-xs overflow-auto max-h-64">
                  {JSON.stringify(apiData.slice(0, 50), null, 2)}
                  {apiData.length > 50 ? `\n… +${apiData.length - 50} itens` : ''}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
