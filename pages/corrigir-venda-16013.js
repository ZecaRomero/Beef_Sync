import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'

export default function CorrigirVenda16013() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleCorrigir = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/baixas/corrigir-venda-16013', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
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
        <title>Corrigir Venda CJCJ 16013 | Beef-Sync</title>
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Corrigir Venda CJCJ 16013 (MANERA SANT ANNA)
            </h1>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                <strong>Problema:</strong> A venda da CJCJ 16013 (NF 4145, comprador CLEBER, R$ 28.800) foi importada incorretamente na ficha da CJCJ 17037 (JATAUBA SANT ANNA ââ‚¬â€� filha).
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>CorreÃ§Ã£o:</strong> Esta aÃ§Ã£o irÃ¡ mover a venda para a ficha correta (CJCJ 16013), corrigir o valor (28,80 ââ€ â€™ R$ 28.800) e atualizar a situaÃ§Ã£o de ambos os animais.
              </p>
            </div>

            <button
              onClick={handleCorrigir}
              disabled={loading}
              className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
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
                {result.corrigido && result.detalhes && (
                  <div className="mt-3 text-xs text-green-700 dark:text-green-300 space-y-1">
                    <p>ââ‚¬¢ Venda movida de {result.detalhes.de} para {result.detalhes.para}</p>
                    <p>ââ‚¬¢ Valor corrigido: R$ {result.detalhes.valorAnterior} ââ€ â€™ R$ {result.detalhes.valorCorrigido?.toLocaleString('pt-BR')}</p>
                    <p>ââ‚¬¢ NF: {result.detalhes.numeroNf} | Comprador: {result.detalhes.comprador}</p>
                  </div>
                )}
                <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
                  <Link href="/consulta-animal/CJCJ-16013" className="text-sm font-medium text-green-700 dark:text-green-300 hover:underline">
                    ââ€ â€™ Ver ficha da CJCJ 16013
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
