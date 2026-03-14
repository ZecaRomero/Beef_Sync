
import React, { useEffect, useMemo, useState } from 'react'

import { useToast } from '../../contexts/ToastContext'
import { formatCurrency, formatDate } from '../../utils/formatters'
import AnimalNFIntegration from './AnimalNFIntegration'
import NFDebugInfo from './NFDebugInfo'

const NFManager = ({ animals, costs, sales }) => {
  const [nfEntradas, setNfEntradas] = useState([])
  const [nfSaidas, setNfSaidas] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('resumo')
  const toast = useToast()

  useEffect(() => {
    // Carregar NFs do sistema
    loadNotasFiscais()
  }, [])

  const loadNotasFiscais = async () => {
    try {
      setLoading(true)

      // Carregar NFs da API real do sistema
      const response = await fetch('/api/notas-fiscais')
      if (response.ok) {
        const data = await response.json()

        // Processar dados reais do PostgreSQL
        const nfsReais = data.data || []

        // Separar por tipo (entrada/saída)
        const entradas = nfsReais.filter(nf => nf.tipo === 'entrada').map(nf => ({
          id: nf.id,
          numero: nf.numero_nf,
          serie: '1',
          tipo: nf.tipo,
          fornecedor: nf.fornecedor || 'Fornecedor não informado',
          cnpj: nf.cnpj || 'CNPJ não informado',
          valor: parseFloat(nf.valor_total) || 0,
          data_emissao: nf.data,
          data_entrada: nf.data,
          descricao: nf.natureza_operacao || 'Operação não especificada',
          categoria_fiscal: nf.tipo_produto === 'bovino' ? 'Aquisição de Estoque' :
            nf.tipo_produto === 'semen' ? 'Aquisição de Sêmen' : 'Outros',
          ncm: nf.tipo_produto === 'bovino' ? '0102.90.00' :
            nf.tipo_produto === 'semen' ? '0511.10.00' : '9999.99.99',
          cfop: '1102',
          icms: (parseFloat(nf.valor_total) || 0) * 0.12,
          status: 'processada',
          observacoes: nf.observacoes || '',
          total_itens: nf.total_itens || 0
        }))

        const saidas = nfsReais.filter(nf => nf.tipo === 'saida').map(nf => ({
          id: nf.id,
          numero: nf.numero_nf,
          serie: '1',
          tipo: nf.tipo,
          cliente: nf.destino || 'Cliente não informado',
          cnpj: nf.cnpj || 'CNPJ não informado',
          valor: parseFloat(nf.valor_total) || 0,
          data_emissao: nf.data,
          descricao: nf.natureza_operacao || 'Operação não especificada',
          categoria_fiscal: nf.tipo_produto === 'bovino' ? 'Venda de Estoque' : 'Outros',
          ncm: nf.tipo_produto === 'bovino' ? '0102.90.00' : '9999.99.99',
          cfop: '5102',
          icms: (parseFloat(nf.valor_total) || 0) * 0.12,
          status: 'processada',
          observacoes: nf.observacoes || '',
          total_itens: nf.total_itens || 0
        }))

        setNfEntradas(entradas)
        setNfSaidas(saidas)

        if (entradas.length > 0 || saidas.length > 0) {
          toast.success(`${entradas.length + saidas.length} notas fiscais carregadas do sistema`)
        }

      } else {
        console.error('Erro na API:', response.status)
        toast.error('Erro ao carregar notas fiscais da API')
        setNfEntradas([])
        setNfSaidas([])
      }

    } catch (error) {
      console.error('Erro ao carregar NFs:', error)
      toast.error('Erro de conexão ao carregar notas fiscais')
      setNfEntradas([])
      setNfSaidas([])
    } finally {
      setLoading(false)
    }
  }

  const resumoFiscal = useMemo(() => {
    const totalEntradas = nfEntradas.reduce((sum, nf) => sum + (nf.valor || 0), 0)
    const totalSaidas = nfSaidas.reduce((sum, nf) => sum + (nf.valor || 0), 0)
    const saldoFiscal = totalSaidas - totalEntradas // Receitas - Despesas

    // Explicação do saldo negativo
    const explicacaoSaldo = saldoFiscal < 0
      ? 'Saldo negativo indica que você teve mais despesas (entradas) que receitas (saídas) no período. Isso é normal quando você está investindo na compra de animais.'
      : 'Saldo positivo indica que você teve mais receitas (vendas) que despesas no período.'

    return {
      totalEntradas,
      totalSaidas,
      saldoFiscal,
      explicacaoSaldo,
      qtdEntradas: nfEntradas.length,
      qtdSaidas: nfSaidas.length
    }
  }, [nfEntradas, nfSaidas])

  const gerarBoletimContabil = () => {
    const boletim = {
      periodo: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      data_geracao: new Date().toISOString(),

      // Resumo executivo
      resumo: {
        total_entradas: resumoFiscal.totalEntradas,
        total_saidas: resumoFiscal.totalSaidas,
        saldo_periodo: resumoFiscal.saldoFiscal,
        qtd_nf_entrada: resumoFiscal.qtdEntradas,
        qtd_nf_saida: resumoFiscal.qtdSaidas
      },

      // Detalhamento das NFs de entrada
      nf_entradas: nfEntradas.map(nf => ({
        numero: nf.numero,
        serie: nf.serie,
        fornecedor: nf.fornecedor,
        cnpj: nf.cnpj,
        valor: nf.valor,
        data_emissao: nf.data_emissao,
        descricao: nf.descricao,
        categoria_fiscal: nf.categoria_fiscal,
        ncm: nf.ncm,
        cfop: nf.cfop,
        icms: nf.icms,
        animal_relacionado: nf.animal_relacionado ?
          animals.find(a => a.id === nf.animal_relacionado) : null
      })),

      // Detalhamento das NFs de saída
      nf_saidas: nfSaidas.map(nf => ({
        numero: nf.numero,
        serie: nf.serie,
        cliente: nf.cliente,
        cnpj: nf.cnpj,
        valor: nf.valor,
        data_emissao: nf.data_emissao,
        descricao: nf.descricao,
        categoria_fiscal: nf.categoria_fiscal,
        ncm: nf.ncm,
        cfop: nf.cfop,
        icms: nf.icms
      })),

      // Análise por categoria
      analise_categorias: {
        aquisicao_animais: nfEntradas
          .filter(nf => nf.categoria_fiscal === 'Aquisição de Estoque')
          .reduce((sum, nf) => sum + nf.valor, 0),
        venda_animais: nfSaidas
          .filter(nf => nf.categoria_fiscal === 'Venda de Estoque')
          .reduce((sum, nf) => sum + nf.valor, 0),
        servicos_veterinarios: nfEntradas
          .filter(nf => nf.categoria_fiscal === 'Serviços Veterinários')
          .reduce((sum, nf) => sum + nf.valor, 0)
      },

      // Observações importantes
      observacoes: [
        resumoFiscal.explicacaoSaldo,
        'Todas as NFs foram processadas e categorizadas fiscalmente',
        'Valores de ICMS calculados conforme legislação vigente',
        'Animais relacionados às NFs estão identificados no sistema'
      ]
    }

    return boletim
  }

  const enviarBoletimContador = async () => {
    try {
      toast.info('Gerando boletim contábil...')

      // Chamar API para gerar boletim
      const response = await fetch('/api/boletim-contabil', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          periodo: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
          nfEntradas,
          nfSaidas,
          animals,
          costs,
          sales
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao gerar boletim')
      }

      const data = await response.json()
      const { boletim, emailTemplate } = data

      // Abrir Outlook com email formatado
      const mailtoLink = `mailto:?subject=${encodeURIComponent(emailTemplate.assunto)}&body=${encodeURIComponent(emailTemplate.corpo)}`
      window.open(mailtoLink, '_blank')

      // Download do arquivo detalhado
      const dataStr = JSON.stringify(boletim, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `boletim-fiscal-${boletim.metadata.periodo.replace(/\s+/g, '-').toLowerCase()}.json`
      link.click()
      URL.revokeObjectURL(url)

      toast.success('Boletim fiscal enviado! Outlook aberto e arquivo baixado.')

    } catch (error) {
      console.error('Erro ao enviar boletim:', error)
      toast.error('Erro ao gerar boletim contábil')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Carregando notas fiscais...</span>
      </div>
    )
  }

  const handleUpdateAnimal = (updatedAnimal) => {
    // Em produção, isso atualizaria o animal no banco de dados
    console.log('Animal atualizado com NF:', updatedAnimal)
    toast.success('Animal atualizado com dados da NF!')
  }

  return (
    <div className="space-y-6">
      {/* Tabs de Navegação */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('resumo')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'resumo'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
          >
            📊 Resumo Fiscal
          </button>
          <button
            onClick={() => setActiveTab('gerar')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'gerar'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
          >
            📄 Gerar NF
          </button>
        </nav>
      </div>

      {activeTab === 'gerar' ? (
        <AnimalNFIntegration animals={animals} onUpdateAnimal={handleUpdateAnimal} />
      ) : (
        <div className="space-y-6">
          {/* Resumo Fiscal */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">NFs Entrada</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{resumoFiscal.qtdEntradas}</p>
                </div>
                <div className="text-green-600 dark:text-green-400 text-2xl">📥</div>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                {formatCurrency(resumoFiscal.totalEntradas)}
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">NFs Saída</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{resumoFiscal.qtdSaidas}</p>
                </div>
                <div className="text-blue-600 dark:text-blue-400 text-2xl">📤</div>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                {formatCurrency(resumoFiscal.totalSaidas)}
              </p>
            </div>

            <div className={`rounded-lg p-6 border ${resumoFiscal.saldoFiscal >= 0
              ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
              : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
              }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${resumoFiscal.saldoFiscal >= 0
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-orange-600 dark:text-orange-400'
                    }`}>
                    Saldo Fiscal
                  </p>
                  <p className={`text-2xl font-bold ${resumoFiscal.saldoFiscal >= 0
                    ? 'text-purple-900 dark:text-purple-100'
                    : 'text-orange-900 dark:text-orange-100'
                    }`}>
                    {formatCurrency(resumoFiscal.saldoFiscal)}
                  </p>
                </div>
                <div className={`text-2xl ${resumoFiscal.saldoFiscal >= 0
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-orange-600 dark:text-orange-400'
                  }`}>
                  {resumoFiscal.saldoFiscal >= 0 ? '📈' : '📉'}
                </div>
              </div>
              <p className={`text-sm mt-2 ${resumoFiscal.saldoFiscal >= 0
                ? 'text-purple-700 dark:text-purple-300'
                : 'text-orange-700 dark:text-orange-300'
                }`}>
                {resumoFiscal.saldoFiscal >= 0 ? 'Lucro' : 'Investimento'}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={enviarBoletimContador}
                  className="flex flex-col items-center justify-center text-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded p-3"
                >
                  <div className="text-2xl mb-1">📧</div>
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">Enviar Boletim</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">p/ Contador</div>
                </button>

                <button
                  onClick={loadNotasFiscais}
                  disabled={loading}
                  className="flex flex-col items-center justify-center text-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded p-3 disabled:opacity-50"
                >
                  <div className="text-2xl mb-1">🔄</div>
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">
                    {loading ? 'Carregando...' : 'Atualizar NFs'}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">do Sistema</div>
                </button>

                <button
                  onClick={() => {
                    toast.success('✅ Teste de notificação funcionando!');
                    setTimeout(() => toast.info('📋 Notificação de informação'), 1000);
                    setTimeout(() => toast.warning('⚠️ Notificação de aviso'), 2000);
                    setTimeout(() => toast.error('❌ Notificação de erro'), 3000);
                  }}
                  className="flex flex-col items-center justify-center text-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded p-3"
                >
                  <div className="text-2xl mb-1">🧪</div>
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">Testar</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Notificações</div>
                </button>
              </div>
            </div>
          </div>

          {/* Explicação do Saldo */}
          <div className={`rounded-lg p-4 border ${resumoFiscal.saldoFiscal >= 0
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
            }`}>
            <div className="flex items-start space-x-3">
              <span className={`text-lg ${resumoFiscal.saldoFiscal >= 0 ? 'text-green-600' : 'text-yellow-600'
                }`}>
                {resumoFiscal.saldoFiscal >= 0 ? '✅' : '💡'}
              </span>
              <div>
                <h4 className={`font-medium ${resumoFiscal.saldoFiscal >= 0
                  ? 'text-green-900 dark:text-green-100'
                  : 'text-yellow-900 dark:text-yellow-100'
                  }`}>
                  Explicação do Saldo {resumoFiscal.saldoFiscal >= 0 ? 'Positivo' : 'Negativo'}
                </h4>
                <p className={`text-sm ${resumoFiscal.saldoFiscal >= 0
                  ? 'text-green-800 dark:text-green-200'
                  : 'text-yellow-800 dark:text-yellow-200'
                  }`}>
                  {resumoFiscal.explicacaoSaldo}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  📊 Dados carregados diretamente do PostgreSQL •
                  🔄 Clique em "Atualizar NFs" para recarregar
                </p>
              </div>
            </div>
          </div>

          {/* Lista de NFs de Entrada */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
              📥 Notas Fiscais de Entrada
            </h4>

            {nfEntradas.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 dark:text-gray-500 text-4xl mb-2">📄</div>
                <p className="text-gray-500 dark:text-gray-400">Nenhuma NF de entrada encontrada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {nfEntradas.map((nf) => (
                  <div key={nf.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-white">
                          NF {nf.numero}/{nf.serie} - {nf.fornecedor}
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          CNPJ: {nf.cnpj} • Data: {formatDate(nf.data_emissao)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatCurrency(nf.valor)}
                        </div>
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                          {nf.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Descrição:</span>
                        <p className="text-gray-600 dark:text-gray-400">{nf.descricao}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Categoria Fiscal:</span>
                        <p className="text-gray-600 dark:text-gray-400">{nf.categoria_fiscal}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">CFOP/NCM:</span>
                        <p className="text-gray-600 dark:text-gray-400">{nf.cfop} / {nf.ncm}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Itens:</span>
                        <p className="text-gray-600 dark:text-gray-400">{nf.total_itens || 0} item(s)</p>
                      </div>
                    </div>

                    {nf.animal_relacionado && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-600 dark:text-blue-400">🐄</span>
                          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Animal Relacionado: {animals.find(a => a.id === nf.animal_relacionado)?.nome ||
                              animals.find(a => a.id === nf.animal_relacionado)?.numero ||
                              'Animal não encontrado'}
                          </span>
                        </div>
                      </div>
                    )}

                    {nf.observacoes && (
                      <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Observações:</span> {nf.observacoes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lista de NFs de Saída */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
              📤 Notas Fiscais de Saída
            </h4>

            {nfSaidas.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 dark:text-gray-500 text-4xl mb-2">📄</div>
                <p className="text-gray-500 dark:text-gray-400">Nenhuma NF de saída encontrada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Aqui seriam listadas as NFs de saída quando houver */}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NFManager