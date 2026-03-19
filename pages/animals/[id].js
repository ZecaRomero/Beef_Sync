
import { useEffect, useState } from 'react'

import {
    ArrowLeftIcon,
    ArrowPathIcon,
    ArrowTopRightOnSquareIcon,
    BeakerIcon,
    CalendarIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    CurrencyDollarIcon,
    DocumentArrowDownIcon,
    MapPinIcon,
    PencilIcon,
    PlusCircleIcon,
    SparklesIcon,
    TrashIcon,
    UserIcon,
    XMarkIcon
} from '@heroicons/react/24/outline'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import BatchOccurrenceForm from '../../components/animals/BatchOccurrenceForm'
import QuickOccurrenceForm from '../../components/animals/QuickOccurrenceForm'
import DNAHistorySection from '../../components/DNAHistorySection'
import NotaFiscalModal from '../../components/NotaFiscalModal'
import Button from '../../components/ui/Button'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Modal from '../../components/ui/Modal'
import Toast from '../../components/ui/SimpleToast'
import ToastUI from '../../components/ui/Toast'
import { integrarNFSaida } from '../../services/notasFiscaisIntegration'
import { animalDataCache } from '../../utils/animalDataCache'
import { generateAnimalFichaPDF } from '../../utils/animalFichaPDF'
import { extrairSerieRG } from '../../utils/animalUtils'
import { localizacaoValidaParaExibir } from '../../utils/formatters'
import logger from '../../utils/logger'

// Modal para editar Data do DG, Resultado e Veterinário
function EditDGModal({ animal, onClose, onSave }) {
  const [dataDG, setDataDG] = useState(animal?.dataDG || animal?.data_dg ? (animal.dataDG || animal.data_dg).toString().slice(0, 10) : '')
  const [resultadoDG, setResultadoDG] = useState(animal?.resultadoDG || animal?.resultado_dg || '')
  const [veterinarioDG, setVeterinarioDG] = useState(animal?.veterinario_dg || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/animals/${animal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data_dg: dataDG || null,
          resultado_dg: resultadoDG || null,
          veterinario_dg: veterinarioDG || null
        })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Erro ao atualizar')
      }
      const result = await res.json()
      const data = result.data || result
      onSave({
        data_dg: data.data_dg || dataDG,
        dataDG: data.data_dg || dataDG,
        resultado_dg: data.resultado_dg || resultadoDG,
        resultadoDG: data.resultado_dg || resultadoDG,
        veterinario_dg: data.veterinario_dg || veterinarioDG
      })
    } catch (err) {
      setError(err.message || 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Editar DG (Diagnóstico de Gestação)" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data do DG</label>
          <input
            type="date"
            value={dataDG}
            onChange={(e) => setDataDG(e.target.value)}
            className="input-field w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Resultado</label>
          <select
            value={resultadoDG}
            onChange={(e) => setResultadoDG(e.target.value)}
            className="input-field w-full"
          >
            <option value="">Selecione...</option>
            <option value="Prenha">Prenha</option>
            <option value="Vazia">Vazia</option>
            <option value="Negativo">Negativo</option>
            <option value="Positivo">Positivo</option>
            <option value="Não Realizado">Não Realizado</option>
            <option value="Inconclusivo">Inconclusivo</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Veterinário</label>
          <input
            type="text"
            value={veterinarioDG}
            onChange={(e) => setVeterinarioDG(e.target.value)}
            placeholder="Nome do veterinário"
            className="input-field w-full"
          />
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button type="submit" variant="primary" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
        </div>
      </form>
    </Modal>
  )
}

