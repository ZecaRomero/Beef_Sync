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
      // Carregar custo padrão do localStorage
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
        alert(`✅ Corrigidos: ${data.atualizados?.status_gestacao ?? 0} status_gestacao, ${data.atualizados?.resultado_dg ?? 0} resultado_dg`)
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
    if (!confirm('⚠️ ATENÇÃO: Isso apagará TODAS as inseminações do banco. Deseja continuar?')) return
    setLimandoTudo(true)
    try {
      const r = await fetch('/api/inseminacoes?todos=true', { method: 'DELETE' })
      const data = await r.json().catch(() => ({}))
      if (r.ok && data.success) {
        alert(`✅ ${data.count ?? 0} inseminação(ões) removida(s). Você pode importar novamente.`)
        loadInseminacoes()
        loadAlertasDG()
      } else {
        throw new Error(data.error || data.details || `HTTP ${r.status}`)
      }
    } catch (e) {
      alert('Erro ao limpar: ' + (e.message || 'Falha na requisição'))
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
        alert(`✅ ${data.corrigidos ?? 0} touro(s) corrigido(s) no banco.`)
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
      // Tentar carregar do banco de dados primeiro
      const response = await fetch('/api/inseminacoes')
      if (response.ok) {
        const data = await response.json()
        setInseminacoes(data.data || [])
      } else {
        // Fallback para localStorage
        if (typeof window !== 'undefined') {
          const savedData = localStorage.getItem('inseminacoes')
          if (savedData) {
            setInseminacoes(JSON.parse(savedData))
          } else {
            setInseminacoes([])
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      // Fallback para localStorage
      if (typeof window !== 'undefined') {
        const savedData = localStorage.getItem('inseminacoes')
        if (savedData) {
          setInseminacoes(JSON.parse(savedData))
        } else {
          setInseminacoes([])
        }
      }
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
        
        // Agrupar por touro (nome + RG) e somar doses disponíveis
        // Mas manter o ID do primeiro registro encontrado para cada touro
        const tourosMap = new Map()
        
        allSemen.forEach(semen => {
          const nomeTouro = (semen.nomeTouro || semen.nome_touro || '').trim()
          const rgTouro = (semen.rgTouro || semen.rg_touro || '').trim()
          const key = `${nomeTouro}|${rgTouro}`
          
          // Somar apenas doses disponíveis de entradas
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
        
        // Converter para array e filtrar apenas os que têm doses disponíveis
        const availableSemen = Array.from(tourosMap.values()).filter(touro => 
          touro.dosesDisponiveis > 0 && touro.status === 'disponivel'
        )
        
        setSemenStock(availableSemen)
      }
    } catch (error) {
      console.error('Erro ao carregar estoque de sêmen:', error)
      setSemenStock([])
    }
  }

  // Buscar animal por série/RG
  const buscarAnimalPorSerieRG = async (serieRG) => {
    if (!serieRG || serieRG.trim() === '') {
      setAnimalEncontrado(null)
      setFormData(prev => ({ ...prev, animalId: '', animalSerieRG: '' }))
      return
    }

    setBuscandoAnimal(true)
    try {
      // Extrair série e RG da entrada
      // Formato esperado: "CJCJ 17372" ou "CJCJ17372" ou "CJCJ-17372"
      let serie = ''
      let rg = ''
      
      const partes = serieRG.trim().split(/[\s\-]+/)
      if (partes.length >= 2) {
        serie = partes[0].toUpperCase().trim()
        rg = partes.slice(1).join(' ').trim()
      } else {
        // Tentar extrair série do início (2-5 letras) e o resto é RG
        const match = serieRG.match(/^([A-Z]{2,5})(\d+.*)$/i)
        if (match) {
          serie = match[1].toUpperCase()
          rg = match[2].trim()
        } else {
          // Se não conseguir separar, tentar buscar diretamente
          serie = serieRG.trim().toUpperCase()
        }
      }

      let animais = []

      // Estratégia 1: Busca exata com série e RG
      if (serie && rg) {
        const params1 = new URLSearchParams()
        params1.append('serie', serie)
        params1.append('rg', rg)
        
        const response1 = await fetch(`/api/animals?${params1.toString()}`)
        if (response1.ok) {
          const data1 = await response1.json()
          animais = (data1.data || data1.animals || []).filter(a => 
            a.sexo === 'Fêmea' || a.sexo === 'F'
          )
        }
      }

      // Estratégia 2: Se não encontrou, tentar só com série
      if (animais.length === 0 && serie) {
        const params2 = new URLSearchParams()
        params2.append('serie', serie)
        
        const response2 = await fetch(`/api/animals?${params2.toString()}`)
        if (response2.ok) {
          const data2 = await response2.json()
          const animaisPorSerie = data2.data || data2.animals || []
          
          if (rg) {
            animais = animaisPorSerie.filter(a => {
              const rgAnimal = a.rg?.toString().trim()
              const rgBuscado = rg.toString().trim()
              return (a.sexo === 'Fêmea' || a.sexo === 'F') && (
                rgAnimal === rgBuscado || 
                parseInt(rgAnimal) === parseInt(rgBuscado)
              )
            })
          } else {
            animais = animaisPorSerie.filter(a => a.sexo === 'Fêmea' || a.sexo === 'F')
          }
        }
      }

      // Estratégia 3: Se ainda não encontrou e tem RG, tentar só com RG
      if (animais.length === 0 && rg) {
        const params3 = new URLSearchParams()
        params3.append('rg', rg)
        
        const response3 = await fetch(`/api/animals?${params3.toString()}`)
        if (response3.ok) {
          const data3 = await response3.json()
          const animaisPorRG = data3.data || data3.animals || []
          
          if (serie) {
            animais = animaisPorRG.filter(a => 
              (a.sexo === 'Fêmea' || a.sexo === 'F') &&
              a.serie?.toUpperCase().trim() === serie.toUpperCase().trim()
            )
          } else {
            animais = animaisPorRG.filter(a => a.sexo === 'Fêmea' || a.sexo === 'F')
          }
        }
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
        // Múltiplos encontrados - tentar encontrar o exato
        const animalExato = animais.find(a => {
          const rgAnimal = a.rg?.toString().trim()
          const rgBuscado = rg.toString().trim()
          return rgAnimal === rgBuscado || parseInt(rgAnimal) === parseInt(rgBuscado)
        })
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
          alert(`⚠️ Múltiplas fêmeas encontradas. Seja mais específico com o RG.`)
        }
      } else {
        setAnimalEncontrado(null)
        setFormData(prev => ({ ...prev, animalId: '' }))
        alert(`❌ Fêmea não encontrada: ${serieRG}`)
      }
    } catch (error) {
      console.error('Erro ao buscar animal:', error)
      setAnimalEncontrado(null)
      setFormData(prev => ({ ...prev, animalId: '' }))
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
        // Filtrar apenas fêmeas em idade reprodutiva
        const femaleAnimals = (Array.isArray(data) ? data : []).filter(animal => 
          animal.sexo === 'Fêmea' || animal.sexo === 'F'
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
    
    // Validações
    if (!formData.animalId) {
      alert('Selecione um animal')
      return
    }
    
    if (!formData.semenId) {
      alert('Selecione um sêmen disponível')
      return
    }
    
    if (!formData.tecnico.trim()) {
      alert('Informe o técnico responsável')
      return
    }

    // Verificar se o sêmen ainda está disponível
    if (!semenSelecionado || parseInt(semenSelecionado.dosesDisponiveis) <= 0) {
      alert('Sêmen selecionado não está mais disponível')
      return
    }

    try {
      // Validar se animal foi encontrado
      if (!formData.animalId || !animalEncontrado) {
        alert('⚠️ Por favor, busque e selecione uma fêmea válida pelo Série e RG')
        return
      }

      const selectedAnimal = animalEncontrado
      
      // Validar se sêmen foi selecionado
      if (!formData.semenId || !semenSelecionado) {
        alert('⚠️ Por favor, selecione um sêmen disponível do estoque')
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
        throw new Error(errorData.error || 'Erro ao salvar inseminação')
      }

      const result = await response.json()
      const newInseminacao = result.data

      // Registrar saída do sêmen (usar 1 dose)
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
          observacoes: `Inseminação artificial - ${formData.tecnico}`,
          nomeTouro: selectedSemen.nomeTouro || selectedSemen.nome_touro,
          localizacao: selectedSemen.localizacao
        })
      })

      if (saidaResponse.ok) {
        alert('Inseminação registrada com sucesso!')
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
        
        // Se status_gestacao for 'prenha', alertar sobre vinculação com nascimentos
        if (formData.statusGestacao === 'prenha' || formData.statusGestacao === 'Prenha') {
          alert('✅ Gestação confirmada! A gestação foi vinculada automaticamente. O parto está previsto para aproximadamente 9 meses após a IA.')
        } else if (!formData.statusGestacao) {
          alert('⚠️ Lembrete: Em 30 dias após a IA, realize o Diagnóstico de Gestação (DG). O sistema gerará um alerta automático.')
        }
      } else {
        alert('Erro ao registrar saída do sêmen')
      }
    } catch (error) {
      console.error('Erro ao registrar inseminação:', error)
      alert('Erro ao registrar inseminação')
    }
  }

  // Função auxiliar para converter data
  const converterData = (data) => {
    if (!data) return null
    
    // Se for número (serial do Excel), converter
    if (typeof data === 'number') {
      try {
        const excelEpoch = new Date(1899, 11, 30)
        const date = new Date(excelEpoch.getTime() + data * 24 * 60 * 60 * 1000)
        if (isNaN(date.getTime())) return null
        const isoDate = date.toISOString().split('T')[0]
        // Validar se a data é válida (não muito antiga ou futura)
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
      
      // Tentar diferentes formatos de data
      const dateParts = dataStr.split(/[\/\-\.]/)
      if (dateParts.length === 3) {
        let dia = dateParts[0].trim()
        let mes = dateParts[1].trim()
        let ano = dateParts[2].trim()
        
        // Validar que são números
        const diaNum = parseInt(dia)
        const mesNum = parseInt(mes)
        const anoNum = parseInt(ano)
        
        if (isNaN(diaNum) || isNaN(mesNum) || isNaN(anoNum)) return null
        
        // Se o ano tem 2 dígitos, assumir 20XX
        if (ano.length === 2) {
          ano = anoNum > 50 ? `19${ano}` : `20${ano}`
        }
        
        // Validar valores
        if (diaNum < 1 || diaNum > 31) return null
        if (mesNum < 1 || mesNum > 12) return null
        if (ano.length !== 4) return null
        
        const anoFinal = parseInt(ano)
        if (anoFinal < 1900 || anoFinal > 2100) return null
        
        // Se o ano tem 4 dígitos e está no início (formato YYYY-MM-DD)
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
          // Validar se a data é válida
          if (isoDate < '1900-01-01' || isoDate > '2100-12-31') return null
          return isoDate
        }
      } catch (e) {
        return null
      }
    }
    
    return null
  }

  // Função auxiliar para normalizar resultado do DG
  const normalizarResultadoDG = (resultado) => {
    if (!resultado) return null
    const resultadoLower = resultado.toString().toLowerCase().trim()
    if (resultadoLower.includes('prenha') || resultadoLower === 'prenha' || resultadoLower === 'prenhez' || resultadoLower === 'p' || resultadoLower === 'sim') {
      return 'prenha'
    } else if (resultadoLower.includes('não prenha') || resultadoLower.includes('nao prenha') || resultadoLower === 'não prenha' || resultadoLower === 'nao prenha' || resultadoLower === 'vazia' || resultadoLower === 'np' || resultadoLower === 'não' || resultadoLower === 'nao' || resultadoLower === 'n') {
      return 'não prenha'
    }
    return null
  }

  // Função para detectar automaticamente campos do Excel
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
    
    // Campos básicos (animal) - primeiras colunas
    newMapping.serie.source = findColumnIndex(['SÉRIE', 'Série', 'serie', 'SERIE']) || ''
    newMapping.rg.source = findColumnIndex(['RG', 'rg']) || ''
    newMapping.local.source = findColumnIndex(['LOCAL', 'Local', 'local']) || ''
    
    // 1ª IA - coluna TOURO deve conter NOME (nunca SÉRIE ou RG) - ACASALAMENTO é o nome principal no Excel
    const touro1Col = findColumnIndexByHeader(['ACASALAMENTO', 'ACASALAMENTOS', 'TOURO_1ª I.A', 'TOURO 1ª IA', 'TOURO_1ª IA', 'TOURO 1ª I.A', 'Touro_1ª I.A', 'TOURO 1ª', '1ª TOURO', 'TOURO', 'NOME TOURO', 'REPRODUTOR'], 0, ['SÉRIE', 'RG'])
    newMapping.touro1.source = touro1Col ? (headers.filter(h => h.name === touro1Col.name).length > 1 ? `${touro1Col.name}|${touro1Col.index}` : touro1Col.name) : ''
    const idxDepoisTouro1 = touro1Col ? touro1Col.index + 1 : 0
    const serieTouro1Col = findColumnIndexByHeader(['SÉRIE TOURO 1ª', 'SERIE TOURO 1ª', 'SÉRIE', 'Série'], idxDepoisTouro1)
    const rgTouro1Col = findColumnIndexByHeader(['RG TOURO 1ª', 'RG TOURO 1ª', 'RG', 'rg'], idxDepoisTouro1)
    newMapping.serieTouro1.source = serieTouro1Col ? `${serieTouro1Col.name}|${serieTouro1Col.index}` : ''
    newMapping.rgTouro1.source = rgTouro1Col ? `${rgTouro1Col.name}|${rgTouro1Col.index}` : ''
    newMapping.dataIA1.source = findColumnIndex(['DATA I.A.', 'DATA I.A', 'Data I.A.', 'Data I.A', 'data i.a', 'DATA IA', 'DATA IA 1ª', 'DATA IA 1', 'DATA I.A 1ª']) || ''
    newMapping.dataDG1.source = findColumnIndex(['DATA DG 1ª IA', 'Data DG 1ª IA', 'data dg 1ª ia', 'DATA DG 1ªIA', 'DATA DG 1ª IA', 'DATA DG', 'Data DG', 'data dg', 'DATA DG 1ª', 'DATA DG 1']) || ''
    
    // 2ª IA
    newMapping.touro2.source = findColumnIndex(['TOURO_2ª I.A', 'TOURO_2ª I.A', 'Touro_2ª I.A', 'touro_2ª i.a', 'TOURO 2ª IA', 'TOURO_2ª IA', 'TOURO 2ª', 'Touro 2ª']) || ''
    const touro2Col = findColumnIndexByHeader(['TOURO_2ª I.A', 'TOURO 2ª IA', 'TOURO 2ª'])
    const idxDepoisTouro2 = touro2Col ? touro2Col.index + 1 : 0
    const serieTouro2Col = findColumnIndexByHeader(['SÉRIE TOURO 2ª', 'SERIE TOURO 2ª', 'SÉRIE', 'Série'], idxDepoisTouro2)
    const rgTouro2Col = findColumnIndexByHeader(['RG TOURO 2ª', 'RG TOURO 2ª', 'RG', 'rg'], idxDepoisTouro2)
    newMapping.serieTouro2.source = serieTouro2Col ? `${serieTouro2Col.name}|${serieTouro2Col.index}` : ''
    newMapping.rgTouro2.source = rgTouro2Col ? `${rgTouro2Col.name}|${rgTouro2Col.index}` : ''
    newMapping.dataIA2.source = findColumnIndex(['DATA 2ª I.A', 'Data 2ª I.A', 'data 2ª i.a', 'DATA 2ªIA', 'DATA 2ª I.A', 'DATA 2ª IA', 'DATA IA 2ª']) || ''
    newMapping.dataDG2.source = findColumnIndex(['DATA DG 2ª IA', 'Data DG 2ª IA', 'data dg 2ª ia', 'DATA DG 2ªIA', 'DATA DG 2ª IA', 'DATA DG 2ª', 'DATA DG 2']) || ''
    
    // 3ª IA
    newMapping.touro3.source = findColumnIndex(['TOURO_3ª I.A', 'TOURO_3ª I.A', 'Touro_3ª I.A', 'touro_3ª i.a', 'TOURO 3ª IA', 'TOURO_3ª IA', 'TOURO 3ª', 'Touro 3ª']) || ''
    const touro3Col = findColumnIndexByHeader(['TOURO_3ª I.A', 'TOURO 3ª IA', 'TOURO 3ª'])
    const idxDepoisTouro3 = touro3Col ? touro3Col.index + 1 : 0
    const serieTouro3Col = findColumnIndexByHeader(['SÉRIE TOURO 3ª', 'SERIE TOURO 3ª', 'SÉRIE', 'Série'], idxDepoisTouro3)
    const rgTouro3Col = findColumnIndexByHeader(['RG TOURO 3ª', 'RG TOURO 3ª', 'RG', 'rg'], idxDepoisTouro3)
    newMapping.serieTouro3.source = serieTouro3Col ? `${serieTouro3Col.name}|${serieTouro3Col.index}` : ''
    newMapping.rgTouro3.source = rgTouro3Col ? `${rgTouro3Col.name}|${rgTouro3Col.index}` : ''
    newMapping.dataIA3.source = findColumnIndex(['DATA 3ª I.A', 'Data 3ª I.A', 'data 3ª i.a', 'DATA 3ªIA', 'DATA 3ª I.A', 'DATA 3ª IA', 'DATA IA 3ª']) || ''
    newMapping.dataDG3.source = findColumnIndex(['DATA DG 3ª IA', 'Data DG 3ª IA', 'data dg 3ª ia', 'DATA DG 3ªIA', 'DATA DG 3ª IA', 'DATA DG 3ª', 'DATA DG 3']) || ''
    
    newMapping.observacao.source = findColumnIndex(['OBSERVAÇÃO', 'Observação', 'observacao', 'OBS', 'obs', 'OBSERVAÇÃO']) || ''

    // Encontrar Results
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

    if (resultColumns.length >= 1) {
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

    // Sempre habilitar campos obrigatórios
    newMapping.serie.enabled = true
    newMapping.rg.enabled = true

    return newMapping
  }

  // Função para ler arquivo Excel e preparar mapeamento
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
        
        // Ler primeiro como array para identificar posições das colunas
        const arrayData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })
        if (arrayData.length < 2) {
          alert('⚠️ Arquivo Excel deve ter pelo menos 2 linhas (cabeçalho + dados)')
          return
        }

        // Mapear cabeçalhos e suas posições
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
        alert(`❌ Erro ao ler arquivo Excel: ${error.message}`)
        console.error('Erro detalhado:', error)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  // Função para processar importação usando mapeamento escolhido
  const processImportWithMapping = async () => {
    try {
      if (!fieldMapping.serie.source || !fieldMapping.rg.source) {
        alert('⚠️ Campos obrigatórios (Série e RG) devem estar mapeados!')
        return
      }

      // Função auxiliar para encontrar índice do cabeçalho (compatível com variações de espaços/case)
      const findHeaderIndex = (source) => {
        if (!source) return -1
        const sourceNorm = String(source).trim().toUpperCase()
        const found = excelHeaders.findIndex(h => {
          const nameNorm = String(h?.name || '').trim().toUpperCase()
          return nameNorm === sourceNorm || nameNorm.includes(sourceNorm) || sourceNorm.includes(nameNorm)
        })
        return found
      }

      // Converter dados usando mapeamento (source pode ser "Nome" ou "Nome|índice" para colunas duplicadas)
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
        alert('⚠️ Arquivo Excel está vazio')
        return
      }

      // Carregar animais e sêmen uma vez
      const animaisResponse = await fetch('/api/animals')
      const animaisData = await animaisResponse.json()
      const animais = animaisData.animals || animaisData.data || []

      const semenResponse = await fetch('/api/semen')
      const semenData = await semenResponse.json()
      const semenList = semenData.data || semenData || []

      // Processar cada linha (cada linha = um animal com até 3 IAs)
      let sucesso = 0
      let erros = 0
      const errosDetalhes = []

        for (const row of jsonData) {
          try {
            // Mapear colunas do formato específico (agora usando os índices mapeados)
            const serie = (row.serie || '').toString().trim()
            const rg = (row.rg || '').toString().trim()
            const local = (row.local || '').toString().trim()
            const observacoes = (row.observacao || '').toString().trim()

            // Validar campos obrigatórios
            if (!serie || !rg) {
              erros++
              errosDetalhes.push(`Linha sem Série ou RG: ${serie || 'N/A'} ${rg || 'N/A'}`)
              continue
            }

            // Buscar animal (busca mais flexível)
            let animalEncontrado = animais.find(a => {
              const serieAnimal = (a.serie || '').toString().toUpperCase().trim()
              const rgAnimal = (a.rg || '').toString().trim()
              const serieBuscada = serie.toUpperCase().trim()
              const rgBuscado = rg.toString().trim()
              
              // Busca exata
              if (serieAnimal === serieBuscada && rgAnimal === rgBuscado) {
                return true
              }
              
              // Busca com conversão numérica do RG
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
              errosDetalhes.push(`Animal não encontrado: ${serie} ${rg}`)
              continue
            }

            // Validar se o animal é fêmea ANTES de processar inseminações
            const sexoAnimal = (animalEncontrado.sexo || '').toString().trim()
            if (sexoAnimal !== 'Fêmea' && sexoAnimal !== 'F' && sexoAnimal !== 'Femea') {
              erros++
              errosDetalhes.push(`❌ ERRO: Animal ${serie} ${rg} é ${sexoAnimal.toUpperCase()} - apenas FÊMEAS podem ser inseminadas. Remova este animal da planilha.`)
              continue
            }

            // Processar até 3 inseminações
            const inseminacoes = []

            // 1ª IA
            const touro1 = (row.touro1 || '').toString().trim()
            const serieTouro1 = (row.serieTouro1 || '').toString().trim()
            const rgTouro1 = (row.rgTouro1 || '').toString().trim()
            const dataIA1 = (row.dataIA1 || '').toString().trim()
            const dataDG1 = (row.dataDG1 || '').toString().trim()
            const result1 = (row.result1 || '').toString().trim()

            // Se tem data da IA, processar (mesmo que não tenha touro)
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

            // 2ª IA
            const touro2 = (row.touro2 || '').toString().trim()
            const serieTouro2 = (row.serieTouro2 || '').toString().trim()
            const rgTouro2 = (row.rgTouro2 || '').toString().trim()
            const dataIA2 = (row.dataIA2 || '').toString().trim()
            const dataDG2 = (row.dataDG2 || '').toString().trim()
            const result2 = (row.result2 || '').toString().trim()

            // Se tem data da IA, processar (mesmo que não tenha touro)
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

            // 3ª IA
            const touro3 = (row.touro3 || '').toString().trim()
            const serieTouro3 = (row.serieTouro3 || '').toString().trim()
            const rgTouro3 = (row.rgTouro3 || '').toString().trim()
            const dataIA3 = (row.dataIA3 || '').toString().trim()
            const dataDG3 = (row.dataDG3 || '').toString().trim()
            const result3 = (row.result3 || '').toString().trim()

            // Se tem data da IA, processar (mesmo que não tenha touro)
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

            // Se não tem nenhuma IA válida, pular (mas não é erro crítico se o animal existe)
            if (inseminacoes.length === 0) {
              // Não contar como erro, apenas informar
              console.log(`Animal ${serie} ${rg} sem dados de inseminação válidos`)
              continue
            }

            // Processar cada inseminação
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
                errosDetalhes.push(`IA ${ia.numero_ia} do animal ${serie} ${rg} - data inválida: ${ia.data_ia}`)
                continue
              }
              
              // Validar formato da data antes de enviar
              const dataTest = new Date(dataIAFormatada)
              if (isNaN(dataTest.getTime())) {
                erros++
                errosDetalhes.push(`IA ${ia.numero_ia} do animal ${serie} ${rg} - data inválida após conversão: ${dataIAFormatada}`)
                continue
              }
              
              let dataDGFormatada = ia.data_dg && ia.data_dg.toString().trim() ? converterData(ia.data_dg) : null
              // Validar data DG se foi fornecida
              if (dataDGFormatada && (dataDGFormatada === 'Invalid Date' || dataDGFormatada === '' || !dataDGFormatada)) {
                // Se data DG é inválida, usar null
                dataDGFormatada = null
              }
              
              const resultadoDGNormalizado = normalizarResultadoDG(ia.resultado_dg)

            // Buscar sêmen do touro
              let semenEncontrado = null
              let rgTouroExtraido = null
              let nomeTouroExtraido = null

              // Extrair RG do touro do nome se estiver embutido (ex: "NORTICO - CJCJ 15236")
              if (ia.touro) {
                const touroStr = ia.touro.toString().trim()
                // Procurar padrão "SÉRIE RG" no nome do touro
                const rgMatch = touroStr.match(/\b([A-Z]{2,5})\s+(\d+)\b/i)
                if (rgMatch && !ia.serie_touro && !ia.rg_touro) {
                  ia.serie_touro = rgMatch[1].toUpperCase()
                  ia.rg_touro = rgMatch[2]
                }
              }

              // Priorizar Série e RG do touro se fornecidos
              if (ia.serie_touro && ia.rg_touro) {
                const serieTouro = ia.serie_touro.toString().trim().toUpperCase()
                const rgTouro = ia.rg_touro.toString().trim()
                
                // Buscar pelo RG completo (Série + RG)
                const rgCompleto = `${serieTouro} ${rgTouro}`.trim()
                rgTouroExtraido = rgCompleto
                
                semenEncontrado = semenList.find(s => {
                  const rgSemen = (s.rgTouro || s.rg_touro || '').toString().trim()
                  const serieSemen = (s.serieTouro || s.serie_touro || '').toString().trim().toUpperCase()
                  
                  // Buscar por RG completo
                  if (rgSemen === rgCompleto || rgSemen === rgTouro) {
                    return true
                  }
                  
                  // Buscar por série + RG separados
                  if (serieSemen === serieTouro) {
                    const rgSemenNum = rgSemen.replace(/^[A-Z]{2,5}\s*/i, '').trim()
                    const rgBuscadoNum = rgTouro.toString().trim()
                    return rgSemenNum === rgBuscadoNum || 
                           parseInt(rgSemenNum) === parseInt(rgBuscadoNum)
                  }
                  
                  return false
                })
              } else if (ia.rg_touro) {
                // Se só tem RG, buscar pelo RG
                rgTouroExtraido = ia.rg_touro.toString().trim()
                semenEncontrado = semenList.find(s => {
                  const rgSemen = (s.rgTouro || s.rg_touro || '').toString().trim()
                  return rgSemen === rgTouroExtraido || 
                         rgSemen.includes(rgTouroExtraido) || 
                         rgTouroExtraido.includes(rgSemen) ||
                         rgSemen.replace(/\s/g, '') === rgTouroExtraido.replace(/\s/g, '')
                })
              }

              // Se não encontrou pelos campos específicos, tentar pelo nome do touro
              if (!semenEncontrado && ia.touro) {
                const touroStr = ia.touro.toString().trim()
                
                // Tentar extrair RG e nome do touro (formato pode ser "NOME TOURO RG12345" ou "RG12345 NOME TOURO")
                const rgMatch = touroStr.match(/\b([A-Z]{2,5}\s*\d+|\d+)\b/i)
                if (rgMatch && !rgTouroExtraido) {
                  rgTouroExtraido = rgMatch[1].trim()
                }
                
                // Nome do touro é o resto (remover o RG se encontrado)
                nomeTouroExtraido = touroStr.replace(/\b([A-Z]{2,5}\s*\d+|\d+)\b/gi, '').trim()

                // Buscar primeiro pelo RG do touro (se extraído do nome)
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

                // Se não encontrou pelo RG, buscar pelo nome
                if (!semenEncontrado && nomeTouroExtraido) {
                  semenEncontrado = semenList.find(s => {
                    const nomeTouro = (s.nomeTouro || s.nome_touro || '').toLowerCase().trim()
                    const touroBuscado = nomeTouroExtraido.toLowerCase().trim()
                    return nomeTouro.includes(touroBuscado) || 
                           touroBuscado.includes(nomeTouro) ||
                           nomeTouro === touroBuscado
                  })
                }

                // Se ainda não encontrou, tentar buscar pelo campo completo
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
                errosDetalhes.push(`Erro: Animal ${serie} ${rg} sem ID válido`)
                continue
              }

              if (!dataIAFormatada) {
                erros++
                errosDetalhes.push(`Erro: Data de IA inválida para ${ia.numero_ia}ª IA de ${serie} ${rg}`)
                continue
              }

              // Criar inseminação
              try {
                // Nome do touro: priorizar semen.nomeTouro quando encontrado; evitar usar só SÉRIE (ex: FGPA) como nome
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
                
                // Validação final antes de enviar
                if (!dadosEnvio.data_inseminacao || dadosEnvio.data_inseminacao === '' || dadosEnvio.data_inseminacao === 'Invalid Date') {
                  erros++
                  errosDetalhes.push(`IA ${ia.numero_ia} do animal ${serie} ${rg} - data inválida antes do envio`)
                  continue
                }
                
                const response = await fetch('/api/inseminacoes', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(dadosEnvio)
                })

                if (response.ok) {
                  sucesso++
                } else {
                  erros++
                  let errorMessage = 'Erro desconhecido'
                  try {
                    const errorData = await response.json()
                    errorMessage = errorData.error || errorData.message || errorData.details || 'Erro desconhecido'
                  } catch (parseError) {
                    errorMessage = `Erro HTTP ${response.status}: ${response.statusText}`
                  }
                  errosDetalhes.push(`Erro ao salvar ${ia.numero_ia}ª IA de ${serie} ${rg}: ${errorMessage}`)
                }
              } catch (fetchError) {
                erros++
                errosDetalhes.push(`Erro de rede ao salvar ${ia.numero_ia}ª IA de ${serie} ${rg}: ${fetchError.message || 'Erro desconhecido'}`)
              }
            }
          } catch (error) {
            erros++
            errosDetalhes.push(`Erro ao processar linha: ${error.message}`)
          }
        }

        // Mostrar resultado
        let mensagem = `✅ SUCESSO: ${sucesso} inseminação(ões) importada(s)!`
        
        if (erros > 0) {
          mensagem += `\n\n❌ ERROS ENCONTRADOS: ${erros}`
          mensagem += `\n\n📋 PRINCIPAIS CAUSAS DE ERRO:`
          mensagem += `\n• Animais MACHOS na planilha (apenas fêmeas podem ser inseminadas)`
          mensagem += `\n• Animais não encontrados no sistema`
          mensagem += `\n• Datas inválidas`
          mensagem += `\n\n💡 SOLUÇÃO: Revise a planilha e remova os animais problemáticos`
        }
        if (erros > 0) {
          mensagem += `\n⚠️ ${erros} erro(s) encontrado(s).`
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

      // Recarregar dados
      loadInseminacoes()
      loadAlertasDG()
      setShowImportModal(false)
      setShowFieldMapping(false)
      setExcelHeaders([])
      setExcelData([])
    } catch (error) {
      alert(`❌ Erro ao processar arquivo Excel: ${error.message}`)
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
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <HeartIcon className="w-8 h-8 text-pink-600" />
            Inseminação Artificial
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Registro de IA</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleLimparTudo}
            disabled={limandoTudo}
            title="Apagar todas as inseminações para importar novamente"
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            <TrashIcon className="w-5 h-5" />
            {limandoTudo ? 'Limpando...' : 'Limpar Tudo'}
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
            📝
            Importar Texto
          </button>
          <button
            onClick={corrigirResultadoP}
            disabled={corrigindoP}
            title="Corrige registros com resultado 'P' para 'Prenha' (após importação)"
            className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
          >
            {corrigindoP ? '...' : '🔧'}
            Corrigir P→Prenha
          </button>
          <label className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 cursor-pointer disabled:opacity-50 transition-colors">
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={corrigirTourosExcel} disabled={corrigindoTouros} />
            {corrigindoTouros ? '...' : '🐂'}
            Corrigir Touros (Excel)
          </label>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Nova Inseminação
          </button>
        </div>
      </div>

      {/* Estatísticas de IA */}
      <IAStatistics />

      {/* Alertas de DG */}
      {alertasDG.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded-lg">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mr-3 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                ⚠️ Alertas de Diagnóstico de Gestação (DG)
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                {alertasDG.length} fêmea(s) precisam realizar DG (30 dias após a IA)
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
                          {alerta.dias_apos_ia} dias atrás
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

      {/* Formulário de Nova Inseminação */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Nova Inseminação Artificial
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
              {/* Busca do Animal por Série/RG */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fêmea (Série e RG) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.animalSerieRG}
                    onChange={(e) => {
                      const valor = e.target.value
                      setFormData({...formData, animalSerieRG: valor, animalId: ''})
                      setAnimalEncontrado(null)
                      // Debounce para buscar após parar de digitar
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
                    placeholder="Ex: CJCJ 17372 ou CJCJ17372"
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
                      ✅ {animalEncontrado.serie} {animalEncontrado.rg}
                      {animalEncontrado.nome && ` - ${animalEncontrado.nome}`}
                      {animalEncontrado.raca && ` (${animalEncontrado.raca})`}
                    </p>
                  </div>
                ) : formData.animalSerieRG.trim() && !buscandoAnimal ? (
                  <p className="text-xs text-red-500 mt-1">
                    ⚠️ Digite a série e RG da fêmea (ex: CJCJ 17372)
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    Digite a série e RG da fêmea para buscar no banco de dados
                  </p>
                )}
                <input type="hidden" value={formData.animalId} required />
              </div>

              {/* Seleção do Sêmen */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sêmen Disponível (Estoque) *
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
                  <option value="">Selecione um sêmen do estoque</option>
                  {semenStock.map(semen => (
                    <option key={semen.id} value={semen.id}>
                      {semen.nomeTouro} {semen.rgTouro ? `(RG: ${semen.rgTouro})` : ''} - {semen.dosesDisponiveis} doses
                    </option>
                  ))}
                </select>
                {semenSelecionado && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                    <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
                      📋 Dados do Reprodutor:
                    </p>
                    <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                      <p><strong>Touro:</strong> {semenSelecionado.nomeTouro}</p>
                      {semenSelecionado.rgTouro && <p><strong>RG:</strong> {semenSelecionado.rgTouro}</p>}
                      {semenSelecionado.raca && <p><strong>Raça:</strong> {semenSelecionado.raca}</p>}
                      {semenSelecionado.origem && <p><strong>Origem:</strong> {semenSelecionado.origem}</p>}
                      {semenSelecionado.linhagem && <p><strong>Linha:</strong> {semenSelecionado.linhagem}</p>}
                      {semenSelecionado.localizacao && <p><strong>Localização:</strong> {semenSelecionado.localizacao}</p>}
                      {semenSelecionado.certificado && <p><strong>Certificado:</strong> {semenSelecionado.certificado}</p>}
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {semenStock.length} touro(s) com sêmen disponível em estoque
                </p>
              </div>

              {/* Data da Inseminação */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data da Inseminação *
                </label>
                <input
                  type="date"
                  value={formData.dataInseminacao}
                  onChange={(e) => setFormData({...formData, dataInseminacao: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              {/* Técnico Responsável */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Técnico Responsável *
                </label>
                <input
                  type="text"
                  value={formData.tecnico}
                  onChange={(e) => setFormData({...formData, tecnico: e.target.value})}
                  placeholder="Nome do técnico"
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
                  <option value="IATF">IATF - Inseminação Artificial em Tempo Fixo</option>
                  <option value="Cio Natural">Cio Natural</option>
                  <option value="Sincronização">Sincronização de Cio</option>
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
                      alert(`✅ Valor padrão atualizado para R$ ${novoPadrao.toFixed(2)}`)
                    }}
                    className="px-3 py-2 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
                    title="Salvar como padrão"
                  >
                    Salvar Padrão
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Valor padrão: R$ {custoDosePadrao.toFixed(2)} por dose
                </p>
              </div>

              {/* Status de Gestação */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status de Gestação
                </label>
                <select
                  value={formData.statusGestacao}
                  onChange={(e) => setFormData({...formData, statusGestacao: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Aguardando DG</option>
                  <option value="prenha">Prenha</option>
                  <option value="não prenha">Não Prenha</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Se confirmar prenhez, a gestação será vinculada automaticamente
                </p>
              </div>

              {/* Observações */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Observações
                </label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  placeholder="Observações sobre a inseminação..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Botões */}
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
                Registrar Inseminação
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Estatísticas */}
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
                      Este Mês
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
                  <div className="text-2xl">🧬</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Sêmen Disponível
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
            Nenhuma inseminação registrada
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Comece registrando a primeira inseminação artificial
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700"
          >
            <PlusIcon className="w-5 h-5" />
            Adicionar Inseminação
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Histórico de Inseminações ({inseminacoes.length})
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
                    Touro / Série / RG
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
                    Ações
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
                                Inválida
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
                              <span className="font-medium">Série:</span> {item.serie_touro}
                            </div>
                          )}
                          {item.rg_touro && (
                            <div>
                              <span className="font-medium">RG:</span> {item.rg_touro}
                            </div>
                          )}
                          {!item.serie_touro && !item.rg_touro && (
                            <div className="text-gray-400 italic">Série/RG não informado</div>
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

      {/* Modal de Importação Excel */}
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
                    {showFieldMapping ? 'Mapear Campos do Excel' : 'Importar Inseminações do Excel'}
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
                        Selecione o arquivo Excel. Você poderá escolher quais campos importar na próxima etapa.
                      </p>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                        💡 Informações
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Após selecionar o arquivo, você poderá escolher quais colunas do Excel mapear para cada campo do sistema. 
                        Os campos obrigatórios são <strong>Série</strong> e <strong>RG</strong>.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                      <p className="text-sm text-green-700 dark:text-green-300">
                        ✅ Arquivo carregado com sucesso! {excelHeaders.length} coluna(s) detectada(s). 
                        Selecione quais campos deseja importar:
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
                          {/* Campos básicos */}
                          <tr className="bg-gray-50 dark:bg-gray-800">
                            <td colSpan="3" className="px-4 py-2 font-semibold text-gray-700 dark:text-gray-300">
                              Informações do Animal
                            </td>
                          </tr>
                          {[
                            { key: 'serie', label: 'Série *', required: true },
                            { key: 'rg', label: 'RG *', required: true },
                            { key: 'local', label: 'Local', required: false },
                            { key: 'observacao', label: 'Observação', required: false }
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
                                      alert('Este campo é obrigatório!')
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

                          {/* 1ª IA */}
                          {[1, 2, 3].map(numIA => (
                            <React.Fragment key={numIA}>
                              <tr className="bg-gray-50 dark:bg-gray-800">
                                <td colSpan="3" className="px-4 py-2 font-semibold text-gray-700 dark:text-gray-300">
                                  {numIA}ª Inseminação Artificial
                                </td>
                              </tr>
                              {[
                                { key: `touro${numIA}`, label: `Touro ${numIA}ª IA` },
                                { key: `serieTouro${numIA}`, label: `Série Touro ${numIA}ª` },
                                { key: `rgTouro${numIA}`, label: `RG Touro ${numIA}ª` },
                                { key: `dataIA${numIA}`, label: `Data IA ${numIA}ª` },
                                { key: `dataDG${numIA}`, label: `Data DG ${numIA}ª` },
                                { key: `result${numIA}`, label: `Resultado ${numIA}ª` }
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

      {/* Modal de Importação via Texto */}
      <ImportarTextoInseminacoes
        isOpen={showImportTextoModal}
        onClose={() => setShowImportTextoModal(false)}
        onImportComplete={(resultados) => {
          console.log('Importação concluída:', resultados);
          // Recarregar inseminações
          loadInseminacoes();
          loadAnimals();
        }}
      />
    </div>
  )
}

