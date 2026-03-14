import React, { useState, useEffect, useMemo } from 'react'
import { HeartIcon, ExclamationTriangleIcon, ClockIcon, CalendarIcon, ArrowDownTrayIcon, UserGroupIcon, ScaleIcon, SparklesIcon } from '../../components/ui/Icons'
import AlertasPartosAtrasados from '../../components/AlertasPartosAtrasados'

export default function Nascimentos() {
  const [mounted, setMounted] = useState(false)
  const [gestacoes, setGestacoes] = useState([])
  const [inseminacoesPrenhas, setInseminacoesPrenhas] = useState([]) // IAs com status Prenha (gestação de IA)
  const [nascimentos, setNascimentos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [alertas, setAlertas] = useState({ partosAtrasados: [], partosProximos: [] })
  const [animaisMap, setAnimaisMap] = useState({})
  const [exporting, setExporting] = useState(false)
  const [modoListaNascimentos, setModoListaNascimentos] = useState('resumo') // 'resumo' | 'completa'
  const [expandirLista, setExpandirLista] = useState(false)

  // Separar nascimentos REAIS (já ocorreram) de PREVISÕES (data futura - receptoras gestantes)
  const { nascimentosReais, previsoesParto, previsoesFIV, previsoesIA } = useMemo(() => {
    const hoje = new Date()
    hoje.setHours(23, 59, 59, 999)
    const reais = []
    const previsoes = []
    nascimentos.forEach(n => {
      const d = new Date(n.data_nascimento || n.data || n.nascimento)
      if (!isNaN(d.getTime()) && d <= hoje) {
        reais.push(n)
      } else {
        previsoes.push({ ...n, origem: 'FIV' }) // nascimentos com data futura vêm do batch DG (FIV)
      }
    })

    // Incluir gestações ativas que ainda não têm nascimento registrado
    const idsGestacaoComNascimento = new Set(nascimentos.map(n => n.gestacao_id).filter(Boolean))
    const add276Dias = (data) => {
      const d = new Date(data)
      d.setDate(d.getDate() + 276)
      return d
    }
    gestacoes.forEach(g => {
      if (idsGestacaoComNascimento.has(g.id)) return
      const dataParto = add276Dias(g.data_cobertura)
      if (dataParto <= hoje) return // já passou, não é previsão
      const ehFIV = !!(g.mae_serie || g.mae_rg)
      const receptoraNome = g.receptora_nome || (g.receptora_serie && g.receptora_rg ? `${g.receptora_serie} ${g.receptora_rg}` : '-')
      previsoes.push({
        id: `gest-${g.id}`,
        serie: g.receptora_serie || '-',
        rg: g.receptora_rg || '-',
        receptora: receptoraNome,
        data_nascimento: dataParto.toISOString().split('T')[0],
        sexo: g.sexo_prenhez || '-',
        origem: ehFIV ? 'FIV' : 'IA',
        gestacao_id: g.id
      })
    })

    // Incluir inseminações com status Prenha (gestação de IA - ex: CJCJ 15639)
    const add285Dias = (data) => {
      const d = new Date(data)
      d.setDate(d.getDate() + 285) // 9 meses gestação bovina (mesmo que animals/[id])
      return d
    }
    inseminacoesPrenhas.forEach(ia => {
      const dataIA = new Date(ia.data_ia || ia.data_inseminacao)
      if (isNaN(dataIA.getTime())) return
      const dataParto = add285Dias(dataIA)
      if (dataParto <= hoje) return // já passou
      const serie = ia.serie || '-'
      const rg = ia.rg ? String(ia.rg) : '-'
      const receptora = ia.animal_nome || (serie !== '-' && rg !== '-' ? `${serie} ${rg}` : '-')
      previsoes.push({
        id: `ia-${ia.id}`,
        serie,
        rg,
        receptora,
        data_nascimento: dataParto.toISOString().split('T')[0],
        sexo: '-',
        origem: 'IA',
        inseminacao_id: ia.id,
        touro: ia.touro_nome || '-'
      })
    })

    const fiv = previsoes.filter(p => p.origem === 'FIV')
    const ia = previsoes.filter(p => p.origem === 'IA')
    return { nascimentosReais: reais, previsoesParto: previsoes, previsoesFIV: fiv, previsoesIA: ia }
  }, [nascimentos, gestacoes, inseminacoesPrenhas])

  const ehPrevisao = (n) => {
    const d = new Date(n.data_nascimento || n.data || n.nascimento)
    return !isNaN(d.getTime()) && d > new Date()
  }

  // Resumos - APENAS nascimentos REAIS (já ocorreram)
  const resumos = useMemo(() => {
    const hoje = new Date()
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    const seteDiasAtras = new Date(hoje)
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7)

    const machos = nascimentosReais.filter(n => {
      const s = (n.sexo || '').toLowerCase()
      return s.includes('macho') || s === 'm'
    }).length
    const femeas = nascimentosReais.filter(n => {
      const s = (n.sexo || '').toLowerCase()
      return s.includes('fêmea') || s.includes('femea') || s === 'f'
    }).length
    const comPeso = nascimentosReais.filter(n => n.peso && parseFloat(n.peso) > 0)
    const pesoMedio = comPeso.length > 0
      ? (comPeso.reduce((a, n) => a + parseFloat(n.peso), 0) / comPeso.length).toFixed(1)
      : null
    const esteMes = nascimentosReais.filter(n => {
      const d = new Date(n.data_nascimento || n.data || n.nascimento)
      return !isNaN(d) && d >= inicioMes
    }).length
    const ultimos7Dias = nascimentosReais.filter(n => {
      const d = new Date(n.data_nascimento || n.data || n.nascimento)
      return !isNaN(d) && d >= seteDiasAtras
    }).length

    return { machos, femeas, pesoMedio, esteMes, ultimos7Dias }
  }, [nascimentosReais])

  // Resumo por data - separado em reais e previsões
  const resumoPorDataReais = useMemo(() => {
    const formatarData = (d) => {
      if (!d) return 'N/A'
      try {
        const dt = new Date(d)
        if (isNaN(dt.getTime())) return String(d)
        return dt.toLocaleDateString('pt-BR')
      } catch { return String(d) }
    }
    const porData = {}
    nascimentosReais.forEach(n => {
      const dataStr = formatarData(n.data_nascimento || n.data || n.nascimento)
      if (!porData[dataStr]) porData[dataStr] = { count: 0, machos: 0, femeas: 0, dataRaw: n.data_nascimento || n.data || n.nascimento, ehPrevisao: false }
      porData[dataStr].count++
      const s = (n.sexo || '').toLowerCase()
      if (s.includes('macho') || s === 'm') porData[dataStr].machos++
      else porData[dataStr].femeas++
    })
    return Object.entries(porData)
      .sort((a, b) => new Date(b[1].dataRaw || 0) - new Date(a[1].dataRaw || 0))
      .slice(0, 6)
  }, [nascimentosReais])

  const resumoPorDataPrevisoes = useMemo(() => {
    const formatarData = (d) => {
      if (!d) return 'N/A'
      try {
        const dt = new Date(d)
        if (isNaN(dt.getTime())) return String(d)
        return dt.toLocaleDateString('pt-BR')
      } catch { return String(d) }
    }
    const porData = {}
    previsoesParto.forEach(n => {
      const dataStr = formatarData(n.data_nascimento || n.data || n.nascimento)
      if (!porData[dataStr]) porData[dataStr] = { count: 0, machos: 0, femeas: 0, dataRaw: n.data_nascimento || n.data || n.nascimento, ehPrevisao: true }
      porData[dataStr].count++
      const s = (n.sexo || '').toLowerCase()
      if (s.includes('macho') || s === 'm') porData[dataStr].machos++
      else porData[dataStr].femeas++
    })
    return Object.entries(porData)
      .sort((a, b) => new Date(a[1].dataRaw || 0) - new Date(b[1].dataRaw || 0))
      .slice(0, 6)
  }, [previsoesParto])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      loadData()
      loadAlertas()
    }
  }, [mounted])

  // Função para buscar nome completo do animal por série e RG
  const buscarNomeAnimal = async (serie, rg) => {
    if (!serie || !rg) return null
    
    const chave = `${serie}_${rg}`
    if (animaisMap[chave]) return animaisMap[chave]
    
    try {
      const params = new URLSearchParams()
      params.append('serie', serie)
      params.append('rg', rg)
      
      const response = await fetch(`/api/animals?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        const animais = data.data || []
        if (animais.length > 0) {
          const animal = animais[0]
          const nomeCompleto = animal.nome || `${serie} ${rg}`
          setAnimaisMap(prev => ({ ...prev, [chave]: nomeCompleto }))
          return nomeCompleto
        }
      }
    } catch (error) {
      console.error('Erro ao buscar animal:', error)
    }
    return null
  }

  // Função para buscar touro nas transferências de embriões
  const buscarTouroNasTEs = async (serie, rg) => {
    if (!serie || !rg) return null
    
    try {
      // Buscar nas transferências de embriões pelo touro_id ou pelo nome
      const response = await fetch(`/api/transferencias-embrioes`)
      if (response.ok) {
        const data = await response.json()
        const transferencias = data.data || data || []
        
        // Procurar transferência com touro que contenha a série e RG
        const teEncontrada = transferencias.find(te => {
          if (te.touro) {
            const touroLower = te.touro.toLowerCase()
            const serieLower = serie.toLowerCase()
            const rgStr = rg.toString()
            return touroLower.includes(serieLower) && touroLower.includes(rgStr)
          }
          return false
        })
        
        if (teEncontrada && teEncontrada.touro) {
          // Extrair nome do touro (remover RG se estiver no formato "Nome (RG: ...)")
          let nomeTouro = teEncontrada.touro
          const rgMatch = nomeTouro.match(/\(RG:\s*([^)]+)\)/i)
          if (rgMatch) {
            // Se tem RG no formato, manter o nome completo
            return nomeTouro
          }
          return nomeTouro
        }
      }
    } catch (error) {
      console.error('Erro ao buscar touro nas TEs:', error)
    }
    return null
  }

  // Carregar nomes completos de todos os animais envolvidos
  const carregarNomesAnimais = async (gestacoesData, nascimentosData) => {
    const nomesMap = {}
    const promessas = []

    // Buscar nomes dos touros, doadoras e receptoras das gestações
    gestacoesData.forEach(gestacao => {
      if (gestacao.pai_serie && gestacao.pai_rg) {
        promessas.push(
          buscarNomeAnimal(gestacao.pai_serie, gestacao.pai_rg).then(async nome => {
            if (nome) {
              nomesMap[`${gestacao.pai_serie}_${gestacao.pai_rg}`] = nome
            } else {
              // Se não encontrou nos animais, buscar nas TEs
              const touroTE = await buscarTouroNasTEs(gestacao.pai_serie, gestacao.pai_rg)
              if (touroTE) {
                nomesMap[`${gestacao.pai_serie}_${gestacao.pai_rg}`] = touroTE
              }
            }
          })
        )
      }
      if (gestacao.mae_serie && gestacao.mae_rg) {
        promessas.push(
          buscarNomeAnimal(gestacao.mae_serie, gestacao.mae_rg).then(nome => {
            if (nome) nomesMap[`${gestacao.mae_serie}_${gestacao.mae_rg}`] = nome
          })
        )
      }
      if (gestacao.receptora_serie && gestacao.receptora_rg) {
        promessas.push(
          buscarNomeAnimal(gestacao.receptora_serie, gestacao.receptora_rg).then(nome => {
            if (nome) nomesMap[`${gestacao.receptora_serie}_${gestacao.receptora_rg}`] = nome
          })
        )
      }
    })

    await Promise.all(promessas)
    setAnimaisMap(prev => ({ ...prev, ...nomesMap }))
  }

  const loadData = async () => {
    try {
      setIsLoading(true)
      
      // Carregar gestações ativas (pode ser 'Em Gestação' ou 'Ativa')
      const gestacoesRes = await fetch('/api/gestacoes?situacao=Em Gestação')
      let gestacoesAtivas = []
      if (gestacoesRes.ok) {
        const gestacoesData = await gestacoesRes.json()
        const todasGestacoes = gestacoesData.data || gestacoesData || []
        // Filtrar apenas gestações ativas (Em Gestação ou Ativa)
        gestacoesAtivas = todasGestacoes.filter(g => 
          g.situacao === 'Em Gestação' || g.situacao === 'Ativa'
        )
        setGestacoes(gestacoesAtivas)
      }

      // Carregar nascimentos recentes
      let nascimentosData = []
      const nascimentosRes = await fetch('/api/nascimentos?limit=100')
      if (nascimentosRes.ok) {
        const nascimentosResponse = await nascimentosRes.json()
        nascimentosData = nascimentosResponse.data || nascimentosResponse || []
        setNascimentos(nascimentosData)
      }

      // Carregar inseminações prenhas (gestações de IA - ex: CJCJ 15639)
      const inseminacoesRes = await fetch('/api/inseminacoes')
      if (inseminacoesRes.ok) {
        const inseminacoesData = await inseminacoesRes.json()
        const lista = inseminacoesData.data || inseminacoesData || []
        const prenhas = lista.filter(i => {
          const status = (i.status_gestacao || '').toLowerCase()
          return status === 'prenha' || status === 'prenhez'
        })
        setInseminacoesPrenhas(prenhas)
      }

      // Carregar nomes completos dos animais (incluindo busca nas TEs)
      await carregarNomesAnimais(gestacoesAtivas, nascimentosData)
      
      // Buscar também touros das transferências de embriões que não foram encontrados nos animais
      const nomesTEs = {}
      const promessasTEs = []
      gestacoesAtivas.forEach(gestacao => {
        if (gestacao.pai_serie && gestacao.pai_rg) {
          const chave = `${gestacao.pai_serie}_${gestacao.pai_rg}`
          // Verificar se já foi carregado no carregarNomesAnimais
          promessasTEs.push(
            buscarTouroNasTEs(gestacao.pai_serie, gestacao.pai_rg).then(nome => {
              if (nome) {
                nomesTEs[chave] = nome
              }
            })
          )
        }
      })
      await Promise.all(promessasTEs)
      if (Object.keys(nomesTEs).length > 0) {
        setAnimaisMap(prev => ({ ...prev, ...nomesTEs }))
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAlertas = async () => {
    try {
      const response = await fetch('/api/verificar-partos-atrasados')
      if (response.ok) {
        const data = await response.json()
        setAlertas({
          partosAtrasados: data.data?.partosAtrasados || [],
          partosProximos: data.data?.partosProximos || []
        })
      }
    } catch (error) {
      console.error('Erro ao carregar alertas:', error)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Não informado'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const calcularDataEsperada = (dataCobertura) => {
    if (!dataCobertura) return null
    const data = new Date(dataCobertura)
    data.setDate(data.getDate() + 276) // 9 meses = 276 dias
    return data
  }

  const calcularDiasRestantes = (dataEsperada) => {
    if (!dataEsperada) return null
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const esperada = new Date(dataEsperada)
    esperada.setHours(0, 0, 0, 0)
    const diff = Math.floor((esperada - hoje) / (1000 * 60 * 60 * 24))
    return diff
  }

  // Função para obter nome completo do animal (busca em animais e TEs)
  const obterNomeCompleto = async (serie, rg, nomeAlternativo = null) => {
    if (!serie || !rg) return nomeAlternativo || '-'
    const chave = `${serie}_${rg}`
    
    // Se já está no mapa, retornar
    if (animaisMap[chave]) return animaisMap[chave]
    
    // Tentar buscar nas TEs se não encontrou nos animais
    const touroTE = await buscarTouroNasTEs(serie, rg)
    if (touroTE) {
      setAnimaisMap(prev => ({ ...prev, [chave]: touroTE }))
      return touroTE
    }
    
    return nomeAlternativo || `${serie} ${rg}`
  }

  // Versão síncrona para uso em renderização (usa cache)
  const obterNomeCompletoSync = (serie, rg, nomeAlternativo = null) => {
    if (!serie || !rg) return nomeAlternativo || '-'
    const chave = `${serie}_${rg}`
    return animaisMap[chave] || nomeAlternativo || `${serie} ${rg}`
  }

  // Função para exportar relatório Excel
  const exportarRelatorio = async () => {
    try {
      setExporting(true)
      const ExcelJS = (await import('exceljs')).default
      const workbook = new ExcelJS.Workbook()

      // Aba 1: Resumo
      const resumoSheet = workbook.addWorksheet('Resumo')
      resumoSheet.columns = [
        { header: 'Métrica', key: 'metrica', width: 30 },
        { header: 'Valor', key: 'valor', width: 20 }
      ]
      
      resumoSheet.addRow({ metrica: 'Gestações Ativas', valor: gestacoes.length })
      resumoSheet.addRow({ metrica: 'Partos Atrasados', valor: alertas.partosAtrasados.length })
      resumoSheet.addRow({ metrica: 'Partos Próximos (30 dias)', valor: alertas.partosProximos.length })
      resumoSheet.addRow({ metrica: 'Nascimentos Registrados (já ocorreram)', valor: nascimentosReais.length })
      resumoSheet.addRow({ metrica: 'Previsões de Parto (gestantes)', valor: previsoesParto.length })
      resumoSheet.addRow({ metrica: '', valor: '' })
      resumoSheet.addRow({ metrica: '--- RESUMO PARA PARIR (FIV vs IA) ---', valor: '' })
      resumoSheet.addRow({ metrica: 'Receptoras para parir de FIV', valor: previsoesFIV.length })
      resumoSheet.addRow({ metrica: 'Fêmeas para parir de IA', valor: previsoesIA.length })
      if (previsoesIA.length > 0 && previsoesIA.length <= 10) {
        previsoesIA.forEach(p => {
          const id = [p.serie, p.rg].filter(x => x && x !== '-').join(' ')
          resumoSheet.addRow({ metrica: `  └ ${id || p.receptora || '-'}`, valor: formatDate(p.data_nascimento || p.data || p.nascimento) })
        })
      }
      
      const gestacoesProximas = gestacoes.filter(g => {
        const dataEsperada = calcularDataEsperada(g.data_cobertura)
        const dias = calcularDiasRestantes(dataEsperada)
        return dias !== null && dias >= 0 && dias <= 30
      }).length
      
      resumoSheet.addRow({ metrica: 'Gestações com Parto em 30 dias', valor: gestacoesProximas })
      resumoSheet.addRow({ metrica: 'Data do Relatório', valor: new Date().toLocaleDateString('pt-BR') })

      // Aba 2: Gestações
      const gestacoesSheet = workbook.addWorksheet('Gestações')
      gestacoesSheet.columns = [
        { header: 'Receptora', key: 'receptora', width: 25 },
        { header: 'Doadora', key: 'doadora', width: 25 },
        { header: 'Touro', key: 'touro', width: 30 },
        { header: 'Data Cobertura', key: 'data_cobertura', width: 15 },
        { header: 'Previsão Parto', key: 'previsao_parto', width: 15 },
        { header: 'Dias Restantes', key: 'dias_restantes', width: 15 },
        { header: 'Status', key: 'status', width: 15 }
      ]

      gestacoes.forEach(gestacao => {
        const dataEsperada = calcularDataEsperada(gestacao.data_cobertura)
        const diasRestantes = calcularDiasRestantes(dataEsperada)
        const isAtrasado = diasRestantes !== null && diasRestantes < 0
        const isProximo = diasRestantes !== null && diasRestantes >= 0 && diasRestantes <= 30

        const nomeTouro = obterNomeCompletoSync(gestacao.pai_serie, gestacao.pai_rg)
        const nomeDoadora = obterNomeCompletoSync(gestacao.mae_serie, gestacao.mae_rg)
        const nomeReceptora = gestacao.receptora_nome || obterNomeCompletoSync(gestacao.receptora_serie, gestacao.receptora_rg)

        gestacoesSheet.addRow({
          receptora: nomeReceptora,
          doadora: nomeDoadora,
          touro: nomeTouro,
          data_cobertura: formatDate(gestacao.data_cobertura),
          previsao_parto: dataEsperada ? formatDate(dataEsperada.toISOString()) : '-',
          dias_restantes: diasRestantes !== null ? (diasRestantes < 0 ? `${Math.abs(diasRestantes)} dias atrás` : `${diasRestantes} dias`) : '-',
          status: isAtrasado ? 'Atrasado' : isProximo ? 'Próximo' : gestacao.situacao || 'Em Gestação'
        })
      })

      // Aba 3: Nascimentos (reais + previsões)
      const nascimentosSheet = workbook.addWorksheet('Nascimentos')
      nascimentosSheet.columns = [
        { header: 'Tipo', key: 'tipo', width: 12 },
        { header: 'Origem', key: 'origem', width: 10 },
        { header: 'Série', key: 'serie', width: 15 },
        { header: 'RG', key: 'rg', width: 15 },
        { header: 'Nome', key: 'nome', width: 25 },
        { header: 'Sexo', key: 'sexo', width: 10 },
        { header: 'Data', key: 'data_nascimento', width: 18 },
        { header: 'Peso (kg)', key: 'peso', width: 12 },
        { header: 'Receptora', key: 'receptora', width: 25 }
      ]

      nascimentosReais.forEach(n => {
        nascimentosSheet.addRow({
          tipo: 'Real',
          origem: '-',
          serie: n.serie || '-',
          rg: n.rg || '-',
          nome: n.nome || '-',
          sexo: n.sexo || '-',
          data_nascimento: formatDate(n.data_nascimento || n.data || n.nascimento),
          peso: n.peso ? `${n.peso}` : '-',
          receptora: n.receptora || '-'
        })
      })
      previsoesParto.forEach(n => {
        nascimentosSheet.addRow({
          tipo: 'Previsão',
          origem: n.origem || 'FIV',
          serie: n.serie || '-',
          rg: n.rg || '-',
          nome: n.nome || '-',
          sexo: n.sexo || '-',
          data_nascimento: formatDate(n.data_nascimento || n.data || n.nascimento),
          peso: n.peso ? `${n.peso}` : '-',
          receptora: n.receptora || '-'
        })
      })

      // Aba 4: Alertas
      const alertasSheet = workbook.addWorksheet('Alertas')
      alertasSheet.columns = [
        { header: 'Receptora', key: 'receptora', width: 25 },
        { header: 'Data Esperada Parto', key: 'data_esperada', width: 18 },
        { header: 'Dias de Atraso', key: 'dias_atraso', width: 15 },
        { header: 'Data TE', key: 'data_te', width: 15 },
        { header: 'Doadora', key: 'doadora', width: 25 }
      ]

      alertas.partosAtrasados.forEach(alerta => {
        alertasSheet.addRow({
          receptora: alerta.receptora_nome || '-',
          data_esperada: formatDate(alerta.data_esperada_parto),
          dias_atraso: alerta.dias_atraso || 0,
          data_te: formatDate(alerta.data_te),
          doadora: alerta.doadora_nome || '-'
        })
      })

      // Gerar e baixar arquivo
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const dataAtual = new Date().toISOString().split('T')[0]
      link.download = `Relatorio_Nascimentos_${dataAtual}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      alert(`✅ Relatório exportado com sucesso!`)
    } catch (error) {
      console.error('Erro ao exportar relatório:', error)
      alert('❌ Erro ao exportar relatório')
    } finally {
      setExporting(false)
    }
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

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl shadow-lg">
              <HeartIcon className="w-8 h-8 text-white" />
            </div>
            Nascimentos
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1">
            Controle de gestações, previsões de parto e alertas
          </p>
        </div>
        <button
          onClick={exportarRelatorio}
          disabled={exporting || (gestacoes.length === 0 && nascimentos.length === 0)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl shadow-md disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all font-medium"
        >
          <ArrowDownTrayIcon className="w-5 h-5" />
          {exporting ? 'Exportando...' : 'Exportar Relatório'}
        </button>
      </div>

      {/* Alertas de Partos Atrasados e Próximos */}
      <AlertasPartosAtrasados />

      {/* Resumo Previsões FIV vs IA */}
      {(previsoesFIV.length > 0 || previsoesIA.length > 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Resumo das previsões de parto</h3>
          <div className="flex flex-wrap gap-4 items-baseline">
            {previsoesFIV.length > 0 && (
              <span className="text-gray-900 dark:text-white">
                <strong className="text-emerald-600 dark:text-emerald-400">{previsoesFIV.length}</strong>
                {previsoesFIV.length === 1 ? ' receptora' : ' receptoras'} para parir de <strong>FIV</strong>
              </span>
            )}
            {previsoesIA.length > 0 && (
              <span className="text-gray-900 dark:text-white">
                <strong className="text-amber-600 dark:text-amber-400">{previsoesIA.length}</strong>
                {previsoesIA.length === 1 ? ' fêmea' : ' fêmeas'} para parir de <strong>IA</strong>
                {previsoesIA.length <= 3 && (
                  <span className="text-gray-600 dark:text-gray-400 ml-1">
                    ({previsoesIA.map(p => {
                      const id = [p.serie, p.rg].filter(x => x && x !== '-').join(' ')
                      return id || p.receptora || '-'
                    }).join(', ')})
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Cards de Resumo - Linha 1: Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-rose-500 to-pink-600 dark:from-rose-600 dark:to-pink-700 rounded-2xl shadow-lg p-6 text-white">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold">{gestacoes.length}</p>
              <p className="text-rose-100 text-sm font-medium mt-1">Gestações Ativas</p>
            </div>
            <div className="p-4 bg-white/20 rounded-xl">
              <HeartIcon className="w-10 h-10" />
            </div>
          </div>
        </div>

        <div className={`relative overflow-hidden rounded-2xl shadow-lg p-6 ${
          alertas.partosAtrasados.length > 0 
            ? 'bg-gradient-to-br from-red-500 to-rose-600 dark:from-red-600 dark:to-rose-700 text-white' 
            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
        }`}>
          {alertas.partosAtrasados.length > 0 && (
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          )}
          <div className="relative flex items-center justify-between">
            <div>
              <p className={`text-4xl font-bold ${alertas.partosAtrasados.length > 0 ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                {alertas.partosAtrasados.length}
              </p>
              <p className={`text-sm font-medium mt-1 ${alertas.partosAtrasados.length > 0 ? 'text-red-100' : 'text-gray-600 dark:text-gray-400'}`}>
                Partos Atrasados
              </p>
            </div>
            <div className={`p-4 rounded-xl ${alertas.partosAtrasados.length > 0 ? 'bg-white/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
              <ExclamationTriangleIcon className={`w-10 h-10 ${alertas.partosAtrasados.length > 0 ? 'text-white' : 'text-red-600 dark:text-red-400'}`} />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-700 rounded-2xl shadow-lg p-6 text-white">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold">{alertas.partosProximos.length}</p>
              <p className="text-amber-100 text-sm font-medium mt-1">Partos Próximos (30 dias)</p>
            </div>
            <div className="p-4 bg-white/20 rounded-xl">
              <ClockIcon className="w-10 h-10" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700 rounded-2xl shadow-lg p-6 text-white">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold">{nascimentosReais.length}</p>
              <p className="text-emerald-100 text-sm font-medium mt-1">Nascimentos (já ocorreram)</p>
            </div>
            <div className="p-4 bg-white/20 rounded-xl">
              <CalendarIcon className="w-10 h-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Resumo - Linha 2: Detalhes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-5 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <UserGroupIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{resumos.machos}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Machos</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-5 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
              <UserGroupIcon className="w-6 h-6 text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{resumos.femeas}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Fêmeas</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-5 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <ScaleIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {resumos.pesoMedio ? `${resumos.pesoMedio} kg` : '-'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Peso Médio</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-5 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
              <CalendarIcon className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{resumos.esteMes}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Este Mês</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-5 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
              <SparklesIcon className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{resumos.ultimos7Dias}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Últimos 7 dias</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gestações Ativas */}
      {gestacoes.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-5 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
                <HeartIcon className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              Gestações Ativas ({gestacoes.length})
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Receptoras em gestação com previsão de parto</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Receptora</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Doadora</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Touro</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data Cobertura</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Previsão Parto</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Dias Restantes</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {gestacoes.map((gestacao) => {
                  const dataEsperada = calcularDataEsperada(gestacao.data_cobertura)
                  const diasRestantes = calcularDiasRestantes(dataEsperada)
                  const isAtrasado = diasRestantes !== null && diasRestantes < 0
                  const isProximo = diasRestantes !== null && diasRestantes >= 0 && diasRestantes <= 30

                  return (
                    <tr key={gestacao.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {gestacao.receptora_nome || `${gestacao.receptora_serie} ${gestacao.receptora_rg}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {gestacao.mae_serie && gestacao.mae_rg 
                          ? obterNomeCompletoSync(gestacao.mae_serie, gestacao.mae_rg)
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                        {gestacao.pai_serie && gestacao.pai_rg 
                          ? obterNomeCompletoSync(gestacao.pai_serie, gestacao.pai_rg)
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(gestacao.data_cobertura)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {dataEsperada ? formatDate(dataEsperada.toISOString()) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {diasRestantes !== null ? (
                          <span className={`font-semibold ${
                            isAtrasado 
                              ? 'text-red-600 dark:text-red-400' 
                              : isProximo 
                              ? 'text-yellow-600 dark:text-yellow-400' 
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {diasRestantes < 0 ? `${Math.abs(diasRestantes)} dias atrás` : `${diasRestantes} dias`}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          isAtrasado
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            : isProximo
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        }`}>
                          {isAtrasado ? 'Atrasado' : isProximo ? 'Próximo' : gestacao.situacao || 'Em Gestação'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Nascimentos Reais (já ocorreram) */}
      {nascimentosReais.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <CalendarIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  Nascimentos Registrados ({nascimentosReais.length})
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Bezerros que já nasceram</p>
              </div>
              <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                <button
                  onClick={() => setModoListaNascimentos('resumo')}
                  className={`px-4 py-2 text-sm font-medium transition-all ${modoListaNascimentos === 'resumo' ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
                >
                  Resumo
                </button>
                <button
                  onClick={() => setModoListaNascimentos('completa')}
                  className={`px-4 py-2 text-sm font-medium transition-all ${modoListaNascimentos === 'completa' ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
                >
                  Lista Completa
                </button>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              {resumoPorDataReais.map(([dataStr, dados]) => (
                <div key={dataStr} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{dataStr}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {dados.machos > 0 && `${dados.machos} macho${dados.machos > 1 ? 's' : ''}`}
                      {dados.machos > 0 && dados.femeas > 0 && ' • '}
                      {dados.femeas > 0 && `${dados.femeas} fêmea${dados.femeas > 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{dados.count}</span>
                </div>
              ))}
            </div>
            {modoListaNascimentos === 'completa' ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Série</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">RG</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Sexo</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Data</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Peso</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Receptora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {nascimentosReais.map((n, idx) => (
                      <tr key={n.id || `${n.serie}-${n.rg}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{n.serie || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{n.rg || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{n.sexo || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{formatDate(n.data_nascimento || n.data || n.nascimento)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{n.peso ? `${n.peso} kg` : '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{n.receptora || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
                <div className="grid grid-cols-5 gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-900/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  <span>Série</span><span>RG</span><span>Sexo</span><span>Data</span><span>Receptora</span>
                </div>
                {(expandirLista ? nascimentosReais : nascimentosReais.slice(0, 6)).map((n, idx) => (
                  <div key={n.id || `${n.serie}-${n.rg}-${idx}`} className="grid grid-cols-5 gap-2 px-4 py-2 text-sm border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <span className="font-medium text-gray-900 dark:text-white">{n.serie || '-'}</span>
                    <span className="text-gray-600 dark:text-gray-400">{n.rg || '-'}</span>
                    <span className="text-gray-600 dark:text-gray-400">{n.sexo || '-'}</span>
                    <span className="text-gray-600 dark:text-gray-400">{formatDate(n.data_nascimento || n.data || n.nascimento)}</span>
                    <span className="text-gray-600 dark:text-gray-400 truncate" title={n.receptora || '-'}>{n.receptora || '-'}</span>
                  </div>
                ))}
              </div>
            )}
            {modoListaNascimentos === 'resumo' && nascimentosReais.length > 6 && (
              <button
                onClick={() => setExpandirLista(!expandirLista)}
                className="w-full mt-3 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
              >
                {expandirLista ? '▲ Ver menos' : `▼ Ver todos (${nascimentosReais.length})`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Previsões de Parto (receptoras gestantes - ainda não pariram) */}
      {previsoesParto.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-amber-200 dark:border-amber-800 overflow-hidden">
          <div className="px-6 py-5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-b border-amber-200 dark:border-amber-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <ClockIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              Previsões de Parto ({previsoesParto.length})
            </h2>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1 font-medium">
              ⚠️ Receptoras (FIV) e fêmeas (IA) gestantes — ainda não pariram. Datas previstas (9 meses após TE ou cobertura).
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              {resumoPorDataPrevisoes.map(([dataStr, dados]) => (
                <div key={`prev-${dataStr}`} className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700">
                  <div>
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Previsão: {dataStr}</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                      {dados.femeas > 0 && `${dados.femeas} fêmea${dados.femeas > 1 ? 's' : ''}`}
                      {dados.machos > 0 && ` • ${dados.machos} macho${dados.machos > 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{dados.count}</span>
                </div>
              ))}
            </div>
            <div className="border border-amber-200 dark:border-amber-700 rounded-xl overflow-hidden">
              <div className="grid grid-cols-6 gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-xs font-semibold text-amber-800 dark:text-amber-200 uppercase">
                <span>Origem</span><span>Série</span><span>RG</span><span>Sexo</span><span>Previsão Parto</span><span>Receptora</span>
              </div>
              {(expandirLista ? previsoesParto : previsoesParto.slice(0, 6)).map((n, idx) => (
                <div key={n.id || `prev-${n.serie}-${n.rg}-${idx}`} className="grid grid-cols-6 gap-2 px-4 py-2 text-sm border-t border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/20">
                  <span>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${n.origem === 'IA' ? 'bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200' : 'bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200'}`}>
                      {n.origem || 'FIV'}
                    </span>
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">{n.serie || '-'}</span>
                  <span className="text-gray-600 dark:text-gray-400">{n.rg || '-'}</span>
                  <span className="text-gray-600 dark:text-gray-400">{n.sexo || '-'}</span>
                  <span className="text-amber-700 dark:text-amber-300 font-medium">{formatDate(n.data_nascimento || n.data || n.nascimento)}</span>
                  <span className="text-gray-600 dark:text-gray-400 truncate" title={n.receptora || '-'}>{n.receptora || '-'}</span>
                </div>
              ))}
            </div>
            {previsoesParto.length > 6 && (
              <button
                onClick={() => setExpandirLista(!expandirLista)}
                className="w-full mt-3 py-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
              >
                {expandirLista ? '▲ Ver menos' : `▼ Ver todos (${previsoesParto.length})`}
              </button>
            )}
          </div>
        </div>
      )}

      {gestacoes.length === 0 && nascimentos.length === 0 && !isLoading && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-16 text-center">
          <div className="inline-flex p-6 bg-rose-100 dark:bg-rose-900/20 rounded-full mb-6">
            <HeartIcon className="w-20 h-20 text-rose-400 dark:text-rose-500" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
            Nenhuma gestação ou nascimento registrado ainda
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
            Registre gestações e nascimentos para acompanhar o rebanho
          </p>
        </div>
      )}
    </div>
  )
}
