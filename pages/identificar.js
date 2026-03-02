/**
 * Identificação para monitoramento de acessos
 * Usuário informa nome e telefone para aparecer no painel de acessos
 */
import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { UserCircleIcon, DevicePhoneMobileIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

const STORAGE_KEY = 'beef_usuario_identificado' // localStorage para persistir entre sessões

function formatPhone(v) {
  const digits = String(v).replace(/\D/g, '')
  if (digits.length <= 2) return digits ? `(${digits}` : ''
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

export default function Identificar() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [salvo, setSalvo] = useState(false)
  const [jaIdentificado, setJaIdentificado] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const { nome: n, telefone: t } = JSON.parse(stored)
        setNome(n || '')
        setTelefone(t || '')
        setJaIdentificado(true)
      }
    } catch (_) {}
  }, [])

  const handleTelefoneChange = (e) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 11)
    setTelefone(formatPhone(v))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const telDigits = telefone.replace(/\D/g, '')
    if (!nome.trim()) {
      alert('Informe seu nome.')
      return
    }
    if (telDigits.length < 10) {
      alert('Informe um telefone válido (com DDD).')
      return
    }
    try {
      const nomeTrim = nome.trim()
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        nome: nomeTrim,
        telefone: telDigits
      }))
      // Registrar acesso com nome e telefone para aparecer no monitoramento
      try {
        await fetch('/api/access-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userName: nomeTrim,
            userType: 'externo',
            ipAddress: typeof window !== 'undefined' ? window.location.hostname : 'N/A',
            hostname: typeof window !== 'undefined' ? window.location.hostname : '',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
            telefone: telDigits,
            action: 'Identificação registrada'
          })
        })
      } catch (_) {}
      setSalvo(true)
      setTimeout(() => {
        const from = router.query.from || '/a'
        router.push(from)
      }, 1500)
    } catch (_) {
      alert('Erro ao salvar.')
    }
  }

  const handleLimpar = () => {
    localStorage.removeItem(STORAGE_KEY)
    setNome('')
    setTelefone('')
    setJaIdentificado(false)
  }

  return (
    <>
      <Head>
        <title>Identificar-se | Beef-Sync</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <UserCircleIcon className="h-10 w-10 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Identificar-se</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Apareça no monitor de acessos com seu telefone
                </p>
              </div>
            </div>

            {salvo ? (
              <div className="text-center py-8">
                <CheckCircleIcon className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-900 dark:text-white">Identificação salva!</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Seus próximos acessos aparecerão com seu nome e telefone no painel.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone (com DDD)</label>
                  <input
                    type="tel"
                    value={telefone}
                    onChange={handleTelefoneChange}
                    placeholder="(11) 99999-9999"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                    inputMode="numeric"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center justify-center gap-2"
                >
                  <DevicePhoneMobileIcon className="h-5 w-5" />
                  Salvar e continuar
                </button>
                {jaIdentificado && (
                  <button
                    type="button"
                    onClick={handleLimpar}
                    className="w-full py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    Limpar identificação
                  </button>
                )}
              </form>
            )}
          </div>

          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
            Seus dados são usados apenas para exibir no painel de acessos do administrador.
          </p>

          <Link
            href="/a"
            className="block text-center mt-6 text-amber-600 dark:text-amber-400 font-medium hover:underline"
          >
            ← Voltar para consulta
          </Link>
        </div>
      </div>
    </>
  )
}
