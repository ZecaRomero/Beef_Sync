import React, { useState, useEffect } from 'react'
import { 
  MapPinIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  ChartBarIcon,
  ArrowRightIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline'

const LocationReport = ({ filters, period, onClose }) => {
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('localizacao_atual')

  useEffect(() => {
    fetchLocationReport()
  }, [period, filters])

  const fetchLocationReport = async () => {
    try {
      setLoading(true)
      setError(null)

      const requestData = {
        reports: ['location_report'],
        period: period,
        sections: {
          location_report: {
            localizacao_atual: true,
            historico_movimentacoes: true,
            animais_por_piquete: true,
            movimentacoes_recentes: true,
            animais_sem_localizacao: true
          }
        }
      }

      console.log('LocationReport: Enviando requisição:', requestData)

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      console.log('LocationReport: Response status:', response.status)

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('LocationReport: Dados recebidos:', result)
      
      if (result.success && result.data?.data?.location_report) {
        console.log('LocationReport: Dados do location_report:', result.data.data.location_report)
        setReportData(result.data.data.location_report)
      } else {
        console.error('LocationReport: Estrutura de dados inesperada:', result)
        throw new Error('Dados do relatório não encontrados')
      }
    } catch (err) {
      console.error('Erro ao carregar relatório de localização:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const tabs = [
    { id: 'localizacao_atual', name: 'Localização Atual', icon: MapPinIcon },
    { id: 'animais_por_piquete', name: 'Por Piquete', icon: ChartBarIcon },
    { id: 'historico_movimentacoes', name: 'Histórico', icon: ClockIcon },
    { id: 'movimentacoes_recentes', name: 'Recentes', icon: ArrowRightIcon },
    { id: 'animais_sem_localizacao', name: 'Sem Localização', icon: ExclamationTriangleIcon }
  ]

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Carregando relatório de localização...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 dark:text-red-400 mb-4">Erro ao carregar relatório: {error}</p>
        <button
          onClick={fetchLocationReport}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Tentar Novamente
        </button>
      </div>
    )
  }

  const renderLocalizacaoAtual = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <MapPinIcon className="h-5 w-5 mr-2 text-orange-500" />
          Localização Atual dos Animais
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {reportData?.localizacao_atual?.length || 0} animais
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Animal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Raça
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Sexo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Piquete
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Data Entrada
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Responsável
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {reportData?.localizacao_atual?.map((animal, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {animal.serie}-{animal.rg}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {animal.raca}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {animal.sexo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    animal.piquete ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {animal.piquete || 'Sem localização'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(animal.data_entrada)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {animal.usuario_responsavel || 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderAnimaisPorPiquete = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <ChartBarIcon className="h-5 w-5 mr-2 text-orange-500" />
          Distribuição por Piquete
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportData?.animais_por_piquete?.map((piquete, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                {piquete.piquete}
              </h4>
              <span className="text-2xl font-bold text-orange-600">
                {piquete.total_animais}
              </span>
            </div>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Machos:</span>
                <span className="font-medium">{piquete.machos || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Fêmeas:</span>
                <span className="font-medium">{piquete.femeas || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderHistoricoMovimentacoes = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <ClockIcon className="h-5 w-5 mr-2 text-orange-500" />
          Histórico de Movimentações
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {reportData?.historico_movimentacoes?.length || 0} movimentações
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Animal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Piquete
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Entrada
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Saída
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Dias
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Motivo
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {reportData?.historico_movimentacoes?.map((mov, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {mov.serie}-{mov.rg}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {mov.piquete}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(mov.data_entrada)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(mov.data_saida)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {mov.dias_permanencia || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {mov.motivo_movimentacao || 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderMovimentacaoRecentes = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <ArrowRightIcon className="h-5 w-5 mr-2 text-orange-500" />
          Movimentações Recentes
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {reportData?.movimentacoes_recentes?.length || 0} movimentações
        </span>
      </div>
      
      <div className="space-y-3">
        {reportData?.movimentacoes_recentes?.map((mov, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                    <ArrowRightIcon className="w-4 h-4 text-orange-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {mov.serie}-{mov.rg} → {mov.piquete}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {mov.motivo_movimentacao || 'Movimentação'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(mov.data_entrada)}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {mov.usuario_responsavel || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderAnimaisSemLocalizacao = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-red-500" />
          Animais Sem Localização
        </h3>
        <span className="text-sm text-red-500 dark:text-red-400">
          {reportData?.animais_sem_localizacao?.length || 0} animais
        </span>
      </div>
      
      {reportData?.animais_sem_localizacao?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportData.animais_sem_localizacao.map((animal, index) => (
            <div key={index} className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center space-x-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {animal.serie}-{animal.rg}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {animal.raca} • {animal.sexo}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-green-500 text-4xl mb-2">✅</div>
          <p className="text-gray-600 dark:text-gray-400">
            Todos os animais possuem localização definida!
          </p>
        </div>
      )}
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'localizacao_atual':
        return renderLocalizacaoAtual()
      case 'animais_por_piquete':
        return renderAnimaisPorPiquete()
      case 'historico_movimentacoes':
        return renderHistoricoMovimentacoes()
      case 'movimentacoes_recentes':
        return renderMovimentacaoRecentes()
      case 'animais_sem_localizacao':
        return renderAnimaisSemLocalizacao()
      default:
        return renderLocalizacaoAtual()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <MapPinIcon className="h-8 w-8 mr-3 text-orange-500" />
            Relatório de Localização
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Período: {formatDate(period.startDate)} até {formatDate(period.endDate)}
          </p>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          ✕ Fechar
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="min-h-96">
        {renderTabContent()}
      </div>
    </div>
  )
}

export default LocationReport