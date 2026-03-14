
import React, { useMemo, useState } from 'react'

import { formatCurrency, formatDate } from '../../utils/formatters'
import { useToast } from '../../contexts/ToastContext'

const TaxReports = ({ animals, costs, sales }) => {
  const [reportType, setReportType] = useState('darf')
  const [selectedPeriod, setSelectedPeriod] = useState('current_month')
  const toast = useToast()

  const taxData = useMemo(() => {
    const now = new Date()
    let startDate, endDate

    switch (selectedPeriod) {
      case 'current_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case 'current_year':
        startDate = new Date(now.getFullYear(), 0, 1)
        endDate = new Date(now.getFullYear(), 11, 31)
        break
      case 'last_year':
        startDate = new Date(now.getFullYear() - 1, 0, 1)
        endDate = new Date(now.getFullYear() - 1, 11, 31)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    }

    // Filtrar dados por período
    const periodCosts = costs?.filter(cost => {
      const costDate = new Date(cost.data)
      return costDate >= startDate && costDate <= endDate
    }) || []

    const periodSales = sales?.filter(sale => {
      const saleDate = new Date(sale.data)
      return saleDate >= startDate && saleDate <= endDate
    }) || []

    // Calcular valores para DARF
    const totalRevenue = periodSales.reduce((sum, sale) => sum + (parseFloat(sale.valor) || 0), 0)
    const totalCosts = periodCosts.reduce((sum, cost) => sum + (parseFloat(cost.valor) || 0), 0)
    const netIncome = totalRevenue - totalCosts

    // Cálculos tributários (valores aproximados para demonstração)
    const irpf = netIncome > 0 ? netIncome * 0.15 : 0 // 15% IR pessoa física
    const csll = netIncome > 0 ? netIncome * 0.09 : 0 // 9% CSLL
    const pis = totalRevenue * 0.0065 // 0.65% PIS
    const cofins = totalRevenue * 0.03 // 3% COFINS
    const icms = totalRevenue * 0.12 // 12% ICMS (varia por estado)

    return {
      period: { startDate, endDate },
      revenue: totalRevenue,
      costs: totalCosts,
      netIncome,
      taxes: {
        irpf,
        csll,
        pis,
        cofins,
        icms,
        total: irpf + csll + pis + cofins + icms
      },
      costsByCategory: periodCosts.reduce((acc, cost) => {
        const category = cost.tipo || 'Outros'
        acc[category] = (acc[category] || 0) + (parseFloat(cost.valor) || 0)
        return acc
      }, {}),
      salesByMonth: periodSales.reduce((acc, sale) => {
        const month = new Date(sale.data).toISOString().slice(0, 7)
        acc[month] = (acc[month] || 0) + (parseFloat(sale.valor) || 0)
        return acc
      }, {})
    }
  }, [costs, sales, selectedPeriod])

  const generateDARF = () => {
    const darfData = {
      codigo_receita: '0190', // Código para IR Pessoa Física
      periodo_apuracao: formatDate(taxData.period.startDate).slice(3), // MM/AAAA
      valor_principal: taxData.taxes.irpf,
      valor_multa: 0,
      valor_juros: 0,
      valor_total: taxData.taxes.irpf,
      vencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // 30 dias
      cnpj_cpf: '000.000.000-00', // Placeholder
      nome_contribuinte: 'Fazenda Sant Anna'
    }

    const darfContent = `
DOCUMENTO DE ARRECADAÇÃO DE RECEITAS FEDERAIS - DARF

Código da Receita: ${darfData.codigo_receita}
Período de Apuração: ${darfData.periodo_apuracao}
CNPJ/CPF: ${darfData.cnpj_cpf}
Nome/Razão Social: ${darfData.nome_contribuinte}

Valor Principal: ${formatCurrency(darfData.valor_principal)}
Multa: ${formatCurrency(darfData.valor_multa)}
Juros: ${formatCurrency(darfData.valor_juros)}
Valor Total: ${formatCurrency(darfData.valor_total)}

Data de Vencimento: ${formatDate(darfData.vencimento)}

DETALHAMENTO DA APURAÇÃO:
Receita Bruta: ${formatCurrency(taxData.revenue)}
(-) Custos Dedutíveis: ${formatCurrency(taxData.costs)}
(=) Base de Cálculo: ${formatCurrency(taxData.netIncome)}
Alíquota: 15%
Imposto Devido: ${formatCurrency(taxData.taxes.irpf)}

Gerado automaticamente pelo Sistema Beef Sync
Data: ${formatDate(new Date())}
    `

    const blob = new Blob([darfContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `DARF-${darfData.periodo_apuracao.replace('/', '-')}.txt`
    link.click()
    URL.revokeObjectURL(url)

    toast.success('DARF gerada e baixada!')
  }

  const generateDIMOB = () => {
    const dimobData = {
      ano_calendario: new Date().getFullYear(),
      declarante: {
        cnpj_cpf: '000.000.000-00',
        nome: 'Fazenda Sant Anna'
      },
      operacoes: sales.map(sale => ({
        tipo_operacao: '01', // Venda
        valor: sale.valor,
        data: sale.data,
        adquirente: sale.comprador,
        descricao: 'Venda de gado bovino'
      }))
    }

    const dimobContent = JSON.stringify(dimobData, null, 2)
    const blob = new Blob([dimobContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `DIMOB-${dimobData.ano_calendario}.json`
    link.click()
    URL.revokeObjectURL(url)

    toast.success('DIMOB gerada e baixada!')
  }

  const generateDIRPF = () => {
    const dirpfData = {
      ano_calendario: new Date().getFullYear() - 1,
      contribuinte: {
        cpf: '000.000.000-00',
        nome: 'Proprietário da Fazenda'
      },
      rendimentos: {
        atividade_rural: {
          receita_bruta: taxData.revenue,
          despesas_custeio: taxData.costs,
          resultado: taxData.netIncome
        }
      },
      bens_direitos: animals.filter(a => a.situacao === 'Ativo').map(animal => ({
        codigo: '31', // Semoventes
        discriminacao: `${animal.raca} - ${animal.sexo}`,
        valor_31_12: animal.custoTotal || 0
      }))
    }

    const dirpfContent = JSON.stringify(dirpfData, null, 2)
    const blob = new Blob([dirpfContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `DIRPF-${dirpfData.ano_calendario}.json`
    link.click()
    URL.revokeObjectURL(url)

    toast.success('Dados para DIRPF gerados e baixados!')
  }

  const sendToAccountant = () => {
    const reportData = {
      periodo: `${formatDate(taxData.period.startDate)} a ${formatDate(taxData.period.endDate)}`,
      resumo_tributario: {
        receita_bruta: taxData.revenue,
        custos_dedutiveis: taxData.costs,
        resultado_liquido: taxData.netIncome,
        impostos_devidos: taxData.taxes
      },
      detalhamento: {
        custos_por_categoria: taxData.costsByCategory,
        vendas_por_mes: taxData.salesByMonth
      }
    }

    const emailSubject = `Dados Tributários - ${reportData.periodo}`
    const emailBody = `Prezado(a) Contador(a),

Segue resumo tributário para o período de ${reportData.periodo}:

💰 RESUMO FINANCEIRO:
• Receita Bruta: ${formatCurrency(taxData.revenue)}
• Custos Dedutíveis: ${formatCurrency(taxData.costs)}
• Resultado Líquido: ${formatCurrency(taxData.netIncome)}

🏛️ IMPOSTOS CALCULADOS:
• IR Pessoa Física: ${formatCurrency(taxData.taxes.irpf)}
• CSLL: ${formatCurrency(taxData.taxes.csll)}
• PIS: ${formatCurrency(taxData.taxes.pis)}
• COFINS: ${formatCurrency(taxData.taxes.cofins)}
• ICMS: ${formatCurrency(taxData.taxes.icms)}
• TOTAL: ${formatCurrency(taxData.taxes.total)}

📊 PRINCIPAIS CATEGORIAS DE CUSTO:
${Object.entries(taxData.costsByCategory)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 5)
  .map(([cat, val]) => `• ${cat}: ${formatCurrency(val)}`)
  .join('\n')}

Por favor, revisar e proceder com as obrigações fiscais.

Atenciosamente,
Sistema Beef Sync`

    const mailtoLink = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
    window.open(mailtoLink, '_blank')

    // Também baixar dados detalhados
    const dataStr = JSON.stringify(reportData, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `dados-tributarios-${selectedPeriod}.json`
    link.click()
    URL.revokeObjectURL(url)

    toast.success('Email aberto e dados baixados!')
  }

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          🏛️ Relatórios Fiscais e Tributários
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Período
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="input-field"
            >
              <option value="current_month">Mês Atual</option>
              <option value="last_month">Mês Anterior</option>
              <option value="current_year">Ano Atual</option>
              <option value="last_year">Ano Anterior</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo de Relatório
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="input-field"
            >
              <option value="darf">DARF - Imposto de Renda</option>
              <option value="dimob">DIMOB - Operações Imobiliárias</option>
              <option value="dirpf">DIRPF - Declaração IR</option>
              <option value="summary">Resumo Tributário</option>
            </select>
          </div>
        </div>
      </div>

      {/* Resumo Tributário */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(taxData.revenue)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Receita Bruta</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(taxData.costs)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Custos Dedutíveis</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center">
            <div className={`text-2xl font-bold ${taxData.netIncome >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(taxData.netIncome)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Resultado Líquido</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatCurrency(taxData.taxes.total)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Impostos Devidos</div>
          </div>
        </div>
      </div>

      {/* Detalhamento dos Impostos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
          📊 Detalhamento dos Impostos
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            {Object.entries(taxData.taxes).filter(([key]) => key !== 'total').map(([tax, value]) => (
              <div key={tax} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {tax.toUpperCase()}
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(value)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <h5 className="font-medium text-gray-900 dark:text-white">Principais Custos</h5>
            {Object.entries(taxData.costsByCategory)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([category, amount]) => (
                <div key={category} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{category}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(amount)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={generateDARF}
          className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg transition-colors"
        >
          <div className="text-center">
            <div className="text-2xl mb-2">📄</div>
            <div className="font-semibold text-sm">Gerar DARF</div>
          </div>
        </button>

        <button
          onClick={generateDIMOB}
          className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg transition-colors"
        >
          <div className="text-center">
            <div className="text-2xl mb-2">🏠</div>
            <div className="font-semibold text-sm">Gerar DIMOB</div>
          </div>
        </button>

        <button
          onClick={generateDIRPF}
          className="bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-lg transition-colors"
        >
          <div className="text-center">
            <div className="text-2xl mb-2">📋</div>
            <div className="font-semibold text-sm">Dados DIRPF</div>
          </div>
        </button>

        <button
          onClick={sendToAccountant}
          className="bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-lg transition-colors"
        >
          <div className="text-center">
            <div className="text-2xl mb-2">📧</div>
            <div className="font-semibold text-sm">Enviar p/ Contador</div>
          </div>
        </button>
      </div>

      {/* Aviso Legal */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
        <div className="flex items-start space-x-3">
          <span className="text-yellow-600 dark:text-yellow-400 text-lg">⚠️</span>
          <div className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Aviso Legal:</strong> Os cálculos tributários são estimativas baseadas em alíquotas padrão. 
            Sempre consulte seu contador para valores exatos e cumprimento das obrigações fiscais. 
            As alíquotas podem variar conforme legislação estadual e federal.
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaxReports