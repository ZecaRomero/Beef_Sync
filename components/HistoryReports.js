
import React, { useEffect, useState } from 'react'

import { 
  ChartBarIcon, 
  DocumentArrowDownIcon,
  CalendarIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import * as XLSX from 'xlsx'

export default function HistoryReports() {
  const [events, setEvents] = useState([])
  const [animals, setAnimals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reportType, setReportType] = useState('leilao')
  const [dateRange, setDateRange] = useState({
    inicio: '',
    fim: ''
  })
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())

  // Tipos de relatÃ³rios disponÃ­veis
  const reportTypes = [
    { id: 'leilao', label: 'RelatÃ³rio de LeilÃ£o', icon: 'ðÅ¸�â€ ', description: 'Animais separados para leilÃ£o' },
    { id: 'parto', label: 'RelatÃ³rio de Partos', icon: 'ðÅ¸�â€ž', description: 'Partos registrados no perÃ­odo' },
    { id: 'pesagem', label: 'RelatÃ³rio de Pesagens', icon: 'âÅ¡â€“ï¸�', description: 'Controle de peso dos animais' },
    { id: 'medicacao', label: 'RelatÃ³rio de MedicaÃ§Ãµes', icon: 'ðÅ¸â€™Å ', description: 'Tratamentos e medicaÃ§Ãµes aplicadas' },
    { id: 'vendas', label: 'RelatÃ³rio de Vendas', icon: 'ðÅ¸â€™°', description: 'Vendas realizadas no perÃ­odo' },
    { id: 'geral', label: 'RelatÃ³rio Geral', icon: 'ðÅ¸â€œÅ ', description: 'Todas as ocorrÃªncias do perÃ­odo' }
  ]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Carregar eventos do PostgreSQL
      const eventsResponse = await fetch('/api/historia-ocorrencias')
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json()
        setEvents(eventsData)
      } else {
        throw new Error('Erro ao carregar ocorrÃªncias')
      }
      
      // Carregar animais do PostgreSQL
      const animalsResponse = await fetch('/api/animals')
      if (animalsResponse.ok) {
        const animalsData = await animalsResponse.json()
        setAnimals(Array.isArray(animalsData) ? animalsData : [])
      } else {
        throw new Error('Erro ao carregar animais')
      }
      
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getAnimalName = (animalId) => {
    const animal = animals.find(a => a.id === parseInt(animalId))
    return animal ? `${animal.serie} ${animal.rg}` : 'Animal nÃ£o encontrado'
  }

  const getAnimalDetails = (animalId) => {
    const animal = animals.find(a => a.id === parseInt(animalId))
    return animal || {}
  }

  // Filtrar eventos baseado no tipo de relatÃ³rio e perÃ­odo
  const getFilteredEvents = () => {
    let filtered = events

    // Filtrar por tipo de relatÃ³rio
    if (reportType !== 'geral') {
      if (reportType === 'vendas') {
        filtered = filtered.filter(e => e.tipo === 'venda' || e.tipo === 'leilao')
      } else {
        filtered = filtered.filter(e => e.tipo === reportType)
      }
    }

    // Filtrar por perÃ­odo
    if (dateRange.inicio && dateRange.fim) {
      const startDate = new Date(dateRange.inicio + 'T00:00:00')
      const endDate = new Date(dateRange.fim + 'T23:59:59')
      filtered = filtered.filter(e => {
        const eventDate = new Date(e.data)
        return eventDate >= startDate && eventDate <= endDate
      })
    } else if (selectedMonth && selectedYear) {
      filtered = filtered.filter(e => {
        const eventDate = new Date(e.data)
        return eventDate.getMonth() + 1 === parseInt(selectedMonth) && 
               eventDate.getFullYear() === parseInt(selectedYear)
      })
    } else if (selectedYear) {
      filtered = filtered.filter(e => {
        const eventDate = new Date(e.data)
        return eventDate.getFullYear() === parseInt(selectedYear)
      })
    }

    return filtered.sort((a, b) => new Date(b.data) - new Date(a.data))
  }

  // Gerar estatÃ­sticas do relatÃ³rio
  const generateStats = (filteredEvents) => {
    const stats = {
      total: filteredEvents.length,
      porMes: {},
      porTipo: {},
      totalValor: 0,
      totalPeso: 0,
      animaisUnicos: new Set(),
      medicamentosUsados: new Set()
    }

    filteredEvents.forEach(event => {
      // Por mÃªs
      const month = new Date(event.data).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      stats.porMes[month] = (stats.porMes[month] || 0) + 1

      // Por tipo
      stats.porTipo[event.tipo] = (stats.porTipo[event.tipo] || 0) + 1

      // Valores
      if (event.valor) {
        stats.totalValor += parseFloat(event.valor)
      }

      // Peso
      if (event.peso) {
        stats.totalPeso += parseFloat(event.peso)
      }

      // Animais Ãºnicos
      stats.animaisUnicos.add(event.animalId)

      // Medicamentos
      if (event.medicamento) {
        stats.medicamentosUsados.add(event.medicamento)
      }
    })

    return {
      ...stats,
      animaisUnicos: stats.animaisUnicos.size,
      medicamentosUsados: Array.from(stats.medicamentosUsados)
    }
  }

  // Estado para controle de exportaÃ§Ã£o
  const [exporting, setExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)

  // Exportar relatÃ³rio especÃ­fico
  const exportReport = () => {
    const filteredEvents = getFilteredEvents()
    const stats = generateStats(filteredEvents)
    const reportInfo = reportTypes.find(r => r.id === reportType)

    if (filteredEvents.length === 0) {
      alert('ðÅ¸â€œ­ Nenhum dado encontrado para o perÃ­odo selecionado')
      return
    }

    setExporting(true)
    setExportProgress(0)

    let progressInterval = null

    try {
      // Simular progresso durante a exportaÃ§Ã£o
      progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 100)
      
      // Preparar dados principais
      const mainData = filteredEvents.map(event => {
        const animal = getAnimalDetails(event.animalId)
        return [
          new Date(event.data).toLocaleDateString('pt-BR'),
          getAnimalName(event.animalId),
          animal.raca || '',
          animal.sexo || '',
          event.descricao || '',
          event.observacoes || '',
          event.peso || '',
          event.valor ? `R$ ${parseFloat(event.valor).toFixed(2)}` : '',
          event.medicamento || '',
          event.dosagem || '',
          event.veterinario || '',
          event.local || '',
          event.responsavel || '',
          new Date(event.createdAt).toLocaleDateString('pt-BR')
        ]
      })

      const headers = [
        'Data', 'Animal', 'RaÃ§a', 'Sexo', 'DescriÃ§Ã£o', 'ObservaÃ§Ãµes',
        'Peso (kg)', 'Valor (R$)', 'Medicamento', 'Dosagem',
        'VeterinÃ¡rio', 'Local', 'ResponsÃ¡vel', 'Data Registro'
      ]

      // Criar workbook
      const wb = XLSX.utils.book_new()

      // Planilha principal
      const ws = XLSX.utils.aoa_to_sheet([headers, ...mainData])
      ws['!cols'] = [
        { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 8 }, { wch: 25 }, { wch: 30 },
        { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 10 }, { wch: 15 },
        { wch: 15 }, { wch: 15 }, { wch: 12 }
      ]

      // Aplicar formataÃ§Ã£o ao cabeÃ§alho (linha 1) - Azul escuro com texto branco
      const headerRange = XLSX.utils.decode_range(ws['!ref'])
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
        if (!ws[cellAddress]) continue

        ws[cellAddress].s = {
          fill: { fgColor: { rgb: "1F4E79" } },
          font: { color: { rgb: "FFFFFF" }, bold: true, sz: 11 },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        }
      }

      // Aplicar bordas Ã s cÃ©lulas de dados
      for (let row = 1; row <= headerRange.e.r; row++) {
        for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
          if (!ws[cellAddress]) continue

          ws[cellAddress].s = {
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } }
            },
            font: { sz: 10 }
          }
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, reportInfo.label.replace('RelatÃ³rio de ', ''))

      // Planilha de resumo
      const resumoData = [
        ['MÃ©trica', 'Valor'],
        ['PerÃ­odo do RelatÃ³rio', `${dateRange.inicio || selectedMonth + '/' + selectedYear || selectedYear}`],
        ['Total de OcorrÃªncias', stats.total],
        ['Animais Envolvidos', stats.animaisUnicos],
        ['Valor Total', `R$ ${stats.totalValor.toFixed(2)}`],
        ['Peso Total', `${stats.totalPeso.toFixed(1)} kg`],
        ['Peso MÃ©dio', stats.total > 0 ? `${(stats.totalPeso / stats.total).toFixed(1)} kg` : '0 kg'],
        ['Valor MÃ©dio', stats.total > 0 ? `R$ ${(stats.totalValor / stats.total).toFixed(2)}` : 'R$ 0,00']
      ]

      if (stats.medicamentosUsados.length > 0) {
        resumoData.push(['Medicamentos Utilizados', stats.medicamentosUsados.join(', ')])
      }

      const wsResumo = XLSX.utils.aoa_to_sheet(resumoData)
      wsResumo['!cols'] = [{ wch: 25 }, { wch: 30 }]
      
      // Aplicar formataÃ§Ã£o ao cabeÃ§alho da planilha de resumo
      const resumoHeaderRange = XLSX.utils.decode_range(wsResumo['!ref'])
      for (let col = resumoHeaderRange.s.c; col <= resumoHeaderRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
        if (!wsResumo[cellAddress]) continue

        wsResumo[cellAddress].s = {
          fill: { fgColor: { rgb: "4472C4" } },
          font: { color: { rgb: "FFFFFF" }, bold: true, sz: 11 },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        }
      }

      // Aplicar bordas aos dados do resumo
      for (let row = 1; row <= resumoHeaderRange.e.r; row++) {
        for (let col = resumoHeaderRange.s.c; col <= resumoHeaderRange.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
          if (!wsResumo[cellAddress]) continue

          wsResumo[cellAddress].s = {
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } }
            },
            font: { sz: 10 }
          }
        }
      }
      
      XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo')

      // Planilha por mÃªs (se houver dados suficientes)
      if (Object.keys(stats.porMes).length > 1) {
        const porMesData = Object.entries(stats.porMes).map(([mes, count]) => [mes, count])
        const wsPorMes = XLSX.utils.aoa_to_sheet([['MÃªs', 'Quantidade'], ...porMesData])
        wsPorMes['!cols'] = [{ wch: 20 }, { wch: 12 }]
        
        // Aplicar formataÃ§Ã£o ao cabeÃ§alho
        const porMesHeaderRange = XLSX.utils.decode_range(wsPorMes['!ref'])
        for (let col = porMesHeaderRange.s.c; col <= porMesHeaderRange.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
          if (!wsPorMes[cellAddress]) continue

          wsPorMes[cellAddress].s = {
            fill: { fgColor: { rgb: "4472C4" } },
            font: { color: { rgb: "FFFFFF" }, bold: true, sz: 11 },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } }
            }
          }
        }

        // Aplicar bordas aos dados
        for (let row = 1; row <= porMesHeaderRange.e.r; row++) {
          for (let col = porMesHeaderRange.s.c; col <= porMesHeaderRange.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
            if (!wsPorMes[cellAddress]) continue

            wsPorMes[cellAddress].s = {
              alignment: { horizontal: "center", vertical: "center" },
              border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } }
              },
              font: { sz: 10 }
            }
          }
        }
        
        XLSX.utils.book_append_sheet(wb, wsPorMes, 'Por MÃªs')
      }

      // Salvar arquivo
      if (progressInterval) clearInterval(progressInterval)
      setExportProgress(100)
      
      const fileName = `${reportInfo.label}_${selectedYear}${selectedMonth ? '_' + selectedMonth : ''}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`
      XLSX.writeFile(wb, fileName)

      setTimeout(() => {
        setExporting(false)
        setExportProgress(0)
        alert(`âÅ“â€¦ ${reportInfo.label} exportado com sucesso!\n\nðÅ¸â€œÅ  Resumo:\nââ‚¬¢ ${stats.total} ocorrÃªncias\nââ‚¬¢ ${stats.animaisUnicos} animais\nââ‚¬¢ Valor total: R$ ${stats.totalValor.toFixed(2)}`)
      }, 500)
    } catch (error) {
      if (progressInterval) clearInterval(progressInterval)
      console.error('Erro ao exportar relatÃ³rio:', error)
      setExporting(false)
      setExportProgress(0)
      alert(`â�Å’ Erro ao exportar relatÃ³rio: ${error.message || 'Erro desconhecido'}`)
    }
  }

  const filteredEvents = getFilteredEvents()
  const stats = generateStats(filteredEvents)
  const currentReport = reportTypes.find(r => r.id === reportType)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando dados...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-6">
        <div className="text-center text-red-600 dark:text-red-400">
          <p className="text-xl font-semibold mb-2">â�Å’ Erro ao carregar dados</p>
          <p className="mb-4">{error}</p>
          <button onClick={loadData} className="btn-primary">
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            ðÅ¸â€œÅ  RelatÃ³rios de OcorrÃªncias
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gere relatÃ³rios especÃ­ficos por tipo de ocorrÃªncia e perÃ­odo
          </p>
        </div>
        <div className="flex items-center gap-3">
          {exporting && (
            <div className="flex items-center gap-2">
              <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {exportProgress < 50 ? 'ðÅ¸â€œÅ  Preparando dados...' : 
                 exportProgress < 80 ? 'ðÅ¸â€œ� Gerando planilha...' : 
                 'ðÅ¸â€™¾ Salvando arquivo...'}
              </span>
            </div>
          )}
          <button
            onClick={exportReport}
            disabled={filteredEvents.length === 0 || loading || exporting}
            className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exportando...
              </>
            ) : (
              <>
                <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                Exportar RelatÃ³rio
              </>
            )}
          </button>
        </div>
      </div>

      {/* SeleÃ§Ã£o de Tipo de RelatÃ³rio */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <ChartBarIcon className="h-5 w-5 mr-2" />
          Tipo de RelatÃ³rio
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTypes.map(type => (
            <div
              key={type.id}
              onClick={() => setReportType(type.id)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                reportType === type.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-3">{type.icon}</span>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {type.label}
                </h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {type.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Filtros de PerÃ­odo */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <CalendarIcon className="h-5 w-5 mr-2" />
          PerÃ­odo do RelatÃ³rio
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data InÃ­cio
            </label>
            <input
              type="date"
              value={dateRange.inicio}
              onChange={(e) => {
                setDateRange(prev => ({ ...prev, inicio: e.target.value }))
                setSelectedMonth('')
                setSelectedYear('')
              }}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data Fim
            </label>
            <input
              type="date"
              value={dateRange.fim}
              onChange={(e) => {
                setDateRange(prev => ({ ...prev, fim: e.target.value }))
                setSelectedMonth('')
                setSelectedYear('')
              }}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              MÃªs
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value)
                setDateRange({ inicio: '', fim: '' })
              }}
              className="input"
            >
              <option value="">Todos os meses</option>
              <option value="1">Janeiro</option>
              <option value="2">Fevereiro</option>
              <option value="3">MarÃ§o</option>
              <option value="4">Abril</option>
              <option value="5">Maio</option>
              <option value="6">Junho</option>
              <option value="7">Julho</option>
              <option value="8">Agosto</option>
              <option value="9">Setembro</option>
              <option value="10">Outubro</option>
              <option value="11">Novembro</option>
              <option value="12">Dezembro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ano
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="input"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex space-x-2">
          <button
            onClick={() => {
              setDateRange({ inicio: '', fim: '' })
              setSelectedMonth('')
              setSelectedYear(new Date().getFullYear().toString())
            }}
            className="btn-secondary text-sm"
          >
            Limpar Filtros
          </button>
          <button
            onClick={() => {
              const today = new Date()
              const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
              const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
              
              setDateRange({
                inicio: firstDay.toISOString().split('T')[0],
                fim: lastDay.toISOString().split('T')[0]
              })
              setSelectedMonth('')
              setSelectedYear('')
            }}
            className="btn-secondary text-sm"
          >
            MÃªs Atual
          </button>
        </div>
      </div>

      {/* Resumo do RelatÃ³rio */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <span className="mr-2">{currentReport.icon}</span>
          {currentReport.label} - Resumo
        </h3>

        {filteredEvents.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">ðÅ¸â€œ­</div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhum dado encontrado
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              NÃ£o hÃ¡ ocorrÃªncias do tipo "{currentReport.label}" no perÃ­odo selecionado.
            </p>
          </div>
        ) : (
          <>
            {/* EstatÃ­sticas Principais */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.total}
                </div>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  Total de OcorrÃªncias
                </div>
              </div>

              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.animaisUnicos}
                </div>
                <div className="text-sm text-green-800 dark:text-green-200">
                  Animais Envolvidos
                </div>
              </div>

              {stats.totalValor > 0 && (
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    R$ {stats.totalValor.toFixed(0)}
                  </div>
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    Valor Total
                  </div>
                </div>
              )}

              {stats.totalPeso > 0 && (
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {stats.totalPeso.toFixed(0)} kg
                  </div>
                  <div className="text-sm text-purple-800 dark:text-purple-200">
                    Peso Total
                  </div>
                </div>
              )}
            </div>

            {/* Lista Resumida */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Data
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Animal
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      DescriÃ§Ã£o
                    </th>
                    {(reportType === 'pesagem' || reportType === 'leilao') && (
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Peso
                      </th>
                    )}
                    {(reportType === 'vendas' || reportType === 'leilao') && (
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Valor
                      </th>
                    )}
                    {(reportType === 'medicacao' || reportType === 'vacinacao') && (
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Medicamento
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredEvents.slice(0, 10).map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {new Date(event.data).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {getAnimalName(event.animalId)}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                        {event.descricao}
                      </td>
                      {(reportType === 'pesagem' || reportType === 'leilao') && (
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {event.peso ? `${event.peso} kg` : '-'}
                        </td>
                      )}
                      {(reportType === 'vendas' || reportType === 'leilao') && (
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {event.valor ? `R$ ${parseFloat(event.valor).toFixed(2)}` : '-'}
                        </td>
                      )}
                      {(reportType === 'medicacao' || reportType === 'vacinacao') && (
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {event.medicamento || '-'}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredEvents.length > 10 && (
              <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                Mostrando 10 de {filteredEvents.length} registros. 
                <span className="font-medium"> Exporte o relatÃ³rio para ver todos os dados.</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}