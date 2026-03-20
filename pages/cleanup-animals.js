/**
 * Ferramentas de limpeza / sincronização: localStorage vs API (somente leitura no servidor aqui).
 */
import Head from 'next/head'
import React, { useCallback, useEffect, useState } from 'react'
import { saveAnimalsToLocalStorage } from '../utils/localStorageAnimals'

function parseAnimalsFromApiResponse(json) {
  if (!json) return []
  if (Array.isArray(json.data)) return json.data
  if (Array.isArray(json)) return json
  return []
}

function animalRowKey(animal, idx) {
  if (animal?.id != null) return `id-${animal.id}`
  return `ls-${animal.serie}-${animal.rg}-${idx}`
}

export default function CleanupAnimals() {
  const [localStorageAnimals, setLocalStorageAnimals] = useState([])
  const [apiAnimals, setApiAnimals] = useState([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState(null)
  const [actionLog, setActionLog] = useState([])
  const [removeIdsText, setRemoveIdsText] = useState('')

  const addLog = useCallback((message) => {
    setActionLog((prev) => [...prev, `${new Date().toLocaleTimeString('pt-BR')}: ${message}`])
  }, [])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setApiError(null)

      const localAnimals = JSON.parse(localStorage.getItem('animals') || '[]')
      setLocalStorageAnimals(Array.isArray(localAnimals) ? localAnimals : [])

      try {
        const response = await fetch('/api/animals?orderBy=created_at')
        const raw = await response.json().catch(() => ({}))
        if (response.ok) {
          setApiAnimals(parseAnimalsFromApiResponse(raw))
        } else {
          const msg = raw?.message || `HTTP ${response.status}`
          setApiError(msg)
          setApiAnimals([])
        }
      } catch (e) {
        console.error('Erro ao carregar da API:', e)
        setApiError(e?.message || 'Falha de rede ao buscar /api/animals')
        setApiAnimals([])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const clearLocalStorage = () => {
    if (confirm('⚠️ Tem certeza que deseja limpar animais e dados relacionados do localStorage neste navegador?')) {
      localStorage.removeItem('animals')
      localStorage.removeItem('animalData')
      localStorage.removeItem('animalCosts')
      setLocalStorageAnimals([])
      addLog('localStorage de animais limpo (animals, animalData, animalCosts)')
      alert('localStorage limpo.')
    }
  }

  const syncWithAPI = async () => {
    try {
      setLoading(true)
      addLog('Sincronizando: GET /api/animals → localStorage…')

      const response = await fetch('/api/animals?orderBy=created_at')
      const raw = await response.json().catch(() => ({}))
      if (!response.ok) {
        const msg = raw?.message || `HTTP ${response.status}`
        addLog(`Erro na API: ${msg}`)
        alert(`Erro ao sincronizar: ${msg}`)
        setApiError(msg)
        return
      }

      const list = parseAnimalsFromApiResponse(raw)
      const saved = saveAnimalsToLocalStorage(list)
      if (!saved.ok) {
        addLog(`Erro ao gravar localStorage: ${saved.message}`)
        alert(`Erro ao gravar no navegador: ${saved.message}`)
        return
      }
      const forState = saved.slim ? JSON.parse(localStorage.getItem('animals') || '[]') : list
      setLocalStorageAnimals(forState)
      setApiAnimals(list)
      setApiError(null)
      addLog(
        saved.slim
          ? `OK: ${saved.count} animais em cache resumido (sem todas as colunas de genética) para caber na quota`
          : `OK: ${saved.count} animais gravados no localStorage a partir da API`
      )
      alert(
        saved.slim
          ? `Sincronizado ${saved.count} animais em modo resumido (localStorage cheio). Dados completos: API/PostgreSQL.`
          : `Sincronizado: ${saved.count} animais no navegador.`
      )
    } catch (error) {
      console.error('Erro na sincronização:', error)
      addLog(`Erro: ${error.message}`)
      alert('Erro na sincronização: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const removeByRgOrBrinco = () => {
    const tokens = removeIdsText
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter(Boolean)

    if (tokens.length === 0) {
      alert('Informe ao menos um RG (ou brinco) na caixa de texto, separados por vírgula ou linha.')
      return
    }

    const want = new Set(tokens.map((t) => t.toLowerCase()))
    const prevLen = localStorageAnimals.length

    const filteredAnimals = localStorageAnimals.filter((animal) => {
      const rg = String(animal.rg ?? '').trim().toLowerCase()
      const brinco = String(animal.brinco ?? '').trim().toLowerCase()
      const serieRg = `${String(animal.serie ?? '').trim()}-${rg}`.toLowerCase()
      if (want.has(rg) || want.has(brinco) || want.has(serieRg)) return false
      return true
    })

    if (filteredAnimals.length === prevLen) {
      addLog('Nenhum animal local removido (nenhum RG/brinco bateu com a lista).')
      alert('Nenhum animal removido — conferir RGs informados.')
      return
    }

    const saved = saveAnimalsToLocalStorage(filteredAnimals)
    if (!saved.ok) {
      alert(`Não foi possível salvar após remover: ${saved.message}`)
      return
    }
    setLocalStorageAnimals(JSON.parse(localStorage.getItem('animals') || '[]'))
    const removed = prevLen - filteredAnimals.length
    addLog(`Removidos ${removed} animais do localStorage conforme lista informada.`)
    alert(`${removed} animais removidos do localStorage.`)
  }

  const clearLocalStateOnly = () => {
    if (
      confirm(
        'Isso zera só o estado desta tela e o cache local no navegador (localStorage de animais).\n\n' +
          'Não apaga o banco PostgreSQL. Continuar?'
      )
    ) {
      localStorage.removeItem('animals')
      localStorage.removeItem('animalData')
      localStorage.removeItem('animalCosts')
      setLocalStorageAnimals([])
      addLog('localStorage limpo; lista da API não foi alterada no servidor.')
      loadData()
    }
  }

  if (loading) {
    return (
      <>
        <Head>
          <title>Limpeza de animais | Beef-Sync</title>
        </Head>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Carregando dados…</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Limpeza de animais | Beef-Sync</title>
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Limpeza de dados de animais</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Botões abaixo alteram principalmente o <strong>localStorage</strong> deste navegador. Para apagar todos os
              animais no PostgreSQL use a API administrativa{' '}
              <code className="text-xs bg-gray-100 dark:bg-gray-900 px-1 rounded">POST /api/animals/delete-all</code> com
              confirmação documentada no código — não é exposto aqui por segurança.
            </p>

            {apiError && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-100">
                <strong>API:</strong> {apiError}{' '}
                <button type="button" onClick={loadData} className="ml-2 underline font-medium">
                  Tentar de novo
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">localStorage</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Animais:</strong> {localStorageAnimals.length}
                  </p>
                  <p>
                    <strong>Estado:</strong> {localStorageAnimals.length > 0 ? 'Há cópia local' : 'Vazio'}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">API (PostgreSQL)</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Animais:</strong> {apiAnimals.length}
                  </p>
                  <p>
                    <strong>Estado:</strong>{' '}
                    {apiError ? 'Erro ao ler' : apiAnimals.length > 0 ? 'Lista carregada' : 'Nenhum / vazio'}
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Remover por RG</h3>
                <p className="text-xs text-yellow-900 dark:text-yellow-100 mb-2">
                  Um por linha ou separados por vírgula. Compara com <code>rg</code>, <code>brinco</code> ou{' '}
                  <code>série-rg</code> (só localStorage).
                </p>
                <textarea
                  value={removeIdsText}
                  onChange={(e) => setRemoveIdsText(e.target.value)}
                  rows={3}
                  className="w-full text-sm rounded border border-yellow-200 dark:border-yellow-700 bg-white dark:bg-gray-900 px-2 py-1 text-gray-900 dark:text-white"
                  placeholder="Ex.: 16013&#10;CJCJ-16013"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-8">
              <button
                type="button"
                onClick={removeByRgOrBrinco}
                className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Remover da lista (local)
              </button>

              <button
                type="button"
                onClick={clearLocalStorage}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Limpar localStorage
              </button>

              <button
                type="button"
                onClick={syncWithAPI}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Sincronizar com API → navegador
              </button>

              <button
                type="button"
                onClick={clearLocalStateOnly}
                className="bg-red-800 hover:bg-red-900 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Limpar local + recarregar tela
              </button>

              <button
                type="button"
                onClick={loadData}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Recarregar
              </button>

              <a
                href="/animals"
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-center inline-flex items-center justify-center"
              >
                Ver animais
              </a>
            </div>
          </div>

          {actionLog.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Log de ações</h2>
              <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg max-h-64 overflow-y-auto font-mono text-xs">
                {actionLog.map((log, index) => (
                  <p key={index} className="text-gray-700 dark:text-gray-300 mb-1">
                    {log}
                  </p>
                ))}
              </div>
            </div>
          )}

          {localStorageAnimals.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Animais no localStorage ({localStorageAnimals.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        ID
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Série / RG
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Nome
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Raça
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Sexo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {localStorageAnimals.map((animal, idx) => (
                      <tr key={animalRowKey(animal, idx)} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{animal.id ?? '—'}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                          {animal.serie ?? '—'} {animal.rg ?? animal.brinco ?? '—'}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{animal.nome || '—'}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{animal.raca ?? '—'}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{animal.sexo ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {apiAnimals.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Amostra da API ({apiAnimals.length} — primeiras 100 linhas)
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        ID
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Série / RG
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Nome
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Raça
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Sexo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {apiAnimals.slice(0, 100).map((animal, idx) => (
                      <tr key={animalRowKey(animal, idx)} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{animal.id}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                          {animal.serie} {animal.rg}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{animal.nome || '—'}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{animal.raca}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{animal.sexo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {localStorageAnimals.length === 0 && apiAnimals.length === 0 && !apiError && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 text-center">
              <h2 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-2">Nada para exibir</h2>
              <p className="text-green-700 dark:text-green-300 text-sm">
                Sem animais no localStorage e a API retornou lista vazia.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
