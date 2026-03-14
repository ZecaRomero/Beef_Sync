import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useOptimizedFetch, invalidateCache } from './useOptimizedFetch'
import { useServerEvents } from './useServerEvents'
import { extrairSerieRG } from '../utils/animalUtils'

export function useAnimalDetails(id) {
  const [animal, setAnimal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const prevIdRef = useRef(null)

  // Dados complementares
  const [ocorrencias, setOcorrencias] = useState([])
  const [transferencias, setTransferencias] = useState([])
  const [inseminacoes, setInseminacoes] = useState([])
  const [examesAndrologicos, setExamesAndrologicos] = useState([])
  const [maeLink, setMaeLink] = useState(null)
  const [maeColetas, setMaeColetas] = useState(null)
  const [baixasResumo, setBaixasResumo] = useState(null) // { baixaPropria, resumoMae }
  const [baixasMae, setBaixasMae] = useState(null) // resumo de baixas da mÃ£e (exibido na ficha do filho)

  // Ref para controlar se componente ainda estÃ¡ montado (evitar setState apÃ³s unmount)
  const mountedRef = useRef(true)

  // Rankings (iABCZg, DECA, IQG, Pt IQG, MGTe)
  const [rankings, setRankings] = useState({
    posicaoIABCZ: null,
    posicaoDECA: null,
    posicaoIQG: null,
    posicaoPtIQG: null,
    posicaoMGte: null,
    filhoTopIABCZ: null,
    filhoTopDECA: null,
    filhoTopIQG: null,
    filhoTopPtIQG: null
  })

  // Invalidar cache IMEDIATAMENTE quando ID mudar (antes do fetch) - evita mostrar animal errado
  if (id && id !== prevIdRef.current) {
    prevIdRef.current = id
    invalidateCache(`/api/animals/`)
  }

  // Resetar estado quando ID da URL mudar
  useEffect(() => {
    if (id) {
      setAnimal(null)
      setError(null)
      setLoading(true)
      setRetryCount(0)
    }
  }, [id])

  // 1. Buscar dados principais do animal (cache desabilitado para consulta - evita animal errado)
  const [retryCount, setRetryCount] = useState(0)
  const fetchUrl = id ? `/api/animals/${encodeURIComponent(id)}?history=true${retryCount > 0 ? `&_r=${retryCount}` : ''}` : ''
  const { 
    data: animalData, 
    loading: animalLoading, 
    error: animalError 
  } = useOptimizedFetch({
    url: fetchUrl,
    cache: false,
    cacheTTL: 0
  })

  // Atualizar animal e disparar buscas secundÃ¡rias
  useEffect(() => {
    if (animalData) {
      const a = animalData.data || animalData.animal || animalData
      if (a && (a.id || a.serie)) {
        setAnimal(a)
        
        // Buscas paralelas secundÃ¡rias
        const fetchPromises = []
        
        // Exames AndrolÃ³gicos (apenas machos)
        const isMacho = a.sexo && (String(a.sexo).toLowerCase().includes('macho') || a.sexo === 'M')
        if (isMacho && a.rg) {
          fetchPromises.push(
            fetch(`/api/reproducao/exames-andrologicos?rg=${encodeURIComponent(a.rg)}`)
              .then(r => r.json())
              .then(d => setExamesAndrologicos(Array.isArray(d.data ?? d) ? (d.data ?? d) : []))
              .catch(() => {})
          )
        }

        // OcorrÃªncias
        if (a.id) {
          fetchPromises.push(
            fetch(`/api/animals/ocorrencias?animalId=${a.id}&limit=20`)
              .then(r => r.json())
              .then(d => setOcorrencias(Array.isArray(d.ocorrencias || d.data || d) ? (d.ocorrencias || d.data || d) : []))
              .catch(() => {})
          )
          
          // TransferÃªncias (receptoras)
          fetchPromises.push(
            fetch(`/api/transferencias-embrioes?receptora_id=${a.id}`)
              .then(r => r.json())
              .then(d => setTransferencias(Array.isArray(d.data || d.transferencias || d) ? (d.data || d.transferencias || d) : []))
              .catch(() => {})
          )

          // InseminaÃ§Ãµes (fÃªmeas)
          const isFemea = !isMacho // SimplificaÃ§Ã£o, verificar string se necessÃ¡rio
          if (isFemea) {
             fetchPromises.push(
              fetch(`/api/inseminacoes?animal_id=${a.id}&_t=${Date.now()}`)
                .then(r => r.json())
                .then(d => setInseminacoes(Array.isArray(d.data || d) ? (d.data || d) : []))
                .catch(() => {})
            )
          }

          // Custos: buscar sempre (fallback se API principal nÃ£o retornou ou retornou vazio)
          fetchPromises.push(
            fetch(`/api/animals/${a.id}/custos?_t=${Date.now()}`)
              .then(r => r.ok ? r.json() : { data: [] })
              .then(d => {
                const custos = Array.isArray(d.data ?? d.custos ?? d) ? (d.data ?? d.custos ?? d) : []
                setAnimal(prev => prev ? { ...prev, custos } : prev)
              })
              .catch(() => {})
          )
        }

        Promise.all(fetchPromises).finally(() => setLoading(false))

      } else {
        setError('Animal nÃ£o encontrado')
        setLoading(false)
      }
    } else if (animalError) {
      const msg = animalError?.message || ''
      const is404 = msg.includes('404')
      if (is404 && retryCount < 2) {
        // Retry atÃ© 2x (3 tentativas total) - evita 404 intermitente (replicaÃ§Ã£o/timing)
        const delay = retryCount === 0 ? 800 : 1500
        const t = setTimeout(() => setRetryCount(c => c + 1), delay)
        return () => clearTimeout(t)
      }
      setError(is404 ? 'Animal nÃ£o encontrado' : 'Erro ao carregar dados')
      setLoading(false)
    }
  }, [animalData, animalError, retryCount])

  // Buscar Rankings (separado para nÃ£o bloquear render inicial)
  useEffect(() => {
    if (!animal?.id) return

    const fetchRankings = async () => {
      try {
        const [resIABCZ, resDECA, resIQG, resPtIQG] = await Promise.all([
          fetch('/api/animals/ranking-iabcz?limit=50').then(r => r.json()),
          fetch('/api/animals/ranking-deca?limit=50').then(r => r.json()),
          fetch('/api/animals/ranking-iqg?limit=50').then(r => r.json()),
          fetch('/api/animals/ranking-pt-iqg?limit=50').then(r => r.json())
        ])

        const newRankings = { ...rankings }
        const serieMatch = String(animal.serie || '').toUpperCase()

        const processarRanking = (list, campoPosicao, campoFilhoTop, primeiroExtra = null) => {
          if (!list?.length) return
          const idx = list.findIndex(r => 
            r.id === animal.id || (String(r.rg) === String(animal.rg) && String(r.serie || '').toUpperCase() === serieMatch)
          )
          if (idx >= 0) newRankings[campoPosicao] = idx + 1

          const primeiro = list[0]
          const maeConfere = primeiro?.serie_mae != null && primeiro?.rg_mae != null &&
            String(primeiro.serie_mae || '').trim().toUpperCase() === String(animal.serie || '').trim().toUpperCase() &&
            String(primeiro.rg_mae || '').trim() === String(animal.rg || '').trim()
          const filhoTop = maeConfere || animal.filhos?.find(f =>
            f.id === primeiro?.id ||
            (String(f.rg) === String(primeiro?.rg) && String(f.serie || '').toUpperCase() === String(primeiro?.serie || '').toUpperCase())
          )
          if (filhoTop) {
            newRankings[campoFilhoTop] = { serie: primeiro.serie, rg: primeiro.rg, nome: primeiro.nome, ...primeiroExtra }
          }
        }

        if (resIABCZ.success && resIABCZ.data?.length) processarRanking(resIABCZ.data, 'posicaoIABCZ', 'filhoTopIABCZ')
        if (resDECA.success && resDECA.data?.length) processarRanking(resDECA.data, 'posicaoDECA', 'filhoTopDECA', { deca: resDECA.data[0]?.deca })
        if (resIQG.success && resIQG.data?.length) processarRanking(resIQG.data, 'posicaoIQG', 'filhoTopIQG', { iqg: resIQG.data[0]?.iqg })
        if (resPtIQG.success && resPtIQG.data?.length) processarRanking(resPtIQG.data, 'posicaoPtIQG', 'filhoTopPtIQG', { pt_iqg: resPtIQG.data[0]?.pt_iqg })

        // MGTe: API especÃ­fica retorna posiÃ§Ã£o (nÃ£o estÃ¡ no ranking limit 50)
        if (animal.serie && animal.rg) {
          try {
            const resMgte = await fetch(`/api/animals/ranking-mgte-posicao?serie=${encodeURIComponent(animal.serie)}&rg=${encodeURIComponent(animal.rg)}`).then(r => r.json())
            if (resMgte.success && resMgte.posicao != null) {
              newRankings.posicaoMGte = resMgte.posicao
            }
          } catch (_) {}
        }

        setRankings(newRankings)
      } catch (e) {
        console.error('Erro ao buscar rankings', e)
      }
    }

    fetchRankings()
  }, [animal?.id])

  // FunÃ§Ã£o de refresh dos dados secundÃ¡rios (inseminaÃ§Ãµes, ocorrÃªncias, TEs)
  const refreshSecondary = useCallback((a) => {
    if (!a?.id) return
    const isMacho = a.sexo && (String(a.sexo).toLowerCase().includes('macho') || a.sexo === 'M')
    const promises = [
      fetch(`/api/animals/ocorrencias?animalId=${a.id}&limit=20`)
        .then(r => r.json())
        .then(d => { if (mountedRef.current) setOcorrencias(Array.isArray(d.ocorrencias || d.data || d) ? (d.ocorrencias || d.data || d) : []) })
        .catch(() => {}),
      fetch(`/api/transferencias-embrioes?receptora_id=${a.id}`)
        .then(r => r.json())
        .then(d => { if (mountedRef.current) setTransferencias(Array.isArray(d.data || d.transferencias || d) ? (d.data || d.transferencias || d) : []) })
        .catch(() => {}),
    ]
    if (!isMacho) {
      promises.push(
        fetch(`/api/inseminacoes?animal_id=${a.id}&_t=${Date.now()}`)
          .then(r => r.json())
          .then(d => { if (mountedRef.current) setInseminacoes(Array.isArray(d.data || d) ? (d.data || d) : []) })
          .catch(() => {})
      )
    }
    if (isMacho && a.rg) {
      promises.push(
        fetch(`/api/reproducao/exames-andrologicos?rg=${encodeURIComponent(a.rg)}`)
          .then(r => r.json())
          .then(d => { if (mountedRef.current) setExamesAndrologicos(Array.isArray(d.data ?? d) ? (d.data ?? d) : []) })
          .catch(() => {})
      )
    }
    return Promise.all(promises)
  }, [])

  // OpÃ§Ã£o 1: Polling automÃ¡tico a cada 30s (fallback quando SSE nÃ£o estiver disponÃ­vel)
  useEffect(() => {
    if (!id || !animal?.id) return

    const poll = () => {
      if (document.hidden) return // NÃ£o pollar com aba em background
      invalidateCache(`/api/animals/${id}`)
      // O refetch Ã© disparado automaticamente pelo useOptimizedFetch ao invalidar o cache
      // Para os dados secundÃ¡rios, atualizamos diretamente
      refreshSecondary(animal)
    }

    const interval = setInterval(poll, 30000)
    return () => clearInterval(interval)
  }, [id, animal?.id, refreshSecondary])

  // Cleanup ref ao desmontar
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // OpÃ§Ã£o 3: SSE ââ‚¬â€� recebe eventos push do servidor e atualiza imediatamente
  useServerEvents((event) => {
    if (!id || !animal) return

    const isThisAnimal = event.animalId === animal.id || event.animalId === Number(id)

    if (event.type === 'animal.updated' && isThisAnimal) {
      // Invalidar cache e buscar dados frescos do animal
      invalidateCache(`/api/animals/${id}`)
      refreshSecondary(animal)
    }

    if (event.type === 'animal.created') {
      // Novo animal criado ââ‚¬â€� nÃ£o afeta a ficha atual, mas pode ser relevante para rankings
      invalidateCache('/api/animals/ranking')
    }

    if (
      (event.type === 'inseminacao.created' || event.type === 'inseminacao.updated' || event.type === 'inseminacao.deleted') &&
      (isThisAnimal || event.all)
    ) {
      // Invalidar cache e buscar dados frescos do animal
      invalidateCache(`/api/animals/${id}`)
      refreshSecondary(animal)
    }

    if (
      (event.type === 'pesagem.created') &&
      isThisAnimal
    ) {
      // Pesagem nova ââ‚¬â€� invalida para forÃ§ar re-fetch do animal com pesagens
      invalidateCache(`/api/animals/${id}`)
    }
  })

  // Buscar MÃ£e Link e coletas FIV da mÃ£e (quando nÃ£o cadastrada)
  useEffect(() => {
    // Permitir buscar quando tem serie_mae+rg_mae mesmo sem mae (ex: CJCJ 16013)
    const temSerieRgMae = animal?.serie_mae && animal?.rg_mae
    if (!animal?.mae && !temSerieRgMae) {
      setMaeLink(null)
      setMaeColetas(null)
      return
    }

    const { serie, rg } = animal?.mae ? extrairSerieRG(animal.mae, animal.serie) : { serie: '', rg: '' }
    
    // Se tem serie_mae e rg_mae, usar isso (mais confiÃ¡vel)
    const serieMae = animal.serie_mae || serie
    const rgMae = animal.rg_mae || rg
    
    if (serieMae && rgMae) {
      setMaeLink({ serie: serieMae, rg: rgMae })
      
      // SEMPRE buscar coletas FIV, mesmo que a mÃ£e tenha link
      const params = new URLSearchParams()
      params.set('serie', serieMae)
      params.set('rg', rgMae)
      
      console.log('ðÅ¸â€�� Buscando coletas FIV da mÃ£e:', `${serieMae} ${rgMae}`)
      
      fetch(`/api/animals/doadora-coletas?${params}`)
        .then(r2 => r2.json())
        .then(d2 => {
          console.log('ðÅ¸â€œÅ  Resultado coletas mÃ£e:', d2)
          if (d2.success && d2.data?.resumo) {
            setMaeColetas(d2.data)
            console.log('âÅ“â€¦ Coletas da mÃ£e encontradas:', d2.data.resumo.totalColetas)
          } else {
            setMaeColetas(null)
            console.log('ââ€ž¹ï¸� Nenhuma coleta encontrada para a mÃ£e')
          }
        })
        .catch((err) => {
          console.error('â�Å’ Erro ao buscar coletas da mÃ£e:', err)
          setMaeColetas(null)
        })
    } else {
      // Tentar buscar por nome
      const p = new URLSearchParams({ mae: animal.mae.trim() })
      if (animal.serie) p.set('animalSerie', animal.serie)
      if (animal.rg) p.set('animalRg', animal.rg)
      fetch(`/api/animals/buscar-mae?${p}`)
        .then(r => r.json())
        .then(d => {
          if (d.success) {
            setMaeLink({ serie: d.serie, rg: d.rg })
            
            // Buscar coletas mesmo que encontrou a mÃ£e
            const params = new URLSearchParams()
            params.set('serie', d.serie)
            params.set('rg', d.rg)
            
            fetch(`/api/animals/doadora-coletas?${params}`)
              .then(r2 => r2.json())
              .then(d2 => {
                if (d2.success && d2.data?.resumo) setMaeColetas(d2.data)
                else setMaeColetas(null)
              })
              .catch(() => setMaeColetas(null))
          } else {
            setMaeLink(null)
            // MÃ£e nÃ£o cadastrada: buscar histÃ³rico de coletas FIV por nome
            const params = new URLSearchParams({ identificador: animal.mae.trim() })
            fetch(`/api/animals/doadora-coletas?${params}`)
              .then(r2 => r2.json())
              .then(d2 => {
                if (d2.success && d2.data?.resumo) setMaeColetas(d2.data)
                else setMaeColetas(null)
              })
              .catch(() => setMaeColetas(null))
          }
        })
        .catch(() => {
          setMaeLink(null)
          const params = new URLSearchParams({ identificador: animal.mae.trim() })
          fetch(`/api/animals/doadora-coletas?${params}`)
            .then(r2 => r2.json())
            .then(d2 => {
              if (d2.success && d2.data?.resumo) setMaeColetas(d2.data)
              else setMaeColetas(null)
            })
            .catch(() => setMaeColetas(null))
        })
    }
  }, [animal?.mae, animal?.serie_mae, animal?.rg_mae])

  // Buscar resumo de baixas (venda prÃ³pria, resumo filhos vendidos)
  useEffect(() => {
    if (!animal?.serie || !animal?.rg) {
      setBaixasResumo(null)
      return
    }
    const params = new URLSearchParams({ serie: animal.serie, rg: animal.rg })
    fetch(`/api/animals/baixas-resumo?${params}`)
      .then(r => r.json())
      .then(d => {
        if (mountedRef.current && d.success && d.data) setBaixasResumo(d.data)
        else if (mountedRef.current) setBaixasResumo(null)
      })
      .catch(() => { if (mountedRef.current) setBaixasResumo(null) })
  }, [animal?.serie, animal?.rg])

  // Buscar resumo de baixas da MÃÆ’E (para exibir na ficha do filho: NF, valor, comprador da mÃ£e)
  useEffect(() => {
    if (!maeLink?.serie || !maeLink?.rg) {
      setBaixasMae(null)
      return
    }
    const params = new URLSearchParams({ serie: maeLink.serie, rg: maeLink.rg })
    fetch(`/api/animals/baixas-resumo?${params}`)
      .then(r => r.json())
      .then(d => {
        if (mountedRef.current && d.success && d.data) setBaixasMae(d.data)
        else if (mountedRef.current) setBaixasMae(null)
      })
      .catch(() => { if (mountedRef.current) setBaixasMae(null) })
  }, [maeLink?.serie, maeLink?.rg])

  // CÃ�LCULOS E MÃâ€°TRICAS (Refatorado do [id].jsx)
  const metrics = useMemo(() => {
    if (!animal) return {}

    // 1. IdentificaÃ§Ã£o e Idade
    const dataNasc = animal.data_nascimento ? new Date(animal.data_nascimento) : null
    const hoje = new Date()
    const mesesIdade = dataNasc ? Math.floor((hoje - dataNasc) / (1000 * 60 * 60 * 24 * 30.44)) : null
    const anosIdade = mesesIdade != null ? (mesesIdade / 12).toFixed(1) : null
    const idadeDias = dataNasc ? Math.floor((hoje - dataNasc) / (1000 * 60 * 60 * 24)) : null
    
    // Dias adicionais (alÃ©m dos meses)
    let diasAdicionais = null
    if (dataNasc && mesesIdade != null) {
      const diasEmMeses = Math.floor(mesesIdade * 30.44)
      diasAdicionais = idadeDias - diasEmMeses
    }

    // 2. LocalizaÃ§Ã£o e Tempo
    const dataChegada = animal.data_chegada || animal.dataChegada
    const diasNaFazenda = dataChegada ? Math.floor((hoje - new Date(dataChegada)) / (1000 * 60 * 60 * 24)) : null
    
    // 3. Sexo
    const isMacho = animal.sexo && (String(animal.sexo).toLowerCase().includes('macho') || animal.sexo === 'M')
    const isFemea = !isMacho

    // 4. Custos
    const custosArray = Array.isArray(animal.custos) ? animal.custos : []
    const custoTotal = custosArray.reduce((s, c) => s + parseFloat(c.valor || 0), 0)

    // 5. Planejamento SanitÃ¡rio (Brucelose)
    // Brucelose Ã© obrigatÃ³ria apenas para fÃªmeas de 3-8 meses (90-240 dias)
    const temBrucelose = custosArray.some(c => {
      const t = String(c.tipo || '').toLowerCase()
      const s = String(c.subtipo || '').toLowerCase()
      const o = String(c.observacoes || '').toLowerCase()
      return (t.includes('vacina') || t.includes('vacinaÃ§Ã£o')) && (s.includes('brucelose') || o.includes('brucelose'))
    })
    // ElegÃ­vel = estÃ¡ na janela agora (90-240 dias)
    const elegivelBrucelose = isFemea && idadeDias != null && idadeDias >= 90 && idadeDias <= 240 && !temBrucelose
    // precisaBrucelose = ainda pode precisar (inclui <90 dias E passou da janela mas ainda relevante mostrar)
    // Paramos de mostrar quando >640 dias (animais muito velhos, informaÃ§Ã£o irrelevante)
    const precisaBrucelose = isFemea && idadeDias != null && idadeDias <= 640 && !temBrucelose
    const janelaEncerrada = isFemea && idadeDias != null && idadeDias > 240 && !temBrucelose
    // DGT (AvaliaÃ§Ã£o AndrolÃ³gica/Reprodutiva): janela 330-640 dias (~11-21 meses)
    // Considera DGT realizado se: machos com exame androlÃ³gico OU custo AndrolÃ³gico registrado
    const temDGT = (
      (isMacho && examesAndrologicos.length > 0) ||
      custosArray.some(c => {
        const s = String(c.subtipo || '').toLowerCase()
        const o = String(c.observacoes || '').toLowerCase()
        const t = String(c.tipo || '').toLowerCase()
        return s.includes('androlÃ³gico') || s.includes('andrologico') || s.includes('dgt') ||
               o.includes('androlÃ³gico') || o.includes('andrologico') || o.includes('dgt') ||
               t.includes('androlÃ³gico') || t.includes('andrologico')
      })
    )
    // ElegÃ­vel = estÃ¡ na janela agora (330-640 dias) e ainda nÃ£o fez
    const elegivelDGT = idadeDias != null && idadeDias >= 330 && idadeDias <= 640 && !temDGT
    // Janela encerrada = passou dos 640 dias sem ter feito (mÃ¡x atÃ© ~900 dias para ainda mostrar)
    const janelaEncerradaDGT = idadeDias != null && idadeDias > 640 && idadeDias <= 900 && !temDGT
    // precisaDGT = relevante mostrar no card (na janela, acabou de entrar ou passou recentemente)
    const precisaDGT = idadeDias != null && idadeDias >= 330 && idadeDias <= 900

    // 6. ReproduÃ§Ã£o (FÃªmeas)
    // Ordenar inseminaÃ§Ãµes
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
    const ehParida = (ia) => {
      const r = String(ia.resultado_dg || ia.status_gestacao || '').toLowerCase()
      return r.includes('parida')
    }
    const temParida = insOrdenadas.some(ehParida)
    const temPrenha = insOrdenadas.some(ehPrenha)
    const isParidaEPrenha = temParida && temPrenha
    
    const iaPrenha = insOrdenadas.find(ehPrenha)
    const ultimaIA = iaPrenha || insOrdenadas.find(ia => !ehVazia(ia)) || insOrdenadas[0]
    
    // PrevisÃ£o de parto via IA
    let previsaoPartoIA = null
    if ((iaPrenha || (insOrdenadas[0] && !ehVazia(insOrdenadas[0]))) && ultimaIA) {
      const d = new Date(ultimaIA.data_ia || ultimaIA.data_inseminacao || ultimaIA.data)
      if (!isNaN(d.getTime())) previsaoPartoIA = new Date(d.getTime() + 285 * 24 * 60 * 60 * 1000)
    }

    // Status GestaÃ§Ã£o Global
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

    // CE (CircunferÃªncia Escrotal)
    let ultimoCE = null
    if (isMacho) {
      // Prioridade: Pesagens > OcorrÃªncias > Exames
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

    // AndrolÃ³gico
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
      temBrucelose, elegivelBrucelose, precisaBrucelose, janelaEncerrada,
      temDGT, elegivelDGT, janelaEncerradaDGT, precisaDGT,
      isPrenha, diasGestacao, previsaoParto, diasParaParto, gestacaoProgress,
      isParidaEPrenha,
      totalIAs, taxaSucessoIA, totalOocitos, mediaOocitos,
      evolucaoPeso,
      ultimoCE,
      ultExame, diasDesdeExame, isInapto, diasParaProximoExame,
      ultimaIA
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
    maeColetas,
    baixasResumo,
    baixasMae,
    rankings,
    // MÃ©tricas calculadas
    metrics
  }
}