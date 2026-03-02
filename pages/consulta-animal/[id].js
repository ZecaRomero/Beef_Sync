/**
 * Ficha do Animal - Modo Consulta (somente leitura)
 * Usado quando o usuário acessa via /a - sem edição, sem sidebar
 * Inclui: machos = exames andrológicos | fêmeas = FIV, inseminações, gestações
 */
import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  UserIcon,
  CurrencyDollarIcon,
  BeakerIcon,
  HeartIcon,
  MapPinIcon,
  AcademicCapIcon,
  CubeTransparentIcon,
  ScaleIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  ClockIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowTopRightOnSquareIcon,
  TrophyIcon,
  SparklesIcon,
  MoonIcon,
  SunIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

function formatDate(d) {
  if (!d) return '-'
  const dt = new Date(d)
  return isNaN(dt.getTime()) ? '-' : dt.toLocaleDateString('pt-BR')
}

function calcularMesesIdade(dataNascimento, mesesCampo) {
  if (mesesCampo != null && !isNaN(parseInt(mesesCampo))) return parseInt(mesesCampo)
  if (!dataNascimento) return null
  const dt = new Date(dataNascimento)
  if (isNaN(dt.getTime())) return null
  return Math.floor((new Date() - dt) / (1000 * 60 * 60 * 24 * 30.44))
}

function formatCurrency(v) {
  if (v == null || v === '') return '-'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(v))
}

// Filtrar nomes de touros que aparecem como localização (C2747 DA S.NICE, NACION 15397, etc.)
function localizacaoValidaParaExibir(loc) {
  if (!loc || typeof loc !== 'string') return null
  const n = loc.trim()
  if (!n || /^(VAZIO|NÃO INFORMADO|NAO INFORMADO|-)$/i.test(n)) return null
  if (/^PIQUETE\s+(\d+|CABANHA|CONF|GUARITA|PISTA)$/i.test(n)) return loc
  if (/^PROJETO\s+[\dA-Za-z\-/]+$/i.test(n)) return loc
  if (/^CONFINA$/i.test(n)) return loc
  if (/^PIQ\s+\d+$/i.test(n)) return loc.replace(/^PIQ\s+/i, 'PIQUETE ')
  // Abreviações comuns de importação: CABANHA, GUARITA, PISTA, CONF
  if (/^(CABANHA|GUARITA|PISTA|CONF)$/i.test(n)) return loc
  return null // Nome de touro ou inválido
}

