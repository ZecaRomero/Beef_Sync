import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Card, CardBody } from '../ui/Card'

export default function NotasFiscaisRecentesWidget() {
  const router = useRouter()
  const [notasFiscais, setNotasFiscais] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/notas-fiscais')
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((result) => {
        const recentes = (result.data || []).slice(0, 3)
        setNotasFiscais(recentes)
      })
      .catch(() => setNotasFiscais([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading || notasFiscais.length === 0) return null

  return (
    <Card className="mb-6 border-2 border-blue-300 dark:border-blue-700 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
      <CardBody className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-blue-800 dark:text-blue-200 flex items-center gap-2">
              <span>📋</span> Notas Fiscais Recentes
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Últimas movimentações cadastradas</p>
          </div>
          <button
            onClick={() => router.push('/notas-fiscais')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all"
          >
            Ver Todas
          </button>
        </div>

        <div className="space-y-3">
          {notasFiscais.map((nf) => {
            const isEntrada = nf.tipo === 'entrada'
            const dataFormatada = new Date(nf.data).toLocaleDateString('pt-BR')

            return (
              <div
                key={nf.id}
                onClick={() => router.push(`/notas-fiscais?busca=${nf.numero_nf}`)}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          isEntrada
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                            : 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300'
                        }`}
                      >
                        {isEntrada ? '📥 ENTRADA' : '📤 SAÍDA'}
                      </span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">NF {nf.numero_nf}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {isEntrada ? nf.fornecedor : nf.destino} • {dataFormatada}
                    </p>
                    {nf.total_itens > 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {nf.total_itens} {nf.total_itens === 1 ? 'item' : 'itens'}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {nf.valor_total_calculado > 0 && (
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        R$ {Number(nf.valor_total_calculado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardBody>
    </Card>
  )
}

