import React, { useState, useEffect } from 'react'
import { TrashIcon, CheckCircleIcon, ExclamationTriangleIcon } from '../components/ui/Icons'

export default function LimparDadosMock() {
  const [mounted, setMounted] = useState(false)
  const [dadosEncontrados, setDadosEncontrados] = useState([])
  const [limpezaRealizada, setLimpezaRealizada] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      verificarDadosMock()
    }
  }, [mounted])

  const verificarDadosMock = () => {
    if (typeof window === 'undefined') return

    const dadosMock = []
    
    // Lista de chaves do localStorage que podem conter dados mock
    const chavesParaVerificar = [
      'sales', // vendas
      'equipamentos',
      'custosNutricionais',
      'consumoRacao',
      'dietas',
      'protocolosSanitarios',
      'medicamentos',
      'insumos',
      'animals',
      'ocorrencias',
      'pesagens',
      'reproducao',
      'inseminacao',
      'transferencia-embrioes',
      'exames-andrologicos',
      'genealogia',
      'calendario-reprodutivo',
      'controle-reprodutivo',
      'suplementacao',
      'analise-nutricional',
      'estoque-semen',
      'nitrogenio',
      'lotes',
      'movimentacoes',
      'notas-fiscais',
      'fornecedores',
      'clientes',
      'contratos',
      'compras',
      'planejamento-metas',
      'planejamento-agenda',
      'planejamento-orcamento'
    ]

    chavesParaVerificar.forEach(chave => {
      try {
        const dados = localStorage.getItem(chave)
        if (dados) {
          const dadosParsed = JSON.parse(dados)
          if (Array.isArray(dadosParsed) && dadosParsed.length > 0) {
            // Verificar se contém dados que parecem mock
            const contemMock = dadosParsed.some(item => {
              const itemStr = JSON.stringify(item).toLowerCase()
              return (
                itemStr.includes('nelore 001') ||
                itemStr.includes('angus 045') ||
                itemStr.includes('guzerá 123') ||
                itemStr.includes('fazenda xyz') ||
                itemStr.includes('frigorífico abc') ||
                itemStr.includes('comprador def') ||
                itemStr.includes('central gen') ||
                itemStr.includes('genética premium') ||
                itemStr.includes('teste') ||
                itemStr.includes('exemplo') ||
                itemStr.includes('mock') ||
                itemStr.includes('demo')
              )
            })

            if (contemMock || dadosParsed.length > 0) {
              dadosMock.push({
                chave,
                quantidade: dadosParsed.length,
                contemMock,
                amostra: dadosParsed.slice(0, 2) // Primeiros 2 itens como amostra
              })
            }
          } else if (dadosParsed && typeof dadosParsed === 'object') {
            // Para objetos únicos
            dadosMock.push({
              chave,
              quantidade: 1,
              contemMock: false,
              amostra: [dadosParsed]
            })
          }
        }
      } catch (error) {
        console.error(`Erro ao verificar ${chave}:`, error)
      }
    })

    setDadosEncontrados(dadosMock)
  }

  const limparTodosDados = () => {
    if (!confirm('⚠️ ATENÇÃO: Esta ação irá remover TODOS os dados do sistema, incluindo dados reais que você possa ter cadastrado. Tem certeza que deseja continuar?')) {
      return
    }

    if (!confirm('🚨 CONFIRMAÇÃO FINAL: Todos os dados serão perdidos permanentemente. Esta ação não pode ser desfeita. Continuar?')) {
      return
    }

    setLoading(true)

    try {
      // Limpar todas as chaves encontradas
      dadosEncontrados.forEach(({ chave }) => {
        localStorage.removeItem(chave)
      })

      // Limpar outras chaves que podem existir
      const todasChaves = Object.keys(localStorage)
      todasChaves.forEach(chave => {
        // Manter apenas configurações essenciais
        if (!chave.includes('darkMode') && 
            !chave.includes('theme') && 
            !chave.includes('settings') &&
            !chave.includes('config')) {
          localStorage.removeItem(chave)
        }
      })

      setLimpezaRealizada(true)
      setDadosEncontrados([])
      
      setTimeout(() => {
        alert('✅ Limpeza concluída! Todos os dados mock foram removidos. A página será recarregada.')
        window.location.reload()
      }, 2000)

    } catch (error) {
      console.error('Erro durante a limpeza:', error)
      alert('❌ Erro durante a limpeza: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const limparChaveEspecifica = (chave) => {
    if (confirm(`Remover todos os dados de "${chave}"?`)) {
      localStorage.removeItem(chave)
      verificarDadosMock() // Recarregar lista
      alert(`✅ Dados de "${chave}" removidos com sucesso!`)
    }
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <TrashIcon className="w-8 h-8 text-red-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Limpeza de Dados Mock/Fictícios
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Remover dados de teste e demonstração do sistema
              </p>
            </div>
          </div>

          {limpezaRealizada ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
              <CheckCircleIcon className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-green-800 dark:text-green-200 mb-2">
                Limpeza Concluída!
              </h2>
              <p className="text-green-700 dark:text-green-300">
                Todos os dados mock foram removidos com sucesso.
              </p>
            </div>
          ) : (
            <>
              {dadosEncontrados.length === 0 ? (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
                  <CheckCircleIcon className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-blue-800 dark:text-blue-200 mb-2">
                    Sistema Limpo
                  </h2>
                  <p className="text-blue-700 dark:text-blue-300">
                    Nenhum dado mock foi encontrado no sistema.
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
                          Atenção: Dados Encontrados
                        </h3>
                        <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                          Foram encontrados {dadosEncontrados.length} tipos de dados no sistema. 
                          Verifique se há dados reais que você deseja manter antes de prosseguir.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Dados Encontrados:
                    </h3>
                    
                    {dadosEncontrados.map(({ chave, quantidade, contemMock, amostra }) => (
                      <div key={chave} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {chave}
                            </h4>
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded">
                              {quantidade} {quantidade === 1 ? 'item' : 'itens'}
                            </span>
                            {contemMock && (
                              <span className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded">
                                Contém dados mock
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => limparChaveEspecifica(chave)}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                          >
                            Remover
                          </button>
                        </div>
                        
                        {amostra.length > 0 && (
                          <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 mt-2">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Amostra dos dados:</p>
                            <pre className="text-xs text-gray-800 dark:text-gray-200 overflow-x-auto">
                              {JSON.stringify(amostra[0], null, 2).substring(0, 200)}
                              {JSON.stringify(amostra[0], null, 2).length > 200 && '...'}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={limparTodosDados}
                      disabled={loading}
                      className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Limpando...
                        </div>
                      ) : (
                        'Limpar Todos os Dados'
                      )}
                    </button>
                    
                    <button
                      onClick={verificarDadosMock}
                      className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Recarregar
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              📋 Instruções:
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Esta ferramenta remove dados de teste/demonstração do sistema</li>
              <li>• Verifique cuidadosamente se há dados reais que deseja manter</li>
              <li>• A limpeza é irreversível - faça backup se necessário</li>
              <li>• Configurações do sistema (tema, etc.) serão preservadas</li>
              <li>• Acesse: <code>localhost:3020/limpar-dados-mock</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}