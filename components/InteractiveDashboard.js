
import React, { useEffect, useState } from 'react'

import { useRouter } from 'next/router'
import animalDataManager from '../services/animalDataManager'
import EmptyState from './EmptyState'

export default function InteractiveDashboard() {
  const router = useRouter()
  const [selectedMetric, setSelectedMetric] = useState('custos')
  const [showModal, setShowModal] = useState(false)
  const [selectedCard, setSelectedCard] = useState(null)
  const [animals, setAnimals] = useState([])

  // Carregar dados dos animais
  useEffect(() => {
    const loadAnimals = () => {
      const currentAnimals = animalDataManager.getAllAnimals()
      // Garantir que sempre seja um array
      setAnimals(Array.isArray(currentAnimals) ? currentAnimals : [])
    }

    loadAnimals()
    animalDataManager.addListener(loadAnimals)

    return () => {
      animalDataManager.removeListener(loadAnimals)
    }
  }, [])

  // Se nÃ£o hÃ¡ animais, mostrar estado vazio
  if (!Array.isArray(animals) || animals.length === 0) {
    return (
      <EmptyState
        title="Dashboard Interativo"
        description="Cadastre animais para ver grÃ¡ficos interativos, anÃ¡lises de custos e performance detalhada do seu rebanho."
        icon="ðÅ¸â€œÅ "
        actionLabel="ComeÃ§ar Agora"
        onAction={() => router.push('/animals')}
      />
    )
  }

  // Dados para anÃ¡lises - com validaÃ§Ã£o
  const custosPorTipo = Array.isArray(animals) ? animals.reduce((acc, animal) => {
    if (animal.custos && Array.isArray(animal.custos)) {
      animal.custos.forEach(custo => {
        if (custo.valor > 0) {
          acc[custo.tipo] = (acc[custo.tipo] || 0) + custo.valor
        }
      })
    }
    return acc
  }, {}) : {}

  const animaisPorRaca = Array.isArray(animals) ? animals.reduce((acc, animal) => {
    if (animal.raca) {
      acc[animal.raca] = (acc[animal.raca] || 0) + 1
    }
    return acc
  }, {}) : {}

  // MÃ©tricas principais
  const totalInvestido = Array.isArray(animals) ? animals.reduce((acc, a) => acc + (a.custoTotal || 0), 0) : 0

  const metrics = [
    {
      id: 'investido',
      title: 'Total Investido',
      value: `R$ ${totalInvestido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      change: '+12.5%',
      trend: 'up',
      emoji: 'ðÅ¸â€™°',
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900'
    },
  ]

  // FunÃ§Ã£o para abrir modal com detalhes
  const openModal = (cardId) => {
    setSelectedCard(cardId)
    setShowModal(true)
  }

  // FunÃ§Ã£o para gerar dados detalhados por card
  const getCardDetails = (cardId) => {
    switch (cardId) {
      case 'investido':
        const animaisComCusto = animals.map(animal => ({
          nome: `${animal.serie} ${animal.rg}`,
          custo: animal.custoTotal || 0,
          situacao: animal.situacao,
          raca: animal.raca,
          meses: animal.meses
        })).sort((a, b) => b.custo - a.custo)

        const custosPorSituacao = animals.reduce((acc, animal) => {
          acc[animal.situacao] = (acc[animal.situacao] || 0) + (animal.custoTotal || 0)
          return acc
        }, {})

        return {
          title: 'ðÅ¸â€™° Total Investido - Detalhamento',
          total: totalInvestido,
          items: animaisComCusto,
          breakdown: custosPorSituacao,
          insights: [
            `Maior investimento: ${animaisComCusto[0]?.nome} - R$ ${animaisComCusto[0]?.custo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            `Investimento mÃ©dio por animal: R$ ${(totalInvestido / animals.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            `Total de animais: ${animals.length}`,
            `Animais ativos: ${animals.filter(a => a.situacao === 'Ativo').length}`
          ]
        }

      case 'recebido':
        const animaisVendidos = animals.filter(a => a.valorVenda).map(animal => ({
          nome: `${animal.serie} ${animal.rg}`,
          receita: animal.valorVenda,
          custo: animal.custoTotal,
          lucro: animal.valorVenda - animal.custoTotal,
          roi: ((animal.valorVenda - animal.custoTotal) / animal.custoTotal * 100),
          raca: animal.raca
        })).sort((a, b) => b.receita - a.receita)

        const receitaPorRaca = animaisVendidos.reduce((acc, animal) => {
          acc[animal.raca] = (acc[animal.raca] || 0) + animal.receita
          return acc
        }, {})

        return {
          title: 'ðÅ¸â€œË† Total Recebido - Detalhamento',
          total: totalRecebido,
          items: animaisVendidos,
          breakdown: receitaPorRaca,
          insights: [
            `Maior venda: ${animaisVendidos[0]?.nome} - R$ ${animaisVendidos[0]?.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            `Receita mÃ©dia por venda: R$ ${animaisVendidos.length > 0 ? (totalRecebido / animaisVendidos.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}`,
            `Animais vendidos: ${animaisVendidos.length}`,
            `Taxa de conversÃ£o: ${((animaisVendidos.length / animals.length) * 100).toFixed(1)}%`
          ]
        }

      case 'lucro':
        const animaisComLucro = animals.filter(a => a.valorVenda).map(animal => ({
          nome: `${animal.serie} ${animal.rg}`,
          receita: animal.valorVenda,
          custo: animal.custoTotal,
          lucro: animal.valorVenda - animal.custoTotal,
          roi: ((animal.valorVenda - animal.custoTotal) / animal.custoTotal * 100),
          raca: animal.raca
        })).sort((a, b) => b.lucro - a.lucro)

        const lucroPorRaca = animaisComLucro.reduce((acc, animal) => {
          acc[animal.raca] = (acc[animal.raca] || 0) + animal.lucro
          return acc
        }, {})

        return {
          title: `${lucroTotal >= 0 ? 'ðÅ¸â€œË†' : 'ðÅ¸â€œâ€°'} Lucro Total - Detalhamento`,
          total: lucroTotal,
          items: animaisComLucro,
          breakdown: lucroPorRaca,
          insights: [
            `${lucroTotal >= 0 ? 'Maior lucro' : 'Menor prejuÃ­zo'}: ${animaisComLucro[0]?.nome} - R$ ${animaisComLucro[0]?.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            `Lucro mÃ©dio por venda: R$ ${animaisComLucro.length > 0 ? (lucroTotal / animaisComLucro.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}`,
            `Vendas lucrativas: ${animaisComLucro.filter(a => a.lucro > 0).length}`,
            `Margem de lucro mÃ©dia: ${animaisComLucro.length > 0 ? ((lucroTotal / totalRecebido) * 100).toFixed(1) : 0}%`
          ]
        }

      case 'roi':
        const animaisComROI = animals.filter(a => a.valorVenda).map(animal => ({
          nome: `${animal.serie} ${animal.rg}`,
          receita: animal.valorVenda,
          custo: animal.custoTotal,
          lucro: animal.valorVenda - animal.custoTotal,
          roi: ((animal.valorVenda - animal.custoTotal) / animal.custoTotal * 100),
          raca: animal.raca
        })).sort((a, b) => b.roi - a.roi)

        const roiPorRaca = {}
        Object.keys(animaisPorRaca).forEach(raca => {
          const animaisDaRaca = animaisComROI.filter(a => a.raca === raca)
          if (animaisDaRaca.length > 0) {
            roiPorRaca[raca] = animaisDaRaca.reduce((acc, a) => acc + a.roi, 0) / animaisDaRaca.length
          }
        })

        return {
          title: 'ðÅ¸â€œÅ  ROI MÃ©dio - Detalhamento',
          total: roiMedio,
          items: animaisComROI,
          breakdown: roiPorRaca,
          insights: [
            `Melhor ROI: ${animaisComROI[0]?.nome} - ${animaisComROI[0]?.roi.toFixed(1)}%`,
            `ROI mÃ©dio: ${roiMedio.toFixed(1)}%`,
            `Vendas com ROI positivo: ${animaisComROI.filter(a => a.roi > 0).length}`,
            `Meta de ROI (20%): ${animaisComROI.filter(a => a.roi >= 20).length} animais atingiram`
          ]
        }

      default:
        return null
    }
  }

  const renderBarChart = (data) => {
    const maxValue = Math.max(...Object.values(data))
    const total = Object.values(data).reduce((acc, val) => acc + val, 0)
    
    // Cores especÃ­ficas para cada categoria
    const categoryColors = {
      'Nascimento': { bg: 'from-green-400 to-green-600', icon: 'ðÅ¸�â€ž', border: 'border-green-200 dark:border-green-800' },
      'DNA': { bg: 'from-purple-400 to-purple-600', icon: 'ðÅ¸§¬', border: 'border-purple-200 dark:border-purple-800' },
      'Sanidade': { bg: 'from-blue-400 to-blue-600', icon: 'ðÅ¸â€™â€°', border: 'border-blue-200 dark:border-blue-800' },
      'Medicamentos': { bg: 'from-red-400 to-red-600', icon: 'ðÅ¸â€™Å ', border: 'border-red-200 dark:border-red-800' },
      'VeterinÃ¡rios': { bg: 'from-blue-400 to-blue-600', icon: 'ðÅ¸©º', border: 'border-blue-200 dark:border-blue-800' },
      'AquisiÃ§Ã£o': { bg: 'from-indigo-400 to-indigo-600', icon: 'ðÅ¸â€™°', border: 'border-indigo-200 dark:border-indigo-800' },
      'MÃ£o de Obra Proporcional': { bg: 'from-yellow-400 to-yellow-600', icon: 'ðÅ¸â€˜·', border: 'border-yellow-200 dark:border-yellow-800' },
      'Frete / Transporte': { bg: 'from-teal-400 to-teal-600', icon: 'ðÅ¸Å¡â€º', border: 'border-teal-200 dark:border-teal-800' },
      'Manejo': { bg: 'from-green-400 to-green-600', icon: 'ðÅ¸¤ ', border: 'border-green-200 dark:border-green-800' },
      'Infraestrutura': { bg: 'from-gray-400 to-gray-600', icon: 'ðÅ¸�â€”ï¸�', border: 'border-gray-200 dark:border-gray-800' },
      'ReproduÃ§Ã£o': { bg: 'from-rose-400 to-rose-600', icon: 'ðÅ¸â€™â€¢', border: 'border-rose-200 dark:border-rose-800' },
      'Outros': { bg: 'from-slate-400 to-slate-600', icon: 'ðÅ¸â€œ¦', border: 'border-slate-200 dark:border-slate-800' }
    }

    // Ordenar por valor (maior para menor)
    const sortedData = Object.entries(data).sort(([,a], [,b]) => b - a)

    return (
      <div className="space-y-4">
        {/* Header com total */}
        <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Geral de Custos
          </div>
        </div>

        {/* GrÃ¡fico de barras melhorado */}
        <div className="space-y-3">
          {sortedData.map(([key, value], index) => {
            const percentage = ((value / maxValue) * 100)
            const percentageOfTotal = ((value / total) * 100)
            const colors = categoryColors[key] || categoryColors['Outros']
            
            return (
              <div
                key={key}
                className={`p-4 rounded-lg border-2 ${colors.border} bg-white dark:bg-gray-800 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1`}
              >
                {/* Header da categoria */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{colors.icon}</div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {key}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {percentageOfTotal.toFixed(1)}% do total
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      #{index + 1} maior custo
                    </div>
                  </div>
                </div>

                {/* Barra de progresso */}
                <div className="relative">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                    <div 
                      className={`bg-gradient-to-r ${colors.bg} h-full rounded-full transition-all duration-1000 ease-out relative`}
                      style={{ width: `${percentage}%` }}
                    >
                      {/* Efeito de brilho */}
                      <div className="absolute inset-0 bg-white opacity-20 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  
                  {/* Indicador de porcentagem */}
                  <div className="absolute -top-6 right-0 text-xs font-medium text-gray-600 dark:text-gray-400">
                    {percentage.toFixed(1)}%
                  </div>
                </div>

                {/* EstatÃ­sticas adicionais */}
                <div className="mt-3 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>PosiÃ§Ã£o: {index + 1}Âº lugar</span>
                  <span>
                    {percentage >= 50 ? 'ðÅ¸â€�¥ Alto impacto' : 
                     percentage >= 25 ? 'âÅ¡¡ MÃ©dio impacto' : 
                     'ðÅ¸â€œÅ  Baixo impacto'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer com insights */}
        <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
            <span className="mr-2">ðÅ¸â€™¡</span>
            Insights dos Custos
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Maior custo:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {sortedData[0]?.[0]} (R$ {sortedData[0]?.[1].toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Categorias:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {sortedData.length} tipos diferentes
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Custo mÃ©dio:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                R$ {(total / sortedData.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Top 3 representam:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {((sortedData.slice(0, 3).reduce((acc, [,val]) => acc + val, 0) / total) * 100).toFixed(1)}% do total
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderDoughnutChart = (data) => {
    const total = Object.values(data).reduce((acc, val) => acc + val, 0)
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-red-500']
    
    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="relative w-48 h-48">
          <div className="w-full h-full rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{total}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 w-full">
          {Object.entries(data).map(([key, value], index) => (
            <div key={key} className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
              <div className="text-sm">
                <div className="font-medium text-gray-900 dark:text-white">{key}</div>
                <div className="text-gray-600 dark:text-gray-400">
                  {value} ({((value / total) * 100).toFixed(1)}%)
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* MÃ©tricas Principais com AnimaÃ§Ã£o */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div
            key={index}
            onClick={() => openModal(metric.id)}
            className="card p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {metric.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {metric.value}
                </p>
                <div className="flex items-center">
                  <span className="mr-1">
                    {metric.trend === 'up' ? 'ðÅ¸â€œË†' : 'ðÅ¸â€œâ€°'}
                  </span>
                  <span className={`text-sm font-medium ${
                    metric.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {metric.change}
                  </span>
                </div>
              </div>
              <div className={`${metric.bgColor} p-3 rounded-full group-hover:scale-110 transition-transform duration-300`}>
                <span className="text-2xl">{metric.emoji}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Seletor de MÃ©tricas */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'custos', label: 'ðÅ¸â€™° Custos por Tipo' },
            { key: 'racas', label: 'ðÅ¸�â€ž Animais por RaÃ§a' },
          ].map(option => (
            <button
              key={option.key}
              onClick={() => setSelectedMetric(option.key)}
              className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedMetric === option.key
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* GrÃ¡ficos Interativos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="mr-2 text-orange-500">âÅ¡¡</span>
            {selectedMetric === 'custos' ? 'Custos por Categoria' : 'DistribuiÃ§Ã£o por RaÃ§a'}
          </h3>
          <div className="min-h-80 max-h-[600px] overflow-y-auto">
            {selectedMetric === 'custos' && renderBarChart(custosPorTipo)}
            {selectedMetric === 'racas' && (
              <div className="flex items-center justify-center h-80">
                {renderDoughnutChart(animaisPorRaca)}
              </div>
            )}
          </div>
        </div>

        {/* Top Performers */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center group relative">
            <span className="mr-2 text-yellow-500">â­�</span>
            Top Performers (ROI)
            <span className="ml-2 text-gray-400 cursor-help">ââ€ž¹ï¸�</span>
            
            {/* Tooltip */}
            <div className="absolute left-0 top-8 bg-gray-900 text-white text-sm rounded-lg p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-10 w-80">
              <div className="font-semibold mb-2">ROI = Retorno sobre Investimento</div>
              <div className="text-xs leading-relaxed">
                <strong>FÃ³rmula:</strong> (Receita - Investimento) / Investimento Ãâ€” 100<br/>
                <strong>Exemplo:</strong> Investiu R$ 3.200, vendeu por R$ 4.500<br/>
                <strong>ROI:</strong> (4.500 - 3.200) / 3.200 Ãâ€” 100 = <span className="text-green-400">40,6%</span><br/>
                <strong>Significa:</strong> Para cada R$ 1 investido, ganhou R$ 0,40 de lucro
              </div>
            </div>
          </h3>
          <div className="space-y-4">
            {roiPorAnimal
              .slice(0, 5)
              .map((animal, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white flex items-center">
                        {animal.nome}
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                          animal.isVendido 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}>
                          {animal.situacao}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Investido: R$ {animal.custo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {animal.isVendido ? (
                      <>
                        <div className={`text-lg font-bold ${
                          animal.roi >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {animal.roi.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          R$ {animal.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          Em Andamento
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Potencial Alto
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Modal de Detalhes */}
      {showModal && selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {(() => {
              const details = getCardDetails(selectedCard)
              if (!details) return null

              return (
                <>
                  {/* Header do Modal */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {details.title}
                    </h2>
                    <button
                      onClick={() => setShowModal(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold"
                    >
                      Ãâ€”
                    </button>
                  </div>

                  {/* ConteÃºdo do Modal */}
                  <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    {/* Resumo Principal */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                          {selectedCard === 'roi' 
                            ? `${details.total.toFixed(1)}%`
                            : `R$ ${details.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          }
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                          {selectedCard === 'investido' && 'Total investido em todos os animais'}
                          {selectedCard === 'recebido' && 'Total recebido com vendas'}
                          {selectedCard === 'lucro' && 'Lucro lÃ­quido das operaÃ§Ãµes'}
                          {selectedCard === 'roi' && 'Retorno mÃ©dio sobre investimento'}
                        </div>
                      </div>
                    </div>

                    {/* Insights Principais */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                        <span className="mr-2">ðÅ¸â€™¡</span>
                        Insights Principais
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {details.insights.map((insight, index) => (
                          <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="text-sm text-gray-700 dark:text-gray-300">
                              {insight}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Breakdown por Categoria */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                        <span className="mr-2">ðÅ¸â€œÅ </span>
                        {selectedCard === 'investido' && 'Investimento por SituaÃ§Ã£o'}
                        {selectedCard === 'recebido' && 'Receita por RaÃ§a'}
                        {selectedCard === 'lucro' && 'Lucro por RaÃ§a'}
                        {selectedCard === 'roi' && 'ROI MÃ©dio por RaÃ§a'}
                      </h3>
                      <div className="space-y-3">
                        {Object.entries(details.breakdown).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {key}
                            </div>
                            <div className="font-bold text-blue-600 dark:text-blue-400">
                              {selectedCard === 'roi' 
                                ? `${value.toFixed(1)}%`
                                : `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                              }
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Lista Detalhada */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                        <span className="mr-2">ðÅ¸â€œâ€¹</span>
                        {selectedCard === 'investido' && 'Animais por Investimento'}
                        {selectedCard === 'recebido' && 'Vendas por Receita'}
                        {selectedCard === 'lucro' && 'Animais por Lucro'}
                        {selectedCard === 'roi' && 'Animais por ROI'}
                      </h3>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {details.items.slice(0, 10).map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                index < 3 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-gray-400'
                              }`}>
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {item.nome}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {item.raca}
                                  {item.situacao && ` ââ‚¬¢ ${item.situacao}`}
                                  {item.meses && ` ââ‚¬¢ ${item.meses} meses`}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              {selectedCard === 'investido' && (
                                <div className="font-bold text-red-600 dark:text-red-400">
                                  R$ {(parseFloat(item.custo) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                              )}
                              {selectedCard === 'recebido' && (
                                <>
                                  <div className="font-bold text-green-600 dark:text-green-400">
                                    R$ {(parseFloat(item.receita) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    ROI: {(parseFloat(item.roi) || 0).toFixed(1)}%
                                  </div>
                                </>
                              )}
                              {selectedCard === 'lucro' && (
                                <>
                                  <div className={`font-bold ${
                                    (parseFloat(item.lucro) || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                  }`}>
                                    R$ {(parseFloat(item.lucro) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    ROI: {(parseFloat(item.roi) || 0).toFixed(1)}%
                                  </div>
                                </>
                              )}
                              {selectedCard === 'roi' && (
                                <>
                                  <div className={`font-bold ${
                                    item.roi >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                  }`}>
                                    {item.roi.toFixed(1)}%
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    R$ {item.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {details.items.length > 10 && (
                        <div className="text-center mt-3 text-sm text-gray-600 dark:text-gray-400">
                          Mostrando 10 de {details.items.length} itens
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer do Modal */}
                  <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Fechar
                    </button>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}