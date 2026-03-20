
import { useEffect, useState } from 'react'

import { ChartBarIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/router'
import NotaFiscalDetailsModal from '../../components/NotaFiscalDetailsModal'
import NotaFiscalModal from '../../components/NotaFiscalModal'
import ResumoAnimaisNF from '../../components/ResumoAnimaisNF'
import {
    ArrowPathIcon,
    CurrencyDollarIcon,
    DocumentArrowDownIcon,
    DocumentArrowUpIcon,
    DocumentTextIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    PencilIcon,
    TrashIcon
} from '../../components/ui/Icons'
// import NotasFiscaisSyncPanel from '../../components/NotasFiscaisSyncPanel'
// import PainelIntegracaoBoletim from '../../components/PainelIntegracaoBoletim'
import ImportProgressOverlay from '../../components/ImportProgressOverlay'
import Toast from '../../components/ui/SimpleToast'
import { integrarNFEntrada, integrarNFSaida } from '../../services/notasFiscaisIntegration'
import { saveAnimalsToLocalStorage } from '../../utils/localStorageAnimals'

export default function NotasFiscais() {
  const router = useRouter()
  const [nfs, setNfs] = useState([])
  const [animals, setAnimals] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [tipoModal, setTipoModal] = useState('entrada')
  const [nfEditando, setNfEditando] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showSyncPanel, setShowSyncPanel] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [showResumo, setShowResumo] = useState(false)
  const [nfResumo, setNfResumo] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailNF, setDetailNF] = useState(null)
  // Estados para seleção múltipla
  const [selectedNFs, setSelectedNFs] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  // const [showIntegrationPanel, setShowIntegrationPanel] = useState(false)
  // const [estatisticasIntegracao, setEstatisticasIntegracao] = useState({})
  const [filtros, setFiltros] = useState({
    tipo: 'todas', // 'todas', 'entrada', 'saida'
    tipoProduto: 'todos', // 'todos', 'bovino', 'semen', 'embriao'
    periodo: 'todos' // '7dias', '30dias', '90dias', 'ano', 'todos'
  })
  const [ordenacao, setOrdenacao] = useState('dataDesc') // 'dataDesc', 'dataAsc', 'numeroDesc', 'numeroAsc', 'recentes'
  const [paginaAtual, setPaginaAtual] = useState(1)
  const itensPorPagina = 10

  // Importação Excel/CSV para Notas Fiscais
  const [showImportNF, setShowImportNF] = useState(false)
  const [importMethodNF, setImportMethodNF] = useState('excel')
  const [importDataNF, setImportDataNF] = useState('')
  const [isValidatingNF, setIsValidatingNF] = useState(false)
  const [validationNF, setValidationNF] = useState(null)
  const [importandoNF, setImportandoNF] = useState(false)
  const [importProgressNF, setImportProgressNF] = useState({ atual: 0, total: 0, etapa: '' })

  const [mappingModeNF, setMappingModeNF] = useState('manual')
  const [headersDetectedNF, setHeadersDetectedNF] = useState([])
  const [columnCountNF, setColumnCountNF] = useState(10)
  const [fieldMappingNF, setFieldMappingNF] = useState({
    tipo: { enabled: true, source: 'Coluna 1' },
    numeroNF: { enabled: true, source: 'Coluna 2' },
    data: { enabled: true, source: 'Coluna 3' },
    fornecedor: { enabled: false, source: 'Coluna 4' },
    destino: { enabled: false, source: 'Coluna 5' },
    tipoProduto: { enabled: true, source: 'Coluna 6' },
    valorTotal: { enabled: true, source: 'Coluna 7' },
  })
  const [extraFieldsNF, setExtraFieldsNF] = useState([])
  const [newExtraNameNF, setNewExtraNameNF] = useState('')
  const [newExtraSourceNF, setNewExtraSourceNF] = useState('')

  const splitCellsNF = (linha) => {
    if (!linha) return []
    if (linha.includes('\t')) return linha.split('\t').map((c) => c.trim())
    if (linha.includes(',')) return linha.split(',').map((c) => c.trim())
    return linha.split(/\s+/).filter((c) => c.trim() !== '')
  }

  const updateMappingNF = (key, changes) => {
    setFieldMappingNF((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...changes },
    }))
  }

  const getBySourceNF = (campos, source) => {
    if (!source) return undefined
    const hdrIndex = headersDetectedNF.length
      ? headersDetectedNF.findIndex((h) => h.toLowerCase() === source.toLowerCase())
      : -1
    if (hdrIndex >= 0) return campos[hdrIndex]
    if (source.startsWith('Coluna')) {
      const idx = parseInt(source.replace('Coluna', '').trim(), 10) - 1
      return campos[idx]
    }
    return undefined
  }

  useEffect(() => {
    // FORÇAR LIMPEZA COMPLETA DO ESTADO
    console.log('🧹 Limpando estado React completamente...')
    setNfs([])
    setSelectedNFs([])
    setSelectAll(false)

    // Limpar localStorage completamente
    localStorage.removeItem('notasFiscais')
    localStorage.removeItem('nfParaEdicao')

    // Carregar dados apenas da API
    loadNFs()
    loadAnimals()

    // Verificar se há uma NF para edição vinda da página de contabilidade
    const nfParaEdicao = localStorage.getItem('nfParaEdicao')
    if (nfParaEdicao) {
      try {
        const nf = JSON.parse(nfParaEdicao)
        console.log('🔍 NF para edição encontrada:', nf)
        setNfEditando(nf)
        setShowModal(true)
        // Limpar o localStorage após usar
        localStorage.removeItem('nfParaEdicao')
      } catch (error) {
        console.error('Erro ao processar NF para edição:', error)
        localStorage.removeItem('nfParaEdicao')
      }
    }
  }, [])

  // Detectar cabeçalhos ou número de colunas para importação
  useEffect(() => {
    const lines = importDataNF.trim().split('\n').filter((l) => l.trim())
    if (lines.length) {
      const first = lines[0]
      const cells = splitCellsNF(first)
      setColumnCountNF(cells.length || 10)
      const lower = cells.map((c) => c.toLowerCase())
      const maybeHeader = lower.some((s) => ['tipo','número','numero','data','fornecedor','destino','produto','valor'].some((h) => s.includes(h)))
      setHeadersDetectedNF(maybeHeader ? cells : [])
    } else {
      setColumnCountNF(10)
      setHeadersDetectedNF([])
    }
  }, [importDataNF, importMethodNF])

  // Persistir mapeamento no localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('nfImportMapping') || '{}')
      if (saved.fieldMappingNF) setFieldMappingNF((prev) => ({ ...prev, ...saved.fieldMappingNF }))
      if (saved.mappingModeNF) setMappingModeNF(saved.mappingModeNF)
      if (saved.extraFieldsNF) setExtraFieldsNF(saved.extraFieldsNF)
    } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem('nfImportMapping', JSON.stringify({ mappingModeNF, fieldMappingNF, extraFieldsNF }))
  }, [mappingModeNF, fieldMappingNF, extraFieldsNF])

  // Novo useEffect para capturar parâmetros da URL
  useEffect(() => {
    if (router.isReady) {
      const { tipo, busca } = router.query

      if (tipo && ['entrada', 'saida', 'todas'].includes(tipo)) {
        setFiltros(prev => ({
          ...prev,
          tipo: tipo
        }))

        // Mostrar toast informativo
        const tipoTexto = tipo === 'entrada' ? 'Entradas' : tipo === 'saida' ? 'Saídas' : 'Todas as movimentações'
        Toast.success(`📋 Filtro aplicado: ${tipoTexto}`)
      }
      if (busca && typeof busca === 'string') {
        setSearchTerm(busca.trim())
      }
    }
  }, [router.isReady, router.query])

  // const loadEstatisticasIntegracao = () => {
  //   const stats = getEstatisticasIntegracao()
  //   setEstatisticasIntegracao(stats)
  // }

  const loadAnimals = async () => {
    try {
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/animals?t=${timestamp}`)
      if (response.ok) {
        const result = await response.json()
        // A API pode retornar { success: true, data: [...] } ou apenas o array
        const animalsList = Array.isArray(result) ? result : (result.data || result.success ? result.data : [])
        
        // Garantir que todos os animais tenham série e RG como string
        const animalsNormalizados = animalsList.map(animal => ({
          ...animal,
          serie: String(animal.serie || '').trim(),
          rg: String(animal.rg || '').trim()
        }))
        
        setAnimals(animalsNormalizados)
        const cache = saveAnimalsToLocalStorage(animalsNormalizados)
        if (!cache.ok) console.warn('[notas-fiscais] cache local:', cache.message)
        console.log(`✅ ${animalsNormalizados.length} animais carregados para notas fiscais`)
      } else {
        console.error('Erro ao carregar animais:', response.status)
        // Fallback para localStorage
        const storedAnimals = JSON.parse(localStorage.getItem('animals') || '[]')
        setAnimals(storedAnimals)
      }
    } catch (error) {
      console.error('Erro ao carregar animais:', error)
      // Fallback para localStorage
      const storedAnimals = JSON.parse(localStorage.getItem('animals') || '[]')
      setAnimals(storedAnimals)
    }
  }

  const loadNFs = async () => {
    // Proteção contra múltiplas chamadas simultâneas
    if (loading) {
      console.log('⏸️ loadNFs já está em execução, ignorando chamada duplicada')
      return
    }
    
    try {
      setLoading(true)
      console.log('📥 Carregando notas fiscais (uma única requisição)...')

      // Fazer apenas UMA requisição simples - SEM cache-busting desnecessário
      const response = await fetch('/api/notas-fiscais', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()

        // Garantir que seja um array
        const nfsData = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : [])
        console.log(`📥 ${nfsData.length} notas fiscais carregadas`)

        // SIMPLIFICADO: Normalizar campos diretamente sem processamento em lotes
        // Não fazer nenhuma requisição adicional - usar apenas os dados que já vieram da API
        const nfsNormalizadas = nfsData.map((nf) => {
          return {
            ...nf,
            tipo: (nf.tipo || '').toLowerCase(), // Garantir minúsculo
            numeroNF: nf.numero_nf || nf.numeroNF || '',
            tipoProduto: nf.tipo_produto || nf.tipoProduto || 'bovino',
            // Usar valor_total_calculado se disponível, senão usar valor_total
            valorTotal: nf.valor_total_calculado || nf.valor_total || nf.valorTotal || 0,
            data: nf.data || nf.data_compra || '',
            fornecedor: nf.fornecedor || '',
            // IMPORTANTE: Normalizar destino - pode vir como destino ou destinatario do banco
            destino: nf.destino || nf.destinatario || '',
            destinatario: nf.destinatario || nf.destino || '', // Fallback para compatibilidade
            cnpjOrigemDestino: nf.cnpj_origem_destino || nf.cnpjOrigemDestino || '',
            naturezaOperacao: nf.natureza_operacao || nf.naturezaOperacao || '',
            observacoes: nf.observacoes || '',
            incricao: nf.incricao || nf.incrição || '',
            itens: [], // Itens só serão carregados quando necessário (editar/ver detalhes)
            quantidadeAnimais: nf.total_itens || 0 // Usar total_itens diretamente do banco
          }
        })

        setNfs(nfsNormalizadas)

        // Limpar localStorage quando API funcionar para evitar inconsistências
        localStorage.removeItem('notasFiscais')
        localStorage.removeItem('nfParaEdicao')

        console.log('✅ Dados carregados da API e localStorage limpo')
      } else {
        console.error('❌ API não disponível')
        setNfs([])
        Toast.error('❌ Erro ao conectar com o servidor. Recarregue a página.')
      }
    } catch (error) {
      console.error('Erro ao carregar NFs:', error)
      setNfs([])
      Toast.error('❌ Erro de conexão. Recarregue a página.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNF = async (nf) => {
    try {
      const response = await fetch('/api/notas-fiscais', {
        method: nfEditando ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nf)
      })

      if (response.ok) {
        Toast.success(`Nota fiscal ${nfEditando ? 'atualizada' : 'cadastrada'} com sucesso!`)
        loadNFs()
      } else {
        const errData = await response.json().catch(() => ({}))
        const msg = errData?.message || errData?.error || `Erro ${response.status}`
        console.error('❌ Erro ao salvar NF:', msg)
        Toast.error(`Erro ao salvar: ${msg}`)
        return
      }

      // Integrar com boletim de animais automaticamente
      await integrarNFComBoletim(nf)

    } catch (error) {
      console.error('Erro ao salvar NF:', error)
      Toast.error('Erro ao salvar nota fiscal')
    }
  }

  const sincronizarComBoletim = async () => {
    try {
      setSyncing(true)

      // Primeiro: Sincronizar animais existentes com NFs
      const responseAnimais = await fetch('/api/boletim-contabil/sync-animais-nf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      let mensagemAnimais = ''
      if (responseAnimais.ok) {
        const resultAnimais = await responseAnimais.json()
        mensagemAnimais = resultAnimais.message
      }

      // Segundo: Sincronizar todas as notas fiscais com o boletim contábil
      const responseNFs = await fetch('/api/boletim-contabil/sync-notas-fiscais', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      let mensagemNFs = ''
      if (responseNFs.ok) {
        const resultNFs = await responseNFs.json()
        mensagemNFs = resultNFs.message
      }

      // Exibir resultado combinado
      const mensagemCompleta = [
        mensagemAnimais && `📋 Animais: ${mensagemAnimais}`,
        mensagemNFs && `📄 NFs: ${mensagemNFs}`
      ].filter(Boolean).join('\n')

      Toast.success(`✅ Sincronização concluída!\n${mensagemCompleta}`)

      // Recarregar dados
      await loadNFs()

    } catch (error) {
      console.error('Erro na sincronização:', error)
      Toast.error('❌ Erro ao conectar com o servidor')
    } finally {
      setSyncing(false)
    }
  }

  const integrarNFComBoletim = async (nf) => {
    try {
      if (nf.tipo === 'entrada') {
        const result = await integrarNFEntrada(nf)
        if (result.success) {
          Toast.success(`✅ ${result.message}`)
        } else {
          Toast.error(`❌ ${result.message}`)
        }
      } else if (nf.tipo === 'saida') {
        const result = await integrarNFSaida(nf)
        if (result.success) {
          Toast.success(`✅ ${result.message}`)
        } else {
          Toast.error(`❌ ${result.message}`)
        }
      }

      // Atualizar estatísticas
      // loadEstatisticasIntegracao()
    } catch (error) {
      console.error('Erro na integração:', error)
      Toast.error('Erro ao integrar NF com boletim de animais')
    }
  }

  const handleDeleteNF = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta nota fiscal?')) return

    try {
      const response = await fetch(`/api/notas-fiscais/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        Toast.success('Nota fiscal excluída com sucesso!')
        loadNFs()
      } else {
        // SEM FALLBACK - Forçar erro se API não funcionar
        console.error('❌ Erro ao excluir NF - API não disponível')
        Toast.error('❌ Erro ao excluir nota fiscal. Recarregue a página.')
        return
      }
    } catch (error) {
      console.error('Erro ao excluir NF:', error)
      Toast.error('Erro ao excluir nota fiscal')
    }
  }

  // Funções para seleção múltipla
  const handleSelectNF = (nfId) => {
    if (!nfId) {
      Toast.warning('Esta nota fiscal não pode ser selecionada (sem ID)')
      return
    }
    setSelectedNFs(prev => {
      if (prev.includes(nfId)) {
        return prev.filter(id => id !== nfId)
      } else {
        return [...prev, nfId]
      }
    })
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedNFs([])
      setSelectAll(false)
    } else {
      // Filtrar apenas NFs com ID válido
      const idsValidos = nfsFiltradas.filter(nf => nf.id).map(nf => nf.id)
      setSelectedNFs(idsValidos)
      setSelectAll(true)
    }
  }

  const handleDeleteMultiple = async () => {
    if (selectedNFs.length === 0) {
      Toast.warning('Selecione pelo menos uma nota fiscal para excluir')
      return
    }

    const confirmMessage = `Tem certeza que deseja excluir ${selectedNFs.length} nota${selectedNFs.length > 1 ? 's' : ''} fiscal${selectedNFs.length > 1 ? 'is' : ''}?\n\nEsta ação não pode ser desfeita!`
    if (!confirm(confirmMessage)) return

    try {
      setLoading(true)
      let successCount = 0
      let errorCount = 0
      const errors = []

      // Processar exclusões em lotes para evitar sobrecarga
      const processarEmLotes = async (ids, tamanhoLote) => {
        for (let i = 0; i < ids.length; i += tamanhoLote) {
          const lote = ids.slice(i, i + tamanhoLote)
          await Promise.all(lote.map(async (nfId) => {
            try {
              const response = await fetch(`/api/notas-fiscais/${nfId}`, { 
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json'
                }
              })
              if (response.ok) {
                successCount++
              } else {
                const errorData = await response.json().catch(() => ({}))
                errorCount++
                errors.push({ id: nfId, error: errorData.error || 'Erro desconhecido' })
              }
            } catch (error) {
              console.error(`Erro ao excluir NF ${nfId}:`, error)
              errorCount++
              errors.push({ id: nfId, error: error.message || 'Erro de conexão' })
            }
          }))
          // Pequeno delay entre lotes
          if (i + tamanhoLote < ids.length) {
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        }
      }

      await processarEmLotes(selectedNFs, 5)

      // Mostrar resultados
      if (successCount > 0) {
        Toast.success(`✅ ${successCount} nota${successCount > 1 ? 's' : ''} fiscal${successCount > 1 ? 'is' : ''} excluída${successCount > 1 ? 's' : ''} com sucesso!`)
      }

      if (errorCount > 0) {
        Toast.error(`❌ ${errorCount} nota${errorCount > 1 ? 's' : ''} fiscal${errorCount > 1 ? 'is' : ''} não puderam ser excluída${errorCount > 1 ? 's' : ''}`)
        console.error('Erros na exclusão:', errors)
      }

      // Limpar seleção e recarregar dados
      setSelectedNFs([])
      setSelectAll(false)
      await loadNFs()
    } catch (error) {
      console.error('Erro na exclusão múltipla:', error)
      Toast.error('Erro ao excluir notas fiscais. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }



  // Filtrar NFs
  const nfsFiltradas = (Array.isArray(nfs) ? nfs : []).filter(nf => {
    // Filtro de busca
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      const matchNumero = (nf.numeroNF || nf.numero_nf || '')?.toLowerCase().includes(search)
      const matchFornecedor = nf.fornecedor?.toLowerCase().includes(search)
      const matchDestino = nf.destino?.toLowerCase().includes(search)
      const matchNatureza = nf.natureza_operacao?.toLowerCase().includes(search) || nf.naturezaOperacao?.toLowerCase().includes(search)

      if (!matchNumero && !matchFornecedor && !matchDestino && !matchNatureza) {
        return false
      }
    }

    // Filtro de tipo (entrada/saída)
    if (filtros.tipo !== 'todas' && nf.tipo !== filtros.tipo) {
      return false
    }

    // Filtro de tipo de produto
    if (filtros.tipoProduto !== 'todos' && nf.tipoProduto !== filtros.tipoProduto) {
      return false
    }

    // Filtro de período (para saída usar data_saida se existir)
    if (filtros.periodo !== 'todos') {
      const hoje = new Date()
      const dataNF = new Date(nf.tipo === 'saida' && nf.data_saida ? nf.data_saida : nf.data)
      const diffDias = Math.floor((hoje - dataNF) / (1000 * 60 * 60 * 24))

      if (filtros.periodo === '7dias' && diffDias > 7) return false
      if (filtros.periodo === '30dias' && diffDias > 30) return false
      if (filtros.periodo === '90dias' && diffDias > 90) return false
      if (filtros.periodo === 'ano' && diffDias > 365) return false
    }

    return true
  }).sort((a, b) => {
    switch (ordenacao) {
      case 'dataAsc':
        return new Date(a.data) - new Date(b.data)
      case 'dataDesc':
        return new Date(b.data) - new Date(a.data)
      case 'numeroAsc':
        return String(a.numeroNF || '').localeCompare(String(b.numeroNF || ''), undefined, { numeric: true })
      case 'numeroDesc':
        return String(b.numeroNF || '').localeCompare(String(a.numeroNF || ''), undefined, { numeric: true })
      case 'valorAsc':
        return (parseFloat(a.valor_total) || parseFloat(a.valorTotal) || 0) - (parseFloat(b.valor_total) || parseFloat(b.valorTotal) || 0)
      case 'valorDesc':
        return (parseFloat(b.valor_total) || parseFloat(b.valorTotal) || 0) - (parseFloat(a.valor_total) || parseFloat(a.valorTotal) || 0)
      case 'recentes':
      default:
        // Se tiver created_at usa, senão usa data
        const dateA = a.created_at ? new Date(a.created_at) : new Date(a.data)
        const dateB = b.created_at ? new Date(b.created_at) : new Date(b.data)
        return dateB - dateA
    }
  })

  // Paginação
  const totalPaginas = Math.ceil(nfsFiltradas.length / itensPorPagina)
  const indiceInicial = (paginaAtual - 1) * itensPorPagina
  const indiceFinal = indiceInicial + itensPorPagina
  const nfsPaginadas = nfsFiltradas.slice(indiceInicial, indiceFinal)

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setPaginaAtual(1)
  }, [filtros, searchTerm])

  // Atualizar selectAll quando selectedNFs mudar
  useEffect(() => {
    if (nfsFiltradas.length > 0) {
      setSelectAll(selectedNFs.length === nfsFiltradas.length)
    }
  }, [selectedNFs, nfs, filtros, searchTerm])

  const abrirModalEntrada = () => {
    setTipoModal('entrada')
    setNfEditando(null)
    setShowModal(true)
  }

  const abrirModalSaida = () => {
    setTipoModal('saida')
    setNfEditando(null)
    setShowModal(true)
  }

  const abrirDetalhes = async (nf) => {
    // Não ativar loading global para não remontar a lista inteira, apenas mostrar feedback visual se possível
    // Mas como o loading atual bloqueia a tela, vamos usar ele mesmo por enquanto
    setLoading(true)
    try {
      // Buscar NF completa com itens
      const response = await fetch(`/api/notas-fiscais/${nf.id}`)
      if (response.ok) {
        const nfCompleta = await response.json()
        setDetailNF(nfCompleta)
        setShowDetailModal(true)
      } else {
        // Se não conseguir buscar completa, usar a básica
        setDetailNF(nf)
        setShowDetailModal(true)
      }
    } catch (error) {
      console.error('Erro ao carregar NF para detalhes:', error)
      setDetailNF(nf)
      setShowDetailModal(true)
    } finally {
      setLoading(false)
    }
  }

  const editarNF = async (nf) => {
    setTipoModal(nf.tipo)
    setLoading(true)
    try {
      // Buscar NF completa com itens
      const response = await fetch(`/api/notas-fiscais/${nf.id}`)
      if (response.ok) {
        const nfCompleta = await response.json()
        setNfEditando(nfCompleta)
        setShowModal(true)
      } else {
        // Se não conseguir buscar completa, usar a básica
        setNfEditando(nf)
        setShowModal(true)
      }
    } catch (error) {
      console.error('Erro ao carregar NF para edição:', error)
      // Em caso de erro, usar a NF básica mesmo assim
      setNfEditando(nf)
      setShowModal(true)
    } finally {
      setLoading(false)
    }
  }

  // Estatísticas
  const nfsArray = Array.isArray(nfs) ? nfs : []
  const stats = {
    totalEntradas: nfsArray.filter(n => n.tipo === 'entrada').length,
    totalSaidas: nfsArray.filter(n => n.tipo === 'saida').length,
    valorTotalEntradas: nfsArray.filter(n => n.tipo === 'entrada').reduce((sum, n) => sum + (parseFloat(n.valor_total) || 0), 0),
    valorTotalSaidas: nfsArray.filter(n => n.tipo === 'saida').reduce((sum, n) => sum + (parseFloat(n.valor_total) || 0), 0),
    bovinos: nfsArray.filter(n => n.tipoProduto === 'bovino' || n.tipo_produto === 'bovino').length,
    semen: nfsArray.filter(n => n.tipoProduto === 'semen' || n.tipo_produto === 'semen').length,
    embrioes: nfsArray.filter(n => n.tipoProduto === 'embriao' || n.tipo_produto === 'embriao').length
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  // Função para calcular quantidade total de animais de uma NF
  const calcularQuantidadeAnimais = async (nf) => {
    try {
      // Se já tiver itens carregados, usar diretamente
      if (nf.itens && Array.isArray(nf.itens) && nf.itens.length > 0) {
        return nf.itens.reduce((total, item) => {
          // Se for modo categoria, usar o campo quantidade
          if (item.modoCadastro === 'categoria' && item.quantidade) {
            return total + (parseInt(item.quantidade) || 0)
          }
          // Se não for modo categoria, contar como 1 animal por item
          return total + 1
        }, 0)
      }
      
      // Se não tiver itens carregados, buscar da API
      if (nf.id) {
        const response = await fetch(`/api/notas-fiscais/${nf.id}`)
        if (response.ok) {
          const nfCompleta = await response.json()
          const itens = nfCompleta.itens || []
          return itens.reduce((total, item) => {
            if (item.modoCadastro === 'categoria' && item.quantidade) {
              return total + (parseInt(item.quantidade) || 0)
            }
            return total + 1
          }, 0)
        }
      }
      
      return 0
    } catch (error) {
      console.error('Erro ao calcular quantidade de animais:', error)
      return 0
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getIconeTipo = (tipo) => {
    switch (tipo) {
      case 'bovino': return '🐄'
      case 'semen': return '🧬'
      case 'embriao': return '🧫'
      default: return '📦'
    }
  }

  // Helpers para importação NF
  const normalizeTipoNF = (v) => {
    if (!v) return 'entrada'
    const s = String(v).toLowerCase()
    if (s.includes('saida') || s.includes('saída')) return 'saida'
    return 'entrada'
  }

  const normalizeProduto = (v) => {
    const s = String(v || '').toLowerCase()
    if (s.includes('bov')) return 'bovino'
    if (s.includes('sem') || s.includes('sêmen')) return 'semen'
    if (s.includes('emb')) return 'embriao'
    return 'outros'
  }

  const convertDateExcelToISO = (str) => {
    if (!str) return ''
    const s = String(str).trim()
    if (s.includes('/')) {
      const [dd, mm, yy] = s.split('/')
      const year = yy.length === 2 ? `20${yy}` : yy
      return `${year}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`
    }
    return s
  }

  const validateImportNF = () => {
    setIsValidatingNF(true)
    try {
      const linhas = importDataNF
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0)

      const sucesso = []
      const erros = []

      linhas.forEach((linha, index) => {
        try {
          const campos = splitCellsNF(linha)

          // Construção via mapeamento manual
          let dados = {}
          let extrasLocal = null
          if (mappingModeNF === 'manual') {
            const get = (key) => {
              const entry = fieldMappingNF[key]
              if (!entry || entry.enabled === false) return undefined
              return getBySourceNF(campos, entry.source)
            }
            dados = {
              tipo: get('tipo'),
              numeroNF: get('numeroNF'),
              data: get('data'),
              fornecedor: get('fornecedor'),
              destino: get('destino'),
              tipoProduto: get('tipoProduto'),
              valorTotal: get('valorTotal'),
            }
            extrasLocal = {}
            extraFieldsNF.forEach((f) => {
              if (f.enabled) extrasLocal[f.name] = getBySourceNF(campos, f.source)
            })
          } else {
            // Automático básico: assume ordem padrão
            dados = {
              tipo: campos[0],
              numeroNF: campos[1],
              data: campos[2],
              fornecedor: campos[3],
              destino: campos[4],
              tipoProduto: campos[5],
              valorTotal: campos[6],
            }
          }

          // Normalizações / validações
          const tipo = normalizeTipoNF(dados.tipo)
          const numeroNF = String(dados.numeroNF || '').trim()
          const dataISO = convertDateExcelToISO(dados.data)
          const tipoProduto = normalizeProduto(dados.tipoProduto)
          const valorTotal = parseFloat(String(dados.valorTotal).replace(',', '.')) || 0

          if (!numeroNF || !dataISO || !tipo) {
            throw new Error('Campos obrigatórios: Tipo, Número NF e Data')
          }

          const nfObj = {
            id: Date.now() + Math.random(),
            tipo,
            numeroNF,
            data: dataISO,
            fornecedor: dados.fornecedor || '',
            destino: dados.destino || '',
            tipoProduto,
            itens: [],
            valorTotal,
            extras: extrasLocal || undefined,
          }

          sucesso.push(nfObj)
        } catch (err) {
          erros.push({ linha: index + 1, dados: linha, erro: err.message })
        }
      })

      setValidationNF({ sucesso, erros, total: linhas.length })
    } catch (error) {
      setValidationNF({ sucesso: [], erros: [{ linha: 0, dados: '', erro: error.message }], total: 0 })
    }
    setIsValidatingNF(false)
  }

  const handleImportNF = async () => {
    if (!validationNF || validationNF.sucesso.length === 0) return
    const lista = validationNF.sucesso
    setImportandoNF(true)
    setImportProgressNF({ atual: 0, total: lista.length, etapa: 'Importando notas fiscais...' })
    try {
      let ok = 0
      for (let i = 0; i < lista.length; i++) {
        setImportProgressNF({ atual: i + 1, total: lista.length, etapa: `Processando nota ${i + 1} de ${lista.length}...` })
        const nf = lista[i]
        const payload = { ...nf }
        delete payload.id
        const resp = await fetch('/api/notas-fiscais', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (resp.ok) ok++
      }
      Toast.success(`Importação concluída: ${ok} NFs salvas`) 
      setShowImportNF(false)
      setImportDataNF('')
      setValidationNF(null)
      await loadNFs()
    } catch (err) {
      console.error('Erro na importação NF:', err)
      Toast.error('Erro na importação de notas fiscais')
    } finally {
      setImportandoNF(false)
      setImportProgressNF({ atual: 0, total: 0, etapa: '' })
    }
  }

  const handleExportarExcel = async () => {
    try {
      Toast.info('Gerando arquivo Excel...')
      
      // Importar biblioteca xlsx
      const XLSX = await import('xlsx')
      
      // Preparar dados para exportação
      const dadosExportacao = nfsFiltradas.map(nf => {
        const dataExibir = (nf.tipo === 'saida' && nf.data_saida) ? nf.data_saida : nf.data
        return {
        'Tipo': nf.tipo === 'entrada' ? 'Entrada' : 'Saída',
        'Número NF': nf.numero_nf || nf.numeroNF || '',
        'Data': dataExibir ? new Date(dataExibir).toLocaleDateString('pt-BR') : '',
        'Fornecedor/Destino': nf.fornecedor || nf.destino || '',
        'Natureza': nf.natureza_operacao || nf.naturezaOperacao || '',
        'Valor Total': nf.valor_total || nf.valorTotal || 0,
        'Observações': nf.observacoes || ''
      }})
      
      // Criar workbook e worksheet
      const ws = XLSX.utils.json_to_sheet(dadosExportacao)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Notas Fiscais')
      
      // Gerar nome do arquivo
      const dataAtual = new Date().toISOString().slice(0, 10)
      const nomeArquivo = `Notas_Fiscais_${dataAtual}.xlsx`
      
      // Download
      XLSX.writeFile(wb, nomeArquivo)
      
      Toast.success(`✅ Arquivo exportado: ${nomeArquivo}`)
    } catch (error) {
      console.error('Erro ao exportar:', error)
      Toast.error('Erro ao exportar para Excel')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20">
      <ImportProgressOverlay importando={importandoNF} progress={importProgressNF} />
      <div className="p-6 space-y-8">
        {/* Header Moderno */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-3xl shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
          <div className="relative p-8">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                    <DocumentTextIcon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white tracking-tight">
                      Notas Fiscais
                    </h1>
                    <p className="text-blue-100 text-lg font-medium">
                      Gerenciamento completo de entradas e saídas
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={sincronizarComBoletim}
                  disabled={syncing}
                  className="group relative overflow-hidden bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100"
                >
                  <div className="flex items-center space-x-2">
                    <ArrowPathIcon className={`h-5 w-5 ${syncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                    <span className="font-medium">{syncing ? 'Sincronizando...' : 'Sincronizar'}</span>
                  </div>
                </button>

                <button
                  onClick={abrirModalEntrada}
                  className="group relative overflow-hidden bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-6 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                >
                  <div className="flex items-center space-x-2">
                    <DocumentArrowDownIcon className="h-5 w-5 group-hover:animate-bounce" />
                    <span className="font-medium">Nova Entrada</span>
                  </div>
                </button>

                <button
                  onClick={abrirModalSaida}
                  className="group relative overflow-hidden bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                >
                  <div className="flex items-center space-x-2">
                    <DocumentArrowUpIcon className="h-5 w-5 group-hover:animate-bounce" />
                    <span className="font-medium">Nova Saída</span>
                  </div>
                </button>

                <button
                  onClick={() => setShowImportNF(true)}
                  className="group relative overflow-hidden bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white px-6 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                >
                  <div className="flex items-center space-x-2">
                    <DocumentArrowUpIcon className="h-5 w-5 group-hover:animate-bounce" />
                    <span className="font-medium">Importar Excel</span>
                  </div>
                </button>

                <button
                  onClick={handleExportarExcel}
                  className="group relative overflow-hidden bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                >
                  <div className="flex items-center space-x-2">
                    <DocumentArrowDownIcon className="h-5 w-5 group-hover:animate-bounce" />
                    <span className="font-medium">Exportar Excel</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Estatísticas Modernos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <button
          onClick={() => setFiltros(prev => ({ ...prev, tipo: 'entrada' }))}
          className="group relative overflow-hidden bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600 rounded-3xl p-6 text-white transition-all duration-500 transform hover:scale-105 hover:rotate-1 shadow-xl hover:shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <DocumentArrowDownIcon className="h-8 w-8 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold tracking-tight">{stats.totalEntradas}</div>
                <div className="text-emerald-100 text-sm font-medium">Entradas</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-lg font-semibold">{formatCurrency(stats.valorTotalEntradas)}</div>
              <div className="text-xs text-emerald-100 opacity-90 bg-white/10 rounded-full px-3 py-1 text-center">
                👆 Clique para filtrar entradas
              </div>
            </div>
          </div>
        </button>

        <button
          onClick={() => setFiltros(prev => ({ ...prev, tipo: 'saida' }))}
          className="group relative overflow-hidden bg-gradient-to-br from-blue-400 via-indigo-500 to-blue-600 rounded-3xl p-6 text-white transition-all duration-500 transform hover:scale-105 hover:-rotate-1 shadow-xl hover:shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <DocumentArrowUpIcon className="h-8 w-8 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold tracking-tight">{stats.totalSaidas}</div>
                <div className="text-blue-100 text-sm font-medium">Saídas</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-lg font-semibold">{formatCurrency(stats.valorTotalSaidas)}</div>
              <div className="text-xs text-blue-100 opacity-90 bg-white/10 rounded-full px-3 py-1 text-center">
                👆 Clique para filtrar saídas
              </div>
            </div>
          </div>
        </button>

        <button
          onClick={() => setFiltros(prev => ({ ...prev, tipo: 'todas', tipoProduto: 'todos' }))}
          className="group relative overflow-hidden bg-gradient-to-br from-purple-400 via-violet-500 to-purple-600 rounded-3xl p-6 text-white transition-all duration-500 transform hover:scale-105 hover:rotate-1 shadow-xl hover:shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <DocumentTextIcon className="h-8 w-8 text-white" />
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-purple-100">Por Tipo</div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white/10 rounded-xl p-2">
                  <div className="text-xl">🐄</div>
                  <div className="text-sm font-bold">{stats.bovinos}</div>
                </div>
                <div className="bg-white/10 rounded-xl p-2">
                  <div className="text-xl">🧬</div>
                  <div className="text-sm font-bold">{stats.semen}</div>
                </div>
                <div className="bg-white/10 rounded-xl p-2">
                  <div className="text-xl">🧫</div>
                  <div className="text-sm font-bold">{stats.embrioes}</div>
                </div>
              </div>
              <div className="text-xs text-purple-100 opacity-90 bg-white/10 rounded-full px-3 py-1 text-center">
                👆 Ver todos os tipos
              </div>
            </div>
          </div>
        </button>

        <button
          onClick={() => {
            const saldo = stats.valorTotalSaidas - stats.valorTotalEntradas
            if (saldo > 0) {
              Toast.success(`Saldo positivo de ${formatCurrency(saldo)}!`)
            } else if (saldo < 0) {
              Toast.error(`Saldo negativo de ${formatCurrency(Math.abs(saldo))}`)
            } else {
              Toast.info('Saldo equilibrado')
            }
          }}
          className="group relative overflow-hidden bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 rounded-3xl p-6 text-white transition-all duration-500 transform hover:scale-105 hover:-rotate-1 shadow-xl hover:shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <CurrencyDollarIcon className="h-8 w-8 text-white" />
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-orange-100">Saldo Líquido</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold tracking-tight">
                {formatCurrency(stats.valorTotalSaidas - stats.valorTotalEntradas)}
              </div>
              <div className="text-sm text-orange-100 opacity-90">Saídas - Entradas</div>
              <div className="text-xs text-orange-100 opacity-90 bg-white/10 rounded-full px-3 py-1 text-center">
                👆 Ver detalhes do saldo
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Painel de Sincronização */}
      {/* {showSyncPanel && (
        <div className="mb-6">
          <NotasFiscaisSyncPanel />
        </div>
      )} */}

      {/* Painel de Integração */}
      {/* {showIntegrationPanel && (
        <div className="mb-6">
          <PainelIntegracaoBoletim
            estatisticas={estatisticasIntegracao}
            onRefresh={loadEstatisticasIntegracao}
          />
        </div>
      )} */}

      {/* Painel de Filtros e Busca Moderno */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
          {/* Busca Aprimorada */}
          <div className="flex-1">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por número, fornecedor, destino ou natureza..."
                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-700/50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-inner"
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </div>

          {/* Filtros Modernos */}
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <select
                value={filtros.tipo}
                onChange={(e) => setFiltros(prev => ({ ...prev, tipo: e.target.value }))}
                className="appearance-none bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 border-0 rounded-2xl px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 transition-all duration-300 text-gray-900 dark:text-white font-medium shadow-sm hover:shadow-md cursor-pointer"
              >
                <option value="todas" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white">📋 Todas</option>
                <option value="entrada" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white">📥 Entradas</option>
                <option value="saida" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white">📤 Saídas</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <FunnelIcon className="h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div className="relative">
              <select
                value={filtros.tipoProduto}
                onChange={(e) => setFiltros(prev => ({ ...prev, tipoProduto: e.target.value }))}
                className="appearance-none bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-700 dark:to-gray-600 border-0 rounded-2xl px-4 py-3 pr-10 focus:ring-2 focus:ring-purple-500 transition-all duration-300 text-gray-900 dark:text-white font-medium shadow-sm hover:shadow-md cursor-pointer"
              >
                <option value="todos" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white">🏷️ Todos Tipos</option>
                <option value="bovino" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white">🐄 Bovino</option>
                <option value="semen" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white">🧬 Sêmen</option>
                <option value="embriao" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white">🧫 Embrião</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <FunnelIcon className="h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div className="relative">
              <select
                value={filtros.periodo}
                onChange={(e) => setFiltros(prev => ({ ...prev, periodo: e.target.value }))}
                className="appearance-none bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-600 border-0 rounded-2xl px-4 py-3 pr-10 focus:ring-2 focus:ring-green-500 transition-all duration-300 text-gray-900 dark:text-white font-medium shadow-sm hover:shadow-md cursor-pointer"
              >
                <option value="7dias" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white">📅 Últimos 7 dias</option>
                <option value="30dias" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white">📅 Últimos 30 dias</option>
                <option value="90dias" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white">📅 Últimos 90 dias</option>
                <option value="ano" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white">📅 Último ano</option>
                <option value="todos" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white">📅 Todos</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <FunnelIcon className="h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div className="relative">
              <select
                value={ordenacao}
                onChange={(e) => setOrdenacao(e.target.value)}
                className="appearance-none bg-gradient-to-r from-orange-50 to-amber-50 dark:from-gray-700 dark:to-gray-600 border-0 rounded-2xl px-4 py-3 pr-10 focus:ring-2 focus:ring-orange-500 transition-all duration-300 text-gray-900 dark:text-white font-medium shadow-sm hover:shadow-md cursor-pointer"
              >
                <option value="dataDesc" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white">📅 Mais recentes</option>
                <option value="dataAsc" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white">📅 Mais antigas</option>
                <option value="numeroDesc" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white">🔢 Maior Número</option>
                <option value="numeroAsc" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white">🔢 Menor Número</option>
                <option value="valorDesc" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white">💰 Maior Valor</option>
                <option value="valorAsc" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white">💰 Menor Valor</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <FunnelIcon className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Contador de Resultados Moderno */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {nfsFiltradas.length} {nfsFiltradas.length === 1 ? 'nota fiscal encontrada' : 'notas fiscais encontradas'}
              {nfsFiltradas.length > itensPorPagina && (
                <span className="ml-2 text-gray-500 dark:text-gray-400">
                  (Página {paginaAtual} de {totalPaginas})
                </span>
              )}
            </span>
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full transition-colors duration-200"
            >
              Limpar busca ✕
            </button>
          )}
        </div>
      </div>

      {/* Barra de Ações para Seleção Múltipla Moderna */}
      {selectedNFs.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-3xl p-6 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-500 rounded-2xl">
                <span className="text-white font-bold text-sm">{selectedNFs.length}</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  {selectedNFs.length} nota{selectedNFs.length > 1 ? 's' : ''} fiscal{selectedNFs.length > 1 ? 'is' : ''} selecionada{selectedNFs.length > 1 ? 's' : ''}
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  Ações em lote disponíveis
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setSelectedNFs([])
                  setSelectAll(false)
                }}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 bg-white/50 dark:bg-gray-700/50 rounded-xl transition-all duration-200 hover:bg-white dark:hover:bg-gray-700"
              >
                Cancelar seleção
              </button>
              <button
                onClick={handleDeleteMultiple}
                className="group inline-flex items-center px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-medium rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <TrashIcon className="h-4 w-4 mr-2 group-hover:animate-bounce" />
                Excluir Selecionadas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Notas Fiscais Moderna */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 dark:border-blue-800 mx-auto"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-blue-600 mx-auto absolute inset-0"></div>
            </div>
            <div className="mt-6 space-y-2">
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Carregando notas fiscais...</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Aguarde um momento</p>
            </div>
          </div>
        ) : nfsFiltradas.length === 0 ? (
          <div className="p-16 text-center">
            <div className="relative mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-3xl mx-auto flex items-center justify-center">
                <DocumentTextIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-sm">🔍</span>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Nenhuma nota fiscal encontrada</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                {searchTerm ? 'Tente ajustar os filtros ou termo de busca' : 'Comece cadastrando sua primeira nota fiscal'}
              </p>
              {!searchTerm && (
                <div className="flex justify-center space-x-3 mt-6">
                  <button
                    onClick={abrirModalEntrada}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105"
                  >
                    📥 Nova Entrada
                  </button>
                  <button
                    onClick={abrirModalSaida}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105"
                  >
                    📤 Nova Saída
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-800 dark:via-blue-900/20 dark:to-indigo-900/20">
                  <th className="px-6 py-4 text-left">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded-lg transition-all duration-200 hover:scale-110"
                      />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <span>Tipo</span>
                      <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <span>Número NF</span>
                      <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <span>Data</span>
                      <div className="w-1 h-1 bg-purple-500 rounded-full"></div>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <span>Fornecedor</span>
                      <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <span>Destino / Comprador</span>
                      <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <span>CNPJ</span>
                      <div className="w-1 h-1 bg-yellow-500 rounded-full"></div>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <span>Natureza</span>
                      <div className="w-1 h-1 bg-teal-500 rounded-full"></div>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <span>Produto</span>
                      <div className="w-1 h-1 bg-pink-500 rounded-full"></div>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <span>Itens</span>
                      <div className="w-1 h-1 bg-indigo-500 rounded-full"></div>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <span>Valor Total</span>
                      <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center justify-end space-x-1">
                      <span>Ações</span>
                      <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {nfsPaginadas.map((nf, index) => (
                  <tr
                    key={nf.id}
                    className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 dark:hover:from-blue-900/10 dark:hover:to-indigo-900/10 transition-all duration-300 cursor-pointer"
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => abrirDetalhes(nf)}
                  >
                    <td className="px-6 py-5">
                      {nf.id ? (
                        <input
                          type="checkbox"
                          checked={selectedNFs.includes(nf.id)}
                          onChange={() => handleSelectNF(nf.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded-lg transition-all duration-200 hover:scale-110 cursor-pointer"
                        />
                      ) : (
                        <div className="h-5 w-5 border-2 border-gray-300 rounded-lg opacity-50"></div>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      {nf.tipo === 'entrada' ? (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-2xl text-xs font-semibold bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 dark:from-emerald-900/30 dark:to-green-900/30 dark:text-emerald-300 shadow-sm">
                          <DocumentArrowDownIcon className="h-3 w-3 mr-1.5" />
                          Entrada
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-2xl text-xs font-semibold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-300 shadow-sm">
                          <DocumentArrowUpIcon className="h-3 w-3 mr-1.5" />
                          Saída
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center">
                        <div className="text-sm font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-xl">
                          {nf.numeroNF || nf.numero_nf || '-'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                        {formatDate(nf.data)}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm text-gray-900 dark:text-white font-medium max-w-xs truncate" title={nf.fornecedor || '-'}>
                        {nf.fornecedor || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {/* Para saída: mostrar destino/comprador */}
                      {/* Para entrada: mostrar fornecedor (origem) */}
                      {nf.tipo === 'saida' ? (
                        (nf.destino || nf.destinatario) ? (
                          <div className="text-sm font-medium max-w-xs truncate px-2 py-1 rounded-lg text-gray-900 dark:text-white bg-blue-50 dark:bg-blue-900/20" title={nf.destino || nf.destinatario}>
                            {nf.destino || nf.destinatario}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400 dark:text-gray-500 font-medium max-w-xs truncate px-2 py-1 rounded-lg bg-yellow-50 dark:bg-yellow-900/20" title="Destino não informado">
                            ⚠️ Não informado
                          </div>
                        )
                      ) : (
                        // Para entrada: mostrar fornecedor na coluna destino (origem)
                        nf.fornecedor ? (
                          <div className="text-sm font-medium max-w-xs truncate px-2 py-1 rounded-lg text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50" title={`Fornecedor: ${nf.fornecedor}`}>
                            📥 {nf.fornecedor}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400 dark:text-gray-500 font-medium max-w-xs truncate" title="-">
                            -
                          </div>
                        )
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-xs text-gray-600 dark:text-gray-400 font-mono max-w-xs truncate" title={nf.cnpjOrigemDestino || '-'}>
                        {nf.cnpjOrigemDestino || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm text-gray-700 dark:text-gray-300 font-medium max-w-xs truncate" title={nf.naturezaOperacao || nf.natureza_operacao || '-'}>
                        {nf.naturezaOperacao || nf.natureza_operacao || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-2xl">
                        <span className="text-2xl">{getIconeTipo(nf.tipoProduto)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center min-w-[3rem] px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-xl text-sm font-bold">
                        {nf.quantidadeAnimais !== undefined ? nf.quantidadeAnimais : (nf.itens?.length || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm font-bold text-gray-900 dark:text-white bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 px-3 py-2 rounded-xl text-center">
                        {formatCurrency(nf.valorTotal)}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end space-x-2">
                        {nf.tipoProduto === 'bovino' && nf.tipo === 'entrada' && (
                          <>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation()
                                const numeroNF = nf.numeroNF || nf.numero_nf
                                if (!numeroNF) return
                                
                                try {
                                  const response = await fetch('/api/notas-fiscais/sync-nf', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ numeroNF })
                                  })
                                  
                                  const data = await response.json()
                                  
                                  if (data.success) {
                                    alert(`✅ ${data.message}\n\n${data.registradas} movimentação(ões) registrada(s) no boletim contábil.\nLocalidade: ${data.localidade}`)
                                    // Recarregar NFs para atualizar dados
                                    loadNFs()
                                  } else {
                                    alert(`❌ Erro: ${data.message}`)
                                  }
                                } catch (error) {
                                  console.error('Erro ao sincronizar NF:', error)
                                  alert(`❌ Erro ao sincronizar NF: ${error.message}`)
                                }
                              }}
                              className="group/btn p-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 rounded-xl transition-all duration-200 hover:scale-110"
                              title="Sincronizar com Boletim Contábil"
                            >
                              <ArrowPathIcon className="h-4 w-4 group-hover/btn:animate-spin" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setNfResumo(nf.numeroNF || nf.numero_nf)
                                setShowResumo(true)
                              }}
                              className="group/btn p-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 rounded-xl transition-all duration-200 hover:scale-110"
                              title="Ver Resumo por Idade e Sexo"
                            >
                              <ChartBarIcon className="h-4 w-4 group-hover/btn:animate-pulse" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            editarNF(nf)
                          }}
                          className="group/btn p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded-xl transition-all duration-200 hover:scale-110"
                          title="Editar"
                        >
                          <PencilIcon className="h-4 w-4 group-hover/btn:animate-pulse" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteNF(nf.id)
                          }}
                          className="group/btn p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-xl transition-all duration-200 hover:scale-110"
                          title="Excluir"
                        >
                          <TrashIcon className="h-4 w-4 group-hover/btn:animate-bounce" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {nfsFiltradas.length > itensPorPagina && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-t border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Mostrando <span className="font-semibold">{indiceInicial + 1}</span> a{' '}
                <span className="font-semibold">{Math.min(indiceFinal, nfsFiltradas.length)}</span> de{' '}
                <span className="font-semibold">{nfsFiltradas.length}</span> notas fiscais
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPaginaAtual(prev => Math.max(1, prev - 1))}
                  disabled={paginaAtual === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Anterior
                </button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => {
                    // Mostrar apenas algumas páginas ao redor da atual
                    if (
                      pagina === 1 ||
                      pagina === totalPaginas ||
                      (pagina >= paginaAtual - 1 && pagina <= paginaAtual + 1)
                    ) {
                      return (
                        <button
                          key={pagina}
                          onClick={() => setPaginaAtual(pagina)}
                          className={`px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                            pagina === paginaAtual
                              ? 'bg-blue-600 text-white shadow-lg'
                              : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                          }`}
                        >
                          {pagina}
                        </button>
                      )
                    } else if (
                      pagina === paginaAtual - 2 ||
                      pagina === paginaAtual + 2
                    ) {
                      return (
                        <span key={pagina} className="px-2 text-gray-500 dark:text-gray-400">
                          ...
                        </span>
                      )
                    }
                    return null
                  })}
                </div>
                <button
                  onClick={() => setPaginaAtual(prev => Math.min(totalPaginas, prev + 1))}
                  disabled={paginaAtual === totalPaginas}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Próxima
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <NotaFiscalModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false)
            setNfEditando(null)
          }}
          onSave={handleSaveNF}
          tipo={tipoModal}
          nfEditando={nfEditando}
          animals={animals}
        />
      )}

      {/* Modal de Resumo */}
      {showResumo && nfResumo && (
        <ResumoAnimaisNF
          numeroNF={nfResumo}
          localidade="AGROPECUÁRIA PARDINHO LTDA"
          onClose={() => {
            setShowResumo(false)
            setNfResumo(null)
          }}
        />
      )}

      {/* Modal de Detalhes */}
      {showDetailModal && detailNF && (
        <NotaFiscalDetailsModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          nf={detailNF}
          onEdit={(nf) => { setShowDetailModal(false); editarNF(nf); }}
        />
      )}

      {/* Importar Notas Fiscais (Excel/CSV) */}
      {showImportNF && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <DocumentArrowUpIcon className="h-8 w-8 text-amber-600" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Importar Notas Fiscais</h2>
                  <p className="text-gray-600 dark:text-gray-400">Cole dados do Excel/CSV e mapeie os campos</p>
                </div>
              </div>
              <button onClick={() => setShowImportNF(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold">×</button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Método */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Escolha o Método</h3>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input type="radio" value="excel" checked={importMethodNF === 'excel'} onChange={(e) => setImportMethodNF(e.target.value)} className="mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">📊 Excel/Planilha</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" value="csv" checked={importMethodNF === 'csv'} onChange={(e) => setImportMethodNF(e.target.value)} className="mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">CSV</span>
                  </label>
                </div>
              </div>

              {/* Instruções */}
              <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <h4 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">📋 Instruções</h4>
                <div className="space-y-1 text-sm text-amber-800 dark:text-amber-300">
                  <p><strong>Colunas sugeridas:</strong> Tipo, Número NF, Data, Fornecedor, Destino, Produto, Valor Total</p>
                  <p><strong>Exemplo:</strong> Entrada\t12345\t09/08/23\tFornecedor X\tDestino Y\tBovino\t1234,56</p>
                  <p><strong>Dica:</strong> Cole direto do Excel com TABs ou vírgulas</p>
                </div>
              </div>

              {/* Entrada de dados */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cole os dados aqui:</label>
                <textarea
                  value={importDataNF}
                  onChange={(e) => setImportDataNF(e.target.value)}
                  rows={8}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                  placeholder={'Entrada\t12345\t09/08/23\tFornecedor X\tDestino Y\tBovino\t1234,56\nSaída\t67890\t10/08/23\tFornecedor Z\tDestino W\tSêmen\t500,00'}
                />
              </div>

              {/* Configuração de Campos */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Configuração dos Campos</h4>
                <div className="flex items-center space-x-4 mb-3">
                  <label className="flex items-center">
                    <input type="radio" value="auto" checked={mappingModeNF === 'auto'} onChange={(e) => setMappingModeNF(e.target.value)} className="mr-2" />
                    Automático
                  </label>
                  <label className="flex items-center">
                    <input type="radio" value="manual" checked={mappingModeNF === 'manual'} onChange={(e) => setMappingModeNF(e.target.value)} className="mr-2" />
                    Manual (mapear colunas)
                  </label>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{headersDetectedNF.length ? 'Cabeçalhos detectados' : `${columnCountNF} colunas detectadas`}</span>
                </div>

                {mappingModeNF === 'manual' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {['tipo','numeroNF','data','fornecedor','destino','tipoProduto','valorTotal'].map((key) => (
                        <div key={key} className="p-2 border border-gray-200 dark:border-gray-700 rounded">
                          <label className="flex items-center text-xs text-gray-700 dark:text-gray-300 mb-1">
                            <input type="checkbox" checked={fieldMappingNF[key]?.enabled ?? true} onChange={(e) => updateMappingNF(key, { enabled: e.target.checked })} className="mr-2" />
                            {key}
                          </label>
                          <select value={fieldMappingNF[key]?.source || ''} onChange={(e) => updateMappingNF(key, { source: e.target.value })} className="w-full text-xs p-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700">
                            {(headersDetectedNF.length ? headersDetectedNF : Array.from({ length: columnCountNF }, (_, i) => `Coluna ${i + 1}`)).map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>

                    <div className="mt-2">
                      <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Campos adicionais</h5>
                      <div className="flex items-center space-x-2 mb-2">
                        <input value={newExtraNameNF} onChange={(e) => setNewExtraNameNF(e.target.value)} placeholder="Nome do campo" className="text-xs p-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700" />
                        <select value={newExtraSourceNF} onChange={(e) => setNewExtraSourceNF(e.target.value)} className="text-xs p-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700">
                          <option value="">Selecione...</option>
                          {(headersDetectedNF.length ? headersDetectedNF : Array.from({ length: columnCountNF }, (_, i) => `Coluna ${i + 1}`)).map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <button onClick={() => {
                          if (!newExtraNameNF || !newExtraSourceNF) return
                          setExtraFieldsNF((prev) => [...prev, { name: newExtraNameNF, source: newExtraSourceNF, enabled: true }])
                          setNewExtraNameNF('')
                          setNewExtraSourceNF('')
                        }} className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">Adicionar</button>
                      </div>

                      {extraFieldsNF.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {extraFieldsNF.map((f) => (
                            <div key={f.name} className="flex items-center justify-between text-xs p-1 border border-gray-200 dark:border-gray-700 rounded">
                              <label className="flex items-center">
                                <input type="checkbox" checked={f.enabled} onChange={(e) => setExtraFieldsNF((prev) => prev.map((x) => (x.name === f.name ? { ...x, enabled: e.target.checked } : x)))} className="mr-2" />
                                {f.name}
                              </label>
                              <div className="flex items-center space-x-2">
                                <select value={f.source} onChange={(e) => setExtraFieldsNF((prev) => prev.map((x) => (x.name === f.name ? { ...x, source: e.target.value } : x)))} className="text-xs p-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700">
                                  {(headersDetectedNF.length ? headersDetectedNF : Array.from({ length: columnCountNF }, (_, i) => `Coluna ${i + 1}`)).map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                                <button onClick={() => setExtraFieldsNF((prev) => prev.filter((x) => x.name !== f.name))} className="text-xs px-2 py-1 bg-red-500 text-white rounded">Excluir</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Validar */}
              <div className="mb-6">
                <button onClick={validateImportNF} disabled={!importDataNF.trim() || isValidatingNF} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed">{isValidatingNF ? 'Validando...' : 'Validar Dados'}</button>
              </div>

              {/* Resultados */}
              {validationNF && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">{validationNF.sucesso.length}</div>
                      <div className="text-sm text-green-600 dark:text-green-400">Válidos</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">{validationNF.erros.length}</div>
                      <div className="text-sm text-red-600 dark:text-red-400">Erros</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{validationNF.total}</div>
                      <div className="text-sm text-blue-600 dark:text-blue-400">Total</div>
                    </div>
                  </div>

                  {validationNF.erros.length > 0 && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <h4 className="font-semibold text-red-900 dark:text-red-200 mb-2">Erros Encontrados</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {validationNF.erros.map((erro, i) => (
                          <div key={i} className="text-sm text-red-800 dark:text-red-300">
                            <strong>Linha {erro.linha}:</strong> {erro.erro}
                            {erro.dados && <div className="font-mono text-xs mt-1 bg-red-100 dark:bg-red-900/40 p-1 rounded">{erro.dados}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {validationNF.sucesso.length > 0 && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <h4 className="font-semibold text-green-900 dark:text-green-200 mb-2">Notas Prontas para Importação ({validationNF.sucesso.length})</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {validationNF.sucesso.slice(0,5).map((nf,i) => (
                          <div key={i} className="text-sm text-green-800 dark:text-green-300 flex justify-between">
                            <span>{nf.tipo} #{nf.numeroNF || nf.numero_nf || 'N/A'}</span>
                            <span>{new Date(nf.data).toLocaleDateString('pt-BR')} - {formatCurrency(nf.valorTotal)}</span>
                          </div>
                        ))}
                        {validationNF.sucesso.length > 5 && (
                          <div className="text-sm text-green-600 dark:text-green-400">... e mais {validationNF.sucesso.length - 5} notas</div>
                        )}
                      </div>
                      <div className="mt-3">
                        <button onClick={handleImportNF} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Importar</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Painel de Integração */}
      {/* {showIntegrationPanel && (
        <PainelIntegracaoBoletim
          estatisticas={estatisticasIntegracao}
          onRefresh={loadEstatisticasIntegracao}
        />
      )} */}
    </div>
  )
}

