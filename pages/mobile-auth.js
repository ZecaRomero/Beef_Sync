import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { motion } from 'framer-motion'
import { 
  DevicePhoneMobileIcon, 
  UserIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline'

export default function MobileAuth() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isAdelso = nome.trim().toLowerCase() === 'adelso'

  useEffect(() => {
    const authData = localStorage.getItem('mobile-auth')
    if (authData) {
      try {
        const data = JSON.parse(authData)
        if (data.nome) {
          router.push('/a')
        }
      } catch (e) {
        console.error('Erro ao verificar autenticacao:', e)
      }
    }
  }, [router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!nome.trim()) {
      setError('Por favor, informe seu nome')
      return
    }

    // Se for Adelso, verificar senha
    if (isAdelso) {
      if (!senha.trim()) {
        setError('Por favor, informe a senha')
        return
      }
      // Verificar senha
      if (senha !== '123') {
        setError('Senha incorreta')
        return
      }
    }

    setLoading(true)

    try {
      const response = await fetch('/api/mobile-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem('mobile-auth', JSON.stringify({
          nome: nome.trim(),
          registeredAt: new Date().toISOString()
        }))
        
        // Se for Adelso, redireciona para o menu especial
        if (isAdelso) {
          router.push('/adelso-menu')
        } else {
          router.push('/a')
        }
      } else {
        setError(data.message || 'Erro ao registrar acesso')
      }
    } catch (err) {
      console.error('Erro ao registrar:', err)
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Acesso Mobile | Beef-Sync</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg mb-4"
            >
              <DevicePhoneMobileIcon className="h-10 w-10 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Bem-vindo ao Beef-Sync</h1>
            <p className="text-gray-600">Digite seu nome para acessar o sistema</p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl shadow-2xl p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="nome" className="block text-sm font-semibold text-gray-700 mb-2">
                  Nome
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="nome"
                    name="nome"
                    value={nome}
                    onChange={(e) => {
                      setNome(e.target.value)
                      setError('')
                    }}
                    placeholder="Digite seu nome"
                    className="block w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-gray-900"
                    disabled={loading}
                    autoFocus
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="words"
                    spellCheck="false"
                  />
                </div>
              </div>

              {/* Campo de senha - só aparece se for Adelso */}
              {isAdelso && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                >
                  <label htmlFor="senha" className="block text-sm font-semibold text-gray-700 mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      type={mostrarSenha ? 'text' : 'password'}
                      id="senha"
                      name="senha"
                      value={senha}
                      onChange={(e) => {
                        setSenha(e.target.value)
                        setError('')
                      }}
                      placeholder="Digite sua senha"
                      className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all pr-12 text-gray-900"
                      disabled={loading}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {mostrarSenha ? '🙈' : '👁️'}
                    </button>
                  </div>
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg"
                >
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Registrando...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-6 w-6" />
                    Continuar
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-xs text-gray-600 text-center">
                Suas informações serão usadas apenas para controle de acesso ao sistema.
              </p>
            </div>
          </motion.div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Beef-Sync {new Date().getFullYear()} - Sistema de Gestao Pecuaria
          </p>
        </motion.div>
      </div>
    </>
  )
}
