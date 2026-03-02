import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import * as XLSX from 'xlsx'
import {
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  CattleIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  MapPinIcon,
  EyeIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LinkIcon,
  ArrowDownTrayIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon
} from '../../components/ui/Icons'

const STORAGE_ACTIVITIES = 'activities'
const STORAGE_CALENDAR_LINKS = 'planejamento_calendar_links'

function formatDate(d) {
  if (!d) return '-'
  const dt = new Date(d)
  return isNaN(dt.getTime()) ? '-' : dt.toLocaleDateString('pt-BR')
}

export default function ActivityAgenda() {
  const [mounted, setMounted] = useState(false)
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [eventosLoading, setEventosLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [viewMonth, setViewMonth] = useState(new Date().getMonth())
  const [viewYear, setViewYear] = useState(new Date().getFullYear())
  const [showNewActivity, setShowNewActivity] = useState(false)
  const [showCalendarLinks, setShowCalendarLinks] = useState(false)
  const [calendarLinks, setCalendarLinks] = useState([])
  const [newCalendarLink, setNewCalendarLink] = useState({ nome: '', url: '' })
  const [eventosAnimais, setEventosAnimais] = useState({ brucelose: [], dgt: [], periodo: null })
  const [abaAtiva, setAbaAtiva] = useState('todos') // todos | brucelose | dgt | atividades
  const [animalSelecionado, setAnimalSelecionado] = useState(null)
  const [exportando, setExportando] = useState(false)
  const [enviandoEmail, setEnviandoEmail] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(null) // 'brucelose' | 'dgt' | null
  const [emailDestinatario, setEmailDestinatario] = useState('')
  const [newActivity, setNewActivity] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    priority: 'medium',
    status: 'pending'
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    loadActivities()
    const links = localStorage.getItem(STORAGE_CALENDAR_LINKS)
    if (links) setCalendarLinks(JSON.parse(links))
  }, [mounted])

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return
    loadEventosAnimais()
  }, [mounted, viewMonth, viewYear])

  const loadActivities = async () => {
    try {
      setLoading(true)
      const saved = localStorage.getItem(STORAGE_ACTIVITIES)
      if (saved) setActivities(JSON.parse(saved))
    } catch (e) {
      console.error('Erro ao carregar atividades:', e)
    } finally {
      setLoading(false)
    }
  }

  const loadEventosAnimais = async () => {
    try {
      setEventosLoading(true)
      const res = await fetch(`/api/planejamento/agenda-eventos?mes=${viewMonth + 1}&ano=${viewYear}`)
      const data = await res.json()
      if (data.data) {
        setEventosAnimais(data.data)
      }
    } catch (e) {
      console.error('Erro ao carregar eventos:', e)
      setEventosAnimais({ brucelose: [], dgt: [], periodo: null })
    } finally {
      setEventosLoading(false)
    }
  }

  const handleAddActivity = () => {
    if (!newActivity.title.trim()) return
    const activity = { id: Date.now(), ...newActivity }
    const updated = [...activities, activity]
    setActivities(updated)
    localStorage.setItem(STORAGE_ACTIVITIES, JSON.stringify(updated))
    setNewActivity({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      priority: 'medium',
      status: 'pending'
    })
    setShowNewActivity(false)
  }

  const handleToggleActivity = (id) => {
    const updated = activities.map(a =>
      a.id === id ? { ...a, status: a.status === 'completed' ? 'pending' : 'completed' } : a
    )
    setActivities(updated)
    localStorage.setItem(STORAGE_ACTIVITIES, JSON.stringify(updated))
  }

  const handleAddCalendarLink = () => {
    if (!newCalendarLink.nome.trim() || !newCalendarLink.url.trim()) return
    const link = { id: Date.now(), ...newCalendarLink }
    const updated = [...calendarLinks, link]
    setCalendarLinks(updated)
    localStorage.setItem(STORAGE_CALENDAR_LINKS, JSON.stringify(updated))
    setNewCalendarLink({ nome: '', url: '' })
  }

  const handleRemoveCalendarLink = (id) => {
    const updated = calendarLinks.filter(l => l.id !== id)
    setCalendarLinks(updated)
    localStorage.setItem(STORAGE_CALENDAR_LINKS, JSON.stringify(updated))
  }

  const exportarParaExcel = (tipo) => {
    setExportando(true)
    try {
      const dados = tipo === 'brucelose' ? bruceloseFiltrado : dgtFiltrado
      const titulo = tipo === 'brucelose' 
        ? 'Vacina Brucelose - Fêmeas 3 a 8 meses' 
        : 'Avaliação DGT - Animais 330 a 640 dias'
      
      // Preparar dados para exportação
      const dadosExcel = dados.map(animal => ({
        'Série': animal.serie || '',
        'RG': animal.rg || '',
        'Sexo': animal.sexo || '',
        'Raça': animal.raca || '',
        'Data Nascimento': formatDate(animal.data_nascimento),
        'Idade (dias)': animal.idade_dias || 0,
        'Idade (meses)': Math.floor((animal.idade_dias || 0) / 30.44),
        'Peso (kg)': animal.peso || '-',
        'Piquete': animal.piquete || 'Não informado',
        'Evento': tipo === 'brucelose' ? 'Vacina Brucelose' : 'Avaliação DGT'
      }))

      // Criar workbook
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(dadosExcel)

      // Estilizar cabeçalho (largura das colunas)
      const colWidths = [
        { wch: 10 }, // Série
        { wch: 10 }, // RG
        { wch: 8 },  // Sexo
        { wch: 15 }, // Raça
        { wch: 15 }, // Data Nascimento
        { wch: 12 }, // Idade (dias)
        { wch: 12 }, // Idade (meses)
        { wch: 10 }, // Peso
        { wch: 20 }, // Piquete
        { wch: 20 }  // Evento
      ]
      ws['!cols'] = colWidths

      // Adicionar worksheet ao workbook
      XLSX.utils.book_append_sheet(wb, ws, tipo === 'brucelose' ? 'Brucelose' : 'DGT')

      // Gerar arquivo
      const nomeArquivo = `${titulo.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, nomeArquivo)

      alert(`✅ Arquivo exportado com sucesso: ${nomeArquivo}`)
    } catch (error) {
      console.error('Erro ao exportar:', error)
      alert('❌ Erro ao exportar arquivo. Tente novamente.')
    } finally {
      setExportando(false)
    }
  }

  const enviarPorEmail = async (tipo) => {
    if (!emailDestinatario.trim()) {
      alert('Por favor, informe um e-mail válido.')
      return
    }

    setEnviandoEmail(true)
    try {
      const dados = tipo === 'brucelose' ? bruceloseFiltrado : dgtFiltrado
      const titulo = tipo === 'brucelose' 
        ? 'Vacina Brucelose - Fêmeas 3 a 8 meses' 
        : 'Avaliação DGT - Animais 330 a 640 dias'

      const response = await fetch('/api/relatorios-envio/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinatario: emailDestinatario,
          assunto: `${titulo} - ${new Date().toLocaleDateString('pt-BR')}`,
          tipo: tipo === 'brucelose' ? 'agenda_brucelose' : 'agenda_dgt',
          dados: dados.map(animal => ({
            serie: animal.serie,
            rg: animal.rg,
            sexo: animal.sexo,
            raca: animal.raca,
            data_nascimento: formatDate(animal.data_nascimento),
            idade_dias: animal.idade_dias,
            idade_meses: Math.floor((animal.idade_dias || 0) / 30.44),
            peso: animal.peso,
            piquete: animal.piquete
          }))
        })
      })

      const result = await response.json()
      
      if (result.success) {
        alert(`✅ Relatório enviado com sucesso para ${emailDestinatario}`)
        setShowEmailModal(null)
        setEmailDestinatario('')
      } else {
        alert(`❌ Erro ao enviar e-mail: ${result.message || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error('Erro ao enviar e-mail:', error)
      alert('❌ Erro ao enviar e-mail. Verifique sua conexão e tente novamente.')
    } finally {
      setEnviandoEmail(false)
    }
  }

  const filteredActivities = activities.filter(a => a.date === selectedDate)
  const bruceloseFiltrado = eventosAnimais.brucelose || []
  const dgtFiltrado = eventosAnimais.dgt || []

  const navegarMes = (delta) => {
    let m = viewMonth + delta
    let y = viewYear
    if (m > 11) { m = 0; y++ }
    if (m < 0) { m = 11; y-- }
    setViewMonth(m)
    setViewYear(y)
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando agenda...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="h-8 w-8 text-blue-600" />
            Agenda de Atividades
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Cronograma unificado: atividades, vacina Brucelose (fêmeas 3-8 meses) e avaliação DGT (330-640 dias)
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/planejamento/agenda-mobile">
            <Button
              variant="secondary"
              className="flex items-center gap-2"
            >
              <DevicePhoneMobileIcon className="h-5 w-5" />
              Versão Mobile
            </Button>
          </Link>
          <Button
            variant="secondary"
            onClick={() => setShowCalendarLinks(true)}
            className="flex items-center gap-2"
          >
            <LinkIcon className="h-5 w-5" />
            Calendários Externos
          </Button>
          <Button onClick={() => setShowNewActivity(true)} className="flex items-center gap-2">
            <PlusIcon className="h-5 w-5" />
            Nova Atividade
          </Button>
        </div>
      </div>

      {/* Links para calendários externos */}
      {calendarLinks.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Calendários vinculados
          </h3>
          <div className="flex flex-wrap gap-2">
            {calendarLinks.map(link => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm"
              >
                {link.nome}
                <span className="text-xs">↗</span>
              </a>
            ))}
          </div>
        </Card>
      )}

      {/* Abas e Calendário */}
      <div className="flex gap-2 flex-wrap">
        {['todos', 'atividades', 'brucelose', 'dgt'].map(aba => (
          <button
            key={aba}
            onClick={() => setAbaAtiva(aba)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              abaAtiva === aba
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {aba === 'todos' && 'Todos'}
            {aba === 'atividades' && 'Atividades'}
            {aba === 'brucelose' && `Brucelose (${bruceloseFiltrado.length})`}
            {aba === 'dgt' && `DGT (${dgtFiltrado.length})`}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendário */}
        <Card className="p-4 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navegarMes(-1)}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {new Date(viewYear, viewMonth).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              onClick={() => navegarMes(1)}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </Card>

        {/* Lista de eventos */}
        <div className="lg:col-span-3 space-y-4">
          {/* Atividades manuais */}
          {(abaAtiva === 'todos' || abaAtiva === 'atividades') && filteredActivities.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <ClockIcon className="h-5 w-5" />
                Atividades para {formatDate(selectedDate)}
              </h4>
              {filteredActivities.map(activity => (
                <Card
                  key={activity.id}
                  className={`p-4 cursor-pointer transition-all ${
                    activity.status === 'completed' ? 'bg-gray-50 dark:bg-gray-800 opacity-60' : 'hover:shadow-lg'
                  }`}
                  onClick={() => handleToggleActivity(activity.id)}
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={activity.status === 'completed'}
                      onChange={() => handleToggleActivity(activity.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-5 h-5 text-blue-600 rounded mt-1"
                    />
                    <div className="flex-1">
                      <h3 className={`font-semibold ${activity.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                        {activity.title}
                      </h3>
                      {activity.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{activity.description}</p>}
                      <span className="text-xs text-gray-500 mt-2 block">{activity.time}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Brucelose */}
          {(abaAtiva === 'todos' || abaAtiva === 'brucelose') && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <ShieldCheckIcon className="h-5 w-5 text-amber-500" />
                  Vacina Brucelose – Fêmeas 3 a 8 meses (obrigatório)
                </h4>
                {bruceloseFiltrado.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => exportarParaExcel('brucelose')}
                      disabled={exportando}
                      className="flex items-center gap-1"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                      {exportando ? 'Exportando...' : 'Excel'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowEmailModal('brucelose')}
                      className="flex items-center gap-1"
                    >
                      <EnvelopeIcon className="h-4 w-4" />
                      E-mail
                    </Button>
                  </div>
                )}
              </div>
              {eventosLoading ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">Carregando...</p>
              ) : bruceloseFiltrado.length === 0 ? (
                <Card className="p-4">
                  <CheckCircleIcon className="h-10 w-10 text-green-600 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400 text-center text-sm">
                    Nenhuma fêmea elegível para Brucelose neste mês (3-8 meses, sem vacina prévia)
                  </p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {bruceloseFiltrado.map(animal => (
                    <Card
                      key={animal.id}
                      className="p-4 hover:shadow-lg cursor-pointer transition-all border-l-4 border-amber-500"
                      onClick={() => setAnimalSelecionado({ ...animal, tipo: 'brucelose' })}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-semibold text-gray-900 dark:text-white">{animal.serie}-{animal.rg}</span>
                          <span className="text-gray-600 dark:text-gray-400 ml-2">({animal.raca})</span>
                          <p className="text-sm text-gray-500 mt-1">
                            <MapPinIcon className="h-4 w-4 inline mr-1" />
                            {animal.piquete || 'Piquete não informado'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{Math.floor((animal.idade_dias || 0) / 30.44)} meses • {formatDate(animal.data_nascimento)}</p>
                        </div>
                        <Link
                          href={`/consulta-animal/${animal.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                        >
                          <EyeIcon className="h-4 w-4" />
                          Ver ficha
                        </Link>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DGT */}
          {(abaAtiva === 'todos' || abaAtiva === 'dgt') && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <ChartBarIcon className="h-5 w-5 text-emerald-500" />
                  Avaliação DGT – Animais 330 a 640 dias
                </h4>
                {dgtFiltrado.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => exportarParaExcel('dgt')}
                      disabled={exportando}
                      className="flex items-center gap-1"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                      {exportando ? 'Exportando...' : 'Excel'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowEmailModal('dgt')}
                      className="flex items-center gap-1"
                    >
                      <EnvelopeIcon className="h-4 w-4" />
                      E-mail
                    </Button>
                  </div>
                )}
              </div>
              {eventosLoading ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">Carregando...</p>
              ) : dgtFiltrado.length === 0 ? (
                <Card className="p-4">
                  <CheckCircleIcon className="h-10 w-10 text-green-600 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400 text-center text-sm">
                    Nenhum animal elegível para avaliação DGT neste mês (330-640 dias)
                  </p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {dgtFiltrado.map(animal => (
                    <Card
                      key={animal.id}
                      className="p-4 hover:shadow-lg cursor-pointer transition-all border-l-4 border-emerald-500"
                      onClick={() => setAnimalSelecionado({ ...animal, tipo: 'dgt' })}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-semibold text-gray-900 dark:text-white">{animal.serie}-{animal.rg}</span>
                          <span className="text-gray-600 dark:text-gray-400 ml-2">({animal.sexo} • {animal.raca})</span>
                          <p className="text-sm text-gray-500 mt-1">
                            <MapPinIcon className="h-4 w-4 inline mr-1" />
                            {animal.piquete || 'Piquete não informado'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{animal.idade_dias} dias ({Math.floor((animal.idade_dias || 0) / 30.44)} meses) • {formatDate(animal.data_nascimento)}</p>
                        </div>
                        <Link
                          href={`/consulta-animal/${animal.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                        >
                          <EyeIcon className="h-4 w-4" />
                          Ver ficha
                        </Link>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Mensagem vazia */}
          {abaAtiva === 'todos' &&
            filteredActivities.length === 0 &&
            bruceloseFiltrado.length === 0 &&
            dgtFiltrado.length === 0 &&
            !eventosLoading && (
              <Card className="p-8 text-center">
                <CheckCircleIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Nenhum evento para o mês selecionado. Adicione atividades ou verifique os animais elegíveis.
                </p>
              </Card>
            )}
        </div>
      </div>

      {/* Modal Nova Atividade */}
      {showNewActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Nova Atividade</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título *</label>
                <input
                  type="text"
                  value={newActivity.title}
                  onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                  placeholder="Ex: Vacinação do rebanho"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
                <textarea
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                  placeholder="Detalhes da atividade..."
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data</label>
                  <input
                    type="date"
                    value={newActivity.date}
                    onChange={(e) => setNewActivity({ ...newActivity, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hora</label>
                  <input
                    type="time"
                    value={newActivity.time}
                    onChange={(e) => setNewActivity({ ...newActivity, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prioridade</label>
                <select
                  value={newActivity.priority}
                  onChange={(e) => setNewActivity({ ...newActivity, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="secondary" onClick={() => setShowNewActivity(false)} className="flex-1">Cancelar</Button>
              <Button onClick={handleAddActivity} className="flex-1">Adicionar</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Calendários Externos */}
      {showCalendarLinks && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Vincular Calendários</h2>
              <button onClick={() => setShowCalendarLinks(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Adicione links para Google Calendar, Outlook ou outros calendários de compromissos.
            </p>
            <div className="space-y-4 mb-4">
              <input
                type="text"
                placeholder="Nome (ex: Google Calendar)"
                value={newCalendarLink.nome}
                onChange={(e) => setNewCalendarLink({ ...newCalendarLink, nome: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="url"
                placeholder="URL do calendário"
                value={newCalendarLink.url}
                onChange={(e) => setNewCalendarLink({ ...newCalendarLink, url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <Button onClick={handleAddCalendarLink} className="w-full">Adicionar link</Button>
            </div>
            {calendarLinks.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">Links salvos</h3>
                {calendarLinks.map(link => (
                  <div key={link.id} className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate flex-1">
                      {link.nome}
                    </a>
                    <button onClick={() => handleRemoveCalendarLink(link.id)} className="text-red-600 hover:text-red-800 ml-2">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Modal Detalhes do Animal */}
      {animalSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {animalSelecionado.serie}-{animalSelecionado.rg}
              </h2>
              <button onClick={() => setAnimalSelecionado(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-gray-500">Série:</span>
                <span className="font-medium">{animalSelecionado.serie}</span>
                <span className="text-gray-500">RG:</span>
                <span className="font-medium">{animalSelecionado.rg}</span>
                <span className="text-gray-500">Sexo:</span>
                <span className="font-medium">{animalSelecionado.sexo}</span>
                <span className="text-gray-500">Raça:</span>
                <span className="font-medium">{animalSelecionado.raca}</span>
                <span className="text-gray-500">Data nascimento:</span>
                <span className="font-medium">{formatDate(animalSelecionado.data_nascimento)}</span>
                <span className="text-gray-500">Idade:</span>
                <span className="font-medium">
                  {animalSelecionado.tipo === 'brucelose'
                    ? `${Math.floor((animalSelecionado.idade_dias || 0) / 30.44)} meses`
                    : `${animalSelecionado.idade_dias} dias (${Math.floor((animalSelecionado.idade_dias || 0) / 30.44)} meses)`}
                </span>
                <span className="text-gray-500">Peso:</span>
                <span className="font-medium">{animalSelecionado.peso ? `${animalSelecionado.peso} kg` : '-'}</span>
                <span className="text-gray-500">Piquete:</span>
                <span className="font-medium">{animalSelecionado.piquete || 'Não informado'}</span>
                <span className="text-gray-500">Evento:</span>
                <span className="font-medium">
                  {animalSelecionado.tipo === 'brucelose' ? 'Vacina Brucelose (3-8 meses)' : 'Avaliação DGT (330-640 dias)'}
                </span>
              </div>
              <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                <Link
                  href={`/consulta-animal/${animalSelecionado.id}`}
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                >
                  <EyeIcon className="h-5 w-5" />
                  Ver ficha completa do animal
                </Link>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Envio de E-mail */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 w-full max-w-md">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <EnvelopeIcon className="h-6 w-6 text-blue-600" />
                Enviar por E-mail
              </h2>
              <button onClick={() => { setShowEmailModal(null); setEmailDestinatario('') }} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Enviar relatório de {showEmailModal === 'brucelose' ? 'Vacina Brucelose' : 'Avaliação DGT'} com {showEmailModal === 'brucelose' ? bruceloseFiltrado.length : dgtFiltrado.length} animal(is).
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  E-mail do destinatário *
                </label>
                <input
                  type="email"
                  value={emailDestinatario}
                  onChange={(e) => setEmailDestinatario(e.target.value)}
                  placeholder="exemplo@email.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={enviandoEmail}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => { setShowEmailModal(null); setEmailDestinatario('') }}
                  className="flex-1"
                  disabled={enviandoEmail}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => enviarPorEmail(showEmailModal)}
                  className="flex-1"
                  disabled={enviandoEmail || !emailDestinatario.trim()}
                >
                  {enviandoEmail ? 'Enviando...' : 'Enviar'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
