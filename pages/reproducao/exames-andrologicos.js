import React, { useState, useEffect } from 'react'
import { BeakerIcon, PlusIcon, PencilIcon, XMarkIcon, ClockIcon, ExclamationTriangleIcon } from '../../components/ui/Icons'
import ExcelJS from 'exceljs'
import { formatDateBR, formatDateForFilename, formatDateTimeForReport } from '../../utils/dateFormatter'

export default function ExamesAndrologicos() {
  const [mounted, setMounted] = useState(false)
  const [exames, setExames] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingExame, setEditingExame] = useState(null)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('info')
  const [touros, setTouros] = useState([])
  const [loadingTouros, setLoadingTouros] = useState(false)
  const [selectedTouro, setSelectedTouro] = useState(null)
  const [searchTouro, setSearchTouro] = useState('')
  const [examesPendentes, setExamesPendentes] = useState([]) // Lista de exames para salvar
  const [savingMultiple, setSavingMultiple] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [exporting, setExporting] = useState(false)
  const [reprocessandoCustos, setReprocessandoCustos] = useState(false)
  const [activeFilter, setActiveFilter] = useState(null)
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [whatsappMessage, setWhatsappMessage] = useState('')
  const [currentExamesList, setCurrentExamesList] = useState([])
  const [whatsappContacts, setWhatsappContacts] = useState([])
  const [newContactName, setNewContactName] = useState('')
  const [newContactNumber, setNewContactNumber] = useState('')

  const [newExame, setNewExame] = useState({
    touro: '',
    rg: '',
    data: new Date().toISOString().split('T')[0],
    resultado: 'Apto',
    ce: '',
    defeitos: '',
    observacoes: ''
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      loadExames()
      loadTouros()
    }
  }, [mounted])

  // Resetar página quando exames mudarem (deve estar antes do return)
  useEffect(() => {
    if (exames.length > 0) {
      const totalPagesCalc = Math.ceil(exames.length / itemsPerPage)
      if (currentPage > totalPagesCalc && totalPagesCalc > 0) {
        setCurrentPage(1)
      }
    }
  }, [exames.length, itemsPerPage])

  // Função para ordenar touros numericamente (série alfabética, RG numérico)
  const ordenarTouros = (lista) => {
    return [...lista].sort((a, b) => {
      // Primeiro ordena por série (alfabeticamente)
      if (a.serie !== b.serie) {
        return a.serie.localeCompare(b.serie)
      }
      // Se a série for igual, ordena por RG (numericamente)
      const rgA = parseInt(a.rg) || 0
      const rgB = parseInt(b.rg) || 0
      return rgA - rgB
    })
  }

  const loadTouros = async () => {
    try {
      setLoadingTouros(true)
      const response = await fetch('/api/animals?sexo=Macho&situacao=Ativo')
      if (response.ok) {
        const result = await response.json()
        // A API retorna { success: true, data: [...] }
        const tourosArray = Array.isArray(result.data) ? result.data : (Array.isArray(result) ? result : [])
        // Ordenar ao carregar
        const tourosOrdenados = ordenarTouros(tourosArray)
        setTouros(tourosOrdenados)
      } else {
        console.warn('Erro ao carregar touros da API')
        setTouros([])
      }
    } catch (error) {
      console.error('Erro ao carregar touros:', error)
      setTouros([])
    } finally {
      setLoadingTouros(false)
    }
  }

  // Carregar contatos do localStorage
  useEffect(() => {
    const savedContacts = localStorage.getItem('whatsappContacts_Andrologico')
    if (savedContacts) {
      setWhatsappContacts(JSON.parse(savedContacts))
    } else {
      // Contatos padrão sugeridos
      setWhatsappContacts([
        { id: 1, name: 'Veterinário', number: '' },
        { id: 2, name: 'Gerente', number: '' },
        { id: 3, name: 'Proprietário', number: '' }
      ])
    }
  }, [])

  const handleAddContact = () => {
    if (!newContactName || !newContactNumber) {
      showMessage('Nome e número são obrigatórios', 'error')
      return
    }
    const newContact = {
      id: Date.now(),
      name: newContactName,
      number: newContactNumber.replace(/\D/g, '') // Apenas números
    }
    const updatedContacts = [...whatsappContacts, newContact]
    setWhatsappContacts(updatedContacts)
    localStorage.setItem('whatsappContacts_Andrologico', JSON.stringify(updatedContacts))
    setNewContactName('')
    setNewContactNumber('')
    showMessage('Contato adicionado!', 'success')
  }

  const handleDeleteContact = (id) => {
    const updatedContacts = whatsappContacts.filter(c => c.id !== id)
    setWhatsappContacts(updatedContacts)
    localStorage.setItem('whatsappContacts_Andrologico', JSON.stringify(updatedContacts))
  }

  const handleUpdateContact = (id, number) => {
    const updatedContacts = whatsappContacts.map(c => 
      c.id === id ? { ...c, number: number.replace(/\D/g, '') } : c
    )
    setWhatsappContacts(updatedContacts)
    localStorage.setItem('whatsappContacts_Andrologico', JSON.stringify(updatedContacts))
  }

  const showMessage = (text, type = 'info') => {
    setMessage(text)
    setMessageType(type)
    setTimeout(() => setMessage(''), 5000)
  }

  const loadExames = async () => {
    try {
      setIsLoading(true)
      if (typeof window === 'undefined') {
        setIsLoading(false)
        return
      }

      // Tentar carregar do PostgreSQL primeiro
      try {
        const response = await fetch('/api/reproducao/exames-andrologicos')
        if (response.ok) {
          const data = await response.json()
          // A API retorna um array diretamente ou pode estar dentro de um objeto
          const examesArray = Array.isArray(data) ? data : (data.data || data.exames || [])
          console.log('Exames carregados do PostgreSQL:', examesArray.length)
          setExames(examesArray)
          setIsLoading(false)
          return
        } else {
          const errorData = await response.json().catch(() => ({}))
          console.warn('Erro na resposta da API:', response.status, errorData)
        }
      } catch (error) {
        console.warn('Erro ao carregar do PostgreSQL, usando localStorage:', error)
      }

      // Fallback para localStorage
      try {
        const savedData = localStorage.getItem('examesAndrologicos')
        if (savedData) {
          const parsedData = JSON.parse(savedData)
          const examesArray = Array.isArray(parsedData) ? parsedData : []
          console.log('Exames carregados do localStorage:', examesArray.length)
          setExames(examesArray)
        } else {
          console.log('Nenhum dado encontrado no localStorage')
          setExames([])
        }
      } catch (error) {
        console.error('Erro ao ler localStorage:', error)
        setExames([])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setExames([])
    } finally {
      setIsLoading(false)
    }
  }

  const saveExames = (newData) => {
    setExames(newData)
    if (typeof window !== 'undefined') {
      localStorage.setItem('examesAndrologicos', JSON.stringify(newData))
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja deletar este exame? Isso também removerá reagendamentos relacionados.')) {
      return
    }

    try {
      // Tentar deletar do PostgreSQL primeiro
      const response = await fetch(`/api/reproducao/exames-andrologicos?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const result = await response.json()
        showMessage(result.message, 'success')
        // Recarregar do banco
        await loadExames()
        return
      }
    } catch (error) {
      console.warn('Erro ao deletar do PostgreSQL, usando localStorage:', error)
    }

    // Fallback para localStorage
    const updatedData = exames.filter(item => item.id !== id)
    saveExames(updatedData)
    showMessage('Exame deletado com sucesso', 'success')
  }

  const handleEdit = (exame) => {
    setEditingExame(exame)
    setSearchTouro('')
    
    // Buscar o touro correspondente na lista
    const touroEncontrado = Array.isArray(touros) ? touros.find(t => 
      t.serie === exame.touro || 
      `${t.serie}-${t.rg}` === exame.touro ||
      t.rg === exame.rg
    ) : null
    
    setSelectedTouro(touroEncontrado || null)
    setNewExame({
      touro: exame.touro,
      rg: exame.rg,
      data: exame.data_exame || exame.data,
      resultado: exame.resultado,
      ce: exame.ce || '',
      defeitos: exame.defeitos || '',
      observacoes: exame.observacoes || ''
    })
    setShowForm(true)
  }

  const handleAddToList = async () => {
    if (!selectedTouro && !editingExame) {
      showMessage('Selecione um touro para realizar o exame', 'error')
      return
    }
    
    if (!newExame.touro.trim() || !newExame.rg.trim()) {
      showMessage('Dados do touro são obrigatórios', 'error')
      return
    }

    if (newExame.resultado === 'Inapto' && !newExame.defeitos.trim()) {
      showMessage('Defeitos são obrigatórios para exames inaptos', 'error')
      return
    }

    // Se estiver editando, salvar direto
    if (editingExame) {
      try {
        await handleSaveExame()
        showMessage('Exame atualizado com sucesso', 'success')
        await loadExames()
        resetForm()
      } catch (error) {
        showMessage('Erro ao atualizar exame', 'error')
        console.error(error)
      }
      return
    }

    // ADICIONAR À LISTA SEM SALVAR (salvar apenas quando clicar em "Salvar Todos")
    const novoExame = {
      id: `temp-${Date.now()}`,
      touro: newExame.touro,
      rg: newExame.rg,
      data: newExame.data,
      data_exame: newExame.data,
      resultado: newExame.resultado,
      ce: newExame.ce || null,
      defeitos: newExame.resultado === 'Inapto' ? (newExame.defeitos || null) : null,
      observacoes: newExame.observacoes || null,
      salvo: false // NÃO salvo ainda
    }

    setExamesPendentes([...examesPendentes, novoExame])
    showMessage(`✅ Exame adicionado à lista! (${examesPendentes.length + 1} na lista)`, 'success')
    
    // Limpar formulário mas manter a data
    setNewExame({
      touro: '',
      rg: '',
      data: newExame.data, // Manter a mesma data
      resultado: 'Apto',
      ce: '',
      defeitos: '',
      observacoes: ''
    })
    setSelectedTouro(null)
    setSearchTouro('')
  }

  const handleRemoveFromList = (id) => {
    setExamesPendentes(examesPendentes.filter(e => e.id !== id))
    showMessage('Exame removido da lista', 'info')
  }

  const handleSaveExame = async (exameToSave = null) => {
    const exame = exameToSave || newExame
    const isEditing = editingExame && !exameToSave

    if (!exame.touro.trim() || !exame.rg.trim()) {
      if (!exameToSave) {
        showMessage('Dados do touro são obrigatórios', 'error')
      }
      return { success: false, error: 'Dados do touro são obrigatórios' }
    }

    try {
      const url = isEditing
        ? `/api/reproducao/exames-andrologicos?id=${editingExame.id}`
        : '/api/reproducao/exames-andrologicos'
      
      const method = isEditing ? 'PUT' : 'POST'

      // Validar e garantir que resultado seja um dos valores permitidos
      let resultadoValido = 'Apto' // Valor padrão
      
      if (exame.resultado) {
        // Remover espaços e converter para string
        const resultadoLimpo = String(exame.resultado).trim()
        
        // Verificar se está nos valores permitidos (case-sensitive)
        if (resultadoLimpo === 'Apto' || resultadoLimpo === 'Inapto' || resultadoLimpo === 'Pendente') {
          resultadoValido = resultadoLimpo
        } else {
          console.warn('Resultado inválido recebido:', resultadoLimpo, 'Usando padrão: Apto')
        }
      }

      // Log para debug - mostrar o objeto completo que será enviado
      const dadosParaEnviar = {
        touro: exame.touro,
        rg: exame.rg,
        data_exame: exame.data_exame || exame.data,
        resultado: resultadoValido,
        ce: exame.ce || null,
        defeitos: resultadoValido === 'Inapto' ? (exame.defeitos || null) : null,
        observacoes: exame.observacoes || null
      }
      
      console.log('=== SALVANDO EXAME ===')
      console.log('Resultado validado:', resultadoValido)
      console.log('Resultado original:', exame.resultado)
      console.log('Tipo original:', typeof exame.resultado)
      console.log('Dados completos:', JSON.stringify(dadosParaEnviar, null, 2))
      console.log('=====================')

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosParaEnviar)
      })

      if (response.ok) {
        const result = await response.json()
        
        // Se houve reagendamento automático, mostrar mensagem especial
        if (result.reagendamento && result.message) {
          console.log('✅ Reagendamento automático criado:', result.reagendamento)
        }
        
        return { success: true, result }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        throw new Error(errorData.error || 'Erro ao salvar')
      }
    } catch (error) {
      console.error('Erro ao salvar exame:', error)
      throw error
    }
  }

  const handleSaveAll = async () => {
    if (examesPendentes.length === 0) {
      showMessage('Nenhum exame na lista', 'info')
      return
    }

    // Filtrar exames que ainda não foram salvos
    // Usar id temporário como critério principal - exames com id "temp-*" nunca foram ao banco
    const examesNaoSalvos = examesPendentes.filter(e => {
      const idTemporario = typeof e.id === 'string' && e.id.startsWith('temp-')
      return idTemporario || !e.salvo
    })
    
    // Se todos já foram salvos (sem id temporário e todos marcados salvo), limpar lista
    if (examesNaoSalvos.length === 0) {
      showMessage('✅ Todos os exames já foram salvos anteriormente!', 'success')
      setExamesPendentes([])
      await loadExames()
      
      // Disparar evento customizado para recarregar exames na ficha do animal
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('reloadAnimalExames'))
      }
      
      resetForm()
      return
    }

    setSavingMultiple(true)
    let sucessos = 0
    let erros = 0
    let reagendamentos = 0
    const mensagens = []

    try {
      for (const exame of examesNaoSalvos) {
        try {
          const result = await handleSaveExame(exame)
          if (result && result.success) {
            sucessos++
            // Verificar se houve reagendamento automático
            if (result.result?.reagendamento) {
              reagendamentos++
            }
          } else {
            erros++
            mensagens.push(`Erro ao salvar ${exame.touro}: ${result?.error || 'Erro desconhecido'}`)
          }
        } catch (error) {
          erros++
          mensagens.push(`Erro ao salvar ${exame.touro}: ${error.message}`)
        }
      }

      if (sucessos > 0) {
        let mensagemFinal = `✅ ${sucessos} exame(s) salvo(s) com sucesso!`
        if (reagendamentos > 0) {
          mensagemFinal += ` ⚠️ ${reagendamentos} reagendamento(s) automático(s) criado(s) para exames inaptos (30 dias).`
        }
        if (erros > 0) {
          mensagemFinal += ` ❌ ${erros} erro(s).`
        }
        showMessage(mensagemFinal, reagendamentos > 0 ? 'warning' : 'success')
        setExamesPendentes([])
        await loadExames()
        
        // Disparar evento customizado para recarregar exames na ficha do animal
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('reloadAnimalExames'))
        }
        
        resetForm()
      } else {
        showMessage(`Erro ao salvar todos os exames. Verifique o console.`, 'error')
      }

      if (mensagens.length > 0) {
        console.error('Erros ao salvar:', mensagens)
      }
    } catch (error) {
      showMessage('Erro ao salvar exames', 'error')
      console.error(error)
    } finally {
      setSavingMultiple(false)
    }
  }

  const handleAddExame = async () => {
    // PRIORIDADE 1: Se há exames pendentes não salvos, salvar todos
    // Usar id temporário como critério - exames com id "temp-*" nunca foram ao banco
    const examesNaoSalvos = examesPendentes.filter(e => {
      const idTemporario = typeof e.id === 'string' && e.id.startsWith('temp-')
      return idTemporario || !e.salvo
    })
    
    if (examesNaoSalvos.length > 0) {
      await handleSaveAll()
      return
    }

    // PRIORIDADE 2: Se estiver editando, salvar o exame atual
    if (editingExame) {
      try {
        await handleSaveExame()
        showMessage('✅ Exame atualizado e salvo no banco!', 'success')
        await loadExames()
        resetForm()
      } catch (error) {
        showMessage('❌ Erro ao atualizar exame', 'error')
        console.error(error)
      }
      return
    }

    // PRIORIDADE 3: Adicionar novo exame à lista (precisa de touro selecionado)
    if (!selectedTouro) {
      showMessage('Selecione um touro para adicionar à lista', 'error')
      return
    }
    
    if (!newExame.touro.trim() || !newExame.rg.trim()) {
      showMessage('Dados do touro são obrigatórios', 'error')
      return
    }

    if (newExame.resultado === 'Inapto' && !newExame.defeitos.trim()) {
      showMessage('Defeitos são obrigatórios para exames inaptos', 'error')
      return
    }

    // Adicionar à lista (será salvo quando clicar em "Salvar Todos")
    await handleAddToList()
  }

  const resetForm = () => {
    setNewExame({
      touro: '',
      rg: '',
      data: new Date().toISOString().split('T')[0],
      resultado: 'Apto',
      ce: '',
      defeitos: '',
      observacoes: ''
    })
    setSelectedTouro(null)
    setEditingExame(null)
    setSearchTouro('')
    setShowForm(false)
    setExamesPendentes([])
  }

  const handleTouroSelect = (touro) => {
    setSelectedTouro(touro)
    setNewExame({
      ...newExame,
      touro: `${touro.serie}-${touro.rg}`,
      rg: touro.rg
    })
  }

  // Filtrar e ordenar touros baseado na busca
  const tourosFiltradosEOrdenados = () => {
    if (!Array.isArray(touros)) return []
    
    let listaFiltrada = touros
    
    // Filtrar por busca
    if (searchTouro.trim()) {
      const buscaLower = searchTouro.toLowerCase().trim()
      listaFiltrada = touros.filter(touro => {
        const identificacao = `${touro.serie}-${touro.rg}`.toLowerCase()
        const raca = (touro.raca || '').toLowerCase()
        const serie = (touro.serie || '').toLowerCase()
        const rg = (touro.rg || '').toLowerCase()
        const cor = (touro.cor || '').toLowerCase()
        
        return identificacao.includes(buscaLower) ||
               raca.includes(buscaLower) ||
               serie.includes(buscaLower) ||
               rg.includes(buscaLower) ||
               cor.includes(buscaLower)
      })
    }
    
    // Ordenar numericamente
    return ordenarTouros(listaFiltrada)
  }

  const getStatusBadge = (exame) => {
    if (exame.reagendado && exame.status === 'Reagendado') {
      return (
        <span className="px-2 py-1 rounded text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 flex items-center gap-1">
          <ClockIcon className="w-3 h-3" />
          Reagendado
        </span>
      )
    }
    
    if (exame.resultado === 'Pendente') {
      return (
        <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 flex items-center gap-1">
          <ClockIcon className="w-3 h-3" />
          Pendente
        </span>
      )
    }

    return null
  }

  const getResultadoBadge = (resultado) => {
    const colors = {
      'Apto': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Inapto': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'Pendente': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    }

    return (
      <span className={`px-2 py-1 rounded text-xs ${colors[resultado] || 'bg-gray-100 text-gray-800'}`}>
        {resultado || '-'}
      </span>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const isExameVencido = (dataExame) => {
    const hoje = new Date()
    const dataExameDate = new Date(dataExame)
    return dataExameDate < hoje
  }

  // Verificar se o animal já tem um exame resolvido (Apto/Inapto) posterior ou na mesma data
  const temExameResolvidoPosterior = (examePendente) => {
    return exames.some(e => {
      // Mesmo animal
      if (String(e.rg) !== String(examePendente.rg) && e.touro !== examePendente.touro) return false
      
      // Exame resolvido (não pendente)
      if (e.resultado === 'Pendente') return false
      
      // Data posterior ou igual
      const dataResolvido = new Date(e.data_exame || e.data)
      const dataPendente = new Date(examePendente.data_exame || examePendente.data)
      
      // Comparar apenas datas (ignorar horas)
      dataResolvido.setHours(0,0,0,0)
      dataPendente.setHours(0,0,0,0)
      
      return dataResolvido >= dataPendente
    })
  }

  const getExamesPendentesResultado = () => {
    return exames.filter(e => {
      if (e.resultado !== 'Pendente' || e.status !== 'Ativo') return false
      if (temExameResolvidoPosterior(e)) return false
      return true
    })
  }

  const getExamesVencidos = () => {
    return exames.filter(e => {
      if (e.resultado !== 'Pendente' || !isExameVencido(e.data_exame)) return false
      if (temExameResolvidoPosterior(e)) return false
      return true
    })
  }

  // Obter exames que precisam ser refeitos (reagendados para inaptos)
  const getExamesParaRefazer = () => {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    
    return exames.filter(e => {
      if (e.resultado !== 'Pendente' || !e.reagendado) return false
      
      // Se já tem exame resolvido posterior, não mostrar na lista
      if (temExameResolvidoPosterior(e)) return false
      
      const dataExame = new Date(e.data_exame)
      dataExame.setHours(0, 0, 0, 0)
      
      // Exames que estão vencidos ou próximos (próximos 3 dias)
      const diasRestantes = Math.ceil((dataExame - hoje) / (1000 * 60 * 60 * 24))
      return diasRestantes <= 3
    }).sort((a, b) => {
      const dataA = new Date(a.data_exame)
      const dataB = new Date(b.data_exame)
      return dataA - dataB
    })
  }

  // Obter exames inaptos que geraram reagendamento
  const getExamesInaptosComReagendamento = () => {
    return exames.filter(e => {
      if (e.resultado !== 'Inapto') return false
      // Verificar se há um exame reagendado vinculado
      return exames.some(reagendado => 
        reagendado.reagendado && 
        reagendado.exame_origem_id === e.id
      )
    })
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

  const examesComResultadoPendente = getExamesPendentesResultado()
  const examesVencidos = getExamesVencidos()
  const examesParaRefazer = getExamesParaRefazer()
  const examesInaptosComReagendamento = getExamesInaptosComReagendamento()

  // Função para reprocessar custos dos exames já lançados
  const handleReprocessarCustos = async () => {
    if (!confirm('Deseja reprocessar os custos de todos os exames andrológicos já lançados? Isso criará custos para exames que ainda não têm.')) {
      return
    }

    try {
      setReprocessandoCustos(true)
      showMessage('⏳ Processando custos dos exames...', 'info')

      const response = await fetch('/api/reproducao/reprocessar-custos-andrologicos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        showMessage(
          `✅ Processamento concluído! ${result.custosCriados} custo(s) criado(s). ${result.erros > 0 ? `${result.erros} erro(s).` : ''}`,
          result.custosCriados > 0 ? 'success' : 'warning'
        )
        
        if (result.errosDetalhes && result.errosDetalhes.length > 0) {
          console.warn('Erros encontrados:', result.errosDetalhes)
        }

        // Disparar evento para recarregar custos nas fichas abertas
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('reloadAnimalCustos'))
        }
      } else {
        const error = await response.json()
        showMessage(`❌ Erro ao reprocessar: ${error.error || 'Erro desconhecido'}`, 'error')
      }
    } catch (error) {
      console.error('Erro ao reprocessar custos:', error)
      showMessage('❌ Erro ao reprocessar custos', 'error')
    } finally {
      setReprocessandoCustos(false)
    }
  }

  // Função para exportar para Excel
  const handleExportToExcel = async () => {
    if (exames.length === 0) {
      showMessage('Não há exames para exportar', 'warning')
      return
    }

    setExporting(true)
    try {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Exames Andrológicos')

      // Calcular estatísticas
      const totalExames = exames.length
      const aprovados = exames.filter(e => e.resultado === 'Apto').length
      const reprovados = exames.filter(e => e.resultado === 'Inapto').length
      const pendentes = exames.filter(e => e.resultado === 'Pendente').length
      
      // Calcular período
      const datas = exames.map(e => new Date(e.data_exame || e.data)).filter(d => !isNaN(d))
      const dataInicio = datas.length > 0 ? new Date(Math.min(...datas)) : null
      const dataFim = datas.length > 0 ? new Date(Math.max(...datas)) : null
      const periodo = dataInicio && dataFim ? `${formatDateBR(dataInicio)} a ${formatDateBR(dataFim)}` : 'N/A'

      // Adicionar cabeçalho informativo
      worksheet.mergeCells('A1:L1')
      worksheet.getCell('A1').value = 'RELATÓRIO DE EXAMES ANDROLÓGICOS'
      worksheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FF1F4E79' } }
      worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }
      
      worksheet.mergeCells('A2:L2')
      worksheet.getCell('A2').value = `Período: ${periodo} | Total: ${totalExames} exames | Aprovados: ${aprovados} | Reprovados: ${reprovados} | Pendentes: ${pendentes}`
      worksheet.getCell('A2').font = { size: 11 }
      worksheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' }
      
      worksheet.mergeCells('A3:L3')
      worksheet.getCell('A3').value = `Gerado em: ${formatDateTimeForReport(new Date())}`
      worksheet.getCell('A3').font = { size: 10, italic: true }
      worksheet.getCell('A3').alignment = { horizontal: 'center', vertical: 'middle' }
      
      // Linha em branco
      worksheet.addRow([])

      // Definir larguras das colunas ANTES de adicionar o cabeçalho
      worksheet.columns = [
        { width: 10 },  // ID
        { width: 20 },  // Touro
        { width: 15 },  // RG
        { width: 15 },  // Data do Exame
        { width: 12 },  // CE
        { width: 15 },  // Resultado
        { width: 40 },  // Defeitos
        { width: 15 },  // Status
        { width: 40 },  // Observações
        { width: 15 },  // Data Original
        { width: 12 },  // Reagendado
        { width: 20 }   // Data Criação
      ]

      // Cabeçalhos das colunas (linha 5)
      const headerRow = worksheet.addRow([
        'ID', 'Touro', 'RG', 'Data do Exame', 'CE (cm)', 'Resultado', 
        'Defeitos', 'Status', 'Observações', 'Data Original', 'Reagendado', 'Data Criação'
      ])
      
      // Estilizar cabeçalho das colunas
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1F4E79' }
      }
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' }

      // Adicionar dados
      exames.forEach((exame) => {
        const row = worksheet.addRow([
          exame.id,
          exame.touro || '-',
          exame.rg || '-',
          exame.data_exame || exame.data ? formatDateBR(exame.data_exame || exame.data) : '-',
          exame.ce ? `${exame.ce} cm` : '-',
          exame.resultado || '-',
          exame.defeitos || '-',
          exame.status || 'Ativo',
          exame.observacoes || '-',
          exame.data_exame_original ? formatDateBR(exame.data_exame_original) : '-',
          exame.reagendado ? 'Sim' : 'Não',
          exame.created_at ? formatDateTimeForReport(exame.created_at) : '-'
        ])

        // Colorir resultado (coluna 6 = Resultado)
        if (exame.resultado === 'Apto') {
          row.getCell(6).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF90EE90' }
          }
        } else if (exame.resultado === 'Inapto') {
          row.getCell(6).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFB6C1' }
          }
        } else if (exame.resultado === 'Pendente') {
          row.getCell(6).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFE4B5' }
          }
        }
      })

      // Aplicar bordas
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          }
          if (rowNumber > 1) {
            cell.alignment = { vertical: 'middle', horizontal: 'left' }
          }
        })
      })

      // Gerar arquivo
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const dataAtual = formatDateForFilename()
      link.download = `Exames_Andrologicos_${dataAtual}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      showMessage(`✅ Arquivo Excel exportado com ${exames.length} exames!`, 'success')
    } catch (error) {
      console.error('Erro ao exportar:', error)
      showMessage('❌ Erro ao exportar para Excel', 'error')
    } finally {
      setExporting(false)
    }
  }

  const handleFilter = (filter) => {
    if (activeFilter === filter) {
      setActiveFilter(null)
    } else {
      setActiveFilter(filter)
      setCurrentPage(1)
    }
  }

  const generateWhatsAppMessage = (examesList) => {
    if (!examesList || examesList.length === 0) return ''

    let message = '*LISTA DE ANIMAIS PARA REAGENDAMENTO - EXAME ANDROLÓGICO*\n\n'

    examesList.forEach((exame, index) => {
      // Tentar encontrar animal no state 'touros'
      // A busca tenta ser robusta comparando RG e Touro
      const animal = touros.find(t => 
        String(t.rg) === String(exame.rg) || 
        t.serie === exame.touro || 
        `${t.serie}-${t.rg}` === exame.touro
      )
      
      const serie = animal?.serie || exame.touro || 'N/A'
      const rg = animal?.rg || exame.rg || 'N/A'
      
      let idadeTexto = 'Idade não inf.'
      if (animal?.meses) {
        idadeTexto = `${animal.meses} meses`
      } else if (animal?.data_nascimento) {
        const hoje = new Date()
        const nasc = new Date(animal.data_nascimento)
        const diffMeses = (hoje.getFullYear() - nasc.getFullYear()) * 12 + (hoje.getMonth() - nasc.getMonth())
        idadeTexto = `${diffMeses} meses`
      }

      // Tentar obter local de várias propriedades possíveis
      const local = animal?.localizacao || animal?.piquete || animal?.local || animal?.pastoAtual || animal?.pasto_atual || 'Local não informado'
      
      // Calcular dias desde o último exame
      let diasDesdeUltimo = 'N/A'
      let dataUltimo = 'N/A'
      if (exame.data_exame_original) {
        const dataOrig = new Date(exame.data_exame_original)
        dataUltimo = formatDate(exame.data_exame_original)
        const diffTime = Math.abs(new Date() - dataOrig)
        diasDesdeUltimo = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      }

      message += `*${index + 1}. Animal ${serie} / ${rg}*\n`
      message += `   📅 Idade: ${idadeTexto}\n`
      message += `   📍 Local: ${local}\n`
      message += `   ⚠️ Status: ${exame.resultado} (Reagendado)\n`
      message += `   📅 Último Andrológico: ${dataUltimo}\n`
      message += `   ⏱️ Dias até hoje: ${diasDesdeUltimo} dias\n`
      message += `   📅 Data Prevista: ${formatDate(exame.data_exame)}\n`
      
      // Mostrar motivo do inapto (defeitos originais) se disponível, senão mostrar defeitos atuais ou observações
      if (exame.defeitos_originais) {
        message += `   🚫 Motivo Inapto: ${exame.defeitos_originais}\n`
      } else if (exame.defeitos) {
        message += `   📝 Defeitos ant.: ${exame.defeitos}\n`
      }
      
      message += '\n'
    })
    
    message += `Total: ${examesList.length} animais`
    
    return message
  }

  const generateWhatsAppLink = (examesList) => {
    const message = generateWhatsAppMessage(examesList)
    if (!message) return ''
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`
  }

  const handleWhatsAppClick = (e, examesList) => {
    e.stopPropagation()
    const message = generateWhatsAppMessage(examesList)
    if (!message) return

    setWhatsappMessage(message)
    setCurrentExamesList(examesList)
    setShowWhatsAppModal(true)
  }

  const handleSendWhatsApp = async (number) => {
    if (!whatsappMessage) return

    // Registrar notificação na API
    try {
      const exameIds = currentExamesList.map(ex => ex.id)
      await fetch('/api/reproducao/exames-andrologicos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'registrar_notificacao',
          exame_ids: exameIds
        })
      })
      
      // Atualizar localmente
      const updatedExames = exames.map(ex => {
        if (exameIds.includes(ex.id)) {
          return {
            ...ex,
            whatsapp_notificacoes: (ex.whatsapp_notificacoes || 0) + 1,
            ultima_notificacao_whatsapp: new Date().toISOString()
          }
        }
        return ex
      })
      setExames(updatedExames)
      
    } catch (error) {
      console.error('Erro ao registrar notificação:', error)
    }

    // Abrir WhatsApp
    // Se número não foi passado, abre sem número (usuário escolhe na lista do próprio whats)
    const phoneParam = number ? `phone=${number}&` : ''
    const link = `https://api.whatsapp.com/send?${phoneParam}text=${encodeURIComponent(whatsappMessage)}`
    window.open(link, '_blank')
    setShowWhatsAppModal(false)
  }

  const getNotificationStatus = (list) => {
    if (!list || list.length === 0) return null
    const sentCounts = list.map(e => e.whatsapp_notificacoes || 0)
    const maxSent = Math.max(...sentCounts)
    if (maxSent === 0) return null
    return maxSent
  }

  // Lógica de filtragem
  const getFilteredExames = () => {
    if (activeFilter === 'refazer') return examesParaRefazer
    if (activeFilter === 'pendente') return examesComResultadoPendente
    if (activeFilter === 'vencido') return examesVencidos
    return exames
  }

  const filteredExames = getFilteredExames()

  // Paginação
  const totalPages = Math.ceil(filteredExames.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const examesPaginados = filteredExames.slice(startIndex, endIndex)

  return (
    <div className="space-y-6">
      {/* Mensagem de feedback */}
      {message && (
        <div className={`p-4 rounded-lg ${
          messageType === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
          messageType === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
          messageType === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
          'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        }`}>
          {message}
        </div>
      )}

      {/* Alertas de exames pendentes, vencidos e para refazer */}
      {(examesComResultadoPendente.length > 0 || examesVencidos.length > 0 || examesParaRefazer.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {examesParaRefazer.length > 0 && (
            <div 
              className={`bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-300 dark:border-orange-700 rounded-lg p-4 cursor-pointer transition-all ${activeFilter === 'refazer' ? 'ring-2 ring-orange-500 shadow-lg scale-[1.02]' : 'hover:shadow-md'}`}
              onClick={() => handleFilter('refazer')}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 text-orange-600" />
                  <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                    ⚠️ Lembretes para Refazer ({examesParaRefazer.length})
                  </h3>
                </div>
                <button 
                  onClick={(e) => handleWhatsAppClick(e, examesParaRefazer)}
                  className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors shadow-sm flex items-center gap-1"
                  title="Enviar lista via WhatsApp"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                  {getNotificationStatus(examesParaRefazer) && (
                    <span className="text-[10px] font-bold bg-white text-green-600 px-1 rounded-full min-w-[16px] text-center">
                      {getNotificationStatus(examesParaRefazer)}
                    </span>
                  )}
                </button>
              </div>
              <p className="text-sm text-orange-700 dark:text-orange-300 mb-2">
                Exames de touros inaptos que precisam ser refeitos em breve.
              </p>
              <div className="text-xs text-orange-600 dark:text-orange-400 space-y-1">
                {examesParaRefazer.slice(0, 3).map((exame) => {
                  const dataExame = new Date(exame.data_exame)
                  const hoje = new Date()
                  hoje.setHours(0, 0, 0, 0)
                  const diasRestantes = Math.ceil((dataExame - hoje) / (1000 * 60 * 60 * 24))
                  
                  return (
                    <div key={exame.id} className="flex justify-between">
                      <span>{exame.touro}</span>
                      <span className={diasRestantes < 0 ? 'font-bold text-red-600' : ''}>
                        {diasRestantes < 0 
                          ? `Vencido há ${Math.abs(diasRestantes)} dias` 
                          : diasRestantes === 0 
                          ? 'Hoje!' 
                          : `${diasRestantes} dia(s)`}
                      </span>
                    </div>
                  )
                })}
                {examesParaRefazer.length > 3 && (
                  <div className="text-center pt-1 font-semibold">
                    +{examesParaRefazer.length - 3} mais
                  </div>
                )}
              </div>
            </div>
          )}

          {examesComResultadoPendente.length > 0 && (
            <div 
              className={`bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 cursor-pointer transition-all ${activeFilter === 'pendente' ? 'ring-2 ring-yellow-500 shadow-lg scale-[1.02]' : 'hover:shadow-md'}`}
              onClick={() => handleFilter('pendente')}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 text-yellow-600" />
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                    Exames Pendentes ({examesComResultadoPendente.length})
                  </h3>
                </div>
                <button 
                  onClick={(e) => handleWhatsAppClick(e, examesComResultadoPendente)}
                  className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors shadow-sm flex items-center gap-1"
                  title="Enviar lista via WhatsApp"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                  {getNotificationStatus(examesComResultadoPendente) && (
                    <span className="text-[10px] font-bold bg-white text-green-600 px-1 rounded-full min-w-[16px] text-center">
                      {getNotificationStatus(examesComResultadoPendente)}
                    </span>
                  )}
                </button>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Existem exames reagendados aguardando realização.
              </p>
            </div>
          )}

          {examesVencidos.length > 0 && (
            <div 
              className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 cursor-pointer transition-all ${activeFilter === 'vencido' ? 'ring-2 ring-red-500 shadow-lg scale-[1.02]' : 'hover:shadow-md'}`}
              onClick={() => handleFilter('vencido')}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                  <h3 className="font-semibold text-red-800 dark:text-red-200">
                    Exames Vencidos ({examesVencidos.length})
                  </h3>
                </div>
                <button 
                  onClick={(e) => handleWhatsAppClick(e, examesVencidos)}
                  className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors shadow-sm flex items-center gap-1"
                  title="Enviar lista via WhatsApp"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                  {getNotificationStatus(examesVencidos) && (
                    <span className="text-[10px] font-bold bg-white text-green-600 px-1 rounded-full min-w-[16px] text-center">
                      {getNotificationStatus(examesVencidos)}
                    </span>
                  )}
                </button>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300">
                Existem exames reagendados que já passaram da data prevista.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BeakerIcon className="w-8 h-8 text-pink-600" />
            Exames Andrológicos
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Controle de exames de touros com reagendamento automático para inaptos
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadExames}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            disabled={isLoading}
            title="Recarregar exames"
          >
            <svg className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isLoading ? 'Carregando...' : 'Recarregar Exames'}
          </button>
          <button
            onClick={loadTouros}
            className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            disabled={loadingTouros}
            title="Recarregar lista de touros"
          >
            <svg className={`w-5 h-5 ${loadingTouros ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loadingTouros ? 'Carregando...' : 'Atualizar Touros'}
          </button>
          <button
            onClick={handleExportToExcel}
            disabled={exporting || exames.length === 0}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            title="Exportar para Excel"
          >
            <svg className={`w-5 h-5 ${exporting ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {exporting ? 'Exportando...' : 'Exportar Excel'}
          </button>
          <button
            onClick={handleReprocessarCustos}
            disabled={reprocessandoCustos}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            title="Reprocessar custos dos exames já lançados"
          >
            <svg className={`w-5 h-5 ${reprocessandoCustos ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {reprocessandoCustos ? 'Processando...' : 'Reprocessar Custos'}
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Novo Exame
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Carregando dados...</div>
        </div>
      ) : exames.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-12 text-center">
          <BeakerIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Nenhum exame registrado
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Comece registrando o primeiro exame andrológico
          </p>
          <div className="text-xs text-gray-500 dark:text-gray-500 mb-4">
            {typeof window !== 'undefined' && (
              <p>Debug: Verifique o console do navegador para mais informações</p>
            )}
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700"
          >
            <PlusIcon className="w-5 h-5" />
            Adicionar Exame
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Touro</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">RG</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Data</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">CE</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Resultado</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Defeitos</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Observações</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Ações</th>
              </tr>
            </thead>
            <tbody>
              {examesPaginados.map((item) => {
                // Verificar se é um exame que precisa ser refeito
                const dataExame = new Date(item.data_exame || item.data)
                const hoje = new Date()
                hoje.setHours(0, 0, 0, 0)
                dataExame.setHours(0, 0, 0, 0)
                const diasRestantes = Math.ceil((dataExame - hoje) / (1000 * 60 * 60 * 24))
                const precisaRefazer = item.reagendado && item.resultado === 'Pendente' && diasRestantes <= 3
                const estaVencido = item.resultado === 'Pendente' && isExameVencido(item.data_exame)
                
                return (
                <tr 
                  key={item.id} 
                  className={`border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    estaVencido ? 'bg-red-50 dark:bg-red-900/10 border-l-4 border-l-red-500' : 
                    precisaRefazer ? 'bg-orange-50 dark:bg-orange-900/10 border-l-4 border-l-orange-500' : ''
                  }`}
                >
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{item.touro || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{item.rg || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      {formatDate(item.data_exame || item.data)}
                      {precisaRefazer && (
                        <span className="px-2 py-0.5 rounded text-xs bg-orange-200 text-orange-800 dark:bg-orange-900 dark:text-orange-200 font-semibold">
                          {diasRestantes < 0 
                            ? `⚠️ Vencido há ${Math.abs(diasRestantes)}d` 
                            : diasRestantes === 0 
                            ? '⚠️ Hoje!' 
                            : `⏰ Em ${diasRestantes}d`}
                        </span>
                      )}
                    </div>
                    {item.reagendado && item.data_exame_original && (
                      <div className="text-xs text-gray-500 mt-1">
                        Original: {formatDate(item.data_exame_original)}
                      </div>
                    )}
                    {item.reagendado && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-semibold">
                        🔄 Reagendado (exame inapto anterior)
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {item.ce ? `${item.ce} cm` : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {getResultadoBadge(item.resultado)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs">
                    {item.defeitos ? (
                      <span className="text-red-600 dark:text-red-400" title={item.defeitos}>
                        {item.defeitos.length > 50 ? `${item.defeitos.substring(0, 50)}...` : item.defeitos}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {getStatusBadge(item)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs truncate">
                    {item.observacoes || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm flex gap-2">
                    <button 
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      title="Editar exame"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400"
                      title="Deletar exame"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
          
          {/* Paginação */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, exames.length)} de {exames.length} exames
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value={10}>10 por página</option>
                  <option value={25}>25 por página</option>
                  <option value={50}>50 por página</option>
                  <option value={100}>100 por página</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  ««
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  « Anterior
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400 px-2">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Próxima »
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  »»
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editingExame ? 'Editar Exame Andrológico' : 'Novo Exame Andrológico'}
              </h2>
              {examesPendentes.length > 0 && !editingExame && (
                <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-semibold">
                  {examesPendentes.length} na lista
                </div>
              )}
            </div>

            {/* Lista de exames pendentes */}
            {examesPendentes.length > 0 && !editingExame && (
              <div className="mb-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-48 overflow-y-auto">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Exames na Lista:</h3>
                  <button
                    onClick={handleSaveAll}
                    disabled={savingMultiple}
                    className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {savingMultiple ? 'Salvando...' : `Salvar Todos (${examesPendentes.length})`}
                  </button>
                </div>
                <div className="space-y-2">
                  {examesPendentes.map((exame) => (
                    <div key={exame.id} className={`flex justify-between items-center p-2 rounded text-sm ${
                      exame.salvo 
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                        : 'bg-white dark:bg-gray-600'
                    }`}>
                      <div className="flex-1">
                        <span className="font-medium">{exame.touro}</span>
                        <span className="text-gray-500 dark:text-gray-400 ml-2">
                          - {formatDate(exame.data)} - {exame.resultado}
                          {exame.ce && ` - CE: ${exame.ce}cm`}
                        </span>
                        {exame.salvo && (
                          <span className="ml-2 text-green-600 dark:text-green-400 text-xs">✅ Salvo</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveFromList(exame.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 ml-2"
                        title="Remover da lista"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Selecionar Touro *
                </label>
                {loadingTouros ? (
                  <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400">
                    Carregando touros...
                  </div>
                ) : !Array.isArray(touros) || touros.length === 0 ? (
                  <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200">
                    Nenhum touro macho ativo encontrado no sistema
                  </div>
                ) : (
                  <>
                    {/* Campo de busca */}
                    <div className="mb-2">
                      <input
                        type="text"
                        value={searchTouro}
                        onChange={(e) => setSearchTouro(e.target.value)}
                        placeholder="Buscar por série, RG, raça ou cor..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>
                    
                    {/* Select com lista filtrada e ordenada */}
                    <select
                      value={selectedTouro?.id || ''}
                      onChange={(e) => {
                        const touro = tourosFiltradosEOrdenados().find(t => t.id === parseInt(e.target.value))
                        if (touro) {
                          handleTouroSelect(touro)
                        } else {
                          setSelectedTouro(null)
                          setNewExame({ ...newExame, touro: '', rg: '' })
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Selecione um touro...</option>
                      {tourosFiltradosEOrdenados().map((touro) => (
                        <option key={touro.id} value={touro.id}>
                          {touro.serie}-{touro.rg} - {touro.raca} {touro.cor ? `(${touro.cor})` : ''}
                        </option>
                      ))}
                    </select>
                    
                    {/* Indicador de resultados filtrados */}
                    {searchTouro.trim() && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {tourosFiltradosEOrdenados().length} de {touros.length} touros encontrados
                      </div>
                    )}
                  </>
                )}
              </div>
              
              {selectedTouro && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">Touro Selecionado:</h4>
                  <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                    <p><strong>Identificação:</strong> {selectedTouro.serie}-{selectedTouro.rg}</p>
                    <p><strong>Raça:</strong> {selectedTouro.raca}</p>
                    {selectedTouro.cor && <p><strong>Cor:</strong> {selectedTouro.cor}</p>}
                    {selectedTouro.data_nascimento && (
                      <p><strong>Nascimento:</strong> {formatDate(selectedTouro.data_nascimento)}</p>
                    )}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data do Exame
                </label>
                <input
                  type="date"
                  value={newExame.data}
                  onChange={(e) => setNewExame({ ...newExame, data: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  C.E - cm
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={newExame.ce}
                  onChange={(e) => setNewExame({ ...newExame, ce: e.target.value })}
                  placeholder="Ex: 32.5"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Resultado
                </label>
                <select
                  value={newExame.resultado}
                  onChange={(e) => setNewExame({ ...newExame, resultado: e.target.value, defeitos: e.target.value !== 'Inapto' ? '' : newExame.defeitos })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="Apto">Apto</option>
                  <option value="Inapto">Inapto</option>
                  <option value="Pendente">Pendente</option>
                </select>
                {newExame.resultado === 'Inapto' && (
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                    ⚠️ Um novo exame será automaticamente agendado para 30 dias após esta data.
                  </p>
                )}
              </div>
              {newExame.resultado === 'Inapto' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Defeitos * <span className="text-xs text-gray-500">(Descreva os defeitos encontrados)</span>
                  </label>
                  <textarea
                    value={newExame.defeitos}
                    onChange={(e) => setNewExame({ ...newExame, defeitos: e.target.value })}
                    placeholder="Descreva os defeitos encontrados no exame..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Observações
                </label>
                <textarea
                  value={newExame.observacoes}
                  onChange={(e) => setNewExame({ ...newExame, observacoes: e.target.value })}
                  placeholder="Observações sobre o exame..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={resetForm}
                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Cancelar
              </button>
              {!editingExame && examesPendentes.length === 0 && (
                <button
                  onClick={handleAddToList}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Adicionar à Lista
                </button>
              )}
              <button
                onClick={handleAddExame}
                disabled={savingMultiple}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  editingExame 
                    ? 'bg-pink-600 text-white hover:bg-pink-700' 
                    : examesPendentes.length > 0
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-pink-600 text-white hover:bg-pink-700'
                } disabled:opacity-50`}
              >
                {editingExame 
                  ? 'Atualizar' 
                  : examesPendentes.length > 0 
                    ? `Salvar Todos (${examesPendentes.length})` 
                    : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showWhatsAppModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
                Enviar Notificação
              </h2>
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mensagem
                </label>
                <textarea
                  value={whatsappMessage}
                  readOnly
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Selecionar Contato
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto mb-2">
                  {whatsappContacts.map((contact) => (
                    <div 
                      key={contact.id}
                      className="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <button
                        onClick={() => handleSendWhatsApp(contact.number)}
                        className="flex-1 text-left"
                      >
                        <div className="font-medium text-gray-900 dark:text-white">{contact.name}</div>
                        {contact.number ? (
                          <div className="text-xs text-gray-500">{contact.number}</div>
                        ) : (
                          <div className="text-xs text-orange-500">Sem número</div>
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                        title="Excluir contato"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Adicionar Novo Contato</h4>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Nome"
                      value={newContactName}
                      onChange={(e) => setNewContactName(e.target.value)}
                      className="flex-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="Número (com DDD)"
                      value={newContactNumber}
                      onChange={(e) => setNewContactNumber(e.target.value)}
                      className="flex-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <button
                    onClick={handleAddContact}
                    disabled={!newContactName || !newContactNumber}
                    className="w-full py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Salvar Contato
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Ou envie para um número temporário:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Número (com DDD)"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    id="tempNumberInput"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('tempNumberInput');
                      if (input && input.value) {
                        handleSendWhatsApp(input.value.replace(/\D/g, ''));
                      }
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}