import React, { useState, useEffect, useMemo } from 'react'
import { ScaleIcon, PlusIcon, PencilIcon, XMarkIcon, DocumentArrowUpIcon, MagnifyingGlassIcon, DocumentTextIcon, FunnelIcon, ChartBarIcon, ArrowPathIcon, MapPinIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, CalendarIcon, SparklesIcon } from '../../components/ui/Icons'
import * as XLSX from 'xlsx'
import ImportarTextoPesagens from '../../components/ImportarTextoPesagens'
import ImportProgressOverlay from '../../components/ImportProgressOverlay'

export default function Pesagem() {
  const [mounted, setMounted] = useState(false)
  const [pesagens, setPesagens] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [animais, setAnimais] = useState([])
  const [selectedAnimal, setSelectedAnimal] = useState(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showImportTextModal, setShowImportTextModal] = useState(false)
  const [importData, setImportData] = useState([])
  const [columnMapping, setColumnMapping] = useState({})
  const [availableColumns, setAvailableColumns] = useState([])
  const [filtroAnimal, setFiltroAnimal] = useState('')
  const [filtroData, setFiltroData] = useState('')
  const [filtroLote, setFiltroLote] = useState('')
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [itensPorPagina, setItensPorPagina] = useState(15)
  const [showNotFoundModal, setShowNotFoundModal] = useState(false)
  const [notFoundList, setNotFoundList] = useState([])
  const [showLocalModal, setShowLocalModal] = useState(false)
  const [selectedLocalDados, setSelectedLocalDados] = useState(null)
  const [viewMode, setViewMode] = useState('table') // 'table', 'cards', 'charts'
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [filtroSexo, setFiltroSexo] = useState('')
  const [filtroLocal, setFiltroLocal] = useState('')
  const [filtroPesoMin, setFiltroPesoMin] = useState('')
  const [filtroPesoMax, setFiltroPesoMax] = useState('')
  const [filtroDataInicio, setFiltroDataInicio] = useState('')
  const [filtroDataFim, setFiltroDataFim] = useState('')
  const [sortBy, setSortBy] = useState('data') // 'data', 'peso', 'animal', 'ce'
  const [sortOrder, setSortOrder] = useState('desc') // 'asc', 'desc'
  const [selectedAnimalForHistory, setSelectedAnimalForHistory] = useState(null)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [importandoPesagens, setImportandoPesagens] = useState(false)
  const [importProgressPesagens, setImportProgressPesagens] = useState({ atual: 0, total: 0, etapa: '' })
  const [formData, setFormData] = useState({
    animal_id: '',
    peso: '',
    ce: '', // Circunferência Escrotal para machos
    data: new Date().toISOString().split('T')[0],
    lote: '',
    observacoes: ''
  })
  const exportResumoPorLocalCSV = (resumo) => {
    try {
      const header = ['Local','Fêmea','Macho','Total','Média Peso','Peso Min','Peso Max','Média CE']
      const lines = [header.join(';'), ...resumo.map(r => [
        r.local,
        r.femeas ?? 0,
        r.machos ?? 0,
        r.qtde ?? 0,
        r.mediaPeso ?? '-',
        r.minPeso ?? '-',
        r.maxPeso ?? '-',
        r.mediaCE ?? '-'
      ].join(';'))]
      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `resumo-piquete-${new Date().toISOString().slice(0,10)}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('Erro ao exportar CSV: ' + e.message)
    }
  }
  const aplicarLocalizacoesAutomaticamente = async () => {
    try {
      const porAnimal = {}
      pesagens.forEach(p => {
        const aid = p.animal_id
        if (!aid) return
        const d = p.data || ''
        const prev = porAnimal[aid]
        if (!prev || (d > (prev.data || '')) || (d === (prev.data || '') && (p.updatedAt || p.createdAt || '') > (prev.updatedAt || prev.createdAt || ''))) {
          porAnimal[aid] = p
        }
      })
      const requests = []
      const validos = []
      for (const [aid, p] of Object.entries(porAnimal)) {
        const local = extrairLocal(p.observacoes)
        if (!local || local.toUpperCase() === 'NÃO INFORMADO' || local === '-') continue
        const body = {
          animal_id: Number(aid),
          piquete: local,
          data_entrada: p.data || new Date().toISOString().split('T')[0],
          motivo_movimentacao: 'Importado da Pesagem',
          observacoes: p.observacoes || null,
          usuario_responsavel: 'Sistema'
        }
        validos.push(body)
        requests.push(
          fetch('/api/localizacoes', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(body) 
          }).then(r => r.ok).catch(() => false)
        )
      }
      const results = await Promise.all(requests)
      const aplicados = results.filter(r => r === true).length
      const ignorados = Object.keys(porAnimal).length - validos.length + results.filter(r => r === false).length
      alert(`✅ Localização aplicada automaticamente para ${aplicados} animal(is)\nℹ️ ${ignorados} sem observação/local válido ou com erro`)
    } catch (e) {
      alert('❌ Erro ao aplicar localizações automaticamente: ' + e.message)
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      loadPesagens()
      loadAnimais()
    }
  }, [mounted])

  useEffect(() => {
    if (!mounted || pesagens.length === 0 || animais.length === 0) return
    const semSexo = pesagens.filter(p => !p.animal_sexo && (p.animal_id || p.animal))
    if (semSexo.length === 0) return
    const mapa = Object.fromEntries(animais.map(a => [a.id, a.sexo]).filter(([, s]) => s))
    const enriquecido = pesagens.map(p => {
      if (p.animal_sexo) return p
      const sexo = p.animal_id ? mapa[p.animal_id] : null
      if (!sexo && p.animal) {
        const [serie, rg] = String(p.animal).split(/\s*-\s*/)
        const a = animais.find(x => x.serie === serie && x.rg == rg)
        if (a?.sexo) return { ...p, animal_sexo: a.sexo }
      }
      return sexo ? { ...p, animal_sexo: sexo } : p
    })
    if (JSON.stringify(enriquecido) !== JSON.stringify(pesagens)) {
      setPesagens(enriquecido)
    }
  }, [mounted, pesagens, animais])

  const loadAnimais = async () => {
    try {
      const response = await fetch('/api/animals')
      if (response.ok) {
        const data = await response.json()
        setAnimais(data.animals || [])
      } else {
        // Fallback para localStorage se API não estiver disponível
        const savedAnimals = localStorage.getItem('animals')
        if (savedAnimals) {
          setAnimais(JSON.parse(savedAnimals))
        }
      }
    } catch (error) {
      console.error('Erro ao carregar animais:', error)
      // Fallback para localStorage
      const savedAnimals = localStorage.getItem('animals')
      if (savedAnimals) {
        setAnimais(JSON.parse(savedAnimals))
      }
    }
  }

  const loadPesagens = async () => {
    try {
      setIsLoading(true)
      if (typeof window === 'undefined') {
        setIsLoading(false)
        return
      }
      try {
        const fromApi = await fetch('/api/pesagens').then(r => r.ok ? r.json() : { pesagens: [] })
        const apiPesagens = fromApi.pesagens || []
        const fromStorage = JSON.parse(localStorage.getItem('pesagens') || '[]')
        const idsApi = new Set(apiPesagens.map(p => `${p.animal_id}-${p.data}-${p.peso}`))
        const storageUnicas = fromStorage.filter(p => !idsApi.has(`${p.animal_id}-${p.data}-${p.peso}`))
        setPesagens([...apiPesagens, ...storageUnicas])
      } catch (e) {
        const savedData = localStorage.getItem('pesagens')
        setPesagens(savedData ? JSON.parse(savedData) : [])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setPesagens([])
    } finally {
      setIsLoading(false)
    }
  }

  const savePesagens = (newData) => {
    setPesagens(newData)
    if (typeof window !== 'undefined') {
      localStorage.setItem('pesagens', JSON.stringify(newData))
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta pesagem?')) return
    const isDbId = typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id))
    if (isDbId) {
      try {
        const r = await fetch(`/api/pesagens?id=${id}`, { method: 'DELETE' })
        if (!r.ok) throw new Error('Falha na API')
      } catch (e) {
        console.warn('Erro ao excluir do banco:', e)
      }
    }
    const updatedData = pesagens.filter(item => item.id !== id)
    savePesagens(updatedData)
  }

  const handleExcluirTodas = async () => {
    if (pesagens.length === 0) {
      alert('Não há pesagens para excluir.')
      return
    }
    
    if (confirm(`⚠️ ATENÇÃO!\n\nDeseja realmente excluir TODAS as ${pesagens.length} pesagens?\n\nEsta ação não pode ser desfeita!`)) {
      if (confirm('Confirma novamente a exclusão de TODAS as pesagens?')) {
        try {
          const r = await fetch('/api/pesagens', { method: 'DELETE' })
          const d = await r.json().catch(() => ({}))
          if (r.ok) {
            savePesagens([])
            alert(`✅ Todas as pesagens foram excluídas (${d.deletados ?? pesagens.length} do banco).`)
          } else {
            savePesagens([])
            alert('✅ Pesagens removidas da tela. O banco pode ter falhado – verifique se não voltam após F5.')
          }
        } catch (e) {
          savePesagens([])
          alert('✅ Pesagens removidas da tela. Erro ao excluir no banco: ' + (e.message || 'Tente F5 para conferir.'))
        }
      }
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    const animal = animais.find(a => a.id === item.animal_id || a.serie === item.animal)
    setSelectedAnimal(animal)
    setFormData({
      animal_id: item.animal_id || '',
      peso: item.peso || '',
      ce: item.ce || '',
      data: item.data || new Date().toISOString().split('T')[0],
      lote: item.lote || '',
      observacoes: item.observacoes || ''
    })
    setShowForm(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.animal_id || !formData.peso) {
      alert('Por favor, preencha os campos obrigatórios (Animal e Peso)')
      return
    }

    const animal = animais.find(a => a.id == formData.animal_id)
    if (!animal) {
      alert('Animal não encontrado!')
      return
    }

    const newItem = {
      id: editingItem ? editingItem.id : Date.now(),
      animal_id: formData.animal_id,
      animal: `${animal.serie} - ${animal.rg}`,
      animal_sexo: animal.sexo,
      peso: parseFloat(formData.peso),
      ce: animal.sexo === 'Macho' ? parseFloat(formData.ce) || null : null,
      data: formData.data,
      lote: formData.lote || null,
      observacoes: formData.observacoes,
      createdAt: editingItem ? editingItem.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    let updatedData
    if (editingItem) {
      updatedData = pesagens.map(item =>
        item.id === editingItem.id ? newItem : item
      )
    } else {
      updatedData = [...pesagens, newItem]
    }

    savePesagens(updatedData)
    handleCloseForm()

    const action = editingItem ? 'atualizada' : 'adicionada'
    alert(`Pesagem ${action} com sucesso!`)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingItem(null)
    setSelectedAnimal(null)
    setFormData({
      animal_id: '',
      peso: '',
      ce: '',
      data: new Date().toISOString().split('T')[0],
      lote: '',
      observacoes: ''
    })
  }

  // Funções para importação de Excel
  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

        if (jsonData.length > 0) {
          const headers = jsonData[0]
          const rows = jsonData.slice(1)

          setAvailableColumns(headers)
          setImportData(rows)
          setColumnMapping({
            animal: '',
            serie: '',
            rg: '',
            peso: '',
            ce: '',
            data: '',
            observacoes: '',
            local: '',
            sexo: ''
          })
          setShowImportModal(true)
        }
      } catch (error) {
        alert('Erro ao ler arquivo Excel: ' + error.message)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleImport = async () => {
    if (
      !columnMapping.peso ||
      !(
        columnMapping.animal ||
        columnMapping.rg ||
        (columnMapping.serie && columnMapping.rg)
      )
    ) {
      alert('Selecione identificação (Animal ou RG/PGN) e Peso')
      return
    }

    setImportandoPesagens(true)
    setImportProgressPesagens({ atual: 0, total: importData.length, etapa: 'Importando pesagens...' })

    try {
    const animalColIndex = availableColumns.indexOf(columnMapping.animal)
    const serieColIndex = columnMapping.serie ? availableColumns.indexOf(columnMapping.serie) : -1
    const rgColIndex = columnMapping.rg ? availableColumns.indexOf(columnMapping.rg) : -1
    const pesoColIndex = availableColumns.indexOf(columnMapping.peso)
    const ceColIndex = columnMapping.ce ? availableColumns.indexOf(columnMapping.ce) : -1
    const dataColIndex = columnMapping.data ? availableColumns.indexOf(columnMapping.data) : -1
    const obsColIndex = columnMapping.observacoes ? availableColumns.indexOf(columnMapping.observacoes) : -1
    const localColIndex = columnMapping.local ? availableColumns.indexOf(columnMapping.local) : -1
    const sexoColIndex = columnMapping.sexo ? availableColumns.indexOf(columnMapping.sexo) : -1

    const newPesagens = []
    let importedCount = 0
    let errorCount = 0
    const notFound = []
    let createdCount = 0

    for (let index = 0; index < importData.length; index++) {
      setImportProgressPesagens({ atual: index + 1, total: importData.length, etapa: `Processando linha ${index + 1} de ${importData.length}...` })
      const row = importData[index]
      try {
        const animalIdentifier = animalColIndex >= 0 ? String(row[animalColIndex] ?? '').trim() : ''
        const serieVal = serieColIndex >= 0 ? String(row[serieColIndex] ?? '').trim() : ''
        const rgRaw = rgColIndex >= 0 ? row[rgColIndex] : ''
        const rgVal = String(rgRaw ?? '').replace(/^0+/, '').trim()
        const peso = parseFloat(row[pesoColIndex])

        if ((!animalIdentifier && !rgVal) || isNaN(peso)) {
          errorCount++
          continue
        }

        let animal = null
        if (rgVal) {
          animal = animais.find(a => String(a.rg).replace(/^0+/, '') === rgVal)
        }
        if (!animal && animalIdentifier) {
          animal = animais.find(a =>
            a.serie === animalIdentifier ||
            a.rg === animalIdentifier ||
            `${a.serie} - ${a.rg}` === animalIdentifier
          )
        }
        if (!animal && rgVal && serieVal) {
          const combined = `${serieVal} ${rgVal}`
          animal = animais.find(a => a.serie === combined) || animais.find(a => `${a.serie} - ${a.rg}` === `${combined} - ${rgVal}`)
        }

        const localVal = localColIndex >= 0 ? String(row[localColIndex] ?? '').trim() : ''
        const obsVal = obsColIndex >= 0 ? String(row[obsColIndex] ?? '').trim() : ''
        const observacoes = localVal || obsVal
        const sexoRaw = sexoColIndex >= 0 ? String(row[sexoColIndex] ?? '').trim().toLowerCase() : ''
        const sexoVal = sexoRaw
          ? (/(macho|m|♂)/i.test(sexoRaw) ? 'Macho' : (/(femea|fêmea|f|♀)/i.test(sexoRaw) ? 'Fêmea' : null))
          : null

        if (!animal) {
          const novaSerie = serieVal && rgVal ? `${serieVal} ${rgVal}` : (animalIdentifier || `IMPORT-${Date.now()}-${index}`)
          const novoRg = rgVal || (animalIdentifier ? animalIdentifier.replace(/\D+/g, '') : '')
          const body = {
            serie: novaSerie,
            rg: novoRg,
            sexo: sexoVal || 'Fêmea',
            raca: null,
            peso: peso,
            observacoes: `Criado via importação de Pesagens\n${observacoes || ''}`,
            situacao: 'Ativo'
          }
          try {
            // Criar animal no banco
            // Nota: API retorna { data: animalComIdentificacao }
            const resp = await fetch('/api/animals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
            if (resp.ok) {
              const d = await resp.json().catch(() => ({}))
              const createdAnimal = (d.data || d) // compatibilidade
              animal = {
                id: createdAnimal.id,
                serie: createdAnimal.serie || novaSerie,
                rg: createdAnimal.rg || novoRg,
                sexo: createdAnimal.sexo || (sexoVal || 'Fêmea')
              }
              // Atualizar lista local de animais para próximos matches
              setAnimais(prev => {
                const exists = prev.find(a => a.id === animal.id)
                return exists ? prev : [...prev, animal]
              })
              createdCount++
              // Aplicar localização inicial se houver
              if (localVal) {
                const locBody = {
                  animal_id: animal.id,
                  piquete: localVal,
                  data_entrada: dataColIndex >= 0 ? formatExcelDate(row[dataColIndex]) : new Date().toISOString().split('T')[0],
                  motivo_movimentacao: 'Importado (Cadastro Automático)',
                  observacoes,
                  usuario_responsavel: 'Sistema'
                }
                try { await fetch('/api/localizacoes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(locBody) }) } catch (_) {}
              }
            } else {
              notFound.push({ linha: index + 2, serie: serieVal, rg: rgVal, animal: animalIdentifier, motivo: 'Falha ao cadastrar' })
              continue
            }
          } catch (e) {
            notFound.push({ linha: index + 2, serie: serieVal, rg: rgVal, animal: animalIdentifier, motivo: e.message || 'Erro ao cadastrar' })
            continue
          }
        }

        const newPesagem = {
          id: Date.now() + index,
          animal_id: animal.id,
          animal: `${animal.serie} - ${animal.rg}`,
          animal_sexo: animal.sexo || sexoVal || null,
          peso: peso,
          ce: (ceColIndex >= 0 && animal.sexo === 'Macho') ? parseFloat(row[ceColIndex]) || null : null,
          data: dataColIndex >= 0 ? formatExcelDate(row[dataColIndex]) : new Date().toISOString().split('T')[0],
          observacoes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        newPesagens.push(newPesagem)
        importedCount++
      } catch (error) {
        errorCount++
        console.error(`Erro na linha ${index + 2}:`, error)
      }
    }

    if (newPesagens.length > 0) {
      const updatedPesagens = [...pesagens, ...newPesagens]
      savePesagens(updatedPesagens)
      setShowImportModal(false)
      if (notFound.length > 0) {
        setNotFoundList(notFound)
        setShowNotFoundModal(true)
      }
      alert(`Importação concluída!\n✅ ${importedCount} pesagens importadas\n🆕 ${createdCount} animais cadastrados\n❌ ${errorCount} erros`)
      await aplicarLocalizacoesAutomaticamente()
    } else {
      alert('Nenhuma pesagem válida foi encontrada para importar.')
    }
    } catch (err) {
      alert('Erro na importação: ' + (err?.message || String(err)))
      throw err
    } finally {
      setImportandoPesagens(false)
      setImportProgressPesagens({ atual: 0, total: 0, etapa: '' })
    }
  }

  const formatExcelDate = (excelDate) => {
    if (typeof excelDate === 'number') {
      // Excel date serial number
      const date = new Date((excelDate - 25569) * 86400 * 1000)
      return date.toISOString().split('T')[0]
    } else if (typeof excelDate === 'string') {
      // Try to parse string date
      const date = new Date(excelDate)
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]
      }
    }
    return new Date().toISOString().split('T')[0]
  }

  // Filtrar pesagens com filtros avançados
  const pesagensFiltradas = useMemo(() => {
    return pesagens.filter(item => {
      const matchAnimal = !filtroAnimal || 
        item.animal?.toLowerCase().includes(filtroAnimal.toLowerCase())
      
      const matchData = !filtroData || item.data === filtroData
      
      const matchLote = !filtroLote || 
        (item.lote && item.lote.toLowerCase().includes(filtroLote.toLowerCase()))
      
      const matchSexo = !filtroSexo || item.animal_sexo === filtroSexo
      
      const matchLocal = !filtroLocal || 
        extrairLocal(item.observacoes).toLowerCase().includes(filtroLocal.toLowerCase())
      
      const peso = parseFloat(item.peso)
      const matchPesoMin = !filtroPesoMin || peso >= parseFloat(filtroPesoMin)
      const matchPesoMax = !filtroPesoMax || peso <= parseFloat(filtroPesoMax)
      
      const matchDataInicio = !filtroDataInicio || item.data >= filtroDataInicio
      const matchDataFim = !filtroDataFim || item.data <= filtroDataFim
      
      return matchAnimal && matchData && matchLote && matchSexo && matchLocal && 
             matchPesoMin && matchPesoMax && matchDataInicio && matchDataFim
    }).sort((a, b) => {
      let comparison = 0
      
      switch(sortBy) {
        case 'peso':
          comparison = parseFloat(a.peso || 0) - parseFloat(b.peso || 0)
          break
        case 'animal':
          comparison = (a.animal || '').localeCompare(b.animal || '')
          break
        case 'ce':
          comparison = parseFloat(a.ce || 0) - parseFloat(b.ce || 0)
          break
        case 'data':
        default:
          comparison = (a.data || '').localeCompare(b.data || '')
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [pesagens, filtroAnimal, filtroData, filtroLote, filtroSexo, filtroLocal, filtroPesoMin, filtroPesoMax, filtroDataInicio, filtroDataFim, sortBy, sortOrder])

  // Análise de tendências
  const analiseTendencias = useMemo(() => {
    if (pesagens.length < 2) return null
    
    const pesagensOrdenadas = [...pesagens].sort((a, b) => (a.data || '').localeCompare(b.data || ''))
    const metade = Math.floor(pesagensOrdenadas.length / 2)
    const primeiraMetade = pesagensOrdenadas.slice(0, metade)
    const segundaMetade = pesagensOrdenadas.slice(metade)
    
    const mediaPrimeira = primeiraMetade.reduce((sum, p) => sum + parseFloat(p.peso || 0), 0) / primeiraMetade.length
    const mediaSegunda = segundaMetade.reduce((sum, p) => sum + parseFloat(p.peso || 0), 0) / segundaMetade.length
    
    const tendencia = mediaSegunda - mediaPrimeira
    const percentual = ((tendencia / mediaPrimeira) * 100).toFixed(1)
    
    return {
      tendencia: tendencia > 0 ? 'crescente' : tendencia < 0 ? 'decrescente' : 'estável',
      valor: Math.abs(tendencia).toFixed(1),
      percentual: Math.abs(parseFloat(percentual)),
      mediaPrimeira: mediaPrimeira.toFixed(1),
      mediaSegunda: mediaSegunda.toFixed(1)
    }
  }, [pesagens])

  // Histórico de um animal específico
  const getAnimalHistory = (animalId) => {
    return pesagens
      .filter(p => p.animal_id === animalId)
      .sort((a, b) => (a.data || '').localeCompare(b.data || ''))
  }

  // Comparação entre períodos
  const comparacaoPeriodos = useMemo(() => {
    const hoje = new Date()
    const ultimos30Dias = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const ultimos60Dias = new Date(hoje.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    const pesagens30 = pesagens.filter(p => p.data >= ultimos30Dias)
    const pesagens60 = pesagens.filter(p => p.data >= ultimos60Dias && p.data < ultimos30Dias)
    
    const media30 = pesagens30.length > 0 
      ? (pesagens30.reduce((sum, p) => sum + parseFloat(p.peso || 0), 0) / pesagens30.length).toFixed(1)
      : 0
    const media60 = pesagens60.length > 0
      ? (pesagens60.reduce((sum, p) => sum + parseFloat(p.peso || 0), 0) / pesagens60.length).toFixed(1)
      : 0
    
    return {
      ultimos30: { qtd: pesagens30.length, media: media30 },
      anteriores30: { qtd: pesagens60.length, media: media60 },
      diferenca: (parseFloat(media30) - parseFloat(media60)).toFixed(1)
    }
  }, [pesagens])

  // Filtrar pesagens
  const pesagensFiltradas_OLD = pesagens.filter(item => {
    const matchAnimal = !filtroAnimal || 
      item.animal?.toLowerCase().includes(filtroAnimal.toLowerCase())
    
    const matchData = !filtroData || item.data === filtroData
    
    return matchAnimal && matchData
  })
  
  // Estatísticas (usando pesagensFiltradas para refletir os filtros)
  const pesos = pesagensFiltradas.map(p => parseFloat(p.peso)).filter(n => !isNaN(n))
  const ceValores = pesagensFiltradas.map(p => parseFloat(p.ce)).filter(n => !isNaN(n))
  const animaisUnicos = new Set(pesagensFiltradas.map(p => p.animal_id || p.animal)).size
  const machos = pesagensFiltradas.filter(p => p.animal_sexo === 'Macho')
  const femeas = pesagensFiltradas.filter(p => p.animal_sexo === 'Fêmea')
  const estatisticas = {
    total: pesagensFiltradas.length,
    totalGeral: pesagens.length,
    pesoMedio: pesos.length > 0 ? (pesos.reduce((a, b) => a + b, 0) / pesos.length).toFixed(1) : 0,
    pesoMin: pesos.length > 0 ? Math.min(...pesos).toFixed(1) : '-',
    pesoMax: pesos.length > 0 ? Math.max(...pesos).toFixed(1) : '-',
    machos: machos.length,
    femeas: femeas.length,
    animaisUnicos,
    ceMedio: ceValores.length > 0 ? (ceValores.reduce((a, b) => a + b, 0) / ceValores.length).toFixed(1) : '-',
    mediaMachos: machos.length > 0 ? (machos.reduce((s, p) => s + (parseFloat(p.peso) || 0), 0) / machos.length).toFixed(1) : '-',
    mediaFemeas: femeas.length > 0 ? (femeas.reduce((s, p) => s + (parseFloat(p.peso) || 0), 0) / femeas.length).toFixed(1) : '-'
  }

  // Paginação
  const totalPaginas = Math.ceil(pesagensFiltradas.length / itensPorPagina)
  const indiceInicio = (paginaAtual - 1) * itensPorPagina
  const indiceFim = indiceInicio + itensPorPagina
  const pesagensPaginadas = pesagensFiltradas.slice(indiceInicio, indiceFim)

  // Resetar para página 1 quando filtros mudarem
  useEffect(() => {
    setPaginaAtual(1)
  }, [filtroAnimal, filtroData, filtroLote, filtroSexo, filtroLocal, filtroPesoMin, filtroPesoMax, filtroDataInicio, filtroDataFim])


  const extrairLocal = (obs) => {
    if (!obs || typeof obs !== 'string') return 'Não informado'
    const s = obs.trim()
    if (!s) return 'Não informado'
    // CONFINAÇÃO e variações normalizam para CONFINA
    const sNorm = s.replace(/CONFINAÇÃO/gi, 'CONFINA').replace(/CONFINACAO/gi, 'CONFINA')
    const m = sNorm.match(/(PIQUETE\s*\d+|PIQUETE\s*(CABANHA|CONF|GUARITA|PISTA)|PROJETO\s*[\dA-Za-z\-]+|LOTE\s*\d+|CONFINA\w*|GUARITA|CABANHA|PISTA\s*\d*)/i)
    if (m) {
      let loc = m[1].trim().toUpperCase().replace(/\s+/g, ' ')
      if (/^CONFINA/.test(loc)) loc = 'CONFINA'
      // PIQUETE X e PROJETO X → PROJETO X (agrupar mesmo local)
      if (/^PIQUETE\s+\d+$/.test(loc)) loc = loc.replace(/^PIQUETE\s+/i, 'PROJETO ')
      // Só retornar se for formato válido (evita NACION 15397, NERO DO MORRO, etc.)
      if (/^PIQUETE\s+(\d+|CABANHA|CONF|GUARITA|PISTA)$/i.test(loc) || /^PROJETO\s+[\dA-Za-z\-]+$/i.test(loc) || /^CONFINA$/i.test(loc) || /^(GUARITA|CABANHA|PISTA\s*\d*|CONF)$/i.test(loc)) return loc
    }
    return 'Não informado'
  }

  const resumoPorSexo = [
    { sexo: 'Macho', label: '♂️ Machos', dados: machos, cor: 'blue' },
    { sexo: 'Fêmea', label: '♀️ Fêmeas', dados: femeas, cor: 'pink' }
  ].map(({ sexo, label, dados, cor }) => {
    const pesosSexo = dados.map(p => parseFloat(p.peso)).filter(n => !isNaN(n))
    const cesSexo = dados.map(p => parseFloat(p.ce)).filter(n => !isNaN(n))
    return {
      sexo, label, dados, cor,
      qtde: dados.length,
      mediaPeso: pesosSexo.length ? (pesosSexo.reduce((a, b) => a + b, 0) / pesosSexo.length).toFixed(1) : '-',
      minPeso: pesosSexo.length ? Math.min(...pesosSexo).toFixed(1) : '-',
      maxPeso: pesosSexo.length ? Math.max(...pesosSexo).toFixed(1) : '-',
      mediaCE: cesSexo.length ? (cesSexo.reduce((a, b) => a + b, 0) / cesSexo.length).toFixed(1) : '-'
    }
  })

  // Local atual = da última pesagem de cada animal (bate com relatório Excel "Contagem de RGN")
  const porAnimalUltima = {}
  pesagens.forEach(p => {
    const aid = p.animal_id ?? p.animal ?? `f${(p.peso || 0)}-${p.data || ''}`
    const d = p.data || ''
    const prev = porAnimalUltima[aid]
    if (!prev || (d > (prev.data || '')) || (d === (prev.data || '') && (p.created_at || '') > (prev.created_at || ''))) {
      porAnimalUltima[aid] = p
    }
  })

  // Resumo por Lote
  const resumoPorLote = useMemo(() => {
    const lotes = {}
    pesagensFiltradas.forEach(p => {
      const lote = p.lote || 'Sem Lote'
      if (!lotes[lote]) {
        lotes[lote] = {
          lote,
          pesagens: [],
          machos: 0,
          femeas: 0,
          animaisUnicos: new Set()
        }
      }
      lotes[lote].pesagens.push(p)
      if (p.animal_sexo === 'Macho') lotes[lote].machos++
      if (p.animal_sexo === 'Fêmea') lotes[lote].femeas++
      if (p.animal_id) lotes[lote].animaisUnicos.add(p.animal_id)
    })

    return Object.values(lotes).map(l => {
      const pesos = l.pesagens.map(p => parseFloat(p.peso)).filter(n => !isNaN(n))
      const ces = l.pesagens.map(p => parseFloat(p.ce)).filter(n => !isNaN(n))
      return {
        lote: l.lote,
        qtde: l.pesagens.length,
        animaisUnicos: l.animaisUnicos.size,
        machos: l.machos,
        femeas: l.femeas,
        mediaPeso: pesos.length ? (pesos.reduce((a, b) => a + b, 0) / pesos.length).toFixed(1) : '-',
        minPeso: pesos.length ? Math.min(...pesos).toFixed(1) : '-',
        maxPeso: pesos.length ? Math.max(...pesos).toFixed(1) : '-',
        mediaCE: ces.length ? (ces.reduce((a, b) => a + b, 0) / ces.length).toFixed(1) : '-'
      }
    }).sort((a, b) => b.qtde - a.qtde) // Ordenar por quantidade
  }, [pesagensFiltradas])
  const porLocal = {}
  Object.values(porAnimalUltima).forEach(p => {
    const local = extrairLocal(p.observacoes)
    if (!porLocal[local]) porLocal[local] = []
    porLocal[local].push(p)
  })
  const resumoPorLocal = Object.entries(porLocal).map(([local, dados]) => {
    const animaisUnicos = new Set(dados.map(p => p.animal_id || p.animal || `${p.peso}-${p.data}`))
    const qtde = animaisUnicos.size
    const femeasLocal = dados.filter(p => p.animal_sexo === 'Fêmea')
    const machosLocal = dados.filter(p => p.animal_sexo === 'Macho')
    const animaisFemeas = new Set(femeasLocal.map(p => p.animal_id || p.animal))
    const animaisMachos = new Set(machosLocal.map(p => p.animal_id || p.animal))
    const pesosLocal = dados.map(p => parseFloat(p.peso)).filter(n => !isNaN(n))
    const cesLocal = dados.map(p => parseFloat(p.ce)).filter(n => !isNaN(n))
    return {
      local,
      dados,
      qtde,
      femeas: animaisFemeas.size,
      machos: animaisMachos.size,
      mediaPeso: pesosLocal.length ? (pesosLocal.reduce((a, b) => a + b, 0) / pesosLocal.length).toFixed(1) : '-',
      minPeso: pesosLocal.length ? Math.min(...pesosLocal).toFixed(1) : '-',
      maxPeso: pesosLocal.length ? Math.max(...pesosLocal).toFixed(1) : '-',
      mediaCE: cesLocal.length ? (cesLocal.reduce((a, b) => a + b, 0) / cesLocal.length).toFixed(1) : '-'
    }
  }).sort((a, b) => b.qtde - a.qtde)

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ImportProgressOverlay
        importando={importandoPesagens}
        progress={importProgressPesagens}
      />
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .pesagem-card {
          animation: fadeIn 0.3s ease-out;
        }
        .filter-section {
          animation: slideIn 0.3s ease-out;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ScaleIcon className="w-8 h-8 text-amber-600" />
            Pesagem
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Controle de peso dos animais</p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
            id="excel-upload"
          />
          <label
            htmlFor="excel-upload"
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
          >
            <DocumentArrowUpIcon className="w-5 h-5" />
            Importar Excel
          </label>
          <button
            onClick={() => setShowImportTextModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <DocumentTextIcon className="w-5 h-5" />
            Importar Texto
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Nova Pesagem
          </button>
          {pesagens.length > 0 && (
            <>
              <button
                onClick={async () => {
                  if (!confirm('Atualizar o campo Peso nas fichas de todos os animais com a última pesagem?')) return
                  try {
                    const r = await fetch('/api/pesagens/sync-animais', { method: 'POST' })
                    const d = await r.json()
                    alert(d.success ? `✅ ${d.atualizados || 0} animais tiveram o peso atualizado na ficha.` : '❌ ' + (d.error || 'Erro'))
                  } catch (e) {
                    alert('❌ Erro ao sincronizar')
                  }
                }}
                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                title="Atualiza o campo Peso na ficha de cada animal com a última pesagem"
              >
                <ArrowPathIcon className="w-5 h-5" />
                Sincronizar Pesos
              </button>
              <button
                onClick={async () => {
                  const ano = new Date().getFullYear()
                  if (!confirm(`Aplicar localizações das pesagens de FEVEREIRO/${ano}?\n\nAnimais sem localização atual receberão o local informado na observação da pesagem.`)) return
                  try {
                    const r = await fetch('/api/pesagens/aplicar-localizacoes', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ mes: 2, ano })
                    })
                    const d = await r.json().catch(() => ({}))
                    if (d.success) alert(d.mensagem || `✅ ${d.aplicados} localização(ões) aplicada(s)`)
                    else alert('❌ ' + (d.error || 'Erro ao aplicar'))
                  } catch (e) {
                    alert('❌ Erro: ' + e.message)
                  }
                }}
                className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
                title="Aplica localização a partir das pesagens de fevereiro (mês 02)"
              >
                <MapPinIcon className="w-5 h-5" />
                Aplicar do mês 02
              </button>
              <button
                onClick={async () => {
                  if (!confirm('Aplicar localização (piquete/local) para todos os animais usando a última pesagem com observação?')) return
                  try {
                    const porAnimal = {}
                    pesagens.forEach(p => {
                      const aid = p.animal_id
                      if (!aid) return
                      const d = p.data || ''
                      const prev = porAnimal[aid]
                      if (!prev || (d > (prev.data || '')) || (d === (prev.data || '') && (p.updatedAt || p.createdAt || '') > (prev.updatedAt || prev.createdAt || ''))) {
                        porAnimal[aid] = p
                      }
                    })
                    
                    const requests = []
                    const validos = []
                    
                    for (const [aid, p] of Object.entries(porAnimal)) {
                      const local = extrairLocal(p.observacoes)
                      if (!local || local.toUpperCase() === 'NÃO INFORMADO' || local === '-') continue
                      
                      const body = {
                        animal_id: Number(aid),
                        piquete: local,
                        data_entrada: p.data || new Date().toISOString().split('T')[0],
                        motivo_movimentacao: 'Importado da Pesagem',
                        observacoes: p.observacoes || null,
                        usuario_responsavel: 'Sistema'
                      }
                      
                      validos.push(body)
                      requests.push(
                        fetch('/api/localizacoes', { 
                          method: 'POST', 
                          headers: { 'Content-Type': 'application/json' }, 
                          body: JSON.stringify(body) 
                        }).then(r => r.ok).catch(() => false)
                      )
                    }
                    
                    const results = await Promise.all(requests)
                    const aplicados = results.filter(r => r === true).length
                    const ignorados = Object.keys(porAnimal).length - validos.length + results.filter(r => r === false).length
                    
                    alert(`✅ Localização aplicada para ${aplicados} animal(is)\nℹ️ ${ignorados} sem observação/local válido ou com erro`)
                  } catch (e) {
                    alert('❌ Erro ao aplicar localizações: ' + e.message)
                  }
                }}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                title="Atualiza localização dos animais a partir da observação das pesagens"
              >
                <MapPinIcon className="w-5 h-5" />
                Aplicar Localizações
              </button>
              <button
                onClick={handleExcluirTodas}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                title="Excluir todas as pesagens"
              >
                <XMarkIcon className="w-5 h-5" />
                Excluir Todas
              </button>
            </>
          )}
        </div>
      </div>

      {/* Estatísticas */}
      {pesagens.length > 0 && (
        <>
          {/* Barra de Controles de Visualização */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Visualização:</span>
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    viewMode === 'table'
                      ? 'bg-amber-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Tabela
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    viewMode === 'cards'
                      ? 'bg-amber-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Cards
                </button>
                <button
                  onClick={() => setViewMode('charts')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    viewMode === 'charts'
                      ? 'bg-amber-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Gráficos
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  showAdvancedFilters
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <FunnelIcon className="w-4 h-4" />
                Filtros Avançados
              </button>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="data">Ordenar por Data</option>
                <option value="peso">Ordenar por Peso</option>
                <option value="animal">Ordenar por Animal</option>
                <option value="ce">Ordenar por CE</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title={sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          {/* Análise de Tendências */}
          {analiseTendencias && (
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 text-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <SparklesIcon className="w-6 h-6" />
                  <h3 className="text-lg font-bold">Análise de Tendências</h3>
                </div>
                {analiseTendencias.tendencia === 'crescente' ? (
                  <ArrowTrendingUpIcon className="w-8 h-8 text-green-300" />
                ) : analiseTendencias.tendencia === 'decrescente' ? (
                  <ArrowTrendingDownIcon className="w-8 h-8 text-red-300" />
                ) : (
                  <div className="w-8 h-8 flex items-center justify-center text-yellow-300 text-2xl">→</div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-sm opacity-90">Primeira Metade</div>
                  <div className="text-2xl font-bold">{analiseTendencias.mediaPrimeira} kg</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-sm opacity-90">Segunda Metade</div>
                  <div className="text-2xl font-bold">{analiseTendencias.mediaSegunda} kg</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-sm opacity-90">Variação</div>
                  <div className="text-2xl font-bold">
                    {analiseTendencias.tendencia === 'crescente' ? '+' : analiseTendencias.tendencia === 'decrescente' ? '-' : ''}
                    {analiseTendencias.valor} kg ({analiseTendencias.percentual}%)
                  </div>
                </div>
              </div>
              
              <p className="mt-4 text-sm opacity-90">
                {analiseTendencias.tendencia === 'crescente' && '📈 Tendência positiva! O rebanho está ganhando peso ao longo do tempo.'}
                {analiseTendencias.tendencia === 'decrescente' && '📉 Atenção: O rebanho está perdendo peso. Verifique nutrição e saúde.'}
                {analiseTendencias.tendencia === 'estável' && '➡️ Peso estável ao longo do período analisado.'}
              </p>
            </div>
          )}

          {/* Comparação de Períodos */}
          <div className="bg-gradient-to-br from-cyan-600 to-cyan-700 text-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <CalendarIcon className="w-6 h-6" />
              <h3 className="text-lg font-bold">Comparação de Períodos</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-sm opacity-90">Últimos 30 Dias</div>
                <div className="text-2xl font-bold">{comparacaoPeriodos.ultimos30.qtd} pesagens</div>
                <div className="text-lg mt-1">Média: {comparacaoPeriodos.ultimos30.media} kg</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-sm opacity-90">30-60 Dias Atrás</div>
                <div className="text-2xl font-bold">{comparacaoPeriodos.anteriores30.qtd} pesagens</div>
                <div className="text-lg mt-1">Média: {comparacaoPeriodos.anteriores30.media} kg</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-sm opacity-90">Diferença</div>
                <div className={`text-2xl font-bold ${
                  parseFloat(comparacaoPeriodos.diferenca) > 0 ? 'text-green-300' : 
                  parseFloat(comparacaoPeriodos.diferenca) < 0 ? 'text-red-300' : 'text-yellow-300'
                }`}>
                  {parseFloat(comparacaoPeriodos.diferenca) > 0 ? '+' : ''}
                  {comparacaoPeriodos.diferenca} kg
                </div>
              </div>
            </div>
          </div>

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="bg-gradient-to-br from-slate-600 to-slate-700 text-white p-4 rounded-lg shadow">
              <div className="text-xs opacity-90">Total {estatisticas.total !== estatisticas.totalGeral && `(${estatisticas.totalGeral})`}</div>
              <div className="text-2xl font-bold">{estatisticas.total}</div>
            </div>
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-4 rounded-lg shadow">
            <div className="text-xs opacity-90">Peso Médio</div>
            <div className="text-2xl font-bold">{estatisticas.pesoMedio} kg</div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 rounded-lg shadow">
            <div className="text-xs opacity-90">Peso Mín</div>
            <div className="text-2xl font-bold">{estatisticas.pesoMin} kg</div>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-4 rounded-lg shadow">
            <div className="text-xs opacity-90">Peso Máx</div>
            <div className="text-2xl font-bold">{estatisticas.pesoMax} kg</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-lg shadow">
            <div className="text-xs opacity-90">♂️ Machos</div>
            <div className="text-2xl font-bold">{estatisticas.machos}</div>
            {estatisticas.mediaMachos !== '-' && <div className="text-xs opacity-80">média {estatisticas.mediaMachos} kg</div>}
          </div>
          <div className="bg-gradient-to-br from-pink-500 to-pink-600 text-white p-4 rounded-lg shadow">
            <div className="text-xs opacity-90">♀️ Fêmeas</div>
            <div className="text-2xl font-bold">{estatisticas.femeas}</div>
            {estatisticas.mediaFemeas !== '-' && <div className="text-xs opacity-80">média {estatisticas.mediaFemeas} kg</div>}
          </div>
          <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white p-4 rounded-lg shadow md:col-span-1">
            <div className="text-xs opacity-90">Animais Únicos</div>
            <div className="text-2xl font-bold">{estatisticas.animaisUnicos}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-lg shadow md:col-span-1">
            <div className="text-xs opacity-90">CE Médio</div>
            <div className="text-2xl font-bold">{estatisticas.ceMedio}{estatisticas.ceMedio !== '-' ? ' cm' : ''}</div>
          </div>
        </div>
        </>
      )}

      {/* Resumo Detalhado */}
      {pesagens.length > 0 && (
        <div className="rounded-lg shadow overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
          <div className="bg-amber-500/90 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChartBarIcon className="w-6 h-6 text-white" />
              <h2 className="font-semibold text-white">Resumo Detalhado das Pesagens</h2>
            </div>
            <a
              href="/manejo/resumo-pesagens"
              className="text-sm text-white/90 hover:text-white underline"
            >
              Ver resumo completo
            </a>
          </div>
          <div className="p-4 space-y-6 text-white">
            <div>
              <h3 className="text-sm font-medium text-white mb-2 opacity-95">Por Sexo</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left py-2 pr-4 font-medium text-white">Sexo</th>
                      <th className="text-right py-2 px-2 font-medium text-white">Qtde</th>
                      <th className="text-right py-2 px-2 font-medium text-white">Média Peso</th>
                      <th className="text-right py-2 px-2 font-medium text-white">Peso Mín</th>
                      <th className="text-right py-2 px-2 font-medium text-white">Peso Máx</th>
                      <th className="text-right py-2 px-2 font-medium text-white">Média CE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumoPorSexo.map((r, i) => (
                      <tr key={i} className="border-b border-white/10">
                        <td className="py-2 pr-4 font-medium text-white">{r.label}</td>
                        <td className="text-right px-2 text-white">{r.qtde}</td>
                        <td className="text-right px-2 text-white">{r.mediaPeso}{r.mediaPeso !== '-' ? ' kg' : ''}</td>
                        <td className="text-right px-2 text-white">{r.minPeso}{r.minPeso !== '-' ? ' kg' : ''}</td>
                        <td className="text-right px-2 text-white">{r.maxPeso}{r.maxPeso !== '-' ? ' kg' : ''}</td>
                        <td className="text-right px-2 text-white">{r.mediaCE}{r.mediaCE !== '-' ? ' cm' : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Resumo por Lote - Card Compacto */}
            {resumoPorLote.length > 1 && (
              <div>
                <h3 className="text-sm font-medium text-white mb-3 opacity-95 flex items-center gap-2">
                  <span>📦 Lotes de Pesagem</span>
                  <span className="text-xs bg-purple-600/50 px-2 py-0.5 rounded-full">{resumoPorLote.length} lotes</span>
                </h3>
                
                {/* Cards de Lotes */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {resumoPorLote.map((r, i) => (
                    <div 
                      key={i}
                      className={`bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-lg p-4 hover:border-purple-400/50 transition-all cursor-pointer ${
                        r.lote === 'Sem Lote' ? 'opacity-60' : ''
                      }`}
                      onClick={() => {
                        if (r.lote !== 'Sem Lote') {
                          setFiltroLote(r.lote)
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }
                      }}
                      title={r.lote !== 'Sem Lote' ? 'Clique para filtrar por este lote' : 'Pesagens sem lote definido'}
                    >
                      {/* Cabeçalho do Card */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {r.lote !== 'Sem Lote' && <span className="text-lg">📦</span>}
                            <h4 className={`font-semibold text-white text-sm ${r.lote === 'Sem Lote' ? 'italic' : ''}`}>
                              {r.lote}
                            </h4>
                          </div>
                          <div className="text-xs text-purple-300">
                            {r.qtde} pesagens • {r.animaisUnicos} animais
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-white">{r.mediaPeso}</div>
                          <div className="text-xs text-purple-300">kg médio</div>
                        </div>
                      </div>
                      
                      {/* Estatísticas Rápidas */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-blue-500/20 rounded px-2 py-1">
                          <div className="text-blue-300">♂️ Machos</div>
                          <div className="text-white font-semibold">{r.machos}</div>
                        </div>
                        <div className="bg-pink-500/20 rounded px-2 py-1">
                          <div className="text-pink-300">♀️ Fêmeas</div>
                          <div className="text-white font-semibold">{r.femeas}</div>
                        </div>
                        <div className="bg-orange-500/20 rounded px-2 py-1">
                          <div className="text-orange-300">Mín</div>
                          <div className="text-white font-semibold">{r.minPeso} kg</div>
                        </div>
                        <div className="bg-green-500/20 rounded px-2 py-1">
                          <div className="text-green-300">Máx</div>
                          <div className="text-white font-semibold">{r.maxPeso} kg</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <p className="text-xs text-white/70 mt-3">💡 Clique em um lote para filtrar as pesagens. Use o campo "Lote" ao cadastrar para agrupar pesagens.</p>
              </div>
            )}
            
            {resumoPorLocal.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-white opacity-95 flex items-center gap-2">
                    <span>📍 Piquetes / Locais</span>
                    <span className="text-xs bg-emerald-600/50 px-2 py-0.5 rounded-full">{resumoPorLocal.length} locais</span>
                  </h3>
                  <button
                    className="text-xs px-3 py-1 rounded bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                    onClick={() => exportResumoPorLocalCSV(resumoPorLocal)}
                    title="Exportar resumo por piquete em CSV"
                  >
                    📊 Exportar CSV
                  </button>
                </div>
                
                {/* Cards de Piquetes */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {resumoPorLocal.slice(0, 12).map((r, i) => (
                    <div
                      key={i}
                      className="bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 border border-emerald-500/30 rounded-lg p-3 hover:border-emerald-400/50 transition-all cursor-pointer"
                      onClick={() => {
                        setSelectedLocalDados({ local: r.local, dados: r.dados })
                        setShowLocalModal(true)
                      }}
                      title="Clique para ver os animais deste local"
                    >
                      {/* Cabeçalho */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-base">📍</span>
                            <h4 className="font-semibold text-white text-sm truncate">{r.local}</h4>
                          </div>
                          <div className="text-xs text-emerald-300">
                            {r.qtde} animais
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-white">{r.mediaPeso}</div>
                          <div className="text-xs text-emerald-300">kg</div>
                        </div>
                      </div>
                      
                      {/* Estatísticas */}
                      <div className="flex gap-2 text-xs">
                        <div className="flex-1 bg-pink-500/20 rounded px-2 py-1 text-center">
                          <div className="text-pink-300">♀️</div>
                          <div className="text-white font-semibold">{r.femeas ?? 0}</div>
                        </div>
                        <div className="flex-1 bg-blue-500/20 rounded px-2 py-1 text-center">
                          <div className="text-blue-300">♂️</div>
                          <div className="text-white font-semibold">{r.machos ?? 0}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {resumoPorLocal.length > 12 && (
                  <div className="mt-3 text-center">
                    <button
                      className="text-xs text-white/70 hover:text-white underline"
                      onClick={() => {
                        // Mostrar todos em modal ou expandir
                        alert(`Mostrando ${resumoPorLocal.length} locais. Use os filtros para refinar a busca.`)
                      }}
                    >
                      Ver todos os {resumoPorLocal.length} locais
                    </button>
                  </div>
                )}
                
                <p className="text-xs text-white/70 mt-3">💡 Clique em um piquete para ver a lista de animais. Total = animais distintos por local.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filtros */}
      {pesagens.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-3">
            <FunnelIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Filtros</h3>
          </div>
          
          {/* Filtros Básicos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Buscar Animal
              </label>
              <input
                type="text"
                value={filtroAnimal}
                onChange={(e) => setFiltroAnimal(e.target.value)}
                placeholder="Digite série ou RG..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filtrar por Data
              </label>
              <input
                type="date"
                value={filtroData}
                onChange={(e) => setFiltroData(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                📦 Filtrar por Lote
              </label>
              <input
                type="text"
                value={filtroLote}
                onChange={(e) => setFiltroLote(e.target.value)}
                placeholder="Ex: ABCZ Fev 2026..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          
          {/* Filtros Avançados */}
          {showAdvancedFilters && (
            <div className="filter-section mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Filtros Avançados</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sexo
                  </label>
                  <select
                    value={filtroSexo}
                    onChange={(e) => setFiltroSexo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Todos</option>
                    <option value="Macho">Macho</option>
                    <option value="Fêmea">Fêmea</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Local/Piquete
                  </label>
                  <input
                    type="text"
                    value={filtroLocal}
                    onChange={(e) => setFiltroLocal(e.target.value)}
                    placeholder="Ex: PIQUETE 10"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Peso Mínimo (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={filtroPesoMin}
                    onChange={(e) => setFiltroPesoMin(e.target.value)}
                    placeholder="Ex: 200"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Peso Máximo (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={filtroPesoMax}
                    onChange={(e) => setFiltroPesoMax(e.target.value)}
                    placeholder="Ex: 500"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Data Início
                  </label>
                  <input
                    type="date"
                    value={filtroDataInicio}
                    onChange={(e) => setFiltroDataInicio(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Data Fim
                  </label>
                  <input
                    type="date"
                    value={filtroDataFim}
                    onChange={(e) => setFiltroDataFim(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}
          
          {(filtroAnimal || filtroData || filtroSexo || filtroLocal || filtroPesoMin || filtroPesoMax || filtroDataInicio || filtroDataFim) && (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Mostrando {pesagensFiltradas.length} de {pesagens.length} pesagens
              </span>
              <button
                onClick={() => {
                  setFiltroAnimal('')
                  setFiltroData('')
                  setFiltroSexo('')
                  setFiltroLocal('')
                  setFiltroPesoMin('')
                  setFiltroPesoMax('')
                  setFiltroDataInicio('')
                  setFiltroDataFim('')
                }}
                className="text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400"
              >
                Limpar todos os filtros
              </button>
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Carregando dados...</div>
        </div>
      ) : pesagens.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-12 text-center">
          <ScaleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Nenhuma pesagem registrada
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Comece registrando a primeira pesagem
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700"
          >
            <PlusIcon className="w-5 h-5" />
            Adicionar Pesagem
          </button>
        </div>
      ) : (
        <>
          {/* Visualização em Cards */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pesagensFiltradas.map((item, index) => (
                <div
                  key={`card-${index}-${item.animal_id}-${item.data}`}
                  className="pesagem-card bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className={`h-2 ${
                    item.animal_sexo === 'Macho' ? 'bg-blue-500' : 'bg-pink-500'
                  }`} />
                  
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                          {item.animal || '-'}
                        </h3>
                        {item.animal_sexo && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                            item.animal_sexo === 'Macho' 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                              : 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300'
                          }`}>
                            {item.animal_sexo === 'Macho' ? '♂️ Macho' : '♀️ Fêmea'}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setSelectedAnimalForHistory(item.animal_id)
                            setShowHistoryModal(true)
                          }}
                          className="p-2 text-purple-600 hover:bg-purple-100 dark:text-purple-400 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                          title="Ver histórico"
                        >
                          <ChartBarIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Peso:</span>
                        <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                          {item.peso != null && !isNaN(Number(item.peso)) ? Number(item.peso) : '-'} kg
                        </span>
                      </div>
                      
                      {item.ce != null && item.ce !== '' && !isNaN(parseFloat(item.ce)) && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">CE:</span>
                          <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                            {parseFloat(item.ce)} cm
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Data:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {(() => {
                            const d = item.data
                            if (!d) return '-'
                            const dt = typeof d === 'string' && d.length >= 10
                              ? new Date(d.slice(0, 10) + 'T00:00:00')
                              : new Date(d)
                            return !isNaN(dt.getTime()) ? dt.toLocaleDateString('pt-BR') : '-'
                          })()}
                        </span>
                      </div>
                      
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-xs text-gray-600 dark:text-gray-400">Local:</span>
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                            {extrairLocal(item.observacoes)}
                          </span>
                        </div>
                      </div>
                      
                      {item.observacoes && (
                        <div className="pt-2">
                          <span className="text-xs text-gray-600 dark:text-gray-400">Observações:</span>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 line-clamp-2">
                            {item.observacoes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Visualização em Gráficos */}
          {viewMode === 'charts' && (
            <div className="space-y-6">
              {/* Distribuição de Peso */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Distribuição de Peso
                </h3>
                <div className="space-y-3">
                  {(() => {
                    const ranges = [
                      { label: '0-200 kg', min: 0, max: 200, color: 'bg-red-500' },
                      { label: '200-300 kg', min: 200, max: 300, color: 'bg-orange-500' },
                      { label: '300-400 kg', min: 300, max: 400, color: 'bg-yellow-500' },
                      { label: '400-500 kg', min: 400, max: 500, color: 'bg-green-500' },
                      { label: '500+ kg', min: 500, max: Infinity, color: 'bg-blue-500' }
                    ]
                    
                    const total = pesagensFiltradas.length
                    
                    return ranges.map((range, idx) => {
                      const count = pesagensFiltradas.filter(p => {
                        const peso = parseFloat(p.peso)
                        return peso >= range.min && peso < range.max
                      }).length
                      
                      const percentage = total > 0 ? (count / total * 100).toFixed(1) : 0
                      
                      return (
                        <div key={idx}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-700 dark:text-gray-300">{range.label}</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {count} ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                            <div
                              className={`${range.color} h-3 rounded-full transition-all duration-500`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>

              {/* Top 10 Animais Mais Pesados */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  🏆 Top 10 Animais Mais Pesados
                </h3>
                <div className="space-y-2">
                  {[...pesagensFiltradas]
                    .sort((a, b) => parseFloat(b.peso || 0) - parseFloat(a.peso || 0))
                    .slice(0, 10)
                    .map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedAnimalForHistory(item.animal_id)
                          setShowHistoryModal(true)
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-white ${
                            idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-600' : 'bg-gray-500'
                          }`}>
                            {idx + 1}
                          </span>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {item.animal}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {item.animal_sexo} • {extrairLocal(item.observacoes)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                            {item.peso} kg
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Evolução Temporal */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  📈 Evolução Temporal (Últimas 30 Pesagens)
                </h3>
                <div className="h-64 flex items-end justify-between gap-1">
                  {[...pesagensFiltradas]
                    .sort((a, b) => (a.data || '').localeCompare(b.data || ''))
                    .slice(-30)
                    .map((item, idx) => {
                      const maxPeso = Math.max(...pesagensFiltradas.map(p => parseFloat(p.peso || 0)))
                      const height = (parseFloat(item.peso || 0) / maxPeso) * 100
                      
                      return (
                        <div
                          key={idx}
                          className="flex-1 flex flex-col items-center group relative"
                        >
                          <div
                            className="w-full bg-gradient-to-t from-amber-600 to-amber-400 rounded-t hover:from-amber-700 hover:to-amber-500 transition-all cursor-pointer"
                            style={{ height: `${height}%` }}
                            title={`${item.animal}: ${item.peso} kg em ${new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR')}`}
                          />
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            {item.peso} kg
                          </div>
                        </div>
                      )
                    })}
                </div>
                <div className="mt-4 text-center text-xs text-gray-600 dark:text-gray-400">
                  Últimas 30 pesagens ordenadas por data
                </div>
              </div>
            </div>
          )}

          {/* Visualização em Tabela */}
          {viewMode === 'table' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-amber-500 to-amber-600 text-white">
                  <th className="px-6 py-3 text-left text-sm font-semibold">Animal</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Peso (kg)</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">CE (cm)</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Data</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">📦 Lote</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Local</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Observações</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pesagensPaginadas.map((item, index) => (
                  <tr 
                    key={`pes-${index}-${item.animal_id}-${item.data || ''}-${item.peso || ''}`}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-amber-50 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-800"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">
                      <div>
                        <div className="font-semibold">{item.animal || '-'}</div>
                        {item.animal_sexo && (
                          <div className="text-xs mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              item.animal_sexo === 'Macho' 
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                : 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300'
                            }`}>
                              {item.animal_sexo === 'Macho' ? '♂️ Macho' : '♀️ Fêmea'}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                        {item.peso != null && item.peso !== '' && !isNaN(Number(item.peso)) ? Number(item.peso) : '-'} kg
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {item.ce != null && item.ce !== '' && !isNaN(parseFloat(item.ce)) ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          {parseFloat(item.ce)} cm
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {(() => {
                        const d = item.data
                        if (!d) return '-'
                        const dt = typeof d === 'string' && d.length >= 10
                          ? new Date(d.slice(0, 10) + 'T00:00:00')
                          : new Date(d)
                        return !isNaN(dt.getTime()) ? dt.toLocaleDateString('pt-BR') : (typeof d === 'string' ? d : '-')
                      })()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {item.lote ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                          📦 {item.lote}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                        {extrairLocal(item.observacoes)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs">
                      <div className="truncate" title={typeof item.observacoes === 'string' ? item.observacoes : ''}>
                        {typeof item.observacoes === 'string' ? item.observacoes : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedAnimalForHistory(item.animal_id)
                          setShowHistoryModal(true)
                        }}
                        className="p-2 text-purple-600 hover:bg-purple-100 dark:text-purple-400 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                        title="Ver histórico de pesagens"
                      >
                        <ChartBarIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="Editar pesagem"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Excluir pesagem"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Controles de Paginação */}
          {pesagensFiltradas.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Mostrando <span className="font-semibold">{indiceInicio + 1}</span> a{' '}
                  <span className="font-semibold">{Math.min(indiceFim, pesagensFiltradas.length)}</span> de{' '}
                  <span className="font-semibold">{pesagensFiltradas.length}</span> pesagens
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700 dark:text-gray-300">Por página:</label>
                  <select
                    value={itensPorPagina}
                    onChange={(e) => {
                      setItensPorPagina(Number(e.target.value))
                      setPaginaAtual(1)
                    }}
                    className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPaginaAtual(1)}
                  disabled={paginaAtual === 1}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
                  title="Primeira página"
                >
                  ««
                </button>
                <button
                  onClick={() => setPaginaAtual(prev => Math.max(1, prev - 1))}
                  disabled={paginaAtual === 1}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
                  title="Página anterior"
                >
                  «
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                    let pageNum
                    if (totalPaginas <= 5) {
                      pageNum = i + 1
                    } else if (paginaAtual <= 3) {
                      pageNum = i + 1
                    } else if (paginaAtual >= totalPaginas - 2) {
                      pageNum = totalPaginas - 4 + i
                    } else {
                      pageNum = paginaAtual - 2 + i
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPaginaAtual(pageNum)}
                        className={`px-3 py-1 text-sm border rounded ${
                          paginaAtual === pageNum
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
                
                <button
                  onClick={() => setPaginaAtual(prev => Math.min(totalPaginas, prev + 1))}
                  disabled={paginaAtual === totalPaginas}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
                  title="Próxima página"
                >
                  »
                </button>
                <button
                  onClick={() => setPaginaAtual(totalPaginas)}
                  disabled={paginaAtual === totalPaginas}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
                  title="Última página"
                >
                  »»
                </button>
              </div>
            </div>
          )}
          
          {pesagensFiltradas.length === 0 && pesagens.length > 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Nenhuma pesagem encontrada com os filtros aplicados
            </div>
          )}
        </div>
          )}
        </>
      )}

      {/* Modal do Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingItem ? 'Editar Pesagem' : 'Nova Pesagem'}
              </h2>
              <button
                onClick={handleCloseForm}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Animal *
                </label>
                <div className="relative">
                  <select
                    value={formData.animal_id}
                    onChange={(e) => {
                      const animalId = e.target.value
                      const animal = animais.find(a => a.id == animalId)
                      setFormData({ ...formData, animal_id: animalId })
                      setSelectedAnimal(animal)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Selecione um animal...</option>
                    {animais.map((animal) => (
                      <option key={animal.id} value={animal.id}>
                        {animal.serie} - {animal.rg} ({animal.sexo}) - {animal.raca}
                      </option>
                    ))}
                  </select>
                  <MagnifyingGlassIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                {selectedAnimal && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                    <strong>{selectedAnimal.serie} - {selectedAnimal.rg}</strong><br />
                    {selectedAnimal.sexo === 'Macho' ? '♂️' : '♀️'} {selectedAnimal.sexo} • {selectedAnimal.raca}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Peso (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.peso}
                    onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Ex: 450.5"
                    required
                  />
                </div>

                {selectedAnimal && selectedAnimal.sexo === 'Macho' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      CE - Circunferência Escrotal (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.ce}
                      onChange={(e) => setFormData({ ...formData, ce: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Ex: 32.5"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data da Pesagem
                </label>
                <input
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  📦 Lote de Pesagem
                </label>
                <input
                  type="text"
                  value={formData.lote || ''}
                  onChange={(e) => setFormData({ ...formData, lote: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: Lote de Pesagens ABCZ Fev 2026"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Identifique este grupo de pesagens para facilitar relatórios futuros
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Observações
                </label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                  rows="3"
                  placeholder="Observações sobre a pesagem..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 text-white py-2 px-4 rounded-lg hover:bg-amber-700 transition-colors"
                >
                  {editingItem ? 'Atualizar' : 'Salvar'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Importação Excel */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Importar Pesagens do Excel
              </h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                  📋 Instruções de Importação
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                  <li>• Selecione as colunas correspondentes do seu Excel</li>
                <li>• Identificação (Animal ou RG/PGN) e Peso são obrigatórios</li>
                  <li>• CE só para machos</li>
                  <li>• Os animais devem estar cadastrados no sistema</li>
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Coluna do Animal (opcional)
                  </label>
                  <select
                    value={columnMapping.animal}
                    onChange={(e) => setColumnMapping({ ...columnMapping, animal: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Selecione a coluna...</option>
                    {availableColumns.map((col, index) => (
                      <option key={index} value={col}>{col}</option>
                    ))}
                  </select>
                </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Coluna da Série (opcional)
                </label>
                <select
                  value={columnMapping.serie}
                  onChange={(e) => setColumnMapping({ ...columnMapping, serie: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Selecione a coluna...</option>
                  {availableColumns.map((col, index) => (
                    <option key={index} value={col}>{col}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Coluna do RG (RGN) (opcional)
                </label>
                <select
                  value={columnMapping.rg}
                  onChange={(e) => setColumnMapping({ ...columnMapping, rg: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Selecione a coluna...</option>
                  {availableColumns.map((col, index) => (
                    <option key={index} value={col}>{col}</option>
                  ))}
                </select>
              </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Coluna do Peso *
                  </label>
                  <select
                    value={columnMapping.peso}
                    onChange={(e) => setColumnMapping({ ...columnMapping, peso: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Selecione a coluna...</option>
                    {availableColumns.map((col, index) => (
                      <option key={index} value={col}>{col}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Coluna da CE (opcional)
                  </label>
                  <select
                    value={columnMapping.ce}
                    onChange={(e) => setColumnMapping({ ...columnMapping, ce: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Selecione a coluna...</option>
                    {availableColumns.map((col, index) => (
                      <option key={index} value={col}>{col}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Coluna da Data (opcional)
                  </label>
                  <select
                    value={columnMapping.data}
                    onChange={(e) => setColumnMapping({ ...columnMapping, data: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Selecione a coluna...</option>
                    {availableColumns.map((col, index) => (
                      <option key={index} value={col}>{col}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Coluna das Observações (opcional)
                  </label>
                  <select
                    value={columnMapping.observacoes}
                    onChange={(e) => setColumnMapping({ ...columnMapping, observacoes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Selecione a coluna...</option>
                    {availableColumns.map((col, index) => (
                      <option key={index} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Coluna do Local (opcional)
                </label>
                <select
                  value={columnMapping.local}
                  onChange={(e) => setColumnMapping({ ...columnMapping, local: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Selecione a coluna...</option>
                  {availableColumns.map((col, index) => (
                    <option key={index} value={col}>{col}</option>
                  ))}
                </select>
              </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Coluna do Sexo (opcional)
                  </label>
                  <select
                    value={columnMapping.sexo}
                    onChange={(e) => setColumnMapping({ ...columnMapping, sexo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Selecione a coluna...</option>
                    {availableColumns.map((col, index) => (
                      <option key={index} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              </div>

              {importData.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Preview dos Dados ({importData.length} linhas)
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-300 dark:border-gray-600">
                          {availableColumns.map((col, index) => (
                            <th key={index} className="text-left p-2 font-medium">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importData.slice(0, 3).map((row, index) => (
                          <tr key={index} className="border-b border-gray-200 dark:border-gray-600">
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex} className="p-2">
                                {cell || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {importData.length > 3 && (
                      <p className="text-xs text-gray-500 mt-2">
                        ... e mais {importData.length - 3} linhas
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleImport}
                  disabled={
                    !columnMapping.peso ||
                    !(
                      columnMapping.animal ||
                      columnMapping.rg ||
                      (columnMapping.serie && columnMapping.rg)
                    )
                  }
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Importar Pesagens
                </button>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importação por Texto */}
      {showImportTextModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                Importar Pesagens por Texto
              </h2>
              <button
                onClick={() => setShowImportTextModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <ImportarTextoPesagens 
              animais={animais}
              onRefreshAnimais={loadAnimais}
              onImportComplete={(result) => {
                setShowImportTextModal(false)
                if (result?.importados > 0 && result?.pesagens?.length > 0) {
                  const existentes = JSON.parse(localStorage.getItem('pesagens') || '[]')
                  const chaves = new Set(existentes.map(p => `${p.animal_id}-${p.data}-${p.peso}`))
                  const novas = result.pesagens.slice(0, result.importados).filter(p => !chaves.has(`${p.animal_id}-${p.data}-${p.peso}`))
                  savePesagens([...existentes, ...novas])
                  setTimeout(() => { aplicarLocalizacoesAutomaticamente() }, 100)
                } else {
                  loadPesagens()
                  setTimeout(() => { aplicarLocalizacoesAutomaticamente() }, 100)
                }
              }}
            />
          </div>
        </div>
      )}
      
      {/* Relatório de Não Encontrados */}
      {showNotFoundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Linhas não cadastradas
              </h2>
              <button
                onClick={() => setShowNotFoundModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            {notFoundList.length === 0 ? (
              <p className="text-gray-700 dark:text-gray-300">Todas as linhas foram tratadas.</p>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {notFoundList.length} linha(s) não puderam ser cadastradas automaticamente. Ajuste a identificação (Série/RG) e tente novamente.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-300 dark:border-gray-600">
                        <th className="text-left p-2 font-medium">Linha</th>
                        <th className="text-left p-2 font-medium">Série</th>
                        <th className="text-left p-2 font-medium">RG</th>
                        <th className="text-left p-2 font-medium">Animal</th>
                        <th className="text-left p-2 font-medium">Motivo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notFoundList.map((n, idx) => (
                        <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                          <td className="p-2">{n.linha}</td>
                          <td className="p-2">{n.serie || '-'}</td>
                          <td className="p-2">{n.rg || '-'}</td>
                          <td className="p-2">{n.animal || '-'}</td>
                          <td className="p-2">{n.motivo || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      const header = 'Linha;Série;RG;Animal;Motivo'
                      const rows = notFoundList.map(n => [n.linha, n.serie || '', n.rg || '', n.animal || '', n.motivo || ''].join(';'))
                      const csv = [header, ...rows].join('\n')
                      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `nao-encontrados-pesagens-${new Date().toISOString().split('T')[0]}.csv`
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      URL.revokeObjectURL(url)
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Exportar CSV
                  </button>
                  <button
                    onClick={() => setShowNotFoundModal(false)}
                    className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Histórico do Animal */}
      {showHistoryModal && selectedAnimalForHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowHistoryModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ChartBarIcon className="w-6 h-6 text-purple-600" />
                Histórico de Pesagens
              </h2>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            {(() => {
              const history = getAnimalHistory(selectedAnimalForHistory)
              const animal = animais.find(a => a.id === selectedAnimalForHistory)
              
              if (history.length === 0) {
                return (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Nenhuma pesagem encontrada para este animal
                  </div>
                )
              }
              
              const pesoInicial = parseFloat(history[0].peso || 0)
              const pesoAtual = parseFloat(history[history.length - 1].peso || 0)
              const ganhoTotal = pesoAtual - pesoInicial
              const ganhoPercentual = pesoInicial > 0 ? ((ganhoTotal / pesoInicial) * 100).toFixed(1) : 0
              
              return (
                <>
                  <div className="mb-4 p-4 bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                      {animal ? `${animal.serie} - ${animal.rg}` : history[0].animal}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600 dark:text-gray-400">Peso Inicial</div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">{pesoInicial} kg</div>
                      </div>
                      <div>
                        <div className="text-gray-600 dark:text-gray-400">Peso Atual</div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">{pesoAtual} kg</div>
                      </div>
                      <div>
                        <div className="text-gray-600 dark:text-gray-400">Ganho Total</div>
                        <div className={`text-xl font-bold ${ganhoTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {ganhoTotal >= 0 ? '+' : ''}{ganhoTotal.toFixed(1)} kg
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600 dark:text-gray-400">Variação</div>
                        <div className={`text-xl font-bold ${ganhoTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {ganhoTotal >= 0 ? '+' : ''}{ganhoPercentual}%
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Gráfico de Evolução */}
                  <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Evolução do Peso</h4>
                    <div className="h-48 flex items-end justify-between gap-2">
                      {history.map((item, idx) => {
                        const maxPeso = Math.max(...history.map(h => parseFloat(h.peso || 0)))
                        const minPeso = Math.min(...history.map(h => parseFloat(h.peso || 0)))
                        const range = maxPeso - minPeso
                        const height = range > 0 ? ((parseFloat(item.peso || 0) - minPeso) / range) * 100 : 50
                        
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center group relative">
                            <div
                              className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t hover:from-purple-700 hover:to-purple-500 transition-all cursor-pointer"
                              style={{ height: `${Math.max(height, 10)}%` }}
                            />
                            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                              {item.peso} kg<br />
                              {new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 transform -rotate-45 origin-top-left whitespace-nowrap">
                              {new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  
                  {/* Tabela de Histórico */}
                  <div className="flex-1 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                        <tr>
                          <th className="text-left py-2 px-3 font-medium text-gray-900 dark:text-white">Data</th>
                          <th className="text-right py-2 px-3 font-medium text-gray-900 dark:text-white">Peso (kg)</th>
                          <th className="text-right py-2 px-3 font-medium text-gray-900 dark:text-white">Variação</th>
                          {history.some(h => h.ce) && (
                            <th className="text-right py-2 px-3 font-medium text-gray-900 dark:text-white">CE (cm)</th>
                          )}
                          <th className="text-left py-2 px-3 font-medium text-gray-900 dark:text-white">Local</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((item, idx) => {
                          const pesoAnterior = idx > 0 ? parseFloat(history[idx - 1].peso || 0) : 0
                          const pesoAtual = parseFloat(item.peso || 0)
                          const variacao = idx > 0 ? pesoAtual - pesoAnterior : 0
                          
                          return (
                            <tr key={idx} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <td className="py-2 px-3 text-gray-900 dark:text-white">
                                {new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                              </td>
                              <td className="text-right px-3 font-semibold text-gray-900 dark:text-white">
                                {item.peso}
                              </td>
                              <td className={`text-right px-3 font-medium ${
                                variacao > 0 ? 'text-green-600' : variacao < 0 ? 'text-red-600' : 'text-gray-500'
                              }`}>
                                {idx > 0 ? (variacao >= 0 ? '+' : '') + variacao.toFixed(1) : '-'}
                              </td>
                              {history.some(h => h.ce) && (
                                <td className="text-right px-3 text-gray-900 dark:text-white">
                                  {item.ce || '-'}
                                </td>
                              )}
                              <td className="px-3 text-gray-900 dark:text-white">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                                  {extrairLocal(item.observacoes)}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  <button
                    onClick={() => setShowHistoryModal(false)}
                    className="mt-4 w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Fechar
                  </button>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* Modal: Animais por Local */}
      {showLocalModal && selectedLocalDados && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowLocalModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Animais em {selectedLocalDados.local}
              </h2>
              <button
                onClick={() => setShowLocalModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <p className="text-sm text-gray-800 dark:text-white mb-3">
              {selectedLocalDados.dados.length} animal(is) com última pesagem neste local
            </p>
            <div className="overflow-y-auto flex-1 border border-gray-200 dark:border-gray-600 rounded-lg">
              <table className="w-full text-sm text-gray-900 dark:text-white">
                <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th className="text-left py-2 px-3 font-medium text-gray-900 dark:text-white">Animal</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-900 dark:text-white">Sexo</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-900 dark:text-white">Peso (kg)</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-900 dark:text-white">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedLocalDados.dados.map((p, idx) => (
                    <tr key={idx} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-2 px-3 font-medium text-gray-900 dark:text-white">{p.animal || `ID ${p.animal_id}`}</td>
                      <td className="text-right px-3 text-gray-900 dark:text-white">{p.animal_sexo || '-'}</td>
                      <td className="text-right px-3 text-gray-900 dark:text-white">{p.peso != null && !isNaN(Number(p.peso)) ? Number(p.peso) : '-'}</td>
                      <td className="text-right px-3 text-gray-900 dark:text-white">{p.data ? new Date(p.data + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={() => setShowLocalModal(false)}
              className="mt-4 w-full bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

