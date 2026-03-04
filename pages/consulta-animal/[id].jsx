/**
 * Ficha do Animal - Modo Consulta (somente leitura)
 * Usado quando o usuário acessa via /a - sem edição, sem sidebar
 * Inclui: machos = exames andrológicos | fêmeas = FIV, inseminações, gestações
 */
import React, { useEffect, useState, useCallback } from 'react'
import {
  ArrowLeftIcon,
  ChartBarIcon,
  DocumentTextIcon,
  TrophyIcon,
  PencilIcon
} from '@heroicons/react/24/outline'

import EditGeneticaModal from '../../components/animals/EditGeneticaModal'
import AnimalHeader from '../../components/animals/AnimalHeader'
import AnimalRankingHighlights from '../../components/animals/AnimalRankingHighlights'
import AnimalMetricsCards from '../../components/animals/AnimalMetricsCards'
import AnimalPlanningCards from '../../components/animals/AnimalPlanningCards'
import AnimalAndrologicalExams from '../../components/animals/AnimalAndrologicalExams'
import AnimalGestations from '../../components/animals/AnimalGestations'
import AnimalHealthProtocols from '../../components/animals/AnimalHealthProtocols'
import AnimalWeightHistory from '../../components/animals/AnimalWeightHistory'
import AnimalCosts from '../../components/animals/AnimalCosts'
import AnimalGenetics from '../../components/animals/AnimalGenetics'
import AnimalAdditionalInfo from '../../components/animals/AnimalAdditionalInfo'
import AnimalMainInfo from '../../components/animals/AnimalMainInfo'
import AnimalEmbryoTransfers from '../../components/animals/AnimalEmbryoTransfers'
import AnimalFixedActions from '../../components/animals/AnimalFixedActions'
import AnimalReproduction from '../../components/animals/AnimalReproduction'
import AnimalTimeline from '../../components/animals/AnimalTimeline'
import AnimalLocation from '../../components/animals/AnimalLocation'
import AnimalOffspring from '../../components/animals/AnimalOffspring'
import AnimalOccurrences from '../../components/animals/AnimalOccurrences'
import AnimalIVFCollections from '../../components/animals/AnimalIVFCollections'
import AnimalInseminations from '../../components/animals/AnimalInseminations'
import AnimalPhotos from '../../components/animals/AnimalPhotos'
import { useRouter } from 'next/router'
import { formatDate, formatCurrency, localizacaoValidaParaExibir, calcularMesesIdade } from '../../utils/formatters'

import { useAnimalDetails } from '../../hooks/useAnimalDetails'

// Filtrar nomes de touros que aparecem como localização (C2747 DA S.NICE, NACION 15397, etc.)

