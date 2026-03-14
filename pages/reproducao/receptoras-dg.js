import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import { ArrowDownTrayIcon, CheckIcon, XMarkIcon } from '../../components/ui/Icons'
import { formatDateBR, formatDateForFilename } from '../../utils/dateFormatter'

const COLUNAS_EXPORTAR = [
  { id: 'lote', label: 'Nº Lote' },
  { id: 'letra', label: 'Letra' },
  { id: 'numero', label: 'Número' },
  { id: 'tatuagem', label: 'BRINCO' },
  { id: 'fornecedor', label: 'Fornecedor' },
  { id: 'dataChegada', label: 'Data Chegada' },
  { id: 'dataTE', label: 'Data de TE' },
  { id: 'diasPrenhas', label: 'Dias Prenhas' },
  { id: 'origem', label: 'Origem (NF)' },
  { id: 'dataDG', label: 'Data do DG' },
  { id: 'veterinario', label: 'Veterinário' },
  { id: 'resultado', label: 'Resultado' },
  { id: 'observacoes', label: 'Observações' }
]

export default function ReceptorasDG() {
  const router = useRouter()
  const [receptoras, setReceptoras] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Dados do lançamento em lote
  const [dataDG, setDataDG] = useState('')
  const [veterinario, setVeterinario] = useState('')
  const [lotesSelecionadosParaDG, setLotesSelecionadosParaDG] = useState([]) // Lotes selecionados (1-9)
  const [lotesAplicados, setLotesAplicados] = useState(false) // Se já aplicou o filtro de lotes
  
  // Seleção e resultados individuais
  const [selectedReceptoras, setSelectedReceptoras] = useState({})
  const [resultados, setResultados] = useState({})
  const [observacoes, setObservacoes] = useState({})
  const [datasIndividuais, setDatasIndividuais] = useState({}) // Novo: data individual por receptora
  const [veterinariosIndividuais, setVeterinariosIndividuais] = useState({}) // Novo: veterinário individual por receptora
  const [showImportModal, setShowImportModal] = useState(false)
  const [importText, setImportText] = useState('')
  const [importPreview, setImportPreview] = useState(null)
  const [importApplying, setImportApplying] = useState(false)

  // Modo de visualização: 'lotes' | 'lista'
  const [modoVisualizacao, setModoVisualizacao] = useState('lotes')
  const [loteFiltro, setLoteFiltro] = useState(null) // legado: um único lote para filtro
  // Seleção múltipla de lotes (cards) - usuário escolhe quais para DG
  const [lotesSelecionados, setLotesSelecionados] = useState(new Set())
  // Número do lote que o usuário define para cada card
  const [numerosLote, setNumerosLote] = useState({})

  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [itensPorPagina] = useState(10)

  // Busca
  const [termoBusca, setTermoBusca] = useState('')

  // Filtros rápidos
  const [filtroStatus, setFiltroStatus] = useState('todos') // todos, pendentes, comDG
  const [fornecedorFiltro, setFornecedorFiltro] = useState(null) // Novo: filtro por fornecedor
  const [compactMode, setCompactMode] = useState(false)

  // Ações em massa
  const [showAcoesMassa, setShowAcoesMassa] = useState(false)

  // Modal de detalhes de erros do lançamento em lote
  const [errosDetalhes, setErrosDetalhes] = useState(null)

  // Export: modal com escolha de colunas
  const [showExportModal, setShowExportModal] = useState(false)
  const [colunasSelecionadas, setColunasSelecionadas] = useState(
    COLUNAS_EXPORTAR.reduce((acc, c) => ({ ...acc, [c.id]: true }), {})
  )
  const [fornecedorLista, setFornecedorLista] = useState(null)

  useEffect(() => {
    loadReceptoras()
  }, [])
  
  const exportReceptorasCSV = (lista) => {
    try {
      const header = ['RG','Série','Letra','Número','Fornecedor','Data Chegada','Data TE','Data DG','Resultado','Veterinário','Dias','Origem/NF']
      const lines = [header.join(';'), ...lista.map(r => {
        const dias = (r.dataTE || r.dataChegada) ? Math.floor((new Date() - new Date(r.dataTE || r.dataChegada)) / (24*60*60*1000)) : ''
        const resultado = r.resultadoDG || ''
        return [
          r.rg || '',
          r.serie || '',
          r.letra || '',
          r.numero || '',
          r.fornecedor || 'Sem Fornecedor',
          r.dataChegada ? new Date(r.dataChegada).toLocaleDateString('pt-BR') : '',
          r.dataTE ? new Date(r.dataTE).toLocaleDateString('pt-BR') : '',
          r.dataDG ? new Date(r.dataDG).toLocaleDateString('pt-BR') : '',
          resultado,
          r.veterinario || '',
          dias,
          r.origem || r.nf_numero || ''
        ].join(';')
      })]
      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `receptoras-dg-${formatDateForFilename(new Date().toISOString().slice(0,10))}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('Erro ao exportar CSV: ' + e.message)
    }
  }

  const validarImportacaoTexto = () => {
    const linhas = String(importText || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    const mapa = new Map()
    receptoras.forEach(r => {
      const chave = String(r.numero || r.rg || '').replace(/^0+/, '')
      if (chave) mapa.set(chave, r)
    })
    const parseData = (s) => {
      if (!s) return null
      const a = s.match(/(\d{2})\/(\d{2})\/(\d{4})/)
      if (a) return `${a[3]}-${a[2]}-${a[1]}`
      const b = s.match(/(\d{4})-(\d{2})-(\d{2})/)
      if (b) return `${b[1]}-${b[2]}-${b[3]}`
      return null
    }
    const items = linhas.map(l => {
      const partes = l.split(/[;,\t]| {2,}/).map(p => p.trim()).filter(Boolean)
      let rg = null, resultado = null, data = null, vet = null
      partes.forEach(p => {
        const n = p.replace(/[^0-9]/g, '')
        if (!rg && n.length >= 3) rg = n
        const low = p.toLowerCase()
        if (!resultado && (low.includes('pren') || low.includes('posi') || low.includes('vaz') || low.includes('nega'))) {
          resultado = low.includes('vaz') || low.includes('nega') ? 'Vazia' : 'Prenha'
        }
        if (!data) {
          const d = parseData(p)
          if (d) data = d
        }
      })
      if (!vet) {
        const candidatos = partes.filter(p => !/\d/.test(p) && !/pren|vaz|posi|nega/i.test(p))
        if (candidatos.length > 0) vet = candidatos[candidatos.length - 1]
      }
      const chave = String(rg || '').replace(/^0+/, '')
      const match = mapa.get(chave)
      const id = match ? (match.animalId || `${match.letra}_${match.numero}`) : null
      return { linha: l, rg: chave, dataDG: data, resultado, veterinario: vet, id, match }
    })
    const matched = items.filter(i => i.match).length
    setImportPreview({ items, matched, total: linhas.length })
  }

  const aplicarImportacaoTexto = () => {
    if (!importPreview || !importPreview.items) return
    setImportApplying(true)
    const sel = { ...selectedReceptoras }
    const res = { ...resultados }
    const dInd = { ...datasIndividuais }
    const vInd = { ...veterinariosIndividuais }
    importPreview.items.forEach(i => {
      if (!i.id) return
      sel[i.id] = true
      if (i.resultado) res[i.id] = i.resultado
      if (i.dataDG) dInd[i.id] = i.dataDG
      if (i.veterinario) vInd[i.id] = i.veterinario
    })
    setSelectedReceptoras(sel)
    setResultados(res)
    setDatasIndividuais(dInd)
    setVeterinariosIndividuais(vInd)
    setShowImportModal(false)
    setImportApplying(false)
  }

  // Agrupar receptoras por lote (NF + fornecedor + data chegada)
  const lotesTodos = useMemo(() => {
    const map = new Map()
    receptoras.forEach(r => {
      const dataChegada = r.dataChegada ? formatDateBR(r.dataChegada) : '-'
      const chave = `${r.nf_numero || r.origem || 'NF'}|${(r.fornecedor || '').substring(0, 30)}|${dataChegada}`
      if (!map.has(chave)) {
        map.set(chave, {
          chave,
          nf_numero: r.nf_numero || r.origem,
          fornecedor: r.fornecedor || '-',
          dataChegada: r.dataChegada,
          receptoras: []
        })
      }
      map.get(chave).receptoras.push(r)
    })
    return Array.from(map.values()).sort((a, b) => {
      const dA = a.dataChegada ? new Date(a.dataChegada).getTime() : 0
      const dB = b.dataChegada ? new Date(b.dataChegada).getTime() : 0
      return dB - dA
    })
  }, [receptoras])

  // Somente lotes com pelo menos uma receptora PENDENTE de DG (sem dataDG)
  const lotes = useMemo(() => {
    return lotesTodos.filter(lote => lote.receptoras.some(r => !r.dataDG))
  }, [lotesTodos])

  // Inicializar números de lote sequenciais quando lotes mudam
  useEffect(() => {
    if (lotes.length > 0) {
      setNumerosLote(prev => {
        const next = { ...prev }
        lotes.forEach((lote, idx) => {
          if (next[lote.chave] == null) {
            next[lote.chave] = idx + 1
          }
        })
        return next
      })
    }
  }, [lotes])

  // Helper: chave do lote para uma receptora
  const getChaveLote = (r) => {
    const dataChegada = r.dataChegada ? formatDateBR(r.dataChegada) : '-'
    return `${r.nf_numero || r.origem || 'NF'}|${(r.fornecedor || '').substring(0, 30)}|${dataChegada}`
  }

  // Aplicar filtro de lotes e selecionar automaticamente as receptoras pendentes
  const aplicarFiltroLotes = () => {
    if (lotesSelecionadosParaDG.length === 0) {
      alert('⚠️ Selecione pelo menos um lote')
      return
    }
    setLotesAplicados(true)
    // Calcular receptoras que estarão no filtro (pendentes de DG)
    const lotesParaFiltrar = lotes.filter((_, idx) => lotesSelecionadosParaDG.includes(idx + 1))
    const chavesLotes = new Set(lotesParaFiltrar.map(l => l.chave))
    const receptorasNoFiltro = receptoras.filter(r => chavesLotes.has(getChaveLote(r)))
    const pendentes = receptorasNoFiltro.filter(r => !r.dataDG)
    // Selecionar automaticamente todas as pendentes
    setSelectedReceptoras(prev => {
      const next = { ...prev }
      pendentes.forEach(r => {
        const id = r.animalId || `${r.letra}_${r.numero}`
        next[id] = true
      })
      return next
    })
  }

  const abrirListaFornecedor = (fornecedor, status) => {
    const base = receptoras.filter(r => (r.fornecedor || 'Sem Fornecedor') === fornecedor)
    let itens = []
    if (status === 'prenhas') {
      itens = base.filter(r => {
        const res = r.resultadoDG
        return res && (res.toLowerCase().includes('pren') || res.toLowerCase().includes('positivo'))
      })
    } else if (status === 'vazias') {
      itens = base.filter(r => {
        const res = r.resultadoDG
        return res && (res.toLowerCase().includes('vaz') || res.toLowerCase().includes('negativo'))
      })
    } else if (status === 'pendentes') {
      itens = base.filter(r => !r.dataDG)
    }
    setFornecedorLista({
      fornecedor,
      status,
      itens: itens.sort((a, b) => (a.numero || 0) - (b.numero || 0))
    })
  }

  const fecharListaFornecedor = () => setFornecedorLista(null)

  // Limpar filtro de lotes
  const limparFiltroLotes = () => {
    setLotesAplicados(false)
    setLotesSelecionadosParaDG([])
  }

  // Toggle seleção de lote
  const toggleLoteSelecionado = (numeroLote) => {
    setLotesSelecionadosParaDG(prev => {
      if (prev.includes(numeroLote)) {
        return prev.filter(l => l !== numeroLote)
      } else {
        return [...prev, numeroLote].sort((a, b) => a - b)
      }
    })
  }

  // Receptoras filtradas (por lotes selecionados ou todas)
  // IMPORTANTE: Em modo "lotes", por padrão considera apenas os 6 primeiros lotes (disponíveis para DG)
  const receptorasExibidas = useMemo(() => {
    let lista = receptoras
    
    // Filtro por lotes aplicados (baseado nos cards de lotes)
    if (lotesAplicados && lotesSelecionadosParaDG.length > 0) {
      // Filtrar pelos lotes (cards) selecionados
      const lotesParaFiltrar = lotes.filter((lote, idx) => 
        lotesSelecionadosParaDG.includes(idx + 1)
      )
      const chavesLotes = new Set(lotesParaFiltrar.map(l => l.chave))
      lista = receptoras.filter(r => chavesLotes.has(getChaveLote(r)))
    }
    
    // Filtro por lotes selecionados (seleção múltipla de cards)
    else if (modoVisualizacao === 'lotes' && lotesSelecionados.size > 0) {
      lista = receptoras.filter(r => lotesSelecionados.has(getChaveLote(r)))
    } else if (modoVisualizacao === 'lotes' && loteFiltro) {
      // Fallback: filtro por um único lote (legado)
      const lote = lotes.find(l => l.chave === loteFiltro)
      lista = lote ? lote.receptoras : receptoras
    }
    // Em modo lotes SEM filtro: mostrar todos (API já retorna só pendentes)
    else if (modoVisualizacao === 'lotes' && lotes.length > 0) {
      lista = receptoras
    }

    // Filtro por fornecedor
    if (fornecedorFiltro) {
      lista = lista.filter(r => (r.fornecedor || 'Sem Fornecedor') === fornecedorFiltro)
    }

    // Filtro por status
    if (filtroStatus === 'pendentes') {
      lista = lista.filter(r => !r.dataDG)
    } else if (filtroStatus === 'comDG') {
      lista = lista.filter(r => r.dataDG)
    }

    return lista
  }, [receptoras, modoVisualizacao, loteFiltro, lotes, filtroStatus, lotesSelecionados, fornecedorFiltro, lotesAplicados, lotesSelecionadosParaDG])

  // Receptoras filtradas por busca
  const receptorasFiltradas = useMemo(() => {
    if (!termoBusca.trim()) return receptorasExibidas
    
    const termo = termoBusca.toLowerCase().trim()
    return receptorasExibidas.filter(r => {
      const letra = (r.letra || '').toLowerCase()
      const numero = (r.numero || '').toString().toLowerCase()
      const rg = (r.rg || '').toString().toLowerCase()
      const serie = (r.serie || '').toLowerCase()
      const nome = (r.nome || '').toLowerCase()
      const fornecedor = (r.fornecedor || '').toLowerCase()
      const nf = (r.nf_numero || r.origem || '').toString().toLowerCase()
      const tatuagem = (r.tatuagem || '').toLowerCase()
      
      return letra.includes(termo) || 
             numero.includes(termo) || 
             rg.includes(termo) ||
             serie.includes(termo) ||
             nome.includes(termo) ||
             fornecedor.includes(termo) ||
             nf.includes(termo) ||
             tatuagem.includes(termo)
    })
  }, [receptorasExibidas, termoBusca])

  // Paginação
  const totalPaginas = Math.ceil(receptorasFiltradas.length / itensPorPagina)
  const indiceInicio = (paginaAtual - 1) * itensPorPagina
  const indiceFim = indiceInicio + itensPorPagina
  const receptorasPaginadas = receptorasFiltradas.slice(indiceInicio, indiceFim)
  
  const resumoDG = useMemo(() => {
    const comDG = receptorasExibidas.filter(r => r.dataDG).length
    const prenhas = receptorasExibidas.filter(r => {
      const res = (r.resultadoDG || '').toLowerCase()
      return r.dataDG && (res.includes('pren') || res.includes('posit'))
    }).length
    const vazias = receptorasExibidas.filter(r => {
      const res = (r.resultadoDG || '').toLowerCase()
      return r.dataDG && (res.includes('vaz') || res.includes('negat'))
    }).length
    const pendentes = receptorasExibidas.filter(r => !r.dataDG).length
    const taxa = comDG > 0 ? Math.round((prenhas / comDG) * 100) : 0
    return { comDG, prenhas, vazias, pendentes, taxa }
  }, [receptorasExibidas])

  // Reset página ao mudar filtros
  useEffect(() => {
    setPaginaAtual(1)
  }, [termoBusca, loteFiltro, modoVisualizacao, filtroStatus, lotesSelecionados])

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl/Cmd + S para salvar
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (dataDG && veterinario && Object.values(selectedReceptoras).some(v => v)) {
          salvarLote()
        }
      }
      // Ctrl/Cmd + F para focar na busca
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        document.getElementById('busca-receptoras')?.focus()
      }
      // Ctrl/Cmd + A para selecionar todas da página (exceto as que já têm DG)
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && e.target.tagName !== 'INPUT') {
        e.preventDefault()
        const indiceInicio = (paginaAtual - 1) * itensPorPagina
        const indiceFim = indiceInicio + itensPorPagina
        const paginadas = receptorasFiltradas.slice(indiceInicio, indiceFim)
        const novo = { ...selectedReceptoras }
        paginadas.forEach(r => {
          if (r.dataDG) return // Não seleciona receptoras que já têm DG
          const id = r.animalId || `${r.letra}_${r.numero}`
          novo[id] = true
        })
        setSelectedReceptoras(novo)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [dataDG, veterinario, selectedReceptoras, paginaAtual, itensPorPagina, receptorasFiltradas])

  // Ações em massa
  const marcarTodasComoPrenha = () => {
    const novo = { ...resultados }
    Object.keys(selectedReceptoras).forEach(id => {
      if (selectedReceptoras[id]) {
        novo[id] = 'Prenha'
      }
    })
    setResultados(novo)
    setShowAcoesMassa(false)
  }

  const marcarTodasComoVazia = () => {
    const novo = { ...resultados }
    Object.keys(selectedReceptoras).forEach(id => {
      if (selectedReceptoras[id]) {
        novo[id] = 'Vazia'
      }
    })
    setResultados(novo)
    setShowAcoesMassa(false)
  }

  const desmarcarTodas = () => {
    setSelectedReceptoras(Object.keys(selectedReceptoras).reduce((acc, key) => ({ ...acc, [key]: false }), {}))
    setShowAcoesMassa(false)
  }

  // Estatísticas avançadas
  const estatisticasAvancadas = useMemo(() => {
    const prenhas = receptoras.filter(r => {
      const res = r.resultadoDG
      return res && (res.toLowerCase().includes('pren') || res.toLowerCase().includes('positivo'))
    }).length
    
    const vazias = receptoras.filter(r => {
      const res = r.resultadoDG
      return res && (res.toLowerCase().includes('vaz') || res.toLowerCase().includes('negativo'))
    }).length
    
    const comDG = receptoras.filter(r => r.dataDG).length
    const taxaPrenhez = comDG > 0 ? ((prenhas / comDG) * 100).toFixed(1) : 0
    
    // Dias médios até DG
    const receptorasComTE = receptoras.filter(r => r.dataTE && r.dataDG)
    const mediaDias = receptorasComTE.length > 0
      ? Math.round(receptorasComTE.reduce((acc, r) => {
          const dias = Math.floor((new Date(r.dataDG) - new Date(r.dataTE)) / (24 * 60 * 60 * 1000))
          return acc + dias
        }, 0) / receptorasComTE.length)
      : 0
    
    // Estatísticas por lote selecionado
    const receptorasSelecionadasLote = lotesSelecionados.size > 0
      ? receptoras.filter(r => lotesSelecionados.has(getChaveLote(r)))
      : []
    
    const prenhasLote = receptorasSelecionadasLote.filter(r => {
      const res = r.resultadoDG
      return res && (res.toLowerCase().includes('pren') || res.toLowerCase().includes('positivo'))
    }).length
    
    const taxaPrenhezLote = receptorasSelecionadasLote.length > 0
      ? ((prenhasLote / receptorasSelecionadasLote.length) * 100).toFixed(1)
      : 0
    
    return {
      prenhas,
      vazias,
      comDG,
      taxaPrenhez,
      mediaDias,
      receptorasSelecionadasLote: receptorasSelecionadasLote.length,
      prenhasLote,
      taxaPrenhezLote
    }
  }, [receptoras, lotesSelecionados])

  const selecionadasCount = Object.values(selectedReceptoras).filter(v => v).length

  const loadReceptoras = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/receptoras/lista-dg?incluirComDG=true')
      if (response.ok) {
        const result = await response.json()
        const data = result.data || []
        setReceptoras(data)
        
        // Inicializar seleção e resultados
        const initialSelected = {}
        const initialResultados = {}
        const initialObservacoes = {}
        data.forEach(r => {
          initialSelected[r.animalId || `${r.letra}_${r.numero}`] = false
          // Todas começam como Prenha por padrão
          initialResultados[r.animalId || `${r.letra}_${r.numero}`] = r.resultadoDG || 'Prenha'
          initialObservacoes[r.animalId || `${r.letra}_${r.numero}`] = r.observacoes || ''
        })
        setSelectedReceptoras(initialSelected)
        setResultados(initialResultados)
        setObservacoes(initialObservacoes)
      } else {
        console.error('Erro ao carregar receptoras')
        setReceptoras([])
      }
    } catch (error) {
      console.error('Erro ao carregar receptoras:', error)
      setReceptoras([])
    } finally {
      setLoading(false)
    }
  }

  const toggleSelectAll = () => {
    const allSelected = Object.values(selectedReceptoras).every(v => v)
    const newSelected = {}
    Object.keys(selectedReceptoras).forEach(key => {
      newSelected[key] = !allSelected
    })
    setSelectedReceptoras(newSelected)
  }

  const toggleSelect = (id) => {
    setSelectedReceptoras(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const setResultado = (id, resultado) => {
    setResultados(prev => ({
      ...prev,
      [id]: resultado
    }))
  }

  const setObservacao = (id, obs) => {
    setObservacoes(prev => ({
      ...prev,
      [id]: obs
    }))
  }

  const setDataIndividual = (id, data) => {
    setDatasIndividuais(prev => ({
      ...prev,
      [id]: data
    }))
  }

  const setVeterinarioIndividual = (id, vet) => {
    setVeterinariosIndividuais(prev => ({
      ...prev,
      [id]: vet
    }))
  }

  const salvarIndividual = async (receptora) => {
    const id = receptora.animalId || `${receptora.letra}_${receptora.numero}`
    const dataIndividual = datasIndividuais[id]
    const veterinarioIndividual = veterinariosIndividuais[id]

    if (!dataIndividual) {
      alert('⚠️ Por favor, informe a data do DG para esta receptora')
      return
    }

    if (!veterinarioIndividual) {
      alert('⚠️ Por favor, informe o veterinário para esta receptora')
      return
    }

    // Verificar se já tem DG
    if (receptora.dataDG) {
      alert(`⚠️ Esta receptora já possui DG lançado em ${formatDateBR(receptora.dataDG)}`)
      return
    }

    const resultado = resultados[id]

    if (!resultado) {
      alert('⚠️ Por favor, selecione o resultado (Prenha ou Vazia)')
      return
    }

    const identificador = receptora.rg || receptora.numero || receptora.letra
    if (!confirm(`Confirma o lançamento do DG para a receptora ${identificador}?\n\nData: ${formatDateBR(dataIndividual)}\nVeterinário: ${veterinarioIndividual}\nResultado: ${resultado}`)) {
      return
    }

    try {
      setSaving(true)

      // Encontrar o índice do lote desta receptora
      const chaveLote = getChaveLote(receptora)
      const indiceLote = lotes.findIndex(l => l.chave === chaveLote)
      const numeroLote = indiceLote >= 0 ? indiceLote + 1 : 1

      const payload = [{
        animalId: receptora.animalId || null,
        letra: receptora.letra || receptora.serie,
        numero: receptora.numero || receptora.rg,
        resultadoDG: resultado,
        observacoes: observacoes[id] || '',
        lote: numeroLote,
        numeroNF: receptora.nf_numero || receptora.numeroNF || receptora.origem
      }]

      console.log('📤 Salvamento individual:', { dataDG: dataIndividual, veterinario: veterinarioIndividual, receptora: payload[0] })

      const response = await fetch('/api/receptoras/lancar-dg-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          dataDG: dataIndividual, 
          veterinario: veterinarioIndividual, 
          lotes: [], 
          receptoras: payload 
        })
      })

      const result = await response.json().catch(() => ({}))

      if (response.ok && result.sucessos > 0) {
        const isPrenha = resultado.toLowerCase().includes('pren') || resultado.toLowerCase().includes('positivo')
        let mensagem = `✅ DG da receptora ${identificador} salvo com sucesso!`
        if (isPrenha) {
          mensagem += `\n\n🤰 Receptora prenha registrada no menu de Nascimentos com parto previsto para 9 meses após a TE.`
        }
        alert(mensagem)
        
        // Atualização otimista do card/resumo: refletir DG imediatamente no estado local
        setReceptoras(prev => prev.map(r => {
          const matchPorId = r.animalId && receptora.animalId && r.animalId === receptora.animalId
          const matchPorSerieRg = (r.letra === receptora.letra) && (String(r.numero) === String(receptora.numero))
          if (matchPorId || matchPorSerieRg) {
            return {
              ...r,
              dataDG: dataIndividual,
              resultadoDG: resultado,
              veterinario: veterinarioIndividual
            }
          }
          return r
        }))
        
        // Limpar apenas esta receptora
        setResultados(prev => {
          const novo = { ...prev }
          delete novo[id]
          return novo
        })
        setObservacoes(prev => {
          const novo = { ...prev }
          delete novo[id]
          return novo
        })
        setDatasIndividuais(prev => {
          const novo = { ...prev }
          delete novo[id]
          return novo
        })
        setVeterinariosIndividuais(prev => {
          const novo = { ...prev }
          delete novo[id]
          return novo
        })
        
        
      } else {
        const msg = result?.message || result?.error || `Erro ${response.status}`
        alert(`❌ Erro ao salvar DG: ${msg}`)
      }
    } catch (error) {
      console.error('Erro ao salvar individual:', error)
      alert('❌ Erro ao salvar dados no PostgreSQL')
    } finally {
      setSaving(false)
    }
  }

  const salvarLote = async () => {
    if (!dataDG) {
      alert('⚠️ Por favor, informe a data do DG')
      return
    }

    if (!veterinario) {
      alert('⚠️ Por favor, informe o veterinário')
      return
    }

    let selecionadas = receptoras.filter(r => {
      const id = r.animalId || `${r.letra}_${r.numero}`
      return selectedReceptoras[id]
    })

    // Excluir receptoras que já possuem DG (ex: 8251) - não devem entrar no lançamento
    const comDG = selecionadas.filter(r => r.dataDG)
    selecionadas = selecionadas.filter(r => !r.dataDG)

    if (selecionadas.length === 0) {
      if (comDG.length > 0) {
        const exemplos = comDG.slice(0, 3).map(r => r.rg || r.numero).join(', ')
        alert(`⚠️ Todas as receptoras selecionadas já possuem DG (ex: ${exemplos}). Nenhuma pendente para lançar.`)
      } else {
        alert('⚠️ Selecione pelo menos uma receptora')
      }
      return
    }

    // Verificar se todas as selecionadas têm resultado
    const semResultado = selecionadas.filter(r => {
      const id = r.animalId || `${r.letra}_${r.numero}`
      return !resultados[id]
    })

    if (semResultado.length > 0) {
      alert(`⚠️ ${semResultado.length} receptora(s) sem resultado definido`)
      return
    }

    let msgConfirm = `Confirma o lançamento do DG para ${selecionadas.length} receptora(s)?`
    if (comDG.length > 0) {
      const exemplos = comDG.slice(0, 3).map(r => r.rg || r.numero).join(', ')
      msgConfirm = `${comDG.length} receptora(s) já possuem DG (ex: ${exemplos}) e serão ignoradas.\n\n` + msgConfirm
    }
    if (!confirm(msgConfirm)) {
      return
    }

    try {
      setSaving(true)

      const payload = selecionadas.map(r => {
        const id = r.animalId || `${r.letra}_${r.numero}`
        // Encontrar o índice do lote desta receptora
        const chaveLote = getChaveLote(r)
        const indiceLote = lotes.findIndex(l => l.chave === chaveLote)
        const numeroLote = indiceLote >= 0 ? indiceLote + 1 : 1
        
        const receptoraPayload = {
          animalId: r.animalId || null,
          letra: r.letra || r.serie,
          numero: r.numero || r.rg,
          resultadoDG: resultados[id],
          observacoes: observacoes[id] || '',
          lote: numeroLote,
          numeroNF: r.nf_numero || r.numeroNF || r.origem
        }
        
        console.log('📤 Payload da receptora:', receptoraPayload);
        
        return receptoraPayload;
      })
      
      console.log('📤 Payload completo:', { dataDG, veterinario, lotes: lotesSelecionadosParaDG, receptoras: payload });

      const response = await fetch('/api/receptoras/lancar-dg-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          dataDG, 
          veterinario, 
          lotes: lotesSelecionadosParaDG, 
          receptoras: payload 
        })
      })

      const result = await response.json().catch(() => ({}))
      const sucessos = result.sucessos || 0
      const erros = result.erros || 0
      const detalhes = result.detalhes || []

      if (response.ok && sucessos > 0) {
        const prenhas = selecionadas.filter(r => {
          const id = r.animalId || `${r.letra}_${r.numero}`
          const res = resultados[id]
          return res && (res.toLowerCase().includes('pren') || res.toLowerCase().includes('positivo'))
        }).length

        let mensagem = `✅ ${sucessos} receptora(s) atualizada(s) com sucesso no PostgreSQL!`
        if (prenhas > 0) {
          mensagem += `\n\n🤰 ${prenhas} receptora(s) prenha(s) registrada(s) no menu de Nascimentos com parto previsto para 9 meses após a TE.`
        }
        if (erros > 0) {
          mensagem += `\n\n⚠️ ${erros} erro(s) encontrado(s). Clique em OK para ver os detalhes.`
          const errosLista = detalhes.filter(d => d.erro).map(d => ({ receptora: d.identificador, erro: d.erro }))
          setErrosDetalhes({ total: erros, lista: errosLista })
        }
        
        alert(mensagem)
        // Atualização otimista: marcar as selecionadas como com DG no estado local,
        // para refletir imediatamente nos cards por fornecedor
        setReceptoras(prev => prev.map(r => {
          const idR = r.animalId || `${r.letra}_${r.numero}`
          const foiSelecionada = !!selecionadas.find(sel => {
            const idSel = sel.animalId || `${sel.letra}_${sel.numero}`
            return idSel === idR
          })
          if (!foiSelecionada) return r
          const res = resultados[idR]
          return {
            ...r,
            dataDG: dataDG,
            resultadoDG: res,
            veterinario
          }
        }))
        setDataDG('')
        setVeterinario('')
        setLotesSelecionadosParaDG([]) // Resetar lotes selecionados
        setLotesAplicados(false) // Resetar filtro aplicado
        setSelectedReceptoras({}) // Limpar seleção
        setResultados({}) // Limpar resultados
        setObservacoes({}) // Limpar observações
        // Redirecionar apenas quando não houver erros (para o usuário poder ver o modal de detalhes)
        if (erros === 0) {
          router.push('/nascimentos')
        }
      } else if (response.ok && sucessos === 0 && erros > 0) {
        const errosLista = detalhes.filter(d => d.erro).map(d => ({ receptora: d.identificador, erro: d.erro }))
        setErrosDetalhes({ total: erros, lista: errosLista })
        alert(`❌ Erro ao atualizar receptoras no PostgreSQL. ${erros} falha(s). Clique em OK para ver os detalhes.`)
      } else {
        const msg = result?.message || result?.error || `Erro ${response.status}`
        alert(`❌ Erro ao atualizar receptoras no PostgreSQL: ${msg}`)
      }
    } catch (error) {
      console.error('Erro ao salvar lote:', error)
      alert('❌ Erro ao salvar dados no PostgreSQL')
    } finally {
      setSaving(false)
    }
  }

  const exportarExcel = async () => {
    const cols = COLUNAS_EXPORTAR.filter(c => colunasSelecionadas[c.id])
    if (cols.length === 0) {
      alert('Selecione pelo menos uma coluna para exportar')
      return
    }
    try {
      setExporting(true)
      setShowExportModal(false)

      const ExcelJS = (await import('exceljs')).default
      const workbook = new ExcelJS.Workbook()
      workbook.creator = 'Beef-Sync'
      workbook.created = new Date()
      workbook.title = 'Lista de Receptoras para DG'

      const worksheet = workbook.addWorksheet('Receptoras DG')
      worksheet.properties.defaultRowHeight = 20
      worksheet.views = [{ showGridLines: true }]

      const mergeCols = cols.length
      worksheet.mergeCells(1, 1, 1, mergeCols)
      const titleRow = worksheet.getRow(1)
      titleRow.getCell(1).value = 'LISTA DE RECEPTORAS PARA DIAGNÓSTICO DE GESTAÇÃO (DG)-Criado por Beef-Sync '
      titleRow.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } }
      titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE91E63' } }
      titleRow.alignment = { vertical: 'middle', horizontal: 'center' }
      titleRow.height = 35

      worksheet.addRow([])
      const receptorasParaExportar = lotesSelecionados.size > 0 
        ? receptoras.filter(r => lotesSelecionados.has(getChaveLote(r)))
        : receptoras
      worksheet.addRow(['Gerado em:', formatDateBR(new Date(), true)])
      worksheet.addRow(['Total de Receptoras:', receptorasParaExportar.length])
      if (lotesSelecionados.size > 0) {
        worksheet.addRow(['Lotes selecionados:', Array.from(lotesSelecionados).length])
      }
      worksheet.addRow([])

      const headers = cols.map(c => c.label)
      const headerRow = worksheet.addRow(headers)
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9C27B0' } }
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' }
      headerRow.height = 25

      receptorasParaExportar.forEach(receptora => {
        const id = receptora.animalId || `${receptora.letra}_${receptora.numero}`
        const res = resultados[id] || receptora.resultadoDG
        const resultado = res && (String(res).toUpperCase().includes('P') || String(res).toUpperCase().includes('PRENHA') || String(res).toUpperCase().includes('POSITIVO')) ? 'Prenha' : (res ? 'Vazia' : '')
        const tatuagem = `${receptora.letra || ''} ${receptora.numero || ''}`.trim()

        const dataRef = receptora.dataTE || receptora.dataChegada
        const hoje = new Date()
        const diasPrenhas = (resultado === 'Prenha' && dataRef)
          ? Math.floor((hoje - new Date(dataRef)) / (24 * 60 * 60 * 1000))
          : ''

        const chaveLote = getChaveLote(receptora)
        const valores = {}
        if (colunasSelecionadas.lote) valores.lote = numerosLote[chaveLote] ?? ''
        if (colunasSelecionadas.letra) valores.letra = receptora.letra || ''
        if (colunasSelecionadas.numero) valores.numero = receptora.numero || ''
        if (colunasSelecionadas.tatuagem) valores.tatuagem = tatuagem || ''
        if (colunasSelecionadas.fornecedor) valores.fornecedor = receptora.fornecedor || ''
        if (colunasSelecionadas.dataChegada) valores.dataChegada = formatDateBR(receptora.dataChegada)
        if (colunasSelecionadas.dataTE) valores.dataTE = formatDateBR(receptora.dataTE)
        if (colunasSelecionadas.diasPrenhas) valores.diasPrenhas = diasPrenhas !== '' ? diasPrenhas : ''
        if (colunasSelecionadas.origem) valores.origem = receptora.origem || receptora.nf_numero || ''
        if (colunasSelecionadas.dataDG) valores.dataDG = formatDateBR(receptora.dataDG)
        if (colunasSelecionadas.veterinario) valores.veterinario = receptora.veterinario || ''
        if (colunasSelecionadas.resultado) valores.resultado = resultado
        if (colunasSelecionadas.observacoes) valores.observacoes = observacoes[id] || receptora.observacoes || ''

        const row = cols.map(c => valores[c.id] ?? '')
        worksheet.addRow(row)
      })

      cols.forEach((_, i) => worksheet.getColumn(i + 1).width = Math.min(30, Math.max(12, (cols[i]?.label?.length || 10) + 2)))

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Lista_Receptoras_DG_${formatDateForFilename()}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      alert('✅ Relatório exportado com sucesso!')
    } catch (error) {
      console.error('Erro ao exportar:', error)
      alert('❌ Erro ao exportar relatório')
    } finally {
      setExporting(false)
    }
  }

  const toggleColunaExport = (id) => {
    setColunasSelecionadas(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const selecionarTodasColunas = (sim) => {
    setColunasSelecionadas(COLUNAS_EXPORTAR.reduce((acc, c) => ({ ...acc, [c.id]: sim }), {}))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 max-w-[1800px] mx-auto">
      {/* Header com gradiente */}
      <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              🤰 Diagnóstico de Gestação
            </h2>
            <p className="text-white/90 mt-2 text-lg">
              Lançamento em lote de DG para receptoras
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowExportModal(true)}
              disabled={exporting || receptoras.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-green-600 rounded-xl hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl font-semibold"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              {exporting ? 'Exportando...' : 'Exportar Excel'}
            </button>
            <div className="flex rounded-xl overflow-hidden shadow-lg bg-white/20 backdrop-blur-sm">
              <button
                onClick={() => { setModoVisualizacao('lotes'); setLoteFiltro(null) }}
                className={`px-4 py-2.5 text-sm font-semibold transition-all ${modoVisualizacao === 'lotes' ? 'bg-white text-purple-600 shadow-md' : 'text-white hover:bg-white/10'}`}
              >
                📦 Por Lote
              </button>
              <button
                onClick={() => { setModoVisualizacao('lista'); setLoteFiltro(null) }}
                className={`px-4 py-2.5 text-sm font-semibold transition-all ${modoVisualizacao === 'lista' ? 'bg-white text-purple-600 shadow-md' : 'text-white hover:bg-white/10'}`}
              >
                📋 Lista Completa
              </button>
            </div>
          </div>
        </div>

        {/* Atalhos de teclado */}
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="flex flex-wrap gap-3 text-xs text-white/80">
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg">
              <kbd className="bg-white/20 px-2 py-0.5 rounded font-mono">Ctrl+S</kbd>
              <span>Salvar</span>
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg">
              <kbd className="bg-white/20 px-2 py-0.5 rounded font-mono">Ctrl+F</kbd>
              <span>Buscar</span>
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg">
              <kbd className="bg-white/20 px-2 py-0.5 rounded font-mono">Ctrl+A</kbd>
              <span>Selecionar página</span>
            </span>
          </div>
        </div>
      </div>

      {/* Cards de Lotes - Somente lotes com receptoras pendentes de DG */}
      {modoVisualizacao === 'lotes' && (
        <div className="space-y-3">
          {lotes.length === 0 ? (
            <div className="p-8 rounded-2xl bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 text-center">
              <p className="text-lg font-semibold text-green-800 dark:text-green-200">
                ✅ Todos os lotes já foram diagnosticados
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                Não há lotes pendentes de DG. Somente novos lotes que chegarem aparecerão aqui.
              </p>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                📦 Lotes pendentes de DG
                <span className="text-sm font-normal text-gray-500">({lotes.length} lote{lotes.length !== 1 ? 's' : ''})</span>
                {lotesSelecionados.size > 0 && (
                  <span className="text-sm font-semibold text-purple-600 dark:text-purple-400 ml-2">
                    • {lotesSelecionados.size} selecionado{lotesSelecionados.size !== 1 ? 's' : ''} para DG
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Clique nos cards para selecionar os lotes. Somente lotes com receptoras pendentes de DG são exibidos.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {lotes.map(lote => {
              const selecionado = lotesSelecionados.has(lote.chave)
              const qtd = lote.receptoras.length
              const dataStr = lote.dataChegada ? formatDateBR(lote.dataChegada) : '-'
              const origemCurta = (lote.fornecedor || 'Origem').split(/\s+/)[0] || lote.fornecedor?.substring(0, 20) || 'Origem'
              const numeroLote = numerosLote[lote.chave] ?? ''
              return (
                <div
                  key={lote.chave}
                  onClick={() => {
                    const estaSelec = lotesSelecionados.has(lote.chave)
                    
                    // Atualizar lotes selecionados
                    setLotesSelecionados(prev => {
                      const next = new Set(prev)
                      if (next.has(lote.chave)) next.delete(lote.chave)
                      else next.add(lote.chave)
                      return next
                    })
                    
                    // Selecionar/desmarcar todas as receptoras deste lote (exceto as que já têm DG)
                    setSelectedReceptoras(prev => {
                      const next = { ...prev }
                      lote.receptoras.forEach(r => {
                        if (r.dataDG) return // Pula receptoras que já têm DG
                        const id = r.animalId || `${r.letra}_${r.numero}`
                        next[id] = !estaSelec
                      })
                      return next
                    })
                    
                    setLoteFiltro(null)
                  }}
                  className={`group relative p-5 rounded-2xl text-left transition-all transform hover:scale-[1.02] cursor-pointer border-2 ${
                    selecionado 
                      ? 'ring-4 ring-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/40 dark:to-pink-900/40 shadow-xl border-purple-400' 
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-purple-400 hover:shadow-lg'
                  }`}
                >
                  {selecionado && (
                    <div className="absolute -top-2 -right-2 bg-purple-500 text-white rounded-full p-2 shadow-lg z-10">
                      <CheckIcon className="h-4 w-4" />
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <div 
                      className={`${selecionado ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'}`}
                      onClick={e => e.stopPropagation()}
                    >
                      <input
                        type="number"
                        min={1}
                        value={numeroLote === '' ? '' : numeroLote}
                        onChange={(e) => {
                          const v = e.target.value
                          if (v === '') {
                            setNumerosLote(prev => ({ ...prev, [lote.chave]: '' }))
                            return
                          }
                          const num = parseInt(v, 10)
                          if (!isNaN(num) && num >= 1) {
                            setNumerosLote(prev => ({ ...prev, [lote.chave]: num }))
                          }
                        }}
                        onClick={e => e.stopPropagation()}
                        className="w-14 sm:w-16 bg-transparent border-b-2 border-transparent hover:border-current focus:border-current focus:outline-none font-black text-3xl sm:text-4xl [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="Nº"
                        title="Número do lote (edite aqui)"
                      />
                    </div>
                    <div className="flex-1">
                      <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Receptoras
                      </span>
                      <span className={`block text-sm font-bold mt-0.5 ${selecionado ? 'text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'}`}>
                        {origemCurta}
                      </span>
                    </div>
                    <div className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg ${selecionado ? 'bg-purple-100 dark:bg-purple-900/50' : 'bg-blue-100 dark:bg-blue-900/50'}`}>
                      <span className={`text-2xl font-black ${selecionado ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'}`}>
                        {qtd}
                      </span>
                      <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase">
                        Cabeças
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold">📄 NF:</span>
                      <span>{lote.nf_numero || '-'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold">📅 Entrada:</span>
                      <span>{dataStr}</span>
                    </div>
                  </div>
                </div>
              )
            })}
                {lotesSelecionados.size > 0 && (
                  <button
                    onClick={() => { setLotesSelecionados(new Set()); setLoteFiltro(null) }}
                    className="p-5 rounded-2xl border-3 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-sm font-semibold transition-all flex flex-col items-center justify-center gap-2"
                  >
                    <span className="text-2xl">🔄</span>
                    Limpar seleção
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Formulário de Lançamento em Lote - Melhorado */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/30 dark:via-indigo-900/30 dark:to-purple-900/30 p-6 rounded-2xl border-2 border-blue-300 dark:border-blue-700 shadow-lg">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-3 rounded-xl shadow-md">
              <CheckIcon className="h-7 w-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Lançamento em Lote
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Preencha os dados e selecione as receptoras
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 px-4 py-2 rounded-xl border-2 border-green-500 dark:border-green-700">
            <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-xs font-bold text-green-700 dark:text-green-300 uppercase">
              Salva no PostgreSQL
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-5 mb-5">
          {/* Seleção de Lotes */}
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              🔢 Selecione os Lotes para DG <span className="text-red-500">*</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">(Apenas lotes sem DG)</span>
            </label>
            {lotes.length === 0 ? (
              <p className="text-sm text-green-600 dark:text-green-400 font-medium py-3">
                ✅ Não há lotes pendentes de DG. Somente novos lotes que chegarem aparecerão aqui.
              </p>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-3">
                {lotes.map((lote, idx) => {
                  const num = idx + 1
                  const numeroExibido = numerosLote[lote.chave] ?? num
                  return (
                    <button
                      key={lote.chave}
                      type="button"
                      onClick={() => toggleLoteSelecionado(num)}
                      disabled={lotesAplicados}
                      className={`px-4 py-3 rounded-lg font-bold text-lg transition-all ${
                        lotesSelecionadosParaDG.includes(num)
                          ? 'bg-blue-600 text-white shadow-lg scale-105'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      } ${lotesAplicados ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {numeroExibido}
                    </button>
                  )
                })}
              </div>
            )}
            {lotesSelecionadosParaDG.length > 0 && (
              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                ✓ {lotesSelecionadosParaDG.length} lote(s) selecionado(s): {lotesSelecionadosParaDG.join(', ')}
              </div>
            )}
          </div>

          {/* Botão Aplicar ou Dados do DG */}
          {!lotesAplicados ? (
            <div className="flex gap-3">
              <button
                onClick={aplicarFiltroLotes}
                disabled={lotesSelecionadosParaDG.length === 0}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
              >
                ✓ Aplicar Filtro de Lotes
              </button>
            </div>
          ) : (
            <>
              {/* Indicador de receptoras filtradas */}
              <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-xl border-2 border-green-500 dark:border-green-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-green-700 dark:text-green-300">
                      ✓ Filtro Aplicado
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Mostrando {receptorasExibidas.length} receptora(s) dos lotes: {lotesSelecionadosParaDG.join(', ')}
                    </p>
                    {receptorasExibidas.filter(r => r.dataDG).length > 0 && (
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 font-medium">
                        ⚠️ {receptorasExibidas.filter(r => r.dataDG).length} já possuem DG e serão ignoradas no lançamento (ex: {receptorasExibidas.filter(r => r.dataDG).slice(0, 3).map(r => r.rg || r.numero).join(', ')})
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const pendentes = receptorasExibidas.filter(r => !r.dataDG)
                        setSelectedReceptoras(prev => {
                          const next = { ...prev }
                          pendentes.forEach(r => {
                            const id = r.animalId || `${r.letra}_${r.numero}`
                            next[id] = true
                          })
                          return next
                        })
                      }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-bold text-sm"
                    >
                      ✓ Selecionar pendentes ({receptorasExibidas.filter(r => !r.dataDG).length})
                    </button>
                    <button
                      onClick={limparFiltroLotes}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all font-bold text-sm"
                    >
                      ↺ Alterar Lotes
                    </button>
                  </div>
                </div>
              </div>

              {/* Dados do DG */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    📅 Data do DG <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={dataDG}
                    onChange={(e) => setDataDG(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    👨‍⚕️ Veterinário <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={veterinario}
                    onChange={(e) => setVeterinario(e.target.value)}
                    placeholder="Nome do veterinário"
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
                  />
                </div>
                
                <div className="flex items-end">
                  <div className="w-full flex gap-2">
                    <button
                      onClick={() => setShowImportModal(true)}
                      className="px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all font-bold shadow"
                    >
                      Importar por Texto
                    </button>
                  <button
                    onClick={salvarLote}
                    disabled={saving || !dataDG || !veterinario || selecionadasCount === 0}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
                    title={
                      !dataDG ? 'Preencha a data do DG' :
                      !veterinario ? 'Preencha o veterinário' :
                      selecionadasCount === 0 ? 'Selecione pelo menos uma receptora' :
                      'Salvar DG das receptoras selecionadas'
                    }
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        💾 Salvar Lote {selecionadasCount > 0 && `(${selecionadasCount})`}
                      </>
                    )}
                  </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            💡 Como usar:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
            <li>Preencha a <strong>data do DG</strong> e o <strong>veterinário</strong></li>
            <li>Marque as receptoras que deseja lançar na tabela abaixo</li>
            <li>Todas começam como <strong className="text-green-600">Prenha</strong> por padrão</li>
            <li>Se alguma estiver vazia, altere o resultado e adicione observação</li>
            <li>Clique em <strong>"Salvar Lote"</strong> para aplicar a todas selecionadas</li>
          </ol>
          <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700 space-y-2">
            <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <svg className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span><strong>Dados salvos automaticamente no PostgreSQL.</strong> Receptoras prenhas são registradas no menu de Nascimentos com parto previsto para 9 meses após a TE.</span>
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <span>⚠️</span>
              <span><strong>Receptoras que já possuem DG</strong> (ex: 8251) são identificadas e <strong>automaticamente excluídas</strong> do lançamento em lote.</span>
            </p>
          </div>
        </div>
      </div>

      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-bold text-gray-800 dark:text-gray-100">Importar DG por Texto</div>
              <button onClick={() => setShowImportModal(false)} className="px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">Fechar</button>
            </div>
            <div className="space-y-3">
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={8}
                placeholder="Exemplos:&#10;8251; 2026-02-18; Prenha; Dr. João&#10;8249, 18/02/2026, Vazia, Maria&#10;RG 8230 Prenha 2026-02-19 Vet Carlos"
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={validarImportacaoTexto}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Validar
                </button>
                <button
                  onClick={aplicarImportacaoTexto}
                  disabled={!importPreview || importApplying}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {importApplying ? 'Aplicando...' : 'Aplicar na Tabela'}
                </button>
              </div>
              {importPreview && (
                <div className="mt-3 p-3 border rounded bg-gray-50 dark:bg-gray-900/40">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {importPreview.matched} de {importPreview.total} linhas reconhecidas
                  </div>
                  <div className="max-h-40 overflow-auto mt-2 text-xs">
                    {importPreview.items.map((i, idx) => (
                      <div key={idx} className={`px-2 py-1 ${i.match ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                        {i.linha}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Estatísticas - Melhoradas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 cursor-pointer">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-100 text-sm font-semibold uppercase tracking-wide">Total</span>
            <span className="text-3xl">📊</span>
          </div>
          <div className="text-4xl font-black text-white">{receptorasExibidas.length}</div>
          <div className="text-blue-100 text-xs mt-1">receptoras</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-5 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 cursor-pointer">
          <div className="flex items-center justify-between mb-2">
            <span className="text-purple-100 text-sm font-semibold uppercase tracking-wide">Selecionadas</span>
            <span className="text-3xl">✅</span>
          </div>
          <div className="text-4xl font-black text-white">
            {selecionadasCount}
          </div>
          <div className="text-purple-100 text-xs mt-1">para lançar</div>
        </div>
        
        <div 
          onClick={() => setFiltroStatus(filtroStatus === 'comDG' ? 'todos' : 'comDG')}
          className={`bg-gradient-to-br from-green-500 to-green-600 p-5 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 cursor-pointer ${filtroStatus === 'comDG' ? 'ring-4 ring-green-300' : ''}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-100 text-sm font-semibold uppercase tracking-wide">Com DG</span>
            <span className="text-3xl">🤰</span>
          </div>
          <div className="text-4xl font-black text-white">
            {receptorasExibidas.filter(r => r.dataDG).length}
          </div>
          <div className="text-green-100 text-xs mt-1">
            {filtroStatus === 'comDG' ? '🔍 Filtrando' : 'já diagnosticadas'}
          </div>
        </div>
        
        <div 
          onClick={() => setFiltroStatus(filtroStatus === 'pendentes' ? 'todos' : 'pendentes')}
          className={`bg-gradient-to-br from-yellow-500 to-orange-500 p-5 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 cursor-pointer ${filtroStatus === 'pendentes' ? 'ring-4 ring-yellow-300' : ''}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-yellow-100 text-sm font-semibold uppercase tracking-wide">Pendentes</span>
            <span className="text-3xl">⏳</span>
          </div>
          <div className="text-4xl font-black text-white">
            {receptorasExibidas.filter(r => !r.dataDG).length}
          </div>
          <div className="text-yellow-100 text-xs mt-1">
            {filtroStatus === 'pendentes' ? '🔍 Filtrando' : 'aguardando DG'}
          </div>
        </div>
      </div>

      {/* Dashboard de Análise Avançada */}
      {estatisticasAvancadas.comDG > 0 && (
        <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border-2 border-indigo-200 dark:border-indigo-700 shadow-lg">
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-3 rounded-xl shadow-md">
              <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                📈 Análise de Performance
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Estatísticas e indicadores de sucesso
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Taxa de Prenhez Geral */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-green-200 dark:border-green-700 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase">Taxa de Prenhez</span>
                <span className="text-2xl">🎯</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black text-green-600 dark:text-green-400">
                  {estatisticasAvancadas.taxaPrenhez}%
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  ({estatisticasAvancadas.prenhas}/{estatisticasAvancadas.comDG})
                </span>
              </div>
              <div className="mt-3 bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${estatisticasAvancadas.taxaPrenhez}%` }}
                ></div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-green-600 dark:text-green-400 font-semibold">
                  ✓ {estatisticasAvancadas.prenhas} Prenhas
                </span>
                <span className="text-red-600 dark:text-red-400 font-semibold">
                  ✗ {estatisticasAvancadas.vazias} Vazias
                </span>
              </div>
            </div>

            {/* Média de Dias até DG */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-700 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase">Média de Dias</span>
                <span className="text-2xl">📅</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black text-blue-600 dark:text-blue-400">
                  {estatisticasAvancadas.mediaDias}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  dias até DG
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs">
                {estatisticasAvancadas.mediaDias < 30 ? (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full font-semibold">
                    ⚠️ DG Precoce
                  </span>
                ) : estatisticasAvancadas.mediaDias > 45 ? (
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 rounded-full font-semibold">
                    ⚠️ DG Tardio
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full font-semibold">
                    ✓ Período Ideal
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Ideal: 30-45 dias após TE
              </p>
            </div>

            {/* Performance do Lote Selecionado */}
            {lotesSelecionados.size > 0 && estatisticasAvancadas.receptorasSelecionadasLote > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-purple-200 dark:border-purple-700 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase">Lote Selecionado</span>
                  <span className="text-2xl">📦</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-black text-purple-600 dark:text-purple-400">
                    {estatisticasAvancadas.taxaPrenhezLote}%
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    prenhez
                  </span>
                </div>
                <div className="mt-3 bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${estatisticasAvancadas.taxaPrenhezLote}%` }}
                  ></div>
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {estatisticasAvancadas.prenhasLote} de {estatisticasAvancadas.receptorasSelecionadasLote} receptoras
                </p>
              </div>
            )}

            {/* Placeholder quando não há lote selecionado */}
            {(lotesSelecionados.size === 0 || estatisticasAvancadas.receptorasSelecionadasLote === 0) && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center text-center">
                <span className="text-4xl mb-2">📦</span>
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Selecione um Lote
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Para ver estatísticas específicas
                </span>
              </div>
            )}
          </div>

          {/* Dicas e Recomendações */}
          <div className="mt-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-indigo-200 dark:border-indigo-700">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Recomendações:</h4>
                <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  {estatisticasAvancadas.taxaPrenhez < 50 && (
                    <li className="flex items-center gap-2">
                      <span className="text-yellow-500">⚠️</span>
                      <span>Taxa de prenhez abaixo de 50%. Considere revisar protocolo de TE.</span>
                    </li>
                  )}
                  {estatisticasAvancadas.taxaPrenhez >= 70 && (
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Excelente taxa de prenhez! Continue com o protocolo atual.</span>
                    </li>
                  )}
                  {estatisticasAvancadas.mediaDias < 30 && (
                    <li className="flex items-center gap-2">
                      <span className="text-orange-500">⚠️</span>
                      <span>DG muito precoce pode gerar falsos negativos. Ideal: 30-35 dias.</span>
                    </li>
                  )}
                  {estatisticasAvancadas.mediaDias > 45 && (
                    <li className="flex items-center gap-2">
                      <span className="text-orange-500">⚠️</span>
                      <span>DG tardio aumenta risco de perda. Recomendado: até 40 dias.</span>
                    </li>
                  )}
                  {receptoras.filter(r => !r.dataDG).length > 10 && (
                    <li className="flex items-center gap-2">
                      <span className="text-blue-500">ℹ️</span>
                      <span>{receptoras.filter(r => !r.dataDG).length} receptoras aguardando DG. Agende visita do veterinário.</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resumo por Fornecedor/Comprador */}
      {receptoras.length > 0 && (
        <div className="bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 dark:from-cyan-900/20 dark:via-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border-2 border-cyan-200 dark:border-cyan-700 shadow-lg">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-cyan-600 to-blue-600 p-3 rounded-xl shadow-md">
                <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  🏢 Resumo por Fornecedor
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {fornecedorFiltro ? `Filtrando: ${fornecedorFiltro}` : 'Clique em um fornecedor para filtrar'}
                </p>
              </div>
            </div>
            {fornecedorFiltro && (
              <button
                onClick={() => setFornecedorFiltro(null)}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-all shadow-lg flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Limpar Filtro
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(() => {
              const porFornecedor = receptoras.reduce((acc, r) => {
                const fornecedor = r.fornecedor || 'Sem Fornecedor'
                if (!acc[fornecedor]) {
                  acc[fornecedor] = { total: 0, prenhas: 0, vazias: 0, pendentes: 0, nfs: new Set() }
                }
                acc[fornecedor].total++
                if (r.nf_numero || r.origem) acc[fornecedor].nfs.add(r.nf_numero || r.origem)
                if (r.dataDG) {
                  const res = r.resultadoDG
                  if (res && (res.toLowerCase().includes('pren') || res.toLowerCase().includes('positivo'))) {
                    acc[fornecedor].prenhas++
                  } else {
                    acc[fornecedor].vazias++
                  }
                } else {
                  acc[fornecedor].pendentes++
                }
                return acc
              }, {})

              const fornecedoresOrdenados = Object.entries(porFornecedor).sort((a, b) => b[1].total - a[1].total)
              const cores = ['from-blue-500 to-blue-600', 'from-purple-500 to-purple-600', 'from-pink-500 to-pink-600', 'from-indigo-500 to-indigo-600', 'from-cyan-500 to-cyan-600', 'from-teal-500 to-teal-600']

              return fornecedoresOrdenados.map(([fornecedor, dados], index) => {
                const taxaPrenhez = (dados.prenhas + dados.vazias) > 0 ? ((dados.prenhas / (dados.prenhas + dados.vazias)) * 100).toFixed(1) : 0
                const cor = cores[index % cores.length]
                const isFiltered = fornecedorFiltro === fornecedor

                return (
                  <div 
                    key={fornecedor} 
                    onClick={() => setFornecedorFiltro(isFiltered ? null : fornecedor)}
                    className={`relative bg-white dark:bg-gray-800 rounded-xl p-4 border-2 shadow-sm hover:shadow-xl transition-all cursor-pointer transform hover:scale-105 ${
                      isFiltered 
                        ? 'border-cyan-500 ring-4 ring-cyan-300 dark:ring-cyan-700' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-cyan-400'
                    }`}
                    title="Clique para filtrar por este fornecedor"
                  >
                    {isFiltered && (
                      <div className="absolute -top-2 -right-2 bg-cyan-500 text-white rounded-full p-2 shadow-lg z-10 animate-pulse">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1 line-clamp-2" title={fornecedor}>{fornecedor}</h4>
                        <div className="flex flex-wrap gap-1">
                          {Array.from(dados.nfs).map(nf => (
                            <span key={nf} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">NF {nf}</span>
                          ))}
                        </div>
                      </div>
                      <div className={`bg-gradient-to-br ${cor} text-white rounded-lg px-3 py-2 text-center min-w-[60px] shadow-lg transform transition-transform ${isFiltered ? 'scale-110' : ''}`}>
                        <div className="text-2xl font-black">{dados.total}</div>
                        <div className="text-[10px] font-semibold uppercase">cabeças</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div className="flex h-full transition-all duration-500">
                            {dados.prenhas > 0 && <div className="bg-green-500 h-full transition-all" style={{ width: `${(dados.prenhas / dados.total) * 100}%` }} title={`${dados.prenhas} prenhas`}></div>}
                            {dados.vazias > 0 && <div className="bg-red-500 h-full transition-all" style={{ width: `${(dados.vazias / dados.total) * 100}%` }} title={`${dados.vazias} vazias`}></div>}
                            {dados.pendentes > 0 && <div className="bg-yellow-500 h-full transition-all" style={{ width: `${(dados.pendentes / dados.total) * 100}%` }} title={`${dados.pendentes} pendentes`}></div>}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg cursor-pointer" onClick={() => abrirListaFornecedor(fornecedor, 'prenhas')}>
                          <div className="font-bold text-green-600 dark:text-green-400 text-lg">{dados.prenhas}</div>
                          <div className="text-gray-500 dark:text-gray-400 text-[10px]">Prenhas</div>
                        </div>
                        <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg cursor-pointer" onClick={() => abrirListaFornecedor(fornecedor, 'vazias')}>
                          <div className="font-bold text-red-600 dark:text-red-400 text-lg">{dados.vazias}</div>
                          <div className="text-gray-500 dark:text-gray-400 text-[10px]">Vazias</div>
                        </div>
                        <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg cursor-pointer" onClick={() => abrirListaFornecedor(fornecedor, 'pendentes')}>
                          <div className="font-bold text-yellow-600 dark:text-yellow-400 text-lg">{dados.pendentes}</div>
                          <div className="text-gray-500 dark:text-gray-400 text-[10px]">Pendentes</div>
                        </div>
                      </div>
                      {(dados.prenhas + dados.vazias) > 0 && (
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400 font-semibold">Taxa de Prenhez:</span>
                            <div className="flex items-center gap-2">
                              <span className={`font-bold text-lg ${parseFloat(taxaPrenhez) >= 70 ? 'text-green-600 dark:text-green-400' : parseFloat(taxaPrenhez) >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>{taxaPrenhez}%</span>
                              {parseFloat(taxaPrenhez) >= 70 ? '🏆' : parseFloat(taxaPrenhez) >= 50 ? '👍' : '⚠️'}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Botões de Ação Rápida */}
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          // Selecionar receptoras deste fornecedor (exceto as que já têm DG)
                          const receptorasFornecedor = receptoras.filter(r => (r.fornecedor || 'Sem Fornecedor') === fornecedor)
                          setSelectedReceptoras(prev => {
                            const next = { ...prev }
                            receptorasFornecedor.forEach(r => {
                              if (r.dataDG) return
                              const id = r.animalId || `${r.letra}_${r.numero}`
                              next[id] = true
                            })
                            return next
                          })
                        }}
                        className="flex-1 px-2 py-1.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1"
                        title="Selecionar todas deste fornecedor"
                      >
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Selecionar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setFornecedorFiltro(fornecedor)
                          setModoVisualizacao('lista') // Mudar para modo lista
                          setTimeout(() => {
                            window.scrollTo({ top: document.getElementById('busca-receptoras')?.offsetTop - 100, behavior: 'smooth' })
                          }, 100)
                        }}
                        className="flex-1 px-2 py-1.5 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1"
                        title="Ver lista filtrada"
                      >
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Ver Lista
                      </button>
                    </div>
                  </div>
                )
              })
            })()}
          </div>
          <div className="mt-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-cyan-200 dark:border-cyan-700">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📊</span>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Resumo Geral</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{Object.keys(receptoras.reduce((acc, r) => ({ ...acc, [r.fornecedor || 'Sem Fornecedor']: true }), {})).length} fornecedores diferentes</p>
                </div>
              </div>
              <div className="text-center"><div className="text-2xl font-black text-blue-600 dark:text-blue-400">{receptoras.length}</div><div className="text-xs text-gray-500 dark:text-gray-400">Total Geral</div></div>
            </div>
          </div>
        </div>
      )}

      {fornecedorLista && (
        <div 
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 overflow-y-auto"
          onClick={fecharListaFornecedor}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border-2 border-purple-200 dark:border-purple-700 my-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <div className="min-w-0 flex-1">
                <div className="text-sm text-gray-500 dark:text-gray-400">Fornecedor</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white truncate">{fornecedorLista.fornecedor}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {fornecedorLista.status === 'prenhas' ? 'Prenhas' : fornecedorLista.status === 'vazias' ? 'Vazias' : 'Pendentes'} • {fornecedorLista.itens.length}
                </div>
              </div>
              <button 
                onClick={fecharListaFornecedor} 
                className="ml-3 shrink-0 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all flex items-center gap-2 shadow-lg"
                title="Fechar"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="hidden sm:inline">Fechar</span>
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 min-h-0">
              <div className="overflow-x-auto">
                <table className={`min-w-full divide-y divide-gray-200 dark:divide-gray-700 ${compactMode ? 'text-xs' : 'text-sm'}`}>
                  <thead className={`bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white ${compactMode ? 'text-xs' : 'text-sm'}`}>
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-900 dark:text-white">Letra</th>
                      <th className="px-3 py-2 text-left text-gray-900 dark:text-white">Número</th>
                      <th className="px-3 py-2 text-left text-gray-900 dark:text-white">Brinco</th>
                      <th className="px-3 py-2 text-left text-gray-900 dark:text-white">NF</th>
                      <th className="px-3 py-2 text-left text-gray-900 dark:text-white">Data DG</th>
                      <th className="px-3 py-2 text-left text-gray-900 dark:text-white">Resultado</th>
                      <th className="px-3 py-2 text-left text-gray-900 dark:text-white">Veterinário</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {fornecedorLista.itens.map((r, idx) => (
                      <tr key={`${r.letra}_${r.numero}_${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-3 py-2 text-gray-900 dark:text-white">{r.letra || r.serie}</td>
                        <td className="px-3 py-2 text-gray-900 dark:text-white">{r.numero || r.rg}</td>
                        <td className="px-3 py-2 text-gray-900 dark:text-white">{r.tatuagem || r.tatuagemCompleta || ''}</td>
                        <td className="px-3 py-2 text-gray-900 dark:text-white">{r.nf_numero || r.origem || '-'}</td>
                        <td className="px-3 py-2 text-gray-900 dark:text-white">{r.dataDG ? formatDateBR(r.dataDG) : '-'}</td>
                        <td className="px-3 py-2 text-gray-900 dark:text-white">{r.resultadoDG || '-'}</td>
                        <td className="px-3 py-2 text-gray-900 dark:text-white">{r.veterinario || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {(loteFiltro || lotesSelecionados.size > 0 || fornecedorFiltro) && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 p-4 rounded-lg">
          <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2 flex-wrap">
            <span className="text-lg">🔍</span>
            Mostrando <strong className="text-purple-600 dark:text-purple-400">{receptorasFiltradas.length} receptoras</strong>
            {lotesSelecionados.size > 0 && ` de ${lotesSelecionados.size} lote(s) selecionado(s)`}
            {fornecedorFiltro && ` do fornecedor "${fornecedorFiltro}"`}
            {loteFiltro && ' do lote selecionado'}.
            <button 
              onClick={() => { 
                setLoteFiltro(null)
                setLotesSelecionados(new Set())
                setFornecedorFiltro(null)
              }} 
              className="ml-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all shadow-md flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Limpar Filtros
            </button>
          </p>
        </div>
      )}

      {/* Barra de Busca e Ações em Massa */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <div className="relative">
              <input
                id="busca-receptoras"
                type="text"
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                placeholder="🔍 Buscar por RG, série, nome, letra, número, fornecedor ou NF..."
                className="w-full px-4 py-3 pl-10 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-gray-400"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {termoBusca && (
                <button
                  onClick={() => setTermoBusca('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold">{receptorasFiltradas.length}</span>
              <span>resultado{receptorasFiltradas.length !== 1 ? 's' : ''}</span>
            </div>
            <button
              onClick={() => exportReceptorasCSV(receptorasFiltradas)}
              className="flex items-center gap-2 px-3 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-all shadow-lg text-sm"
              title="Exportar lista filtrada em CSV"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span>Exportar CSV</span>
            </button>
            <button
              onClick={() => setCompactMode(v => !v)}
              className={`px-3 py-2 rounded-xl transition-all shadow-lg text-sm ${compactMode ? 'bg-purple-700 text-white hover:bg-purple-800' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
              title="Alternar modo compacto da tabela"
            >
              {compactMode ? 'Modo compacto: ON' : 'Modo compacto: OFF'}
            </button>

            {selecionadasCount > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowAcoesMassa(!showAcoesMassa)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all shadow-lg font-semibold"
                >
                  <span>⚡ Ações ({selecionadasCount})</span>
                  <svg className={`h-4 w-4 transition-transform ${showAcoesMassa ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showAcoesMassa && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-purple-200 dark:border-purple-700 z-20 overflow-hidden">
                    <button
                      onClick={marcarTodasComoPrenha}
                      className="w-full px-4 py-3 text-left hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors flex items-center gap-3 border-b border-gray-200 dark:border-gray-700"
                    >
                      <span className="text-2xl">🤰</span>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">Marcar como Prenha</div>
                        <div className="text-xs text-gray-500">Todas selecionadas</div>
                      </div>
                    </button>
                    <button
                      onClick={marcarTodasComoVazia}
                      className="w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3 border-b border-gray-200 dark:border-gray-700"
                    >
                      <span className="text-2xl">❌</span>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">Marcar como Vazia</div>
                        <div className="text-xs text-gray-500">Todas selecionadas</div>
                      </div>
                    </button>
                    <button
                      onClick={desmarcarTodas}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                    >
                      <span className="text-2xl">🔄</span>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">Desmarcar Todas</div>
                        <div className="text-xs text-gray-500">Limpar seleção</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
              <div className="text-xs text-green-700 dark:text-green-300">Prenhas</div>
              <div className="text-xl font-bold text-green-700 dark:text-green-300">{resumoDG.prenhas}</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
              <div className="text-xs text-red-700 dark:text-red-300">Vazias</div>
              <div className="text-xl font-bold text-red-700 dark:text-red-300">{resumoDG.vazias}</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-center">
              <div className="text-xs text-yellow-700 dark:text-yellow-300">Pendentes</div>
              <div className="text-xl font-bold text-yellow-700 dark:text-yellow-300">{resumoDG.pendentes}</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <div className="text-xs text-blue-700 dark:text-blue-300 mb-1">Taxa de Prenhez</div>
              <div className="w-full h-2 bg-blue-100 dark:bg-blue-800 rounded">
                <div className="h-2 bg-blue-600 rounded" style={{ width: `${resumoDG.taxa}%` }} />
              </div>
              <div className="text-right text-xs mt-1 text-blue-700 dark:text-blue-300">{resumoDG.taxa}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Receptoras - Compacta e Responsiva (apenas no modo 'Lista Completa') */}
      {modoVisualizacao === 'lista' && (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2 text-left w-10">
                  <input
                    type="checkbox"
                    checked={receptorasPaginadas.filter(r => !r.dataDG).length > 0 && receptorasPaginadas.filter(r => !r.dataDG).every(r => selectedReceptoras[r.animalId || `${r.letra}_${r.numero}`])}
                    onChange={() => {
                      const pendentes = receptorasPaginadas.filter(r => !r.dataDG)
                      const todos = pendentes.every(r => selectedReceptoras[r.animalId || `${r.letra}_${r.numero}`])
                      const novo = { ...selectedReceptoras }
                      pendentes.forEach(r => {
                        const id = r.animalId || `${r.letra}_${r.numero}`
                        novo[id] = !todos
                      })
                      setSelectedReceptoras(novo)
                    }}
                    className="h-4 w-4 text-purple-600 rounded border-2 border-gray-300 focus:ring-2 focus:ring-purple-500"
                    title="Selecionar apenas receptoras pendentes de DG"
                  />
                </th>
                <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase w-8">
                  
                </th>
                <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase w-12">
                  Nº
                </th>
                <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase w-12">
                  <div className="flex items-center gap-1">
                    <span>RG</span>
                  </div>
                </th>
                <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase w-10">
                  S
                </th>
                <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase w-24">
                  Fornecedor
                </th>
                <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase w-16">
                  Chegada
                </th>
                <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase w-16">
                  TE
                </th>
                <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase w-20">
                  Data DG
                </th>
                <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase w-24">
                  Veterinário
                </th>
                <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase w-12">
                  Dias
                </th>
                <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase w-12">
                  NF
                </th>
                <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase w-24">
                  Resultado
                </th>
                <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase w-32">
                  Observações
                </th>
                <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase w-20">
                  Status
                </th>
                <th className="px-2 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase w-24">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {receptorasPaginadas.length === 0 ? (
                <tr>
                  <td colSpan="16" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span className="text-6xl">🔍</span>
                      <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                        {termoBusca ? `Nenhuma receptora encontrada para "${termoBusca}"` : 
                         receptoras.length === 0 ? 'Nenhuma receptora encontrada' : 'Nenhuma receptora neste lote'}
                      </p>
                      {termoBusca && (
                        <button
                          onClick={() => setTermoBusca('')}
                          className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          Limpar busca
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                receptorasPaginadas.map((receptora, index) => {
                  const id = receptora.animalId || `${receptora.letra}_${receptora.numero}`
                  const isSelected = selectedReceptoras[id]
                  const resultado = resultados[id]
                  const observacao = observacoes[id] || ''
                  
                  const statusAtual = receptora.resultadoDG 
                    ? (receptora.resultadoDG.toString().toUpperCase().includes('P') || 
                       receptora.resultadoDG.toString().toUpperCase().includes('POSITIVO') ||
                       receptora.resultadoDG.toString().toUpperCase().includes('PRENHA')
                       ? 'Prenha' 
                       : 'Vazia')
                    : 'Pendente'

                  const statusColor = statusAtual === 'Prenha' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : statusAtual === 'Vazia'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'

                  return (
                    <tr 
                      key={index} 
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${isSelected ? 'bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500' : ''}`}
                    >
                      <td className="px-3 py-2">
                        {receptora.dataDG ? (
                          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400" title="Já possui DG - será ignorada no lançamento">
                            ✓ DG
                          </span>
                        ) : (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(id)}
                            className="h-4 w-4 text-purple-600 rounded border-2 border-gray-300 focus:ring-2 focus:ring-purple-500"
                          />
                        )}
                      </td>
                      <td 
                        className="px-2 py-2 text-sm font-bold text-gray-900 dark:text-white cursor-pointer hover:text-purple-600 dark:hover:text-purple-400"
                        onClick={() => {
                          if (receptora.animalId) {
                            router.push(`/animals/${receptora.animalId}`)
                          } else {
                            alert('⚠️ Animal não encontrado no cadastro')
                          }
                        }}
                        title="Clique para ver a ficha do animal"
                      >
                        {receptora.letra || '-'}
                      </td>
                      <td 
                        className="px-2 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:text-purple-600 dark:hover:text-purple-400"
                        onClick={() => {
                          if (receptora.animalId) {
                            router.push(`/animals/${receptora.animalId}`)
                          } else {
                            alert('⚠️ Animal não encontrado no cadastro')
                          }
                        }}
                        title="Clique para ver a ficha do animal"
                      >
                        {receptora.numero || '-'}
                      </td>
                      <td 
                        className="px-2 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 cursor-pointer hover:text-blue-800 dark:hover:text-blue-300 hover:underline group"
                        onClick={() => {
                          if (receptora.animalId) {
                            router.push(`/animals/${receptora.animalId}`)
                          } else {
                            alert('⚠️ Animal não encontrado no cadastro')
                          }
                        }}
                        title="Clique para ver a ficha do animal"
                      >
                        <div className="flex items-center gap-1">
                          <span>{receptora.rg || '-'}</span>
                          {receptora.animalId && (
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">👁️</span>
                          )}
                        </div>
                      </td>
                      <td 
                        className="px-2 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:text-purple-600 dark:hover:text-purple-400"
                        onClick={() => {
                          if (receptora.animalId) {
                            router.push(`/animals/${receptora.animalId}`)
                          } else {
                            alert('⚠️ Animal não encontrado no cadastro')
                          }
                        }}
                        title="Clique para ver a ficha do animal"
                      >
                        {receptora.serie || '-'}
                      </td>
                      <td className="px-2 py-2 text-xs text-gray-600 dark:text-gray-400 max-w-[130px] truncate" title={receptora.fornecedor || '-'}>
                        {receptora.fornecedor || '-'}
                      </td>
                      <td className="px-2 py-2 text-xs text-gray-600 dark:text-gray-400">
                        {receptora.dataChegada 
                          ? new Date(receptora.dataChegada).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                          : '-'}
                      </td>
                      <td className="px-2 py-2 text-xs text-gray-600 dark:text-gray-400">
                        {receptora.dataTE 
                          ? new Date(receptora.dataTE).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                          : '-'}
                      </td>
                      <td className="px-2 py-2">
                        {!receptora.dataDG ? (
                          <input
                            type="date"
                            value={datasIndividuais[id] || ''}
                            onChange={(e) => setDataIndividual(id, e.target.value)}
                            className="w-full px-2 py-1 border-2 border-purple-300 rounded-lg text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:border-purple-500 focus:ring-2 focus:ring-purple-500"
                            title="Data do DG para esta receptora"
                          />
                        ) : (
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {new Date(receptora.dataDG).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        {!receptora.dataDG ? (
                          <input
                            type="text"
                            value={veterinariosIndividuais[id] || ''}
                            onChange={(e) => setVeterinarioIndividual(id, e.target.value)}
                            placeholder="Veterinário..."
                            className="w-full px-2 py-1 border-2 border-purple-300 rounded-lg text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:border-purple-500 focus:ring-2 focus:ring-purple-500"
                            title="Veterinário responsável pelo DG"
                          />
                        ) : (
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {receptora.veterinario || '-'}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-xs">
                        {(resultado === 'Prenha' || statusAtual === 'Prenha' || statusAtual === 'Pendente') && (receptora.dataTE || receptora.dataChegada) ? (
                          <span className="font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full whitespace-nowrap">
                            {Math.floor((new Date() - new Date(receptora.dataTE || receptora.dataChegada)) / (24 * 60 * 60 * 1000))}d
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-xs text-gray-600 dark:text-gray-400">
                        {receptora.origem || receptora.nf_numero || '-'}
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={resultado}
                          onChange={(e) => setResultado(id, e.target.value)}
                          disabled={!isSelected}
                          className={`w-full px-2 py-1 border-2 rounded-lg text-xs font-semibold transition-all ${
                            isSelected 
                              ? 'border-purple-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:border-purple-500 focus:ring-2 focus:ring-purple-500' 
                              : 'border-gray-200 bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <option value="Prenha">🤰 Prenha</option>
                          <option value="Vazia">❌ Vazia</option>
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={observacao}
                          onChange={(e) => setObservacao(id, e.target.value)}
                          disabled={!isSelected}
                          placeholder={isSelected ? "Observações..." : ""}
                          className={`w-full px-2 py-1 border-2 rounded-lg text-xs transition-all ${
                            isSelected 
                              ? 'border-purple-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:border-purple-500 focus:ring-2 focus:ring-purple-500' 
                              : 'border-gray-200 bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                          }`}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <span className={`px-2 py-1 text-xs font-bold rounded-full whitespace-nowrap ${statusColor}`}>
                          {statusAtual}
                        </span>
                        {receptora.dataDG && (
                          <div className="mt-1 flex flex-col gap-0.5">
                            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                              ✓ Já com DG
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                              {new Date(receptora.dataDG).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-2 text-center">
                        {!receptora.dataDG && (
                          <button
                            onClick={() => salvarIndividual(receptora)}
                            disabled={!datasIndividuais[id] || !veterinariosIndividuais[id] || !resultados[id] || saving}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              !datasIndividuais[id] || !veterinariosIndividuais[id] || !resultados[id] || saving
                                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-lg transform hover:scale-105'
                            }`}
                            title={
                              !datasIndividuais[id] ? 'Preencha a data do DG' :
                              !veterinariosIndividuais[id] ? 'Preencha o veterinário' :
                              !resultados[id] ? 'Selecione o resultado (Prenha/Vazia)' :
                              saving ? 'Salvando...' :
                              'Salvar DG desta receptora'
                            }
                          >
                            💾 Salvar
                          </button>
                        )}
                        {receptora.dataDG && (
                          <span className="text-xs text-green-600 dark:text-green-400 font-bold">
                            ✓ Salvo
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Mostrando <span className="font-semibold text-gray-900 dark:text-white">{indiceInicio + 1}</span> a{' '}
                <span className="font-semibold text-gray-900 dark:text-white">{Math.min(indiceFim, receptorasFiltradas.length)}</span> de{' '}
                <span className="font-semibold text-gray-900 dark:text-white">{receptorasFiltradas.length}</span> receptoras
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPaginaAtual(1)}
                  disabled={paginaAtual === 1}
                  className="px-3 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title="Primeira página"
                >
                  «
                </button>
                
                <button
                  onClick={() => setPaginaAtual(prev => Math.max(1, prev - 1))}
                  disabled={paginaAtual === 1}
                  className="px-3 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title="Página anterior"
                >
                  ‹
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                    .filter(num => {
                      // Mostrar primeira, última, atual e adjacentes
                      return num === 1 || 
                             num === totalPaginas || 
                             (num >= paginaAtual - 1 && num <= paginaAtual + 1)
                    })
                    .map((num, idx, arr) => {
                      // Adicionar "..." entre números não consecutivos
                      const showEllipsis = idx > 0 && num - arr[idx - 1] > 1
                      return (
                        <div key={num} className="flex items-center gap-1">
                          {showEllipsis && (
                            <span className="px-2 text-gray-500 dark:text-gray-400">...</span>
                          )}
                          <button
                            onClick={() => setPaginaAtual(num)}
                            className={`min-w-[40px] px-3 py-2 rounded-lg font-semibold transition-all ${
                              paginaAtual === num
                                ? 'bg-purple-600 text-white shadow-lg'
                                : 'border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                            }`}
                          >
                            {num}
                          </button>
                        </div>
                      )
                    })}
                </div>

                <button
                  onClick={() => setPaginaAtual(prev => Math.min(totalPaginas, prev + 1))}
                  disabled={paginaAtual === totalPaginas}
                  className="px-3 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title="Próxima página"
                >
                  ›
                </button>
                
                <button
                  onClick={() => setPaginaAtual(totalPaginas)}
                  disabled={paginaAtual === totalPaginas}
                  className="px-3 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title="Última página"
                >
                  »
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Modal Detalhes dos Erros do Lançamento */}
      {errosDetalhes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col border-2 border-red-200 dark:border-red-800">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-xl">
                  <span className="text-2xl">⚠️</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Erros do Lançamento ({errosDetalhes.total})
                </h3>
              </div>
              <button 
                onClick={() => setErrosDetalhes(null)} 
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Receptoras que não puderam ser atualizadas e o motivo:
              </p>
              <div className="space-y-2">
                {errosDetalhes.lista.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="flex gap-3 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm"
                  >
                    <span className="font-bold text-red-700 dark:text-red-400 min-w-[80px]">{item.receptora}:</span>
                    <span className="text-gray-700 dark:text-gray-300 flex-1">{item.erro}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button 
                onClick={() => setErrosDetalhes(null)} 
                className="w-full px-5 py-2.5 rounded-xl bg-gray-600 hover:bg-gray-700 text-white font-semibold transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Escolher Colunas para Exportar - Melhorado */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border-2 border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-xl">
                  <ArrowDownTrayIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Exportar para Excel</h3>
              </div>
              <button 
                onClick={() => setShowExportModal(false)} 
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              📋 Selecione as colunas que deseja incluir no relatório:
            </p>
            
            <div className="space-y-2 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
              {COLUNAS_EXPORTAR.map(col => (
                <label 
                  key={col.id} 
                  className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 p-3 rounded-xl transition-all border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                >
                  <input
                    type="checkbox"
                    checked={colunasSelecionadas[col.id] ?? false}
                    onChange={() => toggleColunaExport(col.id)}
                    className="h-5 w-5 text-green-600 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{col.label}</span>
                </label>
              ))}
            </div>
            
            <div className="flex gap-3 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button 
                onClick={() => selecionarTodasColunas(true)} 
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-semibold hover:underline"
              >
                ✅ Todas
              </button>
              <button 
                onClick={() => selecionarTodasColunas(false)} 
                className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-semibold hover:underline"
              >
                ❌ Nenhuma
              </button>
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button 
                onClick={() => setShowExportModal(false)} 
                className="px-5 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={exportarExcel} 
                disabled={!Object.values(colunasSelecionadas).some(v => v)} 
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                📥 Exportar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
