import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const router = useRouter()
  const { user, loading, signIn, signUp, resetPassword } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberCreds, setRememberCreds] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = localStorage.getItem('beefsync-login-creds')
      if (!saved) return
      const data = JSON.parse(saved)
      if (data?.email) setEmail(data.email)
      if (data?.password) setPassword(data.password)
      if (typeof data?.remember === 'boolean') setRememberCreds(data.remember)
    } catch (_) {}
  }, [])

  const isLocalOrPrivateHost = () => {
    if (typeof window === 'undefined') return false
    const host = (window.location.hostname || '').toLowerCase()
    if (!host) return false
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return true
    if (host.startsWith('192.168.')) return true
    if (host.startsWith('10.')) return true
    const m172 = host.match(/^172\.(\d{1,3})\./)
    if (m172) {
      const secondOctet = Number(m172[1])
      if (secondOctet >= 16 && secondOctet <= 31) return true
    }
    return false
  }

  const resolveTargetPath = (currentUser) => {
    if (currentUser?.email === 'adelso@fazendasantanna.com.br') {
      return '/adelso-menu'
    }

    const role = currentUser?.user_metadata?.role || 'externo'
    const isExternalLocal = role === 'externo' && isLocalOrPrivateHost()

    // Usuário externo em localhost/rede interna:
    // sempre abre na tela principal (Dashboard).
    if (isExternalLocal) {
      return '/dashboard'
    }

    const redirectParam = typeof router.query?.redirect === 'string' ? router.query.redirect : ''
    if (redirectParam && redirectParam.startsWith('/')) {
      return redirectParam
    }

    // Em ambiente local/rede interna, usuário externo também pode operar no dashboard
    // (inclui/edita), mantendo restrições de exclusão pelo perfil.
    if (role === 'desenvolvedor') {
      return '/dashboard'
    }
    return '/a'
  }

  useEffect(() => {
    if (!loading && user) router.replace(resolveTargetPath(user))
  }, [user, loading, router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)
    try {
      if (mode === 'login') {
        const authData = await signIn(email, password)
        const signedUser = authData?.user || user
        if (typeof window !== 'undefined') {
          if (rememberCreds) {
            localStorage.setItem('beefsync-login-creds', JSON.stringify({
              email,
              password,
              remember: true,
            }))
          } else {
            localStorage.removeItem('beefsync-login-creds')
          }
        }
        router.replace(resolveTargetPath(signedUser))
      } else if (mode === 'register') {
        await signUp(email, password, { nome: name })
        setSuccess('Conta criada! Verifique seu e-mail para confirmar.')
        setMode('login')
      } else if (mode === 'reset') {
        await resetPassword(email)
        setSuccess('E-mail de recuperação enviado. Verifique sua caixa de entrada.')
        setMode('login')
      }
    } catch (err) {
      const messages = {
        'Invalid login credentials': 'E-mail ou senha incorretos',
        'Email not confirmed': 'E-mail ainda não confirmado. Verifique sua caixa de entrada.',
        'User already registered': 'Este e-mail já está cadastrado',
        'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
      }
      setError(messages[err.message] || err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a1628]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full" />
          <span className="text-blue-300/60 text-sm">Carregando...</span>
        </div>
      </div>
    )
  }

  if (user) return null

  return (
    <>
      <Head>
        <title>Login | Beef Sync</title>
      </Head>

      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-[#0a1628]">
        {/* Background decorativo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-800/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-900/5 rounded-full blur-3xl" />
          {/* Grid sutil */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="w-full max-w-sm relative z-10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-5">
              <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-xl scale-110" />
              <div className="relative bg-white rounded-2xl p-4 shadow-2xl shadow-black/40">
                <img
                  src="/logo-santanna.png.jpg"
                  alt="Fazendas Sant'Anna"
                  className="h-20 w-auto object-contain"
                />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Beef Sync</h1>
            <p className="text-blue-300/60 text-sm mt-1 font-medium tracking-wide uppercase">
              Sistema de Gestão Pecuária
            </p>
          </div>

          {/* Card */}
          <div className="bg-white/[0.06] backdrop-blur-2xl border border-white/10 rounded-2xl p-7 shadow-2xl shadow-black/40">
            <h2 className="text-lg font-semibold text-white mb-5">
              {mode === 'login' && 'Entrar na sua conta'}
              {mode === 'register' && 'Criar nova conta'}
              {mode === 'reset' && 'Recuperar senha'}
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-start gap-2">
                <span className="mt-0.5">⚠</span>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm flex items-start gap-2">
                <span className="mt-0.5">✓</span>
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-blue-200/50 mb-1.5 uppercase tracking-wider">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/40 transition-all text-sm"
                    placeholder="Seu nome completo"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-blue-200/50 mb-1.5 uppercase tracking-wider">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/40 transition-all text-sm"
                  placeholder="seu@email.com"
                />
              </div>

              {mode !== 'reset' && (
                <div>
                  <label className="block text-xs font-semibold text-blue-200/50 mb-1.5 uppercase tracking-wider">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/40 transition-all text-sm"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-blue-400 hover:text-white hover:bg-white/10 transition-colors"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPassword ? <EyeSlashIcon className="w-5 h-5" strokeWidth={2} /> : <EyeIcon className="w-5 h-5" strokeWidth={2} />}
                    </button>
                  </div>
                </div>
              )}

              {mode === 'login' && (
                <label className="flex items-center gap-2 text-xs text-blue-200/70 select-none">
                  <input
                    type="checkbox"
                    checked={rememberCreds}
                    onChange={(e) => setRememberCreds(e.target.checked)}
                    className="rounded border-white/30 bg-white/10 text-blue-500 focus:ring-blue-500/60"
                  />
                  Lembrar credenciais neste navegador
                </label>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 mt-1 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/25 hover:shadow-blue-500/35 text-sm"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Aguarde...
                  </span>
                ) : (
                  <>
                    {mode === 'login' && 'Entrar'}
                    {mode === 'register' && 'Criar conta'}
                    {mode === 'reset' && 'Enviar e-mail de recuperação'}
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 space-y-2 text-center text-sm">
              {mode === 'login' && (
                <>
                  <button
                    onClick={() => { setMode('reset'); setError(''); setSuccess('') }}
                    className="block w-full text-blue-400/80 hover:text-blue-300 transition-colors text-xs"
                  >
                    Esqueceu a senha?
                  </button>
                  <p className="text-white/20 text-xs pt-1">
                    Não tem conta?{' '}
                    <button
                      onClick={() => { setMode('register'); setError(''); setSuccess('') }}
                      className="text-blue-400/80 hover:text-blue-300 transition-colors font-medium"
                    >
                      Criar conta
                    </button>
                  </p>
                </>
              )}
              {(mode === 'register' || mode === 'reset') && (
                <button
                  onClick={() => { setMode('login'); setError(''); setSuccess('') }}
                  className="text-blue-400/80 hover:text-blue-300 transition-colors text-xs"
                >
                  ← Voltar para login
                </button>
              )}
            </div>
          </div>

          <p className="text-center text-white/15 text-xs mt-5">
            Beef Sync v3.0 &middot; Gestão Pecuária
          </p>
        </div>
      </div>
    </>
  )
}
