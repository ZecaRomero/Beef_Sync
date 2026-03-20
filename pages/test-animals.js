/**
 * Página de teste: cria/remove animais fictícios (API bulk ou localStorage).
 */
import Head from 'next/head'
import React, { useCallback, useEffect, useState } from 'react'
import ModernLayout from '../components/ui/ModernLayout'
import ModernCard, { ModernCardHeader, ModernCardBody } from '../components/ui/ModernCard'
import Button from '../components/ui/Button'
import StatsCard from '../components/ui/StatsCard'
import { saveAnimalsToLocalStorage } from '../utils/localStorageAnimals'

function parseAnimalsFromApi(json) {
  if (!json) return []
  if (Array.isArray(json.data)) return json.data
  if (Array.isArray(json)) return json
  return []
}

function buildTestAnimalsBatch(count = 25) {
  const batchId = Date.now()
  const out = []
  for (let i = 1; i <= count; i++) {
    const serie = `TB${(batchId % 1_000_000).toString(36).toUpperCase()}-${i}`
    const rg = `${(batchId % 10_000) + i}`
    out.push({
      id: batchId + i,
      serie,
      rg,
      sexo: i % 2 === 0 ? 'Fêmea' : 'Macho',
      raca: ['Nelore', 'Brahman', 'Gir', 'Angus'][i % 4],
      dataNascimento: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
        .toISOString()
        .split('T')[0],
      peso: 200 + Math.floor(Math.random() * 300),
      situacao: ['Ativo', 'Vendido', 'Morto'][Math.floor(Math.random() * 3)],
      custoTotal: Math.floor(Math.random() * 5000),
      valorVenda: Math.floor(Math.random() * 8000),
      pai: `PAI${i}`,
      mae: `MAE${i}`,
      observacoes: `Animal de teste (test-animals) ${i}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }
  return out
}

function mapTestRowForBulkApi(t) {
  return {
    serie: t.serie,
    rg: String(t.rg),
    sexo: t.sexo,
    raca: t.raca,
    data_nascimento: t.dataNascimento,
    peso: t.peso,
    situacao: t.situacao,
    pai: t.pai,
    mae: t.mae,
    observacoes: t.observacoes,
    boletim: 'Teste test-animals',
    pasto_atual: 'Sede',
    custo_total: t.custoTotal ?? 0,
    valor_venda: t.valorVenda ?? null,
  }
}

function isTestSerie(serie) {
  return typeof serie === 'string' && (serie.startsWith('TEST') || serie.startsWith('TB'))
}

export default function TestAnimals() {
  const [animals, setAnimals] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadAnimals = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/animals?orderBy=created_at')
        const data = await response.json().catch(() => ({}))
        if (response.ok) {
          setAnimals(parseAnimalsFromApi(data))
          return
        }
        setError(data?.message || `API: HTTP ${response.status}`)
      } catch (apiError) {
        console.warn('API indisponível, usando localStorage:', apiError)
        setError(apiError?.message || 'Falha de rede na API')
      }

      const raw = localStorage.getItem('animals')
      if (raw) {
        try {
          const parsed = JSON.parse(raw)
          setAnimals(Array.isArray(parsed) ? parsed : [])
        } catch (parseError) {
          console.error('Parse localStorage animals:', parseError)
          setAnimals([])
          localStorage.removeItem('animals')
        }
      } else {
        setAnimals([])
      }
    } catch (err) {
      console.error('loadAnimals:', err)
      setError(err?.message || 'Erro ao carregar animais')
      setAnimals([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAnimals()
  }, [loadAnimals])

  const readAnimalsFromStorage = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem('animals') || '[]')
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const createTestAnimals = async () => {
    try {
      setLoading(true)
      setError(null)

      const testAnimals = buildTestAnimalsBatch(25)
      const currentAnimals = readAnimalsFromStorage()
      const existingTest = currentAnimals.filter((a) => isTestSerie(a.serie))

      if (existingTest.length > 0) {
        const proceed = window.confirm(
          `Já existem ${existingTest.length} animais de teste no cache local. Criar mais 25?`
        )
        if (!proceed) {
          setLoading(false)
          return
        }
      }

      const response = await fetch('/api/animals/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ animals: testAnimals.map(mapTestRowForBulkApi) }),
      })

      if (response.ok) {
        const body = await response.json().catch(() => ({}))
        await loadAnimals()
        const n = body?.data?.summary?.successful ?? testAnimals.length
        alert(`Criados na API: ${n} animais de teste (veja resumo no servidor se houver erros parciais).`)
        return
      }

      const errBody = await response.json().catch(() => ({}))
      setError(errBody?.message || `API bulk HTTP ${response.status}`)
      console.warn('ÁPI bulk falhou, gravando local:', errBody)

      const allAnimals = [...currentAnimals, ...testAnimals]
      const saved = saveAnimalsToLocalStorage(allAnimals)
      if (!saved.ok) {
        alert(`Não foi possível gravar no navegador: ${saved.message}`)
        return
      }
      setAnimals(JSON.parse(localStorage.getItem('animals') || '[]'))
      alert(
        saved.slim
          ? `${saved.count} animais (incl. teste) em cache resumido no navegador.`
          : `${testAnimals.length} animais de teste só no localStorage.`
      )
    } catch (error) {
      console.error('createTestAnimals:', error)
      setError(error?.message || 'Erro ao criar testes')
      alert('Erro ao criar animais de teste: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const clearTestAnimals = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!Array.isArray(animals)) {
        alert('Lista de animais inválida.')
        return
      }

      const testOnly = animals.filter((a) => isTestSerie(a.serie))
      if (testOnly.length === 0) {
        alert('Nenhum animal de teste (série TEST* / TB*) na lista atual.')
        return
      }

      if (!window.confirm(`Remover ${testOnly.length} animais de teste?`)) return

      const ids = testOnly.map((a) => a.id).filter((id) => id != null && Number.isFinite(Number(id)))
      const looksLikeDbIds = ids.length === testOnly.length && ids.every((id) => id < 1e12)

      if (looksLikeDbIds) {
        try {
          const response = await fetch('/api/animals/bulk', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids }),
          })
          if (response.ok) {
            await loadAnimals()
            alert(`Removidos ${testOnly.length} animais de teste na API.`)
            return
          }
        } catch (e) {
          console.warn('DELETE bulk falhou, ajustando só local:', e)
        }
      }

      const filtered = animals.filter((a) => !isTestSerie(a.serie))
      const saved = saveAnimalsToLocalStorage(filtered)
      if (!saved.ok) {
        alert(`Não foi possível atualizar localStorage: ${saved.message}`)
        return
      }
      setAnimals(JSON.parse(localStorage.getItem('animals') || '[]'))
      alert(`Removidos ${testOnly.length} animais de teste do cache local.`)
    } catch (error) {
      console.error('clearTestAnimals:', error)
      setError(error?.message || 'Erro ao remover')
      alert('Erro ao remover: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const testCount = animals?.filter((a) => isTestSerie(a.serie)).length || 0

  return (
    <>
      <Head>
        <title>Teste de animais | Beef-Sync</title>
      </Head>
      <ModernLayout title="Teste de animais" subtitle="Dados de demonstração (API ou navegador)" icon="🧪">
        <div className="max-w-6xl mx-auto space-y-8">
          {error && (
            <ModernCard hover={false} className="border-red-200 dark:border-red-800 bg-red-50/80 dark:bg-red-900/20">
              <ModernCardBody>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-500 rounded-xl text-white">
                    <span>⚠️</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-800 dark:text-red-200">Aviso</h3>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                  </div>
                </div>
              </ModernCardBody>
            </ModernCard>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatsCard
              title="Total"
              value={animals?.length || 0}
              subtitle="Na lista carregada"
              icon={<span className="text-xl">🐄</span>}
              color="blue"
              loading={loading}
            />
            <StatsCard
              title="Teste"
              value={testCount}
              subtitle="Séries TEST* / TB*"
              icon={<span className="text-xl">🧪</span>}
              color="purple"
              loading={loading}
            />
            <StatsCard
              title="Demais"
              value={(animals?.length || 0) - testCount}
              subtitle="Fora do padrão de teste"
              icon={<span className="text-xl">✅</span>}
              color="green"
              loading={loading}
            />
          </div>

          <ModernCard hover>
            <ModernCardHeader
              icon={<span className="text-2xl">⚙️</span>}
              title="Ações"
              subtitle="POST /api/animals/bulk com { animals: [...] }"
            />
            <ModernCardBody>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Button
                  onClick={createTestAnimals}
                  disabled={loading}
                  loading={loading}
                  variant="primary"
                  size="lg"
                  modern
                  glow
                  leftIcon={<span>➕</span>}
                >
                  Criar 25 de teste
                </Button>
                <Button
                  onClick={clearTestAnimals}
                  disabled={loading}
                  loading={loading}
                  variant="danger"
                  size="lg"
                  modern
                  leftIcon={<span>🗑️</span>}
                >
                  Remover testes
                </Button>
                <Button
                  onClick={() => {
                    window.location.href = '/animals'
                  }}
                  variant="success"
                  size="lg"
                  modern
                  leftIcon={<span>👀</span>}
                >
                  Ver animais
                </Button>
              </div>
            </ModernCardBody>
          </ModernCard>

          {animals && animals.length > 0 && (
            <ModernCard hover>
              <ModernCardHeader
                icon={<span className="text-xl">📋</span>}
                title="Últimos 10 na lista"
                subtitle="Ordem do array atual"
              />
              <ModernCardBody>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">ID</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                          Série/RG
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Raça/Sexo</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                          Situação
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Tipo</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Referência</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {animals.slice(-10).map((animal, idx) => (
                        <tr key={`${animal.id}-${animal.serie}-${animal.rg}-${idx}`}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{animal.id}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {animal.serie || '—'} {animal.rg || ''}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {animal.raca || '—'} — {animal.sexo || '—'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                animal.situacao === 'Ativo'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                  : animal.situacao === 'Vendido'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                    : animal.situacao === 'Morto'
                                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                              }`}
                            >
                              {animal.situacao || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                isTestSerie(animal.serie)
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                              }`}
                            >
                              {isTestSerie(animal.serie) ? '🧪 Teste' : 'Real'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {(animal.created_at && new Date(animal.created_at).toLocaleDateString('pt-BR')) || '—'}
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
            <ModernCard hover={false}>
              <ModernCardBody>
                <div className="text-center py-12">
                  <div className="text-6xl mb-6">🐄</div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Nenhum animal na lista</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">Use o botão abaixo ou recarregue após cadastrar no sistema.</p>
                  <Button onClick={createTestAnimals} variant="primary" size="lg" modern glow leftIcon={<span>🚀</span>}>
                    Criar animais de teste
                  </Button>
                </div>
              </ModernCardBody>
            </ModernCard>
          )}
        </div>
      </ModernLayout>
    </>
  )
}