export default function ConsultaAnimalView({ darkMode = false, toggleDarkMode }) {
  const router = useRouter()
  const { id } = router.query
  const [animal, setAnimal] = useState(null)
  const [examesAndrologicos, setExamesAndrologicos] = useState([])
  const [ocorrencias, setOcorrencias] = useState([])
  const [transferencias, setTransferencias] = useState([])
  const [ultimoCE, setUltimoCE] = useState(null)
  const [ultimaIA, setUltimaIA] = useState(null)
  const [inseminacoesFetch, setInseminacoesFetch] = useState(null)
  const [previsaoPartoIA, setPrevisaoPartoIA] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [secoesExpandidas, setSecoesExpandidas] = useState({
    fiv: true, inseminacoes: true, gestacoes: true, exames: true,
    filhos: true, protocolos: true, pesagens: true, localizacoes: true, custos: true,
    ocorrencias: true, transferencias: true
  })
  const [rankingPosicao, setRankingPosicao] = useState(null) // 1 = primeiro do ranking
  const [rankingPosicaoGenetica2, setRankingPosicaoGenetica2] = useState(null)
  const [filhoTopRanking, setFilhoTopRanking] = useState(null) // { serie, rg, nome } quando esta fêmea é mãe do 1º do ranking
  const [showIABCZInfo, setShowIABCZInfo] = useState(false)
  const [sharing, setSharing] = useState(false)
  const toggleSecao = useCallback((key) => {
    setSecoesExpandidas(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])
  const handleCopyIdent = useCallback(() => {
    const t = `${animal.serie || ''} ${animal.rg || ''}`.trim()
    if (!t) return
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(t).then(() => {
        alert('Identificação copiada')
      }).catch(() => {})
    }
  }, [animal?.serie, animal?.rg])
  const handleWhatsAppShare = useCallback(() => {
    const locAtiva = animal.localizacoes?.find(l => !l.data_saida)
    const locMaisRecente = animal.localizacoes?.[0]
    const locBruto = locAtiva?.piquete || locMaisRecente?.piquete || animal.piquete_atual || animal.piqueteAtual || animal.localizacao_atual
    const locFiltrada = localizacaoValidaParaExibir(locBruto) || (locBruto ? 'Não informado' : null)
    const texto = [
      `Animal: ${animal.nome || `${animal.serie || ''} ${animal.rg || ''}`.trim() || '-'}`,
      `Identificação: ${animal.serie || '-'} ${animal.rg || '-'}`,
      animal.sexo ? `Sexo: ${animal.sexo}` : null,
      animal.raca ? `Raça: ${animal.raca}` : null,
      (animal.data_nascimento ? `Idade: ${Math.floor((new Date() - new Date(animal.data_nascimento)) / (1000 * 60 * 60 * 24 * 30.44))} meses` : null),
      animal.peso ? `Peso: ${animal.peso} kg` : null,
      (animal.abczg || animal.abczg === 0) ? `iABCZ: ${animal.abczg}${filhoTopRanking ? ' • Mãe do 1º do ranking' : rankingPosicao ? ` • ${rankingPosicao}º no ranking` : ''}` : null,
      (animal.genetica_2 || animal.genetica_2 === 0) ? `IQG: ${animal.genetica_2}${rankingPosicaoGenetica2 ? ` • ${rankingPosicaoGenetica2}º no ranking` : ''}` : null,
      (animal.decile_2 || animal.decile_2 === 0) ? `Pt IQG: ${animal.decile_2}` : null,
      locFiltrada ? `Localização: ${locFiltrada}` : null
    ].filter(Boolean).join('\n')
    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`
    window.open(url, '_blank')
  }, [animal, rankingPosicao, rankingPosicaoGenetica2, filhoTopRanking])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    // Limpar TODOS os estados ao trocar de animal
    setAnimal(null)
    setExamesAndrologicos([])
    setOcorrencias([])
    setTransferencias([])
    setUltimoCE(null)
    setUltimaIA(null)
    setInseminacoesFetch(null)
    setPrevisaoPartoIA(null)
    setRankingPosicao(null)
    setRankingPosicaoGenetica2(null)
    setFilhoTopRanking(null)
    
    fetch(`/api/animals/${id}?history=true`)
      .then((r) => r.json())
      .then((data) => {
        const a = data.data || data.animal || data
        if (a && (a.id || a.serie)) {
          setAnimal(a)
          const isMacho = a.sexo && (String(a.sexo).toLowerCase().includes('macho') || a.sexo === 'M')
          if (isMacho && a.rg) {
            return fetch(`/api/reproducao/exames-andrologicos?rg=${encodeURIComponent(a.rg)}`)
              .then(r2 => r2.json())
              .then(d2 => {
                const list = d2.data ?? d2 ?? []
                setExamesAndrologicos(Array.isArray(list) ? list : [])
              })
              .catch(() => {})
          }
        } else {
          setError('Animal não encontrado')
        }
      })
      .catch(() => setError('Erro ao carregar. Verifique sua conexão.'))
      .finally(() => setLoading(false))
  }, [id])

  // Buscar posição no ranking iABCZ e verificar se é mãe do 1º do ranking
  useEffect(() => {
    if (!animal?.id) return
    setFilhoTopRanking(null)
    fetch('/api/animals/ranking-iabcz?limit=50')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data?.length) {
          const ranking = d.data
          const primeiroRanking = ranking[0]
          const idx = ranking.findIndex(r =>
            r.id === animal.id || (String(r.rg) === String(animal.rg) && String(r.serie || '').toUpperCase() === String(animal.serie || '').toUpperCase())
          )
          if (idx >= 0) setRankingPosicao(idx + 1)
          // Verificar se esta fêmea é mãe do 1º do ranking (filho mais bem avaliado)
          const filhos = animal.filhos || []
          const filhoEhPrimeiro = filhos.some(f =>
            f.id === primeiroRanking?.id ||
            (String(f.rg) === String(primeiroRanking?.rg) && String(f.serie || '').toUpperCase() === String(primeiroRanking?.serie || '').toUpperCase())
          )
          if (filhoEhPrimeiro && primeiroRanking) {
            setFilhoTopRanking({
              serie: primeiroRanking.serie,
              rg: primeiroRanking.rg,
              nome: primeiroRanking.nome
            })
          }
        }
      })
      .catch(() => {})
  }, [animal?.id, animal?.rg, animal?.serie, animal?.filhos])

  // Buscar posição no ranking IQG (Genética 2)
  useEffect(() => {
    if (!animal?.id || !(animal.genetica_2 || animal.genetica_2 === 0)) return
    fetch('/api/animals/ranking-genetica-2?limit=50')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data?.length) {
          const idx = d.data.findIndex(r =>
            r.id === animal.id || (String(r.rg) === String(animal.rg) && String(r.serie || '').toUpperCase() === String(animal.serie || '').toUpperCase())
          )
          if (idx >= 0) setRankingPosicaoGenetica2(idx + 1)
        }
      })
      .catch(() => {})
  }, [animal?.id, animal?.rg, animal?.serie, animal?.genetica_2])

  // Buscar C.E - prioridade: pesagens > ocorrências > exames andrológicos
  useEffect(() => {
    if (!animal?.id) return
    const isMacho = animal.sexo && (String(animal.sexo).toLowerCase().includes('macho') || animal.sexo === 'M')
    if (!isMacho) return

    // 1. CE das pesagens (mais recente com CE) - já vem no animal
    const pesagensComCE = (animal.pesagens || [])
      .filter(p => p.ce != null && parseFloat(p.ce) > 0)
      .sort((a, b) => new Date(b.data) - new Date(a.data))
    if (pesagensComCE.length > 0) {
      setUltimoCE(pesagensComCE[0].ce)
      return
    }

    // 2. CE das ocorrências
    fetch(`/api/animals/ocorrencias?animalId=${animal.id}`)
      .then(r => r.json())
      .then(data => {
        const occ = data.ocorrencias || data.data || data || []
        const ocorrenciasComCE = occ
          .filter(o => o.ce && parseFloat(o.ce) > 0)
          .sort((a, b) => new Date(b.data || b.data_registro) - new Date(a.data || a.data_registro))
        if (ocorrenciasComCE.length > 0) {
          setUltimoCE(ocorrenciasComCE[0].ce)
        }
      })
      .catch(() => {})
  }, [animal?.id, animal?.sexo, animal?.pesagens])

  // CE do exame andrológico (quando não veio de pesagens/ocorrências)
  useEffect(() => {
    if (!animal?.id || ultimoCE) return
    const isMacho = animal.sexo && (String(animal.sexo).toLowerCase().includes('macho') || animal.sexo === 'M')
    if (!isMacho || examesAndrologicos.length === 0) return
    const ex = examesAndrologicos.find(e => e.ce != null && parseFloat(e.ce) > 0)
    if (ex) setUltimoCE(ex.ce)
  }, [animal?.id, animal?.sexo, examesAndrologicos, ultimoCE])

  // Buscar IAs e calcular previsão de parto para fêmeas
  // Priorizar: 1) IA prenha, 2) IA não-vazia (ignorar vazias), 3) última cronológica
  useEffect(() => {
    if (!animal?.id) return
    const isFemea = animal.sexo && (String(animal.sexo).toLowerCase().includes('f') || animal.sexo === 'F' || String(animal.sexo).toLowerCase().includes('femea'))
    if (!isFemea) {
      setInseminacoesFetch(null)
      return
    }

    fetch(`/api/inseminacoes?animal_id=${animal.id}`)
      .then(r => r.json())
      .then(data => {
        const inseminacoes = data.data || data || []
        setInseminacoesFetch(inseminacoes)
        if (inseminacoes.length > 0) {
          const ordenadas = [...inseminacoes].sort((a, b) => {
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
          const iaPrenha = ordenadas.find(ehPrenha)
          const naoVazias = ordenadas.filter(ia => !ehVazia(ia))
          const iaParaExibir = iaPrenha || naoVazias[0] || ordenadas[0]
          setUltimaIA(iaParaExibir)
          const dataFonte = iaPrenha || iaParaExibir
          const dataIAStr = dataFonte.data_ia || dataFonte.data_inseminacao || dataFonte.data
          const dataIA = new Date(dataIAStr)
          if ((iaPrenha || naoVazias[0]) && !isNaN(dataIA.getTime())) {
            setPrevisaoPartoIA(new Date(dataIA.getTime() + 285 * 24 * 60 * 60 * 1000))
          } else {
            setPrevisaoPartoIA(null)
          }
        } else {
          setInseminacoesFetch([])
        }
      })
      .catch(() => setInseminacoesFetch([]))
  }, [animal?.id, animal?.sexo])

  // Buscar ocorrências (histórico de serviços, vacinas, etc.)
  useEffect(() => {
    if (!animal?.id) return
    fetch(`/api/animals/ocorrencias?animalId=${animal.id}&limit=20`)
      .then(r => r.json())
      .then(data => {
        const occ = data.ocorrencias || data.data || data || []
        setOcorrencias(Array.isArray(occ) ? occ : [])
      })
      .catch(() => setOcorrencias([]))
  }, [animal?.id])

  // Buscar transferências de embriões (receptoras)
  useEffect(() => {
    if (!animal?.id) return
    fetch(`/api/transferencias-embrioes?receptora_id=${animal.id}`)
      .then(r => r.json())
      .then(data => {
        const te = data.data || data.transferencias || data || []
        setTransferencias(Array.isArray(te) ? te : [])
      })
      .catch(() => setTransferencias([]))
  }, [animal?.id])

  if (loading) {
    return (
      <>
        <Head>
          <title>Carregando... | Beef-Sync</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        </Head>
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6 bg-gray-50 dark:bg-gray-900">
          <span className="animate-spin rounded-full h-10 w-10 border-2 border-amber-500 border-t-transparent" />
          <p className="mt-4 text-gray-500 dark:text-gray-400">Carregando...</p>
        </div>
      </>
    )
  }

  if (error || !animal) {
    return (
      <>
        <Head>
          <title>Erro | Beef-Sync</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        </Head>
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6 bg-gray-50 dark:bg-gray-900">
          <p className="text-red-600 dark:text-red-400 text-center mb-6">{error || 'Animal não encontrado'}</p>
          <Link
            href="/a?buscar=1"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Nova Consulta
          </Link>
        </div>
      </>
    )
  }

  const nome = animal.nome || `${animal.serie || ''} ${animal.rg || ''}`.trim() || '-'
  const custosArray = Array.isArray(animal.custos) ? animal.custos : []
  const custoTotal = custosArray.reduce((s, c) => s + parseFloat(c.valor || 0), 0)
  const custosPorTipo = custosArray.reduce((acc, c) => {
    const t = c.tipo || c.subtipo || 'Outros'
    acc[t] = (acc[t] || 0) + parseFloat(c.valor || 0)
    return acc
  }, {})

  // Idade em meses e anos
  const mesesIdade = animal.data_nascimento ? Math.floor((new Date() - new Date(animal.data_nascimento)) / (1000 * 60 * 60 * 24 * 30.44)) : null
  const anosIdade = mesesIdade != null ? (mesesIdade / 12).toFixed(1) : null
  
  // Calcular dias adicionais além dos meses completos
  const diasAdicionais = animal.data_nascimento ? (() => {
    const dataNasc = new Date(animal.data_nascimento)
    const hoje = new Date()
    const totalDias = Math.floor((hoje - dataNasc) / (1000 * 60 * 60 * 24))
    const diasEmMeses = Math.floor(mesesIdade * 30.44)
    return totalDias - diasEmMeses
  })() : null

  // Dias na fazenda
  const dataChegada = animal.data_chegada || animal.dataChegada
  const diasNaFazenda = dataChegada ? Math.floor((new Date() - new Date(dataChegada)) / (1000 * 60 * 60 * 24)) : null

  // Macho ou Fêmea (declarar antes de elegivelBrucelose/precisaBrucelose)
  const isMacho = animal.sexo && (String(animal.sexo).toLowerCase().includes('macho') || animal.sexo === 'M')
  const isFemea = animal.sexo && (String(animal.sexo).toLowerCase().includes('fêmea') || String(animal.sexo).toLowerCase().includes('femea') || animal.sexo === 'F')

  // Idade em dias (para regras Brucelose e DGT)
  const idadeDias = animal.data_nascimento ? Math.floor((new Date() - new Date(animal.data_nascimento)) / (1000 * 60 * 60 * 24)) : null
  const temBrucelose = custosArray.some(c => {
    const t = String(c.tipo || '').toLowerCase()
    const s = String(c.subtipo || '').toLowerCase()
    const o = String(c.observacoes || '').toLowerCase()
    return (t.includes('vacina') || t.includes('vacinação')) && (s.includes('brucelose') || o.includes('brucelose'))
  })
  const elegivelBrucelose = isFemea && idadeDias != null && idadeDias >= 90 && idadeDias <= 240 && !temBrucelose
  const precisaBrucelose = isFemea && idadeDias != null && idadeDias <= 240 && !temBrucelose
  const elegivelDGT = idadeDias != null && idadeDias >= 330 && idadeDias <= 640

  // Gestação: dias de gestação e countdown
  const dataTE = animal.data_te || animal.dataTE
  const inseminacoesParaExibir = inseminacoesFetch ?? animal.inseminacoes ?? []
  const iaPrenhaLocal = inseminacoesParaExibir.find(ia => {
    const r = String(ia.resultado_dg || ia.status_gestacao || '').toLowerCase()
    if (r.includes('vazia') || r.includes('vazio') || r.includes('negativo')) return false
    return r.includes('prenha') || r.includes('pren') || r.includes('positivo') || r.trim() === 'p'
  })
  const dataCobertura = dataTE || (iaPrenhaLocal?.data_ia || iaPrenhaLocal?.data_inseminacao || iaPrenhaLocal?.data)
  const resultadoAnimal = String(animal.resultado_dg || animal.resultadoDG || '').toLowerCase()
  const estaVazia = resultadoAnimal.includes('vazia') || resultadoAnimal.includes('vazio') || resultadoAnimal.includes('negativo')
  // Prenhez: animal.resultado_dg OU IA com resultado prenha. IA prenha tem prioridade quando há conflito (ex: animal DG vazio mas IA prenha)
  const isPrenha = !!iaPrenhaLocal || (
    !estaVazia && (
      resultadoAnimal.includes('prenha') || resultadoAnimal.includes('pren') || resultadoAnimal.includes('positivo') || resultadoAnimal.trim() === 'p'
    )
  )
  const diasGestacao = (isPrenha && dataCobertura) ? Math.floor((new Date() - new Date(dataCobertura)) / (1000 * 60 * 60 * 24)) : null
  const previsaoParto = (isPrenha && dataCobertura) ? new Date(new Date(dataCobertura).getTime() + 285 * 24 * 60 * 60 * 1000) : null
  // Só exibir previsão quando prenha (nunca quando Vazia)
  const previsaoPartoExibir = isPrenha
    ? ((previsaoParto && !isNaN(previsaoParto.getTime())) ? previsaoParto : (previsaoPartoIA && !isNaN(previsaoPartoIA?.getTime()) ? previsaoPartoIA : null))
    : null
  const diasParaParto = previsaoPartoExibir ? Math.max(0, Math.floor((previsaoPartoExibir - new Date()) / (1000 * 60 * 60 * 24))) : null

  // Evolução de peso (última vs primeira)
  const pesagens = animal.pesagens || []
  const ultimaPesagem = pesagens[0]
  const primeiraPesagem = pesagens[pesagens.length - 1]
  const evolucaoPeso = (ultimaPesagem?.peso && primeiraPesagem?.peso && pesagens.length > 1)
    ? (parseFloat(ultimaPesagem.peso) - parseFloat(primeiraPesagem.peso)).toFixed(1)
    : null

  // Média de oócitos (doadoras)
  const totalOocitos = animal.fivs?.reduce((s, f) => s + (parseInt(f.quantidade_oocitos) || 0), 0) || 0
  const mediaOocitos = (animal.fivs?.length > 0 && totalOocitos > 0)
    ? (totalOocitos / animal.fivs.length).toFixed(1)
    : null

  const aptaReproducao = isFemea && mesesIdade >= 15 && !isPrenha && !(animal.data_te || animal.dataTE)

  // Taxa de sucesso reprodutivo (fêmeas)
  const totalIAs = inseminacoesParaExibir?.length || 0
  const prenhas = inseminacoesParaExibir?.filter(ia =>
    String(ia.resultado_dg || '').toLowerCase().includes('prenha')
  ).length || 0
  const taxaSucessoIA = totalIAs > 0 ? Math.round((prenhas / totalIAs) * 100) : null

  // Último exame andrológico há X dias (machos)
  const ultExame = examesAndrologicos[0]
  const diasDesdeExame = ultExame?.data_exame
    ? Math.floor((new Date() - new Date(ultExame.data_exame)) / (1000 * 60 * 60 * 24))
    : null

  // Próximo exame andrológico (30 dias após o último, quando Inapto)
  const isInapto = ultExame && String(ultExame.resultado || '').toUpperCase().includes('INAPTO')
  const dataProximoExame = (isInapto && ultExame?.data_exame)
    ? new Date(new Date(ultExame.data_exame).getTime() + 30 * 24 * 60 * 60 * 1000)
    : null
  const diasParaProximoExame = dataProximoExame
    ? Math.floor((dataProximoExame - new Date()) / (1000 * 60 * 60 * 24))
    : null

  // Linha do tempo: eventos recentes (preferir IAs válidas; incluir data_ia/data_inseminacao)
  const eventos = []
  const iasValidas = (inseminacoesParaExibir || []).filter(ia => ia.valida !== false)
  const iasParaTimeline = iasValidas.length > 0 ? iasValidas : (inseminacoesParaExibir || [])
  iasParaTimeline.slice(0, 3).forEach(ia => {
    const d = ia.data_ia || ia.data_inseminacao || ia.data
    if (d) eventos.push({ data: d, tipo: 'IA', label: `Inseminação - ${ia.touro_nome || ia.touro}` })
  })
  animal.fivs?.slice(0, 2).forEach(f => eventos.push({ data: f.data_fiv, tipo: 'FIV', label: `Coleta - ${f.quantidade_oocitos} oócitos` }))
  // Removido pesagens da timeline para evitar repetição com a seção Pesagens
  examesAndrologicos.slice(0, 2).forEach(ex => eventos.push({ data: ex.data_exame, tipo: 'Andrológico', label: ex.resultado }))
  ocorrencias.slice(0, 3).forEach(oc => eventos.push({ data: oc.data || oc.data_registro, tipo: 'Ocorrência', label: oc.tipo || oc.descricao || 'Registro' }))
  const timeline = eventos
    .filter(e => e.data)
    .sort((a, b) => new Date(b.data) - new Date(a.data))
    .slice(0, 8)

  // Localização atual: priorizar histórico onde data_saida IS NULL; fallback para mais recente e campos do animal
  const locAtiva = animal.localizacoes?.find(l => !l.data_saida)
  const locMaisRecente = animal.localizacoes?.[0]
  const locBruto = locAtiva?.piquete
    || locMaisRecente?.piquete
    || animal.piquete_atual
    || animal.piqueteAtual
    || animal.pasto_atual
    || animal.pastoAtual
    || (typeof animal.localizacao_atual === 'object' ? animal.localizacao_atual?.piquete : null)
    || animal.localizacao_atual
  const locAtual = localizacaoValidaParaExibir(locBruto) || (locBruto ? 'Não informado' : null)
  const resumoChips = [
    animal.situacao,
    animal.sexo,
    animal.raca,
    animal.pelagem,
    animal.categoria,
    locAtual ? `📍 ${locAtual}` : null,
    animal.brinco ? `🏷️ ${animal.brinco}` : null
  ].filter(Boolean)
  const quicks = [
    isPrenha && diasParaParto != null ? { k: 'Parto', v: `${diasParaParto}d` } : null,
    custoTotal > 0 ? { k: 'Custos', v: formatCurrency(custoTotal) } : null,
    diasNaFazenda != null && diasNaFazenda > 0 ? { k: 'Fazenda', v: `${diasNaFazenda}d` } : null,
    animal.filhos?.length > 0 ? { k: 'Crias', v: animal.filhos.length } : null
  ].filter(Boolean)
  const gestacaoProgress = diasGestacao != null ? Math.min(100, Math.max(0, Math.round((diasGestacao / 285) * 100))) : null
  const exameProgress = diasParaProximoExame != null ? Math.min(100, Math.max(0, Math.round(((30 - Math.max(0, diasParaProximoExame)) / 30) * 100))) : null

  const handleShareSummary = async () => {
    try {
      setSharing(true)
      const texto = [
        `🐂 FICHA DO ANIMAL - ${nome}`,
        ``,
        `📋 IDENTIFICAÇÃO`,
        `Série/RG: ${animal.serie || '-'} ${animal.rg || '-'}`,
        animal.brinco ? `Brinco: ${animal.brinco}` : null,
        animal.tatuagem ? `Tatuagem: ${animal.tatuagem}` : null,
        ``,
        `📊 DADOS GERAIS`,
        animal.sexo ? `Sexo: ${animal.sexo}` : null,
        animal.raca ? `Raça: ${animal.raca}` : null,
        animal.pelagem ? `Pelagem: ${animal.pelagem}` : null,
        mesesIdade != null ? `Idade: ${mesesIdade} meses${anosIdade ? ` (${anosIdade} anos)` : ''}` : null,
        animal.peso ? `Peso: ${animal.peso} kg` : null,
        evolucaoPeso != null ? `Evolução de peso: ${parseFloat(evolucaoPeso) >= 0 ? '+' : ''}${evolucaoPeso} kg` : null,
        ``,
        `🏆 AVALIAÇÃO GENÉTICA`,
        (animal.abczg || animal.abczg === 0) ? `iABCZ: ${animal.abczg}${filhoTopRanking ? ' • Mãe do 1º do ranking' : rankingPosicao ? ` • ${rankingPosicao}º no ranking` : ''}` : null,
        (animal.deca || animal.deca === 0) ? `DECA: ${animal.deca}` : null,
        (animal.genetica_2 || animal.genetica_2 === 0) ? `IQG: ${animal.genetica_2}${rankingPosicaoGenetica2 ? ` • ${rankingPosicaoGenetica2}º no ranking` : ''}` : null,
        (animal.decile_2 || animal.decile_2 === 0) ? `Pt IQG: ${animal.decile_2}` : null,
        ``,
        `📍 LOCALIZAÇÃO`,
        locAtual ? `Atual: ${locAtual}` : null,
        diasNaFazenda != null && diasNaFazenda > 0 ? `Tempo na fazenda: ${diasNaFazenda} dias` : null,
        ``,
        `👨‍👩‍👧 GENEALOGIA`,
        animal.mae ? `Mãe: ${animal.mae}` : null,
        animal.pai ? `Pai: ${animal.pai}` : null,
        animal.avo_materno || animal.avoMaterno ? `Avô materno: ${animal.avo_materno || animal.avoMaterno}` : null,
        ``,
        isMacho && ultimoCE ? `🔬 C.E: ${ultimoCE} cm` : null,
        isMacho && ultExame ? `Exame andrológico: ${ultExame.resultado}${diasDesdeExame != null ? ` (há ${diasDesdeExame} dias)` : ''}` : null,
        ``,
        isFemea && isPrenha && previsaoPartoExibir ? `🤰 GESTAÇÃO` : null,
        isFemea && isPrenha && diasGestacao != null ? `Dias de gestação: ${diasGestacao}` : null,
        isFemea && isPrenha && previsaoPartoExibir ? `Previsão de parto: ${previsaoPartoExibir.toLocaleDateString('pt-BR')} (${diasParaParto} dias)` : null,
        ``,
        isFemea && inseminacoesParaExibir?.length > 0 ? `💉 REPRODUÇÃO` : null,
        isFemea && inseminacoesParaExibir?.length > 0 ? `Inseminações: ${inseminacoesParaExibir.length}` : null,
        isFemea && taxaSucessoIA != null ? `Taxa de prenhez: ${taxaSucessoIA}%` : null,
        isFemea && animal.fivs?.length > 0 ? `Coletas FIV: ${animal.fivs.length} (${totalOocitos} oócitos)` : null,
        ``,
        animal.filhos?.length > 0 ? `👶 Crias: ${animal.filhos.length}` : null,
        ``,
        animal.pesagens?.length > 0 ? `⚖️ Pesagens: ${animal.pesagens.length}` : null,
        animal.protocolos?.length > 0 ? `💊 Protocolos sanitários: ${animal.protocolos.length}` : null,
        ``,
        custoTotal > 0 ? `💰 CUSTOS` : null,
        custoTotal > 0 ? `Total: ${formatCurrency(custoTotal)} (${custosArray.length} lançamentos)` : null,
        ``,
        animal.observacoes ? `📝 Observações: ${animal.observacoes}` : null
      ].filter(Boolean).join('\n')
      if (navigator.share) {
        await navigator.share({
          title: 'Ficha do Animal - Beef-Sync',
          text: texto
        })
      } else {
        await navigator.clipboard.writeText(texto)
        alert('Resumo completo copiado para a área de transferência')
      }
    } catch (e) {
      alert('Não foi possível compartilhar agora')
    } finally {
      setSharing(false)
    }
  }
  

  return (
    <>
      <Head>
        <title>{nome} | Consulta Beef-Sync</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
        {/* Header fixo */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800/95 border-b border-gray-200 dark:border-gray-700 px-4 py-3 backdrop-blur-sm">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <Link
              href="/a?buscar=1"
              className="flex items-center gap-2 text-amber-600 dark:text-amber-500 font-semibold"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              Voltar
            </Link>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleDarkMode?.()}
                className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title={darkMode ? 'Modo claro' : 'Modo escuro'}
              >
                {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">Modo consulta</span>
            </div>
          </div>
        </div>
        <div className="sticky top-12 z-10 bg-white/90 dark:bg-gray-800/90 border-b border-gray-200 dark:border-gray-700 px-4 py-2 backdrop-blur-sm">
          <div className="max-w-lg mx-auto flex flex-wrap gap-2">
            {resumoChips.slice(0, 3).map((c, i) => (
              <span key={i} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                {c}
              </span>
            ))}
            {(animal.abczg || animal.abczg === 0) && (
              <button
                type="button"
                onClick={() => setShowIABCZInfo(true)}
                className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                  rankingPosicao === 1
                    ? 'bg-amber-100 border-amber-400 text-amber-700 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-200'
                    : rankingPosicao && rankingPosicao <= 10
                    ? 'bg-blue-100 border-blue-400 text-blue-700 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-200'
                    : 'bg-white border-gray-300 text-gray-800 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200'
                }`}
              >
                iABCZ {animal.abczg}{filhoTopRanking ? ' • Mãe do 1º' : rankingPosicao ? ` • ${rankingPosicao}º` : ''}
              </button>
            )}
          </div>
        </div>
        {quicks.length > 0 && (
          <div className="px-4 py-2 bg-white/80 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-lg mx-auto overflow-x-auto">
              <div className="flex items-center gap-2 w-max">
                {quicks.slice(0, 4).map((q, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600">
                    {q.k}: {q.v}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
          {/* Destaque: Mãe do animal mais bem avaliado do PMGZ */}
          {filhoTopRanking && (
            <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 rounded-2xl shadow-xl p-6 text-white border-2 border-emerald-400/50 ring-4 ring-emerald-400/30">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-white/20 backdrop-blur">
                  <UserGroupIcon className="h-12 w-12 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold tracking-wider opacity-90">MÃE DO ANIMAL MAIS BEM AVALIADO</p>
                  <p className="text-2xl font-bold mt-0.5">Filho(a) em 1º lugar no Ranking iABCZ do PMGZ</p>
                  <p className="text-sm mt-1 opacity-90 flex items-center gap-1">
                    <SparklesIcon className="h-4 w-4" />
                    Filho(a): {filhoTopRanking.serie} {filhoTopRanking.rg}
                    {filhoTopRanking.nome && ` • ${filhoTopRanking.nome}`}
                  </p>
                </div>
                <Link
                  href={`/consulta-animal/${filhoTopRanking.serie}-${filhoTopRanking.rg}`}
                  className="hidden sm:flex w-16 h-16 rounded-full bg-white/20 items-center justify-center text-2xl font-black hover:bg-white/30 transition-colors"
                >
                  🏆
                </Link>
              </div>
            </div>
          )}

          {/* Destaque: 1º do Ranking iABCZ (apenas quando o próprio animal é o 1º, não a mãe dele) */}
          {rankingPosicao === 1 && !filhoTopRanking && (
            <div className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 rounded-2xl shadow-xl p-6 text-white border-2 border-amber-300/50 ring-4 ring-amber-400/30">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-white/20 backdrop-blur">
                  <TrophyIcon className="h-12 w-12 text-amber-100" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold tracking-wider opacity-90">1º LUGAR NO RANKING === iABCZ</p>
                  <p className="text-2xl font-bold mt-0.5">Animal mais bem avaliado do rebanho</p>
                  <p className="text-sm mt-1 opacity-90 flex items-center gap-1">
                    <SparklesIcon className="h-4 w-4" />
                    iABCZ: {animal.abczg || '-'} • Animal Bem Avaliado(a) no Ranking iABCZ
                  </p>
                </div>
                <div className="hidden sm:flex w-16 h-16 rounded-full bg-white/20 items-center justify-center text-3xl font-black">
                  1º
                </div>
              </div>
            </div>
          )}

          {/* Badge posição 2 ou 3 no ranking */}
          {rankingPosicao === 2 && (
            <div className="bg-gradient-to-r from-slate-400 to-slate-600 rounded-2xl shadow-lg p-4 text-white">
              <div className="flex items-center gap-3">
                <TrophyIcon className="h-10 w-10 text-slate-200" />
                <div>
                  <p className="font-bold">2º no Ranking iABCZ</p>
                  <p className="text-sm opacity-90">Excelente avaliação genética</p>
                </div>
              </div>
            </div>
          )}
          {rankingPosicao === 3 && (
            <div className="bg-gradient-to-r from-amber-700 to-amber-800 rounded-2xl shadow-lg p-4 text-white">
              <div className="flex items-center gap-3">
                <TrophyIcon className="h-10 w-10 text-amber-200" />
                <div>
                  <p className="font-bold">3º no Ranking iABCZ</p>
                  <p className="text-sm opacity-90">Ótima avaliação genética</p>
                </div>
              </div>
            </div>
          )}

          {/* Badge posições 4º a 10º no ranking */}
          {rankingPosicao >= 4 && rankingPosicao <= 10 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 border-2 border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <span className="text-xl font-black text-blue-600 dark:text-blue-400">{rankingPosicao}º</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{rankingPosicao}º no Ranking iABCZ</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Top 10 • Boa avaliação genética</p>
                </div>
              </div>
            </div>
          )}

         

          {/* Cards de números rápidos - Grid responsivo com animações */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(animal.abczg || animal.abczg === 0) && (
              <div className={`rounded-xl p-3 border text-center ${
                filhoTopRanking
                  ? 'bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 border-2 border-emerald-400 dark:border-emerald-500'
                  : rankingPosicao === 1
                  ? 'bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/40 border-2 border-amber-400 dark:border-amber-500'
                  : rankingPosicao === 2
                  ? 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800/50 dark:to-slate-700/50 border-2 border-slate-400 dark:border-slate-500'
                  : rankingPosicao === 3
                  ? 'bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 border-2 border-amber-600 dark:border-amber-700'
                  : rankingPosicao && rankingPosicao <= 10
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}>
                <p className={`text-2xl font-bold ${
                  filhoTopRanking ? 'text-emerald-600 dark:text-emerald-400' :
                  rankingPosicao === 1 ? 'text-amber-600 dark:text-amber-400' :
                  rankingPosicao === 2 ? 'text-slate-600 dark:text-slate-300' :
                  rankingPosicao === 3 ? 'text-amber-700 dark:text-amber-300' :
                  rankingPosicao && rankingPosicao <= 10 ? 'text-blue-600 dark:text-blue-400' :
                  'text-blue-600 dark:text-blue-400'
                }`}>
                  {animal.abczg}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">iABCZ</p>
                {(filhoTopRanking || (rankingPosicao && rankingPosicao <= 10)) && (
                  <p className={`text-xs font-bold mt-0.5 ${
                    filhoTopRanking ? 'text-emerald-600 dark:text-emerald-400' :
                    rankingPosicao === 1 ? 'text-amber-600 dark:text-amber-400' :
                    rankingPosicao === 2 ? 'text-slate-600 dark:text-slate-400' :
                    rankingPosicao === 3 ? 'text-amber-700 dark:text-amber-400' :
                    'text-blue-600 dark:text-blue-400'
                  }`}>
                    {filhoTopRanking ? 'Mãe do 1º' : `${rankingPosicao}º ranking`}
                  </p>
                )}
              </div>
            )}
            {(animal.deca || animal.deca === 0) && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 text-center">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{animal.deca}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">DECA</p>
              </div>
            )}
            {(animal.genetica_2 || animal.genetica_2 === 0) && (
              <div className={`rounded-xl p-3 border text-center ${
                rankingPosicaoGenetica2 === 1
                  ? 'bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/40 border-2 border-amber-400 dark:border-amber-500'
                  : rankingPosicaoGenetica2 === 2
                  ? 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800/50 dark:to-slate-700/50 border-2 border-slate-400 dark:border-slate-500'
                  : rankingPosicaoGenetica2 === 3
                  ? 'bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 border-2 border-amber-600 dark:border-amber-700'
                  : rankingPosicaoGenetica2 && rankingPosicaoGenetica2 <= 10
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}>
                <p className={`text-2xl font-bold ${
                  rankingPosicaoGenetica2 === 1 ? 'text-amber-600 dark:text-amber-400' :
                  rankingPosicaoGenetica2 === 2 ? 'text-slate-600 dark:text-slate-300' :
                  rankingPosicaoGenetica2 === 3 ? 'text-amber-700 dark:text-amber-300' :
                  rankingPosicaoGenetica2 && rankingPosicaoGenetica2 <= 10 ? 'text-blue-600 dark:text-blue-400' :
                  'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {animal.genetica_2}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">IQG</p>
                {rankingPosicaoGenetica2 && rankingPosicaoGenetica2 <= 10 && (
                  <p className={`text-xs font-bold mt-0.5 ${
                    rankingPosicaoGenetica2 === 1 ? 'text-amber-600 dark:text-amber-400' :
                    rankingPosicaoGenetica2 === 2 ? 'text-slate-600 dark:text-slate-400' :
                    rankingPosicaoGenetica2 === 3 ? 'text-amber-700 dark:text-amber-400' :
                    'text-blue-600 dark:text-blue-400'
                  }`}>
                    {rankingPosicaoGenetica2 === 1 ? '🥇' : rankingPosicaoGenetica2 === 2 ? '🥈' : rankingPosicaoGenetica2 === 3 ? '🥉' : ''} {rankingPosicaoGenetica2}º ranking
                  </p>
                )}
              </div>
            )}
            {(animal.decile_2 || animal.decile_2 === 0) && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 text-center">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{animal.decile_2}</p>
                <p className="text-xs text-gray-500 white
                :text-gray-400">Pt IQG</p>
              </div>
            )}
            {mesesIdade != null && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-3 border border-amber-300 dark:border-amber-700 text-center transform transition-all duration-200 hover:scale-105">
                <div className="flex items-center justify-center mb-0.5">
                  <ClockIcon className="h-1 w-1 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{mesesIdade}m</p>
                {diasAdicionais != null && diasAdicionais > 0 && (
                  <p className="text-xs font-bold text-amber-500 dark:text-amber-300">+{diasAdicionais}d</p>
                )}
                <p className="text-xs text-gray-600 dark:text-gray-400">idade</p>
              </div>
            )}
            {animal.peso && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-3 border border-purple-300 dark:border-purple-700 text-center transform transition-all duration-200 hover:scale-105">
                <div className="flex items-center justify-center mb-0.5">
                  <ScaleIcon className="h-1 w-1 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{Math.round(animal.peso)} kg</p>
                {evolucaoPeso != null && (
                  <p className={`text-xs font-bold ${parseFloat(evolucaoPeso) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {parseFloat(evolucaoPeso) >= 0 ? '↗' : '↘'} {parseFloat(evolucaoPeso) >= 0 ? '+' : ' '}{Math.round(evolucaoPeso)} kg
                  </p>
                )}
                <p className="text-xs text-gray-600 dark:text-gray-400">peso atual</p>
              </div>
            )}
            {ultimoCE && isMacho && (
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg p-3 border border-indigo-300 dark:border-indigo-700 text-center transform transition-all duration-200 hover:scale-105">
                <div className="flex items-center justify-center mb-0.5">
                  <BeakerIcon className="h-1 w-1 text-indigo-600 dark:text-indigo-400" />
                </div>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{Math.round(ultimoCE)} cm</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">C.E</p>
              </div>
            )}
            {isPrenha && previsaoPartoExibir && diasParaParto != null && (
              <div className="bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-lg p-3 border-2 border-emerald-400 dark:border-emerald-500 text-center transform transition-all duration-200 hover:scale-105">
                <div className="flex items-center justify-center mb-0.5">
                  <HeartIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                </div>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{diasParaParto}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">dias p/ parto</p>
              </div>
            )}
            {isPrenha && diasGestacao != null && (
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-lg p-3 border border-emerald-300 dark:border-emerald-600 text-center transform transition-all duration-200 hover:scale-105">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{diasGestacao}d</p>
                {gestacaoProgress != null && (
                  <div className="mt-1.5 w-full bg-emerald-200 dark:bg-emerald-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                      style={{ width: `${gestacaoProgress}%` }}
                    />
                  </div>
                )}
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">gestação {gestacaoProgress}%</p>
              </div>
            )}
            {animal.filhos?.length > 0 && (
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-lg p-3 border border-amber-300 dark:border-amber-700 text-center transform transition-all duration-200 hover:scale-105">
                <div className="flex items-center justify-center mb-0.5">
                  <UserGroupIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{animal.filhos.length}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">cria(s)</p>
              </div>
            )}
            {isFemea && totalIAs > 0 && (
              <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-lg p-3 border border-pink-300 dark:border-pink-700 text-center transform transition-all duration-200 hover:scale-105">
                <div className="flex items-center justify-center mb-0.5">
                  <HeartIcon className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                </div>
                <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">{totalIAs}</p>
                {taxaSucessoIA != null && (
                  <>
                    <div className="mt-1 w-full bg-pink-200 dark:bg-pink-800 rounded-full h-1 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-500"
                        style={{ width: `${taxaSucessoIA}%` }}
                      />
                    </div>
                    <p className="text-xs font-bold text-pink-600 dark:text-pink-400 mt-0.5">{taxaSucessoIA}%</p>
                  </>
                )}
                <p className="text-xs text-gray-600 dark:text-gray-400">IAs</p>
              </div>
            )}
            {isFemea && animal.fivs?.length > 0 && (
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-lg p-3 border border-violet-300 dark:border-violet-700 text-center transform transition-all duration-200 hover:scale-105">
                <div className="flex items-center justify-center mb-0.5">
                  <BeakerIcon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{animal.fivs.length}</p>
                {mediaOocitos && (
                  <p className="text-xs font-bold text-violet-600 dark:text-violet-400">~{mediaOocitos}</p>
                )}
                <p className="text-xs text-gray-600 dark:text-gray-400">FIV</p>
              </div>
            )}
            {diasNaFazenda != null && diasNaFazenda > 0 && (
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-3 border border-blue-300 dark:border-blue-700 text-center transform transition-all duration-200 hover:scale-105">
                <div className="flex items-center justify-center mb-0.5">
                  <MapPinIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{diasNaFazenda}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">dias fazenda</p>
              </div>
            )}
            {animal.pesagens?.length > 0 && (
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-lg p-3 border border-teal-300 dark:border-teal-700 text-center transform transition-all duration-200 hover:scale-105">
                <div className="flex items-center justify-center mb-0.5">
                  <ChartBarIcon className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </div>
                <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{animal.pesagens.length}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">pesagens</p>
              </div>
            )}
            {custoTotal > 0 && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-3 border border-green-300 dark:border-green-700 text-center transform transition-all duration-200 hover:scale-105">
                <div className="flex items-center justify-center mb-0.5">
                  <CurrencyDollarIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-base font-bold text-green-600 dark:text-green-400">{formatCurrency(custoTotal)}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">custos</p>
              </div>
            )}
            {isMacho && diasDesdeExame != null && (
              <div className="bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-900/20 dark:to-sky-900/20 rounded-lg p-3 border border-cyan-300 dark:border-cyan-700 text-center transform transition-all duration-200 hover:scale-105">
                <div className="flex items-center justify-center mb-0.5">
                  <AcademicCapIcon className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                </div>
                <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{diasDesdeExame}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">dias exame</p>
              </div>
            )}
            {isInapto && diasParaProximoExame != null && (
              <div className="bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 rounded-lg p-3 border-2 border-red-400 dark:border-red-500 text-center transform transition-all duration-200 hover:scale-105">
                <div className="flex items-center justify-center mb-0.5">
                  <ExclamationTriangleIcon className="h-4 w-4 text-red-600 dark:text-red-400 animate-pulse" />
                </div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {diasParaProximoExame > 0 ? diasParaProximoExame : '⚠️'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {diasParaProximoExame > 0 ? 'próx. exame' : 'reagendar'}
                </p>
              </div>
            )}
          </div>

          {/* Planejamento: Brucelose e DGT */}
          {(elegivelBrucelose || elegivelDGT || temBrucelose) && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheckIcon className="h-6 w-6 text-amber-500" />
                <h3 className="font-bold text-gray-900 dark:text-white">Planejamento / Obrigações</h3>
              </div>
              <div className="space-y-3 text-sm">
                {isFemea && (
                  <div className={`p-3 rounded-xl border ${
                    elegivelBrucelose ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700' :
                    temBrucelose ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' :
                    precisaBrucelose ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600' : ''
                  }`}>
                    <p className="font-semibold text-gray-900 dark:text-white">Vacina Brucelose (obrigatório fêmeas 3-8 meses)</p>
                    {temBrucelose ? (
                      <p className="text-green-600 dark:text-green-400 mt-1">✓ Já vacinada</p>
                    ) : elegivelBrucelose ? (
                      <p className="text-amber-600 dark:text-amber-400 mt-1">⚠️ Elegível agora ({idadeDias} dias) – agendar vacinação</p>
                    ) : precisaBrucelose ? (
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {idadeDias < 90 ? `Aguardar até 90 dias (atual: ${idadeDias}d)` : `Janela encerrada (${idadeDias}d > 240d)`}
                      </p>
                    ) : null}
                  </div>
                )}
                <div className={`p-3 rounded-xl border ${
                  elegivelDGT ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700' :
                  'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600'
                }`}>
                  <p className="font-semibold text-gray-900 dark:text-white">Avaliação DGT (330-640 dias)</p>
                  {elegivelDGT ? (
                    <p className="text-emerald-600 dark:text-emerald-400 mt-1">✓ Elegível para avaliação ({idadeDias} dias)</p>
                  ) : idadeDias != null ? (
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {idadeDias < 330 ? `Aguardar até 330 dias (atual: ${idadeDias}d)` : `Fora da janela (${idadeDias}d > 640d)`}
                    </p>
                  ) : null}
                </div>
              </div>
              <Link
                href="/planejamento/agenda"
                className="inline-flex items-center gap-2 mt-3 text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
              >
                Ver agenda de planejamento
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </Link>
            </div>
          )}

          {/* Countdown próximo exame andrológico - INAPTOS */}
          {isInapto && dataProximoExame && (
            <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl shadow-lg p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/20">
                  <AcademicCapIcon className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-sm opacity-90">Próximo exame andrológico previsto</p>
                  <p className="text-2xl font-bold">{dataProximoExame.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p className="text-sm mt-1 opacity-90">
                    {diasParaProximoExame != null && diasParaProximoExame > 0 && `Faltam ${diasParaProximoExame} dias`}
                    {diasParaProximoExame != null && diasParaProximoExame <= 0 && `Vencido há ${Math.abs(diasParaProximoExame)} dias`}
                  </p>
                  {exameProgress != null && (
                    <div className="mt-3 h-2 rounded-full bg-white/20 overflow-hidden">
                      <div style={{ width: `${exameProgress}%` }} className="h-2 bg-white"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Countdown de parto em destaque */}
          {isPrenha && previsaoPartoExibir && (
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-lg p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/20">
                  <HeartIcon className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-sm opacity-90">Previsão de parto</p>
                  <p className="text-2xl font-bold">{previsaoPartoExibir.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p className="text-sm mt-1 opacity-90">
                    {diasGestacao != null && `${diasGestacao} dias de gestação`}
                    {diasParaParto != null && diasParaParto <= 30 && ` • Faltam ${diasParaParto} dias!`}
                  </p>
                  {gestacaoProgress != null && (
                    <div className="mt-3 h-2 rounded-full bg-white/20 overflow-hidden">
                      <div style={{ width: `${gestacaoProgress}%` }} className="h-2 bg-white"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Badge Apta reprodução */}
          {aptaReproducao && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-pink-100 dark:bg-pink-900/30 border border-pink-200 dark:border-pink-800">
              <HeartIcon className="h-5 w-5 text-pink-600 dark:text-pink-400" />
              <p className="text-sm font-semibold text-pink-800 dark:text-pink-300">Fêmea apta para reprodução (IA/TE)</p>
            </div>
          )}

          {/* Card principal */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Identificação em destaque */}
            <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Identificação</p>
              <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{animal.serie || '-'} {animal.rg || ''}</p>
            </div>
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                  <UserIcon className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">{nome}</h1>
                    {filhoTopRanking && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500 text-white text-sm font-bold shadow-lg">
                        <UserGroupIcon className="h-4 w-4" />
                        Mãe do 1º iABCZ
                      </span>
                    )}
                    {rankingPosicao === 1 && !filhoTopRanking && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500 text-white text-sm font-bold shadow-lg">
                        <TrophyIcon className="h-4 w-4" />
                        1º iABCZ
                      </span>
                    )}
                    {rankingPosicao === 2 && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-500 text-white text-sm font-bold shadow-lg">
                        <TrophyIcon className="h-4 w-4" />
                        2º iABCZ
                      </span>
                    )}
                    {rankingPosicao === 3 && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-700 text-white text-sm font-bold shadow-lg">
                        <TrophyIcon className="h-4 w-4" />
                        3º iABCZ
                      </span>
                    )}
                    {rankingPosicao >= 4 && rankingPosicao <= 10 && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-600 text-white text-sm font-bold">
                        {rankingPosicao}º iABCZ
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {examesAndrologicos.length > 0 && (() => {
                      const ult = examesAndrologicos[0]
                      const res = String(ult?.resultado || '').toUpperCase()
                      return (
                        <span className={`px-3 py-1.5 rounded-full text-sm font-bold shadow-sm ${
                          res.includes('APTO')
                            ? 'bg-white dark:bg-gray-700 border-2 border-green-500 text-green-800 dark:text-green-200'
                            : res.includes('INAPTO')
                            ? 'bg-white dark:bg-gray-700 border-2 border-red-500 text-red-800 dark:text-red-200'
                            : 'bg-white dark:bg-gray-700 border-2 border-amber-500 text-amber-900 dark:text-amber-200'
                        }`}>
                          Andrológico: {ult.resultado || 'Pendente'}
                        </span>
                      )
                    })()}
                    {animal.fivs?.length > 0 && (
                      <span className="px-3 py-1.5 rounded-full text-sm font-bold bg-white dark:bg-gray-700 border-2 border-violet-500 text-violet-900 dark:text-violet-100 shadow-sm">
                        🧪 Doadora FIV • {animal.fivs.length} coleta{animal.fivs.length > 1 ? 's' : ''} • {totalOocitos} oócitos
                      </span>
                    )}
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <button type="button" onClick={handleCopyIdent} className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 text-xs font-semibold">
                      Copiar identificação
                    </button>
                    <button type="button" onClick={handleWhatsAppShare} className="px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800 text-xs font-semibold">
                      WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              <InfoRow label="Sexo" value={animal.sexo} />
              <InfoRow label="Raça" value={animal.raca} />
              <InfoRow label="Pelagem" value={animal.pelagem} />
              <InfoRow label="Situação" value={animal.situacao} />
              <div className="px-6 py-3 flex justify-between items-center bg-amber-50/50 dark:bg-amber-900/20 border-t border-amber-100 dark:border-amber-800/30">
                <span className="text-sm font-medium text-amber-800 dark:text-amber-200 flex items-center gap-1">
                  <MapPinIcon className="h-4 w-4" />
                  Localização (Piquete)
                </span>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                  {locAtual || 'Não informado'}
                </span>
              </div>
              <InfoRow label="Categoria" value={animal.categoria} />
              <InfoRow label="Data nascimento" value={formatDate(animal.data_nascimento)} />
              {ultimaIA && (
                <>
                  <div className="px-6 py-3 flex justify-between items-center bg-pink-50/50 dark:bg-pink-900/20 border-t border-pink-100 dark:border-pink-800/30">
                    <span className="text-sm font-medium text-pink-800 dark:text-pink-200">
                      {isPrenha ? 'Touro (IA prenha)' : 'Touro (última IA)'}
                    </span>
                    <span className="text-sm font-bold text-pink-600 dark:text-pink-400">
                      {ultimaIA.touro_nome || ultimaIA.touro || '-'}
                    </span>
                  </div>
                  {previsaoPartoExibir && (
                    <div className="px-6 py-3 flex justify-between items-center bg-emerald-50/50 dark:bg-emerald-900/20 border-t border-emerald-100 dark:border-emerald-800/30">
                      <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                        Previsão de Parto
                      </span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {previsaoPartoExibir.toLocaleDateString('pt-BR')} ({diasParaParto != null ? diasParaParto : 0} dias)
                      </span>
                    </div>
                  )}
                </>
              )}
              {(animal.mae || animal.serie_mae || animal.rg_mae) && (
                <div className="px-6 py-3 flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Mãe</span>
                  <div className="text-right">
                    {animal.mae && (
                      <span className="text-sm font-medium text-gray-900 dark:text-white block">
                        {animal.mae}
                      </span>
                    )}
                    {(animal.serie_mae || animal.rg_mae) && (
                      <Link href={`/consulta-animal/${animal.serie_mae}-${animal.rg_mae}`} className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold">
                        {[animal.serie_mae, animal.rg_mae].filter(Boolean).join(' ')}
                      </Link>
                    )}
                  </div>
                </div>
              )}
              <InfoRow label="Pai" value={animal.pai} />
              {(animal.avo_materno || animal.avoMaterno || animal.avo_materna || animal.avoMaterna || animal.avo_paterno || animal.avoPaterno || animal.avo_paterna || animal.avoPaterna) && (
                <div className="px-6 py-4 bg-amber-50/30 dark:bg-amber-900/10 border-t border-amber-100 dark:border-amber-800/20">
                  
                  <div className="space-y-2 text-sm">
                    {(animal.avo_materno || animal.avoMaterno) && (
                      <div className="flex justify-between pl-3 border-l-2 border-amber-300 dark:border-amber-700">
                        <span className="text-gray-600 dark:text-gray-400 text-xs">Avô materno</span>
                        <span className="font-medium text-gray-900 dark:text-white text-xs">{animal.avo_materno || animal.avoMaterno}</span>
                      </div>
                    )}
                    {(animal.avo_materna || animal.avoMaterna) && (
                      <div className="flex justify-between pl-3 border-l-2 border-amber-300 dark:border-amber-700">
                        <span className="text-gray-600 dark:text-gray-400 text-xs">Avó materna</span>
                        <span className="font-medium text-gray-900 dark:text-white text-xs">{animal.avo_materna || animal.avoMaterna}</span>
                      </div>
                    )}
                    {(animal.avo_paterno || animal.avoPaterno) && (
                      <div className="flex justify-between pl-3 border-l-2 border-blue-300 dark:border-blue-700 mt-3">
                        <span className="text-gray-600 dark:text-gray-400 text-xs">Avô paterno</span>
                        <span className="font-medium text-gray-900 dark:text-white text-xs">{animal.avo_paterno || animal.avoPaterno}</span>
                      </div>
                    )}
                    {(animal.avo_paterna || animal.avoPaterna) && (
                      <div className="flex justify-between pl-3 border-l-2 border-blue-300 dark:border-blue-700">
                        <span className="text-gray-600 dark:text-gray-400 text-xs">Avó paterna</span>
                        <span className="font-medium text-gray-900 dark:text-white text-xs">{animal.avo_paterna || animal.avoPaterna}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {(animal.abczg || animal.abczg === 0) && (
                <div className={`px-6 py-3 flex justify-between items-center border-t ${
                  filhoTopRanking ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30' :
                  rankingPosicao === 1 ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/30' :
                  rankingPosicao === 2 ? 'bg-slate-50/50 dark:bg-slate-900/10 border-slate-200 dark:border-slate-700' :
                  rankingPosicao === 3 ? 'bg-amber-50/30 dark:bg-amber-900/5 border-amber-100 dark:border-amber-800/20' :
                  rankingPosicao && rankingPosicao <= 10 ? 'bg-blue-50/30 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30' :
                  'border-gray-100 dark:border-gray-700'
                }`}>
                  <span className={`text-sm font-medium flex items-center gap-1 ${
                    filhoTopRanking ? 'text-emerald-800 dark:text-emerald-200' :
                    rankingPosicao === 1 ? 'text-amber-800 dark:text-amber-200' :
                    rankingPosicao === 2 ? 'text-slate-700 dark:text-slate-300' :
                    rankingPosicao === 3 ? 'text-amber-800 dark:text-amber-200' :
                    rankingPosicao && rankingPosicao <= 10 ? 'text-blue-800 dark:text-blue-200' :
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    {filhoTopRanking ? <UserGroupIcon className="h-4 w-4" /> : <TrophyIcon className="h-4 w-4" />}
                    iABCZ (avaliação genética)
                  </span>
                  <span className={`text-lg font-bold ${
                    filhoTopRanking ? 'text-emerald-600 dark:text-emerald-400' :
                    rankingPosicao === 1 ? 'text-amber-600 dark:text-amber-400' :
                    rankingPosicao === 2 ? 'text-slate-600 dark:text-slate-300' :
                    rankingPosicao === 3 ? 'text-amber-700 dark:text-amber-400' :
                    rankingPosicao && rankingPosicao <= 10 ? 'text-blue-600 dark:text-blue-400' :
                    'text-gray-900 dark:text-white'
                  }`}>
                    {animal.abczg}
                    {filhoTopRanking && (
                      <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100">
                        Mãe do 1º
                      </span>
                    )}
                    {rankingPosicao && rankingPosicao <= 10 && !filhoTopRanking && (
                      <span className={`ml-2 text-xs font-normal px-2 py-0.5 rounded-full ${
                        rankingPosicao === 1 ? 'bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100' :
                        rankingPosicao === 2 ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100' :
                        rankingPosicao === 3 ? 'bg-amber-300 dark:bg-amber-800 text-amber-900 dark:text-amber-100' :
                        'bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100'
                      }`}>
                        {rankingPosicao}º ranking
                      </span>
                    )}
                  </span>
                </div>
              )}
              {(animal.deca || animal.deca === 0) && (
                <InfoRow label="DECA" value={animal.deca} />
              )}
              {(animal.genetica_2 || animal.genetica_2 === 0) && (
                <InfoRow label="IQG" value={`${animal.genetica_2}${rankingPosicaoGenetica2 ? ` • ${rankingPosicaoGenetica2}º no ranking` : ''}`} />
              )}
              {(animal.decile_2 || animal.decile_2 === 0) && (
                <InfoRow label="Pt IQG" value={animal.decile_2} />
              )}
              <InfoRow label="Brinco" value={animal.brinco} />
              <InfoRow label="Tatuagem" value={animal.tatuagem} />
              {(animal.valor_venda || animal.valorVenda) && (
                <InfoRow label="Valor venda" value={formatCurrency(animal.valor_venda || animal.valorVenda)} />
              )}
              <InfoRow label="Comprador/Destino" value={animal.comprador || animal.destino} />
              <InfoRow label="Receptora" value={animal.receptora} />
              <InfoRow label="Situação ABCZ" value={animal.situacao_abcz || animal.situacaoAbcz || 'Não informado'} />
              {(animal.custo_aquisicao || animal.custoAquisicao) && (
                <InfoRow label="Custo aquisição" value={formatCurrency(animal.custo_aquisicao || animal.custoAquisicao)} />
              )}
              <InfoRow label="Observações" value={animal.observacoes} />
            </div>
          </div>

          {/* Exames Andrológicos - MACHOS */}
          {examesAndrologicos.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSecao('exames')}
                className="w-full p-4 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 border-b border-gray-200 dark:border-gray-700 text-left hover:from-blue-150 hover:to-indigo-150 active:scale-[0.99] transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <AcademicCapIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      <h2 className="font-bold text-gray-900 dark:text-white">Exames Andrológicos</h2>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      {examesAndrologicos.length} exame(s) registrado(s)
                      {diasDesdeExame != null && ` • Último há ${diasDesdeExame} dias`}
                      {isInapto && dataProximoExame && (
                        <span className="block mt-1 font-semibold text-red-700 dark:text-red-300">
                          Próximo previsto: {formatDate(dataProximoExame)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {ultExame?.resultado && (
                      <span className={`px-3 py-1.5 rounded-full text-sm font-bold shadow-sm ${
                        String(ultExame.resultado).toUpperCase().includes('APTO')
                          ? 'bg-white dark:bg-gray-700 border-2 border-green-500 text-green-800 dark:text-green-200'
                          : String(ultExame.resultado).toUpperCase().includes('INAPTO')
                          ? 'bg-white dark:bg-gray-700 border-2 border-red-500 text-red-800 dark:text-red-200'
                          : 'bg-white dark:bg-gray-700 border-2 border-amber-500 text-amber-900 dark:text-amber-200'
                      }`}>
                        {ultExame.resultado}
                      </span>
                    )}
                    {secoesExpandidas.exames ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
                  </div>
                </div>
              </button>
              <div className={`overflow-hidden transition-all ${secoesExpandidas.exames ? 'max-h-[999px]' : 'max-h-0'}`}>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {examesAndrologicos.map((ex, i) => (
                  <div key={ex.id || i} className="px-4 py-3 flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatDate(ex.data_exame)}
                        {ex.ce != null && ex.ce !== '' && (
                          <span className="ml-2 text-xs font-normal text-gray-600 dark:text-gray-400">CE: {ex.ce}</span>
                        )}
                      </p>
                      {(ex.defeitos || ex.observacoes) && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                          {[ex.defeitos, ex.observacoes].filter(Boolean).join(' • ')}
                        </p>
                      )}
                      {ex.veterinario && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">Vet: {ex.veterinario}</p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold shrink-0 shadow-sm ${
                      String(ex.resultado || '').toUpperCase().includes('APTO')
                        ? 'bg-white dark:bg-gray-700 border-2 border-green-500 text-green-800 dark:text-green-200'
                        : String(ex.resultado || '').toUpperCase().includes('INAPTO')
                        ? 'bg-white dark:bg-gray-700 border-2 border-red-500 text-red-800 dark:text-red-200'
                        : 'bg-white dark:bg-gray-700 border-2 border-amber-500 text-amber-900 dark:text-amber-200'
                    }`}>
                      {ex.resultado || 'Pendente'}
                    </span>
                  </div>
                ))}
              </div>
              </div>
            </div>
          )}

          {/* Coletas FIV - FÊMEAS DOADORAS */}
          {animal.fivs && animal.fivs.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border-2 border-violet-200 dark:border-violet-800 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSecao('fiv')}
                className="w-full p-4 bg-gradient-to-r from-violet-100 to-fuchsia-100 dark:from-violet-900/50 dark:to-fuchsia-900/50 border-b border-gray-200 dark:border-gray-700 text-left hover:from-violet-150 hover:to-fuchsia-150 dark:hover:from-violet-800/50 dark:hover:to-fuchsia-800/50 active:scale-[0.99] transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CubeTransparentIcon className="h-6 w-6 text-violet-700 dark:text-violet-300" />
                    <h2 className="font-bold text-gray-900 dark:text-white">Coletas FIV</h2>
                  </div>
                  {secoesExpandidas.fiv ? (
                    <ChevronUpIcon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  )}
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 font-medium">
                  {animal.fivs.length} coleta(s) • {totalOocitos} oócitos totais
                  {mediaOocitos && ` • Média: ${mediaOocitos}/coleta`}
                </p>
              </button>
              <div className={`overflow-hidden transition-all ${secoesExpandidas.fiv ? 'max-h-[999px]' : 'max-h-0'}`}>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {animal.fivs.map((fiv, i) => (
                    <div key={fiv.id || i} className="px-4 py-3 bg-white dark:bg-gray-800">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatDate(fiv.data_fiv)}
                            {fiv.data_transferencia && (
                              <span className="text-xs text-gray-600 dark:text-gray-400 ml-1 font-normal">
                                (TE: {formatDate(fiv.data_transferencia)})
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                            Lab: {fiv.laboratorio || fiv.veterinario || '-'}
                          </p>
                          {fiv.touro && (
                            <p className="text-xs text-violet-700 dark:text-violet-400 mt-1 font-medium">
                              Touro: {fiv.touro}
                            </p>
                          )}
                        </div>
                        <span className="px-3 py-1 rounded-lg text-sm font-bold bg-violet-100 text-violet-900 dark:bg-violet-900/50 dark:text-violet-100 border border-violet-300 dark:border-violet-700 shrink-0">
                          {(fiv.quantidade_oocitos || 0)} oócitos
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Inseminações - FÊMEAS */}
          {inseminacoesParaExibir && inseminacoesParaExibir.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSecao('inseminacoes')}
                className="w-full p-4 bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-900/40 dark:to-rose-900/40 border-b border-gray-200 dark:border-gray-700 text-left hover:from-pink-150 hover:to-rose-150 active:scale-[0.99] transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HeartIcon className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                    <h2 className="font-bold text-gray-900 dark:text-white">Inseminações</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {taxaSucessoIA != null && (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        taxaSucessoIA >= 50 ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200' :
                        taxaSucessoIA >= 25 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-200'
                      }`}>
                        {taxaSucessoIA}% prenhez
                      </span>
                    )}
                    {secoesExpandidas.inseminacoes ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  {inseminacoesParaExibir.length} registro(s)
                  {taxaSucessoIA != null && ` • ${prenhas} prenha(s)`}
                </p>
              </button>
              <div className={`overflow-hidden transition-all ${secoesExpandidas.inseminacoes ? 'max-h-[999px]' : 'max-h-0'}`}>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {inseminacoesParaExibir.map((ia, i) => {
                  const dataIA = ia.data_ia || ia.data_inseminacao || ia.data
                  const diasDesdeIA = dataIA ? Math.floor((new Date() - new Date(dataIA)) / (1000 * 60 * 60 * 24)) : 0
                  const ehPrenha = /pren/i.test(String(ia.resultado_dg || ia.status_gestacao || ''))
                  const maisDe4Meses = diasDesdeIA > 120
                  const invalida = ia.valida === false || (maisDe4Meses && !ehPrenha)
                  return (
                  <div key={ia.id || i} className={`px-4 py-3 flex justify-between items-start ${invalida ? 'opacity-75' : ''}`}>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(ia.data_ia || ia.data)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {ia.touro_nome || ia.touro || '-'}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {ia.resultado_dg && (
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            String(ia.resultado_dg).toLowerCase().includes('prenha') ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200' :
                            String(ia.resultado_dg).toLowerCase().includes('vazia') ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200' :
                            'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                          }`}>
                            DG: {ia.resultado_dg}
                          </span>
                        )}
                        {invalida && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 font-medium">
                            Inválida
                          </span>
                        )}
                      </div>
                    </div>
                    {ia.tipo === 'TE' && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-pink-100 text-pink-800 dark:bg-pink-900/40 shrink-0">
                        TE
                      </span>
                    )}
                  </div>
                )})}
              </div>
              </div>
            </div>
          )}

          {/* Gestações - FÊMEAS */}
          {animal.gestacoes && animal.gestacoes.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSecao('gestacoes')}
                className="w-full p-4 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 border-b border-gray-200 dark:border-gray-700 text-left hover:from-emerald-150 hover:to-teal-150 active:scale-[0.99] transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HeartIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    <h2 className="font-bold text-gray-900 dark:text-white">Gestações</h2>
                  </div>
                  {secoesExpandidas.gestacoes ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  {animal.gestacoes.length} gestação(ões)
                  {(() => {
                    const concluidas = animal.gestacoes.filter(g => g.data_nascimento || g.data_parto).length
                    const emAndamento = animal.gestacoes.length - concluidas
                    if (concluidas > 0 || emAndamento > 0) {
                      return ` • ${concluidas} parto(s) • ${emAndamento} em andamento`
                    }
                    return ''
                  })()}
                </p>
              </button>
              <div className={`overflow-hidden transition-all ${secoesExpandidas.gestacoes ? 'max-h-[999px]' : 'max-h-0'}`}>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {animal.gestacoes.map((g, i) => (
                  <div key={g.id || i} className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {g.situacao || 'Em andamento'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(g.data_cobertura || g.data_cobertura_mae)} • {g.touro_nome || g.touro || '-'}
                    </p>
                    {(g.data_nascimento || g.data_parto) && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
                        Parto: {formatDate(g.data_nascimento || g.data_parto)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              </div>
            </div>
          )}

          {/* Reprodução - DG/IA/TE */}
          {(animal.resultado_dg || animal.resultadoDG || animal.data_te || animal.dataTE || animal.data_dg || animal.dataDG) && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <HeartIcon className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                <h2 className="font-semibold text-gray-900 dark:text-white">Reprodução</h2>
              </div>
              <div className="space-y-2">
                {(animal.data_te || animal.dataTE) && (
                  <InfoRow label="Data TE/IA" value={formatDate(animal.data_te || animal.dataTE)} />
                )}
                {(animal.data_dg || animal.dataDG) && (
                  <InfoRow 
                    label="Data DG" 
                    value={formatDate(animal.data_dg || animal.dataDG)} 
                  />
                )}
                {(animal.resultado_dg || animal.resultadoDG) && (
                  <div className="px-0 py-2 flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Resultado DG</span>
                    <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${
                      String(animal.resultado_dg || animal.resultadoDG || '').toLowerCase().includes('prenha')
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {animal.resultado_dg || animal.resultadoDG}
                    </span>
                  </div>
                )}
                {String(animal.resultado_dg || animal.resultadoDG || '').toLowerCase().includes('prenha') && (animal.data_te || animal.dataTE) && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Parto previsto: {new Date(new Date(animal.data_te || animal.dataTE).getTime() + (285 * 24 * 60 * 60 * 1000)).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Linha do tempo de eventos */}
          {timeline.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-indigo-600/10 to-violet-600/10 dark:from-indigo-900/30 dark:to-violet-900/30 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="font-semibold text-gray-900 dark:text-white">Linha do Tempo</h2>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Eventos recentes em ordem cronológica
                </p>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {timeline.map((e, i) => (
                  <div key={i} className="px-4 py-3 flex justify-between items-center gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        e.tipo === 'IA' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/40' :
                        e.tipo === 'FIV' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40' :
                        e.tipo === 'Peso' ? 'bg-slate-100 text-slate-700 dark:bg-slate-700' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/40'
                      }`}>
                        {e.tipo.charAt(0)}
                      </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{e.label}</span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">{formatDate(e.data)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Localização atual + histórico - sempre exibir para manter layout consistente */}
          {(
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSecao('localizacoes')}
                className="w-full p-4 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40 border-b border-gray-200 dark:border-gray-700 text-left hover:from-blue-150 hover:to-cyan-150 active:scale-[0.99] transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <h2 className="font-semibold text-gray-900 dark:text-white">Localização</h2>
                  </div>
                  {secoesExpandidas.localizacoes ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
                </div>
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mt-1">
                  Atual: {locAtual || 'Não informado'}
                </p>
              </button>
              <div className={`overflow-hidden transition-all ${secoesExpandidas.localizacoes ? 'max-h-[999px]' : 'max-h-0'}`}>
                {animal.localizacoes && animal.localizacoes.length > 1 && (
                  <div className="p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Histórico recente</p>
                    <div className="space-y-1">
                      {animal.localizacoes.slice(0, 6).map((l, i) => (
                        <div key={l.id || i} className="flex justify-between text-sm py-1">
                          <span className="text-gray-700 dark:text-gray-300 font-medium">{localizacaoValidaParaExibir(l.piquete) || 'Não informado'}</span>
                          <span className="text-gray-500 dark:text-gray-400 text-xs">
                            {formatDate(l.data_entrada)}
                            {l.data_saida && ` → ${formatDate(l.data_saida)}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {locAtual && (!animal.localizacoes || animal.localizacoes.length <= 1) && (
                  <p className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{locAtual}</p>
                )}
              </div>
            </div>
          )}

          {/* Filhos (Crias) - fêmeas que pariram */}
          {animal.filhos && animal.filhos.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSecao('filhos')}
                className="w-full p-4 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 border-b border-gray-200 dark:border-gray-700 text-left hover:from-amber-150 hover:to-orange-150 active:scale-[0.99] transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserGroupIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <h2 className="font-semibold text-gray-900 dark:text-white">Crias</h2>
                  </div>
                  {secoesExpandidas.filhos ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  {animal.filhos.length} filho(s) registrado(s)
                </p>
              </button>
              <div className={`overflow-hidden transition-all ${secoesExpandidas.filhos ? 'max-h-[999px]' : 'max-h-0'}`}>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {animal.filhos.map((f, i) => {
                  const identificacao = `${f.nome || f.serie || '-'} ${f.rg || ''}`.trim()
                  const mesesFilho = calcularMesesIdade(f.data_nascimento, f.meses)
                  
                  const conteudoFilho = (
                    <>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900 dark:text-white block">
                          {identificacao || '-'}
                        </span>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {f.sexo && <span>{f.sexo}</span>}
                          {formatDate(f.data_nascimento) !== '-' && <span>Nasc: {formatDate(f.data_nascimento)}</span>}
                          {mesesFilho != null && <span className="font-medium text-amber-600 dark:text-amber-400">{mesesFilho}m</span>}
                          {(f.abczg != null && f.abczg !== '') && <span className="font-medium text-blue-600 dark:text-blue-400">iABCZ: {f.abczg}</span>}
                          {(f.deca != null && f.deca !== '') && <span className="font-medium text-emerald-600 dark:text-emerald-400">DECA: {f.deca}</span>}
                          {(f.genetica_2 != null && f.genetica_2 !== '') && <span className="font-medium text-purple-600 dark:text-purple-400">Aval2: {f.genetica_2}</span>}
                          {(f.decile_2 != null && f.decile_2 !== '') && <span className="font-medium text-amber-600 dark:text-amber-400">Dec2: {f.decile_2}</span>}
                        </div>
                      </div>
                      {f.id && <ArrowTopRightOnSquareIcon className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />}
                    </>
                  )
                  
                  if (f.id) {
                    return (
                      <Link 
                        key={f.id || i} 
                        href={`/consulta-animal/${f.id}`}
                        className="px-4 py-3 flex justify-between items-center gap-3 hover:bg-amber-50 dark:hover:bg-amber-900/20 active:bg-amber-100 dark:active:bg-amber-900/30 transition-colors cursor-pointer"
                      >
                        {conteudoFilho}
                      </Link>
                    )
                  }
                  
                  return (
                    <div key={f.id || i} className="px-4 py-3 flex justify-between items-center gap-3">
                      {conteudoFilho}
                    </div>
                  )
                })}
              </div>
              </div>
            </div>
          )}

          {/* Ocorrências (histórico de serviços, vacinas, tratamentos) */}
          {ocorrencias.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSecao('ocorrencias')}
                className="w-full p-4 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 border-b border-gray-200 dark:border-gray-700 text-left active:scale-[0.99] transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    <h2 className="font-semibold text-gray-900 dark:text-white">Ocorrências</h2>
                  </div>
                  {secoesExpandidas.ocorrencias ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  {ocorrencias.length} registro(s) • Vacinas, tratamentos, serviços
                </p>
              </button>
              <div className={`overflow-hidden transition-all ${secoesExpandidas.ocorrencias ? 'max-h-[999px]' : 'max-h-0'}`}>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {ocorrencias.slice(0, 15).map((o, i) => (
                    <div key={o.id || i} className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(o.data_registro || o.data)}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                        {o.descricao || o.observacoes || o.tipo || '-'}
                      </p>
                      {(o.servicos_aplicados?.length > 0 || o.medicamento) && (
                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                          {o.servicos_aplicados?.join(', ') || o.medicamento}
                        </p>
                      )}
                      {(o.peso || o.ce) && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                          {o.peso && `Peso: ${o.peso} kg`}
                          {o.peso && o.ce && ' • '}
                          {o.ce && `CE: ${o.ce} cm`}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Transferências de Embriões (receptoras) */}
          {transferencias.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border-2 border-violet-200 dark:border-violet-800 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSecao('transferencias')}
                className="w-full p-4 bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/50 dark:to-purple-900/50 border-b border-gray-200 dark:border-gray-700 text-left active:scale-[0.99] transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CubeTransparentIcon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    <h2 className="font-semibold text-gray-900 dark:text-white">Transferências (TE)</h2>
                  </div>
                  {secoesExpandidas.transferencias ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  {transferencias.length} TE(s) como receptora
                </p>
              </button>
              <div className={`overflow-hidden transition-all ${secoesExpandidas.transferencias ? 'max-h-[999px]' : 'max-h-0'}`}>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {transferencias.map((te, i) => (
                    <div key={te.id || i} className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(te.data_te || te.data_transferencia)}
                        {te.numero_te && <span className="ml-2 text-xs text-gray-500">#{te.numero_te}</span>}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                        Doadora: {te.doadora_nome || te.doadora || '-'} • Touro: {te.touro || '-'}
                      </p>
                      {(te.resultado || te.status) && (
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                          String(te.resultado || te.status || '').toLowerCase().includes('prenha')
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {te.resultado || te.status}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Protocolos Sanitários */}
          {animal.protocolos && animal.protocolos.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSecao('protocolos')}
                className="w-full p-4 bg-gradient-to-r from-emerald-600/10 to-green-600/10 dark:from-emerald-900/30 dark:to-green-900/30 border-b border-gray-200 dark:border-gray-700 text-left hover:from-emerald-600/20 hover:to-green-600/20 active:scale-[0.99] transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheckIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <h2 className="font-semibold text-gray-900 dark:text-white">Protocolos Sanitários</h2>
                  </div>
                  {secoesExpandidas.protocolos ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  {animal.protocolos.length} protocolo(s) registrado(s)
                </p>
              </button>
              <div className={`overflow-hidden transition-all ${secoesExpandidas.protocolos ? 'max-h-[999px]' : 'max-h-0'}`}>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {animal.protocolos.map((p, i) => (
                    <div key={p.id || i} className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {p.nome_protocolo || p.protocolo || p.tipo || 'Protocolo'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Início: {formatDate(p.data_inicio)}
                        {p.data_fim && ` • Fim: ${formatDate(p.data_fim)}`}
                      </p>
                      {p.veterinario && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Vet: {p.veterinario}</p>
                      )}
                      {p.observacoes && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{p.observacoes}</p>
                      )}
                      {p.custo && (
                        <p className="text-xs font-semibold text-green-600 dark:text-green-400 mt-1">
                          Custo: {formatCurrency(p.custo)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Pesagens recentes */}
          {animal.pesagens && animal.pesagens.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSecao('pesagens')}
                className="w-full p-4 bg-gradient-to-r from-slate-600/10 to-slate-500/10 dark:from-slate-800/50 dark:to-slate-700/50 border-b border-gray-200 dark:border-gray-700 text-left hover:from-slate-600/20 hover:to-slate-500/20 active:scale-[0.99] transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ScaleIcon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    <h2 className="font-semibold text-gray-900 dark:text-white">Pesagens</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {evolucaoPeso != null && (
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        parseFloat(evolucaoPeso) >= 0
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                      }`}>
                        {parseFloat(evolucaoPeso) >= 0 ? '+' : ''}{evolucaoPeso} kg
                      </span>
                    )}
                    {secoesExpandidas.pesagens ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  {animal.pesagens.length} pesagem(ns)
                  {evolucaoPeso != null && ` • Evolução desde ${formatDate(primeiraPesagem?.data)}`}
                </p>
              </button>
              <div className={`overflow-hidden transition-all ${secoesExpandidas.pesagens ? 'max-h-[999px]' : 'max-h-0'}`}>
                <div className="p-4 space-y-2">
                  {animal.pesagens.map((p, i) => (
                    <div key={p.id || i} className="flex justify-between items-center text-sm py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <div className="min-w-0">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">{formatDate(p.data)}</span>
                        {p.lote && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Lote: {p.lote}</p>
                        )}
                        {p.observacoes && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{p.observacoes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {p.ce && isMacho && (
                          <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
                            CE {p.ce} cm
                          </span>
                        )}
                        <span className="font-semibold text-gray-900 dark:text-white">{p.peso || p.peso_kg} kg</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Custos */}
          {custoTotal > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSecao('custos')}
                className="w-full p-4 bg-gradient-to-r from-green-600/10 to-emerald-600/10 dark:from-green-900/30 dark:to-emerald-900/30 border-b border-gray-200 dark:border-gray-700 text-left hover:from-green-600/20 hover:to-emerald-600/20 active:scale-[0.99] transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CurrencyDollarIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <h2 className="font-semibold text-gray-900 dark:text-white">Custos Detalhados</h2>
                  </div>
                  {secoesExpandidas.custos ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
                </div>
                <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">{formatCurrency(custoTotal)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{custosArray.length} lançamento(s)</p>
              </button>
              <div className={`overflow-hidden transition-all ${secoesExpandidas.custos ? 'max-h-[999px]' : 'max-h-0'}`}>
                {Object.keys(custosPorTipo).length > 1 && (
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-semibold">Por categoria</p>
                    <div className="space-y-2">
                      {Object.entries(custosPorTipo)
                        .sort((a, b) => b[1] - a[1])
                        .map(([tipo, val]) => (
                          <div key={tipo} className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">{tipo}</span>
                            <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(val)}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {custosArray.slice(0, 10).map((c, i) => (
                    <div key={c.id || i} className="px-4 py-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {c.tipo || c.subtipo || 'Custo'}
                          </p>
                          {c.descricao && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{c.descricao}</p>
                          )}
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            {formatDate(c.data)}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-green-600 dark:text-green-400 shrink-0">
                          {formatCurrency(c.valor)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* DNA */}
          {(animal.laboratorio_dna || animal.dna?.laboratorio || animal.data_envio_dna || animal.custo_dna) && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-2 mb-3">
                <BeakerIcon className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                <h2 className="font-semibold text-gray-900 dark:text-white">DNA</h2>
              </div>
              <div className="space-y-2">
                {(animal.laboratorio_dna || animal.dna?.laboratorio) && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Laboratório: {animal.laboratorio_dna || animal.dna?.laboratorio}
                  </p>
                )}
                {(animal.data_envio_dna || animal.dataEnvioDNA) && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Envio: {formatDate(animal.data_envio_dna || animal.dataEnvioDNA)}
                  </p>
                )}
                {(animal.custo_dna || animal.custoDNA) && (
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Custo: {formatCurrency(animal.custo_dna || animal.custoDNA)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Informações Adicionais */}
          {(animal.origem || animal.fazenda_origem || animal.fazendaOrigem || animal.lote || animal.status_sanitario || animal.statusSanitario || animal.comprador || animal.destino) && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-2 mb-3">
                <DocumentTextIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <h2 className="font-semibold text-gray-900 dark:text-white">Informações Adicionais</h2>
              </div>
              <div className="space-y-2">
                {animal.origem && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Origem</span>
                    <span className="font-medium text-gray-900 dark:text-white">{animal.origem}</span>
                  </div>
                )}
                {(animal.fazenda_origem || animal.fazendaOrigem) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Fazenda origem</span>
                    <span className="font-medium text-gray-900 dark:text-white">{animal.fazenda_origem || animal.fazendaOrigem}</span>
                  </div>
                )}
                {animal.lote && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Lote</span>
                    <span className="font-medium text-gray-900 dark:text-white">{animal.lote}</span>
                  </div>
                )}
                {(animal.status_sanitario || animal.statusSanitario) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Status sanitário</span>
                    <span className="font-medium text-gray-900 dark:text-white">{animal.status_sanitario || animal.statusSanitario}</span>
                  </div>
                )}
                {(animal.comprador || animal.destino) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Comprador/Destino</span>
                    <span className="font-medium text-gray-900 dark:text-white">{animal.comprador || animal.destino}</span>
                  </div>
                )}
                {animal.receptora && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Receptora</span>
                    <span className="font-medium text-gray-900 dark:text-white">{animal.receptora}</span>
                  </div>
                )}
                {dataChegada && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Data chegada</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatDate(dataChegada)}</span>
                  </div>
                )}
                {animal.data_saida && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Data saída</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatDate(animal.data_saida)}</span>
                  </div>
                )}
                {(animal.valor_venda || animal.valorVenda) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Valor venda</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(animal.valor_venda || animal.valorVenda)}</span>
                  </div>
                )}
                {(animal.custo_aquisicao || animal.custoAquisicao) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Custo aquisição</span>
                    <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(animal.custo_aquisicao || animal.custoAquisicao)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Botão fixo inferior */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="max-w-lg mx-auto grid grid-cols-3 gap-2">
            <Link
              href="/a?buscar=1"
              className="flex items-center justify-center gap-1 py-4 rounded-xl bg-amber-600 dark:bg-amber-500 text-white font-semibold text-sm hover:bg-amber-700 dark:hover:bg-amber-600 active:scale-[0.98] transition-transform"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              Nova Consulta
            </Link>
            <Link
              href="/mobile-relatorios"
              className="flex items-center justify-center gap-1 py-4 rounded-xl bg-gray-600 dark:bg-gray-500 text-white font-semibold text-sm hover:bg-gray-700 dark:hover:bg-gray-600 active:scale-[0.98] transition-transform"
            >
              <ChartBarIcon className="h-5 w-5" />
              Relatórios
            </Link>
            <button
              type="button"
              onClick={handleShareSummary}
              disabled={sharing}
              className="flex items-center justify-center gap-1 py-4 rounded-xl bg-blue-600 dark:bg-blue-500 text-white font-semibold text-sm hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-[0.98] transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {sharing ? (
                <>
                  <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  Compartilhando
                </>
              ) : (
                <>
                  <DocumentTextIcon className="h-6 w-6" />
                  Compartilhar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      {showIABCZInfo && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={() => setShowIABCZInfo(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <TrophyIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              <h3 className="font-bold text-gray-900 dark:text-white">iABCZ e Ranking</h3>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              O iABCZ indica avaliação genética. Quanto maior, melhor a classificação. O ranking mostra a posição deste animal entre os avaliados do rebanho.
            </p>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowIABCZInfo(false)}
                className="px-4 py-2 rounded-lg bg-amber-600 dark:bg-amber-500 text-white font-semibold hover:bg-amber-700 dark:hover:bg-amber-600"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function InfoRow({ label, value }) {
  if (value == null || value === '') return null
  return (
    <div className="px-6 py-3 flex justify-between items-center">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white">{value}</span>
    </div>
  )
}


// Desabilitar layout padrão (sem sidebar)
ConsultaAnimalView.getLayout = function getLayout(page) {
  return page
}
