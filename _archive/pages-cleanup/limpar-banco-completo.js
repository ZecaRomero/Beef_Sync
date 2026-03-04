import React, { useState } from 'react'
import { useRouter } from 'next/router'
import ModernCard from '../components/ui/ModernCard'
import { CardBody } from '../components/ui/ModernCard'
import ModernButton from '../components/ui/ModernButton'
import Badge from '../components/ui/Badge'
import {
  ExclamationTriangleIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon
} from '../components/ui/Icons'

export default function LimparBancoCompleto() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirmacao, setConfirmacao] = useState('')
  const [resultado, setResultado] = useState(null)
  const [erro, setErro] = useState(null)

  const handleLimpezaCompleta = async () => {
    if (confirmacao !== 'LIMPAR TUDO DO ZERO') {
      alert('⚠️ Digite exatamente: LIMPAR TUDO DO ZERO')
      return
    }

    if (!confirm('🚨 ATENÇÃO: Esta operação é IRREVERSÍVEL!\n\nTODOS os dados serão excluídos:\n- Animais\n- Notas Fiscais\n- Boletim Contábil\n- Inseminações\n- Gestações\n- Nascimentos\n- Sêmen\n- Custos\n- Mortes\n- E TODAS as outras tabelas\n\nDeseja continuar?')) {
      return
    }

    if (!confirm('⚠️ ÚLTIMA CONFIRMAÇÃO!\n\nVocê tem CERTEZA que deseja excluir TODOS os dados?\n\nEsta ação NÃO pode ser desfeita!')) {
      return
    }

    setLoading(true)
    setErro(null)
    setResultado(null)

    try {
      const response = await fetch('/api/database/delete-all-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmacao: 'LIMPAR TUDO DO ZERO'
        })
      })

      const data = await response.json()

      if (response.ok) {
        setResultado(data.data)
        alert(`✅ Limpeza completa realizada!\n\n${data.data.total_excluido} registros excluídos de ${data.data.tabelas_processadas} tabelas.\n\nO banco está limpo e pronto para começar do zero.`)
      } else {
        setErro(data.message || 'Erro ao realizar limpeza')
        alert(`❌ Erro: ${data.message || 'Não foi possível realizar a limpeza'}`)
      }
    } catch (error) {
      console.error('Erro:', error)
      setErro(error.message || 'Erro ao conectar com o servidor')
      alert(`❌ Erro: ${error.message || 'Não foi possível conectar com o servidor'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-3">
          <TrashIcon className="h-10 w-10 text-red-600" />
          Limpeza Completa do Banco de Dados
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Excluir TODOS os dados e começar do zero
        </p>
      </div>

      {/* Aviso de Perigo */}
      <ModernCard className="border-2 border-red-500 bg-red-50 dark:bg-red-900/20">
        <CardBody>
          <div className="flex items-start gap-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h2 className="text-xl font-bold text-red-900 dark:text-red-200 mb-2">
                ⚠️ ATENÇÃO: OPERAÇÃO IRREVERSÍVEL
              </h2>
              <p className="text-red-800 dark:text-red-300 mb-4">
                Esta operação irá excluir <strong>TODOS</strong> os dados do banco de dados, incluindo:
              </p>
              <ul className="list-disc list-inside text-red-800 dark:text-red-300 space-y-1 mb-4">
                <li>🐄 Todos os animais e dados relacionados</li>
                <li>🧾 Todas as notas fiscais e itens</li>
                <li>📊 Boletim contábil e movimentações</li>
                <li>💉 Todas as inseminações</li>
                <li>🤰 Todas as gestações e diagnósticos</li>
                <li>👶 Todos os nascimentos</li>
                <li>🧪 Todo o estoque de sêmen</li>
                <li>💰 Todos os custos</li>
                <li>💀 Todas as mortes</li>
                <li>📍 Todas as localizações</li>
                <li>📋 Todos os protocolos e serviços</li>
                <li>📝 Todas as ocorrências</li>
                <li>E todas as outras tabelas do sistema</li>
              </ul>
              <p className="text-red-900 dark:text-red-100 font-bold text-lg">
                ⚠️ Esta ação NÃO pode ser desfeita! ⚠️
              </p>
            </div>
          </div>
        </CardBody>
      </ModernCard>

      {/* Formulário de Confirmação */}
      <ModernCard>
        <CardBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Digite exatamente: <strong className="text-red-600">LIMPAR TUDO DO ZERO</strong>
              </label>
              <input
                type="text"
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
                placeholder="LIMPAR TUDO DO ZERO"
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                disabled={loading}
              />
            </div>

            <ModernButton
              onClick={handleLimpezaCompleta}
              variant="danger"
              size="lg"
              disabled={loading || confirmacao !== 'LIMPAR TUDO DO ZERO'}
              loading={loading}
              className="w-full"
            >
              {loading ? '⏳ Excluindo todos os dados...' : '🗑️ EXCLUIR TUDO E COMEÇAR DO ZERO'}
            </ModernButton>
          </div>
        </CardBody>
      </ModernCard>

      {/* Resultado */}
      {resultado && (
        <ModernCard className="border-2 border-green-500">
          <CardBody>
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Limpeza Concluída
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Excluído</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {resultado.total_excluido.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tabelas Processadas</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {resultado.tabelas_processadas}
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Sequências Resetadas</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {resultado.sequencias_resetadas}
                  </p>
                </div>
              </div>

              {resultado.total_restante > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 p-4 rounded-lg">
                  <p className="text-yellow-800 dark:text-yellow-200">
                    ⚠️ Ainda restam {resultado.total_restante} registros no banco. Verifique os erros abaixo.
                  </p>
                </div>
              )}

              {/* Detalhes por Tabela */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Detalhes por Tabela
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {Object.entries(resultado.resultados_por_tabela).map(([tabela, dados]) => (
                    <div
                      key={tabela}
                      className={`p-3 rounded-lg border ${
                        dados.status === 'sucesso'
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : dados.status === 'erro'
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {tabela}
                          </p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Antes: {dados.antes}
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Excluídos: {dados.excluidos}
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Restantes: {(resultado.contagens_depois[tabela] || 0)}
                            </span>
                          </div>
                          {dados.erro && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                              Erro: {dados.erro}
                            </p>
                          )}
                        </div>
                        <div>
                          {dados.status === 'sucesso' && dados.excluidos > 0 && (
                            <Badge variant="success">✓</Badge>
                          )}
                          {dados.status === 'erro' && (
                            <Badge variant="danger">✗</Badge>
                          )}
                          {dados.status === 'tabela_nao_existe' && (
                            <Badge variant="default">-</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {resultado.erros && resultado.erros.length > 0 && (
                <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 p-4 rounded-lg">
                  <h4 className="font-semibold text-red-900 dark:text-red-200 mb-2">
                    Erros Encontrados:
                  </h4>
                  <ul className="list-disc list-inside text-red-800 dark:text-red-300 space-y-1">
                    {resultado.erros.map((erro, idx) => (
                      <li key={idx}>
                        {erro.tabela}: {erro.erro}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardBody>
        </ModernCard>
      )}

      {/* Erro */}
      {erro && (
        <ModernCard className="border-2 border-red-500">
          <CardBody>
            <div className="flex items-center gap-2">
              <XCircleIcon className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-200">
                  Erro na Limpeza
                </h3>
                <p className="text-red-800 dark:text-red-300">{erro}</p>
              </div>
            </div>
          </CardBody>
        </ModernCard>
      )}

      {/* Botão Voltar */}
      <div className="text-center">
        <ModernButton
          onClick={() => router.push('/animals')}
          variant="secondary"
        >
          ← Voltar para Animais
        </ModernButton>
      </div>
    </div>
  )
}
