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

  useEffect(() => {
    if (!loading && user) {
      router.replace('/')
    }
  }, [user, loading, router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      if (mode === 'login') {
        await signIn(email, password)
        router.replace('/')
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (user) return null

  return (
    <>
      <Head>
        <title>Login | Beef Sync</title>
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-8">
              <div className="bg-white p-6 rounded-3xl shadow-2xl shadow-black/30 transform hover:scale-105 transition-transform duration-300">
                <img 
                  src="/logo-santanna.png.jpg" 
                  alt="Sant Anna" 
                  className="h-32 object-contain"
                />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Beef Sync</h1>
            <p className="text-blue-200/80 font-medium">Sistema de Gestão Pecuária</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-xl font-semibold text-white mb-6">
              {mode === 'login' && 'Entrar'}
              {mode === 'register' && 'Criar conta'}
              {mode === 'reset' && 'Recuperar senha'}
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-300 text-sm">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-blue-200/70 mb-1">Nome</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="Seu nome"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-blue-200/70 mb-1">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="seu@email.com"
                />
              </div>

              {mode !== 'reset' && (
                <div>
                  <label className="block text-sm font-medium text-blue-200/70 mb-1">Senha</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/50 hover:text-white/80 transition"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 disabled:cursor-not-allowed"
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

            <div className="mt-6 space-y-2 text-center text-sm">
              {mode === 'login' && (
                <>
                  <button onClick={() => { setMode('reset'); setError(''); setSuccess('') }} className="text-blue-400 hover:text-blue-300 transition">
                    Esqueceu a senha?
                  </button>
                  <div className="text-white/30">
                    Não tem conta?{' '}
                    <button onClick={() => { setMode('register'); setError(''); setSuccess('') }} className="text-blue-400 hover:text-blue-300 transition">
                      Criar conta
                    </button>
                  </div>
                </>
              )}
              {(mode === 'register' || mode === 'reset') && (
                <button onClick={() => { setMode('login'); setError(''); setSuccess('') }} className="text-blue-400 hover:text-blue-300 transition">
                  Voltar para login
                </button>
              )}
            </div>
          </div>

          <p className="text-center text-white/20 text-xs mt-6">
            Beef Sync v3.0 &middot; Gestão Pecuária
          </p>
        </div>
      </div>
    </>
  )
}
