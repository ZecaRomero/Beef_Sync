import React, { useState, useEffect } from 'react'
import { CalendarIcon, PlusIcon, PencilIcon, XMarkIcon, UserIcon, MagnifyingGlassIcon } from '../../components/ui/Icons'

export default function CalendarioReprodutivo() {
  const [mounted, setMounted] = useState(false)
  const [eventos, setEventos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroData, setFiltroData] = useState('')
  const [exportando, setExportando] = useState(false)
  const [viewMode, setViewMode] = useState('list')
  const [filtroBusca, setFiltroBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d
  })
  const [selectedDate, setSelectedDate] = useState(null)
  const [formData, setFormData] = useState({
    titulo: '',
    animal: '',
    data: new Date().toISOString().split('T')[0],
    tipo: '',
    descricao: ''
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      loadEventos()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, filtroTipo, filtroData])

  const loadEventos = async () => {
    try {
      setIsLoading(true)
      
      // Tentar usar API primeiro, fallback para localStorage
      try {
        // Construir URL com filtros
        const params = new URLSearchParams()
        if (filtroTipo) params.append('tipo', filtroTipo)
        if (filtroData) {
          params.append('data_inicio', filtroData)
          params.append('data_fim', filtroData)
        }
        
        const url = `/api/calendario-reprodutivo${params.toString() ? '?' + params.toString() : ''}`
        console.log(`📡 Buscando eventos: ${url}`)
        
        const response = await fetch(url)
        if (response.ok) {
          const responseData = await response.json()
          const data = responseData.data || responseData
          const eventosArray = Array.isArray(data) ? data : []
          console.log(`📋 Eventos carregados da API: ${eventosArray.length}`)
          if (eventosArray.length > 0) {
            console.log('📋 Primeiro evento:', eventosArray[0])
          }
          setEventos(eventosArray)
          return
        } else {
          const errorData = await response.json()
          console.error('Erro na API:', errorData)
        }
      } catch (apiError) {
        console.error('Erro ao buscar eventos da API:', apiError)
        console.log('API não disponível, usando localStorage')
      }

      // Fallback para localStorage
      if (typeof window !== 'undefined') {
        const savedData = localStorage.getItem('calendarioReprodutivo')
        if (savedData) {
          setEventos(JSON.parse(savedData))
        } else {
          setEventos([])
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setEventos([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.titulo.trim() || !formData.animal.trim()) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    try {
      // Tentar usar API primeiro
      try {
        const response = await fetch('/api/calendario-reprodutivo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            titulo: formData.titulo,
            data_evento: formData.data,
            tipo_evento: formData.tipo,
            descricao: formData.descricao,
            // Nota: animal_id seria necessário se tivéssemos integração com animais
            animal_nome: formData.animal
          })
        })

        if (response.ok) {
          alert('Evento registrado com sucesso!')
          setShowForm(false)
          setFormData({
            titulo: '',
            animal: '',
            data: new Date().toISOString().split('T')[0],
            tipo: '',
            descricao: ''
          })
          loadEventos()
          return
        }
      } catch (apiError) {
        console.log('API não disponível, salvando no localStorage')
      }

      // Fallback para localStorage
      const newEvento = {
        id: Date.now(),
        titulo: formData.titulo,
        animal: formData.animal,
        data: formData.data,
        tipo: formData.tipo,
        descricao: formData.descricao,
        status: 'Agendado'
      }

      const updatedEventos = [newEvento, ...eventos]
      setEventos(updatedEventos)
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('calendarioReprodutivo', JSON.stringify(updatedEventos))
      }

      alert('Evento registrado com sucesso!')
      setShowForm(false)
      setFormData({
        titulo: '',
        animal: '',
        data: new Date().toISOString().split('T')[0],
        tipo: '',
        descricao: ''
      })

    } catch (error) {
      console.error('Erro ao registrar evento:', error)
      alert('Erro ao registrar evento')
    }
  }

  const handleDelete = async (id) => {
    // Não permitir excluir eventos de receptoras (são gerados automaticamente)
    const evento = eventos.find(e => e.id === id)
    if (evento && evento.origem === 'receptora') {
      alert('Este evento é gerado automaticamente e não pode ser excluído.')
      return
    }

    if (confirm('Tem certeza que deseja excluir este evento?')) {
      try {
        // Tentar usar API primeiro
        try {
          const response = await fetch(`/api/calendario-reprodutivo?id=${id}`, {
            method: 'DELETE'
          })

          if (response.ok) {
            alert('Evento excluído com sucesso!')
            loadEventos()
            return
          }
        } catch (apiError) {
          console.log('API não disponível, removendo do localStorage')
        }

        // Fallback para localStorage
        const updatedData = eventos.filter(item => item.id !== id)
        setEventos(updatedData)
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('calendarioReprodutivo', JSON.stringify(updatedData))
        }
        
        alert('Evento excluído com sucesso!')
      } catch (error) {
        console.error('Erro ao excluir evento:', error)
        alert('Erro ao excluir evento')
      }
    }
  }

  const exportarExcel = async () => {
    try {
      setExportando(true)
      
      // Importar ExcelJS dinamicamente
      const ExcelJS = (await import('exceljs')).default
      
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Calendário Reprodutivo')
      
      // Título principal
      worksheet.mergeCells('A1:J1')
      const titleCell = worksheet.getCell('A1')
      titleCell.value = 'CALENDÁRIO REPRODUTIVO'
      titleCell.font = { size: 16, bold: true }
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
      
      // Informações gerais
      worksheet.mergeCells('A2:J2')
      const infoCell = worksheet.getCell('A2')
      infoCell.value = `Gerado em: ${new Date().toLocaleDateString('pt-BR')} - Total de eventos: ${eventos.length}`
      infoCell.font = { size: 10, italic: true }
      infoCell.alignment = { horizontal: 'center' }
      
      // Cabeçalhos
      const headers = ['Data', 'Tipo de Evento', 'Título', 'Animal', 'Tatuagem', 'Status', 'Descrição', 'NF', 'Fornecedor', 'Data TE']
      worksheet.addRow(headers)
      
      // Estilizar cabeçalhos
      const headerRow = worksheet.getRow(3)
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE91E63' }
      }
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' }
      
      // Adicionar dados
      eventos.forEach(evento => {
        const dataEvento = evento.data_evento || evento.data
        const dataFormatada = dataEvento ? new Date(dataEvento).toLocaleDateString('pt-BR') : ''
        const tipoEvento = evento.tipo_evento || evento.tipo || '-'
        const titulo = evento.titulo || '-'
        const animalNome = evento.animal_nome || evento.animal || '-'
        const tatuagem = evento.animal_tatuagem || (evento.animal_serie && evento.animal_rg ? `${evento.animal_serie}${evento.animal_rg}` : '-')
        const status = evento.status || 'Agendado'
        const descricao = evento.descricao || '-'
        const numeroNF = evento.numero_nf || '-'
        const fornecedor = evento.fornecedor || '-'
        const dataTE = evento.data_te ? new Date(evento.data_te).toLocaleDateString('pt-BR') : '-'
        
        worksheet.addRow([
          dataFormatada,
          tipoEvento,
          titulo,
          animalNome,
          tatuagem,
          status,
          descricao,
          numeroNF,
          fornecedor,
          dataTE
        ])
      })
      
      // Ajustar larguras das colunas
      worksheet.columns.forEach((column, index) => {
        if (index === 0) column.width = 12 // Data
        else if (index === 1) column.width = 25 // Tipo
        else if (index === 2) column.width = 30 // Título
        else if (index === 3) column.width = 20 // Animal
        else if (index === 4) column.width = 15 // Tatuagem
        else if (index === 5) column.width = 15 // Status
        else if (index === 6) column.width = 40 // Descrição
        else if (index === 7) column.width = 12 // NF
        else if (index === 8) column.width = 20 // Fornecedor
        else column.width = 12 // Data TE
      })
      
      // Aplicar cores condicionais no status
      eventos.forEach((evento, index) => {
        const row = worksheet.getRow(index + 4) // +4 porque temos título, info, header e começa em 1
        const statusCell = row.getCell(6) // Coluna F (Status) - 6ª coluna
        
        if (statusCell.value === 'Concluído' || statusCell.value === 'Prenha') {
          statusCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4CAF50' }
          }
          statusCell.font = { color: { argb: 'FFFFFFFF' } }
        } else if (statusCell.value === 'Vazia') {
          statusCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF44336' }
          }
          statusCell.font = { color: { argb: 'FFFFFFFF' } }
        } else if (statusCell.value === 'Agendado') {
          statusCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFF9800' }
          }
          statusCell.font = { color: { argb: 'FFFFFFFF' } }
        }
      })
      
      // Gerar arquivo
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Calendario_Reprodutivo_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      setExportando(false)
      alert('Calendário exportado com sucesso!')
    } catch (error) {
      console.error('Erro ao exportar:', error)
      setExportando(false)
      alert('Erro ao exportar calendário')
    }
  }

  const handleStatusChange = async (id, novoStatus) => {
    const evento = eventos.find(e => e.id === id)
    if (evento && evento.origem === 'receptora') {
      alert('Eventos gerados automaticamente não podem ter o status alterado.')
      return
    }
    try {
      try {
        const response = await fetch('/api/calendario-reprodutivo', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status: novoStatus })
        })
        if (response.ok) {
          loadEventos()
          return
        }
      } catch {}
      const updated = eventos.map(e => e.id === id ? { ...e, status: novoStatus } : e)
      setEventos(updated)
      if (typeof window !== 'undefined') {
        localStorage.setItem('calendarioReprodutivo', JSON.stringify(updated))
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
    }
  }

  const [expandedGroups, setExpandedGroups] = useState({})

  const toggleGroup = (key) => {
    setExpandedGroups(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const eventosFiltrados = eventos.filter(evento => {
    if (filtroTipo && evento.tipo_evento !== filtroTipo && evento.tipo !== filtroTipo) {
      return false
    }
    if (filtroData) {
      const dataEvento = evento.data_evento || evento.data
      if (dataEvento) {
        const dataFormatada = new Date(dataEvento).toISOString().split('T')[0]
        return dataFormatada === filtroData
      }
      return false
    }
    if (filtroStatus && (evento.status || 'Agendado') !== filtroStatus) {
      return false
    }
    if (filtroBusca) {
      const termo = filtroBusca.toLowerCase()
      const t = [
        evento.titulo,
        evento.tipo_evento || evento.tipo,
        evento.animal_nome || evento.animal,
        evento.descricao,
        evento.numero_nf,
        evento.fornecedor,
        evento.animal_tatuagem
      ].filter(Boolean).join(' ').toLowerCase()
      if (!t.includes(termo)) return false
    }
    return true
  })

  const groupedEvents = React.useMemo(() => {
    const groups = {}
    eventosFiltrados.forEach(evento => {
      const data = evento.data_evento || evento.data
      const dataFormatada = data ? new Date(data).toISOString().split('T')[0] : 'sem-data'
      const tipo = evento.tipo_evento || evento.tipo || 'sem-tipo'
      const nf = evento.numero_nf || 'sem-nf'
      
      // Chave única para o grupo: Data + Tipo + NF
      const key = `${dataFormatada}|${tipo}|${nf}`
      
      if (!groups[key]) {
        groups[key] = {
          key,
          data: data,
          tipo: tipo,
          nf: evento.numero_nf,
          fornecedor: evento.fornecedor,
          status: evento.status,
          events: []
        }
      }
      groups[key].events.push(evento)
    })
    
    // Converter para array e manter a ordem original (ordenado por data se possível)
    return Object.values(groups).sort((a, b) => {
        // Tentar ordenar por data decrescente
        if (a.data && b.data) {
            return new Date(b.data) - new Date(a.data)
        }
        return 0
    })
  }, [eventosFiltrados])

  const renderItem = (item) => {
    const dataEvento = item.data_evento || item.data
    const dataFormatada = dataEvento ? new Date(dataEvento).toLocaleDateString('pt-BR') : '-'
    const tipoEvento = item.tipo_evento || item.tipo || '-'
    const animalNome = item.animal_nome || item.animal || '-'
    const tatuagem = item.animal_tatuagem || (item.animal_serie && item.animal_rg ? `${item.animal_serie}${item.animal_rg}` : '-')
    const status = item.status || 'Agendado'
    const origem = item.origem || 'manual'
    
    // Cor do badge de status
    let statusColor = 'bg-gray-500'
    if (status === 'Concluído' || status === 'Prenha') statusColor = 'bg-green-500'
    else if (status === 'Vazia') statusColor = 'bg-red-500'
    else if (status === 'Agendado') statusColor = 'bg-orange-500'
    
    // Cor do badge de origem
    let origemColor = 'bg-blue-500'
    if (origem === 'receptora') origemColor = 'bg-purple-500'
    
    // Cor da borda baseada no tipo de evento
    let borderColor = 'border-pink-500'
    if (tipoEvento === 'Chegada de Receptora') borderColor = 'border-blue-500'
    else if (tipoEvento === 'Diagnóstico de Gestação') borderColor = 'border-yellow-500'
    else if (tipoEvento === 'Parto Previsto') borderColor = 'border-green-500'
    else if (origem === 'receptora') borderColor = 'border-purple-500'
    
    return (
      <div 
        key={item.id} 
        className={`bg-white dark:bg-gray-800 rounded-lg p-6 border-l-4 ${borderColor} shadow-md hover:shadow-lg transition-shadow`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                {item.titulo || '-'}
              </h3>
              <span className={`px-2 py-1 rounded text-xs text-white ${statusColor}`}>
                {status}
              </span>
              {origem === 'receptora' && (
                <span className={`px-2 py-1 rounded text-xs text-white ${origemColor}`}>
                  Receptora
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Data: </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{dataFormatada}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tipo: </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{tipoEvento}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Animal: </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{animalNome}</span>
              </div>
              {tatuagem && tatuagem !== '-' && (
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tatuagem: </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">{tatuagem}</span>
                </div>
              )}
              {item.numero_nf && (
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">NF: </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.numero_nf}</span>
                </div>
              )}
              {item.fornecedor && (
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Fornecedor: </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.fornecedor}</span>
                </div>
              )}
              {item.data_te && (
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Data TE: </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(item.data_te).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
            
            {item.descricao && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 bg-gray-50 dark:bg-gray-700 p-3 rounded">
                {item.descricao}
              </p>
            )}
          </div>
          
          {origem !== 'receptora' && (
            <div className="flex gap-2 ml-4">
              <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400">
                <PencilIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="text-red-600 hover:text-red-800 dark:text-red-400"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleStatusChange(item.id, 'Agendado')}
                  className="px-2 py-1 text-xs rounded bg-orange-500 text-white hover:bg-orange-600"
                >
                  Agendar
                </button>
                <button
                  onClick={() => handleStatusChange(item.id, 'Concluído')}
                  className="px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700"
                >
                  Concluir
                </button>
                <button
                  onClick={() => handleStatusChange(item.id, 'Vazia')}
                  className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700"
                >
                  Vazia
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const getMonthDays = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startWeekday = firstDay.getDay()
    const days = []
    for (let i = 0; i < startWeekday; i++) {
      days.push(null)
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d))
    }
    return days
  }

  const eventosPorDia = React.useMemo(() => {
    const map = {}
    eventosFiltrados.forEach(ev => {
      const d = ev.data_evento || ev.data
      if (!d) return
      const key = new Date(d).toISOString().split('T')[0]
      if (!map[key]) map[key] = []
      map[key].push(ev)
    })
    return map
  }, [eventosFiltrados])

  const renderMonthView = () => {
    const days = getMonthDays(currentMonth)
    const monthLabel = currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
              className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-xl font-semibold text-gray-900 dark:text-white">
              {monthLabel}
            </div>
            <button
              onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
              className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <button
            onClick={() => {
              const today = new Date()
              today.setDate(1)
              setCurrentMonth(today)
            }}
            className="px-3 py-1 rounded bg-pink-600 text-white hover:bg-pink-700"
          >
            Hoje
          </button>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => (
            <div key={d} className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {d}
            </div>
          ))}
          {days.map((d, idx) => {
            if (!d) {
              return <div key={`empty-${idx}`} className="rounded-lg bg-transparent" />
            }
            const key = d.toISOString().split('T')[0]
            const list = eventosPorDia[key] || []
            const isSelected = selectedDate === key
            return (
              <button
                key={key}
                onClick={() => {
                  setSelectedDate(key)
                  setFormData(prev => ({ ...prev, data: key }))
                }}
                className={`text-left p-2 rounded-lg border transition-colors ${
                  isSelected ? 'border-pink-600 bg-pink-50 dark:bg-pink-900/10' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{d.getDate()}</span>
                  {list.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300">
                      {list.length}
                    </span>
                  )}
                </div>
                <div className="mt-2 space-y-1">
                  {list.slice(0, 3).map(ev => {
                    const tipo = ev.tipo_evento || ev.tipo || ''
                    const status = ev.status || 'Agendado'
                    const color =
                      status === 'Concluído' || status === 'Prenha' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                      status === 'Vazia' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                    return (
                      <div key={ev.id} className={`text-xs rounded px-2 py-1 ${color}`}>
                        {tipo || ev.titulo}
                      </div>
                    )
                  })}
                  {list.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">+{list.length - 3} mais</div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Dia selecionado: {selectedDate || 'nenhum'}
          </div>
          <button
            onClick={() => {
              if (!selectedDate) {
                const today = new Date().toISOString().split('T')[0]
                setSelectedDate(today)
                setFormData(prev => ({ ...prev, data: today }))
              }
              setShowForm(true)
            }}
            className="inline-flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700"
          >
            <PlusIcon className="w-5 h-5" />
            Novo Evento no Dia
          </button>
        </div>
        {selectedDate && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center gap-2 mb-3">
              <CalendarIcon className="w-5 h-5 text-pink-600" />
              <div className="font-semibold text-gray-900 dark:text-white">
                Eventos de {new Date(selectedDate).toLocaleDateString('pt-BR')}
              </div>
            </div>
            <div className="space-y-3">
              {(eventosPorDia[selectedDate] || []).map(ev => renderItem(ev))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-8 h-8 text-pink-600" />
            Calendário Reprodutivo
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Agenda reprodutiva - {eventosFiltrados.length} evento(s) encontrado(s)
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-pink-600 text-white' : 'text-gray-700 dark:text-gray-300'}`}
            >
              Lista
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-2 text-sm ${viewMode === 'month' ? 'bg-pink-600 text-white' : 'text-gray-700 dark:text-gray-300'}`}
            >
              Calendário
            </button>
          </div>
          <button
            onClick={exportarExcel}
            disabled={exportando || eventos.length === 0}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportando ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Exportando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar Excel
              </>
            )}
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Novo Evento
          </button>
        </div>
      </div>

      {/* Resumo de Eventos */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-sm text-blue-600 dark:text-blue-400">Chegadas</div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {eventos.filter(e => e.tipo_evento === 'Chegada de Receptora').length}
          </div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="text-sm text-yellow-600 dark:text-yellow-400">DG Agendados</div>
          <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
            {eventos.filter(e => e.tipo_evento === 'Diagnóstico de Gestação').length}
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <div className="text-sm text-green-600 dark:text-green-400">Partos Previstos</div>
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
            {eventos.filter(e => e.tipo_evento === 'Parto Previsto').length}
          </div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
          <div className="text-sm text-orange-600 dark:text-orange-400">Refazer Andrológico</div>
          <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
            {eventos.filter(e => e.tipo_evento === 'Refazer Exame Andrológico').length}
          </div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="text-sm text-purple-600 dark:text-purple-400">Total de Eventos</div>
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {eventos.length}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filtrar por Tipo
            </label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Todos os tipos</option>
              <option value="Chegada de Receptora">Chegada de Receptora</option>
              <option value="Diagnóstico de Gestação">Diagnóstico de Gestação</option>
              <option value="Inseminação">Inseminação Artificial</option>
              <option value="Transferência">Transferência de Embriões</option>
              <option value="Parto">Parto Previsto</option>
              <option value="Exame">Exame Reprodutivo</option>
              <option value="Refazer Exame Andrológico">Refazer Exame Andrológico</option>
              <option value="Vacinação">Vacinação</option>
              <option value="Outro">Outro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filtrar por Data
            </label>
            <input
              type="date"
              value={filtroData}
              onChange={(e) => setFiltroData(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Todos</option>
              <option value="Agendado">Agendado</option>
              <option value="Concluído">Concluído</option>
              <option value="Vazia">Vazia</option>
              <option value="Prenha">Prenha</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFiltroTipo('')
                setFiltroData('')
                setFiltroStatus('')
                setFiltroBusca('')
              }}
              className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
          <div className="md:col-span-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Busca
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-500 dark:text-gray-300" />
                <input
                  value={filtroBusca}
                  onChange={(e) => setFiltroBusca(e.target.value)}
                  placeholder="Procurar por título, animal, tatuagem, NF, fornecedor..."
                  className="w-full bg-transparent outline-none text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulário de Novo Evento */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Novo Evento Reprodutivo
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título do Evento *
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                  placeholder="Ex: Inseminação, Parto, Exame..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Animal *
                </label>
                <input
                  type="text"
                  value={formData.animal}
                  onChange={(e) => setFormData({...formData, animal: e.target.value})}
                  placeholder="Identificação do animal"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data do Evento *
                </label>
                <input
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({...formData, data: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Evento
                </label>
                <select 
                  value={formData.tipo}
                  onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Selecione o tipo</option>
                  <option value="Inseminação">Inseminação Artificial</option>
                  <option value="Transferência">Transferência de Embriões</option>
                  <option value="Parto">Parto Previsto</option>
                  <option value="Exame">Exame Reprodutivo</option>
                  <option value="Refazer Exame Andrológico">Refazer Exame Andrológico</option>
                  <option value="Vacinação">Vacinação</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  placeholder="Detalhes sobre o evento..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-600">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
              >
                Adicionar Evento
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Carregando dados...</div>
        </div>
      ) : viewMode === 'month' ? (
        renderMonthView()
      ) : eventosFiltrados.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-12 text-center">
          <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Nenhum evento agendado
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Comece adicionando eventos ao calendário reprodutivo
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700"
          >
            <PlusIcon className="w-5 h-5" />
            Adicionar Evento
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedEvents.map((group) => {
            // Se for apenas 1 evento no grupo, renderiza normal
            if (group.events.length === 1) {
              return renderItem(group.events[0])
            }
            
            // Se for um lote (mais de 1 evento)
            const isExpanded = expandedGroups[group.key]
            
            // Determinar cores do grupo
            const tipoEvento = group.tipo
            const origem = group.events[0].origem
            let borderColor = 'border-pink-500'
            if (tipoEvento === 'Chegada de Receptora') borderColor = 'border-blue-500'
            else if (tipoEvento === 'Diagnóstico de Gestação') borderColor = 'border-yellow-500'
            else if (tipoEvento === 'Parto Previsto') borderColor = 'border-green-500'
            else if (origem === 'receptora') borderColor = 'border-purple-500'

            return (
              <div key={group.key} className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border-l-4 ${borderColor}`}>
                 {/* Header do Lote */}
                 <div 
                   onClick={() => toggleGroup(group.key)}
                   className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex justify-between items-center"
                 >
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                                Lote: {tipoEvento}
                            </h3>
                            <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300 border border-gray-500">
                                {group.events.length} Animais
                            </span>
                            {group.nf && group.nf !== 'sem-nf' && (
                                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                                    NF: {group.nf}
                                </span>
                            )}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            {group.data ? new Date(group.data).toLocaleDateString('pt-BR') : 'Data N/A'} • {group.fornecedor || 'Fornecedor N/A'}
                        </div>
                    </div>
                    <div>
                        {/* Chevron */}
                        <svg className={`w-6 h-6 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                 </div>
                 
                 {/* Itens do Lote (Expandido) */}
                 {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4 space-y-3">
                        {group.events.map(item => renderItem(item))}
                    </div>
                 )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
