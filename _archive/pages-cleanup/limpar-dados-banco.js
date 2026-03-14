import React, { useState, useEffect } from 'react'
import { TrashIcon, CheckCircleIcon, ExclamationTriangleIcon, DatabaseIcon } from '../components/ui/Icons'

export default function LimparDadosBanco() {
  const [mounted, setMounted] = useState(false)
  const [dadosEncontrados, setDadosEncontrados] = useState({})
  const [limpando, setLimpando] = useState(false)
  const [concluido, setConcluido] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      verificarDadosMock()
    }
  }, [mounted])

  const verificarDadosMock = async () => {
    setLoading(true)
    const dados = {}

    try {
      // Verificar transferências de embriões
      const transferenciasRes = await fetch('/api/transferencias-embrioes')
      if (transferenciasRes.ok) {
        const transferenciasData = await transferenciasRes.json()
        const transferencias = transferenciasData.data || transferenciasData
        if (Array.isArray(transferencias)) {
          const mockTransferencias = transferencias.filter(t => 
            (t.receptora_nome && t.receptora_nome.toLowerCase().includes('vaca')) ||
            (t.doadora_nome && t.doadora_nome.toLowerCase().includes('vaca')) ||
            (t.receptora_nome && /\d{3}/.test(t.receptora_nome)) ||
            (t.doadora_nome && /\d{3}/.test(t.doadora_nome))
          )
          if (mockTransferencias.length > 0) {
            dados.transferencias = {
              total: transferencias.length,
              mock: mockTransferencias.length,
              exemplos: mockTransferencias.slice(0, 3)
            }
          }
        }
      }

      // Verificar outros dados que podem ter mock
      const endpoints = [
        { nome: 'animais', url: '/api/animals' },
        { nome: 'inseminacao', url: '/api/inseminacao' },
        { nome: 'exames-andrologicos', url: '/api/exames-andrologicos' },
        { nome: 'controle-reprodutivo', url: '/api/controle-reprodutivo' }
      ]

      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint.url)
          if (res.ok) {
            const data = await res.json()
            const items = data.data || data.animals || data
            if (Array.isArray(items) && items.length > 0) {
              const mockItems = items.filter(item => {
                const itemStr = JSON.stringify(item).toLowerCase()
                return (
                  itemStr.includes('vaca 001') ||
                  itemStr.includes('vaca 002') ||
                  itemStr.includes('touro 001') ||
                  itemStr.includes('teste') ||
                  itemStr.includes('exemplo') ||
                  itemStr.includes('mock') ||
                  itemStr.includes('demo')
                )
              })
              
              if (mockItems.length > 0) {
                dados[endpoint.nome] = {
                  total: items.length,
                  mock: mockItems.length,
                  exemplos: mockItems.slice(0, 2)
                }
              }
            }
          }
        } catch (error) {
          console.error(`Erro ao verificar ${endpoint.nome}:`, error)
        }
      }

      setDadosEncontrados(dados)
    } catch (error) {
      console.error('Erro ao verificar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const limparTransferencias = async () => {
    if (!dadosEncontrados.transferencias) return

    try {
      const transferenciasRes = await fetch('/api/transferencias-embrioes')
      const transferenciasData = await transferenciasRes.json()
      const transferencias = transferenciasData.data || transferenciasData

      for (const transferencia of transferencias) {
        const isMock = (
          (transferencia.receptora_nome && transferencia.receptora_nome.toLowerCase().includes('vaca')) ||
          (transferencia.doadora_nome && transferencia.doadora_nome.toLowerCase().includes('vaca')) ||
          (transferencia.receptora_nome && /\d{3}/.test(transferencia.receptora_nome)) ||
          (transferencia.doadora_nome && /\d{3}/.test(transferencia.doadora_nome))
        )

        if (isMock) {
          await fetch(`/api/transferencias-embrioes?id=${transferencia.id}`, {
            method: 'DELETE'
          })
        }
      }

      return true
    } catch (error) {
      console.error('Erro ao limpar transferências:', error)
      return false
    }
  }

  const limparTodosDados = async () => {
    if (!confirm('⚠️ ATENÇÃO: Esta ação irá remover dados mock do banco de dados PostgreSQL. Tem certeza?')) {
      return
    }

    if (!confirm('🚨 CONFIRMAÇÃO FINAL: Os dados serão removidos permanentemente do banco. Continuar?')) {
      return
    }

    setLimpando(true)

    try {
      let sucessos = 0
      let erros = 0

      // Limpar transferências
      if (dadosEncontrados.transferencias) {
        const resultado = await limparTransferencias()
        if (resultado) {
          sucessos++
        } else {
          erros++
        }
      }

      // Aqui você pode adicionar limpeza para outras tabelas se necessário

      if (sucessos > 0) {
        setConcluido(true)
        setTimeout(() => {
          alert(`✅ Limpeza concluída! ${sucessos} tipos de dados removidos, ${erros} erros.`)
          verificarDadosMock() // Recarregar dados
        }, 2000)
      } else {
        alert('ℹ️ Nenhum dado mock foi encontrado para remover.')
      }

    } catch (error) {
      console.error('Erro durante a limpeza:', error)
      alert('❌ Erro durante a limpeza: ' + error.message)
    } finally {
      setLimpando(false)
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
            <DatabaseIcon className="w-8 h-8 text-red-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Limpeza de Dados Mock do Banco
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Remover dados fictícios do banco PostgreSQL
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Verificando dados no banco...</p>
            </div>
          ) : concluido ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
              <CheckCircleIcon className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-green-800 dark:text-green-200 mb-2">
                Limpeza Concluída!
              </h2>
              <p className="text-green-700 dark:text-green-300">
                Dados mock removidos do banco de dados com sucesso.
              </p>
            </div>
          ) : (
            <>
              {Object.keys(dadosEncontrados).length === 0 ? (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
                  <CheckCircleIcon className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-blue-800 dark:text-blue-200 mb-2">
                    Banco Limpo
                  </h2>
                  <p className="text-blue-700 dark:text-blue-300">
                    Nenhum dado mock foi encontrado no banco PostgreSQL.
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
                          Dados Mock Encontrados no Banco
                        </h3>
                        <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                          Foram encontrados dados fictícios no banco PostgreSQL que podem ser removidos.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Dados Encontrados no Banco:
                    </h3>
                    
                    {Object.entries(dadosEncontrados).map(([tabela, info]) => (
                      <div key={tabela} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                              {tabela.replace('-', ' ')}
                            </h4>
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded">
                              {info.mock} de {info.total} registros
                            </span>
                            <span className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded">
                              Dados mock
                            </span>
                          </div>
                        </div>
                        
                        {info.exemplos && info.exemplos.length > 0 && (
                          <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 mt-2">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Exemplos encontrados:</p>
                            {info.exemplos.map((exemplo, index) => (
                              <div key={index} className="text-xs text-gray-800 dark:text-gray-200 mb-1">
                                • {exemplo.receptora_nome || exemplo.doadora_nome || exemplo.nome || exemplo.rg || 'Item mock'}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={limparTodosDados}
                      disabled={limpando}
                      className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {limpando ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Limpando Banco...
                        </div>
                      ) : (
                        'Limpar Dados Mock do Banco'
                      )}
                    </button>
                    
                    <button
                      onClick={verificarDadosMock}
                      disabled={loading}
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
              🗄️ Sobre esta Limpeza:
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Remove dados fictícios do banco PostgreSQL</li>
              <li>• Procura por padrões como "Vaca 001", "Vaca 002", etc.</li>
              <li>• Operação irreversível - faça backup se necessário</li>
              <li>• Acesse: <code>localhost:3020/limpar-dados-banco</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}