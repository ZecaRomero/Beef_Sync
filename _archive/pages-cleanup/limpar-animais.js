import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { ExclamationTriangleIcon, TrashIcon } from '@heroicons/react/24/outline'

export default function LimparAnimais() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirmacao, setConfirmacao] = useState('')
  const [resultado, setResultado] = useState(null)
  const [erro, setErro] = useState(null)
  const [totalAnimais, setTotalAnimais] = useState(null)

  // Carregar total de animais ao montar componente
  useEffect(() => {
    const carregarTotal = async () => {
      try {
        const response = await fetch('/api/animals')
        if (response.ok) {
          const data = await response.json()
          if (data.data && Array.isArray(data.data)) {
            setTotalAnimais(data.data.length)
          }
        }
      } catch (error) {
        console.error('Erro ao carregar total de animais:', error)
      }
    }
    carregarTotal()
  }, [])

  const handleLimpar = async () => {
    if (confirmacao !== 'EXCLUIR TODOS OS ANIMAIS') {
      setErro('Por favor, digite exatamente: EXCLUIR TODOS OS ANIMAIS')
      return
    }

    if (!window.confirm('⚠️ ATENÇÃO: Esta operação é IRREVERSÍVEL!\n\nTodos os animais e dados relacionados serão PERMANENTEMENTE excluídos.\n\nDeseja continuar?')) {
      return
    }

    setLoading(true)
    setErro(null)
    setResultado(null)

    try {
      const response = await fetch('/api/animals/delete-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmacao: 'EXCLUIR TODOS OS ANIMAIS'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao excluir animais')
      }

      setResultado(data.data)
      
      // Redirecionar para lista de animais após 3 segundos
      setTimeout(() => {
        router.push('/animals')
      }, 3000)

    } catch (error) {
      console.error('Erro:', error)
      setErro(error.message || 'Erro ao excluir animais')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <TrashIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Limpar Todos os Animais
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Excluir permanentemente todos os animais do banco de dados
              </p>
            </div>
          </div>

          {/* Aviso de segurança */}
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">
                  ⚠️ OPERAÇÃO IRREVERSÍVEL
                </h3>
                <ul className="list-disc list-inside space-y-1 text-red-800 dark:text-red-300 text-sm">
                  <li>Todos os animais serão <strong>permanentemente excluídos</strong></li>
                  <li>Todos os custos relacionados serão excluídos</li>
                  <li>Todas as localizações serão excluídas</li>
                  <li>Todas as mortes registradas serão excluídas</li>
                  <li>Esta ação <strong>NÃO PODE SER DESFEITA</strong></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Estatísticas */}
          {totalAnimais !== null && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <p className="text-blue-900 dark:text-blue-200">
                <strong>Total de animais no banco:</strong> {totalAnimais.toLocaleString('pt-BR')}
              </p>
            </div>
          )}

          {/* Campo de confirmação */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Para confirmar, digite exatamente: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">EXCLUIR TODOS OS ANIMAIS</code>
            </label>
            <input
              type="text"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Digite a confirmação aqui..."
              disabled={loading}
            />
          </div>

          {/* Botão de ação */}
          <div className="flex gap-4">
            <button
              onClick={() => router.back()}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              onClick={handleLimpar}
              disabled={loading || confirmacao !== 'EXCLUIR TODOS OS ANIMAIS'}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Excluindo...
                </>
              ) : (
                <>
                  <TrashIcon className="h-5 w-5" />
                  Excluir Todos os Animais
                </>
              )}
            </button>
          </div>

          {/* Resultado */}
          {resultado && (
            <div className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-200 mb-2">
                ✅ Exclusão Concluída com Sucesso!
              </h3>
              <div className="space-y-1 text-sm text-green-800 dark:text-green-300">
                <p><strong>Animais excluídos:</strong> {resultado.total_excluidos?.toLocaleString('pt-BR') || 0}</p>
                {resultado.registros_relacionados_excluidos && (
                  <>
                    <p><strong>Custos excluídos:</strong> {resultado.registros_relacionados_excluidos.custos?.toLocaleString('pt-BR') || 0}</p>
                    <p><strong>Localizações excluídas:</strong> {resultado.registros_relacionados_excluidos.localizacoes?.toLocaleString('pt-BR') || 0}</p>
                    <p><strong>Mortes excluídas:</strong> {resultado.registros_relacionados_excluidos.mortes?.toLocaleString('pt-BR') || 0}</p>
                  </>
                )}
              </div>
              <p className="mt-3 text-sm text-green-700 dark:text-green-400">
                Redirecionando para a lista de animais...
              </p>
            </div>
          )}

          {/* Erro */}
          {erro && (
            <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">
                ❌ Erro
              </h3>
              <p className="text-red-800 dark:text-red-300">{erro}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
