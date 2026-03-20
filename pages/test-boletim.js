/**
 * Página de teste: geração de Boletim de Gado (Excel) via /api/contabilidade/boletim-gado
 */
import Head from 'next/head'
import React, { useEffect, useState, useCallback } from 'react'

function defaultPeriod() {
  const end = new Date()
  const start = new Date()
  start.setMonth(start.getMonth() - 1)
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  }
}

export default function TestBoletim() {
  const [animals, setAnimals] = useState([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [testResults, setTestResults] = useState(null)
  const [period, setPeriod] = useState(defaultPeriod)

  const loadAnimals = useCallback(() => {
    try {
      const animalsData = JSON.parse(localStorage.getItem('animals') || '[]')
      setAnimals(Array.isArray(animalsData) ? animalsData : [])
    } catch (error) {
      console.error('Erro ao carregar animais:', error)
      setAnimals([])
    } finally {
      setInitialLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAnimals()
  }, [loadAnimals])

  const testBoletim = async () => {
    try {
      setGenerating(true)

      const response = await fetch('/api/contabilidade/boletim-gado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period,
          animalsData: Array.isArray(animals) && animals.length > 0 ? animals : [],
        }),
      })

      const contentType = response.headers.get('content-type') || ''

      if (!response.ok) {
        if (contentType.includes('application/json')) {
          const err = await response.json().catch(() => ({}))
          throw new Error(err.message || err.error || `Erro HTTP ${response.status}`)
        }
        throw new Error(`Erro HTTP ${response.status}`)
      }

      if (!contentType.includes('spreadsheetml') && !contentType.includes('octet-stream')) {
        const text = await response.text()
        let msg = 'Resposta inesperada da API (não é Excel).'
        try {
          const j = JSON.parse(text)
          if (j.message) msg = j.message
        } catch {
          if (text?.length < 500) msg = text
        }
        throw new Error(msg)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `teste-boletim-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      alert('✅ Boletim de teste gerado com sucesso!')
    } catch (error) {
      console.error('Erro ao testar boletim:', error)
      alert('❌ Erro ao gerar boletim de teste: ' + (error?.message || error))
    } finally {
      setGenerating(false)
    }
  }

  const analyzeAnimals = () => {
    if (!Array.isArray(animals) || animals.length === 0) {
      setTestResults({
        total: 0,
        racas: {},
        semDataNascimento: [],
        comDataNascimento: [],
        idades: {},
      })
      return
    }

    const analysis = {
      total: animals.length,
      racas: {},
      semDataNascimento: [],
      comDataNascimento: [],
      idades: {},
    }

    animals.forEach((animal) => {
      const raca = animal.raca || 'Não informado'
      analysis.racas[raca] = (analysis.racas[raca] || 0) + 1

      const dataNascimento = animal.dataNascimento || animal.data_nascimento

      if (!dataNascimento) {
        analysis.semDataNascimento.push({
          serie: animal.serie,
          rg: animal.rg,
          raca: animal.raca,
        })
      } else {
        analysis.comDataNascimento.push({
          serie: animal.serie,
          rg: animal.rg,
          raca: animal.raca,
          dataNascimento,
        })

        const nascimento = new Date(dataNascimento)
        const hoje = new Date()
        const idadeMeses = Math.floor((hoje - nascimento) / (1000 * 60 * 60 * 24 * 30.44))

        analysis.idades[raca] = analysis.idades[raca] || []
        analysis.idades[raca].push({
          serie: animal.serie,
          rg: animal.rg,
          idadeMeses,
        })
      }
    })

    setTestResults(analysis)
    console.log('🔍 Análise dos animais:', analysis)
  }

  if (initialLoading) {
    return (
      <>
        <Head>
          <title>Teste Boletim | Beef-Sync</title>
        </Head>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Carregando dados...</p>
          </div>
        </div>
      </>
    )
  }

  const racasUnicas = new Set((animals || []).map((a) => a.raca).filter(Boolean)).size

  return (
    <>
      <Head>
        <title>Teste Boletim | Beef-Sync</title>
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Teste — Boletim de Gado
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              O relatório é montado no servidor a partir do <strong>banco de dados</strong>. Os animais no{' '}
              <code className="text-xs bg-gray-100 dark:bg-gray-900 px-1 rounded">localStorage</code> são só
              fallback e para análise local.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">Animais (local)</h3>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{animals.length}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-1">Raças únicas</h3>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{racasUnicas}</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-200 mb-1">Com data nasc.</h3>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {animals.filter((a) => a.dataNascimento || a.data_nascimento).length}
                </p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">Período (API)</h3>
                <div className="flex flex-col gap-1 text-xs text-amber-900 dark:text-amber-100">
                  <label className="flex items-center gap-2">
                    <span>Início</span>
                    <input
                      type="date"
                      value={period.startDate}
                      onChange={(e) => setPeriod((p) => ({ ...p, startDate: e.target.value }))}
                      className="rounded border border-amber-200 dark:border-amber-700 bg-white dark:bg-gray-900 px-1 py-0.5"
                    />
                  </label>
                  <label className="flex items-center gap-2">
                    <span>Fim</span>
                    <input
                      type="date"
                      value={period.endDate}
                      onChange={(e) => setPeriod((p) => ({ ...p, endDate: e.target.value }))}
                      className="rounded border border-amber-200 dark:border-amber-700 bg-white dark:bg-gray-900 px-1 py-0.5"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-2">
              <button
                type="button"
                onClick={testBoletim}
                disabled={generating}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {generating ? 'Gerando…' : 'Gerar boletim de teste (Excel)'}
              </button>

              <button
                type="button"
                onClick={analyzeAnimals}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Analisar dados locais
              </button>

              <button
                type="button"
                onClick={loadAnimals}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Recarregar localStorage
              </button>

              <a
                href="/contabilidade"
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-center inline-flex items-center justify-center"
              >
                Voltar à contabilidade
              </a>
            </div>
          </div>

          {animals.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Animais no navegador ({animals.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Série/RG
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Raça
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Sexo
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Data nasc.
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Situação
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {animals.map((animal, idx) => {
                      const identificacao = `${animal.serie || 'N/A'}-${animal.rg || 'N/A'}`
                      const dataNasc = animal.dataNascimento || animal.data_nascimento || '—'
                      return (
                        <tr key={`${identificacao}-${idx}`} className="border-b">
                          <td className="px-4 py-2">{identificacao}</td>
                          <td className="px-4 py-2">{animal.raca || '—'}</td>
                          <td className="px-4 py-2">{animal.sexo || '—'}</td>
                          <td className="px-4 py-2">{dataNasc}</td>
                          <td className="px-4 py-2">
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm dark:bg-green-900/40 dark:text-green-200">
                              {animal.situacao || 'Ativo'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {testResults && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Resultados da análise (local)</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Resumo</h3>
                  <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
                    <p>
                      <strong>Total:</strong> {testResults.total} animais
                    </p>
                    <p>
                      <strong>Com data:</strong> {testResults.comDataNascimento.length}
                    </p>
                    <p>
                      <strong>Sem data:</strong> {testResults.semDataNascimento.length}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Por raça</h3>
                  <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
                    {Object.entries(testResults.racas).map(([raca, count]) => (
                      <p key={raca}>
                        <strong>{raca}:</strong> {count} animais
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {testResults.semDataNascimento.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Sem data de nascimento</h3>
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    {testResults.semDataNascimento.map((animal, index) => (
                      <p key={index} className="text-sm text-red-700 dark:text-red-300">
                        {animal.serie} {animal.rg} — {animal.raca}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Idades calculadas</h3>
                <div className="space-y-4">
                  {Object.entries(testResults.idades).map(([raca, animais]) => (
                    <div key={raca} className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">{raca}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {animais.map((animal, index) => (
                          <p key={index} className="text-gray-700 dark:text-gray-300">
                            {animal.serie} {animal.rg}: {animal.idadeMeses} meses
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
