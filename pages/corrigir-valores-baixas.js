import { useState } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'

export default function CorrigirValoresBaixas() {
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [erro, setErro] = useState(null)

  const executarCorrecao = async () => {
    if (!confirm('Tem certeza que deseja corrigir os valores? Esta ação multiplicará por 1000 todos os valores de venda menores que R$ 100,00.')) {
      return
    }

    setLoading(true)
    setErro(null)
    setResultado(null)

    try {
      const res = await fetch('/api/baixas/corrigir-valores', {
        method: 'POST'
      })

      const data = await res.json()

      if (data.success) {
        setResultado(data)
      } else {
        setErro(data.error || 'Erro ao executar correção')
      }
    } catch (err) {
      setErro(err.message || 'Erro ao executar correção')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <Head>
        <title>Corrigir Valores de Baixas | BeefSync</title>
      </Head>

      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Corrigir Valores de Baixas
        </h1>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">
            ⚠️ Atenção
          </h2>
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Esta ferramenta corrige valores de vendas que foram importados incorretamente.
            Valores menores que R$ 100,00 serão multiplicados por 1000.
          </p>
          <p className="text-sm text-amber-800 dark:text-amber-300 mt-2">
            Exemplo: R$ 3,64 será corrigido para R$ 3.640,00
          </p>
        </div>

        <button
          onClick={executarCorrecao}
          disabled={loading}
          className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Executando correção...' : 'Executar Correção'}
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
                Registros corrigidos: {resultado.corrigidos}
              </p>
              {resultado.erros > 0 && (
                <p className="text-amber-700 dark:text-amber-400 text-sm">
                  Erros: {resultado.erros}
                </p>
              )}
            </div>

            {resultado.registros && resultado.registros.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Registros Corrigidos
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Animal
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Valor Anterior
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Valor Novo
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Comprador
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          NF
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {resultado.registros.map((reg, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {reg.serie} {reg.rg}
                          </td>
                          <td className="px-4 py-3 text-sm text-red-600 dark:text-red-400">
                            R$ {reg.valorAnterior.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400 font-semibold">
                            R$ {reg.valorNovo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {reg.comprador || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {reg.numeroNf || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
