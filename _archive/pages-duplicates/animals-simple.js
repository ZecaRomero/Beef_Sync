import React, { useEffect, useState } from 'react'
import Link from 'next/link'

export default function AnimalsSimple() {
  const [animals, setAnimals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadAnimals = async () => {
      try {
        setLoading(true)
        console.log('🔄 Carregando animais...')
        
        const response = await fetch('/api/animals')
        console.log('📡 Response:', response.status, response.ok)
        
        if (response.ok) {
          const data = await response.json()
          console.log('📊 Data:', data)
          
          if (data.success && Array.isArray(data.data)) {
            setAnimals(data.data)
            console.log('✅ Animais carregados:', data.data.length)
          } else {
            console.log('⚠️ Formato inesperado:', data)
            setError('Formato de dados inesperado')
          }
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

    loadAnimals()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando animais...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Erro ao carregar animais</h2>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            🐄 Lista Simples de Animais
          </h1>

          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-blue-800 dark:text-blue-200">
              <strong>Total de animais encontrados:</strong> {animals.length}
            </p>
          </div>

          {animals.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">🐄</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Nenhum animal encontrado
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                A API não retornou nenhum animal ou houve um problema na consulta.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {animals.map((animal) => (
                <div key={animal.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {animal.serie} {animal.rg}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      animal.situacao === 'Ativo' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      animal.situacao === 'Morto' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {animal.situacao}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div><strong>ID:</strong> {animal.id}</div>
                    <div><strong>Sexo:</strong> {animal.sexo}</div>
                    <div><strong>Raça:</strong> {animal.raca}</div>
                    <div><strong>Peso:</strong> {animal.peso} kg</div>
                    <div><strong>Meses:</strong> {animal.meses}</div>
                    {animal.data_nascimento && (
                      <div><strong>Nascimento:</strong> {new Date(animal.data_nascimento).toLocaleDateString('pt-BR')}</div>
                    )}
                    {animal.observacoes && (
                      <div><strong>Obs:</strong> {animal.observacoes}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 flex space-x-4">
            <Link
              href="/animals"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              🐄 Página Completa de Animais
            </Link>
            <Link
              href="/test-api-animals"
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              🧪 Teste da API
            </Link>
            <Link
              href="/dashboard"
              className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              📊 Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}