import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

// Hooks customizados
import useContabilidade from '../../hooks/useContabilidade'
import useRecipients from '../../hooks/useRecipients'

// UtilitÃ¡rios
import {
  downloadBoletimGado,
  enviarPorEmail,
  enviarPorWhatsApp,
  downloadNotasFiscais,
  sendAllReports
} from '../../utils/contabilidadeUtils'

// Componentes UI
import {
  UserGroupIcon,
  DocumentTextIcon,
  ChartBarIcon,
  PaperAirplaneIcon,
  TableCellsIcon,
  PencilIcon,
  TrashIcon
} from '../../components/ui/Icons'
import Button from '../../components/ui/Button'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import ModernLayout from '../../components/ui/ModernLayout'
import StatsCard from '../../components/ui/StatsCard'
import ModernCard, { ModernCardHeader, ModernCardBody } from '../../components/ui/ModernCard'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Toast from '../../components/ui/SimpleToast'

// Componentes especÃ­ficos da contabilidade
import ReportCard from '../../components/contabilidade/ReportCard'
import RecipientsList from '../../components/contabilidade/RecipientsList'
import ResumoBoletim from '../../components/contabilidade/ResumoBoletim'

export default function Contabilidade() {
  const router = useRouter()
  
  // Estados bÃ¡sicos
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Estados de dados
  const [reportStats, setReportStats] = useState({
    totalAnimals: 0,
    nfsEntradas: 0,
    nfsSaidas: 0,
    movimentacoes: 0
  })
  
  const [animaisData, setAnimaisData] = useState([])
  const [nfsEntradasData, setNfsEntradasData] = useState([])
  const [nfsSaidasData, setNfsSaidasData] = useState([])
  const [resumosBoletins, setResumosBoletins] = useState({
    santAnna: null,
    pardinho: null
  })
  
  // Estados de UI
  const [showAddRecipient, setShowAddRecipient] = useState(false)
  const [showCardDetails, setShowCardDetails] = useState(null)
  const [showGraficos, setShowGraficos] = useState(false)
  const [graficosData, setGraficosData] = useState(null)
  
  // Estados de formulÃ¡rios
  const [period, setPeriod] = useState(() => {
    const now = new Date()
    // Usar primeiro dia do ano atÃ© o Ãºltimo dia do mÃªs atual para incluir todas as NFs do ano
    const firstDay = new Date(now.getFullYear(), 0, 1) // 1Âº de janeiro
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0) // ÃÅ¡ltimo dia do mÃªs atual
    
    return {
      startDate: firstDay.toISOString().split('T')[0],
      endDate: lastDay.toISOString().split('T')[0]
    }
  })
  
  const [recipients, setRecipients] = useState([])
  const [selectedRecipients, setSelectedRecipients] = useState([])
  const [selectedReports, setSelectedReports] = useState(['boletim', 'notasFiscais', 'movimentacoes']) // PadrÃ£o: principais relatÃ³rios
  const [newRecipient, setNewRecipient] = useState({
    name: '',
    email: '',
    whatsapp: '',
    role: 'Contador'
  })
  
  // RelatÃ³rios disponÃ­veis
  const availableReports = [
    { id: 'boletim', name: 'Boletim de Gado', description: 'RelatÃ³rio detalhado do rebanho' },
    { id: 'notasFiscais', name: 'Notas Fiscais', description: 'Entradas e saÃ­das do perÃ­odo' },
    { id: 'movimentacoes', name: 'MovimentaÃ§Ãµes', description: 'MovimentaÃ§Ãµes do mÃªs' },
    { id: 'nascimentos', name: 'Nascimentos', description: 'Registro de nascimentos do perÃ­odo' },
    { id: 'mortes', name: 'Mortes', description: 'Registro de mortes do perÃ­odo' }
  ]

  // Carregar dados na inicializaÃ§Ã£o
  useEffect(() => {
    const loadData = async () => {
      try {
        await loadStats()
        loadRecipients()
        await loadResumosBoletins()
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error)
        setError('Erro ao carregar dados do sistema')
      }
    }
    
    loadData()
  }, [])

  // Carregar resumos quando o perÃ­odo mudar
  useEffect(() => {
    if (period?.startDate && period?.endDate) {
      loadResumosBoletins()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period?.startDate, period?.endDate])

  // FunÃ§Ã£o auxiliar para fazer requisiÃ§Ãµes com timeout e retry
  const fetchWithTimeout = async (url, options = {}, timeout = 10000, retries = 2) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort('Timeout'), timeout)
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      if (retries > 0 && (error.name === 'AbortError' || error.message.includes('500') || error === 'Timeout')) {
        console.log(`Tentando novamente... (${retries} tentativas restantes)`)
        await new Promise(resolve => setTimeout(resolve, 1000)) // Aguardar 1 segundo
        return fetchWithTimeout(url, options, timeout, retries - 1)
      }
      throw error
    }
  }

  // Carregar estatÃ­sticas
  const loadStats = async () => {
    try {
      setLoading(true)
      setError(null) // Limpar erros anteriores
      
      // Carregar animais com timeout e retry
      try {
        const animalsResponse = await fetchWithTimeout('/api/animals')
        if (animalsResponse.ok) {
          const animalsData = await animalsResponse.json()
          const animals = Array.isArray(animalsData) ? animalsData : (animalsData.data || [])
          setAnimaisData(animals)
          
          setReportStats(prev => ({
            ...prev,
            totalAnimals: animals.length
          }))
        } else {
          console.warn('Erro ao carregar animais:', animalsResponse.status)
        }
      } catch (animalError) {
        console.error('Erro ao carregar animais:', animalError)
        // NÃ£o falhar completamente, apenas logar o erro
      }
      
      // Carregar notas fiscais com timeout e retry
      try {
        const nfsResponse = await fetchWithTimeout('/api/notas-fiscais')
        if (nfsResponse.ok) {
          const nfsData = await nfsResponse.json()
          const entradas = nfsData.data?.filter(nf => nf.tipo === 'entrada') || []
          const saidas = nfsData.data?.filter(nf => nf.tipo === 'saida') || []
          
          setNfsEntradasData(entradas)
          setNfsSaidasData(saidas)
          
          setReportStats(prev => ({
            ...prev,
            nfsEntradas: entradas.length,
            nfsSaidas: saidas.length,
            movimentacoes: entradas.length + saidas.length
          }))
        } else {
          console.warn('Erro ao carregar notas fiscais:', nfsResponse.status)
        }
      } catch (nfError) {
        console.error('Erro ao carregar notas fiscais:', nfError)
        // NÃ£o falhar completamente, apenas logar o erro
      }
      
    } catch (error) {
      console.error('Erro geral ao carregar dados:', error)
      setError('Erro ao carregar dados do sistema. Tente recarregar a pÃ¡gina.')
    } finally {
      setLoading(false)
    }
  }

  // Carregar resumos dos boletins
  const loadResumosBoletins = async () => {
    try {
      const periodParam = `${period.startDate},${period.endDate}`
      const response = await fetchWithTimeout(`/api/contabilidade/resumo-boletins?period=${periodParam}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('ðÅ¸â€œÅ  Resumos recebidos da API:', {
          santAnna: data.santAnna,
          pardinho: data.pardinho
        })
        
        // Log detalhado do resumo Pardinho
        if (data.pardinho) {
          console.log('ðÅ¸Å½¯ Resumo Pardinho detalhado:', {
            total: data.pardinho.total,
            porSexo: data.pardinho.porSexo,
            porEra: data.pardinho.porEra,
            porRaca: data.pardinho.porRaca
          })
          
          // Verificar se hÃ¡ dados mas total Ã© 0
          const temFemeas = data.pardinho.porSexo?.femeas > 0
          const temMachos = data.pardinho.porSexo?.machos > 0
          const temEras = data.pardinho.porEra && Object.values(data.pardinho.porEra).some(v => v > 0)
          
          console.log('ðÅ¸â€�� ValidaÃ§Ã£o Pardinho:', {
            total: data.pardinho.total,
            temFemeas,
            temMachos,
            temEras,
            porSexo: data.pardinho.porSexo,
            porEra: data.pardinho.porEra
          })
          
          if ((temFemeas || temMachos || temEras) && data.pardinho.total === 0) {
            console.warn('âÅ¡ ï¸� PROBLEMA DETECTADO: HÃ¡ animais mas total Ã© 0! Corrigindo...')
            // Corrigir o total se necessÃ¡rio
            if (!data.pardinho.total && (temFemeas || temMachos)) {
              data.pardinho.total = (data.pardinho.porSexo?.femeas || 0) + (data.pardinho.porSexo?.machos || 0)
              console.log('âÅ“â€¦ Total corrigido para:', data.pardinho.total)
            }
          }
        } else {
          console.error('â�Å’ Resumo Pardinho estÃ¡ null ou undefined!')
        }
        
        setResumosBoletins({
          santAnna: data.santAnna || null,
          pardinho: data.pardinho || null
        })
      } else {
        console.error('â�Å’ Erro na resposta da API:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('â�Å’ Detalhes do erro:', errorText)
        setError(`Erro ao carregar resumos: ${response.status}`)
      }
    } catch (error) {
      console.error('â�Å’ Erro ao carregar resumos dos boletins:', error)
      setError('Erro ao carregar resumos dos boletins. Tente novamente.')
    }
  }

  // Gerenciar destinatÃ¡rios
  const loadRecipients = () => {
    const saved = localStorage.getItem('contabilidadeRecipients')
    if (saved) {
      setRecipients(JSON.parse(saved))
    }
  }

  const saveRecipients = (newRecipients) => {
    localStorage.setItem('contabilidadeRecipients', JSON.stringify(newRecipients))
    setRecipients(newRecipients)
  }

  const addRecipient = () => {
    if (!newRecipient.name || (!newRecipient.email && !newRecipient.whatsapp)) {
      alert('âÅ¡ ï¸� Nome e Email ou WhatsApp sÃ£o obrigatÃ³rios')
      return
    }

    const recipient = {
      id: Date.now().toString(),
      ...newRecipient
    }

    const updatedRecipients = [...recipients, recipient]
    saveRecipients(updatedRecipients)
    setNewRecipient({ name: '', email: '', whatsapp: '', role: 'Contador' })
    setShowAddRecipient(false)
    alert('âÅ“â€¦ DestinatÃ¡rio adicionado com sucesso!')
  }

  const removeRecipient = (recipientId) => {
    const updatedRecipients = recipients.filter(r => r.id !== recipientId)
    saveRecipients(updatedRecipients)
    setSelectedRecipients(prev => prev.filter(id => id !== recipientId))
    alert('âÅ“â€¦ DestinatÃ¡rio removido com sucesso!')
  }

  const handleRecipientToggle = (recipientId) => {
    setSelectedRecipients(prev =>
      prev.includes(recipientId)
        ? prev.filter(id => id !== recipientId)
        : [...prev, recipientId]
    )
  }

  const handleReportToggle = (reportId) => {
    setSelectedReports(prev =>
      prev.includes(reportId)
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    )
  }

  // FunÃ§Ã£o auxiliar compartilhada para garantir dados primitivos limpos
  const cleanPeriodData = () => {
    const cleanData = (data) => {
      if (data === null || data === undefined) return null
      if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
        return data
      }
      if (data instanceof Date) {
        return data.toISOString().split('T')[0]
      }
      return String(data)
    }
    
    const startDate = cleanData(period?.startDate) || ''
    const endDate = cleanData(period?.endDate) || ''
    
    return {
      startDate: String(startDate),
      endDate: String(endDate)
    }
  }

  // Handlers para relatÃ³rios
  const handleDownloadBoletim = (sendToAccounting = false) => {
    downloadBoletimGado(period, animaisData, sendToAccounting, setLoading)
  }

  const handleDownloadBoletimPardinho = async (sendToAccounting = false) => {
    try {
      setLoading(true)
      
      // Criar objeto limpo apenas com os dados necessÃ¡rios (garantir que sÃ£o strings primitivas)
      const periodData = cleanPeriodData()
      
      // Garantir que sendToAccounting seja um booleano primitivo
      const sendToAccountingValue = Boolean(sendToAccounting)
      
      // Validar dados antes de enviar
      if (!periodData.startDate || !periodData.endDate) {
        throw new Error('PerÃ­odo invÃ¡lido. Por favor, selecione as datas corretamente.')
      }
      
      const requestBody = { 
        period: periodData, 
        sendToAccounting: sendToAccountingValue 
      }
      
      // Verificar se o JSON pode ser serializado antes de enviar
      try {
        JSON.stringify(requestBody)
      } catch (jsonError) {
        console.error('Erro ao serializar dados:', jsonError)
        throw new Error('Erro ao preparar dados para envio. Por favor, tente novamente.')
      }
      
      const response = await fetch('/api/contabilidade/boletim-pardinho', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        let errorMessage = 'Erro ao gerar boletim'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch (e) {
          // Se nÃ£o conseguir parsear o JSON, usar o status
          errorMessage = `Erro ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `boletim-agropecuaria-pardinho-${periodData.startDate}-${periodData.endDate}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      if (sendToAccounting) {
        Toast.success('âÅ“â€¦ Boletim da AGROPECUÃ�RIA PARDINHO enviado para contabilidade!')
      } else {
        Toast.success('âÅ“â€¦ Boletim da AGROPECUÃ�RIA PARDINHO gerado com sucesso!')
      }
    } catch (error) {
      console.error('Erro:', error)
      Toast.error(`â�Å’ Erro: ${error.message || 'NÃ£o foi possÃ­vel gerar o boletim'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleEnviarEmailPardinho = async () => {
    try {
      setLoading(true)
      
      // Criar objeto limpo apenas com os dados necessÃ¡rios (garantir que sÃ£o strings primitivas)
      const periodData = cleanPeriodData()
      
      // Validar dados antes de enviar
      if (!periodData.startDate || !periodData.endDate) {
        throw new Error('PerÃ­odo invÃ¡lido. Por favor, selecione as datas corretamente.')
      }
      
      // Buscar resumo do boletim Pardinho
      const periodParam = `${periodData.startDate},${periodData.endDate}`
      const resumoResponse = await fetch(`/api/contabilidade/resumo-boletins?period=${periodParam}`)
      
      let resumoText = ''
      if (resumoResponse.ok) {
        const resumos = await resumoResponse.json()
        const pardinho = resumos.pardinho || {}
        
        if (pardinho.total > 0) {
          resumoText = `
ðÅ¸â€œÅ  RESUMO:
ââ‚¬¢ Total: ${pardinho.total} animais
ââ‚¬¢ FÃªmeas: ${pardinho.porSexo?.femeas || 0}
ââ‚¬¢ Machos: ${pardinho.porSexo?.machos || 0}

`
          
          // Adicionar detalhes por idade se houver
          const porEra = pardinho.porEra || {}
          const detalhesIdade = []
          
          if (porEra['femea_0-7'] > 0) detalhesIdade.push(`FÃªmeas 0-7m: ${porEra['femea_0-7']}`)
          if (porEra['femea_7-12'] > 0) detalhesIdade.push(`FÃªmeas 7-12m: ${porEra['femea_7-12']}`)
          if (porEra['femea_12-18'] > 0) detalhesIdade.push(`FÃªmeas 12-18m: ${porEra['femea_12-18']}`)
          if (porEra['femea_18-24'] > 0) detalhesIdade.push(`FÃªmeas 18-24m: ${porEra['femea_18-24']}`)
          if (porEra['femea_24+'] > 0) detalhesIdade.push(`FÃªmeas 24+m: ${porEra['femea_24+']}`)
          
          if (porEra['macho_0-7'] > 0) detalhesIdade.push(`Machos 0-7m: ${porEra['macho_0-7']}`)
          if (porEra['macho_7-15'] > 0) detalhesIdade.push(`Machos 7-15m: ${porEra['macho_7-15']}`)
          if (porEra['macho_15-18'] > 0) detalhesIdade.push(`Machos 15-18m: ${porEra['macho_15-18']}`)
          if (porEra['macho_18-22'] > 0) detalhesIdade.push(`Machos 18-22m: ${porEra['macho_18-22']}`)
          if (porEra['macho_36+'] > 0) detalhesIdade.push(`Machos 36+m: ${porEra['macho_36+']}`)
          
          if (detalhesIdade.length > 0) {
            resumoText += `ðÅ¸â€œâ€¹ Por Idade:
${detalhesIdade.map(d => `ââ‚¬¢ ${d}`).join('\n')}

`
          }
        } else {
          resumoText = `
âÅ¡ ï¸� Nenhum animal encontrado para este perÃ­odo.

`
        }
      }
      
      // Criar link de email usando dados limpos
      const assunto = encodeURIComponent(`Boletim AGROPECUÃ�RIA PARDINHO - ${periodData.startDate} atÃ© ${periodData.endDate}`)
      const corpo = encodeURIComponent(`ðÅ¸�â€ž BOLETIM AGROPECUÃ�RIA PARDINHO - BEEF SYNC

ðÅ¸â€œâ€¦ PerÃ­odo: ${periodData.startDate} atÃ© ${periodData.endDate}
ðÅ¸â€œÅ  Localidade: AGROPECUÃ�RIA PARDINHO LTDA

${resumoText}ðÅ¸â€œÅ½ Acesse o sistema para visualizar o relatÃ³rio completo em Excel.

Gerado em: ${new Date().toLocaleString('pt-BR')}

Sistema Beef-Sync`)
      
      // Abrir cliente de email
      window.location.href = `mailto:?subject=${assunto}&body=${corpo}`
      
      Toast.success('âÅ“â€¦ Email preparado! Preencha o destinatÃ¡rio e envie.')
    } catch (error) {
      console.error('Erro ao enviar por email:', error)
      Toast.error('â�Å’ Erro ao preparar email')
    } finally {
      setLoading(false)
    }
  }

  const handleEnviarWhatsAppPardinho = async () => {
    try {
      setLoading(true)
      
      // Criar objeto limpo apenas com os dados necessÃ¡rios (garantir que sÃ£o strings primitivas)
      const periodData = cleanPeriodData()
      
      // Validar dados antes de enviar
      if (!periodData.startDate || !periodData.endDate) {
        throw new Error('PerÃ­odo invÃ¡lido. Por favor, selecione as datas corretamente.')
      }
      
      // Buscar resumo do boletim Pardinho
      const periodParam = `${periodData.startDate},${periodData.endDate}`
      const resumoResponse = await fetch(`/api/contabilidade/resumo-boletins?period=${periodParam}`)
      
      let resumoText = ''
      if (resumoResponse.ok) {
        const resumos = await resumoResponse.json()
        const pardinho = resumos.pardinho || {}
        
        if (pardinho.total > 0) {
          resumoText = `ðÅ¸â€œÅ  *Resumo:*
ââ‚¬¢ Total: ${pardinho.total} animais
ââ‚¬¢ FÃªmeas: ${pardinho.porSexo?.femeas || 0}
ââ‚¬¢ Machos: ${pardinho.porSexo?.machos || 0}

`
          
          // Adicionar detalhes por idade se houver
          const porEra = pardinho.porEra || {}
          const detalhesIdade = []
          
          if (porEra['femea_0-7'] > 0) detalhesIdade.push(`FÃªmeas 0-7m: ${porEra['femea_0-7']}`)
          if (porEra['femea_7-12'] > 0) detalhesIdade.push(`FÃªmeas 7-12m: ${porEra['femea_7-12']}`)
          if (porEra['femea_12-18'] > 0) detalhesIdade.push(`FÃªmeas 12-18m: ${porEra['femea_12-18']}`)
          if (porEra['femea_18-24'] > 0) detalhesIdade.push(`FÃªmeas 18-24m: ${porEra['femea_18-24']}`)
          if (porEra['femea_24+'] > 0) detalhesIdade.push(`FÃªmeas 24+m: ${porEra['femea_24+']}`)
          
          if (porEra['macho_0-7'] > 0) detalhesIdade.push(`Machos 0-7m: ${porEra['macho_0-7']}`)
          if (porEra['macho_7-15'] > 0) detalhesIdade.push(`Machos 7-15m: ${porEra['macho_7-15']}`)
          if (porEra['macho_15-18'] > 0) detalhesIdade.push(`Machos 15-18m: ${porEra['macho_15-18']}`)
          if (porEra['macho_18-22'] > 0) detalhesIdade.push(`Machos 18-22m: ${porEra['macho_18-22']}`)
          if (porEra['macho_36+'] > 0) detalhesIdade.push(`Machos 36+m: ${porEra['macho_36+']}`)
          
          if (detalhesIdade.length > 0) {
            resumoText += `ðÅ¸â€œâ€¹ *Por Idade:*
${detalhesIdade.map(d => `ââ‚¬¢ ${d}`).join('\n')}

`
          }
        } else {
          resumoText = `âÅ¡ ï¸� Nenhum animal encontrado para este perÃ­odo.

`
        }
      }

      // Criar mensagem para WhatsApp usando dados limpos
      const mensagem = `ðÅ¸�â€ž *BOLETIM AGROPECUÃ�RIA PARDINHO - BEEF SYNC*

ðÅ¸â€œâ€¦ *PerÃ­odo:* ${periodData.startDate} atÃ© ${periodData.endDate}
ðÅ¸â€œÅ  *Localidade:* AGROPECUÃ�RIA PARDINHO LTDA

${resumoText}ðÅ¸â€œÅ½ *Acesse o sistema para visualizar o relatÃ³rio completo em Excel.*

Gerado em: ${new Date().toLocaleString('pt-BR')}

_Sistema Beef-Sync_`

      const mensagemEncoded = encodeURIComponent(mensagem)
      window.open(`https://wa.me/?text=${mensagemEncoded}`, '_blank')
      
      Toast.success('âÅ“â€¦ WhatsApp aberto! Envie a mensagem.')
    } catch (error) {
      console.error('Erro ao enviar por WhatsApp:', error)
      Toast.error('â�Å’ Erro ao preparar WhatsApp')
    } finally {
      setLoading(false)
    }
  }

  const handleEnviarEmail = () => {
    enviarPorEmail(period, animaisData, setLoading)
  }

  const handleEnviarWhatsApp = () => {
    enviarPorWhatsApp(period, animaisData, setLoading)
  }

  const handleDownloadNFs = () => {
    downloadNotasFiscais(period, setLoading)
  }

  const handleSendAllReports = () => {
    if (selectedReports.length === 0) {
      alert('âÅ¡ ï¸� Selecione pelo menos um relatÃ³rio para enviar')
      return
    }
    sendAllReports(period, selectedRecipients, recipients, setLoading, selectedReports)
  }

  // Gerar grÃ¡ficos
  const gerarGraficos = async () => {
    try {
      setLoading(true)
      
      console.log('ðÅ¸â€�� Gerando grÃ¡ficos (API buscarÃ¡ animais do banco)...')
      
      const response = await fetchWithTimeout('/api/contabilidade/graficos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          period
          // NÃ£o enviar animais - API buscarÃ¡ diretamente do banco para evitar limite de 1MB
        })
      }, 30000) // Timeout maior para grÃ¡ficos (30 segundos)
      
      if (response.ok) {
        const data = await response.json()
        setGraficosData(data)
        setShowGraficos(true)
        console.log('âÅ“â€¦ GrÃ¡ficos gerados com sucesso')
      } else {
        const errorText = await response.text()
        console.error('â�Å’ Erro na resposta:', response.status, errorText)
        alert(`â�Å’ Erro ao gerar grÃ¡ficos: ${response.status}`)
      }
    } catch (error) {
      console.error('â�Å’ Erro ao gerar grÃ¡ficos:', error)
      alert(`â�Å’ Erro ao gerar grÃ¡ficos: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Mostrar loading
  if (loading && !reportStats.totalAnimals) {
    return (
      <ModernLayout
        title="RelatÃ³rios para Contabilidade"
        subtitle="Carregando dados..."
        icon="ðÅ¸â€œÅ "
      >
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner size="lg" text="Carregando dados da contabilidade..." />
        </div>
      </ModernLayout>
    )
  }

  // Mostrar erro
  if (error) {
    return (
      <ModernLayout
        title="RelatÃ³rios para Contabilidade"
        subtitle="Erro no sistema"
        icon="ðÅ¸â€œÅ "
      >
        <ModernCard variant="glass" className="border-red-200 dark:border-red-800 bg-red-50/80 dark:bg-red-900/20">
          <ModernCardBody>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-500 rounded-xl text-white">
                <span>âÅ¡ ï¸�</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 dark:text-red-200">
                  Erro no Sistema
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {error}
                </p>
                <button 
                  onClick={() => {
                    setError(null)
                    window.location.reload()
                  }}
                  className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Recarregar PÃ¡gina
                </button>
              </div>
            </div>
          </ModernCardBody>
        </ModernCard>
      </ModernLayout>
    )
  }

  return (
    <ModernLayout
      title="RelatÃ³rios para Contabilidade"
      subtitle="Gere e envie relatÃ³rios completos para sua equipe contÃ¡bil"
      icon="ðÅ¸â€œÅ "
    >
      <div className="space-y-8">
        {/* EstatÃ­sticas RÃ¡pidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total de Animais"
            value={reportStats.totalAnimals}
            subtitle="Rebanho cadastrado"
            icon={<UserGroupIcon className="h-6 w-6" />}
            color="blue"
            onClick={() => setShowCardDetails('total-animais')}
          />
          <StatsCard
            title="NFs Entrada"
            value={reportStats.nfsEntradas}
            subtitle="Notas fiscais de entrada"
            icon={<DocumentTextIcon className="h-6 w-6" />}
            color="green"
            onClick={() => setShowCardDetails('nfs-entradas')}
          />
          <StatsCard
            title="NFs SaÃ­da"
            value={reportStats.nfsSaidas}
            subtitle="Notas fiscais de saÃ­da"
            icon={<DocumentTextIcon className="h-6 w-6" />}
            color="red"
            onClick={() => setShowCardDetails('nfs-saidas')}
          />
          <StatsCard
            title="Total MovimentaÃ§Ãµes"
            value={reportStats.movimentacoes}
            subtitle="Entradas + SaÃ­das"
            icon={<ChartBarIcon className="h-6 w-6" />}
            color="purple"
            onClick={() => setShowCardDetails('total-movimentacoes')}
          />
        </div>

        {/* SeleÃ§Ã£o de PerÃ­odo */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-white">ðÅ¸â€œâ€¦ PerÃ­odo dos RelatÃ³rios</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Input
                label="Data Inicial"
                type="date"
                value={period.startDate}
                onChange={(e) => setPeriod(prev => ({ ...prev, startDate: e.target.value }))}
              />
              <Input
                label="Data Final"
                type="date"
                value={period.endDate}
                onChange={(e) => setPeriod(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                ðÅ¸â€™¡ <strong>Dica:</strong> Os relatÃ³rios incluirÃ£o todas as movimentaÃ§Ãµes e dados 
                referentes ao perÃ­odo selecionado.
              </p>
            </div>
          </CardBody>
        </Card>

        {/* GrÃ¡ficos Visuais */}
        <ModernCard variant="gradient" className="mb-8">
          <ModernCardHeader
            icon={<ChartBarIcon className="h-6 w-6" />}
            title="GrÃ¡ficos Visuais do Rebanho"
            subtitle="Visualize dados do rebanho em grÃ¡ficos interativos"
          />
          <ModernCardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Button
                variant="primary"
                onClick={gerarGraficos}
                loading={loading}
                className="w-full"
              >
                {showGraficos ? 'Atualizar GrÃ¡ficos' : 'Gerar GrÃ¡ficos'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowGraficos(!showGraficos)}
                className="w-full"
              >
                {showGraficos ? 'Ocultar GrÃ¡ficos' : 'Visualizar GrÃ¡ficos'}
              </Button>
            </div>

            {showGraficos && graficosData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-center">
                    ðÅ¸�â€ž DistribuiÃ§Ã£o por RaÃ§a
                  </h4>
                  <div className="flex justify-center">
                    <img 
                      src={`data:image/png;base64,${graficosData.graficos.porRaca}`} 
                      alt="GrÃ¡fico por RaÃ§a"
                      className="max-w-full h-auto rounded"
                    />
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-center">
                    ðÅ¸â€˜¥ DistribuiÃ§Ã£o por Sexo
                  </h4>
                  <div className="flex justify-center">
                    <img 
                      src={`data:image/png;base64,${graficosData.graficos.porSexo}`} 
                      alt="GrÃ¡fico por Sexo"
                      className="max-w-full h-auto rounded"
                    />
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-center">
                    ðÅ¸â€œÅ  DistribuiÃ§Ã£o por ClassificaÃ§Ã£o EtÃ¡ria
                  </h4>
                  <div className="flex justify-center">
                    <img 
                      src={`data:image/png;base64,${graficosData.graficos.porIdade}`} 
                      alt="GrÃ¡fico por Idade"
                      className="max-w-full h-auto rounded"
                    />
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-center">
                    ðÅ¸â€œË† DistribuiÃ§Ã£o por ERA
                  </h4>
                  <div className="flex justify-center">
                    <img 
                      src={`data:image/png;base64,${graficosData.graficos.porEra}`} 
                      alt="GrÃ¡fico por ERA"
                      className="max-w-full h-auto rounded"
                    />
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-center">
                    ðÅ¸Å½¯ DistribuiÃ§Ã£o por SituaÃ§Ã£o
                  </h4>
                  <div className="flex justify-center">
                    <img 
                      src={`data:image/png;base64,${graficosData.graficos.porSituacao}`} 
                      alt="GrÃ¡fico por SituaÃ§Ã£o"
                      className="max-w-full h-auto rounded"
                    />
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-center">
                    ðÅ¸â€˜¨ Top 10 - DistribuiÃ§Ã£o por Pai
                  </h4>
                  <div className="flex justify-center">
                    <img 
                      src={`data:image/png;base64,${graficosData.graficos.porPai}`} 
                      alt="GrÃ¡fico por Pai"
                      className="max-w-full h-auto rounded"
                    />
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-center">
                    ðÅ¸â€˜© Top 10 - DistribuiÃ§Ã£o por MÃ£e
                  </h4>
                  <div className="flex justify-center">
                    <img 
                      src={`data:image/png;base64,${graficosData.graficos.porMae}`} 
                      alt="GrÃ¡fico por MÃ£e"
                      className="max-w-full h-auto rounded"
                    />
                  </div>
                </div>
              </div>
            )}
          </ModernCardBody>
        </ModernCard>

        {/* RelatÃ³rios DisponÃ­veis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ModernCard modern={true} hover={true}>
            <ModernCardHeader
              icon={<DocumentTextIcon className="h-6 w-6" />}
              title="RelatÃ³rios DisponÃ­veis"
              subtitle="Gere e compartilhe relatÃ³rios profissionais"
            />
            <ModernCardBody>
              <div className="space-y-6">
                <ReportCard
                  title="Boletim SANT ANNA - RANCHARIA"
                  description="RelatÃ³rio detalhado do rebanho por raÃ§a e faixas de idade"
                  icon={<TableCellsIcon className="h-5 w-5" />}
                  iconColor="from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20"
                  onSendToAccounting={() => handleDownloadBoletim(true)}
                  onEmail={handleEnviarEmail}
                  onWhatsApp={handleEnviarWhatsApp}
                  loading={loading}
                >
                  <ResumoBoletim resumo={resumosBoletins.santAnna} />
                </ReportCard>
                
                <ReportCard
                  title="Boletim AGROPECUÃ�RIA PARDINHO"
                  description="RelatÃ³rio especÃ­fico de entradas da AGROPECUÃ�RIA PARDINHO LTDA"
                  icon={<TableCellsIcon className="h-5 w-5" />}
                  iconColor="from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20"
                  onSendToAccounting={() => handleDownloadBoletimPardinho(true)}
                  onEmail={handleEnviarEmailPardinho}
                  onWhatsApp={handleEnviarWhatsAppPardinho}
                  loading={loading}
                >
                  <ResumoBoletim resumo={resumosBoletins.pardinho} />
                </ReportCard>
                
                <ReportCard
                  title="Notas Fiscais"
                  description="RelatÃ³rio completo de entradas e saÃ­das"
                  icon={<DocumentTextIcon className="h-5 w-5" />}
                  iconColor="from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20"
                  onSendToAccounting={handleDownloadNFs}
                  loading={loading}
                />
              </div>
            </ModernCardBody>
          </ModernCard>

          {/* Painel de DestinatÃ¡rios */}
          <div className="space-y-6">
            <RecipientsList
              recipients={recipients}
              selectedRecipients={selectedRecipients}
              onToggleRecipient={handleRecipientToggle}
              onRemoveRecipient={removeRecipient}
              onAddRecipient={() => setShowAddRecipient(true)}
            />

            {/* AÃ§Ãµes */}
            <ModernCard variant="premium" modern={true} hover={true} glow={true}>
              <ModernCardHeader
                icon={<PaperAirplaneIcon className="h-6 w-6" />}
                title="Enviar RelatÃ³rios"
                subtitle="Selecione os relatÃ³rios e destinatÃ¡rios"
              />
              <ModernCardBody>
                <div className="space-y-4">
                  {/* SeleÃ§Ã£o de RelatÃ³rios */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ðÅ¸â€œÅ  RelatÃ³rios DisponÃ­veis
                    </label>
                    <div className="space-y-2">
                      {availableReports.map((report) => (
                        <label
                          key={report.id}
                          className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedReports.includes(report.id)}
                            onChange={() => handleReportToggle(report.id)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <div className="ml-3 flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {report.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {report.description}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    leftIcon={<PaperAirplaneIcon className="h-5 w-5" />}
                    onClick={handleSendAllReports}
                    loading={loading}
                    disabled={selectedRecipients.length === 0 || selectedReports.length === 0}
                    modern={true}
                    glow={true}
                  >
                    Enviar {selectedReports.length} RelatÃ³rio(s)
                  </Button>
                  
                  <div className="space-y-2">
                    {selectedRecipients.length > 0 && (
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                        <p className="text-sm text-green-800 dark:text-green-200">
                          âÅ“â€œ {selectedRecipients.length} destinatÃ¡rio(s) selecionado(s)
                        </p>
                      </div>
                    )}
                    {selectedReports.length > 0 && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          âÅ“â€œ {selectedReports.length} relatÃ³rio(s) selecionado(s)
                        </p>
                      </div>
                    )}
                    {(selectedRecipients.length === 0 || selectedReports.length === 0) && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          âÅ¡ ï¸� Selecione pelo menos um relatÃ³rio e um destinatÃ¡rio
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </ModernCardBody>
            </ModernCard>
          </div>
        </div>
      </div>

      {/* Modal Adicionar DestinatÃ¡rio */}
      <Modal
        isOpen={showAddRecipient}
        onClose={() => {
          setShowAddRecipient(false)
          setNewRecipient({ name: '', email: '', whatsapp: '', role: 'Contador' })
        }}
        title="Adicionar DestinatÃ¡rio"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="ðÅ¸â€œ� Nome Completo"
            value={newRecipient.name}
            onChange={(e) => setNewRecipient(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Ex: JoÃ£o Silva"
            required
          />
          
          <Input
            label="ðÅ¸â€œ§ Email"
            type="email"
            value={newRecipient.email}
            onChange={(e) => setNewRecipient(prev => ({ ...prev, email: e.target.value }))}
            placeholder="Ex: joao@empresa.com"
          />
          
          <Input
            label="ðÅ¸â€œ± WhatsApp"
            value={newRecipient.whatsapp}
            onChange={(e) => setNewRecipient(prev => ({ ...prev, whatsapp: e.target.value }))}
            placeholder="Ex: (11) 99999-9999"
          />
          
          <div className="flex space-x-3 pt-4">
            <Button
              onClick={addRecipient}
              className="flex-1"
              variant="primary"
            >
              âÅ“â€¦ Adicionar
            </Button>
            <Button
              onClick={() => setShowAddRecipient(false)}
              variant="secondary"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Detalhes dos Cards */}
      {showCardDetails && (
        <Modal
          isOpen={true}
          onClose={() => setShowCardDetails(null)}
          title={getCardDetailsTitle(showCardDetails)}
          size="lg"
        >
          <div>
            {getCardDetailsContent(showCardDetails, {
              nfsEntradasData,
              nfsSaidasData,
              reportStats,
              animaisData
            })}
          </div>
          <div className="mt-6 flex justify-end">
            <Button
              variant="secondary"
              onClick={() => setShowCardDetails(null)}
            >
              Fechar
            </Button>
          </div>
        </Modal>
      )}
    </ModernLayout>
  )
}

function getCardDetailsTitle(cardType) {
  switch (cardType) {
    case 'total-animais':
      return 'ðÅ¸â€œÅ  Total de Animais - Detalhes'
    case 'nfs-entradas':
      return 'ðÅ¸â€œ¥ Notas Fiscais de Entrada'
    case 'nfs-saidas':
      return 'ðÅ¸â€œ¤ Notas Fiscais de SaÃ­da'
    case 'total-movimentacoes':
      return 'ðÅ¸â€�â€ž Total de MovimentaÃ§Ãµes'
    default:
      return 'Detalhes'
  }
}

function getCardDetailsContent(cardType, data = {}) {
  const { nfsEntradasData = [], nfsSaidasData = [], reportStats = {}, animaisData = [] } = data
  
  switch (cardType) {
    case 'total-animais':
      return (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Total de {animaisData.length} animais</strong> cadastrados no sistema.
            </p>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Lista de Animais:</h4>
            {animaisData.length > 0 ? (
              animaisData.slice(0, 10).map((animal) => (
                <div 
                  key={animal.id} 
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {animal.nome || animal.serie || 'Sem nome'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {animal.raca} ââ‚¬¢ {animal.sexo}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Cadastrado em: {formatDate(animal.created_at)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Nenhum animal cadastrado
              </div>
            )}
            {animaisData.length > 10 && (
              <div className="text-center text-sm text-gray-500">
                ... e mais {animaisData.length - 10} animais
              </div>
            )}
          </div>
        </div>
      )

    case 'nfs-entradas':
      return (
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>DefiniÃ§Ã£o:</strong> Notas fiscais de entrada registradas no perÃ­odo selecionado.
            </p>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-white">Notas Fiscais de Entrada:</h4>
            {nfsEntradasData.length > 0 ? (
              nfsEntradasData.map((nf, index) => (
                <div 
                  key={index} 
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    NF: {nf.numero_nf || nf.numero || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {nf.data || 'Data nÃ£o informada'} ââ‚¬¢ {nf.fornecedor || 'Fornecedor nÃ£o informado'}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Nenhuma nota fiscal de entrada registrada
              </div>
            )}
          </div>
        </div>
      )

    case 'nfs-saidas':
      return (
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              <strong>DefiniÃ§Ã£o:</strong> Notas fiscais de saÃ­da registradas no perÃ­odo selecionado.
            </p>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-white">Notas Fiscais de SaÃ­da:</h4>
            {nfsSaidasData.length > 0 ? (
              nfsSaidasData.map((nf, index) => (
                <div 
                  key={index} 
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    NF: {nf.numero_nf || nf.numero || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {nf.data || 'Data nÃ£o informada'} ââ‚¬¢ {nf.destino || nf.cliente || 'Cliente nÃ£o informado'}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Nenhuma nota fiscal de saÃ­da registrada
              </div>
            )}
          </div>
        </div>
      )

    case 'total-movimentacoes':
      return (
        <div className="space-y-4">
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <p className="text-sm text-purple-800 dark:text-purple-200">
              <strong>DefiniÃ§Ã£o:</strong> Total de movimentaÃ§Ãµes (entradas + saÃ­das) registradas no perÃ­odo selecionado.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {reportStats.nfsEntradas}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Entradas
              </div>
            </div>
            <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {reportStats.nfsSaidas}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                SaÃ­das
              </div>
            </div>
          </div>
        </div>
      )

    default:
      return <div>Detalhes nÃ£o disponÃ­veis</div>
  }
}