export default function AnimalDetail() {
  const router = useRouter()
  const { id } = router.query
  const [animal, setAnimal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showSplash, setShowSplash] = useState(false)
  const [splashProgress, setSplashProgress] = useState(0)
  const [isMobileDevice, setIsMobileDevice] = useState(false)
  const [custos, setCustos] = useState([])
  const [loadingCustos, setLoadingCustos] = useState(false)
  const [avoMaterno, setAvoMaterno] = useState(null)
  const [maeSerieRg, setMaeSerieRg] = useState(null)
  const [localizacaoAtual, setLocalizacaoAtual] = useState(null)
  const [showQuickOccurrence, setShowQuickOccurrence] = useState(false)
  const [showBatchOccurrence, setShowBatchOccurrence] = useState(false)
  const [examesAndrologicos, setExamesAndrologicos] = useState([])
  const [loadingExames, setLoadingExames] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [showNotaFiscalModal, setShowNotaFiscalModal] = useState(false)
  const [allAnimals, setAllAnimals] = useState([])
  const [reproducaoStats, setReproducaoStats] = useState(null)
  const [loadingReproducao, setLoadingReproducao] = useState(false)
  const [transferenciasEmbrioes, setTransferenciasEmbrioes] = useState([])
  const [loadingTransferencias, setLoadingTransferencias] = useState(false)
  const [infoMorte, setInfoMorte] = useState(null)
  const [showMorteModal, setShowMorteModal] = useState(false)
  const [loadingMorte, setLoadingMorte] = useState(false)
  const [infoVenda, setInfoVenda] = useState(null)
  const [ultimaIA, setUltimaIA] = useState(null)
  const [gestacaoAtual, setGestacaoAtual] = useState(null)
  const [showReproducaoModal, setShowReproducaoModal] = useState(false)
  const [editCardModal, setEditCardModal] = useState({ open: false, field: null, value: null })
  const [dataUltimaPesagem, setDataUltimaPesagem] = useState(null)
  const [ultimaPesagem, setUltimaPesagem] = useState(null)
  const [ultimoEvento, setUltimoEvento] = useState(null)
  const [ocorrenciasRecentes, setOcorrenciasRecentes] = useState([])
  const [showUltimoEventoModal, setShowUltimoEventoModal] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [coletasFIVMae, setColetasFIVMae] = useState(null) // Coletas FIV da mãe

  // Detectar se é mobile e mostrar splash apenas em mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setIsMobileDevice(mobile)
      setIsMobile(mobile)
      if (!isMobileDevice && mobile) setShowSplash(true)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Splash screen com animação de progresso (apenas mobile)
  useEffect(() => {
    if (!showSplash) return
    
    const duration = 10000 // 10 segundos
    const interval = 50 // atualizar a cada 50ms
    const steps = duration / interval
    let currentStep = 0

    const timer = setInterval(() => {
      currentStep++
      setSplashProgress((currentStep / steps) * 100)
      
      if (currentStep >= steps) {
        clearInterval(timer)
        setTimeout(() => setShowSplash(false), 300)
      }
    }, interval)

    return () => clearInterval(timer)
  }, [showSplash])

  useEffect(() => {
    const carregarUltimaIA = async () => {
      if (!animal || !animal.id) return
      try {
        const resp = await fetch(`/api/inseminacoes?animal_id=${animal.id}`)
        if (!resp.ok) return
        const data = await resp.json()
        const lista = Array.isArray(data.data) ? data.data : []
        if (lista.length > 0) {
          const ordenada = [...lista].sort((a, b) => {
            const da = new Date(a.data_ia || a.data_inseminacao || a.data || 0)
            const db = new Date(b.data_ia || b.data_inseminacao || b.data || 0)
            return db - da
          })
          const ehVazia = (ia) => {
            const r = String(ia.resultado_dg || ia.status_gestacao || '').toLowerCase()
            return r.includes('vazia') || r.includes('vazio') || r.includes('negativo')
          }
          const ehPrenha = (ia) => {
            if (ehVazia(ia)) return false
            const r = String(ia.resultado_dg || ia.status_gestacao || '').toLowerCase()
            return r.includes('prenha') || r.includes('pren') || r.includes('positivo') || r.trim() === 'p'
          }
          const validas = ordenada.filter(ia => ia.valida !== false)
          const listaParaEscolher = validas.length > 0 ? validas : ordenada
          const iaPrenha = listaParaEscolher.find(ehPrenha)
          const naoVazias = listaParaEscolher.filter(ia => !ehVazia(ia))
          const iaParaExibir = iaPrenha || naoVazias[0] || listaParaEscolher[0] || ordenada[0]
          setUltimaIA(iaParaExibir)
        } else {
          setUltimaIA(null)
        }
      } catch (e) {
        setUltimaIA(null)
      }
    }
    carregarUltimaIA()
  }, [animal?.id])

  // Buscar posição nos rankings (iABCZ e IQG) para exibir troféus
  useEffect(() => {
    if (!animal?.id) return
    const matchAnimal = (r) => r.id === animal.id || (String(r.rg) === String(animal.rg) && String(r.serie || '').toUpperCase() === String(animal.serie || '').toUpperCase())
    Promise.all([
      fetch('/api/animals/ranking-iabcz?limit=50').then(r => r.json()),
      fetch('/api/animals/ranking-genetica-2?limit=50').then(r => r.json())
    ]).then(([d1, d2]) => {
      let updates = {}
      if (d1.success && d1.data?.length) {
        const idx = d1.data.findIndex(matchAnimal)
        if (idx >= 0) updates.ranking_iabcz = idx + 1
      }
      if (d2.success && d2.data?.length) {
        const idx = d2.data.findIndex(matchAnimal)
        if (idx >= 0) updates.ranking_iqg = idx + 1
      }
      if (Object.keys(updates).length > 0) {
        setAnimal(prev => prev ? { ...prev, ...updates } : prev)
      }
    }).catch(() => {})
  }, [animal?.id, animal?.rg, animal?.serie])

  // Calcular último serviço (IA, DG, Coleta FIV, TE, Exame Andrológico, ocorrências) - sempre o mais recente
  useEffect(() => {
    if (!animal) {
      setUltimoEvento(null)
      return
    }
    const hoje = new Date()
    hoje.setHours(23, 59, 59, 999)
    const isMacho = animal.sexo && (
      animal.sexo.toLowerCase().startsWith('m') ||
      animal.sexo === 'M' ||
      animal.sexo.toLowerCase().includes('macho')
    )
    const eventos = []
    // IA (API retorna data_ia; aceitar data_inseminacao e data para compatibilidade)
    if (ultimaIA?.data_ia || ultimaIA?.data_inseminacao || ultimaIA?.data) {
      const d = ultimaIA.data_ia || ultimaIA.data_inseminacao || ultimaIA.data
      eventos.push({
        data: d,
        tipo: 'IA',
        label: 'Inseminação Artificial',
        id: ultimaIA.id,
        origem: 'inseminacao',
        raw: ultimaIA
      })
    }
    // DG (Diagnóstico de Gestação)
    if (animal.data_dg || animal.dataDG) {
      const d = animal.data_dg || animal.dataDG
      const res = animal.resultado_dg || animal.resultadoDG || ''
      eventos.push({
        data: d,
        tipo: 'DG',
        label: `DG (${res || 'Realizado'})`,
        id: 'dg-animal',
        origem: 'dg',
        raw: { data_dg: d, resultado_dg: res }
      })
    }
    // Coleta de Oócitos (FIV)
    const fivs = animal.fivs || []
    fivs.forEach(fiv => {
      const d = fiv.data_fiv || fiv.data
      if (d) {
        eventos.push({
          data: d,
          tipo: 'Coleta FIV',
          label: 'Coleta de Oócitos (FIV)',
          id: fiv.id,
          origem: 'coleta_fiv',
          raw: fiv
        })
      }
    })
    // Transferência de Embriões
    transferenciasEmbrioes.forEach(te => {
      const d = te.data_te || te.data
      if (d) {
        const papel = te.doadora_id === animal.id ? 'Doadora' : te.receptora_id === animal.id ? 'Receptora' : te.touro_id === animal.id ? 'Touro' : 'TE'
        eventos.push({
          data: d,
          tipo: 'TE',
          label: `Transferência de Embriões (${papel})`,
          id: te.id,
          origem: 'transferencia_embrioes',
          raw: te
        })
      }
    })
    // Exame Andrológico - apenas para machos (fêmeas não fazem exame andrológico)
    if (isMacho) {
      examesAndrologicos.forEach(ex => {
        const d = ex.data_exame || ex.data
        if (d) {
          eventos.push({
            data: d,
            tipo: 'Exame Andrológico',
            label: 'Exame Andrológico',
            id: ex.id,
            origem: 'exame_andrologico',
            raw: ex
          })
        }
      })
    }
    // Ocorrências (historia_ocorrencias / ocorrencias_animais)
    ocorrenciasRecentes.forEach(oc => {
      const dataOc = oc.data || oc.data_registro || oc.data_ultimo_peso
      if (!dataOc) return
      const tipoOc = (oc.tipo || '').toString().toLowerCase()
      if (!isMacho && (tipoOc.includes('andrológico') || tipoOc.includes('andrologico'))) return
      let labelTipo = oc.tipo || (oc.peso != null && oc.peso !== '' ? 'Pesagem' : 'Evento')
      if (labelTipo === 'Pesagem') labelTipo = isMacho ? 'Pesado' : 'Pesada'
      else if (labelTipo === 'CE') labelTipo = 'CE'
      else if (labelTipo === 'DG') labelTipo = 'DG'
      else if (labelTipo === 'Local') labelTipo = 'Local'
      else if (labelTipo.toLowerCase().includes('coleta') || labelTipo.toLowerCase().includes('oocito') || labelTipo.toLowerCase().includes('fiv')) labelTipo = 'Coleta de Oócitos'
      else if (labelTipo.toLowerCase().includes('vacina')) labelTipo = 'Vacinação'
      else if (labelTipo.toLowerCase().includes('medic')) labelTipo = 'Medicação'
      eventos.push({
        data: dataOc,
        tipo: oc.tipo || labelTipo,
        label: labelTipo,
        id: oc.id,
        origem: 'ocorrencia',
        raw: oc
      })
    })
    const eventosPassados = eventos.filter(ev => {
      const dataEv = new Date(ev.data || 0)
      return dataEv <= hoje
    })
    if (eventosPassados.length === 0) {
      setUltimoEvento(null)
      return
    }
    const ordenados = eventosPassados.sort((a, b) => new Date(b.data) - new Date(a.data))
    const ultimo = ordenados[0]
    const dataFormatada = ultimo.data ? new Date(ultimo.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''
    
    // Ajustar o texto baseado no sexo do animal
    let labelFinal = ultimo.label
    if (labelFinal === 'Pesado' || labelFinal === 'Pesada') {
      labelFinal = isMacho ? 'Pesado' : 'Pesada'
    }
    
    setUltimoEvento({
      ...ultimo,
      labelExibicao: `${labelFinal} em ${dataFormatada}`,
      todosEventos: ordenados.slice(0, 20)
    })
  }, [animal, ultimaIA, ocorrenciasRecentes, transferenciasEmbrioes, examesAndrologicos])

  useEffect(() => {
    const carregarGestacao = async () => {
      if (!animal || !animal.serie || !animal.rg) return
      try {
        const resp = await fetch('/api/gestacoes')
        if (!resp.ok) return
        const data = await resp.json()
        const lista = Array.isArray(data.data) ? data.data : []
        const doAnimal = lista.filter(g => 
          (g.receptora_serie === animal.serie && g.receptora_rg?.toString() === animal.rg?.toString())
        )
        if (doAnimal.length > 0) {
          const ordenada = [...doAnimal].sort((a, b) => new Date(b.data_cobertura || b.created_at) - new Date(a.data_cobertura || a.created_at))
          setGestacaoAtual(ordenada[0])
        } else {
          setGestacaoAtual(null)
        }
      } catch (e) {
        setGestacaoAtual(null)
      }
    }
    carregarGestacao()
  }, [animal?.serie, animal?.rg])
  const [loadingVenda, setLoadingVenda] = useState(false)
  const [showTooltipVenda, setShowTooltipVenda] = useState(false)
  const [allAnimalsIds, setAllAnimalsIds] = useState([])
  const [currentAnimalIndex, setCurrentAnimalIndex] = useState(-1)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  const [editingField, setEditingField] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [savingField, setSavingField] = useState(null)
  const [cardsExpanded, setCardsExpanded] = useState({ info: true, genealogia: true, financeiro: true, receptora: true })
  const [paiId, setPaiId] = useState(null)
  const [maeId, setMaeId] = useState(null)
  const [fabOpen, setFabOpen] = useState(false)

  const toggleCard = (key) => {
    setCardsExpanded(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000)
  }

  const salvarCampoRapido = async (campo, valor) => {
    if (!id) return
    setSavingField(campo)
    try {
      const payload = {}
      if (campo === 'cor') payload.cor = valor
      else if (campo === 'peso') payload.peso = valor ? parseFloat(valor) : null
      else if (campo === 'observacoes') payload.observacoes = valor
      else if (campo === 'situacao_abcz') payload.situacao_abcz = valor
      const response = await fetch(`/api/animals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (response.ok) {
        const result = await response.json()
        setAnimal(prev => ({ ...prev, ...(result.data || result) }))
        setEditingField(null)
        setEditValue('')
        if (campo === 'peso') carregarDataUltimaPesagem()
        
        // Invalidar cache quando animal for atualizado
        animalDataCache.invalidate(id)
        
        showToast('Dados salvos com sucesso no banco de dados!', 'success')
      } else {
        const err = await response.json()
        showToast(err?.message || 'Erro ao salvar', 'error')
      }
    } catch (err) {
      showToast('Erro de conexão com a API', 'error')
    } finally {
      setSavingField(null)
    }
  }

  // Carregar lista de IDs de todos os animais
  useEffect(() => {
    const loadAllAnimalsIds = async () => {
      try {
        const response = await fetch('/api/animals?fields=id')
        if (response.ok) {
          const result = await response.json()
          const ids = (result.data || result || []).map(a => a.id).filter(Boolean)
          setAllAnimalsIds(ids)
          
          // Encontrar índice do animal atual
          if (id) {
            const index = ids.findIndex(animalId => String(animalId) === String(id))
            setCurrentAnimalIndex(index)
          }
        }
      } catch (error) {
        console.error('Erro ao carregar IDs dos animais:', error)
      }
    }
    
    if (id) {
      loadAllAnimalsIds()
    }
  }, [id])

  useEffect(() => {
    if (id) {
      loadAnimal()
    }
  }, [id])

  useEffect(() => {
    setMaeSerieRg(null)
  }, [animal?.id])

  // Persistência do estado de expansão dos cards
  useEffect(() => {
    try {
      const saved = localStorage.getItem('animalDetailCardsExpanded')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && typeof parsed === 'object') {
          setCardsExpanded(prev => ({ ...prev, ...parsed }))
        }
      }
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('animalDetailCardsExpanded', JSON.stringify(cardsExpanded))
    } catch {}
  }, [cardsExpanded])

  // Atalhos de teclado
  useEffect(() => {
    const onKey = (e) => {
      if (!animal) return
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) return
      const key = e.key?.toLowerCase()
      if (key === 'e') {
        e.preventDefault()
        handleEdit()
      } else if (key === 'p') {
        e.preventDefault()
        handleGeneratePDF()
      } else if (key === 'o') {
        e.preventDefault()
        setShowQuickOccurrence(true)
      } else if (key === 'x' || e.key === 'Delete') {
        e.preventDefault()
        handleDelete()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [animal, custos, examesAndrologicos])

  // Carregamento escalonado dos dados do animal (evita requisições simultâneas)
  useEffect(() => {
    if (!id || !animal) return

    loadCustos()
    loadExamesAndrologicos()
    carregarLocalizacao()
    carregarDataUltimaPesagem()

    const t2 = setTimeout(() => {
      loadReproducaoStats()
      loadTransferenciasEmbrioes()
      buscarAvoMaterno()
      buscarSerieRgMae()
    }, 150)

    const t3 = setTimeout(() => {
      carregarColetasFIV()
      carregarColetasFIVMae()
      if (animal.situacao === 'Morto') carregarInfoMorte()
    }, 300)

    return () => {
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [id, animal])

  // Carregar coletas FIV da doadora
  const carregarColetasFIV = async () => {
    if (!animal || (!animal.serie && !animal.rg && !animal.nome)) return
    
    try {
      let url = '/api/animals/doadora-coletas?'
      
      if (animal.serie && animal.rg) {
        url += `serie=${encodeURIComponent(animal.serie)}&rg=${encodeURIComponent(animal.rg)}`
      } else if (animal.nome) {
        url += `identificador=${encodeURIComponent(animal.nome)}`
      } else {
        return
      }
      
      const response = await fetch(url)
      
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setAnimal(prev => ({
            ...prev,
            fivs: result.data.coletas || [],
            resumoFIV: result.data.resumo
          }))
        }
      } else {
        logger.warn('Erro ao buscar coletas FIV:', response.status)
      }
    } catch (error) {
      logger.error('Erro ao carregar coletas FIV:', error)
    }
  }

  // Carregar coletas FIV da mãe (para mostrar histórico da doadora mesmo que não esteja ativa)
  const carregarColetasFIVMae = async () => {
    if (!animal || !animal.mae) return
    
    try {
      let url = '/api/animals/doadora-coletas?'
      
      if (animal.serie_mae && animal.rg_mae) {
        url += `serie=${encodeURIComponent(animal.serie_mae)}&rg=${encodeURIComponent(animal.rg_mae)}`
      } else {
        url += `identificador=${encodeURIComponent(animal.mae)}`
      }
      
      const response = await fetch(url)
      
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data && result.data.coletas && result.data.coletas.length > 0) {
          setColetasFIVMae({
            nome: result.data.doadora_nome || animal.mae,
            coletas: result.data.coletas,
            resumo: result.data.resumo
          })
        }
      } else {
        logger.warn('Erro ao buscar coletas FIV da mãe:', response.status)
      }
    } catch (error) {
      logger.error('Erro ao carregar coletas FIV da mãe:', error)
    }
  }

  // Carregar informações de venda quando custos estiverem disponíveis
  useEffect(() => {
    if (id && animal && animal.situacao === 'Vendido' && custos.length >= 0) {
      carregarInfoVenda()
    }
  }, [id, animal, custos])

  const carregarInfoMorte = async () => {
    if (!id) return
    
    try {
      setLoadingMorte(true)
      // Buscar mortes do animal
      const response = await fetch(`/api/deaths?animalId=${id}`)
      
      if (response.ok) {
        const result = await response.json()
        const mortes = result.data || []
        
        // Pegar a morte mais recente
        if (mortes.length > 0) {
          const morteMaisRecente = mortes.sort((a, b) => 
            new Date(b.data_morte) - new Date(a.data_morte)
          )[0]
          setInfoMorte(morteMaisRecente)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar informações de morte:', error)
    } finally {
      setLoadingMorte(false)
    }
  }

  const carregarInfoVenda = async () => {
    if (!id || !animal) return
    
    try {
      setLoadingVenda(true)
      
      // Preparar dados iniciais do animal (se existirem)
      const valorVendaAnimal = animal.valor_venda || animal.valorVenda || 0
      const custosTotal = custos.length > 0 
        ? custos.reduce((sum, custo) => sum + parseFloat(custo.valor || 0), 0)
        : (animal.custo_total || animal.custoTotal || 0)
      
      let infoVendaInicial = {
        valorVenda: valorVendaAnimal,
        custosTotal: custosTotal,
        dataVenda: animal.data_venda || animal.dataVenda || null,
        nfNumero: animal.nf_saida || animal.nfSaida || null,
        destino: animal.destino || animal.comprador || null,
        calculado: true
      }
      
      // Se já temos todos os dados necessários do animal, usar diretamente
      if (infoVendaInicial.nfNumero && infoVendaInicial.dataVenda && infoVendaInicial.destino) {
        setInfoVenda(infoVendaInicial)
        setLoadingVenda(false)
        return
      }
      
      // Buscar nas NFs para completar dados faltantes
      const response = await fetch(`/api/notas-fiscais?tipo=saida`)
      
      if (response.ok) {
        const result = await response.json()
        const nfs = result.data || result || []
        
        // Procurar NF de saída que contenha este animal
        let nfVenda = null
        let itemVenda = null
        
        for (const nf of nfs) {
          try {
            // Buscar NF completa com itens
            const nfResponse = await fetch(`/api/notas-fiscais/${nf.id}`)
            if (nfResponse.ok) {
              const nfCompleta = await nfResponse.json()
              const itens = nfCompleta.itens || []
              
              // Verificar se algum item corresponde ao animal
              const itemEncontrado = itens.find(item => {
                const tatuagem = item.tatuagem || ''
                const animalId = item.animalId || item.animal_id
                
                return (
                  animalId === parseInt(id) ||
                  tatuagem === `${animal.serie}-${animal.rg}` ||
                  tatuagem === `${animal.serie} ${animal.rg}` ||
                  tatuagem === `${animal.serie}${animal.rg}` ||
                  (animal.serie && animal.rg && 
                   tatuagem.toLowerCase().includes(animal.serie.toLowerCase()) && 
                   tatuagem.includes(String(animal.rg)))
                )
              })
              
              if (itemEncontrado) {
                nfVenda = nf
                itemVenda = itemEncontrado
                break
              }
            }
          } catch (err) {
            logger.error('Erro ao buscar NF:', err)
          }
        }
        
        if (nfVenda && itemVenda) {
          // Usar dados da NF para preencher campos faltantes, mas manter dados do animal se já existirem
          const valorVendaNF = parseFloat(itemVenda.valorUnitario || itemVenda.valor_unitario || 0)
          
          const vendaInfo = {
            valorVenda: valorVendaAnimal || valorVendaNF,
            custosTotal: custosTotal,
            dataVenda: infoVendaInicial.dataVenda || nfVenda.data || nfVenda.data_compra,
            nfNumero: infoVendaInicial.nfNumero || nfVenda.numero_nf || nfVenda.numeroNF,
            destino: infoVendaInicial.destino || nfVenda.destino || nfVenda.fornecedor,
            peso: itemVenda.peso,
            calculado: false
          }
          
          setInfoVenda(vendaInfo)
        } else {
          // Se não encontrou NF mas tem dados do animal, usar os dados do animal mesmo incompletos
          if (valorVendaAnimal > 0) {
            setInfoVenda(infoVendaInicial)
          }
        }
      } else {
        // Se houve erro mas temos dados do animal, usar os dados do animal
        if (valorVendaAnimal > 0) {
          setInfoVenda(infoVendaInicial)
        }
      }
    } catch (error) {
      logger.error('Erro ao carregar informações de venda:', error)
      // Se houve erro mas temos dados do animal, usar os dados do animal
      const valorVendaAnimal = animal.valor_venda || animal.valorVenda || 0
      if (valorVendaAnimal > 0) {
        const custosTotal = custos.length > 0 
          ? custos.reduce((sum, custo) => sum + parseFloat(custo.valor || 0), 0)
          : (animal.custo_total || animal.custoTotal || 0)
        setInfoVenda({
          valorVenda: valorVendaAnimal,
          custosTotal: custosTotal,
          dataVenda: animal.data_venda || animal.dataVenda || null,
          nfNumero: animal.nf_saida || animal.nfSaida || null,
          destino: animal.destino || animal.comprador || null,
          calculado: true
        })
      }
    } finally {
      setLoadingVenda(false)
    }
  }

  const loadReproducaoStats = async () => {
    if (!animal) return
    
    // Determine search criteria
    const isMacho = animal.sexo && (animal.sexo.toLowerCase().startsWith('m') || animal.sexo === 'M')
    const queryParam = isMacho ? 'touro' : 'doadora'
    
    // Use animal ID for precise matching instead of text search
    // This prevents false matches when RG contains common numbers
    const animalId = animal.id
    
    if (!animalId) return

    setLoadingReproducao(true)
    try {
        // Search by animal ID for exact matches
        const idParam = isMacho ? 'touro_id' : 'doadora_id'
        const response = await fetch(`/api/transferencias-embrioes?${idParam}=${animalId}`)
        
        if (response.ok) {
            const result = await response.json()
            const transfers = result.data || result // Handle both {data: []} and [] formats
            
            if (Array.isArray(transfers) && transfers.length > 0) {
                // Calculate Stats
                const stats = {
                    total: transfers.length,
                    machos: transfers.filter(t => t.sexo_prenhez === 'M' || t.sexo_prenhez === 'Macho').length,
                    femeas: transfers.filter(t => t.sexo_prenhez === 'F' || t.sexo_prenhez === 'Fêmea').length,
                    nascidos: transfers.filter(t => t.status === 'Nascido' || t.status === 'Parida' || t.status === 'Concluída').length,
                    parceiros: {} // Bulls if animal is cow, Cows if animal is bull
                }

                transfers.forEach(t => {
                    const parceiroName = isMacho 
                        ? (t.doadora_nome || 'Não Identificada')
                        : (t.touro || 'Não Identificado')
                    
                    if (!stats.parceiros[parceiroName]) {
                        stats.parceiros[parceiroName] = { total: 0, machos: 0, femeas: 0 }
                    }
                    stats.parceiros[parceiroName].total++
                    if (t.sexo_prenhez === 'M' || t.sexo_prenhez === 'Macho') stats.parceiros[parceiroName].machos++
                    if (t.sexo_prenhez === 'F' || t.sexo_prenhez === 'Fêmea') stats.parceiros[parceiroName].femeas++
                })
                
                // Calculate Active Pregnancies (not born, not failed)
                const activePregnancies = transfers.filter(t => {
                    const status = (t.status || '').toLowerCase()
                    const isFinished = ['nascido', 'parida', 'concluída', 'concluida', 'falha', 'negativo', 'aborto'].some(s => status.includes(s))
                    return !isFinished
                }).map(t => {
                    // Calculate Due Date: TE Date + 283 days (approx gestation) - 7 days (embryo age) = +276 days
                    const teDate = new Date(t.data_te)
                    const dueDate = new Date(teDate)
                    dueDate.setDate(dueDate.getDate() + 276)
                    
                    // Days remaining
                    const today = new Date()
                    const diffTime = dueDate - today
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                    
                    return {
                        ...t,
                        previsao_parto: dueDate,
                        dias_restantes: diffDays
                    }
                }).sort((a, b) => a.previsao_parto - b.previsao_parto)

                stats.prenhezes_ativas = activePregnancies
                
                setReproducaoStats(stats)
            } else {
                setReproducaoStats(null)
            }
        }
    } catch (error) {
        console.error('Erro ao carregar estatísticas reprodutivas:', error)
    } finally {
        setLoadingReproducao(false)
    }
  }

  const loadTransferenciasEmbrioes = async () => {
    if (!animal) return
    
    setLoadingTransferencias(true)
    try {
      // Buscar todas as transferências e filtrar no cliente (mesma lógica do PDF)
      const resTodas = await fetch('/api/transferencias-embrioes').then(r => r.ok ? r.json() : { data: [] })
      const todasTE = resTodas.data || resTodas || []
      
      // Filtrar no cliente para garantir que encontramos todas as correspondências
      const transferenciasFiltradas = todasTE.filter(te => {
        // Verificar por ID (mais preciso)
        if (te.doadora_id === animal.id || te.receptora_id === animal.id || te.touro_id === animal.id) {
          return true
        }
        
        // Verificar por nome (doadora) - formato "CJCJ (RG: 16418)"
        if (te.doadora_nome) {
          const doadoraNome = te.doadora_nome.toLowerCase()
          const serie = animal.serie ? animal.serie.toLowerCase() : ''
          const rg = animal.rg ? animal.rg.toString() : ''
          if ((serie && doadoraNome.includes(serie)) && (rg && doadoraNome.includes(rg))) {
            return true
          }
        }
        
        // Verificar por nome (receptora) - pode ser "G 3028" ou "CJCJ 16418"
        if (te.receptora_nome) {
          const receptoraNome = te.receptora_nome.toLowerCase()
          const serie = animal.serie ? animal.serie.toLowerCase() : ''
          const rg = animal.rg ? animal.rg.toString() : ''
          // Para receptoras, verificar se contém o RG (formato "G RG" ou "SERIE RG")
          if ((rg && receptoraNome.includes(rg)) || (serie && receptoraNome.includes(serie))) {
            return true
          }
        }
        
        // Verificar por nome (touro)
        if (te.touro) {
          const touroNome = te.touro.toLowerCase()
          const serie = animal.serie ? animal.serie.toLowerCase() : ''
          const rg = animal.rg ? animal.rg.toString() : ''
          if ((serie && touroNome.includes(serie)) || (rg && touroNome.includes(rg))) {
            return true
          }
        }
        
        return false
      })
      
      // Remover duplicatas baseado no ID
      const transferenciasUnicas = transferenciasFiltradas.filter((te, index, self) =>
        index === self.findIndex(t => t.id === te.id)
      )
      
      // Ordenar por data (mais recente primeiro)
      transferenciasUnicas.sort((a, b) => new Date(b.data_te) - new Date(a.data_te))
      
      setTransferenciasEmbrioes(transferenciasUnicas)
    } catch (error) {
      console.error('Erro ao buscar transferências de embriões:', error)
      setTransferenciasEmbrioes([])
    } finally {
      setLoadingTransferencias(false)
    }
  }

  // Escutar evento para recarregar exames quando um novo for salvo
  useEffect(() => {
    const handleReloadExames = () => {
      if (animal && animal.rg) {
        setTimeout(() => {
          loadExamesAndrologicos()
        }, 1000) // Aguardar 1 segundo para garantir que o banco foi atualizado
      }
    }

    const handleReloadCustos = () => {
      if (id) {
        setTimeout(() => {
          loadCustos(true) // Forçar refresh para buscar dados atualizados
        }, 1000) // Aguardar 1 segundo para garantir que o banco foi atualizado
      }
    }

    window.addEventListener('reloadAnimalExames', handleReloadExames)
    window.addEventListener('reloadAnimalCustos', handleReloadCustos)
    return () => {
      window.removeEventListener('reloadAnimalExames', handleReloadExames)
      window.removeEventListener('reloadAnimalCustos', handleReloadCustos)
    }
  }, [animal, id])
  
  // Efeito adicional para garantir que o avô materno seja atualizado quando o animal mudar
  useEffect(() => {
    if (animal) {
      // Verificar diretamente no objeto do animal
      if (animal.avo_materno || animal.avoMaterno) {
        const avo = animal.avo_materno || animal.avoMaterno
        if (avo && avo.trim() !== '') {
          setAvoMaterno(avo)
        }
      }
    }
  }, [animal])

  // Buscar IDs do Pai e Mãe para links clicáveis
  useEffect(() => {
    if (!animal) return
    const fetchParentIds = async () => {
      let pId = null
      let mId = null
      if (animal.serie_mae && animal.rg_mae) {
        try {
          const res = await fetch(`/api/animals/verificar?serie=${encodeURIComponent(animal.serie_mae)}&rg=${encodeURIComponent(animal.rg_mae)}`)
          if (res.ok) {
            const data = await res.json()
            if (data.data?.id) mId = data.data.id
          }
        } catch (e) {}
      } else if (maeSerieRg?.serie && maeSerieRg?.rg) {
        try {
          const res = await fetch(`/api/animals/verificar?serie=${encodeURIComponent(maeSerieRg.serie)}&rg=${encodeURIComponent(maeSerieRg.rg)}`)
          if (res.ok) {
            const data = await res.json()
            if (data.data?.id) mId = data.data.id
          }
        } catch (e) {}
      }
      if (animal.pai && animal.pai.trim()) {
        try {
          const res = await fetch(`/api/animals/buscar-por-nome?nome=${encodeURIComponent(animal.pai.trim())}`)
          if (res.ok) {
            const data = await res.json()
            if (data.data?.id) pId = data.data.id
          }
        } catch (e) {}
      }
      setPaiId(pId)
      setMaeId(mId)
    }
    fetchParentIds()
  }, [animal?.serie_mae, animal?.rg_mae, animal?.pai, maeSerieRg])

  const handleVenda = async () => {
    setShowNotaFiscalModal(true)
    setShowQuickOccurrence(false)
    
    // Carregar todos os animais para busca
    try {
      const response = await fetch('/api/animals')
      if (response.ok) {
        const data = await response.json()
        setAllAnimals(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Erro ao carregar animais para venda:', error)
      setAllAnimals([animal]) // Fallback
    }
  }

  const handleSaveNF = async (nf) => {
    try {
      const response = await fetch('/api/notas-fiscais', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nf)
      })

      if (response.ok) {
        Toast.success('Nota fiscal de venda cadastrada com sucesso!')
        loadAnimal()
      } else {
        Toast.error('Erro ao salvar nota fiscal')
        return
      }

      // Integrar com boletim (saída)
      if (nf.tipo === 'saida') {
        const result = await integrarNFSaida(nf)
        if (result.success) {
          Toast.success(`✅ ${result.message}`)
        } else {
          Toast.error(`❌ ${result.message}`)
        }
      }
    } catch (error) {
      console.error('Erro ao salvar NF:', error)
      Toast.error('Erro ao salvar nota fiscal')
    }
  }

  const loadAnimal = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Primeiro tentar buscar via API
      try {
        // Tentar buscar por ID primeiro
        let response = await fetch(`/api/animals/${id}`)
        
        // Se não encontrou e o ID parece ser um RG (não numérico ou muito grande), tentar buscar por RG
        if (!response.ok && response.status === 404) {
          console.log(`⚠️ Animal ${id} não encontrado por ID, tentando buscar por RG...`)
          
          // Tentar buscar usando a API de verificação que aceita RG
          const verificarResponse = await fetch(`/api/animals/verificar?rg=${id}`)
          if (verificarResponse.ok) {
            const verificarResult = await verificarResponse.json()
            if (verificarResult.success && verificarResult.data) {
              // Se encontrou por RG, redirecionar para o ID correto
              const animalIdCorreto = verificarResult.data.id
              console.log(`✅ Animal encontrado por RG ${id}, ID correto: ${animalIdCorreto}`)
              
              // Se o ID na URL é diferente do ID correto, redirecionar
              if (id !== String(animalIdCorreto)) {
                console.log(`🔄 Redirecionando de /animals/${id} para /animals/${animalIdCorreto}`)
                router.replace(`/animals/${animalIdCorreto}`)
                return
              }
              
              response = await fetch(`/api/animals/${animalIdCorreto}`)
            }
          }
        }
        
        if (response.ok) {
          const result = await response.json()
          // A API retorna { success: true, data: {...}, message: '...' }
          const animalData = result.success && result.data ? result.data : result
          
          if (animalData) {
            setAnimal(animalData)
            logger.info('Animal carregado com sucesso via API', { id, nome: animalData.nome || animalData.serie })
            return
          }
        } else if (response.status === 404) {
          // Animal não encontrado na API, continuar para localStorage
          console.log(`⚠️ Animal ${id} não encontrado na API (404)`)
        }
      } catch (apiError) {
        console.error('❌ Erro ao buscar na API:', apiError)
        // Continuar para tentar localStorage
      }
      
      // Se não encontrou na API, tentar no localStorage
      try {
        const animalsData = JSON.parse(localStorage.getItem('animals') || '[]')
        const animal = animalsData.find(a => a.id == id || a.id === parseInt(id))
        
        if (animal) {
          // Converter formato do localStorage para formato esperado
          const formattedAnimal = {
            id: animal.id,
            serie: animal.serie,
            rg: animal.rg,
            sexo: animal.sexo,
            raca: animal.raca,
            avo_materno: animal.avoMaterno || animal.avo_materno,
            cor: animal.cor || animal.cor || '',
            data_nascimento: animal.dataNascimento || animal.data_nascimento,
            hora_nascimento: animal.horaNascimento || animal.hora_nascimento,
            peso_nascimento: animal.pesoNascimento || animal.peso_nascimento,
            tipo_nascimento: animal.tipoNascimento || animal.tipo_nascimento,
            peso: animal.peso,
            meses: animal.meses,
            situacao: animal.situacao,
            valor_venda: animal.valorVenda || animal.valor_venda,
            pai: animal.pai,
            mae: animal.mae,
            observacoes: animal.observacoes,
            custos: animal.custos || []
          }
          
          setAnimal(formattedAnimal)
          logger.info('Animal carregado com sucesso via localStorage', { id, nome: animal.serie })
          return
        }
      } catch (localStorageError) {
        console.error('Erro ao ler localStorage:', localStorageError)
      }
      
      // Se chegou aqui, animal não foi encontrado
      setError('Animal não encontrado')
      
    } catch (error) {
      logger.error('Erro ao carregar animal:', error)
      setError('Erro ao carregar dados do animal')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    router.push(`/animals?edit=${id}`)
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este animal?')) {
      return
    }

    try {
      const response = await fetch(`/api/animals/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        logger.info('Animal excluído com sucesso', { id })
        router.push('/animals')
      } else {
        alert('Erro ao excluir animal')
      }
    } catch (error) {
      logger.error('Erro ao excluir animal:', error)
      alert('Erro ao excluir animal')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Não informado'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Data inválida'
      return date.toLocaleDateString('pt-BR')
    } catch (error) {
      console.error('Erro ao formatar data:', error)
      return 'Data inválida'
    }
  }

  const formatCurrency = (value) => {
    if (!value) return 'Não informado'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const handleGeneratePDF = async () => {
    if (!animal) return

    try {
      setGeneratingPDF(true)

      // Garantir que os custos estejam carregados
      if (custos.length === 0) {
        await loadCustos()
        // Aguardar um pouco para garantir que os custos foram carregados
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // Preparar dados do animal com exames e custos
      const animalData = {
        ...animal,
        examesAndrologicos: examesAndrologicos,
        custos: custos || []
      }

      // Criar objeto de exames por RG para a função de PDF
      const examesPorRG = {}
      examesPorRG[animal.rg] = examesAndrologicos

      // Criar mapa de stats reprodutivos
      const reproducaoStatsMap = {}
      if (reproducaoStats) {
        reproducaoStatsMap[animal.id] = reproducaoStats
      }

      // Buscar todas as transferências de embriões relacionadas ao animal
      const transferenciasEmbrioesMap = {}
      try {
        // Buscar como doadora, receptora e touro (por ID e por nome)
        const identificacao = `${animal.serie} ${animal.rg}`
        const serieRG = `${animal.serie}${animal.rg}`
        const serieRGParenteses = `${animal.serie} (RG: ${animal.rg})`
        
        // Buscar todas as transferências e filtrar no cliente (mais confiável)
        const resTodas = await fetch('/api/transferencias-embrioes').then(r => r.ok ? r.json() : { data: [] })
        const todasTE = resTodas.data || resTodas || []
        
        // Filtrar no cliente para garantir que encontramos todas as correspondências
        const transferenciasFiltradas = todasTE.filter(te => {
          // Verificar por ID (mais preciso)
          if (te.doadora_id === animal.id || te.receptora_id === animal.id || te.touro_id === animal.id) {
            return true
          }
          
          // Verificar por nome (doadora) - formato "CJCJ (RG: 16418)"
          if (te.doadora_nome) {
            const doadoraNome = te.doadora_nome.toLowerCase()
            const serie = animal.serie ? animal.serie.toLowerCase() : ''
            const rg = animal.rg ? animal.rg.toString() : ''
            if ((serie && doadoraNome.includes(serie)) && (rg && doadoraNome.includes(rg))) {
              return true
            }
          }
          
          // Verificar por nome (receptora) - pode ser "G 3028" ou "CJCJ 16418"
          if (te.receptora_nome) {
            const receptoraNome = te.receptora_nome.toLowerCase()
            const serie = animal.serie ? animal.serie.toLowerCase() : ''
            const rg = animal.rg ? animal.rg.toString() : ''
            // Para receptoras, verificar se contém o RG (formato "G RG" ou "SERIE RG")
            if ((rg && receptoraNome.includes(rg)) || (serie && receptoraNome.includes(serie))) {
              return true
            }
          }
          
          // Verificar por nome (touro)
          if (te.touro) {
            const touroNome = te.touro.toLowerCase()
            const serie = animal.serie ? animal.serie.toLowerCase() : ''
            const rg = animal.rg ? animal.rg.toString() : ''
            if ((serie && touroNome.includes(serie)) || (rg && touroNome.includes(rg))) {
              return true
            }
          }
          
          return false
        })
        
        // Remover duplicatas baseado no ID
        const transferenciasUnicas = transferenciasFiltradas.filter((te, index, self) =>
          index === self.findIndex(t => t.id === te.id)
        )
        
        if (transferenciasUnicas.length > 0) {
          transferenciasEmbrioesMap[animal.id] = transferenciasUnicas
        }
      } catch (error) {
        console.error('Erro ao buscar transferências de embriões para PDF:', error)
        // Continuar sem as transferências se houver erro
      }

      // Gerar PDF
      const doc = await generateAnimalFichaPDF([animalData], examesPorRG, reproducaoStatsMap, transferenciasEmbrioesMap)

      // Salvar PDF
      const filename = `Ficha_Animal_${animal.serie || ''}_${animal.rg || ''}_${new Date().toISOString().slice(0, 10)}.pdf`
      doc.save(filename)

      logger.info('PDF da ficha do animal gerado com sucesso', { 
        animalId: id, 
        custosIncluidos: custos.length,
        examesIncluidos: examesAndrologicos.length
      })
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      alert('Erro ao gerar PDF da ficha')
    } finally {
      setGeneratingPDF(false)
    }
  }


  // Buscar série e RG da mãe quando não estão no cadastro (por nome no sistema)
  const buscarSerieRgMae = async () => {
    if (!animal?.mae?.trim()) return
    if (animal.serie_mae && animal.rg_mae) return // Já tem no cadastro
    const { serie, rg } = extrairSerieRG(animal.mae, animal.serie)
    if (serie && rg) {
      setMaeSerieRg({ serie, rg }) // Extraído do formato "SERIE RG"
      return
    }
    try {
      const res = await fetch(`/api/animals/buscar-por-nome?nome=${encodeURIComponent(animal.mae.trim())}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.data?.serie && data.data?.rg) {
          setMaeSerieRg({ serie: data.data.serie, rg: data.data.rg })
        } else {
          setMaeSerieRg(null)
        }
      } else {
        setMaeSerieRg(null)
      }
    } catch {
      setMaeSerieRg(null)
    }
  }

  // Buscar avô materno - priorizar campo direto do animal
  const buscarAvoMaterno = async () => {
    // 1) PRIMEIRO: Verificar se já vem no objeto do animal (campo direto do banco)
    if (animal && (animal.avo_materno || animal.avoMaterno)) {
      const avo = animal.avo_materno || animal.avoMaterno
      if (avo && avo.trim() !== '') {
        setAvoMaterno(avo)
        return
      }
    }

    // 2) SEGUNDO: Tentar buscar através da mãe (se mãe estiver cadastrada)
    if (animal && animal.mae) {
      try {
        const { serie, rg } = extrairSerieRG(animal.mae, animal.serie)
        
        if (serie && rg) {
          // Buscar a mãe no banco de dados
          const response = await fetch(`/api/animals?serie=${serie}&rg=${rg}`)
          
          if (response.ok) {
            const result = await response.json()
            const animais = result.success && result.data ? result.data : (result.data || [])
            const maeEncontrada = Array.isArray(animais) ? animais.find(a => a.serie === serie && a.rg === rg) : null
            
            if (maeEncontrada && (maeEncontrada.avo_materno || maeEncontrada.avoMaterno)) {
              const avo = maeEncontrada.avo_materno || maeEncontrada.avoMaterno
              setAvoMaterno(avo)
              return
            }
            
            // Se mãe tem pai cadastrado, esse é o avô materno
            if (maeEncontrada && maeEncontrada.pai) {
              setAvoMaterno(maeEncontrada.pai)
              return
            }
          }
          
          // Se mãe não encontrada, tentar buscar através de irmãos (mesma mãe)
          // que têm avô materno cadastrado
          try {
            const irmaosResponse = await fetch(`/api/animals?serie=${animal.serie}`)
            if (irmaosResponse.ok) {
              const irmaosResult = await irmaosResponse.json()
              const irmaos = irmaosResult.success && irmaosResult.data ? irmaosResult.data : (irmaosResult.data || [])
              
              // Encontrar irmão com mesma mãe que tem avô materno
              const irmaoComAvo = irmaos.find(irmao => {
                const irmaoMae = extrairSerieRG(irmao.mae || '', irmao.serie)
                return irmaoMae.serie === serie && irmaoMae.rg === rg && 
                       (irmao.avo_materno || irmao.avoMaterno) &&
                       irmao.id !== animal.id
              })
              
              if (irmaoComAvo) {
                const avo = irmaoComAvo.avo_materno || irmaoComAvo.avoMaterno
                if (avo && avo.trim() !== '') {
                  setAvoMaterno(avo)
                  return
                }
              }
            }
          } catch (irmaosError) {
            // Ignorar erro ao buscar irmãos
          }
        }
      } catch (error) {
        console.error('Erro ao buscar avô materno através da mãe:', error)
      }
    }

    // 3) TERCEIRO: Tentar buscar em ocorrências registradas
    await buscarAvoMaternoFallback()
  }

  const carregarDataUltimaPesagem = async () => {
    if (!id) return
    try {
      const [resOcorrencias, resPesagens] = await Promise.all([
        fetch(`/api/animals/ocorrencias?animalId=${id}&limit=50`),
        fetch(`/api/pesagens?animalId=${id}`)
      ])
      const ocorrencias = resOcorrencias.ok ? (await resOcorrencias.json()).ocorrencias || [] : []
      const pesagensApi = resPesagens.ok ? (await resPesagens.json()).pesagens || [] : []
      const pesagensComoOcorrencias = pesagensApi.map(p => ({
        tipo: 'Pesagem',
        data: p.data,
        data_registro: p.data,
        data_ultimo_peso: p.data,
        peso: p.peso,
        ce: p.ce,
        observacoes: p.observacoes,
        local: p.observacoes,
        _fromPesagensTable: true
      }))
      const chavesOc = new Set(ocorrencias.map(o => `${o.data || o.data_registro}-${o.peso}`))
      const pesagensNovas = pesagensComoOcorrencias.filter(p => !chavesOc.has(`${p.data}-${p.peso}`))
      const todas = [...ocorrencias, ...pesagensNovas].sort((a, b) => {
        const da = new Date(a.data || a.data_registro || a.data_ultimo_peso || 0)
        const db = new Date(b.data || b.data_registro || b.data_ultimo_peso || 0)
        return db - da
      })
      setOcorrenciasRecentes(todas)
      setOcorrenciasRecentes(todas)
      const pesagens = todas.filter(oc => oc.tipo === 'Pesagem' || (oc.peso != null && oc.peso !== ''))
      const ultima = pesagens[0]
      if (ultima) {
        setDataUltimaPesagem(ultima.data || ultima.data_registro || ultima.data_ultimo_peso)
        setUltimaPesagem({ peso: ultima.peso, data: ultima.data || ultima.data_registro, ce: ultima.ce })
      } else {
        setDataUltimaPesagem(null)
        setUltimaPesagem(null)
      }
    } catch (e) {
      setDataUltimaPesagem(null)
      setUltimaPesagem(null)
      setOcorrenciasRecentes([])
    }
  }


  // Fallback para avô materno: buscar em ocorrências
  const buscarAvoMaternoFallback = async () => {
    // Tentar carregar de ocorrências registradas para este animal
    try {
      const res = await fetch(`/api/animals/ocorrencias?animalId=${id}&limit=10`)
      if (res.ok) {
        const data = await res.json()
        const ocorrencias = Array.isArray(data.ocorrencias) ? data.ocorrencias : []
        const comAvo = ocorrencias.find(oc => oc.avo_materno && oc.avo_materno.trim() !== '')
        if (comAvo) {
          setAvoMaterno(comAvo.avo_materno)
          return
        }
      }
    } catch (err) {
      console.warn('Falha ao buscar ocorrências para avô materno:', err)
    }
    // 3) Se nada encontrado, manter como não informado
    setAvoMaterno(null)
  }

  // Carregar localização atual do animal
  const carregarLocalizacao = async () => {
    if (!id) return

    try {
      let response = await fetch(`/api/localizacoes?animal_id=${id}&atual=true`)
      let localizacaoAtiva = null

      if (response.ok) {
        const result = await response.json()
        let localizacoes = result.data || []
        localizacaoAtiva = localizacoes.find(loc => !loc.data_saida) || localizacoes[0] || null

        // Se não encontrou ativa, buscar TODAS as localizações e usar a mais recente como fallback
        // (caso data_saida esteja preenchida por erro de importação, ex: datas invertidas)
        if (!localizacaoAtiva) {
          const resTodas = await fetch(`/api/localizacoes?animal_id=${id}`)
          if (resTodas.ok) {
            const dataTodas = (await resTodas.json()).data || []
            const maisRecente = dataTodas[0]
            if (maisRecente) {
              const dataEntrada = maisRecente.data_entrada ? new Date(maisRecente.data_entrada) : null
              const dataSaida = maisRecente.data_saida ? new Date(maisRecente.data_saida) : null
              // Se data_saida < data_entrada (inconsistente) ou é a única localização, usar como atual
              if (!dataSaida || !dataEntrada || dataSaida < dataEntrada) {
                localizacaoAtiva = maisRecente
              }
            }
          }
        }
      }
      
      // Fallback: Se não encontrou na API de localizações, usar o campo do cadastro do animal
      // (importação Excel usa piquete_atual; cadastro antigo pode usar pasto_atual)
      const localDoAnimal = animal?.piquete_atual || animal?.piqueteAtual || animal?.pasto_atual || animal?.pastoAtual
      if (!localizacaoAtiva && animal && localDoAnimal) {
        localizacaoAtiva = {
          piquete: localDoAnimal,
          data_entrada: animal.data_entrada_piquete || animal.dataEntradaPiquete || animal.created_at || animal.data_nascimento || null,
          motivo_movimentacao: 'Importação / Cadastro Inicial'
        }
      }

      setLocalizacaoAtual(localizacaoAtiva)
    } catch (error) {
      console.error('Erro ao carregar localização:', error)
      
      // Fallback em caso de erro
      const localDoAnimal = animal?.piquete_atual || animal?.piqueteAtual || animal?.pasto_atual || animal?.pastoAtual
      if (animal && localDoAnimal) {
        setLocalizacaoAtual({
          piquete: localDoAnimal,
          data_entrada: animal.data_entrada_piquete || animal.dataEntradaPiquete || animal.created_at || animal.data_nascimento || null,
          motivo_movimentacao: 'Importação / Cadastro Inicial'
        })
      } else {
        setLocalizacaoAtual(null)
      }
    }
  }

  const loadCustos = async (forceRefresh = false) => {
    if (!id) return
    
    try {
      setLoadingCustos(true)
      
      // Usar custos já carregados no animal (evita requisição duplicada) - exceto em refresh forçado
      if (!forceRefresh) {
        const custosDoAnimal = animal?.custos
        if (Array.isArray(custosDoAnimal) && custosDoAnimal.length > 0) {
          const custosOrdenados = [...custosDoAnimal].sort((a, b) => {
            const dataA = new Date(a.data || a.data_custo || 0)
            const dataB = new Date(b.data || b.data_custo || 0)
            return dataB - dataA
          })
          setCustos(custosOrdenados)
          setLoadingCustos(false)
          return
        }
      }
      
      // Primeiro tentar buscar via API específica de custos
      try {
        const response = await fetch(`/api/animals/${id}/custos`)
        
        if (response.ok) {
          const result = await response.json()
          const custosData = result.success && result.data ? result.data : (result.data || [])
          
          // Garantir que é um array e ordenar por data (mais recente primeiro)
          const custosArray = Array.isArray(custosData) ? custosData : []
          custosArray.sort((a, b) => {
            const dataA = new Date(a.data || a.data_custo || 0)
            const dataB = new Date(b.data || b.data_custo || 0)
            return dataB - dataA
          })
          
          console.log(`✅ Custos carregados para animal ${id}:`, custosArray.length, 'custos')
          console.log('📋 Detalhes dos custos:', custosArray.map(c => ({
            tipo: c.tipo,
            subtipo: c.subtipo,
            valor: c.valor,
            data: c.data || c.data_custo
          })))
          
          setCustos(custosArray)
          return
        } else {
          console.warn(`⚠️ API de custos retornou erro: ${response.status}`)
        }
      } catch (apiError) {
        console.error('Erro ao buscar custos via API:', apiError)
      }
      
      // Tentar buscar via API geral de custos com filtro
      try {
        const response = await fetch(`/api/custos?animalId=${id}`)
        if (response.ok) {
          const result = await response.json()
          const custosData = result.success && result.data ? result.data : (result.data || [])
          const custosArray = Array.isArray(custosData) ? custosData : []
          
          custosArray.sort((a, b) => {
            const dataA = new Date(a.data || a.data_custo || 0)
            const dataB = new Date(b.data || b.data_custo || 0)
            return dataB - dataA
          })
          
          console.log(`✅ Custos carregados via API geral:`, custosArray.length, 'custos')
          setCustos(custosArray)
          return
        }
      } catch (apiError2) {
        console.error('Erro ao buscar custos via API geral:', apiError2)
      }
      
      // Se não encontrar via API específica, tentar pegar do animal se já tiver
      if (animal && animal.custos) {
        const custosAnimal = Array.isArray(animal.custos) ? animal.custos : []
        if (custosAnimal.length > 0) {
          setCustos(custosAnimal)
          return
        }
      }
      
      // Se não encontrou nada, deixar vazio
      console.warn(`⚠️ Nenhum custo encontrado para animal ${id}`)
      setCustos([])
    } catch (error) {
      console.error('Erro ao carregar custos:', error)
      setCustos([])
    } finally {
      setLoadingCustos(false)
    }
  }

  const loadExamesAndrologicos = async () => {
    if (!animal || !animal.rg) return
    
    // Verificar se o animal é macho - exames andrológicos são apenas para machos
    const isMacho = animal.sexo && (
      animal.sexo.toLowerCase().startsWith('m') || 
      animal.sexo === 'M' || 
      animal.sexo.toLowerCase().includes('macho')
    )
    
    // Se não for macho, não carregar exames andrológicos
    if (!isMacho) {
      setExamesAndrologicos([])
      return
    }
    
    try {
      setLoadingExames(true)
      
      // Buscar exames andrológicos pelo RG do animal
      const response = await fetch(`/api/reproducao/exames-andrologicos?rg=${animal.rg}`)
      
      if (response.ok) {
        const result = await response.json()
        // A API pode retornar array direto ou objeto com data/exames
        const exames = Array.isArray(result) 
          ? result 
          : (result.data || result.exames || [])
        
        // Normalizar identificação do animal para comparação
        const animalIdentificacao = `${animal.serie || ''}-${animal.rg}`.replace(/-+/g, '-').toUpperCase()
        const animalIdentificacaoSemHifen = `${animal.serie || ''}${animal.rg}`.toUpperCase()
        
        // Filtrar apenas exames deste animal (por RG e série se disponível)
        const examesDoAnimal = exames.filter(exame => {
          // Verificar RG primeiro (deve ser exato)
          if (String(exame.rg).trim() !== String(animal.rg).trim()) return false
          
          // Se tiver série no exame, verificar também
          if (exame.touro && animal.serie) {
            // Normalizar identificação do touro no exame
            const touroNormalizado = exame.touro.replace(/-+/g, '-').toUpperCase()
            const touroSemHifen = exame.touro.replace(/-/g, '').toUpperCase()
            
            // Verificar se corresponde (com ou sem hífen)
            const matchComHifen = touroNormalizado.includes(animalIdentificacao) || 
                                  touroNormalizado === animalIdentificacao
            const matchSemHifen = touroSemHifen.includes(animalIdentificacaoSemHifen) ||
                                  touroSemHifen === animalIdentificacaoSemHifen
            
            return matchComHifen || matchSemHifen
          }
          return true
        })
        
        // Ordenar por data (mais recente primeiro)
        examesDoAnimal.sort((a, b) => {
          const dataA = new Date(a.data_exame || a.data || 0)
          const dataB = new Date(b.data_exame || b.data || 0)
          return dataB - dataA
        })
        
        setExamesAndrologicos(examesDoAnimal)
        
        // Log para debug
        console.log('Exames encontrados:', {
          total: exames.length,
          filtrados: examesDoAnimal.length,
          animalRG: animal.rg,
          animalSerie: animal.serie,
          exames: examesDoAnimal
        })
      } else {
        setExamesAndrologicos([])
      }
    } catch (error) {
      console.error('Erro ao carregar exames andrológicos:', error)
      setExamesAndrologicos([])
    } finally {
      setLoadingExames(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Carregando animal..." />
      </div>
    )
  }

  // Splash Screen
  if (showSplash) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center z-[9999]">
        <div className="text-center space-y-8 px-4">
          {/* Logo da Fazenda com Prancheta */}
          <div className="relative">
            <div className="animate-bounce">
              <div className="w-40 h-40 mx-auto relative rounded-2xl shadow-2xl overflow-hidden bg-white">
                <div className="relative w-full h-full">
                  <Image 
                    src="/logo-santanna.png.jpg" 
                    alt="Logo Fazenda Sant'Anna"
                    fill
                    className="object-cover"
                    style={{ objectPosition: 'center center' }}
                    priority
                  />
                </div>
              </div>
            </div>
            
            {/* Prancheta/Clipboard animado */}
            <div 
              className="absolute -right-4 top-0 text-blue-300"
              style={{ 
                animation: 'float 2s ease-in-out infinite',
                transformOrigin: 'center'
              }}
            >
              <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                <path d="M9 12h6m-6 4h6"/>
              </svg>
            </div>
          </div>

          {/* Texto */}
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-white tracking-tight">
              Beef-Sync
            </h1>
            <p className="text-blue-200 text-lg animate-pulse">
              Iniciando o sistema...
            </p>
          </div>

          {/* Barra de progresso */}
          <div className="w-64 mx-auto">
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-400 to-blue-400 transition-all duration-300 ease-out"
                style={{ width: `${splashProgress}%` }}
              />
            </div>
            <p className="text-gray-400 text-sm mt-2">
              {Math.round(splashProgress)}%
            </p>
          </div>
        </div>

        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(-5deg); }
            50% { transform: translateY(-10px) rotate(5deg); }
          }
        `}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
            Erro
          </h2>
          <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
          <Button 
            variant="secondary"
            onClick={() => router.push('/animals')}
            className="flex items-center gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Voltar para Lista
          </Button>
        </div>
      </div>
    )
  }

  if (!animal) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Animal não encontrado
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            O animal solicitado não foi encontrado no sistema.
          </p>
          <Button 
            variant="secondary"
            onClick={() => router.push('/animals')}
            className="flex items-center gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Voltar para Lista
          </Button>
        </div>
      </div>
    )
  }

  // Calcular estatísticas de doadora se houver coletas FIV
  let doadoraStats = null
  if (animal && animal.fivs && animal.fivs.length > 0) {
    const totalColetas = animal.fivs.length
    const totalOocitos = animal.fivs.reduce((sum, fiv) => sum + (parseInt(fiv.quantidade_oocitos) || 0), 0)
    const totalEmbrioes = animal.fivs.reduce((sum, fiv) => sum + (parseInt(fiv.embrioes_produzidos) || 0), 0)
    const totalTransferidos = animal.fivs.reduce((sum, fiv) => sum + (parseInt(fiv.embrioes_transferidos) || 0), 0)
    const mediaOocitos = totalColetas > 0 ? (totalOocitos / totalColetas).toFixed(1) : 0
    const mediaEmbrioes = totalColetas > 0 ? (totalEmbrioes / totalColetas).toFixed(1) : 0
    const mediaTransferidos = totalColetas > 0 ? (totalTransferidos / totalColetas).toFixed(1) : 0

    const coletasOrdenadas = [...animal.fivs].sort((a, b) => 
      new Date(a.data_fiv) - new Date(b.data_fiv)
    )
    const primeiraColeta = coletasOrdenadas[0]
    const ultimaColeta = coletasOrdenadas[coletasOrdenadas.length - 1]

    doadoraStats = {
      totalColetas,
      totalOocitos,
      mediaOocitos,
      totalEmbrioesProduzidos: totalEmbrioes,
      mediaEmbrioesProduzidos: mediaEmbrioes,
      totalEmbrioesTransferidos: totalTransferidos,
      mediaEmbrioesTransferidos: mediaTransferidos,
      primeiraColeta,
      ultimaColeta
    }
  }

  // VERSÃO MOBILE SIMPLIFICADA - APENAS CONSULTA
  if (isMobile && animal) {
    const totalCustos = (animal.custos || custos || []).reduce((s, c) => s + parseFloat(c.valor || 0), 0)
    const currentIdx = allAnimals.findIndex(a => a.id === animal.id)
    const isDoadora = animal.fivs && animal.fivs.length > 0
    const isMacho = animal.sexo?.toLowerCase().includes('macho')
    
    // Calcular stats de doadora
    let statsDoadora = null
    if (isDoadora) {
      const totalColetas = animal.fivs.length
      const totalOocitos = animal.fivs.reduce((sum, fiv) => sum + (parseInt(fiv.quantidade_oocitos) || 0), 0)
      const totalEmbrioes = animal.fivs.reduce((sum, fiv) => sum + (parseInt(fiv.embrioes_produzidos) || 0), 0)
      const totalTransferidos = animal.fivs.reduce((sum, fiv) => sum + (parseInt(fiv.embrioes_transferidos) || 0), 0)
      const mediaOocitos = totalColetas > 0 ? (totalOocitos / totalColetas).toFixed(1) : 0
      const mediaEmbrioes = totalColetas > 0 ? (totalEmbrioes / totalColetas).toFixed(1) : 0
      const mediaTransferidos = totalColetas > 0 ? (totalTransferidos / totalColetas).toFixed(1) : 0
      const coletasOrdenadas = [...animal.fivs].sort((a, b) => new Date(b.data_fiv) - new Date(a.data_fiv))
      const ultimaColeta = coletasOrdenadas[0]

      statsDoadora = {
        totalColetas,
        totalOocitos,
        mediaOocitos,
        totalEmbrioesProduzidos: totalEmbrioes,
        mediaEmbrioesProduzidos: mediaEmbrioes,
        totalEmbrioesTransferidos: totalTransferidos,
        mediaEmbrioesTransferidos: mediaTransferidos,
        ultimaColeta
      }
    }
    
    return (
      <>
        <Head>
          <title>{animal.serie} {animal.rg} | Beef-Sync</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        </Head>

        <div className="min-h-screen bg-gray-900 text-white">
          {/* Header Ultra Compacto - Apenas Série e RG */}
          <div className={`p-3 shadow-lg ${
            animal.sexo?.toLowerCase().includes('macho') 
              ? 'bg-gradient-to-r from-blue-600 to-indigo-700'
              : 'bg-gradient-to-r from-pink-600 to-purple-700'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => router.push('/animals')}
                className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 active:scale-95"
              >
                <ArrowLeftIcon className="h-4 w-4" />
              </button>
              <h1 className="text-lg font-bold">
                {animal.serie} {animal.rg}
              </h1>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                animal.situacao === 'Ativo' ? 'bg-green-500' :
                animal.situacao === 'Vendido' ? 'bg-blue-500' :
                animal.situacao === 'Morto' ? 'bg-red-500' :
                'bg-gray-500'
              }`}>
                {animal.situacao || 'Ativo'}
              </span>
            </div>

            {/* Navegação */}
            {allAnimals.length > 0 && currentIdx >= 0 && (
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm font-bold">
                  {currentIdx + 1} de {allAnimals.length}
                </span>
                <div className="flex items-center gap-0.5 bg-white/10 rounded-lg p-0.5">
                  <button
                    onClick={() => router.push(`/animals/${allAnimals[0].id}`)}
                    disabled={currentIdx === 0}
                    className="p-1.5 rounded-lg hover:bg-white/20 disabled:opacity-30 active:scale-95"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => router.push(`/animals/${allAnimals[currentIdx - 1].id}`)}
                    disabled={currentIdx === 0}
                    className="p-1.5 rounded-lg hover:bg-white/20 disabled:opacity-30 active:scale-95"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => router.push(`/animals/${allAnimals[currentIdx + 1].id}`)}
                    disabled={currentIdx === allAnimals.length - 1}
                    className="p-1.5 rounded-lg hover:bg-white/20 disabled:opacity-30 active:scale-95"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => router.push(`/animals/${allAnimals[allAnimals.length - 1].id}`)}
                    disabled={currentIdx === allAnimals.length - 1}
                    className="p-1.5 rounded-lg hover:bg-white/20 disabled:opacity-30 active:scale-95"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modo Consulta - Sem botões de ação */}

          {/* Custos */}
          <div className="px-3 pb-3">
            <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
              <p className="text-xs text-gray-400 mb-1">Custos</p>
              <p className="text-2xl font-bold text-red-400">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCustos)}
              </p>
            </div>
          </div>

          {/* Badge Doadora + Stats FIV */}
          {isDoadora && statsDoadora && (
            <div className="px-3 pb-3">
              <div className="bg-gradient-to-br from-pink-900 to-purple-900 rounded-lg p-4 border-2 border-pink-500">
                <div className="flex items-center gap-2 mb-3">
                  <BeakerIcon className="h-5 w-5 text-pink-300" />
                  <h3 className="font-bold text-white">Animal Doadora</h3>
                </div>
                <p className="text-xs text-pink-200 mb-3">Possui histórico de coletas de oócitos (FIV)</p>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-black/20 rounded-lg p-2 text-center">
                    <p className="text-2xl font-bold text-pink-300">{statsDoadora.totalColetas}</p>
                    <p className="text-xs text-pink-200">Coletas</p>
                  </div>
                  <div className="bg-black/20 rounded-lg p-2 text-center">
                    <p className="text-2xl font-bold text-purple-300">{statsDoadora.totalOocitos}</p>
                    <p className="text-xs text-purple-200">Oócitos</p>
                  </div>
                  <div className="bg-black/20 rounded-lg p-2 text-center">
                    <p className="text-2xl font-bold text-indigo-300">{statsDoadora.mediaOocitos}</p>
                    <p className="text-xs text-indigo-200">Média</p>
                  </div>
                </div>

                {statsDoadora.ultimaColeta && (
                  <div className="mt-3 pt-3 border-t border-pink-700">
                    <p className="text-xs text-pink-200">
                      Última coleta: {new Date(statsDoadora.ultimaColeta.data_fiv).toLocaleDateString('pt-BR')}
                      {statsDoadora.ultimaColeta.quantidade_oocitos && 
                        ` • ${statsDoadora.ultimaColeta.quantidade_oocitos} oócitos`
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Card de Coletas FIV da Mãe */}
          {coletasFIVMae && coletasFIVMae.resumo && (
            <div className="px-3 pb-3">
              <div className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-lg p-4 border-2 border-indigo-500">
                <div className="flex items-center gap-2 mb-2">
                  <BeakerIcon className="h-5 w-5 text-indigo-300" />
                  <h3 className="font-bold text-white">Mãe Doadora</h3>
                </div>
                <p className="text-sm font-semibold text-indigo-200 mb-3">{coletasFIVMae.nome}</p>
                <p className="text-xs text-indigo-200 mb-3">Histórico de coletas de oócitos (FIV)</p>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div className="bg-black/20 rounded-lg p-2 text-center">
                    <p className="text-xl font-bold text-indigo-300">{coletasFIVMae.resumo.totalColetas}</p>
                    <p className="text-xs text-indigo-200">Coletas</p>
                  </div>
                  <div className="bg-black/20 rounded-lg p-2 text-center">
                    <p className="text-xl font-bold text-blue-300">{coletasFIVMae.resumo.totalOocitos}</p>
                    <p className="text-xs text-blue-200">Oócitos</p>
                  </div>
                  <div className="bg-black/20 rounded-lg p-2 text-center">
                    <p className="text-xl font-bold text-cyan-300">{coletasFIVMae.resumo.mediaOocitos}</p>
                    <p className="text-xs text-cyan-200">Média</p>
                  </div>
                </div>

                {/* Linha adicional com embriões */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-black/20 rounded-lg p-2 text-center">
                    <p className="text-xl font-bold text-purple-300">{coletasFIVMae.resumo.totalEmbrioesProduzidos}</p>
                    <p className="text-xs text-purple-200">Embriões</p>
                  </div>
                  <div className="bg-black/20 rounded-lg p-2 text-center">
                    <p className="text-xl font-bold text-pink-300">{coletasFIVMae.resumo.mediaEmbrioesProduzidos}</p>
                    <p className="text-xs text-pink-200">Média Emb</p>
                  </div>
                  <div className="bg-black/20 rounded-lg p-2 text-center">
                    <p className="text-xl font-bold text-green-300">{coletasFIVMae.resumo.totalEmbrioesTransferidos}</p>
                    <p className="text-xs text-green-200">Transfer.</p>
                  </div>
                </div>

                {coletasFIVMae.coletas && coletasFIVMae.coletas.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-indigo-700">
                    <p className="text-xs text-indigo-200">
                      Última coleta: {new Date(coletasFIVMae.coletas[0].data_fiv).toLocaleDateString('pt-BR')}
                      {coletasFIVMae.coletas[0].quantidade_oocitos && 
                        ` • ${coletasFIVMae.coletas[0].quantidade_oocitos} oócitos`
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Informações Resumidas */}
          <div className="px-3 pb-20">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="font-bold text-white text-base mb-3">📋 Informações</h3>
              
              <div className="space-y-2 text-sm">
                {animal.nome && (
                  <div className="flex justify-between py-2 border-b border-gray-700">
                    <span className="text-gray-400">Nome</span>
                    <span className="font-semibold text-white">{animal.nome}</span>
                  </div>
                )}
                
                <div className="flex justify-between py-2 border-b border-gray-700">
                  <span className="text-gray-400">Raça</span>
                  <span className="font-semibold text-white">{animal.raca || '-'}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-700">
                  <span className="text-gray-400">Sexo</span>
                  <span className="font-semibold text-white">{animal.sexo || '-'}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-700">
                  <span className="text-gray-400">Idade</span>
                  <span className="font-semibold text-white">{animal.meses || 0} meses</span>
                </div>

                {animal.peso && (
                  <div className="flex justify-between py-2 border-b border-gray-700">
                    <span className="text-gray-400">Peso</span>
                    <span className="font-semibold text-white">{animal.peso} kg</span>
                  </div>
                )}

                {animal.data_nascimento && (
                  <div className="flex justify-between py-2 border-b border-gray-700">
                    <span className="text-gray-400">Nascimento</span>
                    <span className="font-semibold text-white">
                      {new Date(animal.data_nascimento).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}

                {animal.pai && (
                  <div className="flex justify-between py-2 border-b border-gray-700">
                    <span className="text-gray-400">Pai</span>
                    <span className="font-semibold text-white">{animal.pai}</span>
                  </div>
                )}

                {animal.mae && (
                  <div className="flex justify-between py-2 border-b border-gray-700">
                    <span className="text-gray-400">Mãe</span>
                    {((animal.serie_mae && animal.rg_mae) || (maeSerieRg?.serie && maeSerieRg?.rg)) ? (
                      <Link
                        href={`/consulta-animal/${animal.serie_mae || maeSerieRg.serie}-${animal.rg_mae || maeSerieRg.rg}`}
                        className="font-semibold text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        {animal.serie_mae || maeSerieRg.serie} {animal.rg_mae || maeSerieRg.rg}
                      </Link>
                    ) : (
                      <span className="font-semibold text-white">{animal.mae}</span>
                    )}
                  </div>
                )}

                {localizacaoAtual && (
                  <div className="flex justify-between py-2 border-b border-gray-700">
                    <span className="text-gray-400">Localização</span>
                    <span className="font-semibold text-white">{localizacaoValidaParaExibir(localizacaoAtual.piquete) || 'Não informado'}</span>
                  </div>
                )}

                {animal.observacoes && (
                  <div className="py-2">
                    <p className="text-gray-400 text-xs mb-1">Observações</p>
                    <p className="text-white text-sm">{animal.observacoes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modais */}
          <QuickOccurrenceForm
            isOpen={showQuickOccurrence}
            onClose={() => setShowQuickOccurrence(false)}
            animal={animal}
            onSuccess={() => {
              setShowQuickOccurrence(false)
              alert('✅ Ocorrência registrada!')
            }}
          />

          <BatchOccurrenceForm
            isOpen={showBatchOccurrence}
            onClose={() => setShowBatchOccurrence(false)}
            onSuccess={() => {
              setShowBatchOccurrence(false)
              alert('✅ Lançamento em lote realizado!')
            }}
          />
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Beef-Sync | {animal.nome || `${animal.serie}-${animal.rg}` || 'Animal'}</title>
      </Head>
      
      <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className={`sticky top-0 z-30 animal-header-enhanced ${
        animal.sexo && (animal.sexo.toLowerCase().includes('macho') || animal.sexo === 'M')
          ? 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800'
          : 'bg-gradient-to-br from-pink-600 via-purple-700 to-pink-800'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost"
              modern
              onClick={() => router.push('/animals')}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-xl"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              Voltar
            </Button>
            <div>
              <h1 className="animal-name">
                {animal.nome || animal.serie || 'Animal sem nome'}
              </h1>
              <p className="animal-id">
                ID: {animal.id} • {animal.serie}-{animal.rg}
              </p>
              {(() => {
                const isMacho = animal.sexo && (animal.sexo.toLowerCase().includes('macho') || animal.sexo === 'M')
                if (isMacho && Array.isArray(examesAndrologicos) && examesAndrologicos.length > 0) {
                  const ultimoExame = examesAndrologicos[0]
                  const resultado = String(ultimoExame.resultado || ultimoExame.status || '').toUpperCase()
                  const dataEx = ultimoExame.data_exame || ultimoExame.data
                  if (resultado.includes('APTO') || resultado.includes('APROV')) {
                    return (
                      <p 
                        className="mt-1 text-sm font-semibold text-white"
                        title={dataEx ? `Exame em ${new Date(dataEx).toLocaleDateString('pt-BR')}` : 'Exame andrológico'}
                      >
                        Situação Reprodutiva: Apto
                      </p>
                    )
                  }
                  if (resultado.includes('INAPTO') || resultado.includes('REPROV')) {
                    return (
                      <p 
                        className="mt-1 text-sm font-semibold text-white"
                        title={dataEx ? `Exame em ${new Date(dataEx).toLocaleDateString('pt-BR')}` : 'Exame andrológico'}
                      >
                        Situação Reprodutiva: Inapto
                      </p>
                    )
                  }
                }
                const dataCoberturaRef = gestacaoAtual?.data_cobertura || animal.dataTE || animal.data_te || ultimaIA?.data_ia || ultimaIA?.data_inseminacao
                const dataCobertura = dataCoberturaRef ? new Date(dataCoberturaRef) : null
                const statusPrenha = (s) => {
                  if (!s) return false
                  const u = String(s).toUpperCase().trim()
                  return u === 'PRENHA' || u === 'P' || u.includes('PRENHA') || u.includes('POSITIVO')
                }
                const resultadoPrenha = (animal.resultadoDG === 'Prenha' || animal.resultado_dg === 'Prenha' || statusPrenha(animal.resultadoDG) || statusPrenha(animal.resultado_dg)) || (gestacaoAtual?.situacao === 'Em Gestação' || gestacaoAtual?.situacao === 'Ativa') || statusPrenha(ultimaIA?.status_gestacao) || statusPrenha(ultimaIA?.statusGestacao) || statusPrenha(ultimaIA?.resultado_dg) || statusPrenha(ultimaIA?.resultadoDg)
                const resultadoVazia = (() => {
                  const r = (animal.resultadoDG || animal.resultado_dg || '').toString().toLowerCase()
                  return r.includes('não') || r.includes('nao') || r.includes('negativo') || r.includes('vazia') || r === 'negativo' || r === 'vazia'
                })()
                const teveNascimento = gestacaoAtual?.situacao === 'Nascido' || gestacaoAtual?.situacao === 'Parida'
                const estaInseminada = !resultadoPrenha && !resultadoVazia && (ultimaIA?.data_ia || ultimaIA?.data_inseminacao) && !animal.data_dg && !animal.dataDG
                if (resultadoPrenha && dataCobertura) {
                  const previsao = new Date(dataCobertura.getTime() + 285 * 24 * 60 * 60 * 1000)
                  const diasRestantes = Math.max(0, Math.floor((previsao - new Date()) / (1000 * 60 * 60 * 24)))
                  return (
                    <p 
                      className="mt-1 text-sm font-semibold text-white cursor-pointer hover:text-blue-300 transition-colors"
                      onClick={() => setShowReproducaoModal(true)}
                      title={`Previsão de parto: ${previsao.toLocaleDateString('pt-BR')} (${diasRestantes} dias restantes) - Clique para ver detalhes`}
                    >
                      Situação Reprodutiva: Prenha • parto previsto {previsao.toLocaleDateString('pt-BR')} • {diasRestantes} dias
                    </p>
                  )
                }
                if (resultadoPrenha) {
                  // Tentar calcular previsão de parto mesmo sem data de cobertura registrada
                  // Buscar data da IA mais recente
                  const dataIARef = ultimaIA?.data_ia || ultimaIA?.data_inseminacao || animal.dataTE || animal.data_te
                  if (dataIARef) {
                    const dataIA = new Date(dataIARef)
                    const previsaoParto = new Date(dataIA.getTime() + 285 * 24 * 60 * 60 * 1000) // 9 meses = ~285 dias
                    const diasRestantes = Math.max(0, Math.floor((previsaoParto - new Date()) / (1000 * 60 * 60 * 24)))
                    return (
                      <p 
                        className="mt-1 text-sm font-semibold text-white cursor-pointer hover:text-blue-300 transition-colors"
                        onClick={() => setShowReproducaoModal(true)}
                        title={`Previsão de parto: ${previsaoParto.toLocaleDateString('pt-BR')} (${diasRestantes} dias restantes)`}
                      >
                        Situação Reprodutiva: Prenha
                      </p>
                    )
                  }
                  return (
                    <p 
                      className="mt-1 text-sm font-semibold text-white cursor-pointer hover:text-blue-300 transition-colors"
                      onClick={() => setShowReproducaoModal(true)}
                      title="Clique para ver detalhes"
                    >
                      Situação Reprodutiva: Prenha
                    </p>
                  )
                }
                if (teveNascimento) {
                  const data = gestacaoAtual?.data_nascimento || gestacaoAtual?.data_parto || null
                  return (
                    <p 
                      className="mt-1 text-sm font-semibold text-white cursor-pointer hover:text-blue-300 transition-colors"
                      onClick={() => setShowReproducaoModal(true)}
                      title="Clique para ver detalhes"
                    >
                      Situação Reprodutiva: Parida{data ? ` • ${new Date(data).toLocaleDateString('pt-BR')}` : ''}
                    </p>
                  )
                }
                if (estaInseminada) {
                  const dataIA = new Date(ultimaIA.data_ia || ultimaIA.data_inseminacao)
                  const dias = Math.floor((new Date() - dataIA) / (1000 * 60 * 60 * 24))
                  const previsaoParto = new Date(dataIA.getTime() + 285 * 24 * 60 * 60 * 1000)
                  const diasRestantes = Math.max(0, Math.floor((previsaoParto - new Date()) / (1000 * 60 * 60 * 24)))
                  return (
                    <p 
                      className="mt-1 text-sm font-semibold text-white cursor-pointer hover:text-blue-300 transition-colors"
                      onClick={() => setShowReproducaoModal(true)}
                      title={`Previsão de parto: ${previsaoParto.toLocaleDateString('pt-BR')} (${diasRestantes} dias restantes) - IA em ${dataIA.toLocaleDateString('pt-BR')} • Clique para ver detalhes`}
                    >
                      Situação Reprodutiva: Inseminada • aguardando DG ({dias} dias)
                    </p>
                  )
                }
                if (resultadoVazia) {
                  return (
                    <p 
                      className="mt-1 text-sm font-semibold text-white cursor-pointer hover:text-blue-300 transition-colors"
                      onClick={() => setShowReproducaoModal(true)}
                      title="Clique para ver detalhes"
                    >
                      Situação Reprodutiva: Vazia
                    </p>
                  )
                }
                const idadeMeses = animal.meses !== undefined ? parseInt(animal.meses) : (animal.data_nascimento ? Math.floor((new Date() - new Date(animal.data_nascimento)) / (1000 * 60 * 60 * 24 * 30.44)) : null)
                if (idadeMeses && idadeMeses >= 15 && animal.sexo?.startsWith('F')) {
                  return (
                    <p className="mt-1 text-sm font-semibold text-white">
                      Situação Reprodutiva: Apta para reprodução
                    </p>
                  )
                }
                // Machos com exame andrológico - considerar apenas exames já realizados (data <= hoje)
                const isMachoHeader = animal.sexo && (animal.sexo.toLowerCase().startsWith('m') || animal.sexo === 'M' || animal.sexo.toLowerCase().includes('macho'))
                const hojeHeader = new Date()
                hojeHeader.setHours(23, 59, 59, 999)
                const examesRealizadosHeader = examesAndrologicos && examesAndrologicos.filter(ex => {
                  const dataEx = ex.data_exame || ex.data
                  return dataEx && new Date(dataEx) <= hojeHeader
                }) || []
                if (isMachoHeader && examesRealizadosHeader.length > 0) {
                  const ultimoEx = examesRealizadosHeader[0]
                  const res = (ultimoEx.resultado || '').trim()
                  if (res === 'Apto') return <p className="mt-1 text-sm font-semibold text-white">Situação Reprodutiva: Apto conforme exame andrológico</p>
                  if (res === 'Inapto') return <p className="mt-1 text-sm font-semibold text-white">Situação Reprodutiva: Inapto conforme exame andrológico</p>
                  if (res === 'Pendente') return <p className="mt-1 text-sm font-semibold text-white">Situação Reprodutiva: Aguardando exame andrológico</p>
                }
                return null
              })()}
            </div>
          </div>
          {allAnimalsIds.length > 0 && currentAnimalIndex >= 0 && (
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 bg-white/10">
                <span className="text-sm font-semibold">
                  Status:
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  animal.situacao === 'Ativo' ? 'bg-green-500/20 text-green-100 border border-green-300/30' :
                  animal.situacao === 'Vendido' ? 'bg-blue-500/20 text-blue-100 border border-blue-300/30' :
                  animal.situacao === 'Morto' ? 'bg-red-500/20 text-red-100 border border-red-300/30' :
                  'bg-gray-500/20 text-gray-100 border border-gray-300/30'
                }`}>
                  {animal.situacao || 'ATIVO'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">
                  {currentAnimalIndex + 1} de {allAnimalsIds.length}
                </span>
                <div className="flex items-center gap-1 p-1 rounded-xl bg-white/10">
                  <button
                    onClick={() => router.push(`/animals/${allAnimalsIds[0]}`)}
                    disabled={currentAnimalIndex === 0}
                    className="p-2 rounded-lg hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="Primeiro animal"
                  >
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => router.push(`/animals/${allAnimalsIds[currentAnimalIndex - 1]}`)}
                    disabled={currentAnimalIndex === 0}
                    className="p-2 rounded-lg hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="Animal anterior"
                  >
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => router.push(`/animals/${allAnimalsIds[currentAnimalIndex + 1]}`)}
                    disabled={currentAnimalIndex === allAnimalsIds.length - 1}
                    className="p-2 rounded-lg hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="Próximo animal"
                  >
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => router.push(`/animals/${allAnimalsIds[allAnimalsIds.length - 1]}`)}
                    disabled={currentAnimalIndex === allAnimalsIds.length - 1}
                    className="p-2 rounded-lg hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="Último animal"
                  >
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Botões de ação - ocultos no celular (modo consulta) */}
      <div className="hidden md:flex flex-wrap items-center gap-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="primary"
            modern
            glow
            onClick={() => setShowQuickOccurrence(true)}
            className="flex items-center gap-2"
          >
            <PlusCircleIcon className="h-4 w-4" />
            Lançar Ocorrência
          </Button>
          <Button 
            variant="primary"
            modern
            glow
            onClick={() => setShowBatchOccurrence(true)}
            className="flex items-center gap-2"
          >
            <PlusCircleIcon className="h-4 w-4" />
            Lançamento em Lote
          </Button>
        </div>
        <div className="h-8 w-px bg-gray-200 dark:bg-gray-600 hidden sm:block" />
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="danger"
            modern
            onClick={handleGeneratePDF}
            disabled={generatingPDF}
            className="flex items-center gap-2"
          >
            <DocumentArrowDownIcon className="h-4 w-4" />
            {generatingPDF ? 'Gerando PDF...' : 'Gerar PDF'}
          </Button>
          <Button 
            variant="outline"
            modern
            onClick={handleEdit}
            className="flex items-center gap-2"
          >
            <PencilIcon className="h-4 w-4" />
            Editar
          </Button>
        </div>
        
        {/* Botão Marcar como Inativo */}
        {animal.situacao !== 'Inativo' && (
          <Button 
            variant="warning"
            modern
            onClick={async () => {
              if (!confirm('Deseja marcar este animal como INATIVO?')) return
              
              try {
                const response = await fetch(`/api/animals/${id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ situacao: 'Inativo' })
                })
                
                if (response.ok) {
                  alert('✅ Animal marcado como INATIVO')
                  loadAnimal()
                } else {
                  alert('❌ Erro ao atualizar animal')
                }
              } catch (error) {
                console.error('Erro:', error)
                alert('❌ Erro ao atualizar animal')
              }
            }}
            className="flex items-center gap-2"
          >
            <XMarkIcon className="h-4 w-4" />
            Marcar como Inativo
          </Button>
        )}

        {/* Botão Reativar Animal */}
        {animal.situacao === 'Inativo' && (
          <Button 
            variant="success"
            modern
            onClick={async () => {
              if (!confirm('Deseja REATIVAR este animal?')) return
              
              try {
                const response = await fetch(`/api/animals/${id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ situacao: 'Ativo' })
                })
                
                if (response.ok) {
                  alert('✅ Animal REATIVADO com sucesso!')
                  loadAnimal()
                } else {
                  alert('❌ Erro ao reativar animal')
                }
              } catch (error) {
                console.error('Erro:', error)
                alert('❌ Erro ao reativar animal')
              }
            }}
            className="flex items-center gap-2"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Reativar Animal
          </Button>
        )}
        <div className="h-8 w-px bg-gray-200 dark:bg-gray-600 hidden sm:block" />
        <Button 
          variant="danger"
          modern
          onClick={handleDelete}
          className="flex items-center gap-2"
        >
          <TrashIcon className="h-4 w-4" />
          Excluir
        </Button>
      </div>

      {/* Speed Dial - Ações Rápidas (oculto no celular - modo consulta) */}
      <div className="hidden md:block fixed bottom-6 right-6 z-50">
        {/* Items */}
        {fabOpen && (
          <div className="flex flex-col items-end gap-3 mb-3 animate-slide-in-left">
            <button
              onClick={() => { setShowQuickOccurrence(true); setFabOpen(false) }}
              title="Lançar Ocorrência (O)"
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 text-white shadow-lg hover:shadow-2xl hover:bg-indigo-500 transition-all"
            >
              <PlusCircleIcon className="h-5 w-5" />
              <span className="text-sm font-semibold">Ocorrência</span>
            </button>
            <button
              onClick={() => { handleGeneratePDF(); setFabOpen(false) }}
              title="Gerar PDF (P)"
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-pink-600 text-white shadow-lg hover:shadow-2xl hover:bg-pink-500 transition-all"
            >
              <DocumentArrowDownIcon className="h-5 w-5" />
              <span className="text-sm font-semibold">PDF</span>
            </button>
            <button
              onClick={() => { handleEdit(); setFabOpen(false) }}
              title="Editar (E)"
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-600 text-white shadow-lg hover:shadow-2xl hover:bg-blue-500 transition-all"
            >
              <PencilIcon className="h-5 w-5" />
              <span className="text-sm font-semibold">Editar</span>
            </button>
            <button
              onClick={() => { handleDelete(); setFabOpen(false) }}
              title="Excluir (Del)"
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-600 text-white shadow-lg hover:shadow-2xl hover:bg-red-500 transition-all"
            >
              <TrashIcon className="h-5 w-5" />
              <span className="text-sm font-semibold">Excluir</span>
            </button>
          </div>
        )}
        {/* Main FAB */}
        <button
          onClick={() => setFabOpen(prev => !prev)}
          aria-label="Ações rápidas"
          className={`relative p-4 rounded-full shadow-2xl transition-all ${
            fabOpen ? 'bg-purple-700 hover:bg-purple-600' : 'bg-gradient-to-tr from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'
          } text-white`}
          title="Ações rápidas"
        >
          <SparklesIcon className={`h-6 w-6 transition-transform ${fabOpen ? 'rotate-45' : ''}`} />
        </button>
      </div>

      {/* Estatísticas rápidas - apenas Custos e Valor Venda (Idade e Peso estão em Informações) */}
      <div className="stats-grid stats-grid-compact">
        <div className="stat-card stat-card-compact">
          <div className="stat-value stat-value-compact">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((custos || []).reduce((s, c) => s + parseFloat(c.valor || 0), 0))}</div>
          <div className="stat-label">Custos</div>
        </div>
        <div className="stat-card stat-card-compact">
          <div className="stat-value stat-value-compact">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(animal?.valor_venda || animal?.valorVenda || 0)}</div>
          <div className="stat-label">Valor Venda</div>
        </div>
      </div>

      {/* Informações Gerais Unificadas */}
      <Card className="shadow-lg border-gray-200/50 dark:border-gray-700/50 overflow-hidden transition-all duration-300">
        <div 
          className="group flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 px-6 py-4 border-b border-gray-200 dark:border-gray-700 transition-colors"
          onClick={() => toggleCard('info')}
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
              <UserIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            Informações do Animal
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); handleEdit() }}
              className="p-2 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 opacity-70 hover:opacity-100 transition-opacity"
              title="Editar animal"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            {cardsExpanded.info ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            )}
          </div>
        </div>
        {cardsExpanded.info && (
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {/* Doadora Badge/Card - Full Width */}
            {(animal.is_doadora || (animal.fivs && animal.fivs.length > 0)) && (
              <div className="col-span-full mb-2">
                <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-700 rounded-lg p-3 flex items-center gap-3">
                  <div className="p-1.5 bg-pink-100 dark:bg-pink-800 rounded-full">
                    <BeakerIcon className="h-5 w-5 text-pink-600 dark:text-pink-300" />
                  </div>
                  <div>
                    <h3 className="text-md font-bold text-pink-800 dark:text-pink-200">
                      Animal Doadora
                    </h3>
                    <p className="text-xs text-pink-600 dark:text-pink-300">
                      Possui histórico de coletas de oócitos (FIV).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Linha 1: Identificação Principal */}
            {animal.nome && (
              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                  Nome
                </label>
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate" title={animal.nome}>
                  {animal.nome}
                </p>
              </div>
            )}
            
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                Série
              </label>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{animal.serie || '-'}</p>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                RG
              </label>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{animal.rg || '-'}</p>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                Sexo
              </label>
              <span className={`inline-flex px-2.5 py-1 rounded-lg text-sm font-semibold ${
                animal.sexo && (animal.sexo.toLowerCase().startsWith('m') || animal.sexo === 'M' || animal.sexo.toLowerCase().includes('macho'))
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 border border-blue-200 dark:border-blue-700'
                  : animal.sexo && (animal.sexo.toLowerCase().startsWith('f') || animal.sexo === 'F' || animal.sexo.toLowerCase().includes('fêmea') || animal.sexo.toLowerCase().includes('femea'))
                    ? 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-200 border border-pink-200 dark:border-pink-700'
                    : 'text-gray-700 dark:text-gray-300'
              }`}>
                {animal.sexo || '-'}
              </span>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                Raça
              </label>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{animal.raca || '-'}</p>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                Cor
              </label>
              {editingField === 'cor' ? (
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="text-sm border rounded px-2 py-1 w-full dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Ex: Vermelho, Branco"
                    autoFocus
                  />
                  <button onClick={() => salvarCampoRapido('cor', editValue)} disabled={savingField === 'cor'} className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 disabled:opacity-50">
                    {savingField === 'cor' ? '...' : 'OK'}
                  </button>
                  <button onClick={() => { setEditingField(null); setEditValue('') }} className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600">✕</button>
                </div>
              ) : (
                <p 
                  className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1 -mx-1 border border-dashed border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-all" 
                  onClick={() => { setEditingField('cor'); setEditValue(animal.cor || '') }}
                  title="Clique para editar"
                >
                  {animal.cor ? (
                    <span>{animal.cor} <span className="text-xs text-gray-400">✎</span></span>
                  ) : (
                    <span className="text-gray-400 italic">Clique para adicionar</span>
                  )}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                Situação
              </label>
              {animal.situacao === 'Morto' ? (
                <button
                  onClick={() => setShowMorteModal(true)}
                  className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full cursor-pointer hover:opacity-80 transition-opacity bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                  title="Ver detalhes da morte"
                >
                  {animal.situacao} 🔍
                </button>
              ) : animal.situacao === 'Vendido' ? (
                <div className="relative inline-block">
                  <span 
                    className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full cursor-help bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300"
                    onMouseEnter={() => {
                      console.log('🖱️ Mouse entrou no badge Vendido')
                      console.log('infoVenda atual:', infoVenda)
                      console.log('loadingVenda:', loadingVenda)
                      if (!infoVenda && !loadingVenda) {
                        console.log('⚡ Chamando carregarInfoVenda()')
                        carregarInfoVenda()
                      }
                      setShowTooltipVenda(true)
                    }}
                    onMouseLeave={() => {
                      console.log('🖱️ Mouse saiu do badge Vendido')
                      setShowTooltipVenda(false)
                    }}
                  >
                    {animal.situacao} 💰
                  </span>
                  {showTooltipVenda && (
                    <div className="absolute left-0 top-full mt-2 z-50 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border-2 border-orange-200 dark:border-orange-700 p-4">
                      {loadingVenda ? (
                        <div className="text-center py-3">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mx-auto mb-2"></div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Carregando dados da venda...</p>
                        </div>
                      ) : infoVenda ? (
                        <div className="space-y-3">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white border-b pb-2">
                            📋 Dados da Venda
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">NF:</span>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {infoVenda.nfNumero || 'Não informado'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Data:</span>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {infoVenda.dataVenda ? new Date(infoVenda.dataVenda).toLocaleDateString('pt-BR') : 'Não informado'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Destino:</span>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {infoVenda.destino || 'Não informado'}
                              </span>
                            </div>
                            {infoVenda.peso && (
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Peso:</span>
                                <span className="font-semibold text-gray-900 dark:text-white">{infoVenda.peso} kg</span>
                              </div>
                            )}
                          </div>
                          <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 dark:text-gray-400">Valor Venda:</span>
                              <span className="font-bold text-green-600 dark:text-green-400 text-base">
                                {infoVenda.valorVenda ? formatCurrency(infoVenda.valorVenda) : 'R$ 0,00'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 dark:text-gray-400">Custos Totais:</span>
                              <span className="font-bold text-red-600 dark:text-red-400 text-base">
                                {infoVenda.custosTotal ? formatCurrency(infoVenda.custosTotal) : 'R$ 0,00'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                              <span className="font-semibold text-gray-700 dark:text-gray-300">Lucro:</span>
                              <span className={`font-bold text-base ${
                                ((infoVenda.valorVenda || 0) - (infoVenda.custosTotal || 0)) >= 0 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : 'text-red-600 dark:text-red-400'
                              }`}>
                                {formatCurrency((infoVenda.valorVenda || 0) - (infoVenda.custosTotal || 0))}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-3">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            ⚠️ Dados de venda não encontrados
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Verifique se a NF de saída foi cadastrada
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {animal.situacao || '-'}
                </span>
              )}
            </div>

            {/* Linha 2: Dados Físicos e Nascimento */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                Nascimento
              </label>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {formatDate(animal.data_nascimento)}
              </p>
            </div>

            {/* Idade em meses */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                Idade
              </label>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {(() => {
                  if (!animal.data_nascimento) return '-'
                  const nascimento = new Date(animal.data_nascimento)
                  const hoje = new Date()
                  const diffTime = Math.abs(hoje - nascimento)
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                  const meses = Math.floor(diffDays / 30)
                  const anos = Math.floor(meses / 12)
                  const mesesRestantes = meses % 12
                  
                  if (anos > 0) {
                    return mesesRestantes > 0 
                      ? `${anos} ${anos === 1 ? 'ano' : 'anos'} e ${mesesRestantes} ${mesesRestantes === 1 ? 'mês' : 'meses'}`
                      : `${anos} ${anos === 1 ? 'ano' : 'anos'}`
                  }
                  return `${meses} ${meses === 1 ? 'mês' : 'meses'}`
                })()}
              </p>
            </div>

            {/* Peso e CE (para machos) - com data embaixo */}
            {(() => {
              const isMacho = animal.sexo && (
                animal.sexo.toLowerCase().startsWith('m') || 
                animal.sexo === 'M' || 
                animal.sexo.toLowerCase().includes('macho')
              )
              const ultimoExame = isMacho && examesAndrologicos?.[0]
              const dataExibicao = dataUltimaPesagem || (ultimoExame?.data_exame || ultimoExame?.data) || animal.updated_at
              return (
                <div className="col-span-2 flex flex-wrap gap-x-6 gap-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Peso</label>
                    {editingField === 'peso' ? (
                      <div className="flex gap-1 items-center">
                        <input
                          type="number"
                          step="0.1"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="text-sm border rounded px-2 py-1 w-20 dark:bg-gray-700 dark:border-gray-600"
                          placeholder="kg"
                          autoFocus
                        />
                        <button onClick={() => salvarCampoRapido('peso', editValue)} disabled={savingField === 'peso'} className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 disabled:opacity-50">
                          {savingField === 'peso' ? '...' : 'OK'}
                        </button>
                        <button onClick={() => { setEditingField(null); setEditValue('') }} className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600">✕</button>
                      </div>
                    ) : (
                      <p 
                        className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded px-2 py-1 -mx-1 border border-dashed border-transparent hover:border-indigo-300 dark:hover:border-indigo-600 transition-all" 
                        onClick={() => { const v = animal.peso ?? ultimaPesagem?.peso; setEditingField('peso'); setEditValue(v != null ? String(v) : '') }}
                        title="Clique para editar"
                      >
                        {(animal.peso ?? ultimaPesagem?.peso) != null ? (
                          <span>{animal.peso ?? ultimaPesagem?.peso} kg {ultimaPesagem?.peso && !animal.peso ? <span className="text-xs text-emerald-600 dark:text-emerald-400">(pesagem)</span> : <span className="text-xs text-gray-400">✎</span>}</span>
                        ) : (
                          <span className="text-gray-400 italic">Clique para adicionar</span>
                        )}
                      </p>
                    )}
                  </div>
                  {isMacho && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">CE</label>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {(ultimoExame?.ce ?? ultimaPesagem?.ce) != null ? `${ultimoExame?.ce ?? ultimaPesagem?.ce} cm` : <span className="text-gray-400 italic">-</span>}
                      </p>
                    </div>
                  )}
                  {dataExibicao && (
                    <div className="w-full">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Data</label>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(dataExibicao)}</p>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Último serviço - sempre exibido, clicável para ver mais */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                Último serviço
              </label>
              {ultimoEvento ? (
                <button
                  type="button"
                  onClick={() => setShowUltimoEventoModal(true)}
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors text-left"
                  title="Clique para ver detalhes e histórico"
                >
                  {ultimoEvento.labelExibicao} →
                </button>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  Nenhum serviço registrado
                  {animal.updated_at && (
                    <span className="block text-xs mt-0.5">Cadastro atualizado em {formatDate(animal.updated_at)}</span>
                  )}
                </p>
              )}
            </div>

            <div className="col-span-2 md:col-span-2 lg:col-span-2">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5 flex items-center gap-1">
                <MapPinIcon className="h-3 w-3" /> Localização
              </label>
              {localizacaoAtual ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {localizacaoValidaParaExibir(localizacaoAtual.piquete) || 'Não informado'}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); router.push('/movimentacao/localizacao') }} 
                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    Alterar →
                  </button>
                </div>
              ) : (
                <button 
                  onClick={(e) => { e.stopPropagation(); router.push('/movimentacao/localizacao') }} 
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium px-2 py-1 rounded border border-dashed border-blue-300 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                >
                  + Registrar Localização
                </button>
              )}
            </div>
            <div className="col-span-2 md:col-span-2 lg:col-span-2">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                Observações
              </label>
              {editingField === 'observacoes' ? (
                <div className="flex gap-1 flex-col">
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="text-sm border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 w-full min-h-[60px]"
                    placeholder="Observações do animal..."
                    autoFocus
                    rows={3}
                  />
                  <div className="flex gap-1">
                    <button onClick={() => salvarCampoRapido('observacoes', editValue)} disabled={savingField === 'observacoes'} className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 disabled:opacity-50">
                      {savingField === 'observacoes' ? '...' : 'Salvar'}
                    </button>
                    <button onClick={() => { setEditingField(null); setEditValue('') }} className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600">Cancelar</button>
                  </div>
                </div>
              ) : (
                <p 
                  className="text-sm text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-1 -mx-1 min-h-[1.5rem]" 
                  onClick={() => { setEditingField('observacoes'); setEditValue(animal.observacoes || '') }}
                  title="Clique para editar"
                >
                  {animal.observacoes ? (
                    <span className="whitespace-pre-wrap">{animal.observacoes}</span>
                  ) : (
                    <span className="text-gray-400 italic">Nenhuma observação</span>
                  )}{' '}
                  <span className="text-xs text-gray-400">✎</span>
                </p>
              )}
            </div>
            <div className="col-span-2 md:col-span-2 lg:col-span-2 flex items-end gap-2">
              <button
                type="button"
                className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 whitespace-nowrap"
              >
                Situação ABCZ
              </button>
              {editingField === 'situacao_abcz' ? (
                <div className="flex-1 flex gap-1 items-center">
                  <input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 text-sm border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Ex: Ok para RGN"
                    autoFocus
                  />
                  <button onClick={() => salvarCampoRapido('situacao_abcz', editValue)} disabled={savingField === 'situacao_abcz'} className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 disabled:opacity-50">
                    {savingField === 'situacao_abcz' ? '...' : 'Salvar'}
                  </button>
                  <button onClick={() => { setEditingField(null); setEditValue('') }} className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600">Cancelar</button>
                </div>
              ) : (
                <input
                  readOnly
                  value={animal.situacao_abcz || animal.situacaoAbcz || ''}
                  onClick={() => { setEditingField('situacao_abcz'); setEditValue(animal.situacao_abcz || animal.situacaoAbcz || '') }}
                  className="flex-1 text-sm border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 min-w-0"
                  placeholder="Clique para editar"
                />
              )}
            </div>
            <div className="col-span-2 md:col-span-2 lg:col-span-2">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                Situação Reprodutiva
              </label>
              {(() => {
                const dataCoberturaRef = gestacaoAtual?.data_cobertura || animal.dataTE || animal.data_te || ultimaIA?.data_ia || ultimaIA?.data_inseminacao
                const dataCobertura = dataCoberturaRef ? new Date(dataCoberturaRef) : null
                const statusPrenha = (s) => {
                  if (!s) return false
                  const u = String(s).toUpperCase().trim()
                  return u === 'PRENHA' || u === 'P' || u.includes('PRENHA') || u.includes('POSITIVO')
                }
                const resultadoPrenha = (animal.resultadoDG === 'Prenha' || animal.resultado_dg === 'Prenha' || statusPrenha(animal.resultadoDG) || statusPrenha(animal.resultado_dg)) || (gestacaoAtual?.situacao === 'Em Gestação' || gestacaoAtual?.situacao === 'Ativa') || statusPrenha(ultimaIA?.status_gestacao) || statusPrenha(ultimaIA?.statusGestacao) || statusPrenha(ultimaIA?.resultado_dg) || statusPrenha(ultimaIA?.resultadoDg)
                const resultadoVazia = (() => {
                  const r = (animal.resultadoDG || animal.resultado_dg || '').toString().toLowerCase()
                  return r.includes('não') || r.includes('nao') || r.includes('negativo') || r.includes('vazia') || r === 'negativo' || r === 'vazia'
                })()
                const teveNascimento = gestacaoAtual?.situacao === 'Nascido' || gestacaoAtual?.situacao === 'Parida'
                const estaInseminada = !resultadoPrenha && !resultadoVazia && ultimaIA?.data_inseminacao && !animal.data_dg && !animal.dataDG
                const touroNome = ultimaIA?.touro_nome || ultimaIA?.touro || gestacaoAtual?.touro_nome || animal.touro || 'Não informado'
                const tipoCobertura = ultimaIA?.tipo || gestacaoAtual?.tipo_cobertura || (animal.dataTE || animal.data_te ? 'TE' : 'IA')
                if (resultadoPrenha && dataCobertura) {
                  const previsao = new Date(dataCobertura.getTime() + 285 * 24 * 60 * 60 * 1000)
                  const diasRestantes = Math.max(0, Math.floor((previsao - new Date()) / (1000 * 60 * 60 * 24)))
                  return (
                    <div className="relative inline-block group">
                      <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                        Prenha • parto previsto {previsao.toLocaleDateString('pt-BR')} • {diasRestantes} dias
                      </p>
                      <div className="absolute left-0 mt-1 w-72 hidden group-hover:block bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md p-3 shadow-lg z-20">
                        <p className="text-xs text-gray-500 dark:text-gray-400">🤰 Detalhes Reprodutivos</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">🐂 Touro: {touroNome}</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">🧬 Tipo: {tipoCobertura}</p>
                        {dataCobertura && (
                          <p className="text-sm text-gray-700 dark:text-gray-300">📅 Data {tipoCobertura}: {dataCobertura.toLocaleDateString('pt-BR')}</p>
                        )}
                        <p className="text-sm text-gray-700 dark:text-gray-300">🗓️ Previsão de parto: {previsao.toLocaleDateString('pt-BR')} ({diasRestantes} dias)</p>
                      </div>
                    </div>
                  )
                }
                if (resultadoPrenha) {
                  const dataIARef = ultimaIA?.data_ia || ultimaIA?.data_inseminacao || animal.dataTE || animal.data_te
                  const previsaoAlt = dataIARef ? new Date(new Date(dataIARef).getTime() + 285 * 24 * 60 * 60 * 1000) : null
                  const diasRestantesAlt = previsaoAlt ? Math.max(0, Math.floor((previsaoAlt - new Date()) / (1000 * 60 * 60 * 24))) : null
                  return (
                    <div className="relative inline-block group">
                      <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                        {previsaoAlt ? (
                          <>Prenha • parto previsto {previsaoAlt.toLocaleDateString('pt-BR')} • {diasRestantesAlt} dias</>
                        ) : (
                          <>Prenha</>
                        )}
                      </p>
                      <div className="absolute left-0 mt-1 w-72 hidden group-hover:block bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md p-3 shadow-lg z-20">
                        <p className="text-xs text-gray-500 dark:text-gray-400">🤰 Detalhes Reprodutivos</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">🐂 Touro: {touroNome}</p>
                        {dataCobertura && (
                          <p className="text-sm text-gray-700 dark:text-gray-300">📅 Data {tipoCobertura}: {dataCobertura.toLocaleDateString('pt-BR')}</p>
                        )}
                        {!dataCobertura && previsaoAlt && (
                          <p className="text-sm text-gray-700 dark:text-gray-300">🗓️ Previsão de parto: {previsaoAlt.toLocaleDateString('pt-BR')} ({diasRestantesAlt} dias)</p>
                        )}
                        {!dataCobertura && !previsaoAlt && (
                          <p className="text-sm text-gray-700 dark:text-gray-300">🗓️ Previsão de parto: Não informado</p>
                        )}
                      </div>
                    </div>
                  )
                }
                if (teveNascimento) {
                  const data = gestacaoAtual?.data_nascimento || gestacaoAtual?.data_parto || null
                  return (
                    <div className="relative inline-block group">
                      <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                        Parida{data ? ` • ${new Date(data).toLocaleDateString('pt-BR')}` : ''}
                      </p>
                      <div className="absolute left-0 mt-1 w-72 hidden group-hover:block bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md p-3 shadow-lg z-20">
                        <p className="text-xs text-gray-500 dark:text-gray-400">👶 Detalhes do Parto</p>
                        {touroNome && (
                          <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">🐂 Touro: {touroNome}</p>
                        )}
                        {data && (
                          <p className="text-sm text-gray-700 dark:text-gray-300">📅 Data do parto: {new Date(data).toLocaleDateString('pt-BR')}</p>
                        )}
                      </div>
                    </div>
                  )
                }
                if (estaInseminada) {
                  const dataIA = new Date(ultimaIA.data_ia || ultimaIA.data_inseminacao)
                  const dias = Math.floor((new Date() - dataIA) / (1000 * 60 * 60 * 24))
                  const previsaoParto = new Date(dataIA.getTime() + 285 * 24 * 60 * 60 * 1000)
                  const diasRestantes = Math.max(0, Math.floor((previsaoParto - new Date()) / (1000 * 60 * 60 * 24)))
                  return (
                    <div className="relative inline-block group">
                      <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
                        Inseminada • aguardando DG ({dias} dias)
                      </p>
                      <div className="absolute left-0 mt-1 w-72 hidden group-hover:block bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md p-3 shadow-lg z-20">
                        <p className="text-xs text-gray-500 dark:text-gray-400">💉 Detalhes da IA</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">🐂 Touro: {touroNome}</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">📅 Data IA: {dataIA.toLocaleDateString('pt-BR')}</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">⏱️ Dias desde IA: {dias}</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">🗓️ Previsão de parto: {previsaoParto.toLocaleDateString('pt-BR')} ({diasRestantes} dias)</p>
                      </div>
                    </div>
                  )
                }
                if (resultadoVazia) {
                  return (
                    <div className="relative inline-block group">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Vazia
                      </p>
                      <div className="absolute left-0 mt-1 w-64 hidden group-hover:block bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md p-3 shadow-lg z-20">
                        <p className="text-xs text-gray-500 dark:text-gray-400">ℹ️ Sem gestação ativa</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">📅 Última cobertura: {dataCobertura ? dataCobertura.toLocaleDateString('pt-BR') : 'Não informada'}</p>
                      </div>
                    </div>
                  )
                }
                const idadeMeses = animal.meses !== undefined ? parseInt(animal.meses) : (animal.data_nascimento ? Math.floor((new Date() - new Date(animal.data_nascimento)) / (1000 * 60 * 60 * 24 * 30.44)) : null)
                if (idadeMeses && idadeMeses >= 15 && animal.sexo?.startsWith('F')) {
                  return (
                    <div className="relative inline-block group">
                      <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                        Apta para reprodução
                      </p>
                      <div className="absolute left-0 mt-1 w-64 hidden group-hover:block bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md p-3 shadow-lg z-20">
                        <p className="text-xs text-gray-500 dark:text-gray-400">ℹ️ Informação</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">⏳ Idade: {idadeMeses} meses</p>
                      </div>
                    </div>
                  )
                }
                // Machos com exame andrológico (Reprodução > Exames Andrológicos)
                // Considerar apenas exames já realizados (data <= hoje) - exames futuros não definem situação
                const isMacho = animal.sexo && (animal.sexo.toLowerCase().startsWith('m') || animal.sexo === 'M' || animal.sexo.toLowerCase().includes('macho'))
                const hoje = new Date()
                hoje.setHours(23, 59, 59, 999)
                const examesRealizados = examesAndrologicos && examesAndrologicos.filter(ex => {
                  const dataEx = ex.data_exame || ex.data
                  return dataEx && new Date(dataEx) <= hoje
                }) || []
                if (isMacho && examesRealizados.length > 0) {
                  const ultimoExame = examesRealizados[0]
                  const resultadoExame = (ultimoExame.resultado || '').trim()
                  if (resultadoExame === 'Apto') {
                    return (
                      <div className="relative inline-block group">
                        <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                          Apto conforme exame andrológico
                        </p>
                        <div className="absolute left-0 mt-1 w-72 hidden group-hover:block bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md p-3 shadow-lg z-20">
                          <p className="text-xs text-gray-500 dark:text-gray-400">🩺 Exame Andrológico</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">📅 Data: {formatDate(ultimoExame.data_exame || ultimoExame.data)}</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">✅ Resultado: Apto</p>
                        </div>
                      </div>
                    )
                  }
                  if (resultadoExame === 'Inapto') {
                    return (
                      <div className="relative inline-block group">
                        <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                          Inapto conforme exame andrológico
                        </p>
                        <div className="absolute left-0 mt-1 w-72 hidden group-hover:block bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md p-3 shadow-lg z-20">
                          <p className="text-xs text-gray-500 dark:text-gray-400">🩺 Exame Andrológico</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">📅 Data: {formatDate(ultimoExame.data_exame || ultimoExame.data)}</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">❌ Resultado: Inapto</p>
                        </div>
                      </div>
                    )
                  }
                  if (resultadoExame === 'Pendente') {
                    return (
                      <div className="relative inline-block group">
                        <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
                          Aguardando resultado do exame andrológico
                        </p>
                        <div className="absolute left-0 mt-1 w-72 hidden group-hover:block bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md p-3 shadow-lg z-20">
                          <p className="text-xs text-gray-500 dark:text-gray-400">🩺 Exame Andrológico</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">📅 Data: {formatDate(ultimoExame.data_exame || ultimoExame.data)}</p>
                        </div>
                      </div>
                    )
                  }
                }
                return (
                  <div className="relative inline-block group">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Não informado
                    </p>
                    <div className="absolute left-0 mt-1 w-64 hidden group-hover:block bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md p-3 shadow-lg z-20">
                      <p className="text-xs text-gray-500 dark:text-gray-400">ℹ️ Sem dados reprodutivos</p>
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Informações específicas por tipo de animal */}
            {animal.raca && (animal.raca.toLowerCase().includes('mestiça') || animal.raca.toLowerCase().includes('mestica') || animal.raca.toLowerCase().includes('receptora')) ? (
              <>
                {/* Separador Informações de Receptora - MELHORADO */}
                <div className="col-span-full border-t-4 border-pink-400 dark:border-pink-600 my-2 pt-3 bg-gradient-to-r from-pink-50 via-purple-50 to-indigo-50 dark:from-pink-900/20 dark:via-purple-900/20 dark:to-indigo-900/20 -mx-4 px-4 py-3 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-pink-700 dark:text-pink-300 uppercase tracking-wider flex items-center gap-2">
                      🤰 Informações de Receptora
                    </span>
                    <span className="text-xs bg-pink-200 dark:bg-pink-800 text-pink-800 dark:text-pink-200 px-3 py-1 rounded-full font-semibold">
                      Raça: {animal.raca}
                    </span>
                  </div>
                </div>

                {/* Grid de Informações - 3 colunas */}
                <div className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* NF de Origem */}
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <svg className="h-5 w-5 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                          NF de Origem
                        </label>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {animal.nf_numero || animal.nfNumero || animal.origem ? (
                            <button
                              onClick={() => router.push(`/notas-fiscais?busca=${encodeURIComponent(animal.nf_numero || animal.nfNumero || animal.origem)}`)}
                              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                            >
                              {animal.nf_numero || animal.nfNumero || animal.origem}
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </button>
                          ) : '-'}
                        </p>
                      </div>
                    </div>
                    {animal.fornecedor && (
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400">Fornecedor:</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate" title={animal.fornecedor}>
                          {animal.fornecedor}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Data de Chegada */}
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 p-4 rounded-xl border-2 border-blue-200 dark:border-blue-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-200 dark:bg-blue-800 rounded-lg">
                        <svg className="h-5 w-5 text-blue-700 dark:text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase">
                          📅 Data de Chegada
                        </label>
                        <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                          {animal.dataChegada || animal.data_chegada 
                            ? formatDate(animal.dataChegada || animal.data_chegada)
                            : 'Não informado'}
                        </p>
                      </div>
                    </div>
                    {(animal.dataChegada || animal.data_chegada) && (
                      <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                        <p className="text-xs text-blue-700 dark:text-blue-300 font-semibold">
                          ⏱️ Há {Math.floor((new Date() - new Date(animal.dataChegada || animal.data_chegada)) / (24 * 60 * 60 * 1000))} dias na fazenda
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Data da TE */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 p-4 rounded-xl border-2 border-purple-200 dark:border-purple-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-purple-200 dark:bg-purple-800 rounded-lg">
                        <svg className="h-5 w-5 text-purple-700 dark:text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase">
                          💉 Data da TE
                        </label>
                        <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                          {animal.dataTE || animal.data_te 
                            ? formatDate(animal.dataTE || animal.data_te)
                            : 'Não realizada'}
                        </p>
                      </div>
                    </div>
                    {(animal.dataTE || animal.data_te) && (
                      <div className="mt-2 pt-2 border-t border-purple-200 dark:border-purple-700">
                        <p className="text-xs text-purple-700 dark:text-purple-300 font-semibold">
                          ⏱️ Há {Math.floor((new Date() - new Date(animal.dataTE || animal.data_te)) / (24 * 60 * 60 * 1000))} dias
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Data do DG - Clicável para editar */}
                  <div 
                    className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 p-4 rounded-xl border-2 border-green-200 dark:border-green-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:ring-2 hover:ring-green-400 dark:hover:ring-green-500"
                    onClick={() => setEditCardModal({ open: true, field: 'dg' })}
                    title="Clique para alterar Data do DG, Resultado e Veterinário"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-green-200 dark:bg-green-800 rounded-lg">
                        <svg className="h-5 w-5 text-green-700 dark:text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-green-700 dark:text-green-300 uppercase">
                          ✅ Data do DG
                        </label>
                        <p className="text-lg font-bold text-green-900 dark:text-green-100">
                          {animal.dataDG || animal.data_dg 
                            ? formatDate(animal.dataDG || animal.data_dg)
                            : 'Não realizado'}
                        </p>
                      </div>
                    </div>
                    {(animal.dataDG || animal.data_dg) && (
                      <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-700">
                        <span className={`inline-flex px-3 py-1 text-sm font-bold rounded-full ${
                          animal.resultadoDG === 'Prenha' || animal.resultado_dg === 'Prenha'
                            ? 'bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100'
                            : 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
                        }`}>
                          {animal.resultadoDG || animal.resultado_dg || 'Pendente'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Previsão de Parto */}
                  {(animal.resultadoDG === 'Prenha' || animal.resultado_dg === 'Prenha') && (animal.dataTE || animal.data_te) && (
                    <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/30 dark:to-rose-900/30 p-4 rounded-xl border-2 border-pink-300 dark:border-pink-700 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-pink-200 dark:bg-pink-800 rounded-lg">
                          <svg className="h-5 w-5 text-pink-700 dark:text-pink-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-pink-700 dark:text-pink-300 uppercase">
                            🍼 Previsão de Parto
                          </label>
                          <p className="text-lg font-bold text-pink-900 dark:text-pink-100">
                            {(() => {
                              const dataTE = new Date(animal.dataTE || animal.data_te)
                              const dataParto = new Date(dataTE)
                              dataParto.setMonth(dataParto.getMonth() + 9)
                              return dataParto.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
                            })()}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-pink-200 dark:border-pink-700">
                        <p className="text-xs text-pink-700 dark:text-pink-300 font-semibold">
                          🤰 {Math.floor((new Date() - new Date(animal.dataTE || animal.data_te)) / (24 * 60 * 60 * 1000))} dias de gestação
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Veterinário do DG */}
                  {animal.veterinario_dg && (
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                          <svg className="h-5 w-5 text-indigo-600 dark:text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                            👨‍⚕️ Veterinário DG
                          </label>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {animal.veterinario_dg}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Informações Financeiras */}
                {(animal.data_compra || animal.custo_total > 0 || animal.custoTotal > 0) && (
                  <div className="col-span-full mt-2">
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 rounded-xl border-2 border-amber-200 dark:border-amber-700">
                      <h3 className="text-sm font-bold text-amber-800 dark:text-amber-200 mb-3 flex items-center gap-2">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Informações Financeiras
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {animal.data_compra && (
                          <div>
                            <label className="block text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">
                              🛒 Data de Compra
                            </label>
                            <p className="text-lg font-bold text-amber-900 dark:text-amber-100">
                              {formatDate(animal.data_compra)}
                            </p>
                          </div>
                        )}
                        {(animal.custo_total > 0 || animal.custoTotal > 0) && (
                          <div>
                            <label className="block text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">
                              💰 Valor da Compra
                            </label>
                            <p className="text-lg font-bold text-amber-900 dark:text-amber-100">
                              {formatCurrency(animal.custo_total || animal.custoTotal)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Timeline Visual de Eventos */}
                {(animal.data_chegada || animal.dataTE || animal.data_te || animal.dataDG || animal.data_dg) && (
                  <div className="col-span-full mt-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border-2 border-indigo-200 dark:border-indigo-700 shadow-lg">
                      <h3 className="text-lg font-bold text-indigo-800 dark:text-indigo-200 mb-4 flex items-center gap-2">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Timeline de Eventos
                      </h3>
                      
                      <div className="relative">
                        {/* Linha vertical */}
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 via-purple-400 to-pink-400"></div>
                        
                        <div className="space-y-6">
                          {/* Chegada */}
                          {(animal.data_chegada || animal.dataChegada) && (
                            <div className="relative flex items-start gap-4">
                              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold z-10 shadow-lg">
                                1
                              </div>
                              <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-500">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="font-bold text-blue-900 dark:text-blue-100">📅 Chegada na Fazenda</h4>
                                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                    {formatDate(animal.data_chegada || animal.dataChegada)}
                                  </span>
                                </div>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                  Há {Math.floor((new Date() - new Date(animal.data_chegada || animal.dataChegada)) / (24 * 60 * 60 * 1000))} dias
                                </p>
                              </div>
                            </div>
                          )}

                          {/* TE */}
                          {(animal.dataTE || animal.data_te) && (
                            <div className="relative flex items-start gap-4">
                              <div className="flex-shrink-0 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold z-10 shadow-lg">
                                2
                              </div>
                              <div className="flex-1 bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border-l-4 border-purple-500">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="font-bold text-purple-900 dark:text-purple-100">💉 Transferência de Embrião (TE)</h4>
                                  <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                                    {formatDate(animal.dataTE || animal.data_te)}
                                  </span>
                                </div>
                                <p className="text-sm text-purple-700 dark:text-purple-300">
                                  Há {Math.floor((new Date() - new Date(animal.dataTE || animal.data_te)) / (24 * 60 * 60 * 1000))} dias
                                </p>
                              </div>
                            </div>
                          )}

                          {/* DG */}
                          {(animal.dataDG || animal.data_dg) ? (
                            <div className="relative flex items-start gap-4">
                              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold z-10 shadow-lg ${
                                animal.resultadoDG === 'Prenha' || animal.resultado_dg === 'Prenha' ? 'bg-green-500' : 'bg-red-500'
                              }`}>
                                3
                              </div>
                              <div className={`flex-1 p-4 rounded-lg border-l-4 ${
                                animal.resultadoDG === 'Prenha' || animal.resultado_dg === 'Prenha' 
                                  ? 'bg-green-50 dark:bg-green-900/20 border-green-500' 
                                  : 'bg-red-50 dark:bg-red-900/20 border-red-500'
                              }`}>
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className={`font-bold ${
                                    animal.resultadoDG === 'Prenha' || animal.resultado_dg === 'Prenha'
                                      ? 'text-green-900 dark:text-green-100'
                                      : 'text-red-900 dark:text-red-100'
                                  }`}>
                                    ✅ Diagnóstico de Gestação (DG)
                                  </h4>
                                  <span className={`text-sm font-semibold ${
                                    animal.resultadoDG === 'Prenha' || animal.resultado_dg === 'Prenha'
                                      ? 'text-green-700 dark:text-green-300'
                                      : 'text-red-700 dark:text-red-300'
                                  }`}>
                                    {formatDate(animal.dataDG || animal.data_dg)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`inline-flex px-3 py-1 text-sm font-bold rounded-full ${
                                    animal.resultadoDG === 'Prenha' || animal.resultado_dg === 'Prenha'
                                      ? 'bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100'
                                      : 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
                                  }`}>
                                    {animal.resultadoDG || animal.resultado_dg || 'Pendente'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="relative flex items-start gap-4">
                              <div className="flex-shrink-0 w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold z-10 shadow-lg">
                                3
                              </div>
                              <div className="flex-1 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border-l-4 border-gray-400 border-dashed">
                                <h4 className="font-bold text-gray-600 dark:text-gray-400">⏳ DG Pendente</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-500">Aguardando diagnóstico de gestação</p>
                              </div>
                            </div>
                          )}

                          {/* Parto Previsto */}
                          {(animal.resultadoDG === 'Prenha' || animal.resultado_dg === 'Prenha') && (animal.dataTE || animal.data_te) && (
                            <div className="relative flex items-start gap-4">
                              <div className="flex-shrink-0 w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold z-10 shadow-lg">
                                4
                              </div>
                              <div className="flex-1 bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg border-l-4 border-pink-500">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="font-bold text-pink-900 dark:text-pink-100">🍼 Previsão de Parto</h4>
                                  <span className="text-sm font-semibold text-pink-700 dark:text-pink-300">
                                    {(() => {
                                      const dataTE = new Date(animal.dataTE || animal.data_te)
                                      const dataParto = new Date(dataTE)
                                      dataParto.setMonth(dataParto.getMonth() + 9)
                                      return dataParto.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
                                    })()}
                                  </span>
                                </div>
                                <div className="mt-2">
                                  <div className="flex items-center justify-between text-xs text-pink-700 dark:text-pink-300 mb-1">
                                    <span>Progresso da Gestação</span>
                                    <span className="font-bold">
                                      {(() => {
                                        const diasGestacao = Math.floor((new Date() - new Date(animal.dataTE || animal.data_te)) / (24 * 60 * 60 * 1000))
                                        const totalDias = 270 // 9 meses
                                        const progresso = Math.min(Math.round((diasGestacao / totalDias) * 100), 100)
                                        return `${progresso}%`
                                      })()}
                                    </span>
                                  </div>
                                  <div className="w-full bg-pink-200 dark:bg-pink-800 rounded-full h-3 overflow-hidden">
                                    <div 
                                      className="bg-gradient-to-r from-pink-500 to-rose-500 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-1"
                                      style={{
                                        width: `${(() => {
                                          const diasGestacao = Math.floor((new Date() - new Date(animal.dataTE || animal.data_te)) / (24 * 60 * 60 * 1000))
                                          const totalDias = 270
                                          return Math.min(Math.round((diasGestacao / totalDias) * 100), 100)
                                        })()}%`
                                      }}
                                    >
                                      <span className="text-xs text-white font-bold">
                                        {Math.floor((new Date() - new Date(animal.dataTE || animal.data_te)) / (24 * 60 * 60 * 1000))} dias
                                      </span>
                                    </div>
                                  </div>
                                  <p className="text-xs text-pink-600 dark:text-pink-400 mt-1">
                                    Faltam aproximadamente {(() => {
                                      const diasGestacao = Math.floor((new Date() - new Date(animal.dataTE || animal.data_te)) / (24 * 60 * 60 * 1000))
                                      const diasRestantes = Math.max(270 - diasGestacao, 0)
                                      return diasRestantes
                                    })()} dias para o parto
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Alertas e Lembretes */}
                {(animal.dataTE || animal.data_te) && (
                  <div className="col-span-full mt-4">
                    <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 p-4 rounded-xl border-2 border-yellow-300 dark:border-yellow-700">
                      <h3 className="text-sm font-bold text-yellow-800 dark:text-yellow-200 mb-3 flex items-center gap-2">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Alertas e Lembretes
                      </h3>
                      <div className="space-y-2">
                        {(() => {
                          const diasGestacao = Math.floor((new Date() - new Date(animal.dataTE || animal.data_te)) / (24 * 60 * 60 * 1000))
                          const alertas = []
                          
                          // Alerta DG pendente (15 dias após chegada)
                          if (!animal.data_dg && !animal.dataDG && animal.data_chegada) {
                            const diasDesdeChegada = Math.floor((new Date() - new Date(animal.data_chegada)) / (24 * 60 * 60 * 1000))
                            if (diasDesdeChegada >= 15) {
                              alertas.push({
                                tipo: 'urgente',
                                mensagem: `⚠️ DG atrasado! Já se passaram ${diasDesdeChegada} dias desde a chegada.`
                              })
                            } else {
                              const diasRestantes = 15 - diasDesdeChegada
                              alertas.push({
                                tipo: 'info',
                                mensagem: `📅 DG previsto em ${diasRestantes} dias (15 dias após chegada).`
                              })
                            }
                          }
                          
                          // Alerta parto próximo (prenha e faltam menos de 30 dias)
                          if ((animal.resultadoDG === 'Prenha' || animal.resultado_dg === 'Prenha') && diasGestacao >= 240) {
                            const diasRestantes = Math.max(270 - diasGestacao, 0)
                            if (diasRestantes <= 30) {
                              alertas.push({
                                tipo: 'urgente',
                                mensagem: `🚨 Parto próximo! Faltam apenas ${diasRestantes} dias. Prepare a maternidade.`
                              })
                            } else if (diasRestantes <= 60) {
                              alertas.push({
                                tipo: 'aviso',
                                mensagem: `⚠️ Parto se aproximando em ${diasRestantes} dias. Monitore a receptora.`
                              })
                            }
                          }
                          
                          // Alerta gestação avançada
                          if ((animal.resultadoDG === 'Prenha' || animal.resultado_dg === 'Prenha') && diasGestacao >= 180 && diasGestacao < 240) {
                            alertas.push({
                              tipo: 'info',
                              mensagem: `🤰 Gestação avançada (${diasGestacao} dias). Mantenha acompanhamento veterinário.`
                            })
                          }
                          
                          if (alertas.length === 0) {
                            alertas.push({
                              tipo: 'sucesso',
                              mensagem: '✅ Nenhum alerta no momento. Tudo sob controle!'
                            })
                          }
                          
                          return alertas.map((alerta, index) => (
                            <div 
                              key={index}
                              className={`p-3 rounded-lg ${
                                alerta.tipo === 'urgente' ? 'bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500' :
                                alerta.tipo === 'aviso' ? 'bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500' :
                                alerta.tipo === 'info' ? 'bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-500' :
                                'bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500'
                              }`}
                            >
                              <p className={`text-sm font-semibold ${
                                alerta.tipo === 'urgente' ? 'text-red-800 dark:text-red-200' :
                                alerta.tipo === 'aviso' ? 'text-yellow-800 dark:text-yellow-200' :
                                alerta.tipo === 'info' ? 'text-blue-800 dark:text-blue-200' :
                                'text-green-800 dark:text-green-200'
                              }`}>
                                {alerta.mensagem}
                              </p>
                            </div>
                          ))
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Estatísticas Visuais */}
                {(animal.dataTE || animal.data_te) && (
                  <div className="col-span-full mt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Dias na Fazenda */}
                      {(animal.data_chegada || animal.dataChegada) && (
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl shadow-lg text-white">
                          <div className="flex items-center justify-between mb-2">
                            <svg className="h-8 w-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            <span className="text-3xl font-bold">
                              {Math.floor((new Date() - new Date(animal.data_chegada || animal.dataChegada)) / (24 * 60 * 60 * 1000))}
                            </span>
                          </div>
                          <p className="text-sm font-semibold opacity-90">Dias na Fazenda</p>
                        </div>
                      )}

                      {/* Dias desde TE */}
                      <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-xl shadow-lg text-white">
                        <div className="flex items-center justify-between mb-2">
                          <svg className="h-8 w-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                          </svg>
                          <span className="text-3xl font-bold">
                            {Math.floor((new Date() - new Date(animal.dataTE || animal.data_te)) / (24 * 60 * 60 * 1000))}
                          </span>
                        </div>
                        <p className="text-sm font-semibold opacity-90">Dias desde TE</p>
                      </div>

                      {/* Status Gestação */}
                      {(animal.resultadoDG === 'Prenha' || animal.resultado_dg === 'Prenha') ? (
                        <>
                          <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-xl shadow-lg text-white">
                            <div className="flex items-center justify-between mb-2">
                              <svg className="h-8 w-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-3xl font-bold">
                                {Math.floor((new Date() - new Date(animal.dataTE || animal.data_te)) / (24 * 60 * 60 * 1000))}
                              </span>
                            </div>
                            <p className="text-sm font-semibold opacity-90">Dias de Gestação</p>
                          </div>

                          <div className="bg-gradient-to-br from-pink-500 to-pink-600 p-4 rounded-xl shadow-lg text-white">
                            <div className="flex items-center justify-between mb-2">
                              <svg className="h-8 w-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-3xl font-bold">
                                {Math.max(270 - Math.floor((new Date() - new Date(animal.dataTE || animal.data_te)) / (24 * 60 * 60 * 1000)), 0)}
                              </span>
                            </div>
                            <p className="text-sm font-semibold opacity-90">Dias até Parto</p>
                          </div>
                        </>
                      ) : (animal.data_dg || animal.dataDG) ? (
                        <div className="bg-gradient-to-br from-red-500 to-red-600 p-4 rounded-xl shadow-lg text-white col-span-2">
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <svg className="h-12 w-12 mx-auto mb-2 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-sm font-semibold">DG Realizado - Vazia</p>
                              <p className="text-xs opacity-90 mt-1">
                                {formatDate(animal.dataDG || animal.data_dg)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gradient-to-br from-gray-500 to-gray-600 p-4 rounded-xl shadow-lg text-white col-span-2">
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <svg className="h-12 w-12 mx-auto mb-2 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-sm font-semibold">Aguardando DG</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Botões de Ação Rápida */}
                <div className="col-span-full mt-4">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Ações Rápidas
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {/* Registrar DG */}
                      {!animal.data_dg && !animal.dataDG && (
                        <button
                          onClick={() => router.push(`/reproducao/receptoras-dg`)}
                          className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border-2 border-green-300 dark:border-green-700 hover:shadow-lg transition-all"
                        >
                          <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm font-bold text-green-800 dark:text-green-200">Registrar DG</span>
                        </button>
                      )}

                      {/* Ver Histórico */}
                      <button
                        onClick={() => router.push(`/animals/${id}?history=true`)}
                        className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border-2 border-blue-300 dark:border-blue-700 hover:shadow-lg transition-all"
                      >
                        <svg className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-bold text-blue-800 dark:text-blue-200">Ver Histórico</span>
                      </button>

                      {/* Adicionar Custo */}
                      <button
                        onClick={() => setShowQuickOccurrence(true)}
                        className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border-2 border-amber-300 dark:border-amber-700 hover:shadow-lg transition-all"
                      >
                        <svg className="h-8 w-8 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-bold text-amber-800 dark:text-amber-200">Adicionar Custo</span>
                      </button>

                      {/* Gerar Relatório */}
                      <button
                        onClick={handleGeneratePDF}
                        disabled={generatingPDF}
                        className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border-2 border-purple-300 dark:border-purple-700 hover:shadow-lg transition-all disabled:opacity-50"
                      >
                        <svg className="h-8 w-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm font-bold text-purple-800 dark:text-purple-200">
                          {generatingPDF ? 'Gerando...' : 'Gerar PDF'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Resumo Executivo */}
                <div className="col-span-full mt-4">
                  <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 p-6 rounded-xl border-2 border-indigo-300 dark:border-indigo-700 shadow-lg">
                    <h3 className="text-lg font-bold text-indigo-800 dark:text-indigo-200 mb-4 flex items-center gap-2">
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Resumo Executivo
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Status Atual</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {animal.resultadoDG === 'Prenha' || animal.resultado_dg === 'Prenha' ? '🤰 Prenha' : 
                           animal.data_dg || animal.dataDG ? '❌ Vazia' : '⏳ Aguardando DG'}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Tempo Total</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {(animal.data_chegada || animal.dataChegada) && 
                            `${Math.floor((new Date() - new Date(animal.data_chegada || animal.dataChegada)) / (24 * 60 * 60 * 1000))} dias`
                          }
                        </p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Investimento</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {(animal.custo_total > 0 || animal.custoTotal > 0) 
                            ? formatCurrency(animal.custo_total || animal.custoTotal)
                            : 'Não informado'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Separador Genealogia */}
                <div className="col-span-full border-t-2 border-amber-100 dark:border-amber-900/30 my-4 pt-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-900/30">
                      <svg className="h-4 w-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <span className="text-sm font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wider">Genealogia</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                    Pai
                  </label>
                  {paiId ? (
                    <button
                      onClick={() => router.push(`/animals/${paiId}`)}
                      className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 truncate flex items-center gap-1 group hover:underline"
                      title={`Ver ficha de ${animal.pai}`}
                    >
                      {animal.pai}
                      <ArrowTopRightOnSquareIcon className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </button>
                  ) : (
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={animal.pai}>
                      {animal.pai || '-'}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                    Mãe
                  </label>
                  {(() => {
                    const s = animal.serie_mae || maeSerieRg?.serie
                    const r = animal.rg_mae || maeSerieRg?.rg
                    if (s && r) {
                      return (
                        <Link
                          href={`/consulta-animal/${s}-${r}`}
                          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 truncate flex items-center gap-1 group hover:underline"
                          title="Ver ficha da mãe"
                        >
                          {s} {r}
                          <ArrowTopRightOnSquareIcon className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </Link>
                      )
                    }
                    return (
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={animal.mae}>
                        {animal.mae || '-'}
                      </p>
                    )
                  })()}
                </div>

                {/* Informações de Genealogia e Genética para outros animais */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                    Mãe (Série/RG)
                  </label>
                  {(animal.serie_mae || maeSerieRg?.serie) && (animal.rg_mae || maeSerieRg?.rg) ? (
                    <Link
                      href={`/consulta-animal/${animal.serie_mae || maeSerieRg.serie}-${animal.rg_mae || maeSerieRg.rg}`}
                      className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {animal.serie_mae || maeSerieRg.serie} {animal.rg_mae || maeSerieRg.rg}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium text-gray-900 dark:text-white">-</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                    Avô Materno
                  </label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={avoMaterno || animal?.avo_materno}>
                    {avoMaterno || animal?.avo_materno || animal?.avoMaterno || '-'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                    Receptora
                  </label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {animal.receptora || '-'}
                  </p>
                </div>



                {/* Separador Genética */}
                <div className="col-span-full border-t-2 border-emerald-100 dark:border-emerald-900/30 my-4 pt-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-900/30">
                      <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                    <span className="text-sm font-bold text-emerald-800 dark:text-emerald-200 uppercase tracking-wider">Genética</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                    iABCZg
                  </label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {animal.abczg || '-'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                    DECA
                  </label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <span>{animal.deca || '-'}</span>
                    {animal.ranking_iabcz && (
                      <span className="flex items-center gap-1">
                        {animal.ranking_iabcz === 1 && <span className="text-xl">🥇</span>}
                        {animal.ranking_iabcz === 2 && <span className="text-xl">🥈</span>}
                        {animal.ranking_iabcz === 3 && <span className="text-xl">🥉</span>}
                        {animal.ranking_iabcz > 3 && <span className="text-amber-600">🏆</span>}
                        <span className="text-xs text-gray-500 dark:text-gray-400">#{animal.ranking_iabcz}</span>
                      </span>
                    )}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                    IQG
                  </label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {(animal.iqg ?? animal.genetica_2) || '-'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                    Pt IQG
                  </label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <span>{(animal.pt_iqg ?? animal.decile_2) || '-'}</span>
                    {animal.ranking_iqg && (
                      <span className="flex items-center gap-1">
                        {animal.ranking_iqg === 1 && <span className="text-xl">🥇</span>}
                        {animal.ranking_iqg === 2 && <span className="text-xl">🥈</span>}
                        {animal.ranking_iqg === 3 && <span className="text-xl">🥉</span>}
                        {animal.ranking_iqg > 3 && <span className="text-amber-600">🏆</span>}
                        <span className="text-xs text-gray-500 dark:text-gray-400">#{animal.ranking_iqg}</span>
                      </span>
                    )}
                  </p>
                </div>
              </>
            )}
            
          </div>
        </CardBody>
        )}
      </Card>

      {/* Informações de Receptora - Seção Especial */}
      {(animal.raca && animal.raca.toLowerCase().includes('receptora')) && (
        <Card className="border-2 border-pink-200 dark:border-pink-700">
          <CardHeader className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <svg className="h-6 w-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Informações de Receptora
            </h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Data de Chegada */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border-2 border-blue-200 dark:border-blue-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                    <CalendarIcon className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">
                      Data de Chegada
                    </label>
                    <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                      {animal.dataChegada || animal.data_chegada 
                        ? formatDate(animal.dataChegada || animal.data_chegada)
                        : 'Não informado'}
                    </p>
                  </div>
                </div>
                {(animal.dataChegada || animal.data_chegada) && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    Há {Math.floor((new Date() - new Date(animal.dataChegada || animal.data_chegada)) / (24 * 60 * 60 * 1000))} dias
                  </p>
                )}
              </div>

              {/* Data da TE */}
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border-2 border-purple-200 dark:border-purple-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
                    <BeakerIcon className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase">
                      Data da TE
                    </label>
                    <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                      {animal.dataTE || animal.data_te 
                        ? formatDate(animal.dataTE || animal.data_te)
                        : 'Não realizada'}
                    </p>
                  </div>
                </div>
                {(animal.dataTE || animal.data_te) && (
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                    Há {Math.floor((new Date() - new Date(animal.dataTE || animal.data_te)) / (24 * 60 * 60 * 1000))} dias
                  </p>
                )}
              </div>

              {/* Data do DG */}
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border-2 border-green-200 dark:border-green-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                    <svg className="h-5 w-5 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-green-600 dark:text-green-400 uppercase">
                      Data do DG
                    </label>
                    <p className="text-lg font-bold text-green-900 dark:text-green-100">
                      {animal.dataDG || animal.data_dg 
                        ? formatDate(animal.dataDG || animal.data_dg)
                        : 'Não realizado'}
                    </p>
                  </div>
                </div>
                {(animal.dataDG || animal.data_dg) && (
                  <div className="mt-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${
                      animal.resultadoDG === 'Prenha' || animal.resultado_dg === 'Prenha'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {animal.resultadoDG || animal.resultado_dg || 'Pendente'}
                    </span>
                  </div>
                )}
              </div>

              {/* Dias de Gestação (se prenha) */}
              {(animal.resultadoDG === 'Prenha' || animal.resultado_dg === 'Prenha') && (animal.dataTE || animal.data_te) && (
                <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-xl border-2 border-pink-200 dark:border-pink-700">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-pink-100 dark:bg-pink-800 rounded-lg">
                      <span className="text-2xl">🤰</span>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-pink-600 dark:text-pink-400 uppercase">
                        Dias de Gestação
                      </label>
                      <p className="text-lg font-bold text-pink-900 dark:text-pink-100">
                        {Math.floor((new Date() - new Date(animal.dataTE || animal.data_te)) / (24 * 60 * 60 * 1000))} dias
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-pink-600 dark:text-pink-400 mt-2">
                    Parto previsto: {new Date(new Date(animal.dataTE || animal.data_te).getTime() + (270 * 24 * 60 * 60 * 1000)).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
            </div>

            {/* Informações Adicionais */}
            {(animal.veterinario_dg || animal.observacoes_dg) && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {animal.veterinario_dg && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        👨‍⚕️ Veterinário do DG
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {animal.veterinario_dg}
                      </p>
                    </div>
                  )}
                  {animal.observacoes_dg && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        📝 Observações do DG
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {animal.observacoes_dg}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Informações Financeiras */}
      <Card className="overflow-hidden transition-all duration-300">
        <div 
          className="group flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 px-6 py-4 border-b border-gray-200 dark:border-gray-700 transition-colors"
          onClick={() => toggleCard('financeiro')}
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <CurrencyDollarIcon className="h-5 w-5" />
            Informações Financeiras
          </h2>
          {cardsExpanded.financeiro ? (
            <ChevronUpIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          )}
        </div>
        {cardsExpanded.financeiro && (
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-0.5">
                Valor de Venda
              </label>
              <p className="text-base font-semibold text-gray-900 dark:text-white">{formatCurrency(animal.valor_venda)}</p>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-0.5">
                Valor por KG
              </label>
              <p className="text-base font-semibold text-gray-900 dark:text-white">
                {animal.peso && animal.valor_venda 
                  ? formatCurrency(animal.valor_venda / animal.peso)
                  : '-'
                }
              </p>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-0.5">
                Custo Total
              </label>
              <p className="text-base font-semibold text-gray-900 dark:text-white">
                {formatCurrency((() => {
                  // Excluir custos com data futura - exames agendados não contam ainda
                  const hoje = new Date()
                  hoje.setHours(23, 59, 59, 999)
                  if (custos && custos.length > 0) {
                    const totalPassado = custos
                      .filter(c => {
                        const dataCusto = c.data || c.data_custo
                        return !dataCusto || new Date(dataCusto) <= hoje
                      })
                      .reduce((s, c) => s + parseFloat(c.valor || 0), 0)
                    return totalPassado
                  }
                  return animal.custo_total || 0
                })())}
              </p>
            </div>
          </div>

          {/* Dados da Nota Fiscal */}
          {animal.situacao === 'Vendido' && infoVenda && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Dados da Nota Fiscal
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-0.5">
                    NF:
                  </label>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {infoVenda.nfNumero || '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-0.5">
                    Data:
                  </label>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {infoVenda.dataVenda ? new Date(infoVenda.dataVenda).toLocaleDateString('pt-BR') : '-'}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-0.5">
                    Destino:
                  </label>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {infoVenda.destino || '-'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Histórico de Custos */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Histórico de Custos
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => loadCustos(true)}
                disabled={loadingCustos}
                className="flex items-center gap-1 text-xs h-7 px-2"
              >
                <ArrowPathIcon className="h-3 w-3" />
                {loadingCustos ? 'Carregando...' : 'Recarregar'}
              </Button>
            </div>
            
            {loadingCustos ? (
              <div className="text-center py-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">Carregando custos...</p>
              </div>
            ) : custos && custos.length > 0 ? (
              <div className="space-y-2">
                {custos
                  .filter(custo => {
                    // Filtrar exames andrológicos se o animal for fêmea
                    const isAndrologico = custo.tipo === 'Exame' && custo.subtipo === 'Andrológico'
                    const isFemea = animal.sexo && (
                      animal.sexo.toLowerCase().startsWith('f') || 
                      animal.sexo === 'F' || 
                      animal.sexo.toLowerCase().includes('fêmea') ||
                      animal.sexo.toLowerCase().includes('femea')
                    )
                    // Se for fêmea e o custo for exame andrológico, não exibir
                    if (isFemea && isAndrologico) return false
                    return true
                  })
                  .map((custo, index) => {
                  // Verificar se é custo de exame andrológico
                  const isAndrologico = custo.tipo === 'Exame' && custo.subtipo === 'Andrológico'
                  
                  return (
                    <div 
                      key={custo.id || index}
                      className={`bg-gray-50 dark:bg-gray-800 rounded p-2 border ${
                        isAndrologico 
                          ? 'border-pink-300 dark:border-pink-700 bg-pink-50 dark:bg-pink-900/10' 
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {custo.tipo || 'Custo'}
                            </span>
                            {custo.subtipo && (
                              <span className={`text-xs ${
                                isAndrologico 
                                  ? 'text-pink-700 dark:text-pink-300 font-semibold' 
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}>
                                - {custo.subtipo}
                              </span>
                            )}
                            {isAndrologico && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-pink-200 text-pink-800 dark:bg-pink-900 dark:text-pink-200 font-semibold">
                                🔬 Andrológico
                              </span>
                            )}
                          </div>
                          {custo.observacoes && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                              {custo.observacoes}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            {(custo.data || custo.data_custo) && (
                              <span>
                                Data: {formatDate(custo.data || custo.data_custo)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${
                            isAndrologico 
                              ? 'text-pink-700 dark:text-pink-300' 
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {formatCurrency(custo.valor)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Nenhum custo registrado para este animal.
                </p>
              </div>
            )}
          </div>
        </CardBody>
        )}
      </Card>

      {/* Informações de DNA */}
      {(animal.laboratorio_dna || animal.data_envio_dna || animal.custo_dna) && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <BeakerIcon className="h-5 w-5 text-indigo-600" />
              Análise de DNA
            </h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {/* Resumo Total */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                    Laboratórios
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {animal.laboratorio_dna?.split(',').map((lab, idx) => {
                      const labTrim = lab.trim()
                      return (
                        <span key={idx} className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium mr-1 ${
                          labTrim === 'VRGEN' 
                            ? 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200'
                            : 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {labTrim}
                        </span>
                      )
                    })}
                  </p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                    Último Envio
                  </label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(animal.data_envio_dna)}
                  </p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                    Custo Total de DNA
                  </label>
                  <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(animal.custo_dna)}
                  </p>
                </div>
              </div>

              {/* Histórico de Envios */}
              <DNAHistorySection animalId={animal.id} />
            </div>
          </CardBody>
        </Card>
      )}

      {/* Card de Resumo - Doadora de Oócitos */}
      {doadoraStats && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <BeakerIcon className="h-5 w-5 text-pink-600" />
              Doadora de Oócitos
            </h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Total de Coletas */}
              <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/30 dark:to-pink-800/20 p-3 rounded-lg border border-pink-200 dark:border-pink-700/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <BeakerIcon className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                  <p className="text-xs font-medium text-pink-700 dark:text-pink-300">Total Coletas</p>
                </div>
                <p className="text-2xl font-bold text-pink-800 dark:text-pink-200">{doadoraStats.totalColetas}</p>
                <p className="text-[10px] text-pink-600 dark:text-pink-400">vezes coletada</p>
              </div>

              {/* Total de Oócitos Viáveis */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 p-3 rounded-lg border border-purple-200 dark:border-purple-700/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <BeakerIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <p className="text-xs font-medium text-purple-700 dark:text-purple-300">Oócitos Viáveis</p>
                </div>
                <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">{doadoraStats.totalOocitos}</p>
                <p className="text-[10px] text-purple-600 dark:text-purple-400">média {doadoraStats.mediaOocitos}/coleta</p>
              </div>

              {/* Embriões Produzidos */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 p-3 rounded-lg border border-blue-200 dark:border-blue-700/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <BeakerIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Embriões Produzidos</p>
                </div>
                <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{doadoraStats.totalEmbrioesProduzidos ?? 0}</p>
                <p className="text-[10px] text-blue-600 dark:text-blue-400">média {doadoraStats.mediaEmbrioesProduzidos ?? 0}/coleta</p>
              </div>

              {/* Embriões Transferidos */}
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20 p-3 rounded-lg border border-emerald-200 dark:border-emerald-700/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <BeakerIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Embriões Transferidos</p>
                </div>
                <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">{doadoraStats.totalEmbrioesTransferidos ?? 0}</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400">média {doadoraStats.mediaEmbrioesTransferidos ?? 0}/coleta</p>
              </div>

              {/* Primeira Coleta */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 p-3 rounded-lg border border-green-200 dark:border-green-700/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <CalendarIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <p className="text-xs font-medium text-green-700 dark:text-green-300">1ª Coleta</p>
                </div>
                <p className="text-sm font-bold text-green-800 dark:text-green-200 truncate">
                  {formatDate(doadoraStats.primeiraColeta.data_fiv)}
                </p>
                <p className="text-[10px] text-green-600 dark:text-green-400">
                  {doadoraStats.primeiraColeta.quantidade_oocitos || 0} oócitos
                </p>
              </div>

              {/* Última Coleta */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/20 p-3 rounded-lg border border-orange-200 dark:border-orange-700/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <CalendarIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <p className="text-xs font-medium text-orange-700 dark:text-orange-300">Última Coleta</p>
                </div>
                <p className="text-sm font-bold text-orange-800 dark:text-orange-200 truncate">
                  {formatDate(doadoraStats.ultimaColeta.data_fiv)}
                </p>
                <p className="text-[10px] text-orange-600 dark:text-orange-400">
                  {doadoraStats.ultimaColeta.quantidade_oocitos || 0} oócitos
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Histórico de Coletas FIV */}
      {animal.fivs && animal.fivs.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <BeakerIcon className="h-5 w-5 text-pink-600" />
              Histórico de Coletas FIV
            </h2>
          </CardHeader>
          <CardBody>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-pink-50 dark:bg-pink-900/20">
                    <th className="px-3 py-2 text-left text-pink-800 dark:text-pink-300 font-semibold">Data FIV</th>
                    <th className="px-3 py-2 text-left text-pink-800 dark:text-pink-300 font-semibold">Veterinário</th>
                    <th className="px-3 py-2 text-left text-pink-800 dark:text-pink-300 font-semibold">Laboratório</th>
                    <th className="px-3 py-2 text-left text-pink-800 dark:text-pink-300 font-semibold">Touro</th>
                    <th className="px-3 py-2 text-center text-pink-800 dark:text-pink-300 font-semibold">Oócitos</th>
                    <th className="px-3 py-2 text-center text-pink-800 dark:text-pink-300 font-semibold">Embriões</th>
                    <th className="px-3 py-2 text-center text-pink-800 dark:text-pink-300 font-semibold">Transferidos</th>
                    <th className="px-3 py-2 text-left text-pink-800 dark:text-pink-300 font-semibold">Data Transf.</th>
                    <th className="px-3 py-2 text-center text-pink-800 dark:text-pink-300 font-semibold">TE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                  {animal.fivs.map((fiv, idx) => {
                    // Contar TEs relacionadas a esta coleta FIV
                    const tesRelacionadas = transferenciasEmbrioes.filter(te => {
                      // Verificar se a TE está relacionada a esta coleta FIV
                      // Por doadora_id e data_fiv
                      if (te.doadora_id === animal.id && te.data_fiv === fiv.data_fiv) {
                        return true
                      }
                      // Por doadora_nome e data_fiv
                      if (te.doadora_nome && fiv.doadora_nome && 
                          te.doadora_nome.toLowerCase().includes(fiv.doadora_nome.toLowerCase()) &&
                          te.data_fiv === fiv.data_fiv) {
                        return true
                      }
                      return false
                    })
                    const quantidadeTE = fiv.embrioes_transferidos != null ? fiv.embrioes_transferidos : tesRelacionadas.length

                    return (
                      <tr key={fiv.id || idx} className="hover:bg-pink-50/30 dark:hover:bg-pink-900/10 transition-colors">
                        <td className="px-3 py-2 text-gray-800 dark:text-gray-200">
                          {formatDate(fiv.data_fiv)}
                        </td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400 truncate max-w-[100px]" title={fiv.veterinario}>
                          {fiv.veterinario || '-'}
                        </td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400 truncate max-w-[100px]" title={fiv.laboratorio}>
                          {fiv.laboratorio || '-'}
                        </td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400 truncate max-w-[100px]" title={fiv.touro}>
                          {fiv.touro || '-'}
                        </td>
                        <td className="px-3 py-2 text-center font-medium text-gray-900 dark:text-white">
                          {fiv.quantidade_oocitos || 0}
                        </td>
                        <td className="px-3 py-2 text-center font-medium text-gray-800 dark:text-gray-200">
                          {fiv.embrioes_produzidos ?? '-'}
                        </td>
                        <td className="px-3 py-2 text-center font-medium text-gray-800 dark:text-gray-200">
                          {(fiv.embrioes_transferidos ?? quantidadeTE) || '-'}
                        </td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                          {fiv.data_transferencia ? formatDate(fiv.data_transferencia) : '-'}
                        </td>
                        <td className="px-3 py-2 text-center font-medium text-purple-600 dark:text-purple-400">
                          {quantidadeTE > 0 ? (
                            <span className="font-semibold">{quantidadeTE}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Resumo Reprodutivo (TE) */}
      {reproducaoStats && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <BeakerIcon className="h-5 w-5 text-purple-600" />
              Resumo Reprodutivo (Transferência de Embriões)
            </h2>
          </CardHeader>
          <CardBody>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                    <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Total Produzido</p>
                    <p className="text-2xl font-bold text-purple-800 dark:text-purple-300">{reproducaoStats.total}</p>
                </div>
                <div className="bg-pink-50 dark:bg-pink-900/20 p-3 rounded-lg">
                    <p className="text-xs text-pink-600 dark:text-pink-400 font-medium">Fêmeas</p>
                    <p className="text-2xl font-bold text-pink-800 dark:text-pink-300">
                        {reproducaoStats.femeas}
                        <span className="text-[10px] ml-1 opacity-75">({reproducaoStats.total > 0 ? ((reproducaoStats.femeas/reproducaoStats.total)*100).toFixed(0) : 0}%)</span>
                    </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Machos</p>
                    <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">
                        {reproducaoStats.machos}
                        <span className="text-[10px] ml-1 opacity-75">({reproducaoStats.total > 0 ? ((reproducaoStats.machos/reproducaoStats.total)*100).toFixed(0) : 0}%)</span>
                    </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium">Nascidos/Paridos</p>
                    <p className="text-2xl font-bold text-green-800 dark:text-green-300">{reproducaoStats.nascidos}</p>
                </div>
             </div>

             {reproducaoStats.prenhezes_ativas && reproducaoStats.prenhezes_ativas.length > 0 && (
                <div className="mb-6 border-b border-gray-200 dark:border-gray-700 pb-6">
                    <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        Prenhezes Ativas ({reproducaoStats.prenhezes_ativas.length})
                    </h3>
                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-green-50 dark:bg-green-900/20">
                                    <th className="px-4 py-3 text-left text-green-800 dark:text-green-300 font-semibold">Data TE</th>
                                    <th className="px-4 py-3 text-left text-green-800 dark:text-green-300 font-semibold">Previsão Parto</th>
                                    <th className="px-4 py-3 text-center text-green-800 dark:text-green-300 font-semibold">Dias Restantes</th>
                                    <th className="px-4 py-3 text-left text-green-800 dark:text-green-300 font-semibold">Acasalamento</th>
                                    <th className="px-4 py-3 text-center text-green-800 dark:text-green-300 font-semibold">Sexo Previsto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                                {reproducaoStats.prenhezes_ativas.map((prenhez, idx) => (
                                    <tr key={idx} className="hover:bg-green-50/30 dark:hover:bg-green-900/10 transition-colors">
                                        <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                                            {formatDate(prenhez.data_te)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900 dark:text-white">
                                                {formatDate(prenhez.previsao_parto)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${
                                                prenhez.dias_restantes <= 30 
                                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 animate-pulse' 
                                                    : prenhez.dias_restantes <= 60
                                                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                                                    : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                            }`}>
                                                {prenhez.dias_restantes} dias
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                            {animal.sexo && (animal.sexo.toLowerCase().startsWith('m') || animal.sexo === 'M') 
                                                ? (prenhez.doadora_nome || 'Não Inf.') 
                                                : (prenhez.touro || 'Não Inf.')}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                (prenhez.sexo_prenhez === 'M' || prenhez.sexo_prenhez === 'Macho')
                                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800'
                                                    : (prenhez.sexo_prenhez === 'F' || prenhez.sexo_prenhez === 'Fêmea')
                                                    ? 'bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 border border-pink-100 dark:border-pink-800'
                                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                            }`}>
                                                {prenhez.sexo_prenhez || '?'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
             )}

             <div>
                <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">
                    {animal.sexo && (animal.sexo.toLowerCase().startsWith('m') || animal.sexo === 'M') ? 'Doadoras Utilizadas' : 'Touros Utilizados'}
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-100 dark:bg-gray-700">
                                <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-300">Nome</th>
                                <th className="px-4 py-2 text-center text-gray-600 dark:text-gray-300">Total</th>
                                <th className="px-4 py-2 text-center text-pink-600 dark:text-pink-400">Fêmeas</th>
                                <th className="px-4 py-2 text-center text-blue-600 dark:text-blue-400">Machos</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {Object.entries(reproducaoStats.parceiros).map(([name, data]) => (
                                <tr key={name} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                                    <td className="px-4 py-2 text-gray-800 dark:text-gray-200 font-medium">{name}</td>
                                    <td className="px-4 py-2 text-center text-gray-600 dark:text-gray-400 font-bold">{data.total}</td>
                                    <td className="px-4 py-2 text-center text-gray-600 dark:text-gray-400">{data.femeas}</td>
                                    <td className="px-4 py-2 text-center text-gray-600 dark:text-gray-400">{data.machos}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             </div>
          </CardBody>
        </Card>
      )}

      {/* Transferências de Embriões - Detalhado */}
      {transferenciasEmbrioes.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <BeakerIcon className="h-5 w-5 text-pink-600" />
              Transferências de Embriões
            </h2>
          </CardHeader>
          <CardBody>
            {loadingTransferencias ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Carregando transferências...</p>
              </div>
            ) : (
              <>
                {/* Separar por tipo */}
                {(() => {
                  const comoDoadora = transferenciasEmbrioes.filter(t => 
                    t.doadora_id === animal.id || 
                    (t.doadora_nome && t.doadora_nome.toLowerCase().includes(animal.serie?.toLowerCase() || '') && t.doadora_nome.includes(animal.rg?.toString() || ''))
                  )
                  const comoReceptora = transferenciasEmbrioes.filter(t => 
                    t.receptora_id === animal.id || 
                    (t.receptora_nome && (t.receptora_nome.includes(animal.rg?.toString() || '') || t.receptora_nome.toLowerCase().includes(animal.serie?.toLowerCase() || '')))
                  )
                  const comoTouro = transferenciasEmbrioes.filter(t => 
                    t.touro_id === animal.id || 
                    (t.touro && (t.touro.toLowerCase().includes(animal.serie?.toLowerCase() || '') || t.touro.includes(animal.rg?.toString() || '')))
                  )

                  return (
                    <>
                      {/* Resumo */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {comoDoadora.length > 0 && (
                          <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg border border-pink-200 dark:border-pink-700">
                            <p className="text-sm text-pink-600 dark:text-pink-400 font-medium">Como Doadora</p>
                            <p className="text-2xl font-bold text-pink-800 dark:text-pink-300">{comoDoadora.length}</p>
                            <p className="text-xs text-pink-600 dark:text-pink-400 mt-1">transferência(s)</p>
                          </div>
                        )}
                        {comoReceptora.length > 0 && (
                          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
                            <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Como Receptora</p>
                            <p className="text-2xl font-bold text-purple-800 dark:text-purple-300">{comoReceptora.length}</p>
                            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">transferência(s)</p>
                          </div>
                        )}
                        {comoTouro.length > 0 && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Como Touro</p>
                            <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">{comoTouro.length}</p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">transferência(s)</p>
                          </div>
                        )}
                      </div>

                      {/* Tabela de Transferências como Doadora */}
                      {comoDoadora.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                            Como Doadora ({comoDoadora.length})
                          </h3>
                          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-pink-50 dark:bg-pink-900/20">
                                  <th className="px-4 py-3 text-left text-pink-800 dark:text-pink-300 font-semibold">Data TE</th>
                                  <th className="px-4 py-3 text-left text-pink-800 dark:text-pink-300 font-semibold">Receptora</th>
                                  <th className="px-4 py-3 text-left text-pink-800 dark:text-pink-300 font-semibold">Touro</th>
                                  <th className="px-4 py-3 text-center text-pink-800 dark:text-pink-300 font-semibold">Status</th>
                                  <th className="px-4 py-3 text-center text-pink-800 dark:text-pink-300 font-semibold">Sexo</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {comoDoadora.map((te) => (
                                  <tr key={te.id} className="hover:bg-pink-50/30 dark:hover:bg-pink-900/10 transition-colors">
                                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{formatDate(te.data_te)}</td>
                                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{te.receptora_nome || '-'}</td>
                                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{te.touro || '-'}</td>
                                    <td className="px-4 py-3 text-center">
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        (te.status === 'Nascido' || te.status === 'Parida' || te.status === 'Concluída') 
                                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                          : (te.status === 'Negativo' || te.status === 'Falha' || te.status === 'Aborto')
                                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                      }`}>
                                        {te.status || 'Realizada'}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">{te.sexo_prenhez || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Tabela de Transferências como Receptora */}
                      {comoReceptora.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                            Como Receptora ({comoReceptora.length})
                          </h3>
                          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-purple-50 dark:bg-purple-900/20">
                                  <th className="px-4 py-3 text-left text-purple-800 dark:text-purple-300 font-semibold">Data TE</th>
                                  <th className="px-4 py-3 text-left text-purple-800 dark:text-purple-300 font-semibold">Doadora</th>
                                  <th className="px-4 py-3 text-left text-purple-800 dark:text-purple-300 font-semibold">Touro</th>
                                  <th className="px-4 py-3 text-center text-purple-800 dark:text-purple-300 font-semibold">Status</th>
                                  <th className="px-4 py-3 text-center text-purple-800 dark:text-purple-300 font-semibold">Sexo</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {comoReceptora.map((te) => (
                                  <tr key={te.id} className="hover:bg-purple-50/30 dark:hover:bg-purple-900/10 transition-colors">
                                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{formatDate(te.data_te)}</td>
                                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{te.doadora_nome || '-'}</td>
                                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{te.touro || '-'}</td>
                                    <td className="px-4 py-3 text-center">
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        (te.status === 'Nascido' || te.status === 'Parida' || te.status === 'Concluída') 
                                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                          : (te.status === 'Negativo' || te.status === 'Falha' || te.status === 'Aborto')
                                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                      }`}>
                                        {te.status || 'Realizada'}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">{te.sexo_prenhez || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Tabela de Transferências como Touro */}
                      {comoTouro.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            Como Touro ({comoTouro.length})
                          </h3>
                          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-blue-50 dark:bg-blue-900/20">
                                  <th className="px-4 py-3 text-left text-blue-800 dark:text-blue-300 font-semibold">Data TE</th>
                                  <th className="px-4 py-3 text-left text-blue-800 dark:text-blue-300 font-semibold">Doadora</th>
                                  <th className="px-4 py-3 text-left text-blue-800 dark:text-blue-300 font-semibold">Receptora</th>
                                  <th className="px-4 py-3 text-center text-blue-800 dark:text-blue-300 font-semibold">Status</th>
                                  <th className="px-4 py-3 text-center text-blue-800 dark:text-blue-300 font-semibold">Sexo</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {comoTouro.map((te) => (
                                  <tr key={te.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{formatDate(te.data_te)}</td>
                                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{te.doadora_nome || '-'}</td>
                                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{te.receptora_nome || '-'}</td>
                                    <td className="px-4 py-3 text-center">
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        (te.status === 'Nascido' || te.status === 'Parida' || te.status === 'Concluída') 
                                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                          : (te.status === 'Negativo' || te.status === 'Falha' || te.status === 'Aborto')
                                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                      }`}>
                                        {te.status || 'Realizada'}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">{te.sexo_prenhez || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </>
                  )
                })()}
              </>
            )}
          </CardBody>
        </Card>
      )}

      {/* Exames Andrológicos */}
      {animal.sexo && (animal.sexo.toLowerCase().includes('macho') || animal.sexo === 'M') && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <BeakerIcon className="h-5 w-5 text-pink-600" />
                Exames Andrológicos
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadExamesAndrologicos}
                disabled={loadingExames}
                className="flex items-center gap-2"
              >
                <ArrowPathIcon className="h-4 w-4" />
                {loadingExames ? 'Carregando...' : 'Recarregar'}
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            {loadingExames ? (
              <div className="text-center py-4">
                <p className="text-gray-500 dark:text-gray-400">Carregando exames...</p>
              </div>
            ) : examesAndrologicos && examesAndrologicos.length > 0 ? (
              <div className="space-y-4">
                {examesAndrologicos.map((exame, index) => {
                  const dataExame = new Date(exame.data_exame || exame.data)
                  const hoje = new Date()
                  hoje.setHours(0, 0, 0, 0)
                  dataExame.setHours(0, 0, 0, 0)
                  const diasRestantes = Math.ceil((dataExame - hoje) / (1000 * 60 * 60 * 24))
                  const precisaRefazer = exame.reagendado && exame.resultado === 'Pendente' && diasRestantes <= 3
                  const estaVencido = exame.resultado === 'Pendente' && diasRestantes < 0
                  
                  return (
                    <div 
                      key={exame.id || index}
                      className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border ${
                        estaVencido 
                          ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10' 
                          : precisaRefazer 
                          ? 'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/10'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                              exame.resultado === 'Apto' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : exame.resultado === 'Inapto'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}>
                              {exame.resultado || 'Pendente'}
                            </span>
                            {precisaRefazer && (
                              <span className="px-2 py-0.5 rounded text-xs bg-orange-200 text-orange-800 dark:bg-orange-900 dark:text-orange-200 font-semibold">
                                {diasRestantes < 0 
                                  ? `⚠️ Vencido há ${Math.abs(diasRestantes)}d` 
                                  : diasRestantes === 0 
                                  ? '⚠️ Hoje!' 
                                  : `⏰ Em ${diasRestantes}d`}
                              </span>
                            )}
                            {exame.reagendado && (
                              <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                🔄 Reagendado
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">Data:</span>
                              <p className="text-gray-900 dark:text-white">
                                {formatDate(exame.data_exame || exame.data)}
                              </p>
                              {exame.reagendado && exame.data_exame_original && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Original: {formatDate(exame.data_exame_original)}
                                </p>
                              )}
                            </div>
                            
                            {exame.ce && (
                              <div>
                                <span className="font-medium text-gray-700 dark:text-gray-300">CE:</span>
                                <p className="text-gray-900 dark:text-white">{exame.ce} cm</p>
                              </div>
                            )}
                            
                            {exame.defeitos && (
                              <div className="md:col-span-2">
                                <span className="font-medium text-gray-700 dark:text-gray-300">Defeitos:</span>
                                <p className="text-red-600 dark:text-red-400">{exame.defeitos}</p>
                              </div>
                            )}
                            
                            {exame.observacoes && (
                              <div className="md:col-span-4">
                                <span className="font-medium text-gray-700 dark:text-gray-300">Observações:</span>
                                <p className="text-gray-600 dark:text-gray-400">{exame.observacoes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/reproducao/exames-andrologicos?edit=${exame.id}`)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  Nenhum exame andrológico registrado para este animal.
                </p>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Observações e Situação ABCZ */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Observações
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Situação ABCZ</span>
                {editingField === 'situacao_abcz' ? (
                <div className="flex gap-2 items-center">
                  <input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="text-sm border rounded px-2 py-1 w-48 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Ex: Ok para RGN"
                    autoFocus
                  />
                  <button onClick={() => salvarCampoRapido('situacao_abcz', editValue)} disabled={savingField === 'situacao_abcz'} className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50">
                    {savingField === 'situacao_abcz' ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button onClick={() => { setEditingField(null); setEditValue('') }} className="text-sm bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600">Cancelar</button>
                </div>
              ) : (
                <input
                  readOnly
                  value={animal.situacao_abcz || animal.situacaoAbcz || ''}
                  onClick={() => { setEditingField('situacao_abcz'); setEditValue(animal.situacao_abcz || animal.situacaoAbcz || '') }}
                  className="text-sm border rounded px-2 py-1 w-48 dark:bg-gray-700 dark:border-gray-600 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600"
                  placeholder="Clique para editar"
                />
              )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div>
            {editingField === 'observacoes' ? (
              <div className="space-y-2">
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full text-sm border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 min-h-[80px]"
                  placeholder="Adicione observações sobre o animal..."
                  autoFocus
                />
                <div className="flex gap-2">
                  <button onClick={() => salvarCampoRapido('observacoes', editValue)} disabled={savingField === 'observacoes'} className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50">
                    {savingField === 'observacoes' ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button onClick={() => { setEditingField(null); setEditValue('') }} className="text-sm bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600">Cancelar</button>
                </div>
              </div>
            ) : (
              <p 
                className="text-gray-900 dark:text-white whitespace-pre-wrap cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded p-2 -m-2 min-h-[2rem]"
                onClick={() => { setEditingField('observacoes'); setEditValue(animal.observacoes || '') }}
                title="Clique para editar"
              >
                {animal.observacoes ? <>{animal.observacoes} <span className="text-xs text-gray-400">✎</span></> : <span className="text-gray-500 italic">Clique para adicionar observações ✎</span>}
              </p>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Modal de Informações de Morte */}
      {showMorteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="text-red-600">💀</span>
                Informações do Óbito
              </h3>
              <button
                onClick={() => setShowMorteModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              {loadingMorte ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando informações...</p>
                </div>
              ) : infoMorte ? (
                <div className="space-y-4">
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Data do Óbito
                        </label>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {infoMorte.data_morte ? formatDate(infoMorte.data_morte) : 'Não informado'}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Causa da Morte
                        </label>
                        <p className="text-lg font-semibold text-red-700 dark:text-red-400">
                          {infoMorte.causa_morte || 'Não informado'}
                        </p>
                      </div>
                      
                      {infoMorte.valor_perda && parseFloat(infoMorte.valor_perda) > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Valor da Perda
                          </label>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            R$ {(parseFloat(infoMorte.valor_perda) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      )}
                      
                      {infoMorte.observacoes && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Observações
                          </label>
                          <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                            {infoMorte.observacoes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {infoMorte.created_at && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      Registro criado em: {infoMorte.created_at ? formatDate(infoMorte.created_at) : 'Não informado'}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400">
                    Informações de morte não encontradas
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="secondary"
                onClick={() => setShowMorteModal(false)}
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição do Card DG */}
      {editCardModal.open && editCardModal.field === 'dg' && (
        <EditDGModal
          animal={animal}
          onClose={() => setEditCardModal({ open: false, field: null })}
          onSave={(updated) => {
            setAnimal(prev => ({ ...prev, ...updated }))
            loadAnimal()
            setEditCardModal({ open: false, field: null })
            setToast({ show: true, message: 'DG atualizado com sucesso!', type: 'success' })
          }}
        />
      )}

      {/* Modal de Ocorrência Rápida */}
      <QuickOccurrenceForm
        isOpen={showQuickOccurrence}
        onClose={() => setShowQuickOccurrence(false)}
        animal={animal}
        onSuccess={() => {
          loadAnimal()
          carregarDataUltimaPesagem()
        }}
        onVenda={handleVenda}
      />

      {/* Modal de Nota Fiscal (Venda) */}
      <NotaFiscalModal
        isOpen={showNotaFiscalModal}
        onClose={() => setShowNotaFiscalModal(false)}
        onSave={handleSaveNF}
        animals={allAnimals.length > 0 ? allAnimals : (animal ? [animal] : [])}
        initialAnimal={animal}
      />

      {/* Modal de Lançamento em Lote */}
      <BatchOccurrenceForm
        isOpen={showBatchOccurrence}
        onClose={() => setShowBatchOccurrence(false)}
        onSuccess={() => {
          loadAnimal()
          carregarDataUltimaPesagem()
        }}
      />

      {/* Modal Último Serviço - ver detalhes e histórico */}
      {ultimoEvento && (
        <Modal
          isOpen={showUltimoEventoModal}
          onClose={() => setShowUltimoEventoModal(false)}
          title="Último serviço e histórico"
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-700">
              <h4 className="font-bold text-indigo-900 dark:text-indigo-100 mb-2">{ultimoEvento.labelExibicao}</h4>
              {ultimoEvento.origem === 'inseminacao' && ultimoEvento.raw && (
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  <p><span className="font-medium">Touro:</span> {ultimoEvento.raw.touro_nome || ultimoEvento.raw.touro || '-'}</p>
                  <p><span className="font-medium">Data:</span> {formatDate(ultimoEvento.raw.data_inseminacao || ultimoEvento.raw.data)}</p>
                  {ultimoEvento.raw.observacoes && <p><span className="font-medium">Obs:</span> {ultimoEvento.raw.observacoes}</p>}
                </div>
              )}
              {ultimoEvento.origem === 'dg' && ultimoEvento.raw && (
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  <p><span className="font-medium">Resultado:</span> {ultimoEvento.raw.resultado_dg || '-'}</p>
                  <p><span className="font-medium">Data:</span> {formatDate(ultimoEvento.raw.data_dg)}</p>
                </div>
              )}
              {ultimoEvento.origem === 'coleta_fiv' && ultimoEvento.raw && (
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  <p><span className="font-medium">Data:</span> {formatDate(ultimoEvento.raw.data_fiv || ultimoEvento.raw.data)}</p>
                  {ultimoEvento.raw.quantidade_oocitos != null && <p><span className="font-medium">Oócitos:</span> {ultimoEvento.raw.quantidade_oocitos}</p>}
                  {ultimoEvento.raw.laboratorio && <p><span className="font-medium">Laboratório:</span> {ultimoEvento.raw.laboratorio}</p>}
                  {ultimoEvento.raw.observacoes && <p><span className="font-medium">Obs:</span> {ultimoEvento.raw.observacoes}</p>}
                </div>
              )}
              {ultimoEvento.origem === 'transferencia_embrioes' && ultimoEvento.raw && (
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  <p><span className="font-medium">Data TE:</span> {formatDate(ultimoEvento.raw.data_te || ultimoEvento.raw.data)}</p>
                  {ultimoEvento.raw.doadora_nome && <p><span className="font-medium">Doadora:</span> {ultimoEvento.raw.doadora_nome}</p>}
                  {ultimoEvento.raw.receptora_nome && <p><span className="font-medium">Receptora:</span> {ultimoEvento.raw.receptora_nome}</p>}
                  {ultimoEvento.raw.touro && <p><span className="font-medium">Touro:</span> {ultimoEvento.raw.touro}</p>}
                </div>
              )}
              {ultimoEvento.origem === 'exame_andrologico' && ultimoEvento.raw && (
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  <p><span className="font-medium">Data:</span> {formatDate(ultimoEvento.raw.data_exame || ultimoEvento.raw.data)}</p>
                  <p><span className="font-medium">Resultado:</span> {ultimoEvento.raw.resultado || ultimoEvento.raw.status || '-'}</p>
                </div>
              )}
              {ultimoEvento.origem === 'ocorrencia' && ultimoEvento.raw && (
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  <p><span className="font-medium">Tipo:</span> {ultimoEvento.raw.tipo || '-'}</p>
                  <p><span className="font-medium">Data:</span> {formatDate(ultimoEvento.raw.data || ultimoEvento.raw.data_registro)}</p>
                  {ultimoEvento.raw.peso != null && <p><span className="font-medium">Peso:</span> {ultimoEvento.raw.peso} kg</p>}
                  {ultimoEvento.raw.ce != null && ultimoEvento.raw.ce !== '' && animal?.sexo === 'Macho' && (
                    <p><span className="font-medium">CE:</span> {ultimoEvento.raw.ce} cm</p>
                  )}
                  {ultimoEvento.raw.descricao && <p><span className="font-medium">Descrição:</span> {ultimoEvento.raw.descricao}</p>}
                  {ultimoEvento.raw.observacoes && <p><span className="font-medium">Obs:</span> {ultimoEvento.raw.observacoes}</p>}
                </div>
              )}
            </div>
            {ultimoEvento.todosEventos && ultimoEvento.todosEventos.length > 1 && (
              <>
                <h5 className="font-semibold text-gray-900 dark:text-white">Serviços recentes</h5>
                <ul className="space-y-2 max-h-48 overflow-y-auto">
                  {ultimoEvento.todosEventos.map((ev, i) => (
                    <li key={ev.id || i} className="text-sm flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <span>{ev.label} em {ev.data ? new Date(ev.data).toLocaleDateString('pt-BR') : '-'}</span>
                      {ev.origem === 'inseminacao' && ev.raw?.touro_nome && (
                        <span className="text-gray-500 text-xs">{ev.raw.touro_nome}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <div className="flex gap-2 pt-2 flex-wrap">
              <Button variant="secondary" onClick={() => setShowUltimoEventoModal(false)}>Fechar</Button>
              {ultimoEvento.origem === 'inseminacao' && (
                <Button variant="primary" onClick={() => { setShowUltimoEventoModal(false); router.push('/reproducao/inseminacao') }}>
                  Ir para Inseminações
                </Button>
              )}
              {ultimoEvento.origem === 'coleta_fiv' && (
                <Button variant="primary" onClick={() => { setShowUltimoEventoModal(false); router.push('/reproducao/coleta-fiv') }}>
                  Ir para Coleta FIV
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Link para Relatório */}
      <div className="mt-4 text-center">
        <Button
          variant="secondary"
          onClick={() => router.push('/relatorios/ocorrencias')}
          className="flex items-center gap-2 mx-auto"
        >
          <DocumentArrowDownIcon className="h-4 w-4" />
          Ver Relatório de Ocorrências
        </Button>
      </div>

      {/* Toast de feedback ao salvar */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-[9999]">
          <ToastUI
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(prev => ({ ...prev, show: false }))}
          />
        </div>
      )}

      {/* Modal de Detalhes da Reprodução */}
      {showReproducaoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full border border-white/10">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Detalhes da Reprodução</h3>
                <button
                  onClick={() => setShowReproducaoModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {(() => {
                  const dataCoberturaRef = gestacaoAtual?.data_cobertura || animal.dataTE || animal.data_te || ultimaIA?.data_ia || ultimaIA?.data_inseminacao
                  const dataCobertura = dataCoberturaRef ? new Date(dataCoberturaRef) : null
                  const statusPrenha = (s) => {
                  if (!s) return false
                  const u = String(s).toUpperCase().trim()
                  return u === 'PRENHA' || u === 'P' || u.includes('PRENHA') || u.includes('POSITIVO')
                }
                const resultadoPrenha = (animal.resultadoDG === 'Prenha' || animal.resultado_dg === 'Prenha' || statusPrenha(animal.resultadoDG) || statusPrenha(animal.resultado_dg)) || (gestacaoAtual?.situacao === 'Em Gestação' || gestacaoAtual?.situacao === 'Ativa') || statusPrenha(ultimaIA?.status_gestacao) || statusPrenha(ultimaIA?.statusGestacao) || statusPrenha(ultimaIA?.resultado_dg) || statusPrenha(ultimaIA?.resultadoDg)
                  const touroNome = ultimaIA?.touro_nome || ultimaIA?.touro || gestacaoAtual?.touro_nome || animal.touro || 'Não informado'
                  const tipoCobertura = ultimaIA?.tipo || gestacaoAtual?.tipo_cobertura || (animal.dataTE || animal.data_te ? 'TE' : 'IA')

                  return (
                    <>
                      {/* Situação Atual */}
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          Situação Atual
                        </label>
                        <p className="text-lg font-semibold text-white">
                          {(() => {
                            if (resultadoPrenha && dataCobertura) {
                              const previsao = new Date(dataCobertura.getTime() + 285 * 24 * 60 * 60 * 1000)
                              const diasRestantes = Math.max(0, Math.floor((previsao - new Date()) / (1000 * 60 * 60 * 24)))
                              return `Prenha - ${diasRestantes} dias para o parto`
                            }
                            if (resultadoPrenha) return 'Prenha'
                            if (gestacaoAtual?.situacao === 'Nascido' || gestacaoAtual?.situacao === 'Parida') return 'Parida'
                            if (ultimaIA && !animal.data_dg && !animal.dataDG) return 'Inseminada - Aguardando DG'
                            return 'Vazia'
                          })()}
                        </p>
                      </div>

                      {/* Data da IA/TE */}
                      {dataCobertura && (
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Data da {tipoCobertura}
                          </label>
                          <p className="text-lg font-semibold text-white">
                            {dataCobertura.toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      )}

                      {/* Touro */}
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          Touro
                        </label>
                        <p className="text-lg font-semibold text-white">
                          {touroNome}
                        </p>
                      </div>

                      {/* Previsão de Parto */}
                      {resultadoPrenha && dataCobertura && (
                        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 border border-blue-400/30">
                          <label className="block text-sm font-medium text-blue-300 mb-2">
                            Previsão de Parto
                          </label>
                          <p className="text-2xl font-bold text-white">
                            {new Date(dataCobertura.getTime() + 285 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-sm text-blue-200 mt-1">
                            {Math.max(0, Math.floor((new Date(dataCobertura.getTime() + 285 * 24 * 60 * 60 * 1000) - new Date()) / (1000 * 60 * 60 * 24)))} dias restantes
                          </p>
                        </div>
                      )}

                      {/* Data do DG */}
                      {(animal.data_dg || animal.dataDG) && (
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Data do Diagnóstico de Gestação
                          </label>
                          <p className="text-lg font-semibold text-white">
                            {new Date(animal.data_dg || animal.dataDG).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      )}

                      {/* Tipo de Cobertura */}
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          Tipo de Cobertura
                        </label>
                        <p className="text-lg font-semibold text-white">
                          {tipoCobertura === 'TE' ? 'Transferência de Embrião' : 'Inseminação Artificial'}
                        </p>
                      </div>
                    </>
                  )
                })()}
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setShowReproducaoModal(false)}
                >
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  )
}
