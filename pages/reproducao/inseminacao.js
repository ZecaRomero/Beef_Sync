import React, { useState, useEffect } from 'react'
import { HeartIcon, PlusIcon, PencilIcon, XMarkIcon, CalendarIcon, UserIcon, ArrowDownTrayIcon, DocumentArrowUpIcon, ExclamationTriangleIcon, CurrencyDollarIcon, TrashIcon } from '../../components/ui/Icons'
import * as XLSX from 'xlsx'
import IAStatistics from '../../components/reports/IAStatistics'
import ImportarTextoInseminacoes from '../../components/ImportarTextoInseminacoes'

export default function InseminacaoArtificial() {
  const [mounted, setMounted] = useState(false)
  const [inseminacoes, setInseminacoes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [semenStock, setSemenStock] = useState([])
  const [animals, setAnimals] = useState([])
  const [custoDosePadrao, setCustoDosePadrao] = useState(18.00)
  const [formData, setFormData] = useState({
    animalId: '',
    animalSerieRG: '',
    semenId: '',
    dataInseminacao: new Date().toISOString().split('T')[0],
    tecnico: '',
    observacoes: '',
    protocolo: '',
    statusGestacao: '',
    custoDose: 18.00
  })
  const [showImportModal, setShowImportModal] = useState(false)
  const [showImportTextoModal, setShowImportTextoModal] = useState(false)
  const [corrigindoP, setCorrigindoP] = useState(false)
  const [corrigindoTouros, setCorrigindoTouros] = useState(false)
  const [limandoTudo, setLimandoTudo] = useState(false)
  const [alertasDG, setAlertasDG] = useState([])
  const [loadingAlertas, setLoadingAlertas] = useState(false)
  const [buscandoAnimal, setBuscandoAnimal] = useState(false)
  const [animalEncontrado, setAnimalEncontrado] = useState(null)
  const [semenSelecionado, setSemenSelecionado] = useState(null)
  
  // Estados para mapeamento de campos
  const [excelHeaders, setExcelHeaders] = useState([])
  const [excelData, setExcelData] = useState([])
  const [showFieldMapping, setShowFieldMapping] = useState(false)
  const [modoImportacaoIA, setModoImportacaoIA] = useState('adicionar') // 'adicionar' | 'atualizar'
  const [importando, setImportando] = useState(false)
  const [importProgress, setImportProgress] = useState({ atual: 0, total: 0, etapa: '' })
  const [fieldMapping, setFieldMapping] = useState({
    serie: { enabled: true, source: '' },
    rg: { enabled: true, source: '' },
    local: { enabled: false, source: '' },
    touro1: { enabled: false, source: '' },
    serieTouro1: { enabled: false, source: '' },
    rgTouro1: { enabled: false, source: '' },
    dataIA1: { enabled: false, source: '' },
    dataDG1: { enabled: false, source: '' },
    result1: { enabled: false, source: '' },
    touro2: { enabled: false, source: '' },
    serieTouro2: { enabled: false, source: '' },
    rgTouro2: { enabled: false, source: '' },
    dataIA2: { enabled: false, source: '' },
    dataDG2: { enabled: false, source: '' },
    result2: { enabled: false, source: '' },
    touro3: { enabled: false, source: '' },
    serieTouro3: { enabled: false, source: '' },
    rgTouro3: { enabled: false, source: '' },
    dataIA3: { enabled: false, source: '' },
    dataDG3: { enabled: false, source: '' },
    result3: { enabled: false, source: '' },
    observacao: { enabled: false, source: '' }
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      loadInseminacoes()
      loadSemenStock()
      loadAnimals()
      loadAlertasDG()
      // Carregar custo padrÃ£o do localStorage
      const custoSalvo = localStorage.getItem('custo_dose_ia')
      if (custoSalvo) {
        setCustoDosePadrao(parseFloat(custoSalvo))
        setFormData(prev => ({ ...prev, custoDose: parseFloat(custoSalvo) }))
      }
    }
  }, [mounted])

  // Recarregar alertas a cada 5 minutos
  useEffect(() => {
    if (mounted) {
      const interval = setInterval(() => {
        loadAlertasDG()
      }, 5 * 60 * 1000) // 5 minutos
      return () => clearInterval(interval)
    }
  }, [mounted])

  const corrigirResultadoP = async () => {
    if (!confirm('Corrigir registros com resultado "P" para "Prenha" no banco?')) return
    setCorrigindoP(true)
    try {
      const r = await fetch('/api/inseminacoes/corrigir-resultado-p', { method: 'POST' })
      const data = await r.json().catch(() => ({}))
      if (r.ok && data.success) {
        alert(`âÅ“â€¦ Corrigidos: ${data.atualizados?.status_gestacao ?? 0} status_gestacao, ${data.atualizados?.resultado_dg ?? 0} resultado_dg`)
        loadInseminacoes()
        loadAlertasDG()
      } else {
        throw new Error(data.details || data.error || `HTTP ${r.status}`)
      }
    } catch (e) {
      alert('Erro: ' + (e.message || 'Falha ao corrigir'))
    } finally {
      setCorrigindoP(false)
    }
  }

  const handleLimparTudo = async () => {
    // Solicitar senha de desenvolvedor
    const senha = prompt('ðÅ¸â€�â€™ Ã�REA RESTRITA - Digite a senha do desenvolvedor para continuar:')
    
    if (!senha) {
      return // UsuÃ¡rio cancelou
    }
    
    if (senha !== 'bfzk26') {
      alert('â�Å’ Senha incorreta! Acesso negado.')
      return
    }
    
    if (!confirm('âÅ¡ ï¸� ATENÃâ€¡ÃÆ’O: Isso apagarÃ¡ TODAS as inseminaÃ§Ãµes do banco. Deseja continuar?')) return
    
    setLimandoTudo(true)
    try {
      const r = await fetch('/api/inseminacoes?todos=true', { 
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-password': 'bfzk26'
        }
      })
      const data = await r.json().catch(() => ({}))
      if (r.ok && data.success) {
        alert(`âÅ“â€¦ ${data.count ?? 0} inseminaÃ§Ã£o(Ãµes) removida(s). VocÃª pode importar novamente.`)
        loadInseminacoes()
        loadAlertasDG()
      } else {
        throw new Error(data.error || data.details || `HTTP ${r.status}`)
      }
    } catch (e) {
      alert('Erro ao limpar: ' + (e.message || 'Falha na requisiÃ§Ã£o'))
    } finally {
      setLimandoTudo(false)
    }
  }

  const corrigirTourosExcel = async (e) => {
    const file = e?.target?.files?.[0]
    if (!file) return
    setCorrigindoTouros(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await fetch('/api/inseminacoes/corrigir-touros-excel', { method: 'POST', body: fd })
      const data = await r.json().catch(() => ({}))
      if (r.ok && data.success) {
        alert(`âÅ“â€¦ ${data.corrigidos ?? 0} touro(s) corrigido(s) no banco.`)
        loadInseminacoes()
      } else throw new Error(data.details || data.error || 'Erro')
    } catch (err) {
      alert('Erro: ' + (err.message || 'Falha ao corrigir touros'))
    } finally {
      setCorrigindoTouros(false)
      e.target.value = ''
    }
  }

  const loadInseminacoes = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/inseminacoes')
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      setInseminacoes(data.data || [])
    } catch (error) {
      console.error('Erro ao carregar inseminaÃ§Ãµes:', error)
      setInseminacoes([])
    } finally {
      setIsLoading(false)
    }
  }

  const loadAlertasDG = async () => {
    try {
      setLoadingAlertas(true)
      const response = await fetch('/api/inseminacoes/alertas-dg')
      if (response.ok) {
        const data = await response.json()
        setAlertasDG(data.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar alertas de DG:', error)
    } finally {
      setLoadingAlertas(false)
    }
  }

  const loadSemenStock = async () => {
    try {
      const response = await fetch('/api/semen')
      if (response.ok) {
        const responseData = await response.json()
        const data = responseData.data || responseData
        const allSemen = Array.isArray(data) ? data : []
        
        // Agrupar por touro (nome + RG) e somar doses disponÃ­veis
        // Mas manter o ID do primeiro registro encontrado para cada touro
        const tourosMap = new Map()
        
        allSemen.forEach(semen => {
          const nomeTouro = (semen.nomeTouro || semen.nome_touro || '').trim()
          const rgTouro = (semen.rgTouro || semen.rg_touro || '').trim()
          const key = `${nomeTouro}|${rgTouro}`
          
          // Somar apenas doses disponÃ­veis de entradas
          if (semen.tipoOperacao === 'entrada' && parseInt(semen.dosesDisponiveis || 0) > 0) {
            if (!tourosMap.has(key)) {
              tourosMap.set(key, {
                id: semen.id, // ID do primeiro registro encontrado
                nomeTouro: nomeTouro,
                rgTouro: rgTouro,
                dosesDisponiveis: 0,
                raca: semen.raca || '',
                localizacao: semen.localizacao || '',
                rack: semen.rack_touro || '',
                botijao: semen.botijao || '',
                caneca: semen.caneca || '',
                certificado: semen.certificado || '',
                origem: semen.origem || '',
                linhagem: semen.linhagem || '',
                status: semen.status || 'disponivel'
              })
            }
            
            const touro = tourosMap.get(key)
            touro.dosesDisponiveis += parseInt(semen.dosesDisponiveis || 0)
          }
        })
        
        // Converter para array e filtrar apenas os que tÃªm doses disponÃ­veis
        const availableSemen = Array.from(tourosMap.values()).filter(touro => 
          touro.dosesDisponiveis > 0 && touro.status === 'disponivel'
        )
        
        setSemenStock(availableSemen)
      }
    } catch (error) {
      console.error('Erro ao carregar estoque de sÃªmen:', error)
      setSemenStock([])
    }
  }

  // Buscar animal por sÃ©rie/RG
  const buscarAnimalPorSerieRG = async (serieRG) => {
    if (!serieRG || serieRG.trim() === '') {
      setAnimalEncontrado(null)
      setFormData(prev => ({ ...prev, animalId: '', animalSerieRG: '' }))
      return
    }

    setBuscandoAnimal(true)
    try {
      // Extrair sÃ©rie e RG da entrada
      // Formato esperado: "CJCJ 17372" ou "CJCJ17372" ou "CJCJ-17372" ou apenas "17372"
      let serie = ''
      let rg = ''
      
      const entrada = serieRG.trim()
      
      // Se for apenas nÃºmeros, Ã© sÃ³ o RG
      if (/^\d+$/.test(entrada)) {
        rg = entrada
      } else {
        // Tentar separar por espaÃ§o ou hÃ­fen
        const partes = entrada.split(/[\s\-]+/)
        if (partes.length >= 2) {
          serie = partes[0].toUpperCase().trim()
          rg = partes.slice(1).join(' ').trim()
        } else {
          // Tentar extrair sÃ©rie do inÃ­cio (2-5 letras) e o resto Ã© RG
          const match = entrada.match(/^([A-Z]{2,5})(\d+.*)$/i)
          if (match) {
            serie = match[1].toUpperCase()
            rg = match[2].trim()
          } else {
            // Se nÃ£o conseguir separar, tentar buscar diretamente
            serie = entrada.toUpperCase()
          }
        }
      }

      let animais = []

      // EstratÃ©gia 1: Busca exata com sÃ©rie e RG
      if (serie && rg) {
        const params1 = new URLSearchParams()
        params1.append('serie', serie)
        params1.append('rg', rg)
        
        const response1 = await fetch(`/api/animals?${params1.toString()}`)
        if (response1.ok) {
          const data1 = await response1.json()
          animais = (data1.data || data1.animals || []).filter(a => 
            a.sexo === 'FÃªmea' || a.sexo === 'F'
          )
        }
      }

      // EstratÃ©gia 2: Se nÃ£o encontrou, tentar sÃ³ com sÃ©rie
      if (animais.length === 0 && serie && !rg) {
        const params2 = new URLSearchParams()
        params2.append('serie', serie)
        
        const response2 = await fetch(`/api/animals?${params2.toString()}`)
        if (response2.ok) {
          const data2 = await response2.json()
          const animaisPorSerie = data2.data || data2.animals || []
          animais = animaisPorSerie.filter(a => a.sexo === 'FÃªmea' || a.sexo === 'F')
        }
      }

      // EstratÃ©gia 3: Se ainda nÃ£o encontrou e tem RG (com ou sem sÃ©rie), buscar sÃ³ pelo RG
      if (animais.length === 0 && rg) {
        const params3 = new URLSearchParams()
        params3.append('rg', rg)
        
        const response3 = await fetch(`/api/animals?${params3.toString()}`)
        if (response3.ok) {
          const data3 = await response3.json()
          const animaisPorRG = data3.data || data3.animals || []
          
          // Se tinha sÃ©rie especificada, filtrar por ela tambÃ©m
          if (serie) {
            animais = animaisPorRG.filter(a => 
              (a.sexo === 'FÃªmea' || a.sexo === 'F') &&
              a.serie?.toUpperCase().trim() === serie.toUpperCase().trim()
            )
          } else {
            // Se nÃ£o tinha sÃ©rie, aceitar qualquer fÃªmea com esse RG
            animais = animaisPorRG.filter(a => a.sexo === 'FÃªmea' || a.sexo === 'F')
          }
        }
      }

      // EstratÃ©gia 4: Buscar em todos os animais carregados (fallback)
      if (animais.length === 0 && animals.length > 0) {
        animais = animals.filter(a => {
          const rgAnimal = a.rg?.toString().trim()
          const serieAnimal = a.serie?.toUpperCase().trim()
          
          // Se sÃ³ tem RG, buscar por RG
          if (!serie && rg) {
            return rgAnimal === rg || parseInt(rgAnimal) === parseInt(rg)
          }
          
          // Se tem sÃ©rie e RG, buscar por ambos
          if (serie && rg) {
            return serieAnimal === serie && (rgAnimal === rg || parseInt(rgAnimal) === parseInt(rg))
          }
          
          // Se sÃ³ tem sÃ©rie, buscar por sÃ©rie
          if (serie && !rg) {
            return serieAnimal === serie
          }
          
          return false
        })
      }

      // Se encontrou exatamente um animal, usar ele
      if (animais.length === 1) {
        const animal = animais[0]
        setAnimalEncontrado(animal)
        setFormData(prev => ({ 
          ...prev, 
          animalId: animal.id.toString(),
          animalSerieRG: `${animal.serie} ${animal.rg}`.trim()
        }))
      } else if (animais.length > 1) {
        // MÃºltiplos encontrados - tentar encontrar o exato
        let animalExato = null
        
        // Se tem RG, tentar encontrar por RG exato
        if (rg) {
          animalExato = animais.find(a => {
            const rgAnimal = a.rg?.toString().trim()
            const rgBuscado = rg.toString().trim()
            const match = rgAnimal === rgBuscado || parseInt(rgAnimal) === parseInt(rgBuscado)
            
            // Se tambÃ©m tem sÃ©rie, validar sÃ©rie
            if (match && serie) {
              return a.serie?.toUpperCase().trim() === serie.toUpperCase().trim()
            }
            return match
          })
        }
        
        if (animalExato) {
          setAnimalEncontrado(animalExato)
          setFormData(prev => ({ 
            ...prev, 
            animalId: animalExato.id.toString(),
            animalSerieRG: `${animalExato.serie} ${animalExato.rg}`.trim()
          }))
        } else {
          setAnimalEncontrado(null)
          setFormData(prev => ({ ...prev, animalId: '' }))
          
          // Mostrar lista de opÃ§Ãµes
          const opcoes = animais.slice(0, 5).map(a => `${a.serie} ${a.rg} - ${a.nome || 'Sem nome'}`).join('\n')
          alert(`âÅ¡ ï¸� ${animais.length} fÃªmeas encontradas com esse RG. Especifique a sÃ©rie:\n\n${opcoes}${animais.length > 5 ? '\n...' : ''}`)
        }
      } else {
        setAnimalEncontrado(null)
        setFormData(prev => ({ ...prev, animalId: '' }))
        alert(`â�Å’ FÃªmea nÃ£o encontrada: ${serieRG}\n\nðÅ¸â€™¡ Dica: VocÃª pode buscar apenas pelo RG (ex: 16588) ou com a sÃ©rie completa (ex: CJCJ 16588)`)
      }
    } catch (error) {
      console.error('Erro ao buscar animal:', error)
      setAnimalEncontrado(null)
      setFormData(prev => ({ ...prev, animalId: '' }))
      alert(`â�Å’ Erro ao buscar animal: ${error.message}`)
    } finally {
      setBuscandoAnimal(false)
    }
  }

  const loadAnimals = async () => {
    try {
      const response = await fetch('/api/animals')
      if (response.ok) {
        const responseData = await response.json()
        const data = responseData.data || responseData
        // Filtrar apenas fÃªmeas em idade reprodutiva
        const femaleAnimals = (Array.isArray(data) ? data : []).filter(animal => 
          animal.sexo === 'FÃªmea' || animal.sexo === 'F'
        )
        setAnimals(femaleAnimals)
      }
    } catch (error) {
      console.error('Erro ao carregar animais:', error)
      setAnimals([])
    }
  }

  const saveInseminacoes = (newData) => {
    setInseminacoes(newData)
    if (typeof window !== 'undefined') {
      localStorage.setItem('inseminacoes', JSON.stringify(newData))
    }
  }

  const handleDelete = (id) => {
    const updatedData = inseminacoes.filter(item => item.id !== id)
    saveInseminacoes(updatedData)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // ValidaÃ§Ãµes
    if (!formData.animalId) {
      alert('Selecione um animal')
      return
    }
    
    if (!formData.semenId) {
      alert('Selecione um sÃªmen disponÃ­vel')
      return
    }
    
    if (!formData.tecnico.trim()) {
      alert('Informe o tÃ©cnico responsÃ¡vel')
      return
    }

    // Verificar se o sÃªmen ainda estÃ¡ disponÃ­vel
    if (!semenSelecionado || parseInt(semenSelecionado.dosesDisponiveis) <= 0) {
      alert('SÃªmen selecionado nÃ£o estÃ¡ mais disponÃ­vel')
      return
    }

    try {
      // Validar se animal foi encontrado
      if (!formData.animalId || !animalEncontrado) {
        alert('âÅ¡ ï¸� Por favor, busque e selecione uma fÃªmea vÃ¡lida pelo SÃ©rie e RG')
        return
      }

      const selectedAnimal = animalEncontrado
      
      // Validar se sÃªmen foi selecionado
      if (!formData.semenId || !semenSelecionado) {
        alert('âÅ¡ ï¸� Por favor, selecione um sÃªmen disponÃ­vel do estoque')
        return
      }
      
      // Salvar no banco de dados
      const response = await fetch('/api/inseminacoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          animal_id: parseInt(formData.animalId),
          data_inseminacao: formData.dataInseminacao,
          touro: semenSelecionado.nomeTouro,
          semen_id: parseInt(formData.semenId),
          tecnico: formData.tecnico,
          protocolo: formData.protocolo,
          observacoes: formData.observacoes,
          status_gestacao: formData.statusGestacao || null,
          custo_dose: parseFloat(formData.custoDose) || custoDosePadrao
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao salvar inseminaÃ§Ã£o')
      }

      const result = await response.json()
      const newInseminacao = result.data

      // Registrar saÃ­da do sÃªmen (usar 1 dose)
      const saidaResponse = await fetch('/api/semen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entradaId: selectedSemen.id,
          tipoOperacao: 'saida',
          quantidadeDoses: 1,
          destino: `IA - ${newInseminacao.animal}`,
          dataCompra: formData.dataInseminacao,
          observacoes: `InseminaÃ§Ã£o artificial - ${formData.tecnico}`,
          nomeTouro: selectedSemen.nomeTouro || selectedSemen.nome_touro,
          localizacao: selectedSemen.localizacao
        })
      })

      if (saidaResponse.ok) {
        alert('InseminaÃ§Ã£o registrada com sucesso!')
        setShowForm(false)
        setFormData({
          animalId: '',
          animalSerieRG: '',
          semenId: '',
          dataInseminacao: new Date().toISOString().split('T')[0],
          tecnico: '',
          observacoes: '',
          protocolo: '',
          statusGestacao: '',
          custoDose: custoDosePadrao
        })
        setAnimalEncontrado(null)
        setSemenSelecionado(null)
        // Recarregar dados
        loadInseminacoes()
        loadSemenStock()
        loadAlertasDG()
        
        // Se status_gestacao for 'prenha', alertar sobre vinculaÃ§Ã£o com nascimentos
        if (formData.statusGestacao === 'prenha' || formData.statusGestacao === 'Prenha') {
          alert('âÅ“â€¦ GestaÃ§Ã£o confirmada! A gestaÃ§Ã£o foi vinculada automaticamente. O parto estÃ¡ previsto para aproximadamente 9 meses apÃ³s a IA.')
        } else if (!formData.statusGestacao) {
          alert('âÅ¡ ï¸� Lembrete: Em 30 dias apÃ³s a IA, realize o DiagnÃ³stico de GestaÃ§Ã£o (DG). O sistema gerarÃ¡ um alerta automÃ¡tico.')
        }
      } else {
        alert('Erro ao registrar saÃ­da do sÃªmen')
      }
    } catch (error) {
      console.error('Erro ao registrar inseminaÃ§Ã£o:', error)
      alert('Erro ao registrar inseminaÃ§Ã£o')
    }
  }

  // FunÃ§Ã£o auxiliar para converter data
  const converterData = (data) => {
    if (!data) return null
    
    // Se for nÃºmero (serial do Excel), converter
    if (typeof data === 'number') {
      try {
        const excelEpoch = new Date(1899, 11, 30)
        const date = new Date(excelEpoch.getTime() + data * 24 * 60 * 60 * 1000)
        if (isNaN(date.getTime())) return null
        const isoDate = date.toISOString().split('T')[0]
        // Validar se a data Ã© vÃ¡lida (nÃ£o muito antiga ou futura)
        if (isoDate < '1900-01-01' || isoDate > '2100-12-31') return null
        return isoDate
      } catch (e) {
        return null
      }
    }
    
    if (data instanceof Date) {
      if (isNaN(data.getTime())) return null
      return data.toISOString().split('T')[0]
    }
    
    if (typeof data === 'string') {
      const dataStr = data.toString().trim()
      if (!dataStr || dataStr === '' || dataStr === 'null' || dataStr === 'undefined') return null
      
      // Se for nÃºmero serial do Excel (ex: "40050", "46031") - XLSX Ã s vezes exporta datas como string
      const numVal = parseFloat(dataStr)
      if (!isNaN(numVal) && numVal > 0 && numVal < 1000000) {
        try {
          const dias = Math.floor(numVal)
          const excelEpoch = new Date(1899, 11, 30)
          const date = new Date(excelEpoch.getTime() + dias * 24 * 60 * 60 * 1000)
          if (!isNaN(date.getTime())) {
            const isoDate = date.toISOString().split('T')[0]
            if (isoDate >= '1900-01-01' && isoDate <= '2100-12-31') return isoDate
          }
        } catch (_) {}
      }
      
      // Tentar diferentes formatos de data
      const dateParts = dataStr.split(/[\/\-\.]/)
      if (dateParts.length === 3) {
        let dia = dateParts[0].trim()
        let mes = dateParts[1].trim()
        let ano = dateParts[2].trim()
        
        // Validar que sÃ£o nÃºmeros
        const diaNum = parseInt(dia)
        const mesNum = parseInt(mes)
        const anoNum = parseInt(ano)
        
        if (isNaN(diaNum) || isNaN(mesNum) || isNaN(anoNum)) return null
        
        // Se o ano tem 2 dÃ­gitos, assumir 20XX
        if (ano.length === 2) {
          ano = anoNum > 50 ? `19${ano}` : `20${ano}`
        }
        
        // Validar valores
        if (diaNum < 1 || diaNum > 31) return null
        if (mesNum < 1 || mesNum > 12) return null
        if (ano.length !== 4) return null
        
        const anoFinal = parseInt(ano)
        if (anoFinal < 1900 || anoFinal > 2100) return null
        
        // Se o ano tem 4 dÃ­gitos e estÃ¡ no inÃ­cio (formato YYYY-MM-DD)
        if (dateParts[0].length === 4) {
          const formatted = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
          // Validar data final
          const testDate = new Date(formatted)
          if (isNaN(testDate.getTime())) return null
          return formatted
        }
        
        // Formato DD/MM/YYYY ou DD/MM/YY
        if (dia.length <= 2 && mes.length <= 2) {
          const formatted = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
          // Validar data final
          const testDate = new Date(formatted)
          if (isNaN(testDate.getTime())) return null
          return formatted
        }
      }
      
      // Tentar parse direto
      try {
        const parsed = new Date(dataStr)
        if (!isNaN(parsed.getTime())) {
          const isoDate = parsed.toISOString().split('T')[0]
          // Validar se a data Ã© vÃ¡lida
          if (isoDate < '1900-01-01' || isoDate > '2100-12-31') return null
          return isoDate
        }
      } catch (e) {
        return null
      }
    }
    
    return null
  }

  // FunÃ§Ã£o auxiliar para normalizar resultado do DG (inclui SITUAÃâ€¡ÃÆ’O: PARIDA/PRENHA do Excel)
  const normalizarResultadoDG = (resultado) => {
    if (!resultado) return null
    const resultadoLower = resultado.toString().toLowerCase().trim()
    if (resultadoLower.includes('parida') || resultadoLower === 'parida') {
      return 'Parida'
    }
    if (resultadoLower.includes('prenha') || resultadoLower === 'prenha' || resultadoLower === 'prenhez' || resultadoLower === 'p' || resultadoLower === 'sim') {
      return 'prenha'
    } else if (resultadoLower.includes('nÃ£o prenha') || resultadoLower.includes('nao prenha') || resultadoLower === 'nÃ£o prenha' || resultadoLower === 'nao prenha' || resultadoLower === 'vazia' || resultadoLower === 'np' || resultadoLower === 'nÃ£o' || resultadoLower === 'nao' || resultadoLower === 'n') {
      return 'nÃ£o prenha'
    }
    return null
  }

  // FunÃ§Ã£o para detectar automaticamente campos do Excel
  const detectFields = (headers) => {
    const findColumnIndex = (names, startFromIndex = 0) => {
      for (const name of names) {
        const found = headers.findIndex((h, idx) => idx >= startFromIndex && (
          h.name.toUpperCase() === name.toUpperCase() || 
          h.name.toUpperCase().includes(name.toUpperCase()) ||
          name.toUpperCase().includes(h.name.toUpperCase())
        ))
        if (found !== -1) return headers[found].name
      }
      return ''
    }

    const findColumnIndexByHeader = (names, startFromIndex = 0, excludeHeaders = []) => {
      const exclude = excludeHeaders.map(x => x.toUpperCase().trim())
      for (const name of names) {
        const found = headers.findIndex((h, idx) => {
          if (idx < startFromIndex) return false
          if (exclude.length && exclude.includes(h.name.toUpperCase().trim())) return false
          return h.name.toUpperCase() === name.toUpperCase() || 
            h.name.toUpperCase().includes(name.toUpperCase()) ||
            name.toUpperCase().includes(h.name.toUpperCase())
        })
        if (found !== -1) return { name: headers[found].name, index: found }
      }
      return null
    }

    const newMapping = { ...fieldMapping }
    
    // Campos bÃ¡sicos (animal) - primeiras colunas
    newMapping.serie.source = findColumnIndex(['SÃâ€°RIE', 'SÃ©rie', 'serie', 'SERIE']) || ''
    newMapping.rg.source = findColumnIndex(['RG', 'rg']) || ''
    newMapping.local.source = findColumnIndex(['LOCAL', 'Local', 'local']) || ''
    
    // 1Âª IA - coluna TOURO deve conter NOME (nunca SÃâ€°RIE ou RG) - ACASALAMENTO Ã© o nome principal no Excel
    const touro1Col = findColumnIndexByHeader(['ACASALAMENTO', 'ACASALAMENTOS', 'TOURO_1Âª I.A', 'TOURO 1Âª IA', 'TOURO_1Âª IA', 'TOURO 1Âª I.A', 'Touro_1Âª I.A', 'TOURO 1Âª', '1Âª TOURO', 'TOURO', 'NOME TOURO', 'REPRODUTOR'], 0, ['SÃâ€°RIE', 'RG'])
    newMapping.touro1.source = touro1Col ? (headers.filter(h => h.name === touro1Col.name).length > 1 ? `${touro1Col.name}|${touro1Col.index}` : touro1Col.name) : ''
    const idxDepoisTouro1 = touro1Col ? touro1Col.index + 1 : 0
    const serieTouro1Col = findColumnIndexByHeader(['SÃâ€°RIE TOURO 1Âª', 'SERIE TOURO 1Âª', 'SÃâ€°RIE', 'SÃ©rie'], idxDepoisTouro1)
    const rgTouro1Col = findColumnIndexByHeader(['RG TOURO 1Âª', 'RG TOURO 1Âª', 'RG', 'rg'], idxDepoisTouro1)
    newMapping.serieTouro1.source = serieTouro1Col ? `${serieTouro1Col.name}|${serieTouro1Col.index}` : ''
    newMapping.rgTouro1.source = rgTouro1Col ? `${rgTouro1Col.name}|${rgTouro1Col.index}` : ''
    newMapping.dataIA1.source = findColumnIndex(['DATA I.A.', 'DATA I.A', 'Data I.A.', 'Data I.A', 'data i.a', 'DATA IA', 'DATA IA 1Âª', 'DATA IA 1', 'DATA I.A 1Âª']) || ''
    newMapping.dataDG1.source = findColumnIndex(['DATA DG 1Âª IA', 'Data DG 1Âª IA', 'data dg 1Âª ia', 'DATA DG 1ÂªIA', 'DATA DG 1Âª IA', 'DATA DG', 'Data DG', 'data dg', 'DATA DG 1Âª', 'DATA DG 1']) || ''
    
    // 2Âª IA
    newMapping.touro2.source = findColumnIndex(['TOURO_2Âª I.A', 'TOURO_2Âª I.A', 'Touro_2Âª I.A', 'touro_2Âª i.a', 'TOURO 2Âª IA', 'TOURO_2Âª IA', 'TOURO 2Âª', 'Touro 2Âª']) || ''
    const touro2Col = findColumnIndexByHeader(['TOURO_2Âª I.A', 'TOURO 2Âª IA', 'TOURO 2Âª'])
    const idxDepoisTouro2 = touro2Col ? touro2Col.index + 1 : 0
    const serieTouro2Col = findColumnIndexByHeader(['SÃâ€°RIE TOURO 2Âª', 'SERIE TOURO 2Âª', 'SÃâ€°RIE', 'SÃ©rie'], idxDepoisTouro2)
    const rgTouro2Col = findColumnIndexByHeader(['RG TOURO 2Âª', 'RG TOURO 2Âª', 'RG', 'rg'], idxDepoisTouro2)
    newMapping.serieTouro2.source = serieTouro2Col ? `${serieTouro2Col.name}|${serieTouro2Col.index}` : ''
    newMapping.rgTouro2.source = rgTouro2Col ? `${rgTouro2Col.name}|${rgTouro2Col.index}` : ''
    newMapping.dataIA2.source = findColumnIndex(['DATA 2Âª I.A', 'Data 2Âª I.A', 'data 2Âª i.a', 'DATA 2ÂªIA', 'DATA 2Âª I.A', 'DATA 2Âª IA', 'DATA IA 2Âª']) || ''
    newMapping.dataDG2.source = findColumnIndex(['DATA DG 2Âª IA', 'Data DG 2Âª IA', 'data dg 2Âª ia', 'DATA DG 2ÂªIA', 'DATA DG 2Âª IA', 'DATA DG 2Âª', 'DATA DG 2']) || ''
    
    // 3Âª IA
    newMapping.touro3.source = findColumnIndex(['TOURO_3Âª I.A', 'TOURO_3Âª I.A', 'Touro_3Âª I.A', 'touro_3Âª i.a', 'TOURO 3Âª IA', 'TOURO_3Âª IA', 'TOURO 3Âª', 'Touro 3Âª']) || ''
    const touro3Col = findColumnIndexByHeader(['TOURO_3Âª I.A', 'TOURO 3Âª IA', 'TOURO 3Âª'])
    const idxDepoisTouro3 = touro3Col ? touro3Col.index + 1 : 0
    const serieTouro3Col = findColumnIndexByHeader(['SÃâ€°RIE TOURO 3Âª', 'SERIE TOURO 3Âª', 'SÃâ€°RIE', 'SÃ©rie'], idxDepoisTouro3)
    const rgTouro3Col = findColumnIndexByHeader(['RG TOURO 3Âª', 'RG TOURO 3Âª', 'RG', 'rg'], idxDepoisTouro3)
    newMapping.serieTouro3.source = serieTouro3Col ? `${serieTouro3Col.name}|${serieTouro3Col.index}` : ''
    newMapping.rgTouro3.source = rgTouro3Col ? `${rgTouro3Col.name}|${rgTouro3Col.index}` : ''
    newMapping.dataIA3.source = findColumnIndex(['DATA 3Âª I.A', 'Data 3Âª I.A', 'data 3Âª i.a', 'DATA 3ÂªIA', 'DATA 3Âª I.A', 'DATA 3Âª IA', 'DATA IA 3Âª']) || ''
    newMapping.dataDG3.source = findColumnIndex(['DATA DG 3Âª IA', 'Data DG 3Âª IA', 'data dg 3Âª ia', 'DATA DG 3ÂªIA', 'DATA DG 3Âª IA', 'DATA DG 3Âª', 'DATA DG 3']) || ''
    
    newMapping.observacao.source = findColumnIndex(['OBSERVAÃâ€¡ÃÆ’O', 'ObservaÃ§Ã£o', 'observacao', 'OBS', 'obs', 'OBSERVAÃâ€¡ÃÆ’O']) || ''

    // Encontrar Results ou SITUAÃâ€¡ÃÆ’O (PARIDA/PRENHA)
    const situacaoCol = findColumnIndex(['SITUAÃâ€¡ÃÆ’O', 'SITUACAO', 'SITUACAO', 'SITUAC'])
    if (situacaoCol) newMapping.result1.source = situacaoCol

    const resultColumns = headers
      .map((h, idx) => ({ name: h.name, index: idx }))
      .filter(h => {
        const nameUpper = h.name.toUpperCase().trim()
        return nameUpper === 'RESULT' || 
               nameUpper === 'RESULTADO' ||
               nameUpper.includes('RESULT') ||
               nameUpper === 'RESUL'
      })
      .sort((a, b) => a.index - b.index)

    if (resultColumns.length >= 1 && !newMapping.result1.source) {
      newMapping.result1.source = resultColumns[0].name
    }
    if (resultColumns.length >= 2) {
      newMapping.result2.source = resultColumns[1].name
    }
    if (resultColumns.length >= 3) {
      newMapping.result3.source = resultColumns[2].name
    } else if (resultColumns.length === 1) {
      const resultadoCol = headers.find(h => 
        h.name.toUpperCase() === 'RESULTADO' && 
        h.name.toUpperCase() !== 'RESULT'
      )
      if (resultadoCol) {
        newMapping.result3.source = resultadoCol.name
      }
    }

    // Habilitar campos detectados automaticamente
    Object.keys(newMapping).forEach(key => {
      if (newMapping[key].source) {
        newMapping[key].enabled = true
      }
    })

    // Sempre habilitar campos obrigatÃ³rios
    newMapping.serie.enabled = true
    newMapping.rg.enabled = true

    return newMapping
  }

  // FunÃ§Ã£o para ler arquivo Excel e preparar mapeamento
  const handleExcelFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        
        // Ler primeiro como array para identificar posiÃ§Ãµes das colunas
        const arrayData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })
        if (arrayData.length < 2) {
          alert('âÅ¡ ï¸� Arquivo Excel deve ter pelo menos 2 linhas (cabeÃ§alho + dados)')
          return
        }

        // Mapear cabeÃ§alhos e suas posiÃ§Ãµes
        const headers = arrayData[0].map((h, idx) => ({ 
          name: String(h || '').trim() || `Coluna ${idx + 1}`, 
          index: idx 
        }))

        // Detectar campos automaticamente
        const detectedMapping = detectFields(headers)
        
        // Salvar dados para processamento posterior
        setExcelHeaders(headers)
        setExcelData(arrayData.slice(1))
        setFieldMapping(detectedMapping)
        setShowFieldMapping(true)
      } catch (error) {
        alert(`â�Å’ Erro ao ler arquivo Excel: ${error.message}`)
        console.error('Erro detalhado:', error)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  // FunÃ§Ã£o para processar importaÃ§Ã£o usando mapeamento escolhido
  const processImportWithMapping = async () => {
    try {
      if (!fieldMapping.serie.source || !fieldMapping.rg.source) {
        alert('âÅ¡ ï¸� Campos obrigatÃ³rios (SÃ©rie e RG) devem estar mapeados!')
        return
      }
      setImportando(true)

      // FunÃ§Ã£o auxiliar para encontrar Ã­ndice do cabeÃ§alho (compatÃ­vel com variaÃ§Ãµes de espaÃ§os/case)
      const findHeaderIndex = (source) => {
        if (!source) return -1
        const sourceNorm = String(source).trim().toUpperCase()
        const found = excelHeaders.findIndex(h => {
          const nameNorm = String(h?.name || '').trim().toUpperCase()
          return nameNorm === sourceNorm || nameNorm.includes(sourceNorm) || sourceNorm.includes(nameNorm)
        })
        return found
      }

      // Converter dados usando mapeamento (source pode ser "Nome" ou "Nome|Ã­ndice" para colunas duplicadas)
      const jsonData = excelData.map(row => {
        const obj = {}
        Object.keys(fieldMapping).forEach(key => {
          const mapping = fieldMapping[key]
          if (mapping.enabled && mapping.source) {
            let headerIndex = -1
            if (mapping.source.includes('|')) {
              const idx = parseInt(mapping.source.split('|')[1], 10)
              if (!isNaN(idx)) headerIndex = idx
            } else {
              headerIndex = excelHeaders.findIndex(h => h.name === mapping.source)
              if (headerIndex === -1) headerIndex = findHeaderIndex(mapping.source)
            }
            if (headerIndex >= 0 && row[headerIndex] !== undefined) {
              obj[key] = String(row[headerIndex] || '').trim()
            } else {
              obj[key] = ''
            }
          } else {
            obj[key] = ''
          }
        })
        return obj
      })

      if (jsonData.length === 0) {
        setImportando(false)
        alert('âÅ¡ ï¸� Arquivo Excel estÃ¡ vazio')
        return
      }

      const totalLinhas = jsonData.length
      setImportProgress({ atual: 0, total: totalLinhas, etapa: 'Carregando animais e sÃªmen...' })

      // Carregar animais e sÃªmen uma vez
      const animaisResponse = await fetch('/api/animals')
      const animaisData = await animaisResponse.json()
      const animais = animaisData.animals || animaisData.data || []

      const semenResponse = await fetch('/api/semen')
      const semenData = await semenResponse.json()
      const semenList = semenData.data || semenData || []

      setImportProgress({ atual: 0, total: totalLinhas, etapa: 'Importando inseminaÃ§Ãµes...' })

      // Processar cada linha (cada linha = um animal com atÃ© 3 IAs)
      let sucesso = 0
      let atualizadas = 0
      let erros = 0
      const errosDetalhes = []
      let linhaAtual = 0

        for (const row of jsonData) {
          linhaAtual++
          setImportProgress({ atual: linhaAtual, total: totalLinhas, etapa: `Processando linha ${linhaAtual} de ${totalLinhas}...` })
          try {
            // Mapear colunas do formato especÃ­fico (agora usando os Ã­ndices mapeados)
            const serie = (row.serie || '').toString().trim()
            const rg = (row.rg || '').toString().trim()
            const local = (row.local || '').toString().trim()
            const observacoes = (row.observacao || '').toString().trim()

            // Validar campos obrigatÃ³rios
            if (!serie || !rg) {
              erros++
              errosDetalhes.push(`Linha sem SÃ©rie ou RG: ${serie || 'N/A'} ${rg || 'N/A'}`)
              continue
            }

            // Buscar animal (busca mais flexÃ­vel)
            let animalEncontrado = animais.find(a => {
              const serieAnimal = (a.serie || '').toString().toUpperCase().trim()
              const rgAnimal = (a.rg || '').toString().trim()
              const serieBuscada = serie.toUpperCase().trim()
              const rgBuscado = rg.toString().trim()
              
              // Busca exata
              if (serieAnimal === serieBuscada && rgAnimal === rgBuscado) {
                return true
              }
              
              // Busca com conversÃ£o numÃ©rica do RG
              if (serieAnimal === serieBuscada) {
                const rgAnimalNum = parseInt(rgAnimal)
                const rgBuscadoNum = parseInt(rgBuscado)
                if (!isNaN(rgAnimalNum) && !isNaN(rgBuscadoNum) && rgAnimalNum === rgBuscadoNum) {
                  return true
                }
              }
              
              return false
            })

            if (!animalEncontrado) {
              erros++
              errosDetalhes.push(`Animal nÃ£o encontrado: ${serie} ${rg}`)
              continue
            }

            // Se o animal estÃ¡ como Macho no banco mas estÃ¡ na planilha de IA (Ã© fÃªmea), corrigir para FÃªmea
            const sexoAnimal = (animalEncontrado.sexo || '').toString().trim()
            const ehMacho = /macho|^m$/i.test(sexoAnimal) || sexoAnimal === 'M'
            if (ehMacho) {
              try {
                const resSexo = await fetch('/api/animals/' + animalEncontrado.id, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ sexo: 'FÃªmea' })
                })
                if (resSexo.ok) animalEncontrado.sexo = 'FÃªmea'
              } catch (_) {}
              // Sempre tratar como FÃªmea e prosseguir (animal na planilha de IA Ã© fÃªmea)
              animalEncontrado.sexo = 'FÃªmea'
            }

            // Processar atÃ© 3 inseminaÃ§Ãµes
            const inseminacoes = []

            // 1Âª IA
            const touro1 = (row.touro1 || '').toString().trim()
            const serieTouro1 = (row.serieTouro1 || '').toString().trim()
            const rgTouro1 = (row.rgTouro1 || '').toString().trim()
            const dataIA1 = (row.dataIA1 || '').toString().trim()
            const dataDG1 = (row.dataDG1 || '').toString().trim()
            const result1 = (row.result1 || '').toString().trim()

            // Se tem data da IA, processar (mesmo que nÃ£o tenha touro)
            if (dataIA1 && dataIA1.toString().trim() !== '') {
              inseminacoes.push({
                numero_ia: 1,
                touro: touro1,
                serie_touro: serieTouro1,
                rg_touro: rgTouro1,
                data_ia: dataIA1,
                data_dg: dataDG1,
                resultado_dg: result1
              })
            }

            // 2Âª IA
            const touro2 = (row.touro2 || '').toString().trim()
            const serieTouro2 = (row.serieTouro2 || '').toString().trim()
            const rgTouro2 = (row.rgTouro2 || '').toString().trim()
            const dataIA2 = (row.dataIA2 || '').toString().trim()
            const dataDG2 = (row.dataDG2 || '').toString().trim()
            const result2 = (row.result2 || '').toString().trim()

            // Se tem data da IA, processar (mesmo que nÃ£o tenha touro)
            if (dataIA2 && dataIA2.toString().trim() !== '') {
              inseminacoes.push({
                numero_ia: 2,
                touro: touro2,
                serie_touro: serieTouro2,
                rg_touro: rgTouro2,
                data_ia: dataIA2,
                data_dg: dataDG2,
                resultado_dg: result2
              })
            }

            // 3Âª IA
            const touro3 = (row.touro3 || '').toString().trim()
            const serieTouro3 = (row.serieTouro3 || '').toString().trim()
            const rgTouro3 = (row.rgTouro3 || '').toString().trim()
            const dataIA3 = (row.dataIA3 || '').toString().trim()
            const dataDG3 = (row.dataDG3 || '').toString().trim()
            const result3 = (row.result3 || '').toString().trim()

            // Se tem data da IA, processar (mesmo que nÃ£o tenha touro)
            if (dataIA3 && dataIA3.toString().trim() !== '') {
              inseminacoes.push({
                numero_ia: 3,
                touro: touro3,
                serie_touro: serieTouro3,
                rg_touro: rgTouro3,
                data_ia: dataIA3,
                data_dg: dataDG3,
                resultado_dg: result3
              })
            }

            // Se nÃ£o tem nenhuma IA vÃ¡lida, pular (mas nÃ£o Ã© erro crÃ­tico se o animal existe)
            if (inseminacoes.length === 0) {
              // NÃ£o contar como erro, apenas informar
              console.log(`Animal ${serie} ${rg} sem dados de inseminaÃ§Ã£o vÃ¡lidos`)
              continue
            }

            // Processar cada inseminaÃ§Ã£o
            for (const ia of inseminacoes) {
              // Validar data da IA
              if (!ia.data_ia || ia.data_ia.toString().trim() === '') {
                erros++
                errosDetalhes.push(`IA ${ia.numero_ia} do animal ${serie} ${rg} sem data`)
                continue
              }

              // Converter datas
              const dataIAFormatada = converterData(ia.data_ia)
              if (!dataIAFormatada || dataIAFormatada === 'Invalid Date' || dataIAFormatada === '') {
                erros++
                errosDetalhes.push(`IA ${ia.numero_ia} do animal ${serie} ${rg} - data invÃ¡lida: ${ia.data_ia}`)
                continue
              }
              
              // Validar formato da data antes de enviar
              const dataTest = new Date(dataIAFormatada)
              if (isNaN(dataTest.getTime())) {
                erros++
                errosDetalhes.push(`IA ${ia.numero_ia} do animal ${serie} ${rg} - data invÃ¡lida apÃ³s conversÃ£o: ${dataIAFormatada}`)
                continue
              }
              
              let dataDGFormatada = ia.data_dg && ia.data_dg.toString().trim() ? converterData(ia.data_dg) : null
              // Validar data DG se foi fornecida
              if (dataDGFormatada && (dataDGFormatada === 'Invalid Date' || dataDGFormatada === '' || !dataDGFormatada)) {
                // Se data DG Ã© invÃ¡lida, usar null
                dataDGFormatada = null
              }
              
              const resultadoDGNormalizado = normalizarResultadoDG(ia.resultado_dg)

            // Buscar sÃªmen do touro
              let semenEncontrado = null
              let rgTouroExtraido = null
              let nomeTouroExtraido = null

              // Extrair RG do touro do nome se estiver embutido (ex: "NORTICO - CJCJ 15236")
              if (ia.touro) {
                const touroStr = ia.touro.toString().trim()
                // Procurar padrÃ£o "SÃâ€°RIE RG" no nome do touro
                const rgMatch = touroStr.match(/\b([A-Z]{2,5})\s+(\d+)\b/i)
                if (rgMatch && !ia.serie_touro && !ia.rg_touro) {
                  ia.serie_touro = rgMatch[1].toUpperCase()
                  ia.rg_touro = rgMatch[2]
                }
              }

              // Priorizar SÃ©rie e RG do touro se fornecidos
              if (ia.serie_touro && ia.rg_touro) {
                const serieTouro = ia.serie_touro.toString().trim().toUpperCase()
                const rgTouro = ia.rg_touro.toString().trim()
                
                // Buscar pelo RG completo (SÃ©rie + RG)
                const rgCompleto = `${serieTouro} ${rgTouro}`.trim()
                rgTouroExtraido = rgCompleto
                
                semenEncontrado = semenList.find(s => {
                  const rgSemen = (s.rgTouro || s.rg_touro || '').toString().trim()
                  const serieSemen = (s.serieTouro || s.serie_touro || '').toString().trim().toUpperCase()
                  
                  // Buscar por RG completo
                  if (rgSemen === rgCompleto || rgSemen === rgTouro) {
                    return true
                  }
                  
                  // Buscar por sÃ©rie + RG separados
                  if (serieSemen === serieTouro) {
                    const rgSemenNum = rgSemen.replace(/^[A-Z]{2,5}\s*/i, '').trim()
                    const rgBuscadoNum = rgTouro.toString().trim()
                    return rgSemenNum === rgBuscadoNum || 
                           parseInt(rgSemenNum) === parseInt(rgBuscadoNum)
                  }
                  
                  return false
                })
              } else if (ia.rg_touro) {
                // Se sÃ³ tem RG, buscar pelo RG
                rgTouroExtraido = ia.rg_touro.toString().trim()
                semenEncontrado = semenList.find(s => {
                  const rgSemen = (s.rgTouro || s.rg_touro || '').toString().trim()
                  return rgSemen === rgTouroExtraido || 
                         rgSemen.includes(rgTouroExtraido) || 
                         rgTouroExtraido.includes(rgSemen) ||
                         rgSemen.replace(/\s/g, '') === rgTouroExtraido.replace(/\s/g, '')
                })
              }

              // Se nÃ£o encontrou pelos campos especÃ­ficos, tentar pelo nome do touro
              if (!semenEncontrado && ia.touro) {
                const touroStr = ia.touro.toString().trim()
                
                // Tentar extrair RG e nome do touro (formato pode ser "NOME TOURO RG12345" ou "RG12345 NOME TOURO")
                const rgMatch = touroStr.match(/\b([A-Z]{2,5}\s*\d+|\d+)\b/i)
                if (rgMatch && !rgTouroExtraido) {
                  rgTouroExtraido = rgMatch[1].trim()
                }
                
                // Nome do touro Ã© o resto (remover o RG se encontrado)
                nomeTouroExtraido = touroStr.replace(/\b([A-Z]{2,5}\s*\d+|\d+)\b/gi, '').trim()

                // Buscar primeiro pelo RG do touro (se extraÃ­do do nome)
                if (rgTouroExtraido && !semenEncontrado) {
                  semenEncontrado = semenList.find(s => {
                    const rgSemen = (s.rgTouro || s.rg_touro || '').toString().trim()
                    const rgBuscado = rgTouroExtraido.toString().trim()
                    return rgSemen === rgBuscado || 
                           rgSemen.includes(rgBuscado) || 
                           rgBuscado.includes(rgSemen) ||
                           rgSemen.replace(/\s/g, '') === rgBuscado.replace(/\s/g, '')
                  })
                }

                // Se nÃ£o encontrou pelo RG, buscar pelo nome
                if (!semenEncontrado && nomeTouroExtraido) {
                  semenEncontrado = semenList.find(s => {
                    const nomeTouro = (s.nomeTouro || s.nome_touro || '').toLowerCase().trim()
                    const touroBuscado = nomeTouroExtraido.toLowerCase().trim()
                    return nomeTouro.includes(touroBuscado) || 
                           touroBuscado.includes(nomeTouro) ||
                           nomeTouro === touroBuscado
                  })
                }

                // Se ainda nÃ£o encontrou, tentar buscar pelo campo completo
                if (!semenEncontrado) {
                  semenEncontrado = semenList.find(s => {
                    const nomeTouro = (s.nomeTouro || s.nome_touro || '').toLowerCase().trim()
                    const rgSemen = (s.rgTouro || s.rg_touro || '').toString().toLowerCase().trim()
                    const touroBuscado = touroStr.toLowerCase().trim()
                    return nomeTouro.includes(touroBuscado) || 
                           touroBuscado.includes(nomeTouro) ||
                           rgSemen.includes(touroBuscado) ||
                           touroBuscado.includes(rgSemen)
                  })
              }
            }

              // Validar dados antes de enviar
              if (!animalEncontrado.id) {
                erros++
                errosDetalhes.push(`Erro: Animal ${serie} ${rg} sem ID vÃ¡lido`)
                continue
              }

              if (!dataIAFormatada) {
                erros++
                errosDetalhes.push(`Erro: Data de IA invÃ¡lida para ${ia.numero_ia}Âª IA de ${serie} ${rg}`)
                continue
              }

              // Criar inseminaÃ§Ã£o
              try {
                // Nome do touro: priorizar semen.nomeTouro quando encontrado; evitar usar sÃ³ SÃâ€°RIE (ex: FGPA) como nome
                const iaTouroStr = (ia.touro || '').toString().trim()
                const pareceSerie = /^[A-Z]{2,6}$/i.test(iaTouroStr) && !iaTouroStr.includes(' ') && iaTouroStr.length <= 6
                let touroNomeFinal = nomeTouroExtraido || iaTouroStr
                if (semenEncontrado && (semenEncontrado.nomeTouro || semenEncontrado.nome_touro)) {
                  touroNomeFinal = (semenEncontrado.nomeTouro || semenEncontrado.nome_touro || '').toString().trim()
                } else if (pareceSerie && (ia.serie_touro || ia.rg_touro)) {
                  touroNomeFinal = nomeTouroExtraido || (ia.serie_touro && ia.rg_touro ? `${ia.serie_touro} ${ia.rg_touro}`.trim() : null)
                }
                const touroNome = touroNomeFinal || null
                const serieTouro = (ia.serie_touro || '').toString().trim() || null
                const rgTouroVal = (ia.rg_touro || '').toString().trim() || null
                const touroRgCompleto = (serieTouro && rgTouroVal) ? `${serieTouro} ${rgTouroVal}`.trim() : (rgTouroExtraido || rgTouroVal || null)

                const dadosEnvio = {
                  animal_id: parseInt(animalEncontrado.id),
                  data_inseminacao: dataIAFormatada,
                  modo: modoImportacaoIA,
                  touro_nome: touroNome,
                  touro: touroNome,
                  serie_touro: serieTouro,
                  touro_rg: touroRgCompleto,
                  semen_id: semenEncontrado?.id ? parseInt(semenEncontrado.id) : null,
                  tecnico: null,
                  protocolo: null,
                  observacoes: observacoes && observacoes.trim() ? observacoes.trim() : null,
                  status_gestacao: resultadoDGNormalizado || null,
                  custo_dose: custoDosePadrao,
                  numero_ia: ia.numero_ia || null,
                  numero_dg: (dataDGFormatada && dataDGFormatada !== null) ? 1 : null,
                  data_dg: dataDGFormatada || null,
                  resultado_dg: resultadoDGNormalizado || null
                }
                
                // ValidaÃ§Ã£o final antes de enviar
                if (!dadosEnvio.data_inseminacao || dadosEnvio.data_inseminacao === '' || dadosEnvio.data_inseminacao === 'Invalid Date') {
                  erros++
                  errosDetalhes.push(`IA ${ia.numero_ia} do animal ${serie} ${rg} - data invÃ¡lida antes do envio`)
                  continue
                }
                
                const response = await fetch('/api/inseminacoes', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(dadosEnvio)
                })

                if (response.ok) {
                  sucesso++
                  try {
                    const resData = await response.json()
                    if (resData.updated) atualizadas++
                  } catch (_) {}
                } else {
                  erros++
                  let errorMessage = 'Erro desconhecido'
                  try {
                    const errorData = await response.json()
                    errorMessage = errorData.details || errorData.error || errorData.message || 'Erro desconhecido'
                  } catch (parseError) {
                    errorMessage = `Erro HTTP ${response.status}: ${response.statusText}`
                  }
                  errosDetalhes.push(`Erro ao salvar ${ia.numero_ia}Âª IA de ${serie} ${rg}: ${errorMessage}`)
                }
              } catch (fetchError) {
                erros++
                errosDetalhes.push(`Erro de rede ao salvar ${ia.numero_ia}Âª IA de ${serie} ${rg}: ${fetchError.message || 'Erro desconhecido'}`)
              }
            }
          } catch (error) {
            erros++
            errosDetalhes.push(`Erro ao processar linha: ${error.message}`)
          }
        }

        // Mostrar resultado
        let mensagem = sucesso > 0
          ? (atualizadas > 0
            ? `âÅ“â€¦ SUCESSO: ${sucesso - atualizadas} adicionada(s), ${atualizadas} atualizada(s)!`
            : `âÅ“â€¦ SUCESSO: ${sucesso} inseminaÃ§Ã£o(Ãµes) importada(s)!`)
          : (erros > 0 ? 'â�Å’ Nenhuma inseminaÃ§Ã£o importada.\n\n' : '')
        
        if (erros > 0) {
          mensagem += `\n\nâ�Å’ ERROS ENCONTRADOS: ${erros}`
          mensagem += `\n\nðÅ¸â€œâ€¹ PRINCIPAIS CAUSAS DE ERRO:`
          mensagem += `\nââ‚¬¢ Animais nÃ£o encontrados no sistema`
          mensagem += `\nââ‚¬¢ Datas invÃ¡lidas`
          mensagem += `\n\nðÅ¸â€™¡ SOLUÃâ€¡ÃÆ’O: Revise a planilha e remova os animais problemÃ¡ticos`
        }
        if (erros > 0) {
          mensagem += `\nâÅ¡ ï¸� ${erros} erro(s) encontrado(s).`
          if (errosDetalhes.length > 0) {
            console.error('Detalhes dos erros:', errosDetalhes)
            // Mostrar primeiros 10 erros no alerta
            const primeirosErros = errosDetalhes.slice(0, 10)
            mensagem += `\n\nPrimeiros erros:\n${primeirosErros.join('\n')}`
            if (errosDetalhes.length > 10) {
              mensagem += `\n... e mais ${errosDetalhes.length - 10} erro(s)`
            }
          }
        }
        alert(mensagem)

      setImportando(false)
      setImportProgress({ atual: 0, total: 0, etapa: '' })

      // Recarregar dados
      loadInseminacoes()
      loadAlertasDG()
      setShowImportModal(false)
      setShowFieldMapping(false)
      setExcelHeaders([])
      setExcelData([])
    } catch (error) {
      setImportando(false)
      setImportProgress({ atual: 0, total: 0, etapa: '' })
      alert(`â�Å’ Erro ao processar arquivo Excel: ${error.message}`)
      console.error('Erro detalhado:', error)
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
      {/* Overlay de importaÃ§Ã£o em andamento */}
      {importando && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-pink-500 border-t-transparent mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Importando inseminaÃ§Ãµes...</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{importProgress.etapa}</p>
            {importProgress.total > 0 && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-pink-500 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (importProgress.atual / importProgress.total) * 100)}%` }}
                />
              </div>
            )}
            {importProgress.total > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {importProgress.atual} de {importProgress.total} linhas
              </p>
            )}
          </div>
        </div>
      )}

      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <HeartIcon className="w-8 h-8 text-pink-600" />
            InseminaÃ§Ã£o Artificial
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Registro de IA</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleLimparTudo}
            disabled={limandoTudo}
            title="ðÅ¸â€�â€™ Apenas desenvolvedores - Apagar todas as inseminaÃ§Ãµes (requer senha)"
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors shadow-md hover:shadow-lg"
          >
            <TrashIcon className="w-5 h-5" />
            ðÅ¸â€�â€™ {limandoTudo ? 'Limpando...' : 'Limpar Tudo'}
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <DocumentArrowUpIcon className="w-5 h-5" />
            Importar Excel
          </button>
          <button
            onClick={() => setShowImportTextoModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ðÅ¸â€œ�
            Importar Texto
          </button>
          <button
            onClick={corrigirResultadoP}
            disabled={corrigindoP}
            title="Corrige registros com resultado 'P' para 'Prenha' (apÃ³s importaÃ§Ã£o)"
            className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
          >
            {corrigindoP ? '...' : 'ðÅ¸â€�§'}
            Corrigir Pââ€ â€™Prenha
          </button>
          <label className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 cursor-pointer disabled:opacity-50 transition-colors">
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={corrigirTourosExcel} disabled={corrigindoTouros} />
            {corrigindoTouros ? '...' : 'ðÅ¸�â€š'}
            Corrigir Touros (Excel)
          </label>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Nova InseminaÃ§Ã£o
          </button>
        </div>
      </div>

      {/* Campo de Busca RÃ¡pida de Animal */}
      <div className="bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 rounded-xl shadow-lg p-6 border-2 border-pink-200 dark:border-pink-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-pink-600 rounded-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Buscar Animal</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Digite a SÃ©rie e RG para encontrar uma fÃªmea</p>
          </div>
        </div>
        
        <div className="relative">
          <input
            type="text"
            value={formData.animalSerieRG}
            onChange={(e) => {
              const valor = e.target.value
              setFormData({...formData, animalSerieRG: valor, animalId: ''})
              setAnimalEncontrado(null)
              if (valor.trim().length >= 3) {
                clearTimeout(window.buscaAnimalTimeout)
                window.buscaAnimalTimeout = setTimeout(() => {
                  buscarAnimalPorSerieRG(valor)
                }, 500)
              } else if (valor.trim() === '') {
                setAnimalEncontrado(null)
                setFormData(prev => ({ ...prev, animalId: '' }))
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                buscarAnimalPorSerieRG(formData.animalSerieRG)
              }
            }}
            placeholder="Ex: CJCJ 17372, CJCJ17372 ou apenas 16588"
            className="w-full px-6 py-4 text-lg border-2 border-pink-300 dark:border-pink-700 rounded-xl focus:ring-4 focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white transition-all duration-200 shadow-md hover:shadow-lg"
          />
          {buscandoAnimal && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600"></div>
            </div>
          )}
        </div>

        {animalEncontrado && (
          <div className="mt-4 p-4 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border-2 border-green-400 dark:border-green-600 rounded-xl animate-bounce-in">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-600 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-green-800 dark:text-green-200 mb-2">âÅ“â€¦ Animal Encontrado!</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">IdentificaÃ§Ã£o</p>
                    <p className="font-bold text-gray-900 dark:text-white">{animalEncontrado.serie} {animalEncontrado.rg}</p>
                  </div>
                  {animalEncontrado.nome && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Nome</p>
                      <p className="font-bold text-gray-900 dark:text-white">{animalEncontrado.nome}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Sexo</p>
                    <p className="font-bold text-gray-900 dark:text-white">{animalEncontrado.sexo}</p>
                  </div>
                  {animalEncontrado.raca && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">RaÃ§a</p>
                      <p className="font-bold text-gray-900 dark:text-white">{animalEncontrado.raca}</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-4 w-full flex items-center justify-center gap-2 bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 font-bold"
                >
                  <PlusIcon className="w-5 h-5" />
                  Registrar InseminaÃ§Ã£o para este Animal
                </button>
              </div>
            </div>
          </div>
        )}

        {!animalEncontrado && formData.animalSerieRG && !buscandoAnimal && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-xl">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              ðÅ¸â€™¡ Digite pelo menos 3 caracteres e pressione Enter ou aguarde para buscar automaticamente
            </p>
          </div>
        )}
      </div>

      {/* EstatÃ­sticas de IA */}
      <IAStatistics />

      {/* Alertas de DG */}
      {alertasDG.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded-lg">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mr-3 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                âÅ¡ ï¸� Alertas de DiagnÃ³stico de GestaÃ§Ã£o (DG)
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                {alertasDG.length} fÃªmea(s) precisam realizar DG (30 dias apÃ³s a IA)
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {alertasDG.slice(0, 5).map((alerta, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded border border-yellow-200 dark:border-yellow-800">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {alerta.animal_tatuagem || `${alerta.animal_serie} ${alerta.animal_rg}`}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          IA realizada em {new Date(alerta.data_inseminacao).toLocaleDateString('pt-BR')} - 
                          {alerta.dias_apos_ia} dias atrÃ¡s
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full text-xs font-medium">
                        {alerta.dias_apos_ia} dias
                      </span>
                    </div>
                  </div>
                ))}
                {alertasDG.length > 5 && (
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 text-center pt-2">
                    + {alertasDG.length - 5} mais...
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FormulÃ¡rio de Nova InseminaÃ§Ã£o */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Nova InseminaÃ§Ã£o Artificial
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Busca do Animal por SÃ©rie/RG */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  FÃªmea (SÃ©rie e RG) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.animalSerieRG}
                    onChange={(e) => {
                      const valor = e.target.value
                      setFormData({...formData, animalSerieRG: valor, animalId: ''})
                      setAnimalEncontrado(null)
                      // Debounce para buscar apÃ³s parar de digitar
                      if (valor.trim().length >= 3) {
                        clearTimeout(window.buscaAnimalTimeout)
                        window.buscaAnimalTimeout = setTimeout(() => {
                          buscarAnimalPorSerieRG(valor)
                        }, 500)
                      } else if (valor.trim() === '') {
                        setAnimalEncontrado(null)
                        setFormData(prev => ({ ...prev, animalId: '' }))
                      }
                    }}
                    onBlur={() => {
                      if (formData.animalSerieRG.trim() && !animalEncontrado) {
                        buscarAnimalPorSerieRG(formData.animalSerieRG)
                      }
                    }}
                    placeholder="Ex: CJCJ 17372, CJCJ17372 ou apenas 16588"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                  {buscandoAnimal && (
                    <div className="absolute right-3 top-2.5">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-pink-600"></div>
                    </div>
                  )}
                </div>
                {animalEncontrado ? (
                  <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      âÅ“â€¦ {animalEncontrado.serie} {animalEncontrado.rg}
                      {animalEncontrado.nome && ` - ${animalEncontrado.nome}`}
                      {animalEncontrado.raca && ` (${animalEncontrado.raca})`}
                    </p>
                  </div>
                ) : formData.animalSerieRG.trim() && !buscandoAnimal ? (
                  <p className="text-xs text-red-500 mt-1">
                    âÅ¡ ï¸� Digite a sÃ©rie e RG da fÃªmea (ex: CJCJ 17372)
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    Digite a sÃ©rie e RG da fÃªmea para buscar no banco de dados
                  </p>
                )}
                <input type="hidden" value={formData.animalId} required />
              </div>

              {/* SeleÃ§Ã£o do SÃªmen */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  SÃªmen DisponÃ­vel (Estoque) *
                </label>
                <select
                  value={formData.semenId}
                  onChange={(e) => {
                    const selectedId = e.target.value
                    const selected = semenStock.find(s => s.id.toString() === selectedId)
                    setSemenSelecionado(selected || null)
                    setFormData({...formData, semenId: selectedId})
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="">Selecione um sÃªmen do estoque</option>
                  {semenStock.map(semen => (
                    <option key={semen.id} value={semen.id}>
                      {semen.nomeTouro} {semen.rgTouro ? `(RG: ${semen.rgTouro})` : ''} - {semen.dosesDisponiveis} doses
                    </option>
                  ))}
                </select>
                {semenSelecionado && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                    <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
                      ðÅ¸â€œâ€¹ Dados do Reprodutor:
                    </p>
                    <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                      <p><strong>Touro:</strong> {semenSelecionado.nomeTouro}</p>
                      {semenSelecionado.rgTouro && <p><strong>RG:</strong> {semenSelecionado.rgTouro}</p>}
                      {semenSelecionado.raca && <p><strong>RaÃ§a:</strong> {semenSelecionado.raca}</p>}
                      {semenSelecionado.origem && <p><strong>Origem:</strong> {semenSelecionado.origem}</p>}
                      {semenSelecionado.linhagem && <p><strong>Linha:</strong> {semenSelecionado.linhagem}</p>}
                      {semenSelecionado.localizacao && <p><strong>LocalizaÃ§Ã£o:</strong> {semenSelecionado.localizacao}</p>}
                      {semenSelecionado.certificado && <p><strong>Certificado:</strong> {semenSelecionado.certificado}</p>}
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {semenStock.length} touro(s) com sÃªmen disponÃ­vel em estoque
                </p>
              </div>

              {/* Data da InseminaÃ§Ã£o */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data da InseminaÃ§Ã£o *
                </label>
                <input
                  type="date"
                  value={formData.dataInseminacao}
                  onChange={(e) => setFormData({...formData, dataInseminacao: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              {/* TÃ©cnico ResponsÃ¡vel */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  TÃ©cnico ResponsÃ¡vel *
                </label>
                <input
                  type="text"
                  value={formData.tecnico}
                  onChange={(e) => setFormData({...formData, tecnico: e.target.value})}
                  placeholder="Nome do tÃ©cnico"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              {/* Protocolo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Protocolo Utilizado
                </label>
                <select
                  value={formData.protocolo}
                  onChange={(e) => setFormData({...formData, protocolo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Selecione um protocolo</option>
                  <option value="IATF">IATF - InseminaÃ§Ã£o Artificial em Tempo Fixo</option>
                  <option value="Cio Natural">Cio Natural</option>
                  <option value="SincronizaÃ§Ã£o">SincronizaÃ§Ã£o de Cio</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              {/* Custo por Dose */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custo por Dose (R$)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.custoDose}
                    onChange={(e) => {
                      const novoValor = parseFloat(e.target.value) || 0
                      setFormData({...formData, custoDose: novoValor})
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const novoPadrao = parseFloat(formData.custoDose) || 18.00
                      setCustoDosePadrao(novoPadrao)
                      localStorage.setItem('custo_dose_ia', novoPadrao.toString())
                      alert(`âÅ“â€¦ Valor padrÃ£o atualizado para R$ ${novoPadrao.toFixed(2)}`)
                    }}
                    className="px-3 py-2 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
                    title="Salvar como padrÃ£o"
                  >
                    Salvar PadrÃ£o
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Valor padrÃ£o: R$ {custoDosePadrao.toFixed(2)} por dose
                </p>
              </div>

              {/* Status de GestaÃ§Ã£o */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status de GestaÃ§Ã£o
                </label>
                <select
                  value={formData.statusGestacao}
                  onChange={(e) => setFormData({...formData, statusGestacao: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Aguardando DG</option>
                  <option value="prenha">Prenha</option>
                  <option value="nÃ£o prenha">NÃ£o Prenha</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Se confirmar prenhez, a gestaÃ§Ã£o serÃ¡ vinculada automaticamente
                </p>
              </div>

              {/* ObservaÃ§Ãµes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ObservaÃ§Ãµes
                </label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  placeholder="ObservaÃ§Ãµes sobre a inseminaÃ§Ã£o..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* BotÃµes */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-600">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
              >
                Registrar InseminaÃ§Ã£o
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EstatÃ­sticas */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <HeartIcon className="h-6 w-6 text-pink-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Total de IAs
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {inseminacoes.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CalendarIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Este MÃªs
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {inseminacoes.filter(ia => {
                        const iaDate = new Date(ia.data)
                        const now = new Date()
                        return iaDate.getMonth() === now.getMonth() && iaDate.getFullYear() === now.getFullYear()
                      }).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Animais Inseminados
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {new Set(inseminacoes.map(ia => ia.animalId)).size}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">ðÅ¸§¬</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      SÃªmen DisponÃ­vel
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {semenStock.reduce((total, semen) => total + parseInt(semen.dosesDisponiveis || 0), 0)} doses
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Custo Total IAs
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      R$ {inseminacoes.reduce((total, ia) => total + parseFloat(ia.custo_dose || ia.custo_valor || 18.00), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Carregando dados...</div>
        </div>
      ) : inseminacoes.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-12 text-center">
          <HeartIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Nenhuma inseminaÃ§Ã£o registrada
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Comece registrando a primeira inseminaÃ§Ã£o artificial
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700"
          >
            <PlusIcon className="w-5 h-5" />
            Adicionar InseminaÃ§Ã£o
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              HistÃ³rico de InseminaÃ§Ãµes ({inseminacoes.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Animal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Touro / SÃ©rie / RG
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Custo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    AÃ§Ãµes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {inseminacoes.map((item) => {
                  const dataIA = item.data_ia || item.data_inseminacao || item.data
                  const diasDesdeIA = dataIA ? Math.floor((new Date() - new Date(dataIA)) / (1000 * 60 * 60 * 24)) : 0
                  const ehPrenha = /pren/i.test(item.status_gestacao || item.resultado_dg || '')
                  const maisDe4Meses = diasDesdeIA > 120
                  const invalida = item.valida === false || (maisDe4Meses && !ehPrenha)
                  return (
                  <tr key={item.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${invalida ? 'opacity-60 bg-gray-50 dark:bg-gray-800/50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <HeartIcon className="h-5 w-5 text-pink-500 mr-2" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {`${(item.animal_serie || item.serie || '')} ${(item.animal_rg || item.rg || '')}`.trim() || '-'}
                            </span>
                            {invalida && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                InvÃ¡lida
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {item.animal_nome || item.animal_tatuagem || item.animal || '-'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        <div className="font-semibold text-base mb-1">
                          {item.touro_nome || item.nome_touro || item.touro || '-'}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                          {item.serie_touro && (
                            <div>
                              <span className="font-medium">SÃ©rie:</span> {item.serie_touro}
                            </div>
                          )}
                          {item.rg_touro && (
                            <div>
                              <span className="font-medium">RG:</span> {item.rg_touro}
                            </div>
                          )}
                          {!item.serie_touro && !item.rg_touro && (
                            <div className="text-gray-400 italic">SÃ©rie/RG nÃ£o informado</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900 dark:text-white">
                        <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                        {item.data_ia || item.data_inseminacao || item.data ? new Date(item.data_ia || item.data_inseminacao || item.data).toLocaleDateString('pt-BR') : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        /pren/i.test(item.status_gestacao || item.resultado_dg || '') ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        /vazia/i.test(item.status_gestacao || item.resultado_dg || '') ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' :
                        'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                      }`}>
                        {item.status_gestacao || item.resultado_dg || 'Pendente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        R$ {(item.custo_dose || item.custo_valor || 18.00).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                          title="Editar"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400"
                          title="Excluir"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de ImportaÃ§Ã£o Excel */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
              onClick={() => {
                setShowImportModal(false)
                setShowFieldMapping(false)
                setExcelHeaders([])
                setExcelData([])
              }}
            ></div>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {showFieldMapping ? 'Mapear Campos do Excel' : 'Importar InseminaÃ§Ãµes do Excel'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowImportModal(false)
                      setShowFieldMapping(false)
                      setExcelHeaders([])
                      setExcelData([])
                    }}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {!showFieldMapping ? (
                  <div className="space-y-4">
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-900/50">
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-2">Modo de importaÃ§Ã£o</p>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="modoImportacaoIA"
                            checked={modoImportacaoIA === 'adicionar'}
                            onChange={() => setModoImportacaoIA('adicionar')}
                            className="rounded-full"
                          />
                          <span className="text-sm text-amber-800 dark:text-amber-100">Adicionar novas</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="modoImportacaoIA"
                            checked={modoImportacaoIA === 'atualizar'}
                            onChange={() => setModoImportacaoIA('atualizar')}
                            className="rounded-full"
                          />
                          <span className="text-sm text-amber-800 dark:text-amber-100">Atualizar IA</span>
                        </label>
                      </div>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                        {modoImportacaoIA === 'atualizar' 
                          ? 'Se o animal jÃ¡ tiver IA na mesma data, atualiza (touro, etc). SenÃ£o, adiciona.'
                          : 'Adiciona novas IAs. Se o animal jÃ¡ tiver IA na mesma data, cria outra.'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Arquivo Excel (.xlsx, .xls)
                      </label>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleExcelFileSelect}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Selecione o arquivo Excel. VocÃª poderÃ¡ escolher quais campos importar na prÃ³xima etapa.
                      </p>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                        ðÅ¸â€™¡ InformaÃ§Ãµes
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        ApÃ³s selecionar o arquivo, vocÃª poderÃ¡ escolher quais colunas do Excel mapear para cada campo do sistema. 
                        Os campos obrigatÃ³rios sÃ£o <strong>SÃ©rie</strong> e <strong>RG</strong>.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                      <p className="text-sm text-green-700 dark:text-green-300">
                        âÅ“â€¦ Arquivo carregado com sucesso! {excelHeaders.length} coluna(s) detectada(s). 
                        Modo: <strong>{modoImportacaoIA === 'atualizar' ? 'Atualizar IA' : 'Adicionar novas'}</strong>. Selecione quais campos importar:
                      </p>
                    </div>

                    <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left border-b">Campo do Sistema</th>
                            <th className="px-4 py-2 text-left border-b">Importar?</th>
                            <th className="px-4 py-2 text-left border-b">Coluna do Excel</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {/* Campos bÃ¡sicos */}
                          <tr className="bg-gray-50 dark:bg-gray-800">
                            <td colSpan="3" className="px-4 py-2 font-semibold text-gray-700 dark:text-gray-300">
                              InformaÃ§Ãµes do Animal
                            </td>
                          </tr>
                          {[
                            { key: 'serie', label: 'SÃ©rie *', required: true },
                            { key: 'rg', label: 'RG *', required: true },
                            { key: 'local', label: 'Local', required: false },
                            { key: 'observacao', label: 'ObservaÃ§Ã£o', required: false }
                          ].map(field => (
                            <tr key={field.key} className={field.required ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}>
                              <td className="px-4 py-2">
                                {field.label}
                              </td>
                              <td className="px-4 py-2">
                                <input
                                  type="checkbox"
                                  checked={fieldMapping[field.key].enabled}
                                  onChange={(e) => {
                                    if (field.required && !e.target.checked) {
                                      alert('Este campo Ã© obrigatÃ³rio!')
                                      return
                                    }
                                    setFieldMapping(prev => ({
                                      ...prev,
                                      [field.key]: { ...prev[field.key], enabled: e.target.checked }
                                    }))
                                  }}
                                  className="rounded"
                                  disabled={field.required}
                                />
                              </td>
                              <td className="px-4 py-2">
                                <select
                                  value={fieldMapping[field.key].source}
                                  onChange={(e) => {
                                    setFieldMapping(prev => ({
                                      ...prev,
                                      [field.key]: { ...prev[field.key], source: e.target.value }
                                    }))
                                  }}
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                                  disabled={!fieldMapping[field.key].enabled}
                                >
                                  <option value="">-- Selecione --</option>
                                  {excelHeaders.map(header => {
                                    const optValue = excelHeaders.filter(h => h.name === header.name).length > 1
                                      ? `${header.name}|${header.index}`
                                      : header.name
                                    return (
                                      <option key={`${header.name}-${header.index}`} value={optValue}>
                                        {header.name}{excelHeaders.filter(h => h.name === header.name).length > 1 ? ` (col. ${header.index + 1})` : ''}
                                      </option>
                                    )
                                  })}
                                </select>
                              </td>
                            </tr>
                          ))}

                          {/* 1Âª IA */}
                          {[1, 2, 3].map(numIA => (
                            <React.Fragment key={numIA}>
                              <tr className="bg-gray-50 dark:bg-gray-800">
                                <td colSpan="3" className="px-4 py-2 font-semibold text-gray-700 dark:text-gray-300">
                                  {numIA}Âª InseminaÃ§Ã£o Artificial
                                </td>
                              </tr>
                              {[
                                { key: `touro${numIA}`, label: `Touro ${numIA}Âª IA` },
                                { key: `serieTouro${numIA}`, label: `SÃ©rie Touro ${numIA}Âª` },
                                { key: `rgTouro${numIA}`, label: `RG Touro ${numIA}Âª` },
                                { key: `dataIA${numIA}`, label: `Data IA ${numIA}Âª` },
                                { key: `dataDG${numIA}`, label: `Data DG ${numIA}Âª` },
                                { key: `result${numIA}`, label: `Resultado ${numIA}Âª` }
                              ].map(field => (
                                <tr key={field.key}>
                                  <td className="px-4 py-2 pl-6">{field.label}</td>
                                  <td className="px-4 py-2">
                                    <input
                                      type="checkbox"
                                      checked={fieldMapping[field.key].enabled}
                                      onChange={(e) => {
                                        setFieldMapping(prev => ({
                                          ...prev,
                                          [field.key]: { ...prev[field.key], enabled: e.target.checked }
                                        }))
                                      }}
                                      className="rounded"
                                    />
                                  </td>
                                  <td className="px-4 py-2">
                                    <select
                                      value={fieldMapping[field.key].source}
                                      onChange={(e) => {
                                        setFieldMapping(prev => ({
                                          ...prev,
                                          [field.key]: { ...prev[field.key], source: e.target.value }
                                        }))
                                      }}
                                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                                      disabled={!fieldMapping[field.key].enabled}
                                    >
                                      <option value="">-- Selecione --</option>
                                      {excelHeaders.map(header => {
                                        const optValue = excelHeaders.filter(h => h.name === header.name).length > 1
                                          ? `${header.name}|${header.index}`
                                          : header.name
                                        return (
                                          <option key={`${header.name}-${header.index}`} value={optValue}>
                                            {header.name}{excelHeaders.filter(h => h.name === header.name).length > 1 ? ` (col. ${header.index + 1})` : ''}
                                          </option>
                                        )
                                      })}
                                    </select>
                                  </td>
                                </tr>
                              ))}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                {showFieldMapping && (
                  <button
                    onClick={processImportWithMapping}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:w-auto sm:text-sm"
                  >
                    Importar Dados
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowImportModal(false)
                    setShowFieldMapping(false)
                    setExcelHeaders([])
                    setExcelData([])
                  }}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {showFieldMapping ? 'Voltar' : 'Fechar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de ImportaÃ§Ã£o via Texto */}
      <ImportarTextoInseminacoes
        isOpen={showImportTextoModal}
        onClose={() => setShowImportTextoModal(false)}
        onImportComplete={(resultados) => {
          console.log('ImportaÃ§Ã£o concluÃ­da:', resultados);
          // Recarregar inseminaÃ§Ãµes
          loadInseminacoes();
          loadAnimals();
        }}
      />
    </div>
  )
}

