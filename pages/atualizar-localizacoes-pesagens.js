import { useState } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'

export default function AtualizarLocalizacoesPesagens() {
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [erro, setErro] = useState(null)

  const executarAtualizacao = async () => {
    if (!confirm('Tem certeza que deseja atualizar as localizações dos animais com base nas pesagens?')) {
      return
    }

    setLoading(true)
    setErro(null)
    setResultado(null)

    try {
      const res = await fetch('/api/pesagens/atualizar-localizacoes', {
        method: 'POST'
      })

      const data = await res.json()

      if (data.success) {
        setResultado(data)
      } else {
        setErro(data.error || 'Erro ao executar atualização')
      }
    } catch (err) {
      setErro(err.message || 'Erro ao executar atualização')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <Head>
        <title>Atualizar Localizações por Pesagens | BeefSync</title>
      </Head>

      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Atualizar Localizações por Pesagens
        </h1>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
            ℹ️ Como funciona
          </h2>
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Esta ferramenta atualiza automaticamente a localização dos animais com base nas pesagens registradas.
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-300 mt-2">
            Quando um animal é pesado em um piquete, sua localização será atualizada para aquele piquete na data da pesagem.
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-300 mt-2">
            Exemplo: Se CJCJ 17037 foi pesada no PROJETO 5A em 12/02/2026, sua localização será atualizada para PROJETO 5A.
          </p>
        </div>

        <button
          onClick={executarAtualizacao}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Executando atualização...' : 'Atualizar Localizações'}
        </button>

        {erro && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-300 font-semibold">Erro:</p>
            <p className="text-red-700 dark:text-red-400">{erro}</p>
          </div>
        )}

        {resultado && (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-800 dark:text-green-300 font-semibold">
                ✅ {resultado.message}
              </p>
              <p className="text-green-700 dark:text-green-400 text-sm mt-1">
                Localizações atualizadas: {resultado.atualizados}
              </p>
              {resultado.erros > 0 && (
                <p className="text-amber-700 dark:text-amber-400 text-sm">
                  Erros: {resultado.erros}
                </p>
              )}
            </div>

            {resultado.detalhes && resultado.detalhes.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Localizações Atualizadas (primeiros 50)
                  </h3>
                </div>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Animal
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Localização Anterior
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Nova Localização
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Data
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {resultado.detalhes.map((det, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">
                            {det.animal}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                            {det.localizacaoAnterior}
                          </td>
                          <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400 font-semibold">
                            {det.piquete}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {new Date(det.data).toLocaleDateString('pt-BR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {resultado.errosDetalhes && resultado.errosDetalhes.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">
                  ⚠️ Erros encontrados
                </h3>
                <div className="space-y-1">
                  {resultado.errosDetalhes.map((err, idx) => (
                    <p key={idx} className="text-sm text-amber-800 dark:text-amber-300">
                      {err.animal}: {err.erro}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
