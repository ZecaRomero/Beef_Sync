import { useState, useEffect, useMemo } from 'react'
import { useOptimizedFetch } from './useOptimizedFetch'

export function useAnimalDetails(id) {
  const [animal, setAnimal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Dados complementares
  const [ocorrencias, setOcorrencias] = useState([])
  const [transferencias, setTransferencias] = useState([])
  const [inseminacoes, setInseminacoes] = useState([])
  const [examesAndrologicos, setExamesAndrologicos] = useState([])
  const [maeLink, setMaeLink] = useState(null)

  // Rankings
  const [rankings, setRankings] = useState({
    posicaoIABCZ: null,
    posicaoIQG: null,
    filhoTopIABCZ: null,
    filhoTopIQG: null
  })

  // 1. Buscar dados principais do animal
  const { 
    data: animalData, 
    loading: animalLoading, 
    error: animalError 
  } = useOptimizedFetch({
    url: id ? `/api/animals/${id}?history=true` : '',
    cache: true,
    cacheTTL: 60000
  })

  // Atualizar animal e disparar buscas secundárias
  useEffect(() => {
    if (animalData) {
      const a = animalData.data || animalData.animal || animalData
      if (a && (a.id || a.serie)) {
        setAnimal(a)
        
        // Buscas paralelas secundárias
        const fetchPromises = []
        
        // Exames Andrológicos (apenas machos)
        const isMacho = a.sexo && (String(a.sexo).toLowerCase().includes('macho') || a.sexo === 'M')
        if (isMacho && a.rg) {
          fetchPromises.push(
            fetch(`/api/reproducao/exames-andrologicos?rg=${encodeURIComponent(a.rg)}`)
              .then(r => r.json())
              .then(d => setExamesAndrologicos(Array.isArray(d.data ?? d) ? (d.data ?? d) : []))
              .catch(() => {})
          )
        }

        // Ocorrências
        if (a.id) {
          fetchPromises.push(
            fetch(`/api/animals/ocorrencias?animalId=${a.id}&limit=20`)
              .then(r => r.json())
              .then(d => setOcorrencias(Array.isArray(d.ocorrencias || d.data || d) ? (d.ocorrencias || d.data || d) : []))
              .catch(() => {})
          )
          
          // Transferências (receptoras)
          fetchPromises.push(
            fetch(`/api/transferencias-embrioes?receptora_id=${a.id}`)
              .then(r => r.json())
              .then(d => setTransferencias(Array.isArray(d.data || d.transferencias || d) ? (d.data || d.transferencias || d) : []))
              .catch(() => {})
          )

          // Inseminações (fêmeas)
          const isFemea = !isMacho // Simplificação, verificar string se necessário
          if (isFemea) {
             fetchPromises.push(
              fetch(`/api/inseminacoes?animal_id=${a.id}`)
                .then(r => r.json())
                .then(d => setInseminacoes(Array.isArray(d.data || d) ? (d.data || d) : []))
                .catch(() => {})
            )
          }
        }

        Promise.all(fetchPromises).finally(() => setLoading(false))

      } else {
        setError('Animal não encontrado')
        setLoading(false)
      }
    } else if (animalError) {
      setError('Erro ao carregar dados')
      setLoading(false)
    }
  }, [animalData, animalError])

  // Buscar Rankings (separado para não bloquear render inicial)
  useEffect(() => {
    if (!animal?.id) return

    const fetchRankings = async () => {
      try {
        const [resIABCZ, resIQG] = await Promise.all([
          fetch('/api/animals/ranking-iabcz?limit=50').then(r => r.json()),
          fetch('/api/animals/ranking-iqg?limit=50').then(r => r.json())
        ])

        const newRankings = { ...rankings }
        const serieMatch = String(animal.serie || '').toUpperCase()

        // Processar IABCZ
        if (resIABCZ.success && resIABCZ.data?.length) {
          const list = resIABCZ.data
          const idx = list.findIndex(r => 
            r.id === animal.id || (String(r.rg) === String(animal.rg) && String(r.serie || '').toUpperCase() === serieMatch)
          )
          if (idx >= 0) newRankings.posicaoIABCZ = idx + 1

          const primeiro = list[0]
          const filhoTop = animal.filhos?.find(f => 
            f.id === primeiro?.id || 
            (String(f.rg) === String(primeiro?.rg) && String(f.serie || '').toUpperCase() === String(primeiro?.serie || '').toUpperCase())
          )
          if (filhoTop) newRankings.filhoTopIABCZ = { serie: primeiro.serie, rg: primeiro.rg, nome: primeiro.nome }
        }

        // Processar IQG
        if (resIQG.success && resIQG.data?.length) {
          const list = resIQG.data
          const idx = list.findIndex(r => 
            r.id === animal.id || (String(r.rg) === String(animal.rg) && String(r.serie || '').toUpperCase() === serieMatch)
          )
          if (idx >= 0) newRankings.posicaoIQG = idx + 1

          const primeiro = list[0]
          const filhoTop = animal.filhos?.find(f => 
            f.id === primeiro?.id || 
            (String(f.rg) === String(primeiro?.rg) && String(f.serie || '').toUpperCase() === String(primeiro?.serie || '').toUpperCase())
          )
          if (filhoTop) newRankings.filhoTopIQG = { serie: primeiro.serie, rg: primeiro.rg, nome: primeiro.nome, iqg: primeiro.iqg }
        }

        setRankings(newRankings)
      } catch (e) {
        console.error('Erro ao buscar rankings', e)
      }
    }

    fetchRankings()
  }, [animal?.id])

  // Buscar Mãe Link
  useEffect(() => {
    if (!animal?.mae) return
    
    const extrairSerieRG = (t) => {
      if (!t) return { serie: '', rg: '' }
      t = String(t).trim()
      const m1 = t.match(/^([A-Za-z]+)-(\d+)$/)
      if (m1) return { serie: m1[1], rg: m1[2] }
      const m2 = t.match(/^([A-Za-z]+)\s+(\d+)$/)
      if (m2) return { serie: m2[1], rg: m2[2] }
      return { serie: '', rg: '' }
    }

    const { serie, rg } = extrairSerieRG(animal.mae)
    if (serie && rg) {
      setMaeLink({ serie, rg })
    } else {
      const p = new URLSearchParams({ mae: animal.mae.trim() })
      if (animal.serie) p.set('animalSerie', animal.serie)
      if (animal.rg) p.set('animalRg', animal.rg)
      fetch(`/api/animals/buscar-mae?${p}`)
        .then(r => r.json())
        .then(d => d.success ? setMaeLink({ serie: d.serie, rg: d.rg }) : setMaeLink(null))
        .catch(() => setMaeLink(null))
    }
  }, [animal?.mae])

  // CÁLCULOS E MÉTRICAS (Refatorado do [id].jsx)
  const metrics = useMemo(() => {
    if (!animal) return {}

    // 1. Identificação e Idade
    const dataNasc = animal.data_nascimento ? new Date(animal.data_nascimento) : null
    const hoje = new Date()
    const mesesIdade = dataNasc ? Math.floor((hoje - dataNasc) / (1000 * 60 * 60 * 24 * 30.44)) : null
    const anosIdade = mesesIdade != null ? (mesesIdade / 12).toFixed(1) : null
    const idadeDias = dataNasc ? Math.floor((hoje - dataNasc) / (1000 * 60 * 60 * 24)) : null
    
    // Dias adicionais (além dos meses)
    let diasAdicionais = null
    if (dataNasc && mesesIdade != null) {
      const diasEmMeses = Math.floor(mesesIdade * 30.44)
      diasAdicionais = idadeDias - diasEmMeses
    }

    // 2. Localização e Tempo
    const dataChegada = animal.data_chegada || animal.dataChegada
    const diasNaFazenda = dataChegada ? Math.floor((hoje - new Date(dataChegada)) / (1000 * 60 * 60 * 24)) : null
    
    // 3. Sexo
    const isMacho = animal.sexo && (String(animal.sexo).toLowerCase().includes('macho') || animal.sexo === 'M')
    const isFemea = !isMacho

    // 4. Custos
    const custosArray = Array.isArray(animal.custos) ? animal.custos : []
    const custoTotal = custosArray.reduce((s, c) => s + parseFloat(c.valor || 0), 0)

    // 5. Planejamento Sanitário (Brucelose)
    const temBrucelose = custosArray.some(c => {
      const t = String(c.tipo || '').toLowerCase()
      const s = String(c.subtipo || '').toLowerCase()
      const o = String(c.observacoes || '').toLowerCase()
      return (t.includes('vacina') || t.includes('vacinação')) && (s.includes('brucelose') || o.includes('brucelose'))
    })
    const elegivelBrucelose = isFemea && idadeDias != null && idadeDias >= 90 && idadeDias <= 240 && !temBrucelose
    const precisaBrucelose = isFemea && idadeDias != null && idadeDias <= 240 && !temBrucelose
    const elegivelDGT = idadeDias != null && idadeDias >= 330 && idadeDias <= 640

    // 6. Reprodução (Fêmeas)
    // Ordenar inseminações
    const insOrdenadas = [...inseminacoes].sort((a, b) => new Date(b.data_ia || b.data || 0) - new Date(a.data_ia || a.data || 0))
    const ehVazia = (ia) => {
      const r = String(ia.resultado_dg || ia.status_gestacao || '').toLowerCase()
      return r.includes('vazia') || r.includes('vazio') || r.includes('negativo')
    }
    const ehPrenha = (ia) => {
      if (ehVazia(ia)) return false
      const r = String(ia.resultado_dg || ia.status_gestacao || '').toLowerCase()
      return r.includes('prenha') || r.includes('pren') || r.includes('positivo') || r.trim() === 'p'
    }
    
    const iaPrenha = insOrdenadas.find(ehPrenha)
    const ultimaIA = iaPrenha || insOrdenadas.find(ia => !ehVazia(ia)) || insOrdenadas[0]
    
    // Previsão de parto via IA
    let previsaoPartoIA = null
    if ((iaPrenha || (insOrdenadas[0] && !ehVazia(insOrdenadas[0]))) && ultimaIA) {
      const d = new Date(ultimaIA.data_ia || ultimaIA.data_inseminacao || ultimaIA.data)
      if (!isNaN(d.getTime())) previsaoPartoIA = new Date(d.getTime() + 285 * 24 * 60 * 60 * 1000)
    }

    // Status Gestação Global
    const resultadoAnimal = String(animal.resultado_dg || animal.resultadoDG || '').toLowerCase()
    const estaVaziaAnimal = resultadoAnimal.includes('vazia') || resultadoAnimal.includes('vazio') || resultadoAnimal.includes('negativo')
    const isPrenha = !!iaPrenha || (!estaVaziaAnimal && (resultadoAnimal.includes('prenha') || resultadoAnimal.includes('pren') || resultadoAnimal.includes('positivo') || resultadoAnimal.trim() === 'p'))
    
    const dataCobertura = animal.data_te || animal.dataTE || (iaPrenha?.data_ia || iaPrenha?.data)
    const diasGestacao = (isPrenha && dataCobertura) ? Math.floor((hoje - new Date(dataCobertura)) / (1000 * 60 * 60 * 24)) : null
    
    let previsaoParto = (isPrenha && dataCobertura) ? new Date(new Date(dataCobertura).getTime() + 285 * 24 * 60 * 60 * 1000) : null
    if (!previsaoParto && isPrenha) previsaoParto = previsaoPartoIA
    
    const diasParaParto = previsaoParto ? Math.max(0, Math.floor((previsaoParto - hoje) / (1000 * 60 * 60 * 24))) : null
    const gestacaoProgress = diasGestacao != null ? Math.min(100, Math.max(0, Math.round((diasGestacao / 285) * 100))) : null

    // Taxas
    const totalIAs = insOrdenadas.length
    const totalPrenhas = insOrdenadas.filter(ehPrenha).length
    const taxaSucessoIA = totalIAs > 0 ? Math.round((totalPrenhas / totalIAs) * 100) : null

    const totalOocitos = animal.fivs?.reduce((s, f) => s + (parseInt(f.quantidade_oocitos) || 0), 0) || 0
    const mediaOocitos = (animal.fivs?.length > 0 && totalOocitos > 0) ? (totalOocitos / animal.fivs.length).toFixed(1) : null

    // 7. Peso e CE
    const pesagens = animal.pesagens || []
    const ultimaPesagem = pesagens[0]
    const primeiraPesagem = pesagens[pesagens.length - 1]
    const evolucaoPeso = (ultimaPesagem?.peso && primeiraPesagem?.peso && pesagens.length > 1)
      ? (parseFloat(ultimaPesagem.peso) - parseFloat(primeiraPesagem.peso)).toFixed(1)
      : null

    // CE (Circunferência Escrotal)
    let ultimoCE = null
    if (isMacho) {
      // Prioridade: Pesagens > Ocorrências > Exames
      const pCE = pesagens.find(p => p.ce && parseFloat(p.ce) > 0)
      if (pCE) ultimoCE = pCE.ce
      else {
        const oCE = ocorrencias.find(o => o.ce && parseFloat(o.ce) > 0)
        if (oCE) ultimoCE = oCE.ce
        else {
          const eCE = examesAndrologicos.find(e => e.ce && parseFloat(e.ce) > 0)
          if (eCE) ultimoCE = eCE.ce
        }
      }
    }

    // Andrológico
    const ultExame = examesAndrologicos[0]
    const diasDesdeExame = ultExame?.data_exame ? Math.floor((hoje - new Date(ultExame.data_exame)) / (1000 * 60 * 60 * 24)) : null
    const isInapto = ultExame && String(ultExame.resultado || '').toUpperCase().includes('INAPTO')
    const dataProximoExame = (isInapto && ultExame?.data_exame) ? new Date(new Date(ultExame.data_exame).getTime() + 30 * 24 * 60 * 60 * 1000) : null
    const diasParaProximoExame = dataProximoExame ? Math.floor((dataProximoExame - hoje) / (1000 * 60 * 60 * 24)) : null

    return {
      mesesIdade, anosIdade, idadeDias, diasAdicionais,
      diasNaFazenda,
      isMacho, isFemea,
      custoTotal, custosArray,
      temBrucelose, elegivelBrucelose, precisaBrucelose, elegivelDGT,
      isPrenha, diasGestacao, previsaoParto, diasParaParto, gestacaoProgress,
      totalIAs, taxaSucessoIA, totalOocitos, mediaOocitos,
      evolucaoPeso,
      ultimoCE,
      ultExame, diasDesdeExame, isInapto, diasParaProximoExame
    }
  }, [animal, inseminacoes, ocorrencias, examesAndrologicos])

  return {
    animal,
    setAnimal,
    loading,
    error,
    // Dados brutos
    ocorrencias,
    transferencias,
    inseminacoes,
    examesAndrologicos,
    setExamesAndrologicos,
    maeLink,
    rankings,
    // Métricas calculadas
    metrics
  }
}