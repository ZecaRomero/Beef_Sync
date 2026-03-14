

import React, { useEffect, useState, useCallback } from 'react'
import ModernLayout from '../components/ui/ModernLayout'
import ModernCard, { ModernCardHeader, ModernCardBody } from '../components/ui/ModernCard'
import Button from '../components/ui/Button'
import StatsCard from '../components/ui/StatsCard'

export default function TestAnimals() {
  const [animals, setAnimals] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Função para carregar animais de forma segura
  const loadAnimals = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Tentar carregar da API primeiro
      try {
        const response = await fetch('/api/animals?orderBy=created_at')
        if (response.ok) {
          const data = await response.json()
          const animalsArray = Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : [])
          setAnimals(animalsArray)
          return
        }
      } catch (apiError) {
        console.warn('API não disponível, usando localStorage:', apiError)
      }

      // Fallback para localStorage
      const existingAnimals = localStorage.getItem('animals')
      if (existingAnimals) {
        try {
          const parsed = JSON.parse(existingAnimals)
          const animalsArray = Array.isArray(parsed) ? parsed : []
          setAnimals(animalsArray)
        } catch (parseError) {
          console.error('Erro ao fazer parse do localStorage:', parseError)
          setAnimals([])
          localStorage.removeItem('animals') // Remove dados corrompidos
        }
      } else {
        setAnimals([])
      }
    } catch (error) {
      console.error('Erro ao carregar animais:', error)
      setError('Erro ao carregar dados dos animais')
      setAnimals([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAnimals()
  }, [loadAnimals])

  const createTestAnimals = async () => {
    try {
      setLoading(true)
      setError(null)

      const testAnimals = []
      const currentTime = Date.now()

      for (let i = 1; i <= 25; i++) {
        testAnimals.push({
          id: currentTime + i, // ID único baseado em timestamp
          serie: `TEST${i.toString().padStart(3, '0')}`,
          rg: i.toString().padStart(3, '0'),
          sexo: i % 2 === 0 ? 'Fêmea' : 'Macho',
          raca: ['Nelore', 'Brahman', 'Gir', 'Angus'][i % 4],
          dataNascimento: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
          peso: 200 + Math.floor(Math.random() * 300),
          situacao: ['Ativo', 'Vendido', 'Morto'][Math.floor(Math.random() * 3)],
          custoTotal: Math.floor(Math.random() * 5000),
          valorVenda: Math.floor(Math.random() * 8000),
          pai: `PAI${i}`,
          mae: `MAE${i}`,
          observacoes: `Animal de teste ${i}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }

      // Garantir que animals seja um array
      const currentAnimals = Array.isArray(animals) ? animals : []

      // Verificar se já existem animais de teste
      const existingTestAnimals = currentAnimals.filter(animal =>
        animal.serie && animal.serie.startsWith('TEST')
      )

      if (existingTestAnimals.length > 0) {
        const proceed = confirm(`Já existem ${existingTestAnimals.length} animais de teste. Deseja adicionar mais 25?`)
        if (!proceed) {
          setLoading(false)
          return
        }
      }

      const allAnimals = [...currentAnimals, ...testAnimals]

      // Tentar salvar na API primeiro
      try {
        const response = await fetch('/api/animals/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testAnimals)
        })

        if (response.ok) {
          await loadAnimals() // Recarregar da API
          alert(`✅ ${testAnimals.length} animais de teste criados na API!`)
          return
        }
      } catch (apiError) {
        console.warn('Erro na API, salvando no localStorage:', apiError)
      }

      // Fallback para localStorage
      setAnimals(allAnimals)
      localStorage.setItem('animals', JSON.stringify(allAnimals))
      alert(`✅ ${testAnimals.length} animais de teste criados no localStorage!`)

    } catch (error) {
      console.error('Erro ao criar animais de teste:', error)
      setError('Erro ao criar animais de teste')
      alert('❌ Erro ao criar animais de teste: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const clearTestAnimals = async () => {
    try {
      setLoading(true)
      setError(null)

      // Garantir que animals seja um array
      if (!Array.isArray(animals)) {
        alert('❌ Erro: Lista de animais não é válida.')
        return
      }

      const testAnimals = animals.filter(animal =>
        animal.serie && animal.serie.startsWith('TEST')
      )

      if (testAnimals.length === 0) {
        alert('ℹ️ Nenhum animal de teste encontrado.')
        return
      }

      const proceed = confirm(`Deseja remover ${testAnimals.length} animais de teste?`)
      if (!proceed) return

      const filteredAnimals = animals.filter(animal =>
        !animal.serie || !animal.serie.startsWith('TEST')
      )

      // Tentar remover da API primeiro
      try {
        const testIds = testAnimals.map(animal => animal.id)
        const response = await fetch('/api/animals/bulk', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ids: testIds })
        })

        if (response.ok) {
          await loadAnimals() // Recarregar da API
          alert(`✅ ${testAnimals.length} animais de teste removidos da API! Restam ${filteredAnimals.length} animais.`)
          return
        }
      } catch (apiError) {
        console.warn('Erro na API, removendo do localStorage:', apiError)
      }

      // Fallback para localStorage
      setAnimals(filteredAnimals)
      localStorage.setItem('animals', JSON.stringify(filteredAnimals))
      alert(`✅ ${testAnimals.length} animais de teste removidos do localStorage! Restam ${filteredAnimals.length} animais.`)

    } catch (error) {
      console.error('Erro ao remover animais de teste:', error)
      setError('Erro ao remover animais de teste')
      alert('❌ Erro ao remover animais de teste: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModernLayout
      title="Teste de Animais"
      subtitle="Crie e gerencie dados de teste para o sistema"
      icon="🧪"
    >
      <div className="max-w-6xl mx-auto space-y-8">

        {error && (
          <ModernCard variant="glass" className="border-red-200 dark:border-red-800 bg-red-50/80 dark:bg-red-900/20">
            <ModernCardBody>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-500 rounded-xl text-white">
                  <span>⚠️</span>
                </div>
                <div>
                  <h3 className="font-semibold text-red-800 dark:text-red-200">
                    Erro no Sistema
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {error}
                  </p>
                </div>
              </div>
            </ModernCardBody>
          </ModernCard>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Total de Animais"
            value={animals?.length || 0}
            subtitle="Cadastrados no sistema"
            icon={<span className="text-xl">🐄</span>}
            color="blue"
            loading={loading}
          />
          
          <StatsCard
            title="Animais de Teste"
            value={animals?.filter(a => a.serie && a.serie.startsWith('TEST')).length || 0}
            subtitle="Dados para demonstração"
            icon={<span className="text-xl">🧪</span>}
            color="purple"
            loading={loading}
          />
          
          <StatsCard
            title="Animais Reais"
            value={(animals?.length || 0) - (animals?.filter(a => a.serie && a.serie.startsWith('TEST')).length || 0)}
            subtitle="Dados de produção"
            icon={<span className="text-xl">✅</span>}
            color="green"
            loading={loading}
          />
        </div>

        <ModernCard modern={true} hover={true}>
          <ModernCardHeader
            icon={<span className="text-2xl">⚙️</span>}
            title="Ações de Teste"
            subtitle="Gerencie dados de demonstração do sistema"
          />
          <ModernCardBody>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button
                onClick={createTestAnimals}
                disabled={loading}
                loading={loading}
                variant="primary"
                size="lg"
                modern={true}
                glow={true}
                leftIcon={<span>➕</span>}
              >
                Criar 25 Animais de Teste
              </Button>

              <Button
                onClick={clearTestAnimals}
                disabled={loading}
                loading={loading}
                variant="danger"
                size="lg"
                modern={true}
                leftIcon={<span>🗑️</span>}
              >
                Remover Animais de Teste
              </Button>

              <Button
                onClick={() => window.location.href = '/animals'}
                variant="success"
                size="lg"
                modern={true}
                leftIcon={<span>👀</span>}
              >
                Ver Lista de Animais
              </Button>
            </div>
          </ModernCardBody>
        </ModernCard>

        {animals && animals.length > 0 && (
          <ModernCard modern={true} hover={true}>
            <ModernCardHeader
              icon={<span className="text-xl">📋</span>}
              title="Últimos 10 Animais"
              subtitle="Visualização dos dados mais recentes"
            />
            <ModernCardBody>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Série/RG
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Raça/Sexo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Situação
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Tipo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {animals?.slice(-10).map((animal) => (
                      <tr key={animal.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          {animal.id}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {animal.serie || 'N/A'} {animal.rg || ''}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {animal.raca || 'N/A'} - {animal.sexo || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            animal.situacao === 'Ativo' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            animal.situacao === 'Vendido' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                            animal.situacao === 'Morto' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                          }`}>
                            {animal.situacao || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            animal.serie && animal.serie.startsWith('TEST')
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                          }`}>
                            {animal.serie && animal.serie.startsWith('TEST') ? '🧪 Teste' : '✅ Real'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {new Date(animal.created_at || Date.now()).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ModernCardBody>
          </ModernCard>
        )}

        {animals && animals.length === 0 && !loading && (
          <ModernCard variant="glass" modern={true}>
            <ModernCardBody>
              <div className="text-center py-12">
                <div className="text-6xl mb-6 animate-bounce">🐄</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  Nenhum animal encontrado
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Comece criando alguns animais de teste para experimentar o sistema.
                </p>
                <Button
                  onClick={createTestAnimals}
                  variant="primary"
                  size="lg"
                  modern={true}
                  glow={true}
                  leftIcon={<span>🚀</span>}
                >
                  Criar Primeiros Animais
                </Button>
              </div>
            </ModernCardBody>
          </ModernCard>
        )}
      </div>
    </ModernLayout>
  )
}
