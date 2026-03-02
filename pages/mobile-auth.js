import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { motion } from 'framer-motion'
import { 
  DevicePhoneMobileIcon, 
  UserIcon, 
  PhoneIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline'

export default function MobileAuth() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const authData = localStorage.getItem('mobile-auth')
    if (authData) {
      try {
        const data = JSON.parse(authData)
        if (data.nome && data.telefone) {
          router.push('/a')
        }
      } catch (e) {
        console.error('Erro ao verificar autenticacao:', e)
      }
    }
  }, [router])

  const formatarTelefone = (valor) => {
    const numeros = valor.replace(/\D/g, '')
    if (numeros.length <= 10) {
      return numeros.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
    } else {
      return numeros.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
    }
  }

  const handleTelefoneChange = (e) => {
    const formatted = formatarTelefone(e.target.value)
    setTelefone(formatted)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!nome.trim()) {
      setError('Por favor, informe seu nome')
      return
    }

    const telefoneLimpo = telefone.replace(/\D/g, '')
    if (telefoneLimpo.length < 10) {
      setError('Por favor, informe um telefone valido')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/mobile-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          telefone: telefoneLimpo,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem('mobile-auth', JSON.stringify({
          nome: nome.trim(),
          telefone: telefoneLimpo,
          registeredAt: new Date().toISOString()
        }))
        router.push('/a')
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
            <p className="text-gray-600">Para continuar, precisamos de algumas informacoes</p>
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
                  Nome Completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Digite seu nome"
                    className="block w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="telefone" className="block text-sm font-semibold text-gray-700 mb-2">
                  Telefone/WhatsApp
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    id="telefone"
                    value={telefone}
                    onChange={handleTelefoneChange}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    className="block w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    disabled={loading}
                  />
                </div>
              </div>

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
                Suas informacoes serao usadas apenas para controle de acesso e comunicacao sobre o sistema.
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
