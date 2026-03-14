import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'

export default function CorrigirMaeManera() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleCorrigir = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/animals/corrigir-mae-manera', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (data.success) {
        setResult(data)
      } else {
        setError(data.message || 'Erro ao corrigir')
      }
    } catch (err) {
      setError('Erro ao executar correÃ§Ã£o: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Corrigir MÃ£e MANERA SANT ANNA | Beef-Sync</title>
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Corrigir Dados da MÃ£e MANERA SANT ANNA
            </h1>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Esta correÃ§Ã£o irÃ¡ atualizar os campos <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">serie_mae</code> e <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">rg_mae</code> de todos os animais que tÃªm "MANERA SANT ANNA" como mÃ£e.
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-2">
                ApÃ³s a correÃ§Ã£o, as coletas FIV da MANERA SANT ANNA (CJCJ 16013) aparecerÃ£o automaticamente na ficha dos filhos.
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                <Link href="/corrigir-venda-16013" className="font-semibold underline hover:no-underline">
                  ââ€ â€™ Corrigir venda da CJCJ 16013
                </Link>
                <span className="text-blue-600 dark:text-blue-400"> (venda que estava na ficha da filha)</span>
              </p>
            </div>

            <button
              onClick={handleCorrigir}
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? 'Corrigindo...' : 'Executar CorreÃ§Ã£o'}
            </button>

            {error && (
              <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {result && (
              <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">
                  âÅ“â€¦ {result.message}
                </p>
                {result.data?.animais && result.data.animais.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-green-700 dark:text-green-300 font-semibold mb-2">
                      Animais atualizados:
                    </p>
                    <ul className="text-xs text-green-700 dark:text-green-300 space-y-1">
                      {result.data.animais.map((animal, idx) => (
                        <li key={idx}>
                          ââ‚¬¢ {animal.serie} {animal.rg} - {animal.nome || 'Sem nome'} (MÃ£e: {animal.mae})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
                  <p className="text-xs text-green-700 dark:text-green-300">
                    ðÅ¸â€™¡ Agora vocÃª pode recarregar a pÃ¡gina da CJCJ 17037 para ver as coletas FIV da mÃ£e!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
