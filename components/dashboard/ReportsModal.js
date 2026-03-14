
import React, { useState } from 'react'


export default function ReportsModal({ reportType, onClose, timeRange }) {
  const [selectedTab, setSelectedTab] = useState('overview')
  const [exportFormat, setExportFormat] = useState('excel')

  // Gerar dados do relatÃ³rio baseado no tipo
  const generateReportData = () => {
    switch (reportType) {
      case 'invested':
        return {
          title: 'ðÅ¸â€™° RelatÃ³rio de Investimentos',
          description: 'AnÃ¡lise detalhada dos investimentos realizados',
          data: mockAnimals.map(animal => ({
            animal: `${animal.serie} ${animal.rg}`,
            raca: animal.raca,
            situacao: animal.situacao,
            investimento: parseFloat(animal.custoTotal || animal.custo_total) || 0,
            idade: parseFloat(animal.meses) || 0,
            custoMensal: (parseFloat(animal.meses) || 0) > 0 ? (parseFloat(animal.custoTotal || animal.custo_total) || 0) / (parseFloat(animal.meses) || 1) : 0
          })).sort((a, b) => b.investimento - a.investimento),
          summary: {
            total: mockAnimals.reduce((acc, a) => acc + a.custoTotal, 0),
            average: mockAnimals.reduce((acc, a) => acc + a.custoTotal, 0) / mockAnimals.length,
            highest: mockAnimals.length > 0 ? Math.max(...mockAnimals.map(a => parseFloat(a.custoTotal || a.custo_total) || 0)) : 0,
            lowest: mockAnimals.length > 0 ? Math.min(...mockAnimals.map(a => parseFloat(a.custoTotal || a.custo_total) || 0)) : 0
          }
        }

      case 'revenue':
        const soldAnimals = mockAnimals.filter(a => a.valorVenda)
        return {
          title: 'ðÅ¸â€œË† RelatÃ³rio de Receitas',
          description: 'AnÃ¡lise das receitas obtidas com vendas',
          data: soldAnimals.map(animal => ({
            animal: `${animal.serie} ${animal.rg}`,
            raca: animal.raca,
            investimento: parseFloat(animal.custoTotal || animal.custo_total) || 0,
            receita: parseFloat(animal.valorVenda || animal.valor_venda) || 0,
            lucro: (parseFloat(animal.valorVenda || animal.valor_venda) || 0) - (parseFloat(animal.custoTotal || animal.custo_total) || 0),
            roi: (() => {
              const custo = parseFloat(animal.custoTotal || animal.custo_total) || 0
              const valor = parseFloat(animal.valorVenda || animal.valor_venda) || 0
              return custo > 0 ? ((valor - custo) / custo * 100) : 0
            })()
          })).sort((a, b) => b.receita - a.receita),
          summary: {
            total: soldAnimals.reduce((acc, a) => acc + (parseFloat(a.valorVenda || a.valor_venda) || 0), 0),
            average: soldAnimals.length > 0 ? soldAnimals.reduce((acc, a) => acc + (parseFloat(a.valorVenda || a.valor_venda) || 0), 0) / soldAnimals.length : 0,
            highest: soldAnimals.length > 0 ? Math.max(...soldAnimals.map(a => parseFloat(a.valorVenda || a.valor_venda) || 0)) : 0,
            count: soldAnimals.length
          }
        }

      case 'profit':
        const profitableAnimals = mockAnimals.filter(a => a.valorVenda)
        return {
          title: 'ðÅ¸Å½¯ RelatÃ³rio de Lucros',
          description: 'AnÃ¡lise da lucratividade das operaÃ§Ãµes',
          data: profitableAnimals.map(animal => ({
            animal: `${animal.serie} ${animal.rg}`,
            raca: animal.raca,
            investimento: parseFloat(animal.custoTotal || animal.custo_total) || 0,
            receita: parseFloat(animal.valorVenda || animal.valor_venda) || 0,
            lucro: (parseFloat(animal.valorVenda || animal.valor_venda) || 0) - (parseFloat(animal.custoTotal || animal.custo_total) || 0),
            roi: (() => {
              const custo = parseFloat(animal.custoTotal || animal.custo_total) || 0
              const valor = parseFloat(animal.valorVenda || animal.valor_venda) || 0
              return custo > 0 ? ((valor - custo) / custo * 100) : 0
            })(),
            margem: (() => {
              const valor = parseFloat(animal.valorVenda || animal.valor_venda) || 0
              const custo = parseFloat(animal.custoTotal || animal.custo_total) || 0
              return valor > 0 ? ((valor - custo) / valor * 100) : 0
            })()
          })).sort((a, b) => b.lucro - a.lucro),
          summary: {
            total: profitableAnimals.reduce((acc, a) => {
              const valorVenda = parseFloat(a.valorVenda || a.valor_venda) || 0
              const custoTotal = parseFloat(a.custoTotal || a.custo_total) || 0
              return acc + (valorVenda - custoTotal)
            }, 0),
            positive: profitableAnimals.filter(a => {
              const valor = parseFloat(a.valorVenda || a.valor_venda) || 0
              const custo = parseFloat(a.custoTotal || a.custo_total) || 0
              return (valor - custo) > 0
            }).length,
            negative: profitableAnimals.filter(a => {
              const valor = parseFloat(a.valorVenda || a.valor_venda) || 0
              const custo = parseFloat(a.custoTotal || a.custo_total) || 0
              return (valor - custo) < 0
            }).length,
            averageMargin: profitableAnimals.length > 0 ? 
              profitableAnimals.reduce((acc, a) => {
                const valorVenda = parseFloat(a.valorVenda || a.valor_venda) || 0
                const custoTotal = parseFloat(a.custoTotal || a.custo_total) || 0
                return acc + (valorVenda > 0 ? ((valorVenda - custoTotal) / valorVenda * 100) : 0)
              }, 0) / profitableAnimals.length : 0
          }
        }

      case 'roi':
        const roiAnimals = mockAnimals.filter(a => a.valorVenda)
        return {
          title: 'ðÅ¸â€œÅ  RelatÃ³rio de ROI',
          description: 'AnÃ¡lise do retorno sobre investimento',
          data: roiAnimals.map(animal => ({
            animal: `${animal.serie} ${animal.rg}`,
            raca: animal.raca,
            investimento: parseFloat(animal.custoTotal || animal.custo_total) || 0,
            receita: parseFloat(animal.valorVenda || animal.valor_venda) || 0,
            roi: (() => {
              const custo = parseFloat(animal.custoTotal || animal.custo_total) || 0
              const valor = parseFloat(animal.valorVenda || animal.valor_venda) || 0
              return custo > 0 ? ((valor - custo) / custo * 100) : 0
            })(),
            periodo: parseFloat(animal.meses) || 0,
            roiMensal: (() => {
              const meses = parseFloat(animal.meses) || 0
              const custo = parseFloat(animal.custoTotal || animal.custo_total) || 0
              const valor = parseFloat(animal.valorVenda || animal.valor_venda) || 0
              return meses > 0 && custo > 0 ? ((valor - custo) / custo * 100) / meses : 0
            })()
          })).sort((a, b) => b.roi - a.roi),
          summary: {
            average: roiAnimals.length > 0 ? 
              roiAnimals.reduce((acc, a) => {
                const valorVenda = parseFloat(a.valorVenda || a.valor_venda) || 0
                const custoTotal = parseFloat(a.custoTotal || a.custo_total) || 0
                return acc + (custoTotal > 0 ? ((valorVenda - custoTotal) / custoTotal * 100) : 0)
              }, 0) / roiAnimals.length : 0,
            best: roiAnimals.length > 0 ? 
              Math.max(...roiAnimals.map(a => {
                const custo = parseFloat(a.custoTotal || a.custo_total) || 0
                const valor = parseFloat(a.valorVenda || a.valor_venda) || 0
                return custo > 0 ? ((valor - custo) / custo * 100) : 0
              })) : 0,
            worst: roiAnimals.length > 0 ? 
              Math.min(...roiAnimals.map(a => {
                const custo = parseFloat(a.custoTotal || a.custo_total) || 0
                const valor = parseFloat(a.valorVenda || a.valor_venda) || 0
                return custo > 0 ? ((valor - custo) / custo * 100) : 0
              })) : 0,
            above20: roiAnimals.filter(a => {
              const custo = parseFloat(a.custoTotal || a.custo_total) || 0
              const valor = parseFloat(a.valorVenda || a.valor_venda) || 0
              return custo > 0 && ((valor - custo) / custo * 100) > 20
            }).length
          }
        }

      default:
        return {
          title: 'ðÅ¸â€œâ€¹ RelatÃ³rio Geral',
          description: 'VisÃ£o geral dos dados',
          data: [],
          summary: {}
        }
    }
  }

  const reportData = generateReportData()

  const tabs = [
    { id: 'overview', label: 'ðÅ¸â€œÅ  VisÃ£o Geral', icon: 'ðÅ¸â€œÅ ' },
    { id: 'details', label: 'ðÅ¸â€œâ€¹ Detalhes', icon: 'ðÅ¸â€œâ€¹' },
    { id: 'charts', label: 'ðÅ¸â€œË† GrÃ¡ficos', icon: 'ðÅ¸â€œË†' },
    { id: 'export', label: 'ðÅ¸â€œ¤ Exportar', icon: 'ðÅ¸â€œ¤' }
  ]

  const handleExport = () => {
    // Simular exportaÃ§Ã£o
    const formats = {
      excel: 'Excel (.xlsx)',
      pdf: 'PDF (.pdf)',
      csv: 'CSV (.csv)'
    }
    
    alert(`Exportando relatÃ³rio em formato ${formats[exportFormat]}...`)
    setTimeout(() => {
      alert('âÅ“â€¦ RelatÃ³rio exportado com sucesso!')
    }, 2000)
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Resumo Executivo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(reportData.summary).map(([key, value]) => (
          <div key={key} className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {typeof value === 'number' ? 
                (key.includes('roi') || key.includes('margin') || key.includes('average') && value < 100 ? 
                  `${value.toFixed(1)}%` : 
                  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`) : 
                value
              }
            </div>
          </div>
        ))}
      </div>

      {/* Insights */}
      <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <span className="mr-2">ðÅ¸â€™¡</span>
          Insights Principais
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reportType === 'invested' && (
            <>
              <div className="flex items-start space-x-3">
                <span className="text-green-500">âÅ“â€¦</span>
                <div>
                  <div className="font-medium">DiversificaÃ§Ã£o Adequada</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Investimentos distribuÃ­dos entre diferentes raÃ§as
                  </div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-yellow-500">âÅ¡ ï¸�</span>
                <div>
                  <div className="font-medium">Monitorar Custos Altos</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Alguns animais com investimento acima da mÃ©dia
                  </div>
                </div>
              </div>
            </>
          )}
          {reportType === 'revenue' && (
            <>
              <div className="flex items-start space-x-3">
                <span className="text-green-500">ðÅ¸â€œË†</span>
                <div>
                  <div className="font-medium">Receita Crescente</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    TendÃªncia positiva nas vendas realizadas
                  </div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-blue-500">ðÅ¸Å½¯</span>
                <div>
                  <div className="font-medium">Oportunidade de Melhoria</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Potencial para aumentar preÃ§os de venda
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )

  const renderDetails = () => (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-white">Animal</th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-white">RaÃ§a</th>
              {reportData.data[0] && Object.keys(reportData.data[0]).slice(2).map(key => (
                <th key={key} className="text-left p-3 font-semibold text-gray-900 dark:text-white capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reportData.data.slice(0, 10).map((row, index) => (
              <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="p-3 font-medium text-gray-900 dark:text-white">{row.animal}</td>
                <td className="p-3 text-gray-600 dark:text-gray-400">{row.raca}</td>
                {Object.entries(row).slice(2).map(([key, value]) => (
                  <td key={key} className="p-3 text-gray-600 dark:text-gray-400">
                    {typeof value === 'number' ? 
                      (key.includes('roi') || key.includes('margem') ? 
                        `${(value || 0).toFixed(1)}%` : 
                        `R$ ${(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`) : 
                      (value || '-')
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {reportData.data.length > 10 && (
        <div className="text-center p-4 text-gray-500 dark:text-gray-400">
          Mostrando 10 de {reportData.data.length} registros
        </div>
      )}
    </div>
  )

  const renderCharts = () => (
    <div className="space-y-6">
      <div className="text-center p-8 text-gray-500 dark:text-gray-400">
        <div className="text-4xl mb-4">ðÅ¸â€œÅ </div>
        <div className="text-lg font-medium mb-2">GrÃ¡ficos Interativos</div>
        <div className="text-sm">
          VisualizaÃ§Ãµes avanÃ§adas dos dados do relatÃ³rio
        </div>
      </div>
      
      {/* Placeholder para grÃ¡ficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-64 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl mb-2">ðÅ¸â€œË†</div>
            <div className="font-medium">GrÃ¡fico de TendÃªncia</div>
          </div>
        </div>
        <div className="h-64 bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl mb-2">ðÅ¸¥§</div>
            <div className="font-medium">DistribuiÃ§Ã£o</div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderExport = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-4xl mb-4">ðÅ¸â€œ¤</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Exportar RelatÃ³rio
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Escolha o formato desejado para exportaÃ§Ã£o
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { id: 'excel', label: 'Excel', icon: 'ðÅ¸â€œÅ ', desc: 'Planilha completa com dados' },
          { id: 'pdf', label: 'PDF', icon: 'ðÅ¸â€œâ€ž', desc: 'RelatÃ³rio formatado para impressÃ£o' },
          { id: 'csv', label: 'CSV', icon: 'ðÅ¸â€œâ€¹', desc: 'Dados em formato texto' }
        ].map(format => (
          <button
            key={format.id}
            onClick={() => setExportFormat(format.id)}
            className={`p-6 rounded-lg border-2 transition-all duration-300 ${
              exportFormat === format.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="text-3xl mb-3">{format.icon}</div>
            <div className="font-semibold text-gray-900 dark:text-white mb-1">
              {format.label}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {format.desc}
            </div>
          </button>
        ))}
      </div>

      <div className="text-center">
        <button
          onClick={handleExport}
          className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
        >
          Exportar RelatÃ³rio
        </button>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {reportData.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {reportData.description} ââ‚¬¢ PerÃ­odo: {timeRange}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-3xl font-bold transition-colors"
          >
            Ãâ€”
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-all duration-300 ${
                selectedTab === tab.id
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {selectedTab === 'overview' && renderOverview()}
          {selectedTab === 'details' && renderDetails()}
          {selectedTab === 'charts' && renderCharts()}
          {selectedTab === 'export' && renderExport()}
        </div>
      </div>
    </div>
  )
}