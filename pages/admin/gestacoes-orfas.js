import { useState } from 'react'
import Head from 'next/head'

export default function GestacoesOrfasAdmin() {
  const [animalRg, setAnimalRg] = useState('16588')
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [erro, setErro] = useState(null)
  const [syncResult, setSyncResult] = useState(null)

  const verificarGestacoes = async () => {
    setLoading(true)
    setErro(null)
    setResultado(null)

    try {
      const response = await fetch('/api/gestacoes/limpar-orfas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ animalRg: animalRg || undefined })
      })

      const data = await response.json()

      if (response.ok) {
        setResultado(data)
      } else {
        setErro(data.error || 'Erro ao verificar gestações')
      }
    } catch (error) {
      setErro('Erro de conexão: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const excluirGestacoes = async () => {
    if (!confirm('Tem certeza que deseja excluir as gestações órfãs?')) {
      return
    }

    setLoading(true)
    setErro(null)

    try {
      const response = await fetch('/api/gestacoes/limpar-orfas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          animalRg: animalRg || undefined,
          forceDelete: true 
        })
      })

      const data = await response.json()

      if (response.ok) {
        setResultado(data)
        alert(`✅ ${data.total} gestação(ões) excluída(s) com sucesso!`)
      } else {
        setErro(data.error || 'Erro ao excluir gestações')
      }
    } catch (error) {
      setErro('Erro de conexão: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const forcarSincronizacaoMobile = async () => {
    if (!animalRg) {
      alert('⚠️ Informe o RG do animal')
      return
    }

    setLoading(true)
    setErro(null)
    setSyncResult(null)

    try {
      const response = await fetch('/api/animals/sync-mobile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          animalRg,
          forceClearCache: true 
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSyncResult(data.sync)
        alert(`✅ Sincronização concluída!\n\n` +
              `Gestações órfãs removidas: ${data.sync.gestacoesOrfasRemovidas}\n` +
              `Gestações ativas: ${data.sync.gestacoesAtivas}\n\n` +
              `Agora feche e abra o app mobile para ver as mudanças.`)
      } else {
        setErro(data.error || 'Erro ao sincronizar')
      }
    } catch (error) {
      setErro('Erro de conexão: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Gestões Órfãs - Administração</title>
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            🧹 Limpeza de Gestações Órfãs
          </h1>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Filtros
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                RG do Animal (deixe vazio para buscar todos)
              </label>
              <input
                type="text"
                value={animalRg}
                onChange={(e) => setAnimalRg(e.target.value)}
                placeholder="Ex: 16588"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                <button
                  onClick={verificarGestacoes}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? '🔄 Verificando...' : '🔍 Verificar Gestações Órfãs'}
                </button>

                {resultado && resultado.total > 0 && (
                  <button
                    onClick={excluirGestacoes}
                    disabled={loading}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? '🔄 Excluindo...' : '🗑️ Excluir Gestações Órfãs'}
                  </button>
                )}
              </div>

              <button
                onClick={forcarSincronizacaoMobile}
                disabled={loading || !animalRg}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '🔄 Sincronizando...' : '📱 Forçar Sincronização Mobile'}
              </button>
            </div>
          </div>

          {erro && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-red-800 dark:text-red-200 font-semibold">❌ Erro</p>
              <p className="text-red-600 dark:text-red-300">{erro}</p>
            </div>
          )}

          {syncResult && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
              <p className="text-green-800 dark:text-green-200 font-semibold">✅ Sincronização Concluída</p>
              <div className="text-green-700 dark:text-green-300 mt-2">
                <p>Gestações órfãs removidas: {syncResult.gestacoesOrfasRemovidas}</p>
                <p>Gestações ativas: {syncResult.gestacoesAtivas}</p>
                <p className="mt-2 text-sm">Timestamp: {new Date(syncResult.timestamp).toLocaleString('pt-BR')}</p>
                <p className="mt-2 font-semibold">📱 Feche e abra o app mobile para ver as mudanças</p>
              </div>
            </div>
          )}

          {resultado && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                📊 Resultado
              </h2>

              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  {resultado.message}
                </p>
                <p className="text-blue-700 dark:text-blue-300">
                  Total: {resultado.total} gestação(ões)
                </p>
              </div>

              {resultado.gestacoes && resultado.gestacoes.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Data Cobertura
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Situação
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Receptora
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Mãe
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Pai
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {resultado.gestacoes.map((gestacao) => (
                        <tr key={gestacao.id}>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                            {gestacao.id}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                            {new Date(gestacao.data_cobertura).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                            {gestacao.situacao}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                            {gestacao.receptora}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                            {gestacao.mae || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                            {gestacao.pai || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
              ⚠️ Informações Importantes
            </h3>
            <ul className="list-disc list-inside text-yellow-800 dark:text-yellow-200 space-y-1">
              <li>Gestações órfãs são aquelas sem nascimento vinculado</li>
              <li>Gestações com nascimentos NUNCA são excluídas</li>
              <li>A exclusão é permanente e não pode ser desfeita</li>
              <li>Sempre verifique antes de excluir</li>
              <li>Use "Forçar Sincronização Mobile" após excluir para atualizar o app</li>
              <li>Feche e abra o app mobile após a sincronização</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}