export default function ConsultaAnimalView({ darkMode = false, toggleDarkMode }) {
  const router = useRouter()
  const { id } = router.query

  const {
    animal,
    setAnimal,
    loading,
    error,
    rankings: {
      posicaoIABCZ: rankingPosicao,
      posicaoIQG: rankingPosicaoGenetica2,
      filhoTopIABCZ: filhoTopRanking,
      filhoTopIQG: filhoTopRankingIQG
    },
    maeLink,
    examesAndrologicos,
    setExamesAndrologicos
  } = useAnimalDetails(id)

  // loading e error removidos pois vêm do hook
  
  // Estados de ranking removidos pois vêm do hook
  const [showIABCZInfo, setShowIABCZInfo] = useState(false)
  const [isEditGeneticaModalOpen, setIsEditGeneticaModalOpen] = useState(false)

  const handleSaveGenetica = useCallback((updatedAnimal) => {
    setAnimal(prev => ({ ...prev, ...updatedAnimal }))
    setIsEditGeneticaModalOpen(false)
  }, [])
  const [sharing, setSharing] = useState(false)
  // maeLink removido pois vem do hook
  
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
      ((animal.iqg ?? animal.genetica_2) || (animal.iqg ?? animal.genetica_2) === 0) ? `IQG: ${(animal.iqg ?? animal.genetica_2)}${rankingPosicaoGenetica2 ? ` • ${rankingPosicaoGenetica2}º no ranking` : ''}` : null,
      ((animal.pt_iqg ?? animal.decile_2) || (animal.pt_iqg ?? animal.decile_2) === 0) ? `Pt IQG: ${(animal.pt_iqg ?? animal.decile_2)}` : null,
      locFiltrada ? `Localização: ${locFiltrada}` : null
    ].filter(Boolean).join('\n')
    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`
    window.open(url, '_blank')
  }, [animal, rankingPosicao, rankingPosicaoGenetica2, filhoTopRanking])

  // Lógica de fetch movida para useAnimalDetails hook
  // Extração de série/RG movida para useAnimalDetails hook
  // Lógica de ranking movida para useAnimalDetails hook

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
        ((animal.iqg ?? animal.genetica_2) || (animal.iqg ?? animal.genetica_2) === 0) ? `IQG: ${(animal.iqg ?? animal.genetica_2)}${rankingPosicaoGenetica2 ? ` • ${rankingPosicaoGenetica2}º no ranking` : ''}` : null,
        ((animal.pt_iqg ?? animal.decile_2) || (animal.pt_iqg ?? animal.decile_2) === 0) ? `Pt IQG: ${(animal.pt_iqg ?? animal.decile_2)}` : null,
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

  const metrics = {
    mesesIdade, diasAdicionais,
    evolucaoPeso,
    ultimoCE,
    diasDesdeExame, isInapto, diasParaProximoExame,
    custoTotal,
    diasNaFazenda,
    isPrenha, diasGestacao, diasParaParto, gestacaoProgress,
    totalIAs, taxaSucessoIA, mediaOocitos,
    isMacho, isFemea,
    elegivelBrucelose, elegivelDGT, temBrucelose, precisaBrucelose, idadeDias
  }

  return (
    <React.Fragment>
      <Head>
        <title>{nome} | Consulta Beef-Sync</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
        <AnimalHeader
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          animal={animal}
          resumoChips={resumoChips}
          setShowIABCZInfo={setShowIABCZInfo}
          rankings={{
            posicaoIABCZ: rankingPosicao,
            posicaoIQG: rankingPosicaoGenetica2,
            filhoTopIABCZ: filhoTopRanking,
            filhoTopIQG: filhoTopRankingIQG
          }}
        />

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
          <AnimalRankingHighlights animal={animal} rankings={{
            posicaoIABCZ: rankingPosicao,
            posicaoIQG: rankingPosicaoGenetica2,
            filhoTopIABCZ: filhoTopRanking,
            filhoTopIQG: filhoTopRankingIQG
          }} />

          {/* Cards de números rápidos - Grid responsivo com animações */}
          {/* Cards de números rápidos - Grid responsivo com animações */}
          <div className="relative group">
            <button
              type="button"
              onClick={() => setIsEditGeneticaModalOpen(true)}
              className="absolute -top-6 right-0 p-1 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 flex items-center gap-1 text-xs font-medium z-10"
              title="Editar dados genéticos"
            >
              <PencilIcon className="h-3 w-3" />
              Editar Genética
            </button>
            <AnimalMetricsCards animal={animal} metrics={metrics} rankings={{
              posicaoIABCZ: rankingPosicao,
              posicaoIQG: rankingPosicaoGenetica2,
              filhoTopIABCZ: filhoTopRanking,
              filhoTopIQG: filhoTopRankingIQG
            }} />
          </div>

          {/* Planejamento: Brucelose e DGT */}
          <AnimalPlanningCards metrics={metrics} />

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
                    {(() => {
                      const serie = animal.serie_mae || maeLink?.serie
                      const rg = animal.rg_mae || maeLink?.rg
                      const ident = serie && rg ? `${serie} ${rg}` : null
                      if (ident) {
                        return (
                          <Link href={`/consulta-animal/${serie}-${rg}`} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-end gap-1">
                            {ident}
                            <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 flex-shrink-0" />
                          </Link>
                        )
                      }
                      return (
                        <div className="text-right">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {animal.mae || '-'}
                          </span>
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                            ⚠️ Não encontrada no cadastro (pode estar inativa)
                          </p>
                        </div>
                      )
                    })()}
                    {animal.mae && (animal.serie_mae || maeLink) && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">
                        {animal.mae}
                      </span>
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
              {/* Informações Genéticas - sempre visíveis com cores (mobile e desktop) */}
              <div className={`px-6 py-3 flex justify-between items-center border-t ${
                (animal.abczg || animal.abczg === 0) ? (
                  filhoTopRanking ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30' :
                  rankingPosicao === 1 ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/30' :
                  rankingPosicao === 2 ? 'bg-slate-50/50 dark:bg-slate-900/10 border-slate-200 dark:border-slate-700' :
                  rankingPosicao === 3 ? 'bg-amber-50/30 dark:bg-amber-900/5 border-amber-100 dark:border-amber-800/20' :
                  rankingPosicao && rankingPosicao <= 10 ? 'bg-blue-50/30 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30' :
                  'bg-amber-50/30 dark:bg-amber-900/5 border-amber-100 dark:border-amber-800/20'
                ) : 'bg-amber-50/20 dark:bg-amber-900/5 border-amber-100/50 dark:border-amber-800/20'
              }`}>
                <span className={`text-sm font-medium flex items-center gap-1 ${
                  (animal.abczg || animal.abczg === 0) ? (
                    filhoTopRanking ? 'text-emerald-800 dark:text-emerald-200' :
                    rankingPosicao === 1 ? 'text-amber-800 dark:text-amber-200' :
                    rankingPosicao === 2 ? 'text-slate-700 dark:text-slate-300' :
                    rankingPosicao === 3 ? 'text-amber-800 dark:text-amber-200' :
                    rankingPosicao && rankingPosicao <= 10 ? 'text-blue-800 dark:text-blue-200' :
                    'text-amber-700 dark:text-amber-300'
                  ) : 'text-amber-700 dark:text-amber-300'
                }`}>
                  {filhoTopRanking ? <UserGroupIcon className="h-4 w-4" /> : <TrophyIcon className="h-4 w-4" />}
                  iABCZ (PMGZ)
                </span>
                <span className={`text-lg font-bold ${
                  (animal.abczg || animal.abczg === 0) ? (
                    filhoTopRanking ? 'text-emerald-600 dark:text-emerald-400' :
                    rankingPosicao === 1 ? 'text-amber-600 dark:text-amber-400' :
                    rankingPosicao === 2 ? 'text-slate-600 dark:text-slate-300' :
                    rankingPosicao === 3 ? 'text-amber-700 dark:text-amber-400' :
                    rankingPosicao && rankingPosicao <= 10 ? 'text-blue-600 dark:text-blue-400' :
                    'text-amber-600 dark:text-amber-400'
                  ) : 'text-amber-600/80 dark:text-amber-400/80'
                }`}>
                  {(animal.abczg || animal.abczg === 0) ? animal.abczg : 'Não informado'}
                  {filhoTopRanking && (animal.abczg || animal.abczg === 0) && (
                    <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100">
                      Mãe do 1º
                    </span>
                  )}
                  {rankingPosicao && rankingPosicao <= 10 && !filhoTopRanking && (animal.abczg || animal.abczg === 0) && (
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
              <div className={`px-6 py-3 flex justify-between items-center border-t ${
                (animal.deca || animal.deca === 0) ? 'bg-teal-50/50 dark:bg-teal-900/10 border-teal-100 dark:border-teal-800/30' : 'bg-teal-50/20 dark:bg-teal-900/5 border-teal-100/50 dark:border-teal-800/20'
              }`}>
                <span className={`text-sm font-medium flex items-center gap-1 ${
                  (animal.deca || animal.deca === 0) ? 'text-teal-800 dark:text-teal-200' : 'text-teal-700 dark:text-teal-300'
                }`}>
                  <ChartBarIcon className="h-4 w-4" />
                  DECA
                </span>
                <span className={`text-lg font-bold ${
                  (animal.deca || animal.deca === 0) ? 'text-teal-600 dark:text-teal-400' : 'text-teal-600/80 dark:text-teal-400/80'
                }`}>
                  {(animal.deca || animal.deca === 0) ? animal.deca : 'Não informado'}
                </span>
              </div>
              <div className={`px-6 py-3 flex justify-between items-center border-t ${
                ((animal.iqg ?? animal.genetica_2) || (animal.iqg ?? animal.genetica_2) === 0) ? (
                  rankingPosicaoGenetica2 === 1 ? 'bg-purple-50/50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-800/30' :
                  rankingPosicaoGenetica2 === 2 ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800/30' :
                  rankingPosicaoGenetica2 === 3 ? 'bg-violet-50/50 dark:bg-violet-900/10 border-violet-100 dark:border-violet-800/30' :
                  rankingPosicaoGenetica2 && rankingPosicaoGenetica2 <= 10 ? 'bg-blue-50/30 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30' :
                  'bg-purple-50/30 dark:bg-purple-900/5 border-purple-100 dark:border-purple-800/20'
                ) : 'bg-purple-50/20 dark:bg-purple-900/5 border-purple-100/50 dark:border-purple-800/20'
              }`}>
                <span className={`text-sm font-medium flex items-center gap-1 ${
                  ((animal.iqg ?? animal.genetica_2) || (animal.iqg ?? animal.genetica_2) === 0) ? (
                    rankingPosicaoGenetica2 === 1 ? 'text-purple-800 dark:text-purple-200' :
                    rankingPosicaoGenetica2 === 2 ? 'text-indigo-800 dark:text-indigo-200' :
                    rankingPosicaoGenetica2 === 3 ? 'text-violet-800 dark:text-violet-200' :
                    rankingPosicaoGenetica2 && rankingPosicaoGenetica2 <= 10 ? 'text-blue-800 dark:text-blue-200' :
                    'text-purple-700 dark:text-purple-300'
                  ) : 'text-purple-700 dark:text-purple-300'
                }`}>
                  <SparklesIcon className="h-4 w-4" />
                  IQG
                </span>
                <span className={`text-lg font-bold ${
                  ((animal.iqg ?? animal.genetica_2) || (animal.iqg ?? animal.genetica_2) === 0) ? (
                    rankingPosicaoGenetica2 === 1 ? 'text-purple-600 dark:text-purple-400' :
                    rankingPosicaoGenetica2 === 2 ? 'text-indigo-600 dark:text-indigo-400' :
                    rankingPosicaoGenetica2 === 3 ? 'text-violet-600 dark:text-violet-400' :
                    rankingPosicaoGenetica2 && rankingPosicaoGenetica2 <= 10 ? 'text-blue-600 dark:text-blue-400' :
                    'text-purple-600 dark:text-purple-400'
                  ) : 'text-purple-600/80 dark:text-purple-400/80'
                }`}>
                  {((animal.iqg ?? animal.genetica_2) || (animal.iqg ?? animal.genetica_2) === 0) ? (animal.iqg ?? animal.genetica_2) : 'Não informado'}
                  {rankingPosicaoGenetica2 && rankingPosicaoGenetica2 <= 10 && ((animal.iqg ?? animal.genetica_2) || (animal.iqg ?? animal.genetica_2) === 0) && (
                    <span className={`ml-2 text-xs font-normal px-2 py-0.5 rounded-full ${
                      rankingPosicaoGenetica2 === 1 ? 'bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-100' :
                      rankingPosicaoGenetica2 === 2 ? 'bg-indigo-200 dark:bg-indigo-800 text-indigo-900 dark:text-indigo-100' :
                      rankingPosicaoGenetica2 === 3 ? 'bg-violet-200 dark:bg-violet-800 text-violet-900 dark:text-violet-100' :
                      'bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100'
                    }`}>
                      {rankingPosicaoGenetica2}º ranking
                    </span>
                  )}
                </span>
              </div>
              <div className={`px-6 py-3 flex justify-between items-center border-t ${
                ((animal.pt_iqg ?? animal.decile_2) || (animal.pt_iqg ?? animal.decile_2) === 0) ? 'bg-cyan-50/50 dark:bg-cyan-900/10 border-cyan-100 dark:border-cyan-800/30' : 'bg-cyan-50/20 dark:bg-cyan-900/5 border-cyan-100/50 dark:border-cyan-800/20'
              }`}>
                <span className={`text-sm font-medium flex items-center gap-1 ${
                  ((animal.pt_iqg ?? animal.decile_2) || (animal.pt_iqg ?? animal.decile_2) === 0) ? 'text-cyan-800 dark:text-cyan-200' : 'text-cyan-700 dark:text-cyan-300'
                }`}>
                  <CubeTransparentIcon className="h-4 w-4" />
                  Pt IQG
                </span>
                <span className={`text-lg font-bold ${
                  ((animal.pt_iqg ?? animal.decile_2) || (animal.pt_iqg ?? animal.decile_2) === 0) ? 'text-cyan-600 dark:text-cyan-400' : 'text-cyan-600/80 dark:text-cyan-400/80'
                }`}>
                  {((animal.pt_iqg ?? animal.decile_2) || (animal.pt_iqg ?? animal.decile_2) === 0) ? (animal.pt_iqg ?? animal.decile_2) : 'Não informado'}
                </span>
              </div>
              <InfoRow label="Brinco" value={animal.brinco} />
              <InfoRow label="Tatuagem" value={animal.tatuagem} />
              {(animal.valor_venda || animal.valorVenda) && (
                <InfoRow label="Valor venda" value={formatCurrency(animal.valor_venda || animal.valorVenda)} />
              )}
              <InfoRow label="Comprador/Destino" value={animal.comprador || animal.destino} />
              <InfoRow label="Receptora" value={animal.receptora} />
              <InfoRow 
                label="Situação ABCZ" 
                value={animal.situacao_abcz || animal.situacaoAbcz || 'Não informado'} 
                action={
                  <button
                    type="button"
                    onClick={() => setIsEditGeneticaModalOpen(true)}
                    className="p-1 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                    title="Editar dados genéticos"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                }
              />
              {(animal.custo_aquisicao || animal.custoAquisicao) && (
                <InfoRow label="Custo aquisição" value={formatCurrency(animal.custo_aquisicao || animal.custoAquisicao)} />
              )}
              <InfoRow label="Observações" value={animal.observacoes} />
            </div>
          </div>

          {/* Exames Andrológicos - MACHOS */}
          <AnimalAndrologicalExams examesAndrologicos={examesAndrologicos} />

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
          <AnimalGestations gestacoes={animal.gestacoes} />

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
                          {((f.iqg ?? f.genetica_2) != null && (f.iqg ?? f.genetica_2) !== '') && <span className="font-medium text-purple-600 dark:text-purple-400">IQG: {(f.iqg ?? f.genetica_2)}</span>}
                          {((f.pt_iqg ?? f.decile_2) != null && (f.pt_iqg ?? f.decile_2) !== '') && <span className="font-medium text-amber-600 dark:text-amber-400">Pt IQG: {(f.pt_iqg ?? f.decile_2)}</span>}
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
    <React.Fragment>
      <Head>
        <title>{nome} | Consulta Beef-Sync</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
        <AnimalHeader
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          animal={animal}
          resumoChips={resumoChips}
          setShowIABCZInfo={setShowIABCZInfo}
          rankings={{
            posicaoIABCZ: rankingPosicao,
            posicaoIQG: rankingPosicaoGenetica2,
            filhoTopIABCZ: filhoTopRanking,
            filhoTopIQG: filhoTopRankingIQG
          }}
        />

        <div className="max-w-lg mx-auto p-4 space-y-4">
          <AnimalMetricsCards animal={animal} metrics={metrics} rankings={{
            posicaoIABCZ: rankingPosicao,
            posicaoIQG: rankingPosicaoGenetica2,
            filhoTopIABCZ: filhoTopRanking,
            filhoTopIQG: filhoTopRankingIQG
          }} />

          <AnimalMainInfo
            animal={animal}
            rankings={{
              posicaoIABCZ: rankingPosicao,
              posicaoIQG: rankingPosicaoGenetica2,
              filhoTopIABCZ: filhoTopRanking,
              filhoTopIQG: filhoTopRankingIQG
            }}
            metrics={{...metrics, locAtual, ultimoCE, diasDesdeExame, isPrenha, diasGestacao, diasParaParto, previsaoPartoExibir, ultimaIA}}
            examesAndrologicos={examesAndrologicos}
            ultimaIA={ultimaIA}
            totalOocitos={totalOocitos}
            onCopyIdent={handleCopyIdent}
            onWhatsAppShare={handleWhatsAppShare}
            onEditGenetica={() => setIsEditGeneticaModalOpen(true)}
            maeLink={maeLink}
            locAtual={locAtual}
          />

          <AnimalPlanningCards animal={animal} metrics={metrics} />

          <AnimalAndrologicalExams examesAndrologicos={examesAndrologicos} />
          
          <AnimalGestations gestacoes={animal.gestacoes || []} />
          
          <AnimalInseminations inseminacoes={inseminacoesParaExibir} />

          <AnimalReproduction animal={animal} />
          
          <AnimalIVFCollections animal={animal} totalOocitos={totalOocitos} mediaOocitos={mediaOocitos} />
          
          <AnimalEmbryoTransfers transferencias={animal.transferencias || transferencias} />

          <AnimalTimeline animal={animal} />

          <AnimalLocation animal={animal} locAtual={locAtual} diasNaFazenda={diasNaFazenda} />

          <AnimalOffspring animal={animal} />

          <AnimalOccurrences animal={animal} ocorrencias={ocorrencias} />

          <AnimalHealthProtocols animal={animal} />

          <AnimalWeightHistory animal={animal} />

          <AnimalCosts animal={animal} />

          <AnimalGenetics animal={animal} />

          <AnimalNotes animal={animal} />

          <AnimalPhotos animal={animal} />

          <AnimalAdditionalInfo animal={animal} />
        </div>
      </div>

      <AnimalFixedActions onShare={handleShareSummary} isSharing={sharing} />

      {/* Modals */}
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

      {isEditGeneticaModalOpen && (
        <EditGeneticaModal
          isOpen={isEditGeneticaModalOpen}
          onClose={() => setIsEditGeneticaModalOpen(false)}
          animal={animal}
          onSave={handleSaveGenetica}
        />
      )}
    </React.Fragment>
  );
}

