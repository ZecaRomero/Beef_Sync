import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Head from 'next/head'
import {
  EyeIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  NoSymbolIcon,
  WrenchScrewdriverIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  UserCircleIcon,
  ClockIcon,
  CheckCircleIcon,
  SignalIcon
} from '@heroicons/react/24/outline'

// --- Helpers ---

function formatTelefone(telefone) {
  if (!telefone) return null
  if (telefone.length === 11) return telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  if (telefone.length === 10) return telefone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  return telefone
}

function normalizeReportKey(key) {
  return key === 'femeas_ia' ? 'inseminacoes' : key
}

function formatPresenceDuration(sec) {
  if (sec == null || sec < 0) return '-'
  const s = Math.floor(sec)
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)} min`
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return `${h}h ${m}min`
}

// --- Helpers de fetch ---
const fetchWithTimeout = (url, ms = 8000) => {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort('Timeout'), ms)
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(t))
}

// --- Sub-componentes ---

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <span className="animate-spin rounded-full h-12 w-12 border-2 border-amber-500 border-t-transparent" />
    </div>
  )
}

function MessageBanner({ message }) {
  if (!message) return null
  const isSuccess = message.includes('✅')
  const isError = message.includes('❌')
  const cls = isSuccess
    ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200'
    : isError
    ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200'
    : 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200'
  return (
    <div className={`mb-4 p-4 rounded-lg border-2 text-sm font-medium flex items-center gap-2 ${cls}`}>
      {message}
    </div>
  )
}

function Toggle({ checked, onChange, disabled, activeColor = 'bg-amber-600' }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
        checked ? activeColor : 'bg-gray-200 dark:bg-gray-600'
      }`}
    >
      <span className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`} />
    </button>
  )
}

function StatCard({ label, total, mobile, desktop }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">{label}</h3>
      <div className="flex items-center justify-between">
        <span className="text-3xl font-bold text-gray-900 dark:text-white">{total ?? 0}</span>
        <div className="text-right text-sm">
          <p className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 justify-end">
            <DevicePhoneMobileIcon className="h-4 w-4" /> {mobile ?? 0} celulares
          </p>
          <p className="text-blue-600 dark:text-blue-400 flex items-center gap-1 justify-end">
            <ComputerDesktopIcon className="h-4 w-4" /> {desktop ?? 0} desktop
          </p>
        </div>
      </div>
    </div>
  )
}

function TelefoneCell({ telefone }) {
  const formatted = formatTelefone(telefone)
  if (!formatted) return <span className="text-gray-400">-</span>
  return (
    <a href={`tel:${telefone}`} className="text-emerald-600 dark:text-emerald-400 hover:underline font-mono">
      {formatted}
    </a>
  )
}

// --- Componente principal ---

export default function AcessosSistema() {
  const [stats, setStats] = useState(null)
  const [logs, setLogs] = useState([])
  const [settings, setSettings] = useState(null)
  const [supabaseUsers, setSupabaseUsers] = useState([])
  const [restricoes, setRestricoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [mobileReportsDraft, setMobileReportsDraft] = useState(null)
  const [tiposRelatorios, setTiposRelatorios] = useState([])
  const [presence, setPresence] = useState(null)

  const mobileLogs = useMemo(() => logs.filter(log => log.is_mobile), [logs])

  const enabledReports = useMemo(() => {
    const raw = mobileReportsDraft ?? settings?.mobile_reports_enabled ?? []
    return [...new Set(raw.map(normalizeReportKey))]
  }, [mobileReportsDraft, settings?.mobile_reports_enabled])

  const allReportsSelected = tiposRelatorios.length > 0 &&
    tiposRelatorios.every(t => enabledReports.includes(t.key))

  const categories = useMemo(
    () => [...new Set(tiposRelatorios.map(t => t.category || 'Geral'))],
    [tiposRelatorios]
  )

  const showMessage = useCallback((msg, delay = 5000) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), delay)
  }, [])

  const loadData = useCallback(async () => {
    setRefreshing(true)
    try {
      const [statsRes, logsRes, settingsRes, usersRes, restricoesRes, presenceRes] = await Promise.all([
        fetchWithTimeout('/api/access-log?stats=true'),
        fetchWithTimeout('/api/access-log?limit=50'),
        fetchWithTimeout('/api/system-settings'),
        fetchWithTimeout('/api/supabase-users'),
        fetchWithTimeout('/api/usuarios-restricoes'),
        fetchWithTimeout('/api/presence'),
      ])
      if (statsRes.ok) {
        const d = await statsRes.json()
        if (d.success && d.data) setStats(d.data)
      }
      if (logsRes.ok) {
        const d = await logsRes.json()
        if (d.success && d.data) setLogs(d.data)
      }
      if (settingsRes.ok) {
        const d = await settingsRes.json()
        if (d.success && d.data) setSettings(d.data)
      }
      if (usersRes?.ok) {
        const d = await usersRes.json()
        if (d.success && Array.isArray(d.data)) setSupabaseUsers(d.data)
      } else {
        setSupabaseUsers([])
      }
      if (restricoesRes?.ok) {
        const d = await restricoesRes.json()
        if (d.success && Array.isArray(d.data)) setRestricoes(d.data)
      } else {
        setRestricoes([])
      }
      if (presenceRes?.ok) {
        const d = await presenceRes.json()
        const raw = d.data ?? d
        if (raw && (Array.isArray(raw.online) || raw.count != null)) setPresence(raw)
        else setPresence(null)
      } else {
        setPresence(null)
      }
    } catch (e) {
      if (e.name !== 'AbortError' && e !== 'Timeout') {
        console.error('Erro ao carregar:', e)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const loadTiposRelatorios = useCallback(async () => {
    try {
      const res = await fetch('/api/mobile-reports')
      if (res.ok) {
        const d = await res.json()
        const types = d?.data?.allTypes || d?.allTypes || []
        if (types.length > 0) setTiposRelatorios(types)
      }
    } catch (e) {
      console.error('Erro ao buscar tipos de relatórios:', e)
    }
  }, [])

  useEffect(() => {
    loadData()
    loadTiposRelatorios()
    const t = setInterval(loadData, 10000)
    return () => clearInterval(t)
  }, [loadData, loadTiposRelatorios])

  const updateSetting = useCallback(async (key, value) => {
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/system-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value })
      })
      const d = await res.json()
      if (d.success && d.data) {
        setSettings(d.data)
        if (key === 'maintenance_message') {
          showMessage('✅ Mensagem salva com sucesso! Já está visível no mobile.')
        } else if (key === 'mobile_reports_enabled') {
          showMessage('✅ Relatórios mobile atualizados!')
        } else if (key === 'maintenance_mode' && value) {
          showMessage('Modo manutenção ativado. Usuários verão a tela de atualização.')
        } else if (key === 'block_access' && value) {
          showMessage('Acesso bloqueado. Apenas localhost pode acessar.')
        } else {
          showMessage('Configuração atualizada.')
        }
      } else {
        showMessage('❌ Erro ao salvar.', 3000)
      }
    } catch {
      showMessage('❌ Erro ao salvar.', 3000)
    } finally {
      setSaving(false)
    }
  }, [showMessage])

  const handleLogoutAll = useCallback(async () => {
    if (!confirm('⚠️ Tem certeza? Todos os usuários mobile verão a tela de manutenção imediatamente e precisarão fazer login novamente.')) return
    setSaving(true)
    try {
      const res = await fetch('/api/system-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maintenance_mode: true, session_token: Date.now().toString() })
      })
      const d = await res.json()
      if (d.success && d.data) {
        setSettings(d.data)
        showMessage('✅ Modo manutenção ativado! Todos os celulares foram deslogados e precisarão fazer login novamente.')
      } else {
        showMessage('❌ Erro ao ativar modo manutenção.', 3000)
      }
    } catch {
      showMessage('❌ Erro ao ativar modo manutenção.', 3000)
    } finally {
      setSaving(false)
    }
  }, [showMessage])

  const handleToggleAll = useCallback(() => {
    const allKeys = tiposRelatorios.map(t => t.key)
    const current = mobileReportsDraft ?? settings?.mobile_reports_enabled ?? []
    const currentNormalized = current.map(normalizeReportKey)
    if (allReportsSelected) {
      setMobileReportsDraft(current.filter(k => !allKeys.includes(k) && k !== 'femeas_ia'))
    } else {
      const toAdd = allKeys.filter(k => !currentNormalized.includes(k))
      setMobileReportsDraft([...current, ...toAdd])
    }
  }, [tiposRelatorios, mobileReportsDraft, settings?.mobile_reports_enabled, allReportsSelected])

  const handleToggleReport = useCallback((key, checked) => {
    const current = mobileReportsDraft ?? settings?.mobile_reports_enabled ?? []
    const next = checked
      ? [...new Set([...current.filter(k => k !== 'femeas_ia'), key])]
      : current.filter(k => k !== key && k !== 'femeas_ia')
    setMobileReportsDraft(next)
  }, [mobileReportsDraft, settings?.mobile_reports_enabled])

  const handleSaveReports = useCallback(() => {
    const next = [...new Set((mobileReportsDraft ?? settings?.mobile_reports_enabled ?? []).map(normalizeReportKey))]
    updateSetting('mobile_reports_enabled', next)
    setMobileReportsDraft(null)
  }, [mobileReportsDraft, settings?.mobile_reports_enabled, updateSetting])

  const isRestrito = useCallback((identificador, valor) => {
    if (!valor) return null
    const v = identificador === 'phone' ? String(valor).replace(/\D/g, '') : String(valor).trim().toLowerCase()
    return restricoes.find(r => r.identificador === identificador && r.valor === v)
  }, [restricoes])

  const aplicarRestricao = useCallback(async (tipo, identificador, valor, label) => {
    if (!confirm(`Confirma ${tipo === 'banido' ? 'BANIR' : 'colocar em espera'} ${label || valor}?`)) return
    setSaving(true)
    try {
      const body = { tipo, identificador, valor: identificador === 'phone' ? String(valor).replace(/\D/g, '') : String(valor).trim().toLowerCase() }
      const res = await fetch('/api/usuarios-restricoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const d = await res.json()
      if (d.success) {
        showMessage(`✅ ${tipo === 'banido' ? 'Usuário banido' : 'Colocado em espera'}.`, 3000)
        loadData()
      } else {
        showMessage(`❌ ${d.message || 'Erro'}`, 3000)
      }
    } catch (e) {
      showMessage('❌ Erro ao aplicar restrição.', 3000)
    } finally {
      setSaving(false)
    }
  }, [showMessage, loadData])

  const removerRestricao = useCallback(async (id) => {
    if (!confirm('Remover esta restrição?')) return
    setSaving(true)
    try {
      const res = await fetch(`/api/usuarios-restricoes?id=${id}`, { method: 'DELETE' })
      const d = await res.json()
      if (d.success) {
        showMessage('✅ Restrição removida.', 3000)
        loadData()
      } else {
        showMessage(`❌ ${d.message || 'Erro'}`, 3000)
      }
    } catch (e) {
      showMessage('❌ Erro ao remover.', 3000)
    } finally {
      setSaving(false)
    }
  }, [showMessage, loadData])

  if (loading) return <LoadingSpinner />

  return (
    <>
      <Head>
        <title>Acessos ao Sistema | Beef-Sync</title>
      </Head>
      <div className="space-y-6">

        {/* Cabeçalho */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <EyeIcon className="h-8 w-8 text-violet-600 dark:text-violet-400" />
            Acessos ao Sistema
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Monitoramento de acessos, incluindo celular e desktop. Controle de bloqueio e manutenção.
          </p>
        </div>

        {/* Destaque: acessos por celular */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <DevicePhoneMobileIcon className="h-10 w-10 text-emerald-100" />
            <h3 className="text-lg font-semibold">Acessos por celular</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            {[
              { label: 'Hoje', period: stats?.hoje },
              { label: 'Esta semana', period: stats?.semana },
              { label: 'Este mês', period: stats?.mes },
            ].map(({ label, period }) => (
              <div key={label}>
                <p className="text-3xl font-bold">{period?.mobile ?? 0}</p>
                <p className="text-sm text-emerald-100">{label}</p>
                <p className="text-xs text-emerald-200">{period?.celulares_unicos ?? 0} celular(es) diferente(s)</p>
              </div>
            ))}
          </div>
        </div>

        {/* Estatísticas gerais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Hoje"       total={stats?.hoje?.total}   mobile={stats?.hoje?.mobile}   desktop={stats?.hoje?.desktop} />
          <StatCard label="Esta semana" total={stats?.semana?.total} mobile={stats?.semana?.mobile} desktop={stats?.semana?.desktop} />
          <StatCard label="Este mês"   total={stats?.mes?.total}    mobile={stats?.mes?.mobile}    desktop={stats?.mes?.desktop} />
        </div>

        {/* Sessões ativas (heartbeat) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <SignalIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Conectados agora
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Mostra quem tem o app aberto e enviou sinal nos últimos{' '}
              <strong>{presence?.staleSeconds ?? 120}s</strong>. O tempo na sessão é desde que a aba foi aberta
              (nova aba = nova linha). Quem só usa telas públicas sem login identificado não aparece aqui.
            </p>
          </div>
          <div className="overflow-x-auto">
            {!presence?.online?.length ? (
              <p className="p-6 text-sm text-gray-500 dark:text-gray-400 text-center">
                Ninguém com sessão ativa no momento — ou o heartbeat ainda não chegou (até ~45s após abrir o app).
              </p>
            ) : (
              <table className="w-full text-sm min-w-[860px]">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    {['Status', 'Usuário', 'Tipo', 'Telefone', 'Email', 'Tempo na sessão', 'Último ping', 'Página', 'Dispositivo'].map((col) => (
                      <th key={col} className="text-left px-4 py-2 text-gray-600 dark:text-gray-400 font-medium">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {presence.online.map((row) => (
                    <tr key={row.session_id} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="px-4 py-2">
                        <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          Online
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-900 dark:text-white font-medium">{row.user_name || '-'}</td>
                      <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{row.user_type || '-'}</td>
                      <td className="px-4 py-2"><TelefoneCell telefone={row.telefone} /></td>
                      <td className="px-4 py-2 text-gray-600 dark:text-gray-300 text-xs truncate max-w-[180px]" title={row.email || ''}>{row.email || '-'}</td>
                      <td className="px-4 py-2 text-gray-800 dark:text-gray-200 font-mono text-xs">{formatPresenceDuration(row.session_seconds)}</td>
                      <td className="px-4 py-2 text-gray-600 dark:text-gray-400 text-xs">
                        há {row.seconds_since_ping != null ? `${row.seconds_since_ping}s` : '-'}
                      </td>
                      <td className="px-4 py-2 text-gray-600 dark:text-gray-300 text-xs truncate max-w-[220px]" title={row.current_path || ''}>
                        {row.current_path || '-'}
                      </td>
                      <td className="px-4 py-2 text-gray-600 dark:text-gray-300 text-xs">
                        {row.is_mobile ? '📱 Mobile' : '🖥️ Desktop'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Controle de Acesso */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <NoSymbolIcon className="h-5 w-5 text-amber-600" />
            Controle de Acesso
          </h2>

          <MessageBanner message={message} />

          {/* Aviso de bloqueio ativo */}
          {settings?.block_access && (
            <div className="mb-4 p-4 rounded-lg border-2 border-red-500 bg-red-50 dark:bg-red-900/20 flex items-start gap-3">
              <NoSymbolIcon className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800 dark:text-red-200">Bloqueio ATIVO — usuarios mobile nao conseguem entrar!</p>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                  O "Bloquear uso do sistema" esta LIGADO. Apenas quem acessa pelo computador local (localhost) consegue entrar.
                  Usuarios de celular veem a tela de "Acesso bloqueado". Desligue abaixo para liberar.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Toggle: bloquear acesso */}
            <div className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
              settings?.block_access
                ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                : 'bg-gray-50 dark:bg-gray-700/50 border-transparent'
            }`}>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Bloquear uso do sistema
                  {settings?.block_access && <span className="ml-2 text-xs font-bold text-red-600 dark:text-red-400 uppercase">(ATIVO)</span>}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Impede todos os acessos externos (exceto localhost)</p>
              </div>
              <Toggle
                checked={!!settings?.block_access}
                onChange={() => updateSetting('block_access', !settings?.block_access)}
                disabled={saving}
                activeColor="bg-red-600"
              />
            </div>

            {/* Toggle: modo manutenção */}
            <div className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
              settings?.maintenance_mode
                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700'
                : 'bg-gray-50 dark:bg-gray-700/50 border-transparent'
            }`}>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Modo manutencao / Atualizacao
                  {settings?.maintenance_mode && <span className="ml-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase">(ATIVO)</span>}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Exibe tela de "Em atualizacao" para todos os usuarios</p>
              </div>
              <Toggle
                checked={!!settings?.maintenance_mode}
                onChange={() => updateSetting('maintenance_mode', !settings?.maintenance_mode)}
                disabled={saving}
                activeColor="bg-amber-600"
              />
            </div>

            {/* Mensagem de manutenção */}
            {settings?.maintenance_mode && (
              <div className="mt-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800">
                <label className="block text-sm font-semibold text-amber-900 dark:text-amber-200 mb-2">
                  📱 Mensagem exibida no mobile
                </label>
                <textarea
                  value={settings?.maintenance_message || ''}
                  onChange={(e) => setSettings(s => ({ ...s, maintenance_message: e.target.value }))}
                  placeholder="Sistema em manutenção. Volte em breve."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border-2 border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none font-medium"
                />
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    💡 Esta mensagem será exibida para todos os usuários
                  </p>
                  <button
                    onClick={() => updateSetting('maintenance_message', settings?.maintenance_message)}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? 'Salvando...' : '💾 Salvar mensagem'}
                  </button>
                </div>
              </div>
            )}

            {/* Relatórios visíveis no mobile */}
            <div className="mt-6 p-4 rounded-lg bg-teal-50 dark:bg-teal-900/20 border-2 border-teal-200 dark:border-teal-800">
              <div className="flex items-start gap-3">
                <ChartBarIcon className="h-6 w-6 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-teal-900 dark:text-teal-200 mb-1">Relatórios visíveis no mobile</p>
                  <p className="text-sm text-teal-700 dark:text-teal-300 mb-3">
                    Marque os relatórios que usuários mobile podem visualizar em /mobile-relatorios
                  </p>

                  <div className="flex justify-end mb-2">
                    <button
                      type="button"
                      onClick={handleToggleAll}
                      className="text-xs font-bold text-teal-700 hover:text-teal-900 dark:text-teal-400 dark:hover:text-teal-200 underline cursor-pointer"
                    >
                      {allReportsSelected ? 'Desmarcar todos' : 'Marcar todos'}
                    </button>
                  </div>

                  {tiposRelatorios.length === 0 && (
                    <p className="text-sm text-gray-500 italic">Carregando relatórios disponíveis...</p>
                  )}

                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {categories.map(cat => (
                      <div key={cat}>
                        <p className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-1">{cat}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pl-1">
                          {tiposRelatorios.filter(t => (t.category || 'Geral') === cat).map(t => (
                            <label key={t.key} className="flex items-center gap-2 cursor-pointer hover:bg-teal-100/50 dark:hover:bg-teal-900/30 rounded px-1 py-0.5">
                              <input
                                type="checkbox"
                                checked={enabledReports.includes(t.key)}
                                onChange={(e) => handleToggleReport(t.key, e.target.checked)}
                                className="w-4 h-4 rounded border-teal-600 text-teal-600 focus:ring-teal-500"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{t.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleSaveReports}
                    disabled={saving || mobileReportsDraft === null}
                    className="mt-3 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Salvando...' : 'Salvar relatórios mobile'}
                  </button>
                </div>
              </div>
            </div>

            {/* Classificação PMGZ */}
            <div className="mt-6 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <div className="text-2xl flex-shrink-0 mt-0.5">🏆</div>
                <div className="flex-1">
                  <p className="font-semibold text-amber-900 dark:text-amber-200 mb-1">Classificação de Animais no PMGZ</p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                    Exibe rankings de iABCZ, Peso e CE na página /mobile-animal
                  </p>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2"><strong>Rankings disponíveis:</strong></p>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                      <li>• Top 10 iABCZ (quanto maior, melhor)</li>
                      <li>• Top 10 Peso (maiores pesos registrados)</li>
                      <li>• Top 10 CE (maiores circunferências escrotais - machos)</li>
                    </ul>
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-400 italic">
                    ℹ️ Esta funcionalidade está sempre ativa no /mobile-animal. Os rankings são calculados automaticamente com base nos dados dos animais.
                  </p>
                </div>
              </div>
            </div>

            {/* Limpeza de logs */}
            <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600">
              <div className="flex items-start gap-3">
                <ArrowPathIcon className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-gray-800 dark:text-gray-200 mb-1">Limpeza de logs de acesso</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    O banco acumula registros de acesso do desenvolvimento local. Limpe para melhorar a performance.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={async () => {
                        if (!confirm('Remover todos os logs de localhost/desenvolvimento?')) return
                        setSaving(true)
                        try {
                          const r = await fetch('/api/access-log?tipo=localhost', { method: 'DELETE' })
                          const d = await r.json()
                          showMessage(`✅ ${d.data?.deleted || 0} registros de localhost removidos!`, 4000)
                          loadData()
                        } catch { showMessage('❌ Erro ao limpar', 3000) }
                        finally { setSaving(false) }
                      }}
                      disabled={saving}
                      className="px-3 py-2 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-sm font-medium disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <ArrowPathIcon className="h-4 w-4" />
                      Limpar logs de localhost
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm('Remover logs com mais de 90 dias?')) return
                        setSaving(true)
                        try {
                          const r = await fetch('/api/access-log', { method: 'DELETE' })
                          const d = await r.json()
                          showMessage(`✅ ${d.data?.deleted || 0} registros antigos removidos!`, 4000)
                          loadData()
                        } catch { showMessage('❌ Erro ao limpar', 3000) }
                        finally { setSaving(false) }
                      }}
                      disabled={saving}
                      className="px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 text-sm font-medium disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <ArrowPathIcon className="h-4 w-4" />
                      Remover &gt;90 dias
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Deslogar todos os celulares */}
            <div className="mt-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900 dark:text-red-200 mb-1">Deslogar todos os celulares</p>
                  <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                    Ativa o modo manutenção e força todos os usuários mobile a verem a tela de atualização. Use quando precisar fazer manutenção urgente.
                  </p>
                  <button
                    onClick={handleLogoutAll}
                    disabled={saving || settings?.maintenance_mode}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    <DevicePhoneMobileIcon className="h-5 w-5" />
                    {settings?.maintenance_mode ? '✓ Modo manutenção ativo' : '🚨 Deslogar todos os celulares'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Restrições ativas (banidos / em espera) */}
        {restricoes.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <NoSymbolIcon className="h-5 w-5 text-amber-600" />
                Restrições ativas ({restricoes.length})
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Usuários banidos ou em espera. Clique em &quot;Liberar&quot; para remover a restrição.
              </p>
            </div>
            <div className="p-4 overflow-x-auto">
              <div className="flex flex-wrap gap-2">
                {restricoes.map(r => (
                  <div key={r.id} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.tipo === 'banido' ? 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300' : 'bg-amber-200 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'}`}>
                      {r.tipo === 'banido' ? 'Banido' : 'Em espera'}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{r.identificador}: {r.valor}</span>
                    <button onClick={() => removerRestricao(r.id)} disabled={saving} className="px-2 py-1 rounded bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                      <CheckCircleIcon className="h-4 w-4 inline mr-0.5" /> Liberar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Usuários Supabase Auth */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <UserCircleIcon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                Usuários Supabase (Auth)
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Usuários cadastrados no Supabase Authentication (como na dashboard do Supabase)
              </p>
            </div>
            <button
              onClick={loadData}
              disabled={refreshing}
              className={`px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition-all disabled:opacity-50 flex items-center gap-2 ${refreshing ? 'animate-pulse' : ''}`}
            >
              <ArrowPathIcon className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            {supabaseUsers.length === 0 ? (
              <div className="p-8 text-center">
                <UserCircleIcon className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-medium mb-2">
                  Nenhum usuário encontrado ou Supabase não configurado.
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Configure SUPABASE_SERVICE_ROLE_KEY no .env para exibir os usuários.
                </p>
                <button
                  onClick={loadData}
                  className="mt-4 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition-colors"
                >
                  Verificar novamente
                </button>
              </div>
            ) : (
              <table className="w-full text-sm min-w-[700px]">
                <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                  <tr>
                    {['UID', 'Nome', 'Email', 'Telefone', 'Provedor', 'Criado em', 'Ações'].map(col => (
                      <th key={col} className="text-left px-4 py-2 text-gray-600 dark:text-gray-400">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {supabaseUsers.map((u) => {
                    const rEmail = isRestrito('email', u.email)
                    const rPhone = isRestrito('phone', u.phone)
                    const rUid = isRestrito('uid', u.id)
                    const rest = rEmail || rPhone || rUid
                    return (
                      <tr key={u.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="px-4 py-2 text-gray-500 dark:text-gray-400 font-mono text-xs truncate max-w-[180px]" title={u.id}>{u.id}</td>
                        <td className="px-4 py-2 text-gray-900 dark:text-white">
                          {rest && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${rest.tipo === 'banido' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'}`}>
                              {rest.tipo === 'banido' ? <NoSymbolIcon className="h-3.5 w-3.5" /> : <ClockIcon className="h-3.5 w-3.5" />}
                              {rest.tipo === 'banido' ? 'Banido' : 'Em espera'}
                            </span>
                          )}
                          {u.display_name || '-'}
                        </td>
                        <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">{u.email || '-'}</td>
                        <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{u.phone || '-'}</td>
                        <td className="px-4 py-2 text-gray-600 dark:text-gray-400 capitalize">{Array.isArray(u.providers) ? u.providers.join(', ') : 'email'}</td>
                        <td className="px-4 py-2 text-gray-500 dark:text-gray-500 whitespace-nowrap">
                          {u.created_at ? new Date(u.created_at).toLocaleString('pt-BR') : '-'}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-1 flex-wrap">
                            {!rEmail && u.email && (
                              <button onClick={() => aplicarRestricao('banido', 'email', u.email, u.email)} disabled={saving} className="px-2 py-1 rounded bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 text-xs font-medium" title="Banir por email">Banir</button>
                            )}
                            {!rUid && u.id && (
                              <button onClick={() => aplicarRestricao('banido', 'uid', u.id, u.email)} disabled={saving} className="px-2 py-1 rounded bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 text-xs font-medium" title="Banir por ID">Banir</button>
                            )}
                            {!rest && (u.email || u.phone) && (
                              <button onClick={() => aplicarRestricao('em_espera', u.email ? 'email' : 'phone', u.email || u.phone, u.email || u.phone)} disabled={saving} className="px-2 py-1 rounded bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-xs font-medium" title="Colocar em espera">Em espera</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Quem conectou (acessos recentes - mobile e desktop) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <UserCircleIcon className="h-5 w-5 text-emerald-600" />
                Quem conectou (acessos recentes)
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Celulares e desktop • Quem fizer login durante manutenção aparece com nome e telefone • Atualiza a cada 10s
              </p>
            </div>
            <button
              onClick={loadData}
              disabled={refreshing}
              className={`px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all disabled:opacity-50 flex items-center gap-2 ${refreshing ? 'animate-pulse' : ''}`}
            >
              <ArrowPathIcon className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            {logs.length === 0 ? (
              <div className="p-8 text-center">
                <UserCircleIcon className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-medium mb-2">Nenhum acesso registrado ainda.</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Quando alguém acessar (celular ou desktop), aparecerá aqui automaticamente.
                </p>
                <button
                  onClick={loadData}
                  className="mt-4 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors"
                >
                  Verificar novamente
                </button>
              </div>
            ) : (
              <table className="w-full text-sm min-w-[950px]">
                <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                  <tr>
                    {['Usuário', 'Telefone', 'Tipo', 'IP', 'Browser', 'Sistema', 'Aparelho', 'Data/Hora', 'Ações'].map(col => (
                      <th key={col} className="text-left px-4 py-2 text-gray-600 dark:text-gray-400">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const rPhone = isRestrito('phone', log.telefone)
                    const rIp = isRestrito('ip', log.ip_address || log.hostname)
                    const rest = rPhone || rIp
                    const label = log.user_name || log.telefone || log.ip_address || '-'
                    return (
                      <tr key={log.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">
                          {rest && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium mr-1 ${rest.tipo === 'banido' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'}`}>
                              {rest.tipo === 'banido' ? <NoSymbolIcon className="h-3.5 w-3.5" /> : <ClockIcon className="h-3.5 w-3.5" />}
                              {rest.tipo === 'banido' ? 'Banido' : 'Em espera'}
                            </span>
                          )}
                          {log.user_name}
                        </td>
                        <td className="px-4 py-2"><TelefoneCell telefone={log.telefone} /></td>
                        <td className="px-4 py-2">
                          {log.is_mobile ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <DevicePhoneMobileIcon className="h-4 w-4" /> Celular
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">
                              <ComputerDesktopIcon className="h-4 w-4" /> Desktop
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-gray-600 dark:text-gray-400 font-mono text-xs">{log.ip_address || log.hostname || '-'}</td>
                        <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{log.browser || '-'}</td>
                        <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{log.os || '-'}</td>
                        <td className="px-4 py-2 text-gray-600 dark:text-gray-400" title={log.user_agent}>{log.device || '-'}</td>
                        <td className="px-4 py-2 text-gray-500 dark:text-gray-500 whitespace-nowrap">
                          {log.access_time ? new Date(log.access_time).toLocaleString('pt-BR') : '-'}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-1 flex-wrap">
                            {!rPhone && log.telefone && (
                              <button onClick={() => aplicarRestricao('banido', 'phone', log.telefone, label)} disabled={saving} className="px-2 py-1 rounded bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 text-xs font-medium" title="Banir por telefone">Banir</button>
                            )}
                            {!rIp && (log.ip_address || log.hostname) && (
                              <button onClick={() => aplicarRestricao('banido', 'ip', log.ip_address || log.hostname, label)} disabled={saving} className="px-2 py-1 rounded bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 text-xs font-medium" title="Banir por IP">Banir</button>
                            )}
                            {!rest && (log.telefone || log.ip_address || log.hostname) && (
                              <button onClick={() => aplicarRestricao('em_espera', log.telefone ? 'phone' : 'ip', log.telefone || log.ip_address || log.hostname, label)} disabled={saving} className="px-2 py-1 rounded bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-xs font-medium" title="Colocar em espera">Em espera</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Debug: informações completas (apenas em desenvolvimento) */}
        {process.env.NODE_ENV !== 'production' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-amber-200 dark:border-amber-700 overflow-hidden">
            <div className="p-4 border-b border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20">
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <WrenchScrewdriverIcon className="h-5 w-5 text-amber-600" />
                Debug: Acessos Mobile Completos
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                Mostra TODOS os celulares detectados com informações completas do User-Agent
              </p>
            </div>
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              {mobileLogs.length === 0 ? (
                <div className="p-8 text-center">
                  <DevicePhoneMobileIcon className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhum acesso mobile detectado</p>
                </div>
              ) : (
                <table className="w-full text-sm min-w-[900px]">
                  <thead className="bg-amber-50 dark:bg-amber-900/20 sticky top-0">
                    <tr>
                      {['Usuário', 'Telefone', 'IP/Host', 'Browser', 'Sistema', 'Aparelho', 'User-Agent', 'Data/Hora'].map(col => (
                        <th key={col} className="text-left px-4 py-2 text-gray-600 dark:text-gray-400">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mobileLogs.map((log) => (
                      <tr key={`debug-${log.id}`} className="border-t border-amber-100 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/10">
                        <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">{log.user_name}</td>
                        <td className="px-4 py-2"><TelefoneCell telefone={log.telefone} /></td>
                        <td className="px-4 py-2 text-gray-600 dark:text-gray-400 font-mono text-xs">{log.ip_address || log.hostname || '-'}</td>
                        <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{log.browser || '-'}</td>
                        <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{log.os || '-'}</td>
                        <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{log.device || '-'}</td>
                        <td className="px-4 py-2 text-gray-500 dark:text-gray-500 text-xs max-w-xs truncate" title={log.user_agent}>{log.user_agent || '-'}</td>
                        <td className="px-4 py-2 text-gray-500 dark:text-gray-500 whitespace-nowrap">
                          {log.access_time ? new Date(log.access_time).toLocaleString('pt-BR') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

      </div>
    </>
  )
}
