
import React, { useEffect, useState } from 'react'

import { useToast } from '../../contexts/ToastContext'
import { formatCurrency, formatDate } from '../../utils/formatters'

const AccountingIntegration = ({ animals, costs, sales = [] }) => {
  const [accountingSettings, setAccountingSettings] = useState({
    contadorEmail: '',
    empresaEmail: '',
    autoSendReports: true,
    sendFrequency: 'monthly',
    includeNF: true,
    includeCosts: true,
    includeRevenue: true,
    nfTemplate: 'standard'
  })
  
  const [emailTemplates, setEmailTemplates] = useState({
    monthly: {
      subject: 'RelatÃ³rio Mensal - GestÃ£o Bovina - [MES/ANO]',
      body: `Prezado(a) Contador(a),

Segue em anexo o relatÃ³rio mensal da atividade pecuÃ¡ria referente ao perÃ­odo de [PERIODO].

Resumo do perÃ­odo:
- Total de animais: [TOTAL_ANIMAIS]
- Receita bruta: [RECEITA_BRUTA]
- Custos totais: [CUSTOS_TOTAIS]
- Resultado lÃ­quido: [RESULTADO_LIQUIDO]

Documentos em anexo:
- RelatÃ³rio detalhado de custos
- RelatÃ³rio de vendas e receitas
- Planilha de controle de estoque (animais)
- Notas fiscais do perÃ­odo (se aplicÃ¡vel)

Atenciosamente,
Zeca
Gerado pelo Sistema Beef Sync`
    },
    nf: {
      subject: 'Dados para EmissÃ£o de NF - Venda de Gado - [DATA]',
      body: `Prezado(a) Contador(a),

Solicito a emissÃ£o de Nota Fiscal referente Ã  venda de gado realizada em [DATA_VENDA].

Dados da venda:
- Comprador: [COMPRADOR]
- Valor total: [VALOR_TOTAL]
- Animais vendidos: [QTD_ANIMAIS]
- DescriÃ§Ã£o: [DESCRICAO_ANIMAIS]

Dados fiscais necessÃ¡rios:
- CNPJ/CPF do comprador: [A CONFIRMAR]
- ClassificaÃ§Ã£o fiscal: [CODIGO_NCM]
- AlÃ­quota de ICMS: [ALIQUOTA]

Por favor, proceder com a emissÃ£o da NF e me informar quando estiver disponÃ­vel.

Atenciosamente,
Sistema Beef Sync`
    }
  })

  const [pendingNFs, setPendingNFs] = useState([])
  const [reportHistory, setReportHistory] = useState([])
  const toast = useToast()

  useEffect(() => {
    // Carregar configuraÃ§Ãµes salvas
    const savedSettings = localStorage.getItem('accountingSettings')
    if (savedSettings) {
      setAccountingSettings(JSON.parse(savedSettings))
    }

    // Simular NFs pendentes baseadas nas vendas
    const pending = sales.filter(sale => !sale.nfEmitida).map(sale => ({
      id: sale.id,
      animal: animals.find(a => a.id === sale.animalId),
      sale,
      status: 'pending',
      createdAt: sale.data
    }))
    setPendingNFs(pending)

    // Simular histÃ³rico de relatÃ³rios
    setReportHistory([
      {
        id: 1,
        type: 'monthly',
        period: '2024-09',
        sentAt: '2024-10-01T09:00:00Z',
        recipient: accountingSettings.contadorEmail || 'contador@exemplo.com',
        status: 'sent'
      },
      {
        id: 2,
        type: 'nf_request',
        period: '2024-09-15',
        sentAt: '2024-09-15T14:30:00Z',
        recipient: accountingSettings.contadorEmail || 'contador@exemplo.com',
        status: 'sent'
      }
    ])
  }, [sales, animals, accountingSettings.contadorEmail])

  const saveSettings = () => {
    localStorage.setItem('accountingSettings', JSON.stringify(accountingSettings))
    toast.success('ConfiguraÃ§Ãµes de contabilidade salvas!')
  }

  const generateMonthlyReport = () => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    // Filtrar dados do mÃªs atual
    const monthlyData = {
      costs: costs.filter(cost => {
        const costDate = new Date(cost.data)
        return costDate.getMonth() === currentMonth && costDate.getFullYear() === currentYear
      }),
      sales: sales.filter(sale => {
        const saleDate = new Date(sale.data)
        return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear
      }),
      animals: animals.filter(a => a.situacao === 'Ativo')
    }

    const totalCosts = monthlyData.costs.reduce((sum, cost) => sum + (parseFloat(cost.valor) || 0), 0)
    const totalRevenue = monthlyData.sales.reduce((sum, sale) => sum + (parseFloat(sale.valor) || 0), 0)
    const netResult = totalRevenue - totalCosts

    return {
      period: `${String(currentMonth + 1).padStart(2, '0')}/${currentYear}`,
      totalAnimals: monthlyData.animals.length,
      totalCosts,
      totalRevenue,
      netResult,
      data: monthlyData
    }
  }

  const sendMonthlyReport = async () => {
    const report = generateMonthlyReport()
    const template = emailTemplates.monthly
    
    const emailBody = template.body
      .replace('[PERIODO]', report.period)
      .replace('[TOTAL_ANIMAIS]', report.totalAnimals)
      .replace('[RECEITA_BRUTA]', formatCurrency(report.totalRevenue))
      .replace('[CUSTOS_TOTAIS]', formatCurrency(report.totalCosts))
      .replace('[RESULTADO_LIQUIDO]', formatCurrency(report.netResult))

    const emailSubject = template.subject
      .replace('[MES/ANO]', report.period)

    // Criar dados para anexo (simulado)
    const attachmentData = {
      relatorio_mensal: {
        periodo: report.period,
        resumo: {
          total_animais: report.totalAnimals,
          receita_bruta: report.totalRevenue,
          custos_totais: report.totalCosts,
          resultado_liquido: report.netResult
        },
        detalhamento: {
          custos: report.data.costs,
          vendas: report.data.sales,
          estoque_animais: report.data.animals
        }
      }
    }

    // Simular envio de email
    try {
      toast.info('Preparando relatÃ³rio mensal...')
      
      // Simular delay de processamento
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Abrir cliente de email (Outlook)
      const mailtoLink = `mailto:${accountingSettings.contadorEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
      window.open(mailtoLink, '_blank')

      // Simular download do anexo
      const dataStr = JSON.stringify(attachmentData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `relatorio-mensal-${report.period.replace('/', '-')}.json`
      link.click()
      URL.revokeObjectURL(url)

      // Adicionar ao histÃ³rico
      const newReport = {
        id: Date.now(),
        type: 'monthly',
        period: report.period,
        sentAt: new Date().toISOString(),
        recipient: accountingSettings.contadorEmail,
        status: 'sent'
      }
      setReportHistory(prev => [newReport, ...prev])

      toast.success('RelatÃ³rio mensal enviado! Outlook aberto e arquivo baixado.')
    } catch (error) {
      toast.error('Erro ao enviar relatÃ³rio mensal')
    }
  }

  const sendNFRequest = async (saleData) => {
    const template = emailTemplates.nf
    const animal = animals.find(a => a.id === saleData.animalId)
    
    const emailBody = template.body
      .replace('[DATA_VENDA]', formatDate(saleData.data))
      .replace('[COMPRADOR]', saleData.comprador)
      .replace('[VALOR_TOTAL]', formatCurrency(saleData.valor))
      .replace('[QTD_ANIMAIS]', '1')
      .replace('[DESCRICAO_ANIMAIS]', `${animal?.raca} - ${animal?.sexo} - ${animal?.peso}kg`)
      .replace('[CODIGO_NCM]', '0102.90.00') // CÃ³digo NCM para bovinos vivos
      .replace('[ALIQUOTA]', '12%') // AlÃ­quota padrÃ£o ICMS

    const emailSubject = template.subject
      .replace('[DATA]', formatDate(saleData.data))

    try {
      toast.info('Preparando solicitaÃ§Ã£o de NF...')
      
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Abrir Outlook com dados da NF
      const mailtoLink = `mailto:${accountingSettings.contadorEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
      window.open(mailtoLink, '_blank')

      // Marcar como enviado
      setPendingNFs(prev => prev.map(nf => 
        nf.id === saleData.id ? { ...nf, status: 'requested' } : nf
      ))

      toast.success('SolicitaÃ§Ã£o de NF enviada! Outlook aberto.')
    } catch (error) {
      toast.error('Erro ao enviar solicitaÃ§Ã£o de NF')
    }
  }

  const exportTaxData = () => {
    const taxData = {
      empresa: {
        nome: 'Fazenda Sant Anna',
        cnpj: '00.000.000/0001-00',
        atividade: 'CriaÃ§Ã£o de bovinos'
      },
      periodo: new Date().getFullYear(),
      receitas: sales.map(sale => ({
        data: sale.data,
        valor: sale.valor,
        comprador: sale.comprador,
        descricao: 'Venda de gado bovino',
        ncm: '0102.90.00'
      })),
      despesas: costs.map(cost => ({
        data: cost.data,
        valor: cost.valor,
        tipo: cost.tipo,
        subtipo: cost.subtipo,
        descricao: cost.descricao,
        categoria_fiscal: getCategoriaFiscal(cost.tipo)
      })),
      estoque: animals.filter(a => a.situacao === 'Ativo').map(animal => ({
        identificacao: animal.numero,
        raca: animal.raca,
        sexo: animal.sexo,
        peso: animal.peso,
        valor_estimado: animal.custoTotal,
        data_nascimento: animal.dataNascimento
      }))
    }

    const dataStr = JSON.stringify(taxData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `dados-fiscais-${new Date().getFullYear()}.json`
    link.click()
    URL.revokeObjectURL(url)

    toast.success('Dados fiscais exportados!')
  }

  const getCategoriaFiscal = (tipoCusto) => {
    const categorias = {
      'Medicamentos': 'Custo de ProduÃ§Ã£o',
      'VeterinÃ¡rios': 'ServiÃ§os Terceirizados',
      'DNA': 'ServiÃ§os Terceirizados',
      'Manejo': 'Custo de ProduÃ§Ã£o',
      'Infraestrutura': 'Investimento/DepreciaÃ§Ã£o',
      'ReproduÃ§Ã£o': 'Custo de ProduÃ§Ã£o',
      'AquisiÃ§Ã£o': 'AquisiÃ§Ã£o de Estoque',
      'Outros': 'Despesas Operacionais'
    }
    return categorias[tipoCusto] || 'Despesas Operacionais'
  }

  return (
    <div className="space-y-6">
      {/* ConfiguraÃ§Ãµes de Contabilidade */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          ðÅ¸â€œÅ  ConfiguraÃ§Ãµes de Contabilidade
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email do Contador
              </label>
              <input
                type="email"
                value={accountingSettings.contadorEmail}
                onChange={(e) => setAccountingSettings(prev => ({ ...prev, contadorEmail: e.target.value }))}
                placeholder="contador@escritorio.com"
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email da Empresa
              </label>
              <input
                type="email"
                value={accountingSettings.empresaEmail}
                onChange={(e) => setAccountingSettings(prev => ({ ...prev, empresaEmail: e.target.value }))}
                placeholder="fazenda@empresa.com"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                FrequÃªncia de RelatÃ³rios
              </label>
              <select
                value={accountingSettings.sendFrequency}
                onChange={(e) => setAccountingSettings(prev => ({ ...prev, sendFrequency: e.target.value }))}
                className="input-field"
              >
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
                <option value="quarterly">Trimestral</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Envio AutomÃ¡tico de RelatÃ³rios
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Enviar relatÃ³rios automaticamente
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={accountingSettings.autoSendReports}
                  onChange={(e) => setAccountingSettings(prev => ({ ...prev, autoSendReports: e.target.checked }))}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Incluir Dados de NF
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Incluir informaÃ§Ãµes para emissÃ£o de notas fiscais
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={accountingSettings.includeNF}
                  onChange={(e) => setAccountingSettings(prev => ({ ...prev, includeNF: e.target.checked }))}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={saveSettings} className="btn-primary">
            ðÅ¸â€™¾ Salvar ConfiguraÃ§Ãµes
          </button>
        </div>
      </div>

      {/* AÃ§Ãµes RÃ¡pidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={sendMonthlyReport}
          className="bg-blue-500 hover:bg-blue-600 text-white p-6 rounded-lg transition-colors"
        >
          <div className="text-center">
            <div className="text-3xl mb-2">ðÅ¸â€œÅ </div>
            <div className="font-semibold">Enviar RelatÃ³rio Mensal</div>
            <div className="text-sm opacity-90">Abre Outlook + Download</div>
          </div>
        </button>

        <button
          onClick={exportTaxData}
          className="bg-green-500 hover:bg-green-600 text-white p-6 rounded-lg transition-colors"
        >
          <div className="text-center">
            <div className="text-3xl mb-2">ðÅ¸â€œâ€¹</div>
            <div className="font-semibold">Exportar Dados Fiscais</div>
            <div className="text-sm opacity-90">JSON para contabilidade</div>
          </div>
        </button>

        <button
          onClick={() => {
            const mailtoLink = `mailto:${accountingSettings.contadorEmail}?subject=DÃºvida sobre Contabilidade Rural`
            window.open(mailtoLink, '_blank')
          }}
          className="bg-purple-500 hover:bg-purple-600 text-white p-6 rounded-lg transition-colors"
        >
          <div className="text-center">
            <div className="text-3xl mb-2">âÅ“â€°ï¸�</div>
            <div className="font-semibold">Contatar Contador</div>
            <div className="text-sm opacity-90">Abrir Outlook</div>
          </div>
        </button>
      </div>

      {/* Notas Fiscais Pendentes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
          ðÅ¸â€œâ€ž Notas Fiscais Pendentes
        </h4>
        
        {pendingNFs.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-green-400 dark:text-green-500 text-4xl mb-2">âÅ“â€¦</div>
            <p className="text-gray-500 dark:text-gray-400">Nenhuma NF pendente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingNFs.map((nf) => (
              <div key={nf.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Venda para {nf.sale.comprador}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(nf.sale.data)} ââ‚¬¢ {formatCurrency(nf.sale.valor)} ââ‚¬¢ {nf.animal?.raca}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    nf.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                    'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                  }`}>
                    {nf.status === 'pending' ? 'Pendente' : 'Solicitada'}
                  </span>
                  {nf.status === 'pending' && (
                    <button
                      onClick={() => sendNFRequest(nf.sale)}
                      className="btn-primary text-sm"
                    >
                      ðÅ¸â€œ§ Solicitar NF
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* HistÃ³rico de Envios */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
          ðÅ¸â€œË† HistÃ³rico de Envios
        </h4>
        
        <div className="space-y-3">
          {reportHistory.map((report) => (
            <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-lg">
                  {report.type === 'monthly' ? 'ðÅ¸â€œÅ ' : 'ðÅ¸â€œâ€ž'}
                </span>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {report.type === 'monthly' ? 'RelatÃ³rio Mensal' : 'SolicitaÃ§Ã£o de NF'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(report.sentAt)} ââ‚¬¢ Para: {report.recipient}
                  </div>
                </div>
              </div>
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                Enviado
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AccountingIntegration