import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  MagnifyingGlassIcon, 
  MapPinIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  ArrowRightIcon,
  ClockIcon,
  FunnelIcon,
  EyeIcon,
  DocumentTextIcon,
  LockClosedIcon,
  XMarkIcon
} from '../../components/ui/Icons'
import { usePermissions } from '../../hooks/usePermissions'
import PermissionGuard, { PermissionButton } from '../../components/ui/PermissionGuard'
import { exportAnimalsWithLocationToExcel, exportAnimalsWithLocationToPDF } from '../../services/exportUtils'
import ImportProgressOverlay from '../../components/ImportProgressOverlay'

export default function LocalizacaoAnimais() {
  const permissions = usePermissions()
  const [animais, setAnimais] = useState([])
  const [localizacoes, setLocalizacoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [filtroModalAnimais, setFiltroModalAnimais] = useState('') // Filtro especÃ­fico para o modal de seleÃ§Ã£o
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('nova') // 'nova', 'editar', 'transferir'
  const [selectedAnimal, setSelectedAnimal] = useState(null)
  const [selectedLocalizacao, setSelectedLocalizacao] = useState(null)
  const [filtroAvancado, setFiltroAvancado] = useState({
    piquete: '',
    situacao: 'todas', // 'todas', 'ativas', 'finalizadas'
    periodo: '30dias' // '7dias', '30dias', '90dias', 'todos'
  })
  const [novaLocalizacao, setNovaLocalizacao] = useState({
    animal_id: '',
    piquete: '',
    data_entrada: new Date().toISOString().split('T')[0],
    motivo_movimentacao: '',
    observacoes: '',
    usuario_responsavel: 'Sistema'
  })
  const [piquetesDisponiveis, setPiquetesDisponiveis] = useState([])
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [newLocationName, setNewLocationName] = useState('')
  const [locationToDelete, setLocationToDelete] = useState('')
  const [exportDateRange, setExportDateRange] = useState({ start: '', end: '' })
  const [selectedPiqueteExport, setSelectedPiqueteExport] = useState('')
  const [showNovoPiqueteModal, setShowNovoPiqueteModal] = useState(false)
  const [novoPiqueteData, setNovoPiqueteData] = useState({
    nome: '',
    area: '',
    capacidade: '',
    tipo: '',
    observacoes: ''
  })
  const [criandoPiquete, setCriandoPiquete] = useState(false)
  const [selectedAnimalsForBatch, setSelectedAnimalsForBatch] = useState([])
  const [modalListLimit, setModalListLimit] = useState(80) // Limite inicial para performance (evita renderizar 1800+ itens)
  const [batchMoveData, setBatchMoveData] = useState({
    piquete_destino: '',
    data_movimentacao: new Date().toISOString().split('T')[0],
    motivo_movimentacao: '',
    observacoes: ''
  })
  const [transferringAnimal, setTransferringAnimal] = useState(null)
  const [batchMoving, setBatchMoving] = useState(false)
  const [transferProgress, setTransferProgress] = useState(0)
  const [batchProgress, setBatchProgress] = useState(0)
  const [transferStatus, setTransferStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(12) // 12 animais por pÃ¡gina (4 colunas x 3 linhas)
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportType, setExportType] = useState(null) // 'geral' ou 'piquete'
  const [exportFormat, setExportFormat] = useState('excel') // 'excel' ou 'pdf'
  const [importandoExcel, setImportandoExcel] = useState(false)
  const [importProgressLocalizacao, setImportProgressLocalizacao] = useState({ atual: 0, total: 0, etapa: '' })
  const [resultadoImportacao, setResultadoImportacao] = useState(null)
  const [showImportTextModal, setShowImportTextModal] = useState(false)
  const [importText, setImportText] = useState('')
  const [importandoTexto, setImportandoTexto] = useState(false)
  const [showErrosImportacao, setShowErrosImportacao] = useState(false)
  const [errosImportacao, setErrosImportacao] = useState(null)
  const [itemCorrigindo, setItemCorrigindo] = useState(null)
  const [correcaoDados, setCorrecaoDados] = useState({ serie: '', rg: '', local: '' })
  const [corrigindo, setCorrigindo] = useState(false)
  const [itensFalhaSelecionados, setItensFalhaSelecionados] = useState(new Set())
  const [cadastrandoEmLote, setCadastrandoEmLote] = useState(false)
  const [itensCorrecaoRestantes, setItensCorrecaoRestantes] = useState([])
  const fecharOuProximoCorrecao = useCallback(() => {
    setItensCorrecaoRestantes(prev => {
      if (prev.length > 0) {
        const [prox, ...rest] = prev
        setItemCorrigindo(prox)
        setCorrecaoDados({ serie: prox.serie || '', rg: prox.rg || '', local: prox.local || '' })
        return rest
      }
      setItemCorrigindo(null)
      return []
    })
  }, [])
  const [selectedFields, setSelectedFields] = useState({
    'SÃ©rie': true,
    'RG': true,
    'RaÃ§a': true,
    'Sexo': true,
    'Data Nascimento': true,
    'Idade (meses)': true,
    'Piquete': true,
    'Data Entrada Piquete': true,
    'Motivo MovimentaÃ§Ã£o': false,
    'Pat (Pai)': true,
    'MÃ£e': false,
    'Receptora': false,
    'Tatuagem': false,
    'Peso': false,
    'Cor': false,
    'Tipo Nascimento': false,
    'Dificuldade Parto': false,
    'FIV': false,
    'SituaÃ§Ã£o': true,
    'Custo Total (R$)': true,
    'Valor Venda (R$)': false,
    'Valor Real (R$)': false,
    'VeterinÃ¡rio': false,
    'ABCZG': false,
    'DECA': false,
    'ObservaÃ§Ãµes': false,
    'Data Cadastro': false
  })

  useEffect(() => {
    carregarDados()
    carregarLocais()
  }, [filtroAvancado.piquete, filtroAvancado.situacao, filtroAvancado.periodo])

  // Resetar pÃ¡gina quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1)
  }, [filtro, filtroAvancado])

  // Resetar limite da lista do modal quando abrir
  useEffect(() => {
    if (showModal && modalType === 'lote') setModalListLimit(80)
  }, [showModal, modalType])

  // FunÃ§Ã£o para formatar data sem problemas de timezone
  const formatarDataBR = (dataString) => {
    if (!dataString) return ''
    
    // Se jÃ¡ estÃ¡ no formato DD/MM/YYYY, retornar
    if (dataString.includes('/')) {
      return dataString
    }
    
    // Se estÃ¡ no formato YYYY-MM-DD (formato ISO do input date)
    if (dataString.includes('-')) {
      const [ano, mes, dia] = dataString.split('-')
      return `${dia}/${mes}/${ano}`
    }
    
    // Tentar usar Date como fallback
    try {
      const data = new Date(dataString + 'T12:00:00') // Adiciona meio-dia para evitar problemas de timezone
      return data.toLocaleDateString('pt-BR')
    } catch {
      return dataString
    }
  }

  // Mapa animal_id -> localizaÃ§Ã£o atual (memoizado para performance com muitos animais)
  const mapaLocalizacaoPorAnimal = useMemo(() => {
    const mapa = new Map()
    const porAnimal = {}
    for (const loc of localizacoes) {
      const id = loc.animal_id
      if (!porAnimal[id]) porAnimal[id] = []
      porAnimal[id].push(loc)
    }
    for (const [id, locs] of Object.entries(porAnimal)) {
      locs.sort((a, b) => new Date(b.data_entrada) - new Date(a.data_entrada))
      const ativa = locs.find(l => !l.data_saida) || locs[0]
      mapa.set(Number(id), ativa)
    }
    return mapa
  }, [localizacoes])

  // FunÃ§Ã£o para obter a localizaÃ§Ã£o mais recente de um animal (usa mapa memoizado)
  const getLocalizacaoAtual = useCallback((animalId, animal = null) => {
    const locDaTabela = mapaLocalizacaoPorAnimal.get(animalId)
    if (locDaTabela) return locDaTabela
    // Fallback: localizaÃ§Ã£o do cadastro do animal (importaÃ§Ã£o Excel usa piquete_atual)
    const localDoAnimal = animal?.piquete_atual || animal?.piqueteAtual || animal?.pasto_atual || animal?.pastoAtual
    if (animal && localDoAnimal) {
      return {
        piquete: localDoAnimal,
        data_entrada: animal.data_entrada_piquete || animal.dataEntradaPiquete || animal.created_at || animal.data_nascimento || null,
        motivo_movimentacao: 'ImportaÃ§Ã£o / Cadastro Inicial',
        observacoes: animal.observacoes || null
      }
    }
    return null
  }, [mapaLocalizacaoPorAnimal])

  // FunÃ§Ã£o para criar nova localizaÃ§Ã£o
  const criarLocalizacao = async () => {
    if (!novaLocalizacao.animal_id || !novaLocalizacao.piquete || !novaLocalizacao.data_entrada) {
      alert('âÅ¡ ï¸� Preencha todos os campos obrigatÃ³rios!')
      return
    }

    try {
      const response = await fetch('/api/localizacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaLocalizacao)
      })

      if (response.ok) {
        alert('âÅ“â€¦ LocalizaÃ§Ã£o registrada com sucesso!')
        setShowModal(false)
        setNovaLocalizacao({
          animal_id: '',
          piquete: '',
          data_entrada: new Date().toISOString().split('T')[0],
          motivo_movimentacao: '',
          observacoes: '',
          usuario_responsavel: 'Sistema'
        })
        await carregarDados()
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        alert(`â�Å’ Erro: ${errorData.error || 'Erro ao registrar localizaÃ§Ã£o'}`)
      }
    } catch (error) {
      console.error('Erro ao criar localizaÃ§Ã£o:', error)
      alert('â�Å’ Erro ao registrar localizaÃ§Ã£o. Verifique a conexÃ£o com o servidor.')
    }
  }

  // FunÃ§Ã£o para transferir animal com progresso
  const transferirAnimal = async (animalId, novoPiquete, motivo = '', animalInfo = null, dataEntrada = null) => {
    setTransferringAnimal(animalId)
    setTransferProgress(0)
    setTransferStatus('ðÅ¸â€�â€ž Preparando transferÃªncia...')

    try {
      // VerificaÃ§Ã£o de localizaÃ§Ã£o atual (inclui fallback piquete_atual do animal)
      const animalRef = animalInfo || animais.find(a => a.id === animalId)
      const localizacaoAtual = getLocalizacaoAtual(animalId, animalRef)
      
      // ValidaÃ§Ãµes
      if (localizacaoAtual && localizacaoAtual.piquete === novoPiquete) {
        setTransferringAnimal(null)
        alert('âÅ¡ ï¸� O animal jÃ¡ estÃ¡ neste piquete!')
        return
      }

      setTransferProgress(20)
      setTransferStatus('ðÅ¸â€œ� Registrando movimentaÃ§Ã£o...')

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30000)

      // Usar a data fornecida ou a data atual
      const dataParaRegistro = dataEntrada || new Date().toISOString().split('T')[0]

      try {
        const response = await fetch('/api/localizacoes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            animal_id: animalId,
            piquete: novoPiquete,
            data_entrada: dataParaRegistro,
            motivo_movimentacao: motivo || 'TransferÃªncia',
            observacoes: `Transferido via sistema em ${new Date().toLocaleString('pt-BR')}`,
            usuario_responsavel: 'Sistema'
          }),
          signal: controller.signal
        })

        setTransferProgress(70)

        if (!response.ok) {
          const error = await response.json().catch(() => ({}))
          throw new Error(error.error || 'Erro ao transferir animal')
        }

        setTransferProgress(90)
        setTransferStatus('âÅ“â€¦ TransferÃªncia concluÃ­da!')

        // Mostrar sucesso
        const animalNome = animalInfo ? `${animalInfo.serie} ${animalInfo.rg}` : 'Animal'
        setTimeout(() => {
          alert(`âÅ“â€¦ ${animalNome} transferido para ${novoPiquete} com sucesso!`)
          setTransferringAnimal(null)
          setTransferProgress(0)
          setTransferStatus('')
          carregarDados()
          carregarLocais() // Recarregar lista de piquetes
        }, 500)

      } finally {
        clearTimeout(timeout)
      }
    } catch (error) {
      console.error('Erro ao transferir animal:', error)
      
      if (error.name === 'AbortError') {
        alert('â�±ï¸� Tempo de espera excedido. Tente novamente.')
      } else {
        alert(`â�Å’ Erro ao transferir animal: ${error.message || 'Erro desconhecido'}`)
      }
      
      setTransferringAnimal(null)
      setTransferProgress(0)
      setTransferStatus('')
    }
  }

  // FunÃ§Ã£o para movimentaÃ§Ã£o em lote com progresso e preview
  const moverAnimaisEmLote = async () => {
    if (selectedAnimalsForBatch.length === 0) {
      alert('âÅ¡ ï¸� Selecione pelo menos um animal!')
      return
    }

    if (!batchMoveData.piquete_destino) {
      alert('âÅ¡ ï¸� Selecione o piquete de destino!')
      return
    }

    // ConfirmaÃ§Ã£o com preview
    const animaisSelecionados = animais.filter(a => selectedAnimalsForBatch.includes(a.id))
      const previewText = `ðÅ¸Å½¯ VocÃª estÃ¡ prestes a mover ${animaisSelecionados.length} animal(is):\n\n` +
      animaisSelecionados.map(a => `ââ‚¬¢ ${a.serie} ${a.rg} (${a.raca})`).join('\n') +
      `\n\nðÅ¸â€œ� Para: ${batchMoveData.piquete_destino}\nðÅ¸â€œâ€¦ Data: ${formatarDataBR(batchMoveData.data_movimentacao)}\n\nConfirma esta operaÃ§Ã£o?`

    if (!confirm(previewText)) {
      return
    }

    setBatchMoving(true)
    setBatchProgress(0)
    setTransferStatus(`ðÅ¸â€�â€ž Movendo ${selectedAnimalsForBatch.length} animais...`)

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 60000)

      // Simular progresso
      const progressInterval = setInterval(() => {
        setBatchProgress(prev => {
          if (prev >= 85) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 500)

      try {
        setBatchProgress(20)
        setTransferStatus('ðÅ¸â€œ¤ Enviando dados ao servidor...')

        const response = await fetch('/api/batch-move-animals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            animal_ids: selectedAnimalsForBatch,
            piquete_destino: batchMoveData.piquete_destino,
            data_movimentacao: batchMoveData.data_movimentacao,
            motivo_movimentacao: batchMoveData.motivo_movimentacao || 'MovimentaÃ§Ã£o em lote',
            observacoes: batchMoveData.observacoes,
            usuario_responsavel: 'Sistema'
          }),
          signal: controller.signal
        })

        setBatchProgress(70)
        setTransferStatus('ðÅ¸â€œ� Processando movimentaÃ§Ãµes...')

        const result = await response.json()

        clearInterval(progressInterval)
        setBatchProgress(100)
        setTransferStatus('âÅ“â€¦ MovimentaÃ§Ã£o concluÃ­da!')

        if (result.success) {
          setTimeout(() => {
            alert(`âÅ“â€¦ ${result.message}`)
            // Limpar seleÃ§Ã£o e fechar modal
            setSelectedAnimalsForBatch([])
            setBatchMoveData({
              piquete_destino: '',
              data_movimentacao: new Date().toISOString().split('T')[0],
              motivo_movimentacao: '',
              observacoes: ''
            })
            setShowModal(false)
            setBatchMoving(false)
            setBatchProgress(0)
            setTransferStatus('')
            carregarDados()
            carregarLocais() // Recarregar lista de piquetes
          }, 500)
        } else {
          clearInterval(progressInterval)
          const errorsText = result.errors ? result.errors.join('\n') : 'Erro desconhecido'
          alert(`âÅ¡ ï¸� ${result.message}\n\nDetalhes:\n${errorsText}`)
          setBatchMoving(false)
          setBatchProgress(0)
          setTransferStatus('')
        }

      } finally {
        clearTimeout(timeout)
        clearInterval(progressInterval)
      }

    } catch (error) {
      console.error('Erro na movimentaÃ§Ã£o em lote:', error)
      
      if (error.name === 'AbortError') {
        alert('â�±ï¸� Tempo de espera excedido. A operaÃ§Ã£o pode ter sido cancelada.')
      } else {
        alert(`â�Å’ Erro ao mover animais em lote: ${error.message || 'Erro desconhecido'}`)
      }
      
      setBatchMoving(false)
      setBatchProgress(0)
      setTransferStatus('')
    }
  }

  // FunÃ§Ã£o para selecionar/deselecionar animal para lote
  const toggleAnimalSelection = (animalId) => {
    setSelectedAnimalsForBatch(prev => 
      prev.includes(animalId) 
        ? prev.filter(id => id !== animalId)
        : [...prev, animalId]
    )
  }

  // FunÃ§Ã£o para carregar locais do banco de dados
  const carregarLocais = async () => {
    try {
      const piquetesUsados = new Set()
      const piquetesList = []

      // 1. Buscar piquetes jÃ¡ usados nas localizaÃ§Ãµes da API
      try {
        const localizacoesResponse = await fetch('/api/localizacoes')
        if (localizacoesResponse.ok) {
          const localizacoesData = await localizacoesResponse.json()
          const localizacoesApi = localizacoesData.data || []
          
          localizacoesApi.forEach(loc => {
            if (loc.piquete && !piquetesUsados.has(loc.piquete)) {
              piquetesUsados.add(loc.piquete)
              piquetesList.push(loc.piquete)
            }
          })
        }
      } catch (error) {
        console.warn('Erro ao buscar localizaÃ§Ãµes da API:', error)
      }

      // 2. Buscar piquetes cadastrados em "GestÃ£o de Piquetes" para complementar
      try {
        const piquetesResponse = await fetch('/api/piquetes')
        if (piquetesResponse.ok) {
          const piquetesData = await piquetesResponse.json()
          const piquetesArray = piquetesData.piquetes || piquetesData.data?.piquetes || piquetesData.data || []
          
          if (Array.isArray(piquetesArray) && piquetesArray.length > 0) {
            piquetesArray.forEach(piquete => {
              const nome = typeof piquete === 'object' ? piquete.nome : piquete
              if (nome && !piquetesUsados.has(nome)) {
                piquetesUsados.add(nome)
                piquetesList.push(nome)
              }
            })
          }
        }
      } catch (error) {
        console.warn('Erro ao buscar piquetes cadastrados:', error)
      }

      // 3. Fallback: buscar da API de locais (se existir)
      try {
        const response = await fetch('/api/locais')
        if (response.ok) {
          const data = await response.json()
          if (data.data && data.data.length > 0) {
            data.data.forEach(local => {
              if (!piquetesUsados.has(local.nome)) {
                piquetesUsados.add(local.nome)
                piquetesList.push(local.nome)
              }
            })
          }
        }
      } catch (error) {
        console.warn('Erro ao carregar locais da API:', error)
      }

      // Whitelist: exibir APENAS locais que sÃ£o piquetes/projetos vÃ¡lidos.
      // Nomes de touros (NACION 15397, NERO DO MORRO, NORTICO - CJCJ 15236, etc.) sÃ£o filtrados.
      const ehPiqueteOuProjetoValido = (nome) => {
        if (!nome || typeof nome !== 'string') return false
        const n = nome.trim()
        if (!n || /^(VAZIO|NÃÆ’O INFORMADO|NAO INFORMADO|-)$/i.test(n)) return false
        // PIQUETE 1, PIQUETE 10, PIQUETE CABANHA, PIQUETE CONF, PIQUETE GUARITA, PIQUETE PISTA
        if (/^PIQUETE\s+(\d+|CABANHA|CONF|GUARITA|PISTA)$/i.test(n)) return true
        // PROJETO 10, PROJETO 5A, PROJETO 33/1, PROJETO CONF, etc.
        if (/^PROJETO\s+[\dA-Za-z\-/]+$/i.test(n)) return true
        // CONFINA (confinamento - comum em observaÃ§Ãµes de pesagem)
        if (/^CONFINA$/i.test(n)) return true
        // AbreviaÃ§Ãµes de importaÃ§Ã£o: CABANHA, GUARITA, PISTA, CONF
        if (/^(CABANHA|GUARITA|PISTA|CONF)$/i.test(n)) return true
        return false
      }

      const piquetesFiltrados = piquetesList.filter(ehPiqueteOuProjetoValido)

      // Ordenar por nome
      piquetesFiltrados.sort((a, b) => a.localeCompare(b))
      
      setPiquetesDisponiveis(piquetesFiltrados)
    } catch (error) {
      console.error('Erro ao carregar locais:', error)
      setPiquetesDisponiveis([])
    }
  }

  // FunÃ§Ã£o para adicionar novo local (conectado ao banco de dados via API de piquetes)
  const adicionarLocal = async (dadosPiquete = null) => {
    const nomePiquete = dadosPiquete?.nome || newLocationName.trim()
    
    if (!nomePiquete) {
      alert('âÅ¡ ï¸� Digite o nome do piquete!')
      return
    }

    try {
      const response = await fetch('/api/piquetes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nomePiquete,
          area: dadosPiquete?.area || null,
          capacidade: dadosPiquete?.capacidade || null,
          tipo: dadosPiquete?.tipo || null,
          observacoes: dadosPiquete?.observacoes || null,
          ativo: true
        })
      })

      if (response.ok) {
        const result = await response.json()
        setNewLocationName('')
        await carregarLocais() // Recarregar lista
        alert(`âÅ“â€¦ Piquete "${nomePiquete}" cadastrado com sucesso!`)
        // A API retorna { success: true, data: { piquete: {...} } }
        const piquete = result.data?.piquete || result.piquete || { nome: nomePiquete }
        return piquete
      } else {
        const error = await response.json()
        alert(`â�Å’ Erro: ${error.message || error.error || 'Erro ao cadastrar piquete'}`)
        return null
      }
    } catch (error) {
      console.error('Erro ao adicionar piquete:', error)
      alert('â�Å’ Erro ao cadastrar piquete. Verifique a conexÃ£o com o servidor.')
      return null
    }
  }

  // Handler otimizado para mudanÃ§as no formulÃ¡rio de piquete
  const handlePiqueteFieldChange = useCallback((field, value) => {
    setNovoPiqueteData(prev => ({ ...prev, [field]: value }))
  }, [])

  // FunÃ§Ã£o para criar novo piquete via modal rÃ¡pido
  const criarNovoPiquete = async () => {
    if (!novoPiqueteData.nome.trim()) {
      alert('âÅ¡ ï¸� Digite o nome do piquete!')
      return
    }

    setCriandoPiquete(true)
    try {
      const resultado = await adicionarLocal({
        nome: novoPiqueteData.nome.trim(),
        area: novoPiqueteData.area ? parseFloat(novoPiqueteData.area) : null,
        capacidade: novoPiqueteData.capacidade ? parseInt(novoPiqueteData.capacidade) : null,
        tipo: novoPiqueteData.tipo.trim() || null,
        observacoes: novoPiqueteData.observacoes.trim() || null
      })

      if (resultado) {
        // Limpar formulÃ¡rio
        setNovoPiqueteData({
          nome: '',
          area: '',
          capacidade: '',
          tipo: '',
          observacoes: ''
        })
        setShowNovoPiqueteModal(false)
        
        // Selecionar o piquete recÃ©m-criado no dropdown de destino
        if (modalType === 'lote') {
          setBatchMoveData(prev => ({ ...prev, piquete_destino: resultado.nome }))
        } else if (modalType === 'nova' || modalType === 'transferir') {
          setNovaLocalizacao(prev => ({ ...prev, piquete: resultado.nome }))
        }
      }
    } catch (error) {
      console.error('Erro ao criar piquete:', error)
    } finally {
      setCriandoPiquete(false)
    }
  }

  // FunÃ§Ã£o para excluir local
  const excluirLocal = async (localName) => {
    if (!permissions.canDelete) {
      alert(permissions.getPermissionMessage('excluir'))
      return
    }
    
    if (!confirm(`Tem certeza que deseja excluir o local "${localName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/locais?nome=${encodeURIComponent(localName)}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await carregarLocais() // Recarregar lista
        alert(`âÅ“â€¦ Local "${localName}" excluÃ­do com sucesso!`)
      } else {
        const error = await response.json()
        alert(`â�Å’ Erro: ${error.error}`)
      }
    } catch (error) {
      console.error('Erro ao excluir local:', error)
      alert('â�Å’ Erro ao excluir local. Verifique a conexÃ£o com o servidor.')
    }
  }

  const carregarDados = async () => {
    setLoading(true)
    try {
      // Carregar animais
      const animalsResponse = await fetch('/api/animals')
      if (animalsResponse.ok) {
        const animalsData = await animalsResponse.json()
        const animals = Array.isArray(animalsData) ? animalsData : animalsData.data || []
        setAnimais(animals)
      } else {
        console.error('Erro ao carregar animais:', animalsResponse.status)
        setAnimais([])
      }

      // Carregar localizaÃ§Ãµes com filtros
      let url = '/api/localizacoes'
      const params = new URLSearchParams()
      
      if (filtroAvancado.piquete) {
        params.append('piquete', filtroAvancado.piquete)
      }
      
      if (filtroAvancado.situacao === 'ativas') {
        params.append('atual', 'true')
      }
      
      if (filtroAvancado.periodo !== 'todos') {
        const hoje = new Date()
        let dataInicio = new Date()
        
        switch (filtroAvancado.periodo) {
          case '7dias':
            dataInicio.setDate(hoje.getDate() - 7)
            break
          case '30dias':
            dataInicio.setDate(hoje.getDate() - 30)
            break
          case '90dias':
            dataInicio.setDate(hoje.getDate() - 90)
            break
          default:
            break
        }
        
        params.append('data_inicio', dataInicio.toISOString().split('T')[0])
      }
      
      if (params.toString()) {
        url += '?' + params.toString()
      }

      const localizacoesResponse = await fetch(url)
      if (localizacoesResponse.ok) {
        const localizacoesData = await localizacoesResponse.json()
        setLocalizacoes(localizacoesData.data || [])
      } else {
        console.error('Erro ao carregar localizaÃ§Ãµes:', localizacoesResponse.status)
        setLocalizacoes([])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      alert('â�Å’ Erro ao carregar dados. Verifique a conexÃ£o com o servidor.')
    } finally {
      setLoading(false)
    }
  }

  const excluirLocalizacao = async (localizacaoId) => {
    if (!permissions.canDelete) {
      alert(permissions.getPermissionMessage('excluir'))
      return
    }
    
    if (!confirm('Tem certeza que deseja excluir esta localizaÃ§Ã£o?')) {
      return
    }

    try {
      const response = await fetch(`/api/localizacoes?id=${localizacaoId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Recarregar dados apÃ³s exclusÃ£o
        await carregarDados()
        alert('LocalizaÃ§Ã£o excluÃ­da com sucesso!')
      } else {
        const error = await response.json()
        alert(`Erro ao excluir localizaÃ§Ã£o: ${error.error}`)
      }
    } catch (error) {
      console.error('Erro ao excluir localizaÃ§Ã£o:', error)
      alert('Erro ao excluir localizaÃ§Ã£o')
    }
  }

  // Filtrar animais de forma segura (memoizado para performance)
  const animaisFiltrados = useMemo(() => {
    if (!filtro || !filtro.trim()) return animais
    const termo = filtro.toLowerCase().trim()
    return animais.filter(animal => {
      if (!animal) return false
      const localizacaoAtual = mapaLocalizacaoPorAnimal.get(animal.id) || (animal.piquete_atual || animal.piqueteAtual || animal.pasto_atual || animal.pastoAtual ? { piquete: animal.piquete_atual || animal.piqueteAtual || animal.pasto_atual || animal.pastoAtual } : null)
      const identificadorCompleto = `${animal.serie || ''} ${animal.rg || ''}`.toLowerCase().trim()
      const identificadorSemEspaco = `${animal.serie || ''}${animal.rg || ''}`.toLowerCase()
      const serie = (animal.serie || '').toLowerCase()
      const rg = (animal.rg || '').toLowerCase()
      const raca = (animal.raca || '').toLowerCase()
      const piquete = (localizacaoAtual?.piquete || animal.piquete_atual || animal.piqueteAtual || animal.pasto_atual || animal.pastoAtual || '').toLowerCase()
      return (
        identificadorCompleto.includes(termo) ||
        identificadorSemEspaco.includes(termo.replace(/\s+/g, '')) ||
        serie.includes(termo) ||
        rg.includes(termo) ||
        raca.includes(termo) ||
        piquete.includes(termo)
      )
    })
  }, [animais, filtro, mapaLocalizacaoPorAnimal])

  // Filtrar animais para o modal de seleÃ§Ã£o (memoizado para performance)
  const animaisFiltradosModal = useMemo(() => {
    if (!filtroModalAnimais || !filtroModalAnimais.trim()) return animais
    const termo = filtroModalAnimais.toLowerCase().trim()
    return animais.filter(animal => {
      if (!animal) return false
      const localizacaoAtual = mapaLocalizacaoPorAnimal.get(animal.id) || (animal.piquete_atual || animal.piqueteAtual || animal.pasto_atual || animal.pastoAtual ? { piquete: animal.piquete_atual || animal.piqueteAtual || animal.pasto_atual || animal.pastoAtual } : null)
      const identificadorCompleto = `${animal.serie || ''} ${animal.rg || ''}`.toLowerCase().trim()
      const identificadorSemEspaco = `${animal.serie || ''}${animal.rg || ''}`.toLowerCase()
      const serie = (animal.serie || '').toLowerCase()
      const rg = (animal.rg || '').toLowerCase()
      const raca = (animal.raca || '').toLowerCase()
      const sexo = (animal.sexo || '').toLowerCase()
      const piquete = (localizacaoAtual?.piquete || animal.piquete_atual || animal.piqueteAtual || animal.pasto_atual || animal.pastoAtual || '').toLowerCase()
      return (
        identificadorCompleto.includes(termo) ||
        identificadorSemEspaco.includes(termo.replace(/\s+/g, '')) ||
        serie.includes(termo) ||
        rg.includes(termo) ||
        raca.includes(termo) ||
        sexo.includes(termo) ||
        piquete.includes(termo)
      )
    })
  }, [animais, filtroModalAnimais, mapaLocalizacaoPorAnimal])

  // PaginaÃ§Ã£o
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const animaisPaginados = animaisFiltrados.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(animaisFiltrados.length / itemsPerPage)

  // FunÃ§Ã£o para mudar de pÃ¡gina
  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // FunÃ§Ã£o para abrir modal de seleÃ§Ã£o de campos
  const abrirModalExportacao = (tipo) => {
    if (tipo === 'geral' && animaisFiltrados.length === 0) {
      alert('âÅ¡ ï¸� Nenhum animal encontrado para exportar!')
      return
    }
    
    setExportType(tipo)
    // Se for exportaÃ§Ã£o por piquete e jÃ¡ tiver um selecionado no filtro, usar ele como padrÃ£o
    if (tipo === 'piquete' && filtroAvancado.piquete) {
      setSelectedPiqueteExport(filtroAvancado.piquete)
    } else {
      setSelectedPiqueteExport('')
    }
    setExportDateRange({ start: '', end: '' })
    setShowExportModal(true)
  }

  // FunÃ§Ã£o para confirmar exportaÃ§Ã£o com campos selecionados
  const confirmarExportacao = async () => {
    const camposSelecionados = Object.keys(selectedFields).filter(campo => selectedFields[campo])
    
    if (camposSelecionados.length === 0) {
      alert('âÅ¡ ï¸� Selecione pelo menos um campo para exportar!')
      return
    }

    setShowExportModal(false)
    setLoading(true)

    try {
      let animaisParaExportar = []
      let nomeArquivo = ''
      let piqueteFiltro = null

      if (exportType === 'piquete') {
        if (!selectedPiqueteExport) {
          alert('âÅ¡ ï¸� Selecione um piquete para exportar!')
          return
        }

        // Usar lista completa de animais para garantir que pegamos todos do piquete selecionado
        // independente dos filtros da tela principal
        animaisParaExportar = animais.filter(animal => {
          const localizacaoAtual = getLocalizacaoAtual(animal.id, animal)
          return localizacaoAtual?.piquete === selectedPiqueteExport
        })
        piqueteFiltro = selectedPiqueteExport
        nomeArquivo = 'animais_piquete'
        
        if (animaisParaExportar.length === 0) {
          alert('âÅ¡ ï¸� Nenhum animal encontrado neste piquete!')
          return
        }
      } else {
        animaisParaExportar = animaisFiltrados
        nomeArquivo = 'animais_geral'
      }

      // Filtrar por perÃ­odo se selecionado
      if (exportDateRange.start || exportDateRange.end) {
        animaisParaExportar = animaisParaExportar.filter(animal => {
           const localizacaoAtual = getLocalizacaoAtual(animal.id, animal)
           if (!localizacaoAtual || !localizacaoAtual.data_entrada) return false
           
           // Criar data de entrada e zerar horas para comparaÃ§Ã£o apenas por dia
           const dataEntrada = new Date(localizacaoAtual.data_entrada)
           dataEntrada.setHours(0, 0, 0, 0)
           
           if (exportDateRange.start) {
             const startDate = new Date(exportDateRange.start)
             startDate.setHours(0, 0, 0, 0)
             if (dataEntrada < startDate) return false
           }
           
           if (exportDateRange.end) {
             const endDate = new Date(exportDateRange.end)
             endDate.setHours(0, 0, 0, 0)
             if (dataEntrada > endDate) return false
           }
           
           return true
        })

        if (animaisParaExportar.length === 0) {
           alert('âÅ¡ ï¸� Nenhum animal encontrado no perÃ­odo selecionado!')
           setLoading(false)
           return
        }
      }

      // Adicionar timestamp
      const timestamp = new Date().toISOString().split('T')[0]
      if (piqueteFiltro) {
        nomeArquivo = `animais_piquete_${piqueteFiltro.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}`
      } else {
        nomeArquivo = `animais_geral_${timestamp}`
      }

      let success = false
      if (exportFormat === 'pdf') {
        success = await exportAnimalsWithLocationToPDF(
          animaisParaExportar,
          getLocalizacaoAtual,
          nomeArquivo,
          piqueteFiltro,
          camposSelecionados
        )
      } else {
        success = await exportAnimalsWithLocationToExcel(
          animaisParaExportar,
          getLocalizacaoAtual,
          nomeArquivo,
          piqueteFiltro,
          camposSelecionados
        )
      }
      
      if (success) {
        alert(`âÅ“â€¦ ExportaÃ§Ã£o concluÃ­da! ${animaisParaExportar.length} animal(is) exportado(s) com ${camposSelecionados.length} campo(s).`)
      } else {
        alert('â�Å’ Erro ao exportar arquivo.')
      }
    } catch (error) {
      console.error('Erro ao exportar:', error)
      alert('â�Å’ Erro ao exportar animais. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // FunÃ§Ã£o para selecionar/deselecionar todos os campos
  const toggleTodosCampos = () => {
    const todosSelecionados = Object.values(selectedFields).every(v => v)
    const novosCampos = {}
    Object.keys(selectedFields).forEach(campo => {
      novosCampos[campo] = !todosSelecionados
    })
    setSelectedFields(novosCampos)
  }

  // FunÃ§Ã£o para exportar animais por piquete (deprecated - agora usa modal)
  const exportarPorPiquete = () => {
    abrirModalExportacao('piquete')
  }

  // FunÃ§Ã£o para exportar todos os animais (deprecated - agora usa modal)
  const exportarGeral = () => {
    abrirModalExportacao('geral')
  }

  // Limpar todas as localizaÃ§Ãµes
  const limparTodasLocalizacoes = async () => {
    // Solicitar senha de desenvolvedor
    const senha = prompt('ðÅ¸â€�â€™ Ã�REA RESTRITA - Digite a senha do desenvolvedor para continuar:')
    
    if (!senha) {
      return // UsuÃ¡rio cancelou
    }
    
    if (senha !== 'bfzk26') {
      alert('â�Å’ Senha incorreta! Acesso negado.')
      return
    }
    
    const confirmacao = window.confirm(
      'âÅ¡ ï¸� ATENÃâ€¡ÃÆ’O!\n\n' +
      'Esta aÃ§Ã£o irÃ¡ REMOVER TODAS as localizaÃ§Ãµes de animais do sistema.\n\n' +
      'VocÃª poderÃ¡ reimportar as localizaÃ§Ãµes corretas do Excel apÃ³s limpar.\n\n' +
      'Deseja continuar?'
    )
    
    if (!confirmacao) return

    // Segunda confirmaÃ§Ã£o para seguranÃ§a
    const segundaConfirmacao = window.confirm(
      'ðÅ¸Å¡¨ ÃÅ¡LTIMA CONFIRMAÃâ€¡ÃÆ’O!\n\n' +
      'Tem certeza absoluta que deseja limpar TODAS as localizaÃ§Ãµes?\n\n' +
      'Esta aÃ§Ã£o NÃÆ’O pode ser desfeita!'
    )
    
    if (!segundaConfirmacao) return

    setLoading(true)
    
    try {
      const response = await fetch('/api/localizacoes/limpar-todas', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-password': 'bfzk26'
        }
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        alert(`âÅ“â€¦ ${data.data.message}\n\nAgora vocÃª pode importar as localizaÃ§Ãµes corretas do Excel.`)
        await carregarDados()
        await carregarLocais()
      } else {
        alert(`â�Å’ Erro: ${data.error || 'Falha ao limpar localizaÃ§Ãµes'}`)
      }
    } catch (err) {
      console.error('Erro ao limpar localizaÃ§Ãµes:', err)
      alert('â�Å’ Erro ao limpar localizaÃ§Ãµes. Verifique a conexÃ£o.')
    } finally {
      setLoading(false)
    }
  }

  // Importar localizaÃ§Ãµes do Excel (SÃ©rie, RGN, LOCAL, OBSERVAÃâ€¡Ãâ€¢ES)
  const handleImportarExcel = async (e) => {
    const file = e?.target?.files?.[0]
    if (!file) return
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      alert('âÅ¡ ï¸� Envie um arquivo Excel (.xlsx ou .xls)')
      return
    }
    setImportandoExcel(true)
    setImportProgressLocalizacao({ atual: 0, total: 0, etapa: 'Importando localizaÃ§Ãµes...' })
    setResultadoImportacao(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch('/api/import/excel-localizacao', {
        method: 'POST',
        body: formData
      })
      const data = await response.json()
      if (response.ok && data.success) {
        setResultadoImportacao(data)
        await carregarDados()
        await carregarLocais()
        const r = data.resultados || {}
        const msg = `âÅ“â€¦ ${data.message || 'ImportaÃ§Ã£o concluÃ­da!'}\n\n` +
          `ââ‚¬¢ Animais atualizados: ${r.animaisAtualizados || 0}\n` +
          `ââ‚¬¢ LocalizaÃ§Ãµes registradas: ${r.localizacoesRegistradas || 0}\n` +
          (r.naoEncontrados?.length > 0 ? `ââ‚¬¢ NÃ£o encontrados: ${r.naoEncontrados.length}\n` : '')
        alert(msg)
      } else {
        const detalhes = data.details ? `\n\nDetalhes: ${data.details}` : ''
        alert(`â�Å’ Erro: ${data.error || 'Falha na importaÃ§Ã£o'}${detalhes}`)
      }
    } catch (err) {
      console.error('Erro ao importar:', err)
      alert('â�Å’ Erro ao importar. Verifique a conexÃ£o.')
    } finally {
      setImportandoExcel(false)
      setImportProgressLocalizacao({ atual: 0, total: 0, etapa: '' })
      e.target.value = ''
    }
  }

  // Importar localizaÃ§Ãµes via texto colado (SÃ©rie RG LOCAL)
  const handleImportarTexto = async () => {
    if (!importText.trim()) {
      alert('âÅ¡ ï¸� Cole os dados no campo de texto!')
      return
    }

    setImportandoTexto(true)
    setImportProgressLocalizacao({ atual: 0, total: 0, etapa: 'Importando localizaÃ§Ãµes...' })
    setResultadoImportacao(null)

    try {
      // Processar texto linha por linha
      const linhas = importText.trim().split('\n').filter(l => l.trim())
      const dados = []

      for (const linha of linhas) {
        // Tentar diferentes separadores: tabulaÃ§Ã£o, mÃºltiplos espaÃ§os, ou espaÃ§o Ãºnico
        let partes = linha.trim().split(/\t+/).filter(p => p.trim())
        
        // Se nÃ£o encontrou tabulaÃ§Ã£o, tentar mÃºltiplos espaÃ§os
        if (partes.length < 3) {
          partes = linha.trim().split(/\s{2,}/).filter(p => p.trim())
        }
        
        // Se ainda nÃ£o encontrou, tentar espaÃ§o Ãºnico (assumindo que sÃ©rie e RG nÃ£o tÃªm espaÃ§os)
        if (partes.length < 3) {
          partes = linha.trim().split(/\s+/).filter(p => p.trim())
        }
        
        if (partes.length >= 3) {
          // Formato esperado: SÃâ€°RIE RG LOCAL [OBSERVAÃâ€¡Ãâ€¢ES]
          // LOCAL pode ter espaÃ§o: "PIQUETE 10" ââ€ â€™ quando partes[2]=="PIQUETE" e partes[3] Ã© nÃºmero
          let local = partes[2].trim()
          let observacoes = partes.slice(3).join(' ').trim() || ''
          if (partes.length >= 4 && /^\d+$/.test(partes[3]) && (/^(PIQUETE|PTO|P|PASTO|PTOUFTF)$/i.test(partes[2]) || /^[A-Za-z]+$/.test(partes[2]))) {
            local = `${partes[2].trim()} ${partes[3].trim()}`
            observacoes = partes.slice(4).join(' ').trim() || ''
          }
          dados.push({
            serie: partes[0].trim(),
            rg: partes[1].trim(),
            local,
            observacoes
          })
        } else if (partes.length >= 1) {
          // Linha com dados incompletos - adicionar mesmo assim para mostrar erro
          dados.push({
            serie: partes[0]?.trim() || '',
            rg: partes[1]?.trim() || '',
            local: partes[2]?.trim() || '',
            observacoes: ''
          })
        }
      }

      if (dados.length === 0) {
        alert('âÅ¡ ï¸� Nenhum dado vÃ¡lido encontrado. Formato esperado:\nSÃâ€°RIE RG LOCAL [OBSERVAÃâ€¡Ãâ€¢ES]')
        setImportandoTexto(false)
        setImportProgressLocalizacao({ atual: 0, total: 0, etapa: '' })
        return
      }

      console.log('Enviando dados para importaÃ§Ã£o:', dados.length, 'linhas')

      // Criar timeout de 60 segundos
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000)

      try {
        // Enviar para API
        const response = await fetch('/api/import/text-localizacao', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dados }),
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        const data = await response.json()
        console.log('Resposta da API:', data)

        if (response.ok && data.success) {
          setResultadoImportacao(data)
          // sendSuccess coloca o payload em data.data; resultados pode estar em data.data.resultados ou data.resultados
          const r = data.data?.resultados || data.resultados || {}
          const totalProblemas = (r.naoEncontrados?.length || 0) + (r.erros?.length || 0)
          
          // Guardar erros para mostrar no modal
          if (totalProblemas > 0 || r.animaisAtualizados === 0) {
            setErrosImportacao(r)
            setShowErrosImportacao(true) // Abrir modal automaticamente
          }
          
          // Recarregar dados ANTES de mostrar mensagem
          await carregarDados()
          await carregarLocais()
          
          // Montar mensagem de resultado
          let msg = `${r.animaisAtualizados > 0 ? 'âÅ“â€¦' : 'âÅ¡ ï¸�'} ImportaÃ§Ã£o concluÃ­da!\n\n`
          msg += `ââ‚¬¢ Total de linhas: ${r.totalLinhas || 0}\n`
          msg += `ââ‚¬¢ Animais atualizados: ${r.animaisAtualizados || 0}\n`
          msg += `ââ‚¬¢ LocalizaÃ§Ãµes registradas: ${r.localizacoesRegistradas || 0}\n`
          
          if (totalProblemas > 0) {
            msg += `\nâÅ¡ ï¸� Problemas encontrados: ${totalProblemas}\n`
            msg += `ââ‚¬¢ NÃ£o encontrados: ${r.naoEncontrados?.length || 0}\n`
            msg += `ââ‚¬¢ Erros: ${r.erros?.length || 0}\n\n`
            msg += `Um modal com os detalhes serÃ¡ exibido.`
          }
          
          // Sempre mostrar mensagem
          alert(msg)
          
          // Fechar modal se tudo OK
          if (totalProblemas === 0 && r.animaisAtualizados > 0) {
            setShowImportTextModal(false)
            setImportText('')
          }
        } else {
          const detalhes = data.details ? `\n\nDetalhes: ${data.details}` : ''
          alert(`â�Å’ Erro: ${data.error || 'Falha na importaÃ§Ã£o'}${detalhes}`)
        }
      } catch (fetchError) {
        if (fetchError.name === 'AbortError') {
          alert('â�±ï¸� Tempo limite excedido (60s). A importaÃ§Ã£o pode estar demorando muito. Tente com menos linhas por vez.')
        } else {
          throw fetchError
        }
      }
    } catch (err) {
      console.error('Erro ao importar texto:', err)
      alert(`â�Å’ Erro ao importar: ${err.message || 'Verifique a conexÃ£o.'}`)
    } finally {
      setImportandoTexto(false)
      setImportProgressLocalizacao({ atual: 0, total: 0, etapa: '' })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20">
      <ImportProgressOverlay
        importando={importandoExcel || importandoTexto}
        progress={importProgressLocalizacao}
      />
      <div className="container mx-auto p-6 space-y-8">
        {/* Header Moderno */}
        <div className="relative overflow-hidden bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-3xl shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-48 translate-x-48"></div>
          <div className="relative p-8">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <div className="flex items-center space-x-4">
                  <div className="p-4 bg-white/20 backdrop-blur-sm rounded-3xl">
                    <MapPinIcon className="h-10 w-10 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white tracking-tight">
                      LocalizaÃ§Ã£o de Animais
                    </h1>
                    <p className="text-green-100 text-lg font-medium mt-1">
                      Gerencie e monitore a localizaÃ§Ã£o do seu rebanho
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={exportarGeral}
                  disabled={loading || animaisFiltrados.length === 0}
                  className="group bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Exportar todos os animais com todas as informaÃ§Ãµes"
                >
                  <DocumentTextIcon className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="font-medium">ðÅ¸â€œÅ  Exportar Geral</span>
                </button>
                <button
                  onClick={exportarPorPiquete}
                  disabled={loading}
                  className="group bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Exportar animais do piquete selecionado"
                >
                  <DocumentTextIcon className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="font-medium">ðÅ¸â€œ� Exportar por Piquete</span>
                </button>
                <button
                  onClick={() => setShowLocationModal(true)}
                  className="group bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
                >
                  <MapPinIcon className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="font-medium">ðÅ¸�Å¾ï¸� Gerenciar Locais</span>
                </button>
                <button
                  onClick={() => {
                    setModalType('lote')
                    setShowModal(true)
                    // Se jÃ¡ houver animais selecionados, manter a seleÃ§Ã£o
                    // Se nÃ£o houver, o usuÃ¡rio pode selecionar no modal
                  }}
                  className="group bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
                >
                  <DocumentTextIcon className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="font-medium">
                    {selectedAnimalsForBatch.length > 0 
                      ? `ðÅ¸â€œ� LocalizaÃ§Ã£o em Lote (${selectedAnimalsForBatch.length} selecionados)`
                      : 'ðÅ¸â€œ� LocalizaÃ§Ã£o em Lote'}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setModalType('nova')
                    setShowModal(true)
                  }}
                  className="group bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
                >
                  <PlusIcon className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                  <span className="font-medium">Nova LocalizaÃ§Ã£o</span>
                </button>
                <label className="group bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleImportarExcel}
                    disabled={importandoExcel}
                    className="hidden"
                  />
                  {importandoExcel ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="font-medium">Importando...</span>
                    </>
                  ) : (
                    <>
                      <DocumentTextIcon className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                      <span className="font-medium">ðÅ¸â€œ¥ Importar Excel</span>
                    </>
                  )}
                </label>
                <button
                  onClick={() => setShowImportTextModal(true)}
                  disabled={loading}
                  className="group bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <DocumentTextIcon className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="font-medium">ðÅ¸â€œ� Importar Texto</span>
                </button>
                <button
                  onClick={limparTodasLocalizacoes}
                  disabled={loading}
                  className="group bg-red-500/80 backdrop-blur-sm hover:bg-red-600/90 text-white px-6 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Limpar todas as localizaÃ§Ãµes para reimportar do Excel"
                >
                  <TrashIcon className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="font-medium">ðÅ¸â€”â€˜ï¸� Limpar Todas</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Painel de Busca e Filtros Moderno */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
            {/* Busca Principal */}
            <div className="flex-1">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors duration-200" />
                </div>
                <input
                  type="text"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  placeholder="Buscar por sÃ©rie, RG, raÃ§a ou piquete..."
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-700/50 border-0 rounded-2xl focus:ring-2 focus:ring-green-500 focus:bg-white dark:focus:bg-gray-700 transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-inner"
                />
              </div>
            </div>

            {/* Filtros AvanÃ§ados */}
            <div className="flex flex-wrap gap-3">
              <select
                value={filtroAvancado.piquete}
                onChange={(e) => setFiltroAvancado(prev => ({ ...prev, piquete: e.target.value }))}
                className="appearance-none bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-600 border-0 rounded-2xl px-4 py-3 pr-10 focus:ring-2 focus:ring-green-500 transition-all duration-300 text-gray-900 dark:text-white font-medium shadow-sm hover:shadow-md cursor-pointer"
              >
                <option value="">ðÅ¸�Å¾ï¸� Todos os Piquetes</option>
                {piquetesDisponiveis.map(piquete => (
                  <option key={piquete} value={piquete}>{piquete}</option>
                ))}
              </select>

              <select
                value={filtroAvancado.situacao}
                onChange={(e) => setFiltroAvancado(prev => ({ ...prev, situacao: e.target.value }))}
                className="appearance-none bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 border-0 rounded-2xl px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 transition-all duration-300 text-gray-900 dark:text-white font-medium shadow-sm hover:shadow-md cursor-pointer"
              >
                <option value="todas">ðÅ¸â€œÅ  Todas</option>
                <option value="ativas">âÅ“â€¦ Ativas</option>
                <option value="finalizadas">â�Å’ Finalizadas</option>
              </select>

              <select
                value={filtroAvancado.periodo}
                onChange={(e) => setFiltroAvancado(prev => ({ ...prev, periodo: e.target.value }))}
                className="appearance-none bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-700 dark:to-gray-600 border-0 rounded-2xl px-4 py-3 pr-10 focus:ring-2 focus:ring-purple-500 transition-all duration-300 text-gray-900 dark:text-white font-medium shadow-sm hover:shadow-md cursor-pointer"
              >
                <option value="7dias">ðÅ¸â€œâ€¦ ÃÅ¡ltimos 7 dias</option>
                <option value="30dias">ðÅ¸â€œâ€¦ ÃÅ¡ltimos 30 dias</option>
                <option value="90dias">ðÅ¸â€œâ€¦ ÃÅ¡ltimos 90 dias</option>
                <option value="todos">ðÅ¸â€œâ€¦ Todos</option>
              </select>
            </div>
          </div>

          {/* Contador de Resultados */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {animaisFiltrados.length} animal(is) ââ‚¬¢ {localizacoes.length} localizaÃ§Ã£o(Ãµes)
              </span>
            </div>
            {(filtro || filtroAvancado.piquete || filtroAvancado.situacao !== 'todas' || filtroAvancado.periodo !== '30dias') && (
              <button
                onClick={() => {
                  setFiltro('')
                  setFiltroAvancado({
                    piquete: '',
                    situacao: 'todas',
                    periodo: '30dias'
                  })
                }}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full transition-colors duration-200"
              >
                Limpar filtros âÅ“â€¢
              </button>
            )}
          </div>
        </div>

        {/* Grid de Animais com LocalizaÃ§Ã£o Atual */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                  <span className="text-3xl">ðÅ¸�â€ž</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Animais e LocalizaÃ§Ãµes
                  </h2>
                  <p className="text-green-100 mt-1">
                    LocalizaÃ§Ã£o atual de cada animal
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="text-center py-16">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl mx-auto flex items-center justify-center animate-pulse">
                    <MapPinIcon className="h-8 w-8 text-white animate-bounce" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-3xl animate-ping"></div>
                </div>
                <div className="mt-6 space-y-2">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Carregando localizaÃ§Ãµes...</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Buscando animais e suas posiÃ§Ãµes</p>
                </div>
              </div>
            ) : animaisFiltrados.length === 0 ? (
              <div className="text-center py-16">
                <div className="relative mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-3xl mx-auto flex items-center justify-center">
                    <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                    <span className="text-sm">ðÅ¸â€��</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Nenhum animal encontrado</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    {filtro ? 'Tente ajustar os filtros de busca' : 'Nenhum animal cadastrado no sistema'}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Controles de SeleÃ§Ã£o e PaginaÃ§Ã£o */}
                <div className="mb-4 flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center space-x-3 flex-wrap gap-2">
                    <button
                      onClick={() => {
                        const animaisAtivos = animaisPaginados.filter(animal => animal.situacao === 'Ativo')
                        const todosSelecionados = animaisAtivos.every(a => selectedAnimalsForBatch.includes(a.id))
                        if (todosSelecionados) {
                          // Desmarcar todos da pÃ¡gina atual
                          const idsParaRemover = animaisAtivos.map(a => a.id)
                          setSelectedAnimalsForBatch(prev => prev.filter(id => !idsParaRemover.includes(id)))
                        } else {
                          // Selecionar todos da pÃ¡gina atual
                          const idsParaAdicionar = animaisAtivos.map(a => a.id)
                          setSelectedAnimalsForBatch(prev => [...new Set([...prev, ...idsParaAdicionar])])
                        }
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105"
                    >
                      {animaisPaginados.filter(animal => animal.situacao === 'Ativo').every(a => selectedAnimalsForBatch.includes(a.id))
                        ? 'âËœâ€˜ï¸� Desmarcar PÃ¡gina'
                        : 'âËœ� Selecionar PÃ¡gina'}
                    </button>
                    <button
                      onClick={() => {
                        const todosAnimaisAtivos = animaisFiltrados.filter(animal => animal.situacao === 'Ativo')
                        const todosSelecionados = todosAnimaisAtivos.every(a => selectedAnimalsForBatch.includes(a.id))
                        if (todosSelecionados) {
                          // Desmarcar todos
                          setSelectedAnimalsForBatch([])
                        } else {
                          // Selecionar todos
                          setSelectedAnimalsForBatch(todosAnimaisAtivos.map(a => a.id))
                        }
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105"
                    >
                      {animaisFiltrados.filter(animal => animal.situacao === 'Ativo').every(a => selectedAnimalsForBatch.includes(a.id))
                        ? 'âËœâ€˜ï¸� Desmarcar Todos'
                        : 'âËœ� Selecionar Todos'}
                    </button>
                    {selectedAnimalsForBatch.length > 0 && (
                      <>
                        <span className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-xl text-sm font-bold border-2 border-green-400">
                          âÅ“â€œ {selectedAnimalsForBatch.length} animal(is) selecionado(s)
                        </span>
                        <button
                          onClick={() => {
                            setModalType('lote')
                            setShowModal(true)
                          }}
                          className="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl text-sm font-bold transition-all duration-200 transform hover:scale-105 flex items-center space-x-2 shadow-lg"
                        >
                          <MapPinIcon className="h-5 w-5" />
                          <span>ðÅ¸â€œ� Colocar {selectedAnimalsForBatch.length} em Local</span>
                        </button>
                        <button
                          onClick={() => setSelectedAnimalsForBatch([])}
                          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium transition-colors"
                        >
                          ðÅ¸â€”â€˜ï¸� Limpar SeleÃ§Ã£o
                        </button>
                      </>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>
                      PÃ¡gina {currentPage} de {totalPages || 1} ââ‚¬¢ {animaisFiltrados.length} animal(is) total
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {animaisPaginados.map((animal, index) => {
                    const localizacaoAtual = getLocalizacaoAtual(animal.id, animal)
                    const isSelected = selectedAnimalsForBatch.includes(animal.id)
                    const canSelect = animal.situacao === 'Ativo'
                    return (
                      <div 
                        key={animal.id} 
                        className={`group relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-6 hover:shadow-2xl transition-all duration-500 border-2 ${
                          isSelected 
                            ? 'border-green-500 dark:border-green-600 shadow-lg ring-2 ring-green-200 dark:ring-green-800' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600'
                        } transform hover:scale-105`}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        {/* Checkbox de SeleÃ§Ã£o */}
                        {canSelect && (
                          <div className="absolute top-4 right-4 z-10">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleAnimalSelection(animal.id)}
                              className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                            />
                          </div>
                        )}
                        
                        {/* Header do Card */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl flex items-center justify-center">
                            <span className="text-2xl">
                              {animal.sexo === 'Macho' ? 'ðÅ¸�â€š' : 'ðÅ¸�â€ž'}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                              {animal.serie} {animal.rg}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {animal.raca} ââ‚¬¢ {animal.sexo}
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-2xl text-xs font-semibold ${
                          animal.situacao === 'Ativo' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          {animal.situacao}
                        </span>
                      </div>

                      {/* LocalizaÃ§Ã£o Atual */}
                      <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center space-x-2 mb-2">
                          <MapPinIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm font-medium text-blue-800 dark:text-blue-300">LocalizaÃ§Ã£o Atual</span>
                        </div>
                        {localizacaoAtual ? (
                          <div>
                            <p className="font-semibold text-blue-900 dark:text-blue-200">
                              ðÅ¸â€œ� {localizacaoAtual.piquete}
                            </p>
                            {localizacaoAtual.data_entrada && (
                              <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                                Desde: {new Date(localizacaoAtual.data_entrada).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                            {localizacaoAtual.motivo_movimentacao && (
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                Motivo: {localizacaoAtual.motivo_movimentacao}
                              </p>
                            )}
                            {localizacaoAtual.observacoes && (
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 italic">
                                Obs: {localizacaoAtual.observacoes}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                            â�â€œ LocalizaÃ§Ã£o nÃ£o definida
                          </p>
                        )}
                      </div>

                      {/* AÃ§Ãµes */}
                      <div className="flex space-x-2">
                        {canSelect && (
                          <button
                            onClick={() => toggleAnimalSelection(animal.id)}
                            className={`px-3 py-2 rounded-2xl font-medium transition-all duration-300 ${
                              isSelected
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                            title={isSelected ? 'Desmarcar' : 'Selecionar'}
                          >
                            {isSelected ? 'âÅ“â€œ' : 'âËœ�'}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedAnimal(animal)
                            setModalType('transferir')
                            setNovaLocalizacao(prev => ({
                              ...prev,
                              data_entrada: new Date().toISOString().split('T')[0],
                              piquete: '',
                              motivo_movimentacao: '',
                              observacoes: ''
                            }))
                            setShowModal(true)
                          }}
                          disabled={transferringAnimal === animal.id}
                          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {transferringAnimal === animal.id ? (
                            <>
                              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>Transferindo...</span>
                            </>
                          ) : (
                            <>
                              <ArrowRightIcon className="h-4 w-4" />
                              <span>Transferir</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAnimal(animal)
                            setModalType('historico')
                            setShowModal(true)
                          }}
                          className="bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 p-2 rounded-2xl transition-all duration-300 hover:scale-110"
                          title="Ver histÃ³rico"
                        >
                          <ClockIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Controles de PaginaÃ§Ã£o */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center space-x-2 flex-wrap gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ââ€ � Anterior
                  </button>
                  
                  <div className="flex space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            currentPage === pageNum
                              ? 'bg-green-500 text-white'
                              : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    PrÃ³xima ââ€ â€™
                  </button>
                </div>
              )}
            </>
            )}
          </div>
        </div>

        {/* HistÃ³rico de MovimentaÃ§Ãµes */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                  <ClockIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    HistÃ³rico de MovimentaÃ§Ãµes
                  </h2>
                  <p className="text-purple-100 mt-1">
                    Todas as movimentaÃ§Ãµes registradas
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 via-purple-50 to-indigo-50 dark:from-gray-800 dark:via-purple-900/20 dark:to-indigo-900/20">
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <span>Animal</span>
                        <div className="w-1 h-1 bg-purple-500 rounded-full"></div>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <span>Piquete</span>
                        <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <span>PerÃ­odo</span>
                        <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <span>Status</span>
                        <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center justify-end space-x-1">
                        <span>AÃ§Ãµes</span>
                        <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {localizacoes.length > 0 ? localizacoes.map((localizacao, index) => (
                    <tr 
                      key={localizacao.id} 
                      className="group hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-indigo-50/50 dark:hover:from-purple-900/10 dark:hover:to-indigo-900/10 transition-all duration-300"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center">
                            <span className="text-lg">
                              {localizacao.sexo === 'Macho' ? 'ðÅ¸�â€š' : 'ðÅ¸�â€ž'}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white">
                              {localizacao.serie} {localizacao.rg}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {localizacao.raca}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 px-3 py-1 rounded-xl">
                            ðÅ¸â€œ� {localizacao.piquete}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            ðÅ¸â€œâ€¦ {new Date(localizacao.data_entrada).toLocaleDateString('pt-BR')}
                          </div>
                          {localizacao.data_saida && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              atÃ© {new Date(localizacao.data_saida).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                          {localizacao.motivo_movimentacao && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">
                              {localizacao.motivo_movimentacao}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-2xl text-xs font-semibold ${
                          localizacao.data_saida 
                            ? 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 dark:from-red-900/30 dark:to-pink-900/30 dark:text-red-300' 
                            : 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-300'
                        }`}>
                          {localizacao.data_saida ? 'â�Å’ Finalizada' : 'âÅ“â€¦ Ativa'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedLocalizacao(localizacao)
                              setModalType('editar')
                              setShowModal(true)
                            }}
                            className="group/btn p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded-xl transition-all duration-200 hover:scale-110"
                            title="Editar"
                          >
                            <PencilIcon className="h-4 w-4 group-hover/btn:animate-pulse" />
                          </button>
                          <PermissionGuard permission={permissions.canDelete}>
                            <button
                              onClick={() => excluirLocalizacao(localizacao.id)}
                              className="group/btn p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-xl transition-all duration-200 hover:scale-110"
                              title="Excluir"
                            >
                              <TrashIcon className="h-4 w-4 group-hover/btn:animate-bounce" />
                            </button>
                          </PermissionGuard>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-16 text-center">
                        <div className="space-y-3">
                          <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-3xl mx-auto flex items-center justify-center">
                            <ClockIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Nenhuma movimentaÃ§Ã£o encontrada</h3>
                          <p className="text-gray-500 dark:text-gray-400">
                            Registre a primeira localizaÃ§Ã£o de um animal
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal para MovimentaÃ§Ã£o em Lote - MELHORADO */}
        {showModal && modalType === 'lote' && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-2xl">
                      <DocumentTextIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">
                        ðÅ¸Å¡â‚¬ LocalizaÃ§Ã£o em Lote
                      </h3>
                      <p className="text-purple-100 text-sm">
                        Registre vÃ¡rios animais em um local especÃ­fico com data personalizada
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowModal(false)
                      setSelectedAnimalsForBatch([])
                      setFiltroModalAnimais('')
                      setModalListLimit(80)
                      setBatchMoveData({
                        piquete_destino: '',
                        data_movimentacao: new Date().toISOString().split('T')[0],
                        motivo_movimentacao: '',
                        observacoes: ''
                      })
                    }}
                    className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    âÅ“â€¢
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Primeiro: ConfiguraÃ§Ã£o da LocalizaÃ§Ã£o */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 mb-6 border border-green-200 dark:border-green-800">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                      <MapPinIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <h4 className="text-lg font-bold text-green-800 dark:text-green-200">
                      ðÅ¸â€œ� Configurar LocalizaÃ§Ã£o
                    </h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      <label className="block text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                        Local de Destino *
                      </label>
                      <div className="flex gap-2 items-stretch">
                        <select
                          value={batchMoveData.piquete_destino}
                          onChange={(e) => setBatchMoveData(prev => ({ ...prev, piquete_destino: e.target.value }))}
                          className="flex-1 px-4 py-3 bg-white dark:bg-gray-700 border border-green-300 dark:border-green-600 rounded-xl focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white font-medium min-w-0"
                          required
                        >
                          <option value="">ðÅ¸�Å¾ï¸� Selecione o local...</option>
                          {piquetesDisponiveis.map(piquete => (
                            <option key={piquete} value={piquete}>ðÅ¸â€œ� {piquete}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setShowNovoPiqueteModal(true)}
                          className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-1 whitespace-nowrap flex-shrink-0 min-w-[80px]"
                          title="Cadastrar novo piquete"
                        >
                          <PlusIcon className="h-5 w-5" />
                          <span className="text-sm">Novo</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                        Data da LocalizaÃ§Ã£o *
                      </label>
                      <input
                        type="date"
                        value={batchMoveData.data_movimentacao}
                        onChange={(e) => setBatchMoveData(prev => ({ ...prev, data_movimentacao: e.target.value }))}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-green-300 dark:border-green-600 rounded-xl focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                        Motivo (Opcional)
                      </label>
                      <input
                        type="text"
                        value={batchMoveData.motivo_movimentacao}
                        onChange={(e) => setBatchMoveData(prev => ({ ...prev, motivo_movimentacao: e.target.value }))}
                        placeholder="Ex: RotaÃ§Ã£o de pasto..."
                        className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-green-300 dark:border-green-600 rounded-xl focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                      ObservaÃ§Ãµes (Opcional)
                    </label>
                    <textarea
                      value={batchMoveData.observacoes}
                      onChange={(e) => setBatchMoveData(prev => ({ ...prev, observacoes: e.target.value }))}
                      placeholder="ObservaÃ§Ãµes sobre esta localizaÃ§Ã£o..."
                      rows={2}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-green-300 dark:border-green-600 rounded-xl focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                    />
                  </div>

                  {/* Resumo da ConfiguraÃ§Ã£o */}
                  {batchMoveData.piquete_destino && (
                    <div className="mt-4 p-4 bg-green-100 dark:bg-green-900/30 rounded-xl border border-green-300 dark:border-green-700">
                      <div className="flex items-center space-x-2 text-green-800 dark:text-green-200">
                        <span className="text-lg">âÅ“â€¦</span>
                        <span className="font-semibold">
                          LocalizaÃ§Ã£o configurada: <strong>{batchMoveData.piquete_destino}</strong> em <strong>{formatarDataBR(batchMoveData.data_movimentacao)}</strong>
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* SeleÃ§Ã£o de Animais - MELHORADA */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                        <span className="text-2xl">ðÅ¸�â€ž</span>
                        <span>Selecionar Animais</span>
                        <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full text-sm font-bold">
                          {selectedAnimalsForBatch.length}
                        </span>
                      </h4>
                    </div>

                    {/* Filtro rÃ¡pido de animais - MELHORADO */}
                    <div className="mb-4 space-y-2">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          placeholder="Digite o nÃºmero (sÃ©rie/RG) e pressione Enter para incluir"
                          value={filtroModalAnimais}
                          onChange={(e) => setFiltroModalAnimais(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              const animaisEncontrados = animaisFiltradosModal.filter(animal => animal.situacao === 'Ativo')
                              if (animaisEncontrados.length > 0) {
                                const idsParaAdicionar = animaisEncontrados.map(a => a.id)
                                setSelectedAnimalsForBatch(prev => [...new Set([...prev, ...idsParaAdicionar])])
                                setFiltroModalAnimais('')
                              }
                            }
                          }}
                          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-700 border-2 border-purple-200 dark:border-purple-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-sm"
                        />
                      </div>
                      {filtroModalAnimais && (
                        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 px-2">
                          <span>
                            {animaisFiltradosModal.filter(animal => animal.situacao === 'Ativo').length} animal(is) encontrado(s)
                          </span>
                          <button
                            onClick={() => setFiltroModalAnimais('')}
                            className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                          >
                            âÅ“â€¢ Limpar busca
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Controles de seleÃ§Ã£o rÃ¡pida */}
                    <div className="mb-4 flex items-center space-x-2 flex-wrap gap-2">
                      <button
                        onClick={() => {
                          const animaisAtivosFiltrados = animaisFiltradosModal.filter(animal => animal.situacao === 'Ativo')
                          const todosSelecionados = animaisAtivosFiltrados.every(a => selectedAnimalsForBatch.includes(a.id))
                          if (todosSelecionados) {
                            const idsParaRemover = animaisAtivosFiltrados.map(a => a.id)
                            setSelectedAnimalsForBatch(prev => prev.filter(id => !idsParaRemover.includes(id)))
                          } else {
                            const idsParaAdicionar = animaisAtivosFiltrados.map(a => a.id)
                            setSelectedAnimalsForBatch(prev => [...new Set([...prev, ...idsParaAdicionar])])
                          }
                        }}
                        className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-medium hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                      >
                        {animaisFiltradosModal.filter(animal => animal.situacao === 'Ativo').every(a => selectedAnimalsForBatch.includes(a.id))
                          ? 'âËœâ€˜ï¸� Desmarcar Filtrados'
                          : 'âËœ� Selecionar Filtrados'}
                      </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 bg-gray-50 dark:bg-gray-800/50">
                      {(() => {
                        const ativos = animaisFiltradosModal.filter(animal => animal.situacao === 'Ativo')
                        const exibidos = ativos.slice(0, modalListLimit)
                        const restantes = ativos.length - modalListLimit
                        return ativos.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-4xl mb-2">ðÅ¸â€��</div>
                          <p className="text-gray-500 dark:text-gray-400">
                            {filtroModalAnimais 
                              ? `Nenhum animal encontrado com "${filtroModalAnimais}"`
                              : 'Nenhum animal ativo disponÃ­vel'}
                          </p>
                          {filtroModalAnimais && (
                            <button
                              onClick={() => setFiltroModalAnimais('')}
                              className="mt-2 text-sm text-purple-600 dark:text-purple-400 hover:underline"
                            >
                              Limpar busca
                            </button>
                          )}
                        </div>
                      ) : (
                        <>
                        {exibidos.map(animal => {
                        const localizacaoAtual = mapaLocalizacaoPorAnimal.get(animal.id) || getLocalizacaoAtual(animal.id, animal)
                        const isSelected = selectedAnimalsForBatch.includes(animal.id)
                        
                        return (
                          <div
                            key={animal.id}
                            onClick={() => toggleAnimalSelection(animal.id)}
                            className={`p-3 rounded-xl cursor-pointer transition-all duration-200 transform hover:scale-[1.02] ${
                              isSelected 
                                ? 'bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/40 dark:to-indigo-900/40 border-2 border-purple-500 shadow-lg' 
                                : 'bg-white dark:bg-gray-700 border-2 border-transparent hover:border-purple-300 hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                                isSelected 
                                  ? 'bg-purple-500 border-purple-500 scale-110' 
                                  : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'
                              }`}>
                                {isSelected && <span className="text-white text-sm font-bold">âÅ“â€œ</span>}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-xl">
                                    {animal.sexo === 'Macho' ? 'ðÅ¸�â€š' : 'ðÅ¸�â€ž'}
                                  </span>
                                  <div>
                                    <div className="font-bold text-gray-900 dark:text-white">
                                      {animal.serie} {animal.rg}
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                      <div>
                                        {animal.raca} {animal.sexo && `ââ‚¬¢ ${animal.sexo}`}
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <MapPinIcon className="h-3 w-3 text-blue-500" />
                                        <span className="font-medium text-blue-600 dark:text-blue-400">
                                          {localizacaoAtual?.piquete || 'â�â€œ NÃ£o definido'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {isSelected && (
                                <div className="text-purple-500 animate-pulse flex-shrink-0">
                                  <span className="text-lg">ðÅ¸Å½¯</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                        })}
                        {restantes > 0 && (
                          <button
                            type="button"
                            onClick={() => setModalListLimit(prev => prev + 100)}
                            className="w-full py-3 mt-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-colors"
                          >
                            Carregar mais {Math.min(100, restantes)} de {restantes} restantes
                          </button>
                        )}
                        </>
                      )
                      })()}
                    </div>
                    
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          const animaisAtivos = animaisFiltrados.filter(animal => animal.situacao === 'Ativo')
                          setSelectedAnimalsForBatch(animaisAtivos.map(a => a.id))
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 text-purple-700 dark:text-purple-300 rounded-xl text-sm font-medium hover:from-purple-200 hover:to-indigo-200 dark:hover:from-purple-900/50 dark:hover:to-indigo-900/50 transition-all duration-200 transform hover:scale-105"
                      >
                        âÅ“â€¦ Selecionar Todos ({animaisFiltrados.filter(animal => animal.situacao === 'Ativo').length})
                      </button>
                      <button
                        onClick={() => setSelectedAnimalsForBatch([])}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        ðÅ¸â€”â€˜ï¸� Limpar SeleÃ§Ã£o
                      </button>
                      {selectedAnimalsForBatch.length > 0 && (
                        <div className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-xl text-sm font-bold">
                          ðÅ¸Å½¯ {selectedAnimalsForBatch.length} selecionado(s)
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Resumo e AÃ§Ãµes - MELHORADO */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                      <span className="text-2xl">ðÅ¸â€œâ€¹</span>
                      <span>Resumo da OperaÃ§Ã£o</span>
                    </h4>
                    
                    {/* Status da ConfiguraÃ§Ã£o */}
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-2xl border border-blue-200 dark:border-blue-800">
                        <h5 className="font-bold text-blue-800 dark:text-blue-200 mb-3 flex items-center space-x-2">
                          <span>ðÅ¸â€œÅ </span>
                          <span>Status da OperaÃ§Ã£o</span>
                        </h5>
                        
                        <div className="space-y-3">
                          {/* Local */}
                          <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">ðÅ¸â€œ�</span>
                              <span className="font-medium text-gray-700 dark:text-gray-300">Local:</span>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                              batchMoveData.piquete_destino 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            }`}>
                              {batchMoveData.piquete_destino || 'â�Å’ NÃ£o definido'}
                            </div>
                          </div>

                          {/* Data */}
                          <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">ðÅ¸â€œâ€¦</span>
                              <span className="font-medium text-gray-700 dark:text-gray-300">Data:</span>
                            </div>
                            <input
                              type="date"
                              value={batchMoveData.data_movimentacao}
                              onChange={(e) => setBatchMoveData(prev => ({ ...prev, data_movimentacao: e.target.value }))}
                              className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-xl text-sm font-bold border-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            />
                          </div>

                          {/* Animais */}
                          <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">ðÅ¸�â€ž</span>
                              <span className="font-medium text-gray-700 dark:text-gray-300">Animais:</span>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                              selectedAnimalsForBatch.length > 0 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            }`}>
                              {selectedAnimalsForBatch.length > 0 ? `${selectedAnimalsForBatch.length} selecionado(s)` : 'â�Å’ Nenhum selecionado'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Resumo Final */}
                      {selectedAnimalsForBatch.length > 0 && batchMoveData.piquete_destino && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-2xl border-2 border-green-300 dark:border-green-700 shadow-lg">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                              <span className="text-2xl">âÅ“â€¦</span>
                            </div>
                            <div>
                              <h5 className="font-bold text-green-800 dark:text-green-200 text-lg">
                                Pronto para Executar!
                              </h5>
                              <p className="text-green-600 dark:text-green-400 text-sm">
                                Todos os dados foram configurados corretamente
                              </p>
                            </div>
                          </div>
                          
                          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-green-200 dark:border-green-800">
                            <div className="text-green-800 dark:text-green-200 space-y-2">
                              <p className="flex items-center space-x-2">
                                <span className="font-bold">ðÅ¸Å½¯ OperaÃ§Ã£o:</span>
                                <span>Registrar <strong>{selectedAnimalsForBatch.length}</strong> animal(is) em <strong>{batchMoveData.piquete_destino}</strong></span>
                              </p>
                              <p className="flex items-center space-x-2">
                                <span className="font-bold">ðÅ¸â€œâ€¦ Data:</span>
                                <span><strong>{formatarDataBR(batchMoveData.data_movimentacao)}</strong></span>
                              </p>
                              {batchMoveData.motivo_movimentacao && (
                                <p className="flex items-center space-x-2">
                                  <span className="font-bold">ðÅ¸â€œ� Motivo:</span>
                                  <span><strong>{batchMoveData.motivo_movimentacao}</strong></span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Lista de Animais Selecionados */}
                      {selectedAnimalsForBatch.length > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
                          <h6 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center space-x-2">
                            <span>ðÅ¸�â€ž</span>
                            <span>Animais Selecionados ({selectedAnimalsForBatch.length})</span>
                          </h6>
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {selectedAnimalsForBatch.map(animalId => {
                              const animal = animais.find(a => a.id === animalId)
                              if (!animal) return null
                              return (
                                <div key={animalId} className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700 p-2 rounded-lg group">
                                  <div className="flex items-center space-x-2">
                                    <span>{animal.sexo === 'Macho' ? 'ðÅ¸�â€š' : 'ðÅ¸�â€ž'}</span>
                                    <span className="font-medium">{animal.serie} {animal.rg}</span>
                                    <span className="text-xs">({animal.raca})</span>
                                  </div>
                                  <button
                                    onClick={() => setSelectedAnimalsForBatch(prev => prev.filter(id => id !== animalId))}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                    title="Remover da lista"
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* BotÃµes de AÃ§Ã£o */}
                      <div className="flex space-x-3 pt-4">
                        <button
                          onClick={moverAnimaisEmLote}
                          disabled={selectedAnimalsForBatch.length === 0 || !batchMoveData.piquete_destino || batchMoving}
                          className={`flex-1 px-6 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform ${
                            selectedAnimalsForBatch.length === 0 || !batchMoveData.piquete_destino || batchMoving
                              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white hover:scale-105 shadow-lg hover:shadow-xl'
                          }`}
                        >
                          {batchMoving ? (
                            <span className="flex items-center justify-center space-x-2">
                              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>Movendo {selectedAnimalsForBatch.length} animais...</span>
                            </span>
                          ) : selectedAnimalsForBatch.length === 0 || !batchMoveData.piquete_destino ? (
                            <>ðÅ¸Å¡« Configure os dados acima</>
                          ) : (
                            <>ðÅ¸Å¡â‚¬ Registrar {selectedAnimalsForBatch.length} Animal(is)</>
                          )}
                        </button>
                        
                        {/* Progress Bar para MovimentaÃ§Ã£o em Lote */}
                        {batchMoving && batchProgress > 0 && (
                          <div className="mt-4 space-y-2">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${batchProgress}%` }}
                              />
                            </div>
                            {transferStatus && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 animate-pulse text-center font-medium">
                                {transferStatus}
                              </p>
                            )}
                          </div>
                        )}
                        <button
                          onClick={() => {
                            setShowModal(false)
                            setSelectedAnimalsForBatch([])
                            setFiltroModalAnimais('') // Limpar filtro do modal
                            setBatchMoveData({
                              piquete_destino: '',
                              data_movimentacao: new Date().toISOString().split('T')[0],
                              motivo_movimentacao: '',
                              observacoes: ''
                            })
                          }}
                          className="px-6 py-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          â�Å’ Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal para Nova LocalizaÃ§Ã£o/TransferÃªncia */}
        {showModal && (modalType === 'nova' || modalType === 'transferir') && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-2xl">
                      {modalType === 'nova' ? <PlusIcon className="h-6 w-6 text-white" /> : <ArrowRightIcon className="h-6 w-6 text-white" />}
                    </div>
                    <h3 className="text-xl font-bold text-white">
                      {modalType === 'nova' ? 'Nova LocalizaÃ§Ã£o' : `Transferir ${selectedAnimal?.serie} ${selectedAnimal?.rg}`}
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    âÅ“â€¢
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {modalType === 'nova' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ðÅ¸�â€ž Animal
                    </label>
                    <select
                      value={novaLocalizacao.animal_id}
                      onChange={(e) => setNovaLocalizacao(prev => ({ ...prev, animal_id: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-0 rounded-2xl focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                      required
                    >
                      <option value="">Selecione um animal...</option>
                      {animais.map(animal => (
                        <option key={animal.id} value={animal.id}>
                          {animal.serie} {animal.rg} - {animal.raca}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ðÅ¸â€œ� Piquete de Destino
                  </label>
                  <div className="flex gap-2 items-stretch">
                    <select
                      value={novaLocalizacao.piquete}
                      onChange={(e) => {
                        setNovaLocalizacao(prev => ({ ...prev, piquete: e.target.value }))
                      }}
                      className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-700 border-0 rounded-2xl focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white min-w-0"
                      required
                    >
                      <option value="">Selecione um piquete...</option>
                      {piquetesDisponiveis.map(piquete => (
                        <option key={piquete} value={piquete}>{piquete}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowNovoPiqueteModal(true)}
                      className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-2xl font-bold transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-1 whitespace-nowrap flex-shrink-0 min-w-[80px]"
                      title="Cadastrar novo piquete"
                    >
                      <PlusIcon className="h-5 w-5" />
                      <span className="text-sm">Novo</span>
                    </button>
                  </div>
                </div>

                {(modalType === 'nova' || modalType === 'transferir') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ðÅ¸â€œâ€¦ Data de Entrada
                      </label>
                      <input
                        type="date"
                        value={novaLocalizacao.data_entrada}
                        onChange={(e) => setNovaLocalizacao(prev => ({ ...prev, data_entrada: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-0 rounded-2xl focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                    
                    {modalType === 'transferir' && selectedAnimal && novaLocalizacao.piquete && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                        <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">ðÅ¸â€�� Preview da TransferÃªncia</h4>
                        <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                          <p><strong>Animal:</strong> {selectedAnimal.serie} {selectedAnimal.rg}</p>
                          <p><strong>LocalizaÃ§Ã£o Atual:</strong> {getLocalizacaoAtual(selectedAnimal.id, selectedAnimal)?.piquete || 'NÃ£o definida'}</p>
                          <p><strong>Nova LocalizaÃ§Ã£o:</strong> {novaLocalizacao.piquete}</p>
                          <p><strong>Data:</strong> {formatarDataBR(novaLocalizacao.data_entrada)}</p>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ðÅ¸â€œ� Motivo da MovimentaÃ§Ã£o
                      </label>
                      <input
                        type="text"
                        value={novaLocalizacao.motivo_movimentacao}
                        onChange={(e) => setNovaLocalizacao(prev => ({ ...prev, motivo_movimentacao: e.target.value }))}
                        placeholder="Ex: RotaÃ§Ã£o de pasto, tratamento..."
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-0 rounded-2xl focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ðÅ¸â€™¬ ObservaÃ§Ãµes
                      </label>
                      <textarea
                        value={novaLocalizacao.observacoes}
                        onChange={(e) => setNovaLocalizacao(prev => ({ ...prev, observacoes: e.target.value }))}
                        placeholder="ObservaÃ§Ãµes adicionais..."
                        rows={3}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-0 rounded-2xl focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                      />
                    </div>

                    <div className="flex space-x-3 pt-4">
                      {modalType === 'nova' ? (
                        <button
                          onClick={criarLocalizacao}
                          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-2xl font-medium transition-all duration-300 transform hover:scale-105"
                        >
                          âÅ“â€¦ Registrar LocalizaÃ§Ã£o
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (selectedAnimal && novaLocalizacao.piquete) {
                              const localizacaoAtual = getLocalizacaoAtual(selectedAnimal.id, selectedAnimal)
                              if (localizacaoAtual && localizacaoAtual.piquete === novaLocalizacao.piquete) {
                                alert('âÅ¡ ï¸� O animal jÃ¡ estÃ¡ neste piquete!')
                                return
                              }
                              transferirAnimal(
                                selectedAnimal.id, 
                                novaLocalizacao.piquete, 
                                novaLocalizacao.motivo_movimentacao || 'TransferÃªncia via sistema',
                                selectedAnimal,
                                novaLocalizacao.data_entrada
                              )
                              setShowModal(false)
                            }
                          }}
                          disabled={!novaLocalizacao.piquete || transferringAnimal === selectedAnimal?.id}
                          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {transferringAnimal === selectedAnimal?.id ? (
                            <span className="flex items-center justify-center space-x-2">
                              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>Transferindo...</span>
                            </span>
                          ) : (
                            'âÅ“â€¦ Confirmar TransferÃªncia'
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setShowModal(false)
                          setNovaLocalizacao({
                            animal_id: '',
                            piquete: '',
                            data_entrada: new Date().toISOString().split('T')[0],
                            motivo_movimentacao: '',
                            observacoes: '',
                            usuario_responsavel: 'Sistema'
                          })
                        }}
                        className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                    
                    {/* Progress Bar para TransferÃªncia */}
                    {transferringAnimal === selectedAnimal?.id && transferProgress > 0 && (
                      <div className="mt-4 space-y-2">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className="bg-green-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${transferProgress}%` }}
                          />
                        </div>
                        {transferStatus && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 animate-pulse text-center">
                            {transferStatus}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal de HistÃ³rico */}
        {showModal && modalType === 'historico' && selectedAnimal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-2xl">
                      <ClockIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        HistÃ³rico de {selectedAnimal.serie} {selectedAnimal.rg}
                      </h3>
                      <p className="text-blue-100 text-sm">
                        {selectedAnimal.raca} ââ‚¬¢ {selectedAnimal.sexo}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    âÅ“â€¢
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {localizacoes
                    .filter(loc => loc.animal_id === selectedAnimal.id)
                    .sort((a, b) => new Date(b.data_entrada) - new Date(a.data_entrada))
                    .map((loc, index) => (
                      <div key={loc.id} className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              ðÅ¸â€œ� {loc.piquete}
                            </h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              loc.data_saida 
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
                                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            }`}>
                              {loc.data_saida ? 'Finalizada' : 'Atual'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                            <p>ðÅ¸â€œâ€¦ Entrada: {new Date(loc.data_entrada).toLocaleDateString('pt-BR')}</p>
                            {loc.data_saida && (
                              <p>ðÅ¸â€œâ€¦ SaÃ­da: {new Date(loc.data_saida).toLocaleDateString('pt-BR')}</p>
                            )}
                            {loc.motivo_movimentacao && (
                              <p>ðÅ¸â€œ� Motivo: {loc.motivo_movimentacao}</p>
                            )}
                            {loc.observacoes && (
                              <p>ðÅ¸â€™¬ Obs: {loc.observacoes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  
                  {localizacoes.filter(loc => loc.animal_id === selectedAnimal.id).length === 0 && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto flex items-center justify-center mb-4">
                        <MapPinIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">
                        Nenhuma movimentaÃ§Ã£o registrada para este animal
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal para Gerenciar Locais */}
        {showLocationModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-2xl">
                      <MapPinIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">
                        ðÅ¸�Å¾ï¸� Gerenciar Locais
                      </h3>
                      <p className="text-orange-100 text-sm">
                        Adicione ou remova locais disponÃ­veis para localizaÃ§Ã£o
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowLocationModal(false)
                      setNewLocationName('')
                      setLocationToDelete('')
                    }}
                    className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    âÅ“â€¢
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Adicionar Novo Local */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                        <PlusIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <h4 className="text-lg font-bold text-green-800 dark:text-green-200">
                        âÅ¾â€¢ Adicionar Novo Local
                      </h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                          Nome do Local *
                        </label>
                        <input
                          type="text"
                          value={newLocationName}
                          onChange={(e) => setNewLocationName(e.target.value)}
                          placeholder="Ex: Piquete 6, Pasto E, Curral 4..."
                          className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-green-300 dark:border-green-600 rounded-xl focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          onKeyPress={(e) => e.key === 'Enter' && adicionarLocal()}
                        />
                      </div>
                      
                      <button
                        onClick={adicionarLocal}
                        disabled={!newLocationName.trim()}
                        className={`w-full px-6 py-3 rounded-2xl font-bold transition-all duration-300 transform ${
                          newLocationName.trim()
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white hover:scale-105 shadow-lg'
                            : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {newLocationName.trim() ? 'âÅ“â€¦ Adicionar Local' : 'ðÅ¸â€œ� Digite o nome do local'}
                      </button>
                    </div>

                    <div className="mt-4 p-4 bg-green-100 dark:bg-green-900/30 rounded-xl border border-green-300 dark:border-green-700">
                      <div className="flex items-center space-x-2 text-green-800 dark:text-green-200 text-sm">
                        <span className="text-lg">ðÅ¸â€™¡</span>
                        <div>
                          <p className="font-semibold">Dicas para nomes de locais:</p>
                          <p>ââ‚¬¢ Use nomes descritivos (ex: "Piquete Norte", "Pasto da Aguada")</p>
                          <p>ââ‚¬¢ Evite caracteres especiais</p>
                          <p>ââ‚¬¢ Seja consistente com a numeraÃ§Ã£o</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lista de Locais Existentes */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                        <EyeIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h4 className="text-lg font-bold text-blue-800 dark:text-blue-200">
                        ðÅ¸â€œâ€¹ Locais Existentes ({piquetesDisponiveis.length})
                      </h4>
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto space-y-2">
                      {piquetesDisponiveis.map((local, index) => {
                        const animaisNoLocal = localizacoes.filter(loc => 
                          loc.piquete === local && !loc.data_saida
                        ).length
                        
                        return (
                          <div
                            key={local}
                            className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-xl border border-blue-200 dark:border-blue-700 hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                  {index + 1}
                                </span>
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 dark:text-white">
                                  ðÅ¸â€œ� {local}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {animaisNoLocal > 0 ? (
                                    <span className="text-green-600 dark:text-green-400 font-medium">
                                      ðÅ¸�â€ž {animaisNoLocal} animal(is) atual
                                    </span>
                                  ) : (
                                    <span className="text-gray-500">
                                      ðÅ¸â€œ­ Vazio
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <PermissionGuard permission={permissions.canDelete}>
                              <button
                                onClick={() => excluirLocal(local)}
                                disabled={animaisNoLocal > 0 || !permissions.canDelete}
                                className={`p-2 rounded-xl transition-all duration-200 ${
                                  animaisNoLocal > 0 || !permissions.canDelete
                                    ? 'bg-gray-100 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                    : 'bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 hover:scale-110'
                                }`}
                                title={
                                  !permissions.canDelete 
                                    ? permissions.getPermissionMessage('excluir')
                                    : animaisNoLocal > 0 
                                    ? 'NÃ£o Ã© possÃ­vel excluir - hÃ¡ animais neste local' 
                                    : 'Excluir local'
                                }
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </PermissionGuard>
                          </div>
                        )
                      })}
                    </div>

                    <div className="mt-4 p-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl border border-blue-300 dark:border-blue-700">
                      <div className="flex items-center space-x-2 text-blue-800 dark:text-blue-200 text-sm">
                        <span className="text-lg">âÅ¡ ï¸�</span>
                        <div>
                          <p className="font-semibold">Importante:</p>
                          <p>ââ‚¬¢ Locais com animais nÃ£o podem ser excluÃ­dos</p>
                          <p>ââ‚¬¢ Transfira os animais antes de excluir um local</p>
                          <p>ââ‚¬¢ A exclusÃ£o Ã© permanente e nÃ£o pode ser desfeita</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* EstatÃ­sticas */}
                <div className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                      <span className="text-lg">ðÅ¸â€œÅ </span>
                    </div>
                    <h4 className="text-lg font-bold text-purple-800 dark:text-purple-200">
                      EstatÃ­sticas dos Locais
                    </h4>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-700 p-4 rounded-xl text-center border border-purple-200 dark:border-purple-700">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {piquetesDisponiveis.length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Total de Locais
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-700 p-4 rounded-xl text-center border border-purple-200 dark:border-purple-700">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {piquetesDisponiveis.filter(local => {
                          const animaisNoLocal = localizacoes.filter(loc => 
                            loc.piquete === local && !loc.data_saida
                          ).length
                          return animaisNoLocal > 0
                        }).length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Com Animais
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-700 p-4 rounded-xl text-center border border-purple-200 dark:border-purple-700">
                      <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                        {piquetesDisponiveis.filter(local => {
                          const animaisNoLocal = localizacoes.filter(loc => 
                            loc.piquete === local && !loc.data_saida
                          ).length
                          return animaisNoLocal === 0
                        }).length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Vazios
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-700 p-4 rounded-xl text-center border border-purple-200 dark:border-purple-700">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {localizacoes.filter(loc => !loc.data_saida).length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Animais Localizados
                      </div>
                    </div>
                  </div>
                </div>

                {/* BotÃ£o Fechar */}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => {
                      setShowLocationModal(false)
                      setNewLocationName('')
                      setLocationToDelete('')
                    }}
                    className="px-8 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-2xl font-bold transition-all duration-300 transform hover:scale-105"
                  >
                    âÅ“â€¦ ConcluÃ­do
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* InformaÃ§Ãµes */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-blue-400 p-6 rounded-2xl">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400">ââ€ž¹ï¸�</span>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                Sistema de LocalizaÃ§Ã£o Inteligente
              </h4>
              <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <p>ââ‚¬¢ <strong>LocalizaÃ§Ã£o Atual:</strong> Sempre mostra a posiÃ§Ã£o mais recente de cada animal</p>
                <p>ââ‚¬¢ <strong>HistÃ³rico Completo:</strong> Registra todas as movimentaÃ§Ãµes com data e motivo</p>
                <p>ââ‚¬¢ <strong>TransferÃªncia RÃ¡pida:</strong> Mova animais entre piquetes com um clique</p>
                <p>ââ‚¬¢ <strong>Filtros AvanÃ§ados:</strong> Encontre animais por localizaÃ§Ã£o, perÃ­odo ou status</p>
                <p>ââ‚¬¢ <strong>Gerenciar Locais:</strong> Adicione ou remova locais conforme necessÃ¡rio</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de SeleÃ§Ã£o de Campos para ExportaÃ§Ã£o */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-500 to-emerald-600">
              <div className="flex items-center space-x-3">
                <DocumentTextIcon className="h-6 w-6 text-white" />
                <h3 className="text-xl font-bold text-white">
                  Selecionar Campos para ExportaÃ§Ã£o
                </h3>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white/20 rounded-xl"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* ConteÃºdo */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>ââ€ž¹ï¸� Selecione os campos</strong> que deseja incluir no arquivo Excel. 
                  {exportType === 'piquete' && (selectedPiqueteExport ? ` Exportando animais do piquete: ${selectedPiqueteExport}` : ' Selecione um piquete abaixo.')}
                  {exportType === 'geral' && ' Exportando todos os animais filtrados.'}
                </p>
              </div>

              {/* Seletor de Formato */}
              <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-700">
                <h4 className="text-sm font-bold text-purple-800 dark:text-purple-300 mb-3 flex items-center">
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  Formato do Arquivo
                </h4>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="excel"
                      checked={exportFormat === 'excel'}
                      onChange={(e) => setExportFormat(e.target.value)}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Excel (.xlsx)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="pdf"
                      checked={exportFormat === 'pdf'}
                      onChange={(e) => setExportFormat(e.target.value)}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">PDF (.pdf)</span>
                  </label>
                </div>
              </div>

              {/* Seletor de Piquete (apenas se for exportaÃ§Ã£o por piquete) */}
              {exportType === 'piquete' && (
                <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700">
                  <h4 className="text-sm font-bold text-green-800 dark:text-green-300 mb-3 flex items-center">
                    <MapPinIcon className="h-4 w-4 mr-2" />
                    Selecione o Piquete
                  </h4>
                  <select
                    value={selectedPiqueteExport}
                    onChange={(e) => setSelectedPiqueteExport(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-green-300 dark:border-green-600 rounded-xl focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                  >
                    <option value="">Selecione um piquete...</option>
                    {[...new Set(animais.map(a => getLocalizacaoAtual(a.id, a)?.piquete).filter(Boolean))].sort().map(piquete => (
                      <option key={piquete} value={piquete}>{piquete}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Filtro de PerÃ­odo para ExportaÃ§Ã£o */}
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                  <ClockIcon className="h-4 w-4 mr-2" />
                  Filtrar por Data de Entrada
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      De
                    </label>
                    <input
                      type="date"
                      value={exportDateRange.start}
                      onChange={(e) => setExportDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      AtÃ©
                    </label>
                    <input
                      type="date"
                      value={exportDateRange.end}
                      onChange={(e) => setExportDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* BotÃ£o Selecionar Todos */}
              <div className="mb-4">
                <button
                  onClick={toggleTodosCampos}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all duration-200"
                >
                  {Object.values(selectedFields).every(v => v) ? 'âËœ� Desmarcar Todos' : 'âËœâ€˜ Selecionar Todos'}
                </button>
                <span className="ml-4 text-sm text-gray-600 dark:text-gray-400">
                  {Object.values(selectedFields).filter(v => v).length} de {Object.keys(selectedFields).length} campos selecionados
                </span>
              </div>

              {/* Lista de Campos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.keys(selectedFields).map((campo) => (
                  <label
                    key={campo}
                    className={`flex items-center space-x-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      selectedFields[campo]
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                        : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFields[campo]}
                      onChange={(e) => {
                        setSelectedFields(prev => ({
                          ...prev,
                          [campo]: e.target.checked
                        }))
                      }}
                      className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                    />
                    <span className={`font-medium ${
                      selectedFields[campo]
                        ? 'text-green-800 dark:text-green-200'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {campo}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarExportacao}
                disabled={Object.values(selectedFields).filter(v => v).length === 0}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                âÅ“â€¦ Exportar ({Object.values(selectedFields).filter(v => v).length} campo(s))
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cadastro RÃ¡pido de Piquete */}
      {showNovoPiqueteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-2xl">
                    <PlusIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      âÅ¾â€¢ Cadastrar Novo Piquete
                    </h3>
                    <p className="text-green-100 text-sm">
                      Cadastre um novo piquete no banco de dados
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowNovoPiqueteModal(false)
                    setNovoPiqueteData({
                      nome: '',
                      area: '',
                      capacidade: '',
                      tipo: '',
                      observacoes: ''
                    })
                  }}
                  className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  âÅ“â€¢
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Nome do Piquete (obrigatÃ³rio) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome do Piquete *
                </label>
                <input
                  type="text"
                  value={novoPiqueteData.nome}
                  onChange={(e) => handlePiqueteFieldChange('nome', e.target.value)}
                  placeholder="Ex: Piquete 18, Piquete Norte..."
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  required
                  autoFocus
                />
              </div>

              {/* Campos opcionais em grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ã�rea */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ã�rea (hectares)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={novoPiqueteData.area}
                    onChange={(e) => handlePiqueteFieldChange('area', e.target.value)}
                    placeholder="Ex: 5.5"
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>

                {/* Capacidade */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Capacidade (cabeÃ§as)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={novoPiqueteData.capacidade}
                    onChange={(e) => handlePiqueteFieldChange('capacidade', e.target.value)}
                    placeholder="Ex: 50"
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo
                </label>
                <input
                  type="text"
                  value={novoPiqueteData.tipo}
                  onChange={(e) => handlePiqueteFieldChange('tipo', e.target.value)}
                  placeholder="Ex: Pastagem, RotaÃ§Ã£o, Repouso..."
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              {/* ObservaÃ§Ãµes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ObservaÃ§Ãµes
                </label>
                <textarea
                  value={novoPiqueteData.observacoes}
                  onChange={(e) => handlePiqueteFieldChange('observacoes', e.target.value)}
                  placeholder="InformaÃ§Ãµes adicionais sobre o piquete..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                />
              </div>

              {/* Dica */}
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <div className="flex items-start space-x-2 text-green-800 dark:text-green-200 text-sm">
                  <span className="text-lg">ðÅ¸â€™¡</span>
                  <div>
                    <p className="font-semibold mb-1">Dicas:</p>
                    <p>ââ‚¬¢ Apenas o nome Ã© obrigatÃ³rio. Os demais campos sÃ£o opcionais.</p>
                    <p>ââ‚¬¢ O piquete serÃ¡ automaticamente selecionado apÃ³s o cadastro.</p>
                    <p>ââ‚¬¢ Todos os dados sÃ£o salvos no banco de dados PostgreSQL.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <button
                onClick={() => {
                  setShowNovoPiqueteModal(false)
                  setNovoPiqueteData({
                    nome: '',
                    area: '',
                    capacidade: '',
                    tipo: '',
                    observacoes: ''
                  })
                }}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all duration-200"
                disabled={criandoPiquete}
              >
                Cancelar
              </button>
              <button
                onClick={criarNovoPiquete}
                disabled={!novoPiqueteData.nome.trim() || criandoPiquete}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
              >
                {criandoPiquete ? (
                  <>
                    <span className="animate-spin">â�³</span>
                    <span>Cadastrando...</span>
                  </>
                ) : (
                  <>
                    <PlusIcon className="h-5 w-5" />
                    <span>Cadastrar Piquete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de ImportaÃ§Ã£o de Texto */}
      {showImportTextModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                    <DocumentTextIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Importar LocalizaÃ§Ãµes via Texto</h3>
                    <p className="text-green-100 text-sm mt-1">Cole os dados copiados do Excel</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowImportTextModal(false)
                    setImportText('')
                  }}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors duration-200"
                  disabled={importandoTexto}
                >
                  <XMarkIcon className="h-6 w-6 text-white" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* InstruÃ§Ãµes */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-start space-x-2 text-blue-800 dark:text-blue-200 text-sm">
                  <span className="text-lg">ââ€ž¹ï¸�</span>
                  <div>
                    <p className="font-semibold mb-2">Como usar:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Selecione as colunas no Excel: SÃâ€°RIE, RG, LOCAL (e opcionalmente OBSERVAÃâ€¡Ãâ€¢ES)</li>
                      <li>Copie os dados selecionados (Ctrl+C)</li>
                      <li>Cole no campo abaixo (Ctrl+V)</li>
                      <li>Clique em "Importar"</li>
                    </ol>
                    <p className="mt-2 font-medium">Formato esperado por linha:</p>
                    <code className="block mt-1 p-2 bg-white dark:bg-gray-800 rounded">SÃâ€°RIE    RG    LOCAL    [OBSERVAÃâ€¡Ãâ€¢ES]</code>
                  </div>
                </div>
              </div>

              {/* Campo de texto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cole os dados aqui:
                </label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Cole aqui os dados copiados do Excel...&#10;&#10;Exemplo:&#10;NACION    15397    PIQUETE 1&#10;NERO    DO MORRO    PIQUETE 2    Animal em observaÃ§Ã£o"
                  rows={12}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 font-mono text-sm resize-none"
                  disabled={importandoTexto}
                  autoFocus
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {importText.trim() ? `${importText.trim().split('\n').length} linha(s) detectada(s)` : 'Aguardando dados...'}
                </p>
              </div>

              {/* Exemplo visual */}
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Exemplo de dados vÃ¡lidos (copie do Excel):</p>
                <pre className="text-xs text-gray-600 dark:text-gray-400 font-mono overflow-x-auto">
CJCJ 1    17207    PIQUETE 1
CJCJ 2    17215    PIQUETE 1
EAGB      6058     PIQUETE 1
                </pre>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  ðÅ¸â€™¡ Dica: Selecione as 3 colunas no Excel (SÃâ€°RIE, RG, LOCAL) e cole aqui com Ctrl+V
                </p>
              </div>

              {/* Debug: mostrar como os dados serÃ£o parseados */}
              {importText.trim() && (
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">Preview do que serÃ¡ importado:</p>
                  <div className="max-h-40 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-purple-100 dark:bg-purple-900/40 sticky top-0">
                        <tr>
                          <th className="px-2 py-1 text-left text-purple-900 dark:text-purple-100">Linha</th>
                          <th className="px-2 py-1 text-left text-purple-900 dark:text-purple-100">SÃ©rie</th>
                          <th className="px-2 py-1 text-left text-purple-900 dark:text-purple-100">RG</th>
                          <th className="px-2 py-1 text-left text-purple-900 dark:text-purple-100">Local</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-200 dark:divide-purple-800">
                        {importText.trim().split('\n').filter(l => l.trim()).slice(0, 10).map((linha, idx) => {
                          let partes = linha.trim().split(/\t+/).filter(p => p.trim())
                          if (partes.length < 3) partes = linha.trim().split(/\s{2,}/).filter(p => p.trim())
                          if (partes.length < 3) partes = linha.trim().split(/\s+/).filter(p => p.trim())
                          let localPreview = partes[2] || 'â�Å’'
                          if (partes.length >= 4 && /^\d+$/.test(partes[3]) && (/^(PIQUETE|PTO|P|PASTO|PTOUFTF)$/i.test(partes[2]) || /^[A-Za-z]+$/.test(partes[2]))) {
                            localPreview = `${partes[2]} ${partes[3]}`
                          }
                          return (
                            <tr key={idx} className={partes.length < 3 ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                              <td className="px-2 py-1 text-purple-900 dark:text-purple-100">{idx + 1}</td>
                              <td className="px-2 py-1 text-purple-900 dark:text-purple-100 font-semibold">{partes[0] || 'â�Å’'}</td>
                              <td className="px-2 py-1 text-purple-900 dark:text-purple-100 font-semibold">{partes[1] || 'â�Å’'}</td>
                              <td className="px-2 py-1 text-purple-900 dark:text-purple-100">{localPreview}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    {importText.trim().split('\n').filter(l => l.trim()).length > 10 && (
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 text-center">
                        ... e mais {importText.trim().split('\n').filter(l => l.trim()).length - 10} linhas
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              {errosImportacao && (
                <button
                  onClick={() => setShowErrosImportacao(true)}
                  className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 flex items-center space-x-2"
                >
                  <DocumentTextIcon className="h-5 w-5" />
                  <span>Ver Detalhes dos Erros</span>
                </button>
              )}
              <button
                onClick={() => {
                  setShowImportTextModal(false)
                  setImportText('')
                  setErrosImportacao(null)
                }}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all duration-200"
                disabled={importandoTexto}
              >
                Cancelar
              </button>
              <button
                onClick={handleImportarTexto}
                disabled={!importText.trim() || importandoTexto}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
              >
                {importandoTexto ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Importando...</span>
                  </>
                ) : (
                  <>
                    <DocumentTextIcon className="h-5 w-5" />
                    <span>Importar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Erros de ImportaÃ§Ã£o */}
      {showErrosImportacao && errosImportacao && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 to-red-600 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                    <DocumentTextIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Detalhes da ImportaÃ§Ã£o</h3>
                    <p className="text-orange-100 text-sm mt-1">
                      {errosImportacao.animaisAtualizados} importados, {(errosImportacao.naoEncontrados?.length || 0) + (errosImportacao.erros?.length || 0)} com problemas
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowErrosImportacao(false)
                    setErrosImportacao(null)
                    setShowImportTextModal(false)
                    setImportText('')
                  }}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors duration-200"
                >
                  <XMarkIcon className="h-6 w-6 text-white" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Resumo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <div className="text-green-600 dark:text-green-400 text-sm font-medium">Total de Linhas</div>
                  <div className="text-3xl font-bold text-green-700 dark:text-green-300 mt-1">
                    {errosImportacao.totalLinhas || 0}
                  </div>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="text-blue-600 dark:text-blue-400 text-sm font-medium">Importados com Sucesso</div>
                  <div className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                    {errosImportacao.animaisAtualizados || 0}
                  </div>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                  <div className="text-red-600 dark:text-red-400 text-sm font-medium">Com Problemas</div>
                  <div className="text-3xl font-bold text-red-700 dark:text-red-300 mt-1">
                    {(errosImportacao.naoEncontrados?.length || 0) + (errosImportacao.erros?.length || 0)}
                  </div>
                </div>
              </div>

              {/* Animais nÃ£o encontrados */}
              {errosImportacao.naoEncontrados && errosImportacao.naoEncontrados.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                    <span>ðÅ¸â€��</span>
                    <span>Animais NÃ£o Encontrados ({errosImportacao.naoEncontrados.length})</span>
                  </h4>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-yellow-100 dark:bg-yellow-900/40">
                          <tr>
                            <th className="px-2 py-3 text-center w-10">
                              <input
                                type="checkbox"
                                checked={errosImportacao.naoEncontrados.every((_, i) => itensFalhaSelecionados.has(`nao-${i}`))}
                                onChange={(e) => {
                                  const sel = new Set(itensFalhaSelecionados)
                                  if (e.target.checked) {
                                    errosImportacao.naoEncontrados.forEach((_, i) => sel.add(`nao-${i}`))
                                  } else {
                                    errosImportacao.naoEncontrados.forEach((_, i) => sel.delete(`nao-${i}`))
                                  }
                                  setItensFalhaSelecionados(sel)
                                }}
                                className="rounded"
                              />
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-yellow-900 dark:text-yellow-100">Linha</th>
                            <th className="px-4 py-3 text-left font-semibold text-yellow-900 dark:text-yellow-100">SÃ©rie</th>
                            <th className="px-4 py-3 text-left font-semibold text-yellow-900 dark:text-yellow-100">RG</th>
                            <th className="px-4 py-3 text-left font-semibold text-yellow-900 dark:text-yellow-100">Local</th>
                            <th className="px-4 py-3 text-left font-semibold text-yellow-900 dark:text-yellow-100">Motivo</th>
                            <th className="px-4 py-3 text-center font-semibold text-yellow-900 dark:text-yellow-100 w-24">AÃ§Ã£o</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-yellow-200 dark:divide-yellow-800">
                          {errosImportacao.naoEncontrados.map((item, idx) => (
                            <tr key={idx} className="hover:bg-yellow-100/50 dark:hover:bg-yellow-900/20">
                              <td className="px-2 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={itensFalhaSelecionados.has(`nao-${idx}`)}
                                  onChange={(e) => {
                                    const sel = new Set(itensFalhaSelecionados)
                                    if (e.target.checked) sel.add(`nao-${idx}`)
                                    else sel.delete(`nao-${idx}`)
                                    setItensFalhaSelecionados(sel)
                                  }}
                                  className="rounded"
                                />
                              </td>
                              <td className="px-4 py-3 text-yellow-900 dark:text-yellow-100 font-mono">{item.linha}</td>
                              <td className="px-4 py-3 text-yellow-900 dark:text-yellow-100 font-semibold">{item.serie}</td>
                              <td className="px-4 py-3 text-yellow-900 dark:text-yellow-100 font-semibold">{item.rg}</td>
                              <td className="px-4 py-3 text-yellow-900 dark:text-yellow-100">{item.local}</td>
                              <td className="px-4 py-3 text-yellow-700 dark:text-yellow-300">{item.motivo}</td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setItemCorrigindo(item)
                                    setCorrecaoDados({ serie: item.serie || '', rg: item.rg || '', local: item.local || '' })
                                  }}
                                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium"
                                >
                                  âÅ“�ï¸� Corrigir
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      ðÅ¸â€™¡ <strong>Dica:</strong> Verifique se a SÃ©rie e RG estÃ£o corretos no banco de dados. A busca Ã© case-insensitive.
                    </p>
                  </div>
                </div>
              )}

              {/* Erros de processamento */}
              {errosImportacao.erros && errosImportacao.erros.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                    <span>â�Å’</span>
                    <span>Erros de Processamento ({errosImportacao.erros.length})</span>
                  </h4>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-red-100 dark:bg-red-900/40">
                          <tr>
                            <th className="px-2 py-3 text-center w-10">
                              <input
                                type="checkbox"
                                checked={errosImportacao.erros.every((_, i) => itensFalhaSelecionados.has(`erro-${i}`))}
                                onChange={(e) => {
                                  const sel = new Set(itensFalhaSelecionados)
                                  if (e.target.checked) {
                                    errosImportacao.erros.forEach((_, i) => sel.add(`erro-${i}`))
                                  } else {
                                    errosImportacao.erros.forEach((_, i) => sel.delete(`erro-${i}`))
                                  }
                                  setItensFalhaSelecionados(sel)
                                }}
                                className="rounded"
                              />
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-red-900 dark:text-red-100">Linha</th>
                            <th className="px-4 py-3 text-left font-semibold text-red-900 dark:text-red-100">SÃ©rie</th>
                            <th className="px-4 py-3 text-left font-semibold text-red-900 dark:text-red-100">RG</th>
                            <th className="px-4 py-3 text-left font-semibold text-red-900 dark:text-red-100">Local</th>
                            <th className="px-4 py-3 text-left font-semibold text-red-900 dark:text-red-100">Motivo</th>
                            <th className="px-4 py-3 text-center font-semibold text-red-900 dark:text-red-100 w-24">AÃ§Ã£o</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-red-200 dark:divide-red-800">
                          {errosImportacao.erros.map((item, idx) => (
                            <tr key={idx} className="hover:bg-red-100/50 dark:hover:bg-red-900/20">
                              <td className="px-2 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={itensFalhaSelecionados.has(`erro-${idx}`)}
                                  onChange={(e) => {
                                    const sel = new Set(itensFalhaSelecionados)
                                    if (e.target.checked) sel.add(`erro-${idx}`)
                                    else sel.delete(`erro-${idx}`)
                                    setItensFalhaSelecionados(sel)
                                  }}
                                  className="rounded"
                                />
                              </td>
                              <td className="px-4 py-3 text-red-900 dark:text-red-100 font-mono">{item.linha}</td>
                              <td className="px-4 py-3 text-red-900 dark:text-red-100 font-semibold">{item.serie}</td>
                              <td className="px-4 py-3 text-red-900 dark:text-red-100 font-semibold">{item.rg}</td>
                              <td className="px-4 py-3 text-red-900 dark:text-red-100">{item.local}</td>
                              <td className="px-4 py-3 text-red-700 dark:text-red-300 text-xs">{item.motivo}</td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setItemCorrigindo(item)
                                    setCorrecaoDados({ serie: item.serie || '', rg: item.rg || '', local: item.local || '' })
                                  }}
                                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium"
                                >
                                  âÅ“�ï¸� Corrigir
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* AÃ§Ãµes em lote e copiar */}
              {(errosImportacao.naoEncontrados?.length || 0) + (errosImportacao.erros?.length || 0) > 0 && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 space-y-3">
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                    AÃ§Ãµes em lote ({itensFalhaSelecionados.size} selecionado(s))
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={cadastrandoEmLote || itensFalhaSelecionados.size === 0}
                      onClick={() => {
                        const itens = []
                        itensFalhaSelecionados.forEach(k => {
                          const [tipo, idx] = k.split('-')
                          const arr = tipo === 'nao' ? errosImportacao.naoEncontrados : errosImportacao.erros
                          if (arr && arr[parseInt(idx, 10)]) itens.push(arr[parseInt(idx, 10)])
                        })
                        if (itens.length === 0) return
                        setItemCorrigindo(itens[0])
                        setCorrecaoDados({ serie: itens[0].serie || '', rg: itens[0].rg || '', local: itens[0].local || '' })
                        setItensCorrecaoRestantes(itens.slice(1))
                        setItensFalhaSelecionados(new Set())
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium"
                    >
                      âÅ“�ï¸� Corrigir selecionados
                    </button>
                    <button
                      type="button"
                      disabled={cadastrandoEmLote || itensFalhaSelecionados.size === 0}
                      onClick={async () => {
                        const itens = []
                        itensFalhaSelecionados.forEach(k => {
                          const [tipo, idx] = k.split('-')
                          const arr = tipo === 'nao' ? errosImportacao.naoEncontrados : errosImportacao.erros
                          if (arr && arr[parseInt(idx, 10)]) itens.push(arr[parseInt(idx, 10)])
                        })
                        if (itens.length === 0) return
                        setCadastrandoEmLote(true)
                        const chave = (i) => `${(i.serie||'').trim()}|${(i.rg||'').trim()}|${i.linha}`
                        const sucesso = new Set()
                        let ok = 0, err = 0
                        for (const item of itens) {
                          try {
                            const res = await fetch('/api/animals', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                preRegistro: true,
                                serie: (item.serie || '').trim(),
                                rg: (item.rg || '').trim(),
                                pasto_atual: (item.local || '').trim() || undefined
                              })
                            })
                            if (res.ok) {
                              const local = (item.local || '').trim()
                              if (local) {
                                const locRes = await fetch('/api/import/text-localizacao', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    dados: [{ serie: (item.serie || '').trim(), rg: (item.rg || '').trim(), local, observacoes: '' }]
                                  })
                                })
                                if (locRes.ok) { ok++; sucesso.add(chave(item)) }
                                else err++
                              } else {
                                ok++
                                sucesso.add(chave(item))
                              }
                            } else err++
                          } catch (_) { err++ }
                        }
                        setCadastrandoEmLote(false)
                        setItensFalhaSelecionados(new Set())
                        alert(`âÅ“â€¦ ${ok} cadastrado(s) e importado(s). ${err > 0 ? `â�Å’ ${err} erro(s).` : ''}`)
                        setErrosImportacao(prev => ({
                          ...prev,
                          animaisAtualizados: (prev?.animaisAtualizados || 0) + ok,
                          naoEncontrados: (prev?.naoEncontrados || []).filter(i => !sucesso.has(chave(i))),
                          erros: (prev?.erros || []).filter(i => !sucesso.has(chave(i)))
                        }))
                        await carregarDados()
                        await carregarLocais()
                      }}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium"
                    >
                      {cadastrandoEmLote ? 'â�³ Cadastrando...' : `âÅ¾â€¢ Cadastrar selecionados (SÃ©rie + RG)`}
                    </button>
                    <button
                      type="button"
                      disabled={cadastrandoEmLote}
                      onClick={async () => {
                        const todos = [
                          ...(errosImportacao.naoEncontrados || []),
                          ...(errosImportacao.erros || [])
                        ]
                        if (todos.length === 0) return
                        setCadastrandoEmLote(true)
                        let ok = 0, err = 0
                        for (const item of todos) {
                          try {
                            const res = await fetch('/api/animals', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                preRegistro: true,
                                serie: (item.serie || '').trim(),
                                rg: (item.rg || '').trim(),
                                pasto_atual: (item.local || '').trim() || undefined
                              })
                            })
                            if (res.ok) {
                              const local = (item.local || '').trim()
                              if (local) {
                                const locRes = await fetch('/api/import/text-localizacao', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    dados: [{ serie: (item.serie || '').trim(), rg: (item.rg || '').trim(), local, observacoes: '' }]
                                  })
                                })
                                if (locRes.ok) ok++
                                else err++
                              } else ok++
                            } else err++
                          } catch (_) { err++ }
                        }
                        setCadastrandoEmLote(false)
                        setItensFalhaSelecionados(new Set())
                        alert(`âÅ“â€¦ ${ok} cadastrado(s) e importado(s). ${err > 0 ? `â�Å’ ${err} erro(s).` : ''}`)
                        setErrosImportacao(prev => ({
                          ...prev,
                          animaisAtualizados: (prev?.animaisAtualizados || 0) + ok,
                          naoEncontrados: [],
                          erros: []
                        }))
                        await carregarDados()
                        await carregarLocais()
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium"
                    >
                      {cadastrandoEmLote ? 'â�³ Adicionando...' : 'âÅ¾â€¢ Adicionar todos os que faltam'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const todos = [
                          ...(errosImportacao.naoEncontrados || []).map(i => ({ ...i, tipo: 'NÃ£o encontrado' })),
                          ...(errosImportacao.erros || []).map(i => ({ ...i, tipo: 'Erro' }))
                        ].sort((a, b) => (a.linha || 0) - (b.linha || 0))
                        const texto = 'LINHA\tSÃâ€°RIE\tRG\tLOCAL\tMOTIVO\n' + todos.map(i => `${i.linha}\t${i.serie}\t${i.rg}\t${i.local}\t${(i.motivo || i.tipo || '').replace(/\t/g, ' ')}`).join('\n')
                        navigator.clipboard.writeText(texto).then(() => {
                          alert(`âÅ“â€¦ ${todos.length} registro(s) copiado(s)!`)
                        }).catch(() => alert('Erro ao copiar.'))
                      }}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium"
                    >
                      ðÅ¸â€œâ€¹ Copiar lista
                    </button>
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Cadastrar cria o animal com SÃ©rie e RG. Complemente os dados depois na tela de Animais.
                  </p>
                </div>
              )}

              {/* Mensagem de sucesso se nÃ£o houver erros */}
              {(!errosImportacao.naoEncontrados || errosImportacao.naoEncontrados.length === 0) && 
               (!errosImportacao.erros || errosImportacao.erros.length === 0) && (
                <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 text-center">
                  <div className="text-6xl mb-4">âÅ“â€¦</div>
                  <h4 className="text-xl font-bold text-green-900 dark:text-green-100 mb-2">
                    ImportaÃ§Ã£o 100% ConcluÃ­da!
                  </h4>
                  <p className="text-green-700 dark:text-green-300">
                    Todos os {errosImportacao.totalLinhas} animais foram importados com sucesso.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {errosImportacao.animaisAtualizados > 0 && (
                  <span>âÅ“â€¦ {errosImportacao.animaisAtualizados} animais foram atualizados com sucesso</span>
                )}
              </div>
              <button
                onClick={() => {
                  setShowErrosImportacao(false)
                  setErrosImportacao(null)
                  setShowImportTextModal(false)
                  setImportText('')
                  setItemCorrigindo(null)
                  setItensCorrecaoRestantes([])
                }}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Corrigir item nÃ£o importado */}
      {itemCorrigindo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">âÅ“�ï¸� Corrigir e importar</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Ajuste os dados ou cadastre o animal que nÃ£o foi encontrado.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SÃ©rie</label>
                <input
                  type="text"
                  value={correcaoDados.serie}
                  onChange={(e) => setCorrecaoDados(prev => ({ ...prev, serie: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ex: CJCJ"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">RG</label>
                <input
                  type="text"
                  value={correcaoDados.rg}
                  onChange={(e) => setCorrecaoDados(prev => ({ ...prev, rg: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ex: 16941"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Local (piquete)</label>
                <input
                  type="text"
                  value={correcaoDados.local}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 mt-6">
              <button
                type="button"
                disabled={corrigindo || !correcaoDados.serie?.trim() || !correcaoDados.rg?.trim() || !correcaoDados.local?.trim()}
                onClick={async () => {
                  setCorrigindo(true)
                  try {
                    const res = await fetch('/api/import/text-localizacao', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        dados: [{ serie: correcaoDados.serie.trim(), rg: correcaoDados.rg.trim(), local: correcaoDados.local.trim(), observacoes: '' }]
                      })
                    })
                    const data = await res.json()
                    const r = data.data?.resultados || data.resultados || {}
                    if (r.animaisAtualizados > 0) {
                      alert('âÅ“â€¦ Importado com sucesso!')
                      setErrosImportacao(prev => ({
                        ...prev,
                        animaisAtualizados: (prev?.animaisAtualizados || 0) + 1,
                        naoEncontrados: prev?.naoEncontrados?.filter(i => i.linha !== itemCorrigindo.linha) || [],
                        erros: prev?.erros?.filter(i => i.linha !== itemCorrigindo.linha) || []
                      }))
                      fecharOuProximoCorrecao()
                      await carregarDados()
                      await carregarLocais()
                    } else {
                      const motivo = r.naoEncontrados?.[0]?.motivo || r.erros?.[0]?.motivo || 'Animal nÃ£o encontrado'
                      alert(`â�Å’ NÃ£o foi possÃ­vel importar: ${motivo}\n\nTente "Cadastrar animal" se ele ainda nÃ£o existir no sistema.`)
                    }
                  } catch (e) {
                    alert('Erro ao importar: ' + (e?.message || 'Erro de conexÃ£o'))
                  } finally {
                    setCorrigindo(false)
                  }
                }}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl font-medium"
              >
                {corrigindo ? 'â�³ Importando...' : 'ðÅ¸â€�â€ž Tentar importar com dados corrigidos'}
              </button>
              <button
                type="button"
                disabled={corrigindo || !correcaoDados.serie?.trim() || !correcaoDados.rg?.trim()}
                onClick={async () => {
                  setCorrigindo(true)
                  try {
                    const resAnimal = await fetch('/api/animals', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        preRegistro: true,
                        serie: correcaoDados.serie.trim(),
                        rg: correcaoDados.rg.trim(),
                        pasto_atual: correcaoDados.local?.trim() || undefined
                      })
                    })
                    const dataAnimal = await resAnimal.json()
                    if (!resAnimal.ok) {
                      throw new Error(dataAnimal.message || dataAnimal.error || 'Erro ao cadastrar')
                    }
                    const animal = dataAnimal.data || dataAnimal
                    const temLocal = correcaoDados.local?.trim()
                    let importouLoc = false
                    if (temLocal) {
                      const resLoc = await fetch('/api/import/text-localizacao', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          dados: [{ serie: correcaoDados.serie.trim(), rg: correcaoDados.rg.trim(), local: temLocal, observacoes: '' }]
                        })
                      })
                      const dataLoc = await resLoc.json()
                      const r = dataLoc.data?.resultados || dataLoc.resultados || {}
                      importouLoc = (r.animaisAtualizados || 0) > 0
                    }
                    alert(temLocal && importouLoc ? 'âÅ“â€¦ Animal cadastrado e localizaÃ§Ã£o importada com sucesso!' : 'âÅ“â€¦ Animal cadastrado com sucesso! Complemente os dados na tela de Animais.')
                    setErrosImportacao(prev => ({
                      ...prev,
                      animaisAtualizados: (prev?.animaisAtualizados || 0) + 1,
                      naoEncontrados: prev?.naoEncontrados?.filter(i => i.linha !== itemCorrigindo.linha) || [],
                      erros: prev?.erros?.filter(i => i.linha !== itemCorrigindo.linha) || []
                    }))
                    fecharOuProximoCorrecao()
                    await carregarDados()
                    await carregarLocais()
                  } catch (e) {
                    alert('Erro: ' + (e?.message || 'Erro ao cadastrar'))
                  } finally {
                    setCorrigindo(false)
                  }
                }}
                className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-xl font-medium"
              >
                {corrigindo ? 'â�³ Cadastrando...' : 'âÅ¾â€¢ Cadastrar animal e importar localizaÃ§Ã£o'}
              </button>
              <a
                href={`/animals?action=new`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-4 py-2 text-center border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                ðÅ¸â€œâ€¹ Abrir cadastro completo (nova aba)
              </a>
              <button
                type="button"
                onClick={fecharOuProximoCorrecao}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}