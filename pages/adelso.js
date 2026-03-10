/**
 * Página de entrada do usuário Adelso.
 * Login com senha (temporária 123) e escolha: Relatórios ou Boletim.
 */
import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { ChartBarIcon, DocumentTextIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'

const STORAGE_KEY = 'beef_adelso_auth'

export default function AdelsoPage() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [autenticado, setAutenticado] = useState(false)
  const [mostrarTrocarSenha, setMostrarTrocarSenha] = useState(false)
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmaSenha, setConfirmaSenha] = useState('')
  const [senhaAtual, setSenhaAtual] = useState('')

  useEffect(() => {
    const auth = localStorage.getItem(STORAGE_KEY)
    if (auth) {
      try {
        const data = JSON.parse(auth)
        if (data.nome === 'Adelso' && data.expiresAt > Date.now()) {
          setAutenticado(true)
        }
      } catch (_) {}
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    if (!nome.trim()) {
      setError('Informe o nome')
      return
    }
    if (nome.trim().toLowerCase() !== 'adelso') {
      setError('Usuário não encontrado. Use "Adelso".')
      return
    }
    if (!senha) {
      setError('Informe a senha')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/boletim-campo/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nome.trim(), senha })
      })
      const json = await res.json()

      if (json.success) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          nome: 'Adelso',
          expiresAt: Date.now() + 24 * 60 * 60 * 1000
        }))
        setAutenticado(true)
      } else {
        setError(json.message || 'Senha incorreta')
      }
    } catch (err) {
      setError('Erro ao conectar')
    } finally {
      setLoading(false)
    }
  }

  const handleEscolha = (opcao) => {
    if (opcao === 'relatorios') {
      try {
        localStorage.setItem('beef_usuario_identificado', JSON.stringify({ nome: 'Adelso' }))
        localStorage.setItem('mobile-auth', JSON.stringify({ nome: 'Adelso', telefone: '', registeredAt: new Date().toISOString() }))
      } catch (_) {}
      router.push('/a')
    } else {
      try {
        localStorage.setItem('beef_usuario_identificado', JSON.stringify({ nome: 'Adelso' }))
        localStorage.setItem('mobile-auth', JSON.stringify({ nome: 'Adelso', telefone: '', registeredAt: new Date().toISOString() }))
      } catch (_) {}
      router.push('/boletim-defesa')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setAutenticado(false)
    setSenha('')
  }

  if (autenticado) {
    return (
      <>
        <Head>
          <title>Adelso - Beef-Sync</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>

        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Olá, Adelso!</h1>
              <p className="text-gray-600 dark:text-gray-400">Para onde deseja ir?</p>
            </div>

            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleEscolha('relatorios')}
                className="w-full flex items-center gap-4 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-teal-200 dark:border-teal-800 hover:border-teal-500 dark:hover:border-teal-500 transition-all"
              >
                <div className="w-14 h-14 rounded-xl bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center">
                  <ChartBarIcon className="w-8 h-8 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="text-left flex-1">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Relatórios</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Acessar relatórios e dashboard do app</p>
                </div>
                <span className="text-teal-500">→</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleEscolha('boletim')}
                className="w-full flex items-center gap-4 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-orange-200 dark:border-orange-800 hover:border-orange-500 dark:hover:border-orange-500 transition-all"
              >
                <div className="w-14 h-14 rounded-xl bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                  <DocumentTextIcon className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="text-left flex-1">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Boletim Campo</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Importar/exportar Excel e alterar quantidades</p>
                </div>
                <span className="text-orange-500">→</span>
              </motion.button>
            </div>

            <button
              onClick={() => setMostrarTrocarSenha(true)}
              className="mt-4 text-sm text-teal-600 dark:text-teal-400 hover:underline"
            >
              Trocar senha
            </button>

            <button
              onClick={handleLogout}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-400"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              Sair
            </button>
          </motion.div>
        </div>
      </>
    )
  }

  const handleTrocarSenha = async (e) => {
    e.preventDefault()
    if (novaSenha.length < 3) {
      setError('Senha deve ter pelo menos 3 caracteres')
      return
    }
    if (novaSenha !== confirmaSenha) {
      setError('As senhas não coincidem')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/boletim-campo/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: 'Adelso',
          senha: senhaAtual,
          novaSenha,
          acao: 'trocar_senha'
        })
      })
      const json = await res.json()
      if (json.success) {
        setMostrarTrocarSenha(false)
        setNovaSenha('')
        setConfirmaSenha('')
        setSenhaAtual('')
      } else {
        setError(json.message || 'Senha atual incorreta')
      }
    } catch (err) {
      setError('Erro ao trocar senha')
    } finally {
      setLoading(false)
    }
  }

  if (autenticado && mostrarTrocarSenha) {
    return (
      <>
        <Head><title>Trocar Senha - Adelso</title></Head>
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Trocar senha</h2>
            <form onSubmit={handleTrocarSenha} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Senha atual</label>
                <input
                  type="password"
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Nova senha</label>
                <input
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  required
                  minLength={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Confirmar nova senha</label>
                <input
                  type="password"
                  value={confirmaSenha}
                  onChange={(e) => setConfirmaSenha(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <button type="submit" disabled={loading} className="flex-1 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
                  Salvar
                </button>
                <button type="button" onClick={() => { setMostrarTrocarSenha(false); setError('') }} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg">
                  Voltar
                </button>
              </div>
            </form>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Login Adelso - Beef-Sync</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8"
        >
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Acesso Adelso</h1>
            <p className="text-gray-600 dark:text-gray-400">Informe sua senha para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Adelso"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-500">Senha temporária: 123 (você pode alterar depois)</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500">
            O desenvolvedor tem acesso para resetar sua senha caso necessário.
          </p>
        </motion.div>
      </div>
    </>
  )
}
