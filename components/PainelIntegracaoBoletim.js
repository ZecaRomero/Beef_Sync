
import React, { useState } from 'react'

import { 
  DocumentTextIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  EyeIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline'
import { buscarOcorrenciasNF, verificarNFIntegrada } from '../services/notasFiscaisIntegration'

export default function PainelIntegracaoBoletim({ estatisticas, onRefresh }) {
  const [nfsSelecionadas, setNfsSelecionadas] = useState([])
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false)
  const [nfDetalhes, setNfDetalhes] = useState(null)

  const nfs = JSON.parse(localStorage.getItem('notasFiscais') || '[]')

  const handleSelecionarNF = (nfId) => {
    setNfsSelecionadas(prev => 
      prev.includes(nfId) 
        ? prev.filter(id => id !== nfId)
        : [...prev, nfId]
    )
  }

  const handleVerDetalhes = (nf) => {
    const ocorrencias = buscarOcorrenciasNF(nf.id)
    setNfDetalhes({ ...nf, ocorrencias })
    setMostrarDetalhes(true)
  }

  const getStatusIntegracao = (nfId) => {
    return verificarNFIntegrada(nfId) ? 'integrada' : 'pendente'
  }

  const getIconeStatus = (status) => {
    switch (status) {
      case 'integrada':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'pendente':
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getTextoStatus = (status) => {
    switch (status) {
      case 'integrada':
        return 'Integrada'
      case 'pendente':
        return 'Pendente'
      default:
        return 'Desconhecido'
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            🔗 Integração com Boletim de Animais
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Controle de integração entre notas fiscais e histórico de animais
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowPathIcon className="h-4 w-4" />
          <span>Atualizar</span>
        </button>
      </div>

      {/* Estatísticas de Integração */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="text-2xl">📋</div>
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400">Total de NFs</p>
              <p className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                {estatisticas.totalNFs || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="text-2xl">✅</div>
            <div>
              <p className="text-sm text-green-600 dark:text-green-400">Integradas</p>
              <p className="text-lg font-semibold text-green-700 dark:text-green-300">
                {estatisticas.nfsIntegradas || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="text-2xl">⏳</div>
            <div>
              <p className="text-sm text-orange-600 dark:text-orange-400">Pendentes</p>
              <p className="text-lg font-semibold text-orange-700 dark:text-orange-300">
                {estatisticas.pendentesIntegracao || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="text-2xl">📝</div>
            <div>
              <p className="text-sm text-purple-600 dark:text-purple-400">Ocorrências</p>
              <p className="text-lg font-semibold text-purple-700 dark:text-purple-300">
                {estatisticas.ocorrenciasGeradas || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Notas Fiscais */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">
          📋 Status de Integração das Notas Fiscais
        </h4>
        
        {nfs.length === 0 ? (
          <div className="text-center py-8">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">Nenhuma nota fiscal encontrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {nfs.map((nf) => {
              const status = getStatusIntegracao(nf.id)
              const ocorrencias = buscarOcorrenciasNF(nf.id)
              
              return (
                <div 
                  key={nf.id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getIconeStatus(status)}
                      <span className={`text-sm font-medium ${
                        status === 'integrada' ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
                      }`}>
                        {getTextoStatus(status)}
                      </span>
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          NF {nf.numeroNF}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          nf.tipo === 'entrada' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}>
                          {nf.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(nf.data)} • {formatCurrency(nf.valorTotal)} • {nf.itens?.length || 0} itens
                      </div>
                      {ocorrencias.length > 0 && (
                        <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                          {ocorrencias.length} ocorrência(s) no boletim
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleVerDetalhes(nf)}
                      className="flex items-center space-x-1 px-3 py-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                    >
                      <EyeIcon className="h-4 w-4" />
                      <span>Detalhes</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      {mostrarDetalhes && nfDetalhes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  📋 Detalhes da NF {nfDetalhes.numeroNF}
                </h3>
                <button
                  onClick={() => setMostrarDetalhes(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Dados da NF */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Dados da Nota Fiscal</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Tipo</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {nfDetalhes.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Data</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDate(nfDetalhes.data)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Valor Total</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(nfDetalhes.valorTotal ?? nfDetalhes.valor_total)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {nfDetalhes.tipo === 'entrada' ? 'Fornecedor' : 'Destino'}
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {nfDetalhes.tipo === 'entrada' ? nfDetalhes.fornecedor : nfDetalhes.destino}
                    </p>
                  </div>
                </div>
              </div>

              {/* Itens da NF */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Itens da Nota Fiscal</h4>
                <div className="space-y-3">
                  {nfDetalhes.itens?.map((item, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {item.tipoProduto === 'bovino' ? '🐄 Bovino' : 
                             item.tipoProduto === 'semen' ? '🧬 Sêmen' : '🧫 Embrião'}
                          </p>
                          {item.tipoProduto === 'bovino' && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Tatuagem: {item.tatuagem} • Sexo: {item.sexo} • Era: {item.era}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {formatCurrency(item.valorUnitario)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ocorrências no Boletim */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  📝 Ocorrências no Boletim de Animais ({nfDetalhes.ocorrencias.length})
                </h4>
                {nfDetalhes.ocorrencias.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <ClipboardDocumentListIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">Nenhuma ocorrência registrada no boletim</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {nfDetalhes.ocorrencias.map((ocorrencia, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {ocorrencia.tipo === 'entrada' ? '📥 Entrada' : '📤 Saída'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {formatDate(ocorrencia.data)} • {ocorrencia.descricao}
                            </p>
                            {ocorrencia.observacoes && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                {ocorrencia.observacoes}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {formatCurrency(ocorrencia.valor)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
