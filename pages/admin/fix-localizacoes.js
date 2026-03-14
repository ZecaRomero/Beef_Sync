import { useState } from 'react'
import Head from 'next/head'

export default function FixLocalizacoes() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const executarCorrecao = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/fix-localizacoes-constraint', {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success) {
        setResult(data)
      } else {
        setError(data.error || 'Erro desconhecido')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Corrigir Localizações | Beef-Sync</title>
      </Head>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Corrigir Constraint de Localizações
        </h1>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            ⚠️ O que este script faz?
          </h2>
          <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>Remove a constraint UNIQUE incorreta em <code>animal_id</code></li>
            <li>Permite que um animal tenha múltiplas localizações ao longo do tempo</li>
            <li>Cria índices úteis para melhorar a performance</li>
            <li>Verifica se há registros duplicados que precisam de atenção</li>
          </ul>
        </div>

        <button
          onClick={executarCorrecao}
          disabled={loading}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
        >
          {loading ? 'Executando...' : 'Executar Correção'}
        </button>

        {error && (
          <div className="mt-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              ❌ Erro
            </h3>
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-6 space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                ✅ {result.message}
              </h3>
            </div>

            {result.details && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Detalhes da Operação
                </h4>

                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Constraint removida:
                    </span>{' '}
                    <span className={result.details.constraintRemoved ? 'text-green-600' : 'text-gray-600'}>
                      {result.details.constraintRemoved ? 'Sim' : 'Não (já estava correta)'}
                    </span>
                  </div>

                  {result.details.constraintsFound && result.details.constraintsFound.length > 0 && (
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Constraints encontradas:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                        {result.details.constraintsFound.map((c, i) => (
                          <li key={i}>
                            <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">
                              {c.name}
                            </code>
                            {' - '}
                            {c.definition}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.details.duplicatesFound > 0 && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3">
                      <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                        ⚠️ Encontrados {result.details.duplicatesFound} animais com múltiplas localizações ativas:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-yellow-700 dark:text-yellow-300 text-xs">
                        {result.details.duplicates.map((d, i) => (
                          <li key={i}>
                            Animal ID {d.animal_id}: {d.count} localizações ativas
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                        💡 Recomendação: Verifique manualmente e finalize as localizações antigas.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
