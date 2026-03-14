import React, { useState, useEffect } from 'react'
import { HeartIcon, PlusIcon, PencilIcon, XMarkIcon, CalendarIcon, UserIcon, ArrowDownTrayIcon, BeakerIcon } from '../../components/ui/Icons'
import { useDebouncedCallback } from '../../hooks/useDebounce'
import * as XLSX from 'xlsx'
import AlertasPartosAtrasados from '../../components/AlertasPartosAtrasados'

export default function TransferenciaEmbriones() {
  const [mounted, setMounted] = useState(false)
  const [transferencias, setTransferencias] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  // Estados para autocomplete
  const [doadoraOptions, setDoadoraOptions] = useState([])
  const [touroOptions, setTouroOptions] = useState([])
  const [loadingDoadora, setLoadingDoadora] = useState(false)
  const [loadingTouro, setLoadingTouro] = useState(false)

  // Dados comuns para o lote (Acasalamento/TE)
  const [formData, setFormData] = useState({
    doadora: '',
    touro: '',
    central: '',
    data: new Date().toISOString().split('T')[0],
    status: 'realizada',
    observacoes: ''
  })

  // Lista de receptoras para o lote
  const [recipients, setRecipients] = useState([])
  const [currentRecipient, setCurrentRecipient] = useState('')
  const [currentRecipientSex, setCurrentRecipientSex] = useState('ND') // 'M', 'F', or 'ND' (Não Determinado)

  // Receptora Autocomplete State
  const [receptoraOptions, setReceptoraOptions] = useState([])
  const [loadingReceptora, setLoadingReceptora] = useState(false)
  const [showReceptoraOptions, setShowReceptoraOptions] = useState(false)

  const [showDoadoraOptions, setShowDoadoraOptions] = useState(false)
  const [showTouroOptions, setShowTouroOptions] = useState(false)

  // Quick Registration State
  const [showQuickReg, setShowQuickReg] = useState(null) // 'doadora' or 'touro'
  const [quickRegData, setQuickRegData] = useState({ serie: '', rg: '', nome: '' })
  const [isRegistering, setIsRegistering] = useState(false)

  const handleQuickRegister = async (e) => {
    e.preventDefault()
    setIsRegistering(true)
    
    try {
      const sexo = showQuickReg === 'doadora' ? 'Fêmea' : 'Macho'
      const response = await fetch('/api/animals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...quickRegData,
          sexo,
          raca: 'Nelore', // Default
          boletim: 'Cadastro Rápido TE',
          pasto_atual: 'Indefinido'
        })
      })

      if (response.ok) {
        const newAnimal = await response.json()
        const animalName = newAnimal.data?.nome || quickRegData.nome
        
        if (showQuickReg === 'doadora') {
            setFormData(prev => ({ ...prev, doadora: animalName }))
            setDoadoraOptions([])
            setShowDoadoraOptions(false)
        } else {
            setFormData(prev => ({ ...prev, touro: animalName }))
            setTouroOptions([])
            setShowTouroOptions(false)
        }
        setShowQuickReg(null)
        setQuickRegData({ serie: '', rg: '', nome: '' })
        alert(`${showQuickReg === 'doadora' ? 'Doadora' : 'Touro'} cadastrado com sucesso!`)
      } else {
        const error = await response.json()
        alert(`Erro ao cadastrar: ${error.message}`)
      }
    } catch (error) {
      console.error('Erro no cadastro rápido:', error)
      alert('Erro ao realizar cadastro rápido')
    } finally {
      setIsRegistering(false)
    }
  }

  // Import State and Logic
  const [showImportModal, setShowImportModal] = useState(false)
  const [importData, setImportData] = useState([])
  const [isImporting, setIsImporting] = useState(false)
  const [selectedItems, setSelectedItems] = useState([])
  const [lastSelectedId, setLastSelectedId] = useState(null)
  const fileInputRef = React.useRef(null)

  const toggleSelectAll = () => {
    if (selectedItems.length === transferencias.length) {
        setSelectedItems([])
        setLastSelectedId(null)
    } else {
        setSelectedItems(transferencias.map(t => t.id))
    }
  }

  const toggleSelectItem = (id, event) => {
    // Shift+Click Selection Logic
    if (event && event.shiftKey && lastSelectedId !== null) {
        const start = transferencias.findIndex(t => t.id === lastSelectedId)
        const end = transferencias.findIndex(t => t.id === id)
        
        if (start !== -1 && end !== -1) {
            const low = Math.min(start, end)
            const high = Math.max(start, end)
            const range = transferencias.slice(low, high + 1).map(t => t.id)
            
            // Merge with existing selection, avoiding duplicates
            const newSelection = new Set([...selectedItems, ...range])
            setSelectedItems(Array.from(newSelection))
            setLastSelectedId(id)
            return
        }
    }

    // Normal Click Logic
    if (selectedItems.includes(id)) {
        setSelectedItems(selectedItems.filter(itemId => itemId !== id))
        setLastSelectedId(null)
    } else {
        setSelectedItems([...selectedItems, id])
        setLastSelectedId(id)
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Tem certeza que deseja excluir ${selectedItems.length} registros?`)) return

    try {
        setIsLoading(true)
        let successCount = 0
        let errors = []

        // Como a API atual não suporta delete em lote, vamos fazer um loop (não é o ideal para muitos dados, mas resolve agora)
        // O ideal seria implementar um endpoint DELETE que aceita array de IDs
        for (const id of selectedItems) {
            const response = await fetch(`/api/transferencias-embrioes?id=${id}`, {
                method: 'DELETE'
            })
            if (response.ok) successCount++
            else errors.push(id)
        }

        if (successCount > 0) {
            alert(`${successCount} registros excluídos com sucesso!`)
            setSelectedItems([])
            loadTransferencias()
        }
        
        if (errors.length > 0) {
            console.error('Falha ao excluir alguns registros:', errors)
        }

    } catch (error) {
        console.error('Erro ao excluir em lote:', error)
        alert('Erro ao realizar exclusão em lote')
    } finally {
        setIsLoading(false)
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      const bstr = evt.target.result
      const wb = XLSX.read(bstr, { type: 'binary', cellDates: true })
      const wsname = wb.SheetNames[0]
      const ws = wb.Sheets[wsname]
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 })
      
      processExcelData(data)
    }
    reader.readAsBinaryString(file)
  }

  const processExcelData = (rows) => {
    if (rows.length < 2) {
      alert('Arquivo vazio ou sem cabeçalho')
      return
    }
    
    const headers = rows[0].map(h => String(h).toUpperCase().trim())
    
    let receptoraNumeroIdx = -1, receptoraLetraIdx = -1, cotaIdx = -1
    let doadoraIdx = -1, touroIdx = -1, dataIdx = -1, sexoIdx = -1
    let doadoraRgIdx = -1, touroRgIdx = -1
    
    headers.forEach((h, i) => {
      // Receptora / Cota logic
      if (h.includes('COTA')) cotaIdx = i
      else if (h.includes('RECEPTORA') && (h.includes('LETRA') || h.includes('SERIE') || h.includes('SÉRIE'))) receptoraLetraIdx = i
      else if (h.includes('RECEPTORA') && (h.includes('NUMERO') || h.includes('NÚMERO') || h.includes('BRINCO'))) receptoraNumeroIdx = i
      else if (h.includes('RECEPTORA') && !h.includes('LETRA') && !h.includes('SERIE')) receptoraNumeroIdx = i // Fallback
      
      // Doadora logic
      if (h.includes('DOADORA') && !h.includes('RG')) doadoraIdx = i
      if ((h.includes('RG') && h.includes('DOADORA')) || (h === 'RG' && i === doadoraIdx + 1)) doadoraRgIdx = i
      
      // Touro logic
      if (h.includes('TOURO') && !h.includes('RG')) touroIdx = i
      if ((h.includes('RG') && h.includes('TOURO')) || (h === 'RG' && i === touroIdx + 1)) touroRgIdx = i
      
      if (h.includes('DATA') && (h.includes('I.A') || h.includes('T.E') || h.includes('TE'))) dataIdx = i
      if (h.includes('SEXO') || h.includes('CRIA')) sexoIdx = i
    })

    if (receptoraNumeroIdx === -1 && cotaIdx === -1) {
      alert('Colunas de Receptora/Cota não encontradas')
      return
    }

    const parsed = rows.slice(1).map((row, i) => {
        // Construct Receptora Name (Letra + Numero)
        let receptoraName = ''
        if (receptoraLetraIdx !== -1 && row[receptoraLetraIdx]) receptoraName += String(row[receptoraLetraIdx]).trim() + ' '
        if (receptoraNumeroIdx !== -1 && row[receptoraNumeroIdx]) receptoraName += String(row[receptoraNumeroIdx]).trim()
        
        receptoraName = receptoraName.trim()
        
        // Check for Cota
        if (cotaIdx !== -1 && row[cotaIdx]) {
            const cotaVal = String(row[cotaIdx]).trim()
            if (receptoraName) receptoraName += ` - Cota: ${cotaVal}`
            else receptoraName = cotaVal // If only Cota exists
        }

        if (!receptoraName) return null
        
        let parsedDate = new Date().toISOString().split('T')[0]
        const dateVal = dataIdx !== -1 ? row[dataIdx] : null
        
        if (dateVal) {
            if (dateVal instanceof Date) {
                 // Add 12 hours to avoid timezone shifting to previous day
                 const safeDate = new Date(dateVal.getTime() + 12 * 60 * 60 * 1000)
                 parsedDate = safeDate.toISOString().split('T')[0]
            } else if (typeof dateVal === 'number') {
                 // Excel serial date: 25569 is 1970-01-01
                 const excelDate = new Date(Math.round((dateVal - 25569) * 86400 * 1000) + 12 * 3600 * 1000)
                 parsedDate = excelDate.toISOString().split('T')[0]
            } else if (typeof dateVal === 'string') {
                 const parts = dateVal.split('/')
                 if (parts.length === 3) {
                     let year = parseInt(parts[2])
                     if (year < 100) year += 2000
                     const month = parseInt(parts[1]) - 1
                     const day = parseInt(parts[0])
                     const d = new Date(year, month, day, 12, 0, 0)
                     parsedDate = d.toISOString().split('T')[0]
                 }
            }
        }

        // Sex parsing
        let sexo = 'ND'
        if (sexoIdx !== -1 && row[sexoIdx]) {
            const val = String(row[sexoIdx]).toUpperCase().trim()
            if (val.startsWith('M')) sexo = 'M'
            else if (val.startsWith('F')) sexo = 'F'
        }

        // Doadora Name + RG
        let doadora = doadoraIdx !== -1 ? String(row[doadoraIdx]).trim() : ''
        if (doadoraRgIdx !== -1 && row[doadoraRgIdx]) {
            doadora += ` (RG: ${row[doadoraRgIdx]})`
        }

        // Touro Name + RG
        let touro = touroIdx !== -1 ? String(row[touroIdx]).trim() : ''
        if (touroRgIdx !== -1 && row[touroRgIdx]) {
            touro += ` (RG: ${row[touroRgIdx]})`
        }

        return {
            id: i,
            receptora_nome: receptoraName,
            doadora_nome: doadora,
            touro: touro,
            data_te: parsedDate,
            sexo_prenhez: sexo,
            central: '',
            status: 'realizada',
            selected: true
        }
    }).filter(Boolean)

    if (parsed.length === 0) {
      alert('Nenhum dado válido encontrado')
      return
    }

    setImportData(parsed)
    setShowImportModal(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleConfirmImport = async () => {
    setIsImporting(true)
    const toImport = importData.filter(d => d.selected)
    
    let successCount = 0
    let errors = []

    for (const item of toImport) {
        try {
            const response = await fetch('/api/transferencias-embrioes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    numero_te: `TE${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    data_te: item.data_te,
                    local_te: item.central || 'Fazenda',
                    central: item.central,
                    touro: item.touro,
                    sexo_prenhez: item.sexo_prenhez,
                    tecnico_responsavel: 'Importação Excel', // Campo obrigatório
                    observacoes: 'Importado via Excel',
                    status: item.status,
                    receptora_nome: item.receptora_nome,
                    doadora_nome: item.doadora_nome
                })
            })
            
            if (response.ok) successCount++
            else errors.push(item.receptora_nome)
        } catch (e) {
            console.error(e)
            errors.push(item.receptora_nome)
        }
    }

    setIsImporting(false)
    setShowImportModal(false)
    alert(`${successCount} importados com sucesso! ${errors.length > 0 ? `Erros: ${errors.length}` : ''}`)
    loadTransferencias()
  }

  const searchDoadora = useDebouncedCallback(async (query) => {
    if (!query || query.length < 1) {
      setDoadoraOptions([])
      return
    }
    
    setLoadingDoadora(true)
    try {
      const response = await fetch(`/api/search/animals?q=${encodeURIComponent(query)}&type=doadora`)
      if (response.ok) {
        const data = await response.json()
        const options = (data.data || []).map(animal => ({
          value: animal.nome || animal.rg || 'Sem Nome',
          label: `${animal.nome || 'Sem Nome'} ${animal.rg ? `(RG: ${animal.rg})` : ''} - ${animal.raca || ''}`.trim()
        }))
        setDoadoraOptions(options)
        setShowDoadoraOptions(true)
      }
    } catch (error) {
      console.error('Erro ao buscar doadoras:', error)
    } finally {
      setLoadingDoadora(false)
    }
  }, 300)

  const searchTouro = useDebouncedCallback(async (query) => {
    if (!query || query.length < 1) {
      setTouroOptions([])
      return
    }
    
    setLoadingTouro(true)
    try {
      const response = await fetch(`/api/search/animals?q=${encodeURIComponent(query)}&type=touro`)
      if (response.ok) {
        const data = await response.json()
        const options = (data.data || []).map(animal => ({
          value: animal.nome || animal.rg || 'Sem Nome',
          label: `${animal.nome || 'Sem Nome'} ${animal.rg ? `(RG: ${animal.rg})` : ''} - ${animal.raca || ''} ${animal.source === 'semen' ? '(Sêmen)' : ''}`.trim()
        }))
        setTouroOptions(options)
        setShowTouroOptions(true)
      }
    } catch (error) {
      console.error('Erro ao buscar touros:', error)
    } finally {
      setLoadingTouro(false)
    }
  }, 300)

  const searchReceptora = useDebouncedCallback(async (query) => {
    if (!query || query.length < 1) {
      setReceptoraOptions([])
      return
    }
    
    setLoadingReceptora(true)
    try {
      const response = await fetch(`/api/search/animals?q=${encodeURIComponent(query)}&type=receptora`)
      if (response.ok) {
        const data = await response.json()
        const options = (data.data || []).map(animal => ({
          value: animal.nome || animal.rg || 'Sem Nome',
          label: `${animal.nome || 'Sem Nome'} ${animal.rg ? `(RG: ${animal.rg})` : ''} - ${animal.raca || ''}`.trim()
        }))
        setReceptoraOptions(options)
        setShowReceptoraOptions(true)
      }
    } catch (error) {
      console.error('Erro ao buscar receptoras:', error)
    } finally {
      setLoadingReceptora(false)
    }
  }, 300)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      loadTransferencias()
    }
  }, [mounted])

  const loadTransferencias = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/transferencias-embrioes')
      if (response.ok) {
        const responseData = await response.json()
        const data = responseData.data || responseData
        setTransferencias(Array.isArray(data) ? data : [])
      } else {
        console.error('Erro ao carregar transferências')
        setTransferencias([])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setTransferencias([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddRecipient = (e) => {
    e.preventDefault()
    if (currentRecipient.trim()) {
      if (!recipients.some(r => r.name === currentRecipient.trim())) {
        setRecipients([...recipients, { 
            name: currentRecipient.trim(), 
            sex: currentRecipientSex 
        }])
        setCurrentRecipient('')
        // Mantemos o sexo selecionado para facilitar lançamentos em lote (ex: várias fêmeas seguidas)
      }
    }
  }

  const handleRemoveRecipient = (index) => {
    const newRecipients = [...recipients]
    newRecipients.splice(index, 1)
    setRecipients(newRecipients)
  }

  const calculateBirthDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    // Adiciona 9 meses (aproximadamente 274 dias, mas gestação bovina é ~283-290 dias)
    // O usuário pediu "daqui 9 meses", vamos somar 9 meses no objeto Date
    date.setMonth(date.getMonth() + 9)
    return date
  }

  const getBirthDateString = (dateString) => {
    const date = calculateBirthDate(dateString)
    return date ? date.toLocaleDateString('pt-BR') : '-'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (recipients.length === 0) {
      alert('Adicione pelo menos uma receptora')
      return
    }

    if (!formData.doadora.trim()) {
      alert('Preencha os campos obrigatórios (Doadora)')
      return
    }

    let successCount = 0
    let errors = []

    for (const recipient of recipients) {
      try {
        const response = await fetch('/api/transferencias-embrioes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            numero_te: `TE${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            data_te: formData.data,
            local_te: formData.central || 'Fazenda', // Fallback se central vazia, mas vamos salvar em central tbm
            central: formData.central,
            touro: formData.touro,
            sexo_prenhez: recipient.sex, // Use recipient specific sex
            tecnico_responsavel: 'Não Informado',
            observacoes: formData.observacoes,
            status: formData.status,
            receptora_nome: recipient.name,
            doadora_nome: formData.doadora
          })
        })

        if (response.ok) {
          successCount++
        } else {
          errors.push(recipient.name)
        }
      } catch (error) {
        console.error(`Erro ao registrar para receptora ${recipient.name}:`, error)
        errors.push(recipient.name)
      }
    }

    if (successCount > 0) {
      alert(`${successCount} transferências registradas com sucesso!`)
      if (errors.length === 0) {
        setShowForm(false)
        setRecipients([])
        // Mantém os dados do formulário para facilitar o próximo lançamento, exceto receptoras
        // O usuário disse: "dai so repete pra nao errar"
      } else {
        alert(`Erro ao registrar para: ${errors.join(', ')}`)
        setRecipients(errors) // Mantém apenas as que deram erro
      }
      loadTransferencias()
    } else {
      alert('Erro ao registrar transferências')
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir esta transferência?')) {
      try {
        const response = await fetch(`/api/transferencias-embrioes?id=${id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          alert('Transferência excluída com sucesso!')
          loadTransferencias()
        } else {
          const errorData = await response.json()
          alert(`Erro ao excluir transferência: ${errorData.message}`)
        }
      } catch (error) {
        console.error('Erro ao excluir transferência:', error)
        alert('Erro ao excluir transferência')
      }
    }
  }

  const exportReport = async () => {
    try {
      // Importação dinâmica do ExcelJS para melhor performance
      const ExcelJS = (await import('exceljs')).default
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Transferências')

      // Configurar colunas com larguras adequadas
      worksheet.columns = [
        { header: 'Receptora Letra', key: 'receptora_letra', width: 10 },
        { header: 'Receptora Número', key: 'receptora_numero', width: 15 },
        { header: 'Sexo Cria', key: 'sexo', width: 10 },
        { header: 'Cota ABCZ', key: 'cota', width: 15 },
        { header: 'Doadora', key: 'doadora', width: 25 },
        { header: 'RG Doadora', key: 'rg_doadora', width: 15 },
        { header: 'Prev Parto', key: 'previsao', width: 15 },
        { header: 'Touro', key: 'touro', width: 25 },
        { header: 'RG Touro', key: 'rg_touro', width: 15 },
        { header: 'Data TE', key: 'data_te', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
      ]

      // Adicionar dados
      transferencias.forEach(t => {
        // Parse Receptora
        let letra = '', numero = '', cota = ''
        let name = t.receptora_nome || t.receptora || ''
        
        // Check for Cota
        const cotaParts = name.split(' - Cota: ')
        if (cotaParts.length > 1) {
            cota = cotaParts[1]
            name = cotaParts[0]
        }
        
        // Parse Letra/Numero
        const nameParts = name.trim().split(' ')
        if (nameParts.length > 1 && nameParts[0].length <= 2 && isNaN(nameParts[0])) {
             letra = nameParts[0]
             numero = nameParts.slice(1).join(' ')
        } else {
             numero = name
        }

        // Parse Doadora RG
        let doadora = t.doadora_nome || t.doadora || ''
        let rgDoadora = ''
        const doadoraParts = doadora.split(' (RG: ')
        if (doadoraParts.length > 1) {
            doadora = doadoraParts[0]
            rgDoadora = doadoraParts[1].replace(')', '')
        }

        // Parse Touro RG
        let touro = t.touro || ''
        let rgTouro = ''
        const touroParts = touro.split(' (RG: ')
        if (touroParts.length > 1) {
            touro = touroParts[0]
            rgTouro = touroParts[1].replace(')', '')
        }

        worksheet.addRow({
          receptora_letra: letra,
          receptora_numero: numero,
          sexo: t.sexo_prenhez || '',
          cota: cota,
          doadora: doadora,
          rg_doadora: rgDoadora,
          previsao: getBirthDateString(t.data_te),
          touro: touro,
          rg_touro: rgTouro,
          data_te: t.data_te ? new Date(t.data_te).toLocaleDateString('pt-BR') : '',
          status: t.status || ''
        })
      })

      // Estilizar cabeçalho (Fundo Rosa, Texto Branco, Negrito)
      const headerRow = worksheet.getRow(1)
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFDB2777' }
      }
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
      
      // Adicionar bordas em todas as células preenchidas
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          }
          // Centralizar colunas específicas
          if (cell.col >= 6) { // Central, Sexo, Status, Previsão
             cell.alignment = { vertical: 'middle', horizontal: 'center' }
          } else {
             cell.alignment = { vertical: 'middle', horizontal: 'left' }
          }
        })
      })

      // Gerar e baixar arquivo .xlsx
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `relatorio_te_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Erro ao exportar Excel:', error)
      alert('Erro ao gerar relatório Excel. Verifique o console para mais detalhes.')
    }
  }

  // Check for notifications (births due within 30 days or overdue)
  const getNotifications = () => {
    const today = new Date()
    return transferencias.filter(t => {
      if (t.status !== 'Realizada' && t.status !== 'realizada') return false
      const birthDate = calculateBirthDate(t.data_te)
      if (!birthDate) return false
      
      const diffTime = birthDate - today
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      // Notificar se estiver atrasado ou nos próximos 30 dias
      return diffDays <= 30
    })
  }

  const notifications = getNotifications()

  const [showStats, setShowStats] = useState(false)
  const [statsFilters, setStatsFilters] = useState({
    startDate: '',
    endDate: '',
    touro: '',
    doadora: ''
  })

  const uniqueTouros = [...new Set(transferencias.map(t => t.touro || 'Não Identificado'))].sort()
  const uniqueDoadoras = [...new Set(transferencias.map(t => t.doadora_nome || t.doadora || 'Não Identificada'))].sort()

  const getStats = () => {
    const filteredTransferencias = transferencias.filter(t => {
        const date = t.data_te ? t.data_te.split('T')[0] : ''
        const touro = t.touro || 'Não Identificado'
        const doadora = t.doadora_nome || t.doadora || 'Não Identificada'

        if (statsFilters.startDate && date < statsFilters.startDate) return false
        if (statsFilters.endDate && date > statsFilters.endDate) return false
        if (statsFilters.touro && touro !== statsFilters.touro) return false
        if (statsFilters.doadora && doadora !== statsFilters.doadora) return false
        
        return true
    })

    const stats = {
        total: filteredTransferencias.length,
        machos: filteredTransferencias.filter(t => t.sexo_prenhez === 'M' || t.sexo_prenhez === 'Macho').length,
        femeas: filteredTransferencias.filter(t => t.sexo_prenhez === 'F' || t.sexo_prenhez === 'Fêmea').length,
        doadoras: {},
        touros: {}
    }

    filteredTransferencias.forEach(t => {
        // Stats Doadora
        const doadora = t.doadora_nome || t.doadora || 'Não Identificada'
        if (!stats.doadoras[doadora]) stats.doadoras[doadora] = { total: 0, machos: 0, femeas: 0 }
        stats.doadoras[doadora].total++
        if (t.sexo_prenhez === 'M' || t.sexo_prenhez === 'Macho') stats.doadoras[doadora].machos++
        if (t.sexo_prenhez === 'F' || t.sexo_prenhez === 'Fêmea') stats.doadoras[doadora].femeas++

        // Stats Touro
        const touro = t.touro || 'Não Identificado'
        if (!stats.touros[touro]) stats.touros[touro] = { total: 0, machos: 0, femeas: 0 }
        stats.touros[touro].total++
        if (t.sexo_prenhez === 'M' || t.sexo_prenhez === 'Macho') stats.touros[touro].machos++
        if (t.sexo_prenhez === 'F' || t.sexo_prenhez === 'Fêmea') stats.touros[touro].femeas++
    })

    return stats
  }

  const stats = getStats()

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
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <HeartIcon className="w-8 h-8 text-pink-600" />
            Transferência de Embriões
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Controle de TE e Previsão de Partos</p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".xlsx,.xls,.csv"
          />
          <button
            onClick={() => fileInputRef.current.click()}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowDownTrayIcon className="w-5 h-5 transform rotate-180" />
            Importar Excel
          </button>
          {selectedItems.length > 0 && (
             <div className="fixed bottom-6 right-6 z-50 bg-white dark:bg-gray-800 shadow-2xl rounded-full px-6 py-3 flex items-center gap-4 border border-gray-200 dark:border-gray-700 animate-fade-in-up">
                <span className="text-gray-700 dark:text-gray-200 font-medium">
                    {selectedItems.length} selecionados
                </span>
                <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
                <button
                    onClick={handleBulkDelete}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 font-bold transition-colors"
                >
                    <XMarkIcon className="w-5 h-5" />
                    Excluir
                </button>
                <button
                    onClick={() => setSelectedItems([])}
                    className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                    Cancelar
                </button>
             </div>
          )}
          <button
            onClick={() => setShowStats(!showStats)}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <BeakerIcon className="w-5 h-5" />
            Estatísticas
          </button>
          <button
            onClick={exportReport}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            Relatório
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Nova Transferência
          </button>
        </div>
      </div>

      {/* Alertas de Partos Atrasados */}
      <AlertasPartosAtrasados />

      {showStats && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 animate-fade-in-down">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <BeakerIcon className="w-6 h-6 text-purple-600" />
                Resumo Estatístico
            </h2>

            {/* Filtros */}
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg mb-6 border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Filtros</h3>
                    <button 
                        onClick={() => setStatsFilters({ startDate: '', endDate: '', touro: '', doadora: '' })}
                        className="text-xs text-pink-600 hover:text-pink-800 dark:text-pink-400 font-medium"
                    >
                        Limpar Filtros
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Data Início</label>
                        <input 
                            type="date" 
                            value={statsFilters.startDate}
                            onChange={(e) => setStatsFilters({...statsFilters, startDate: e.target.value})}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-purple-500 focus:border-purple-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Data Fim</label>
                        <input 
                            type="date" 
                            value={statsFilters.endDate}
                            onChange={(e) => setStatsFilters({...statsFilters, endDate: e.target.value})}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-purple-500 focus:border-purple-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Doadora</label>
                        <select 
                            value={statsFilters.doadora}
                            onChange={(e) => setStatsFilters({...statsFilters, doadora: e.target.value})}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-purple-500 focus:border-purple-500"
                        >
                            <option value="">Todas</option>
                            {uniqueDoadoras.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Touro</label>
                        <select 
                            value={statsFilters.touro}
                            onChange={(e) => setStatsFilters({...statsFilters, touro: e.target.value})}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-purple-500 focus:border-purple-500"
                        >
                            <option value="">Todos</option>
                            {uniqueTouros.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total de Embriões</p>
                    <p className="text-3xl font-bold text-blue-800 dark:text-blue-300">{stats.total}</p>
                </div>
                <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg border border-pink-100 dark:border-pink-800">
                    <p className="text-sm text-pink-600 dark:text-pink-400 font-medium">Fêmeas (Sexado)</p>
                    <p className="text-3xl font-bold text-pink-800 dark:text-pink-300">
                        {stats.femeas} 
                        <span className="text-sm ml-2 font-normal opacity-75">
                            ({stats.total > 0 ? ((stats.femeas/stats.total)*100).toFixed(1) : 0}%)
                        </span>
                    </p>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800">
                    <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Machos (Sexado)</p>
                    <p className="text-3xl font-bold text-indigo-800 dark:text-indigo-300">
                        {stats.machos}
                        <span className="text-sm ml-2 font-normal opacity-75">
                            ({stats.total > 0 ? ((stats.machos/stats.total)*100).toFixed(1) : 0}%)
                        </span>
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Tabela por Doadora */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 border-b pb-2">Por Doadora</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-100 dark:bg-gray-700">
                                    <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-300">Doadora</th>
                                    <th className="px-4 py-2 text-center text-gray-600 dark:text-gray-300">Total</th>
                                    <th className="px-4 py-2 text-center text-pink-600 dark:text-pink-400">Fêmeas</th>
                                    <th className="px-4 py-2 text-center text-blue-600 dark:text-blue-400">Machos</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {Object.entries(stats.doadoras).map(([name, data]) => (
                                    <tr key={name} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                                        <td className="px-4 py-2 text-gray-800 dark:text-gray-200 font-medium">{name}</td>
                                        <td className="px-4 py-2 text-center text-gray-600 dark:text-gray-400 font-bold">{data.total}</td>
                                        <td className="px-4 py-2 text-center text-gray-600 dark:text-gray-400">
                                            {data.femeas} <span className="text-xs text-gray-400">({((data.femeas/data.total)*100).toFixed(0)}%)</span>
                                        </td>
                                        <td className="px-4 py-2 text-center text-gray-600 dark:text-gray-400">
                                            {data.machos} <span className="text-xs text-gray-400">({((data.machos/data.total)*100).toFixed(0)}%)</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Tabela por Touro */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 border-b pb-2">Por Touro</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-100 dark:bg-gray-700">
                                    <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-300">Touro</th>
                                    <th className="px-4 py-2 text-center text-gray-600 dark:text-gray-300">Total</th>
                                    <th className="px-4 py-2 text-center text-pink-600 dark:text-pink-400">Fêmeas</th>
                                    <th className="px-4 py-2 text-center text-blue-600 dark:text-blue-400">Machos</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {Object.entries(stats.touros).map(([name, data]) => (
                                    <tr key={name} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                                        <td className="px-4 py-2 text-gray-800 dark:text-gray-200 font-medium">{name}</td>
                                        <td className="px-4 py-2 text-center text-gray-600 dark:text-gray-400 font-bold">{data.total}</td>
                                        <td className="px-4 py-2 text-center text-gray-600 dark:text-gray-400">
                                            {data.femeas} <span className="text-xs text-gray-400">({((data.femeas/data.total)*100).toFixed(0)}%)</span>
                                        </td>
                                        <td className="px-4 py-2 text-center text-gray-600 dark:text-gray-400">
                                            {data.machos} <span className="text-xs text-gray-400">({((data.machos/data.total)*100).toFixed(0)}%)</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
      )}

      {notifications.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CalendarIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Atenção: Existem {notifications.length} previsões de parto próximas ou atrasadas!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Formulário de Nova Transferência */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Nova Transferência de Embriões (Lote)
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Coluna 1: Dados do Acasalamento/Gerais */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b pb-2">
                Dados do Acasalamento
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Doadora *
                  </label>
                  <input
                    type="text"
                    value={formData.doadora}
                    onChange={(e) => {
                      setFormData({...formData, doadora: e.target.value})
                      searchDoadora(e.target.value)
                    }}
                    onFocus={() => {
                        if(formData.doadora) searchDoadora(formData.doadora)
                    }}
                    onBlur={() => setTimeout(() => setShowDoadoraOptions(false), 200)}
                    placeholder="Digite Nome ou RG da Doadora"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
                    autoComplete="off"
                  />
                  {loadingDoadora && (
                    <div className="absolute right-3 top-9">
                      <div className="animate-spin h-5 w-5 border-2 border-pink-500 rounded-full border-t-transparent"></div>
                    </div>
                  )}
                  {showDoadoraOptions && (
                    <ul className="absolute z-10 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto mt-1">
                      {doadoraOptions.length > 0 ? (
                        doadoraOptions.map((option, index) => (
                          <li
                            key={index}
                            onClick={() => {
                              setFormData({...formData, doadora: option.value})
                              setShowDoadoraOptions(false)
                            }}
                            className="px-4 py-2 hover:bg-pink-50 dark:hover:bg-gray-600 cursor-pointer text-sm text-gray-700 dark:text-gray-200"
                          >
                            {option.label}
                          </li>
                        ))
                      ) : (
                        <li className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 italic">
                          Nenhuma doadora encontrada
                        </li>
                      )}
                      <li
                        onClick={() => {
                            setShowQuickReg('doadora')
                            setShowDoadoraOptions(false)
                        }}
                        className="px-4 py-2 hover:bg-pink-50 dark:hover:bg-gray-600 cursor-pointer text-sm text-pink-600 dark:text-pink-400 font-medium border-t dark:border-gray-600 flex items-center gap-2"
                      >
                        <PlusIcon className="w-4 h-4" />
                        Cadastrar Nova Doadora
                      </li>
                    </ul>
                  )}
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Touro
                  </label>
                  <input
                    type="text"
                    value={formData.touro}
                    onChange={(e) => {
                      setFormData({...formData, touro: e.target.value})
                      searchTouro(e.target.value)
                    }}
                    onFocus={() => {
                        if(formData.touro) searchTouro(formData.touro)
                    }}
                    onBlur={() => setTimeout(() => setShowTouroOptions(false), 200)}
                    placeholder="Digite Nome ou RG do Touro"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
                    autoComplete="off"
                  />
                  {loadingTouro && (
                    <div className="absolute right-3 top-9">
                      <div className="animate-spin h-5 w-5 border-2 border-pink-500 rounded-full border-t-transparent"></div>
                    </div>
                  )}
                  {showTouroOptions && (
                    <ul className="absolute z-10 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto mt-1">
                      {touroOptions.length > 0 ? (
                        touroOptions.map((option, index) => (
                          <li
                            key={index}
                            onClick={() => {
                              setFormData({...formData, touro: option.value})
                              setShowTouroOptions(false)
                            }}
                            className="px-4 py-2 hover:bg-pink-50 dark:hover:bg-gray-600 cursor-pointer text-sm text-gray-700 dark:text-gray-200"
                          >
                            {option.label}
                          </li>
                        ))
                      ) : (
                        <li className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 italic">
                          Nenhum touro encontrado
                        </li>
                      )}
                      <li
                        onClick={() => {
                            setShowQuickReg('touro')
                            setShowTouroOptions(false)
                        }}
                        className="px-4 py-2 hover:bg-pink-50 dark:hover:bg-gray-600 cursor-pointer text-sm text-pink-600 dark:text-pink-400 font-medium border-t dark:border-gray-600 flex items-center gap-2"
                      >
                        <PlusIcon className="w-4 h-4" />
                        Cadastrar Novo Touro
                      </li>
                    </ul>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Central/Laboratório
                  </label>
                  <input
                    type="text"
                    value={formData.central}
                    onChange={(e) => setFormData({...formData, central: e.target.value})}
                    placeholder="Nome da Central"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data da Transferência *
                  </label>
                  <input
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({...formData, data: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
                  />
                  {formData.data && (
                    <p className="text-xs text-gray-500 mt-1">
                      Previsão de Parto: {getBirthDateString(formData.data)}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Observações
                </label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Coluna 2: Receptoras */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b pb-2">
                Receptoras ({recipients.length})
              </h3>
              
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 items-center">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={currentRecipient}
                            onChange={(e) => {
                                setCurrentRecipient(e.target.value)
                                searchReceptora(e.target.value)
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddRecipient(e)}
                            onFocus={() => {
                                if(currentRecipient) searchReceptora(currentRecipient)
                            }}
                            onBlur={() => setTimeout(() => setShowReceptoraOptions(false), 200)}
                            placeholder="Nome ou RG da Receptora"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
                            autoComplete="off"
                        />
                        {loadingReceptora && (
                            <div className="absolute right-3 top-2.5">
                                <div className="animate-spin h-5 w-5 border-2 border-pink-500 rounded-full border-t-transparent"></div>
                            </div>
                        )}
                        {showReceptoraOptions && (
                            <ul className="absolute z-10 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto mt-1">
                                {receptoraOptions.length > 0 ? (
                                    receptoraOptions.map((option, index) => (
                                        <li
                                            key={index}
                                            onClick={() => {
                                                setCurrentRecipient(option.value)
                                                setShowReceptoraOptions(false)
                                            }}
                                            className="px-4 py-2 hover:bg-pink-50 dark:hover:bg-gray-600 cursor-pointer text-sm text-gray-700 dark:text-gray-200"
                                        >
                                            {option.label}
                                        </li>
                                    ))
                                ) : (
                                    <li className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 italic">
                                        Nenhuma receptora encontrada
                                    </li>
                                )}
                            </ul>
                        )}
                    </div>
                    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 gap-1">
                        <button
                            type="button"
                            onClick={() => setCurrentRecipientSex('M')}
                            className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all ${
                                currentRecipientSex === 'M' 
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 shadow-sm ring-1 ring-blue-500' 
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                            title="Macho"
                        >
                            ♂
                        </button>
                        <button
                            type="button"
                            onClick={() => setCurrentRecipientSex('F')}
                            className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all ${
                                currentRecipientSex === 'F' 
                                ? 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300 shadow-sm ring-1 ring-pink-500' 
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                            title="Fêmea"
                        >
                            ♀
                        </button>
                         <button
                            type="button"
                            onClick={() => setCurrentRecipientSex('ND')}
                            className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all ${
                                currentRecipientSex === 'ND' 
                                ? 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300 shadow-sm ring-1 ring-gray-400' 
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                            title="Não Determinado"
                        >
                            ?
                        </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddRecipient}
                      className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors shadow-sm"
                    >
                      <PlusIcon className="w-5 h-5" />
                    </button>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 h-96 overflow-y-auto border border-gray-200 dark:border-gray-600">
                {recipients.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 mt-20">
                    Nenhuma receptora adicionada
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {recipients.map((recipient, index) => (
                      <li key={index} className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <span className="font-medium text-gray-800 dark:text-gray-200">{recipient.name}</span>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                recipient.sex === 'M' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                recipient.sex === 'F' ? 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
                            }`}>
                                {recipient.sex === 'M' ? '♂ Macho' : recipient.sex === 'F' ? '♀ Fêmea' : '? N/D'}
                            </span>
                        </div>
                        <button
                          onClick={() => handleRemoveRecipient(index)}
                          className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-600 mt-6">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 font-medium"
            >
              Salvar Todas as Transferências
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Carregando dados...</div>
        </div>
      ) : transferencias.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-12 text-center">
          <HeartIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Nenhuma transferência registrada
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Comece registrando a primeira transferência de embriões
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700"
          >
            <PlusIcon className="w-5 h-5" />
            Adicionar Transferência
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white w-10">
                    <input 
                        type="checkbox" 
                        onChange={toggleSelectAll}
                        checked={transferencias.length > 0 && selectedItems.length === transferencias.length}
                        className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                    />
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Receptora</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Doadora/Touro</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Central</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Data TE / Previsão</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Sexo</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Ações</th>
              </tr>
            </thead>
            <tbody>
              {transferencias.map((item) => (
                <tr key={item.id} className={`border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 ${selectedItems.includes(item.id) ? 'bg-pink-50 dark:bg-pink-900/20' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input 
                        type="checkbox" 
                        checked={selectedItems.includes(item.id)}
                        onChange={() => toggleSelectItem(item.id)}
                        className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <HeartIcon className="h-5 w-5 text-pink-500 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.receptora_nome || item.receptora || '-'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      <div>D: {item.doadora_nome || item.doadora || '-'}</div>
                      <div className="text-xs text-gray-500">T: {item.touro || '-'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {item.central || item.local_te || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      <div>TE: {item.data_te ? new Date(item.data_te).toLocaleDateString('pt-BR') : '-'}</div>
                      <div className="text-xs text-blue-500 font-medium">Prev: {getBirthDateString(item.data_te)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {item.sexo_prenhez || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      item.status === 'realizada' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                      ['pendente', 'aberto'].includes((item.status || '').toLowerCase()) ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {item.status === 'realizada' ? 'Realizada' : 
                       ['pendente', 'aberto'].includes((item.status || '').toLowerCase()) ? 'Pendente' :
                       item.status === 'cancelada' ? 'Cancelada' : item.status || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400"
                        title="Excluir"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showQuickReg && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              Cadastrar {showQuickReg === 'doadora' ? 'Doadora' : 'Touro'} Rápido
            </h3>
            <form onSubmit={handleQuickRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Série</label>
                <input
                  type="text"
                  required
                  value={quickRegData.serie}
                  onChange={(e) => setQuickRegData({...quickRegData, serie: e.target.value})}
                  className="w-full mt-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Ex: AB"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">RG</label>
                <input
                  type="text"
                  required
                  value={quickRegData.rg}
                  onChange={(e) => setQuickRegData({...quickRegData, rg: e.target.value})}
                  className="w-full mt-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Ex: 1234"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome</label>
                <input
                  type="text"
                  required
                  value={quickRegData.nome}
                  onChange={(e) => setQuickRegData({...quickRegData, nome: e.target.value})}
                  className="w-full mt-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Nome do Animal"
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowQuickReg(null)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:opacity-50"
                >
                  {isRegistering ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Importação */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[90%] max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Confirmar Importação ({importData.length} registros)
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto border rounded-lg mb-4">
              <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th className="p-2"><input type="checkbox" checked={importData.every(d => d.selected)} onChange={(e) => setImportData(importData.map(d => ({...d, selected: e.target.checked})))} /></th>
                    <th className="p-2">Receptora</th>
                    <th className="p-2">Doadora</th>
                    <th className="p-2">Touro</th>
                    <th className="p-2">Data</th>
                    <th className="p-2">Sexo</th>
                  </tr>
                </thead>
                <tbody>
                  {importData.map((item, idx) => (
                    <tr key={idx} className="border-b dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="p-2">
                        <input 
                            type="checkbox" 
                            checked={item.selected} 
                            onChange={(e) => {
                                const newData = [...importData]
                                newData[idx].selected = e.target.checked
                                setImportData(newData)
                            }} 
                        />
                      </td>
                      <td className="p-2">{item.receptora_nome}</td>
                      <td className="p-2">{item.doadora_nome}</td>
                      <td className="p-2">{item.touro}</td>
                      <td className="p-2">{item.data_te ? item.data_te.split('-').reverse().join('/') : '-'}</td>
                      <td className="p-2">
                        <select 
                            value={item.sexo_prenhez}
                            onChange={(e) => {
                                const newData = [...importData]
                                newData[idx].sexo_prenhez = e.target.value
                                setImportData(newData)
                            }}
                            className="bg-transparent border border-gray-300 dark:border-gray-600 rounded px-1 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="ND">ND</option>
                            <option value="M">Macho</option>
                            <option value="F">Fêmea</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={isImporting || !importData.some(d => d.selected)}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isImporting ? 'Importando...' : 'Confirmar Importação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
