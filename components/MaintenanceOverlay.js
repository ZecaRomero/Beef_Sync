import { useState, useEffect } from 'react'
import { WrenchScrewdriverIcon, NoSymbolIcon } from '@heroicons/react/24/outline'

export default function MaintenanceOverlay() {
  const [status, setStatus] = useState(null)
  const [mounted, setMounted] = useState(false)
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [loginData, setLoginData] = useState({ nome: '', telefone: '', lembrar: false })
  const [loginError, setLoginError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Carregar dados salvos se existirem
    const savedData = localStorage.getItem('maintenance_saved_data')
    if (savedData) {
      try {
        const data = JSON.parse(savedData)
        setLoginData(prev => ({ ...prev, nome: data.nome || '', telefone: data.telefone || '', lembrar: true }))
      } catch (e) {}
    }
  }, [])

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return
    const hostname = window.location.hostname
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'

    fetch('/api/system-settings')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          // Verificar se o session_token mudou (significa que todos foram deslogados)
          const maintenanceAuth = localStorage.getItem('maintenance_auth')
          const currentSessionToken = d.data.session_token
          
          if (maintenanceAuth) {
            try {
              const auth = JSON.parse(maintenanceAuth)
              
              // Se o token mudou, expirou (24h), ou não tem token salvo, invalidar login
              if (!auth.session_token ||
                  auth.session_token !== currentSessionToken || 
                  !auth.timestamp || 
                  (Date.now() - auth.timestamp > 24 * 60 * 60 * 1000)) {
                localStorage.removeItem('maintenance_auth')
                // Forçar mostrar tela de manutenção se o modo estiver ativo
                if (d.data.maintenance_mode && !isLocalhost) {
                  setStatus({
                    ...d.data,
                    isLocalhost
                  })
                  return
                }
              } else {
                // Login ainda válido - permitir acesso
                setStatus({ maintenance_mode: false, block_access: false, isLocalhost })
                return
              }
            } catch (e) {
              localStorage.removeItem('maintenance_auth')
            }
          }

          setStatus({
            ...d.data,
            isLocalhost
          })
        }
      })
      .catch(() => setStatus({ maintenance_mode: false, block_access: false, isLocalhost }))
  }, [mounted])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    
    if (!loginData.nome.trim()) {
      setLoginError('Nome é obrigatório')
      return
    }
    if (!loginData.telefone.trim()) {
      setLoginError('Telefone é obrigatório')
      return
    }

    setLoggingIn(true)
    try {
      // Verificar se usuário está banido ou em espera
      const phoneNorm = loginData.telefone.replace(/\D/g, '')
      const checkRes = await fetch(`/api/usuarios-restricoes?check=1&phone=${encodeURIComponent(phoneNorm)}`)
      const checkData = await checkRes.json()
      if (checkData.success && checkData.data) {
        if (checkData.data.banned) {
          setLoginError('Seu acesso foi bloqueado. Entre em contato com o administrador.')
          setLoggingIn(false)
          return
        }
        if (checkData.data.em_espera) {
          setLoginError('Seu acesso está pendente de aprovação. Aguarde a liberação do administrador.')
          setLoggingIn(false)
          return
        }
      }
      // Salvar dados se usuário marcou "lembrar"
      if (loginData.lembrar) {
        localStorage.setItem('maintenance_saved_data', JSON.stringify({
          nome: loginData.nome.trim(),
          telefone: loginData.telefone.trim()
        }))
      } else {
        localStorage.removeItem('maintenance_saved_data')
      }

      // Salvar autenticação com session_token
      const auth = {
        nome: loginData.nome.trim(),
        telefone: loginData.telefone.trim(),
        timestamp: Date.now(),
        session_token: status.session_token || Date.now().toString()
      }
      localStorage.setItem('maintenance_auth', JSON.stringify(auth))
      // Também salvar em beef_usuario_identificado para o overlay mobile não reaparecer
      localStorage.setItem('beef_usuario_identificado', JSON.stringify({
        nome: auth.nome,
        telefone: auth.telefone
      }))

      // Registrar acesso
      await fetch('/api/access-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: auth.nome,
          userType: 'Celular',
          ipAddress: 'N/A',
          hostname: window.location.hostname,
          userAgent: navigator.userAgent,
          telefone: auth.telefone,
          action: 'Login durante manutenção'
        })
      })

      // Recarregar página
      window.location.reload()
    } catch (e) {
      setLoginError('Erro ao fazer login. Tente novamente.')
      setLoggingIn(false)
    }
  }

  if (!mounted || !status) return null

  // Localhost sempre pode acessar (para desativar manutenção/bloqueio)
  const blocked = status.block_access && !status.isLocalhost
  const maintenance = status.maintenance_mode && !status.isLocalhost

  if (!blocked && !maintenance) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/95 backdrop-blur-sm p-4">
      <div className="max-w-md w-full mx-auto p-8 text-center bg-gray-800/50 rounded-2xl border border-gray-700">
        {blocked ? (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
              <NoSymbolIcon className="h-12 w-12 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Acesso bloqueado</h1>
            <p className="text-gray-400 mb-6">
              O uso do sistema está temporariamente bloqueado. Entre em contato com o administrador.
            </p>
          </>
        ) : showLoginForm ? (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/20 flex items-center justify-center">
              <WrenchScrewdriverIcon className="h-12 w-12 text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Acesso durante manutenção</h1>
            <p className="text-gray-400 mb-6 text-sm">
              Preencha seus dados para acessar o sistema
            </p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Nome completo <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={loginData.nome}
                  onChange={(e) => {
                    // Permitir apenas letras (incluindo acentuadas) e espaços
                    const value = e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '')
                    setLoginData(d => ({ ...d, nome: value }))
                  }}
                  placeholder="Digite seu nome"
                  className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  disabled={loggingIn}
                />
              </div>
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Telefone <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  value={loginData.telefone}
                  onChange={(e) => {
                    // Permitir apenas números e formatação básica
                    const value = e.target.value.replace(/[^\d\s\-\(\)]/g, '')
                    setLoginData(d => ({ ...d, telefone: value }))
                  }}
                  placeholder="(00) 00000-0000"
                  className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  disabled={loggingIn}
                />
              </div>
              <div className="flex items-center gap-2 text-left">
                <input
                  type="checkbox"
                  id="lembrar"
                  checked={loginData.lembrar}
                  onChange={(e) => setLoginData(d => ({ ...d, lembrar: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-amber-600 focus:ring-2 focus:ring-amber-500"
                  disabled={loggingIn}
                />
                <label htmlFor="lembrar" className="text-sm text-gray-300 cursor-pointer">
                  Lembrar meus dados para próximos acessos
                </label>
              </div>
              {loginError && (
                <p className="text-red-400 text-sm">{loginError}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowLoginForm(false)}
                  className="flex-1 px-4 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-semibold transition-colors"
                  disabled={loggingIn}
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-colors disabled:opacity-50"
                  disabled={loggingIn}
                >
                  {loggingIn ? 'Entrando...' : 'Entrar'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/20 flex items-center justify-center animate-pulse">
              <WrenchScrewdriverIcon className="h-12 w-12 text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Em atualização</h1>
            <p className="text-gray-400 mb-6">
              {status.maintenance_message || 'Sistema em manutenção. Volte em alguns minutos.'}
            </p>
            <button
              onClick={() => setShowLoginForm(true)}
              className="px-6 py-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-colors"
            >
              Preciso acessar agora
            </button>
          </>
        )}
        <p className="text-sm text-gray-500 mt-6">
          Beef-Sync • {new Date().toLocaleString('pt-BR')}
        </p>
      </div>
    </div>
  )
}
