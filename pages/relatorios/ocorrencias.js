import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { 
  ArrowLeftIcon, 
  DocumentArrowDownIcon,
  FunnelIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function RelatorioOcorrencias() {
  const router = useRouter()
  const [ocorrencias, setOcorrencias] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    tipo: '',
    animalSerie: '',
    animalRg: ''
  })

  useEffect(() => {
    carregarOcorrencias()
  }, [])

  const carregarOcorrencias = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtros.dataInicio) params.append('dataInicio', filtros.dataInicio)
      if (filtros.dataFim) params.append('dataFim', filtros.dataFim)
      if (filtros.tipo) params.append('filtroTipo', filtros.tipo)
      if (filtros.animalSerie) params.append('filtroAnimal', filtros.animalSerie)

      const response = await fetch(`/api/sanidade/historico?${params.toString()}`)
      const result = await response.json()

      if (result.status === 'success' && result.data) {
        let dados = result.data

        // Aplicar filtros adicionais
          if (filtros.animalRg) {
            const rgBusca = filtros.animalRg.toString().trim().toLowerCase()
            dados = dados.filter(o => 
              o.rgn && o.rgn.toString().toLowerCase().includes(rgBusca)
            )
          }

        setOcorrencias(dados)
      }
    } catch (error) {
      console.error('Erro ao carregar ocorrências:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }))
  }

  const aplicarFiltros = () => {
    carregarOcorrencias()
  }

  const limparFiltros = () => {
    setFiltros({
      dataInicio: '',
      dataFim: '',
      tipo: '',
      animalSerie: '',
      animalRg: ''
    })
    setTimeout(() => carregarOcorrencias(), 100)
  }

  const exportarCSV = () => {
    const headers = ['Data', 'Animal', 'Série', 'RG', 'Tipo', 'Descrição', 'Peso', 'Local', 'Veterinário', 'Observações']
    const rows = ocorrencias.map(o => [
      o.data ? new Date(o.data).toLocaleDateString('pt-BR') : '',
      o.animal || '',
      o.serie || '',
      o.rgn || '',
      o.tipo_original || o.tipo || '',
      o.procedimento || '',
      o.peso || '',
      o.local || '',
      o.veterinario || '',
      o.observacoes || ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `relatorio_ocorrencias_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const exportarJSON = () => {
    const dataStr = JSON.stringify(ocorrencias, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `relatorio_ocorrencias_${new Date().toISOString().split('T')[0]}.json`
    link.click()
  }

  const getTipoColor = (tipo) => {
    const tipoLower = tipo?.toLowerCase() || ''
    if (tipoLower.includes('pesagem')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
    if (tipoLower.includes('local')) return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
    if (tipoLower.includes('vacina')) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300'
    if (tipoLower.includes('exame')) return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300'
    if (tipoLower.includes('tratamento') || tipoLower.includes('medicamento')) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
    if (tipoLower.includes('cirurgia')) return 'bg-rose-100 text-rose-800 dark:bg-rose-900/20 dark:text-rose-300'
    if (tipoLower.includes('morte')) return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Button
            variant="secondary"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                📊 Relatório de Ocorrências
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Visualize e exporte todas as ocorrências registradas
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={exportarCSV}
                className="flex items-center gap-2"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                Exportar CSV
              </Button>
              <Button
                variant="secondary"
                onClick={exportarJSON}
                className="flex items-center gap-2"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                Exportar JSON
              </Button>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FunnelIcon className="h-5 w-5" />
              Filtros
            </h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <Input
                label="Data Início"
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => handleFiltroChange('dataInicio', e.target.value)}
              />
              <Input
                label="Data Fim"
                type="date"
                value={filtros.dataFim}
                onChange={(e) => handleFiltroChange('dataFim', e.target.value)}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo
                </label>
                <select
                  value={filtros.tipo}
                  onChange={(e) => handleFiltroChange('tipo', e.target.value)}
                  className="input-field w-full"
                >
                  <option value="">Todos</option>
                  <option value="Pesagem">Pesagem</option>
                  <option value="Local">Local</option>
                  <option value="CE">CE</option>
                  <option value="DG">DG</option>
                  <option value="Vacinação">Vacinação</option>
                  <option value="Exame">Exame</option>
                  <option value="Tratamento">Tratamento</option>
                  <option value="Medicamento">Medicamento</option>
                  <option value="Cirurgia">Cirurgia</option>
                  <option value="Observação">Observação</option>
                  <option value="Morte">Morte</option>
                </select>
              </div>
              <Input
                label="Série do Animal"
                type="text"
                value={filtros.animalSerie}
                onChange={(e) => handleFiltroChange('animalSerie', e.target.value)}
                placeholder="Ex: CJCJ"
              />
              <Input
                label="RG do Animal"
                type="text"
                value={filtros.animalRg}
                onChange={(e) => handleFiltroChange('animalRg', e.target.value)}
                placeholder="Ex: 17065"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="primary" onClick={aplicarFiltros}>
                Aplicar Filtros
              </Button>
              <Button variant="secondary" onClick={limparFiltros}>
                Limpar
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Lista de Ocorrências */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Ocorrências ({ocorrencias.length})
            </h2>
          </CardHeader>
          <CardBody>
            {loading ? (
              <LoadingSpinner />
            ) : ocorrencias.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  Nenhuma ocorrência encontrada com os filtros aplicados.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Animal
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Descrição
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Peso
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Local
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Veterinário
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {ocorrencias.map((ocorrencia) => (
                      <tr key={ocorrencia.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {ocorrencia.data ? new Date(ocorrencia.data).toLocaleDateString('pt-BR') : '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {ocorrencia.serie && ocorrencia.rgn ? `${ocorrencia.serie}-${ocorrencia.rgn}` : ocorrencia.animal || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTipoColor(ocorrencia.tipo_original || ocorrencia.tipo)}`}>
                            {ocorrencia.tipo_original || ocorrencia.tipo || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          <div className="max-w-xs truncate" title={ocorrencia.procedimento || ocorrencia.descricao || 'Sem descrição'}>
                            {ocorrencia.procedimento || ocorrencia.descricao || 'Sem descrição'}
                          </div>
                          {ocorrencia.observacoes && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-xs" title={ocorrencia.observacoes}>
                              {ocorrencia.observacoes}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {ocorrencia.peso ? `${ocorrencia.peso} kg` : '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {ocorrencia.local || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {ocorrencia.veterinario || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

