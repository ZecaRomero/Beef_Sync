/**
 * Página de entrada do usuário Adelso.
 * Login simplificado - autentica via localStorage e redireciona direto.
 */
import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { ChartBarIcon, DocumentTextIcon } from '@heroicons/react/24/outline'

export default function AdelsoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      localStorage.setItem('beef_adelso_auth', JSON.stringify({
        nome: 'Adelso',
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      }))
      localStorage.setItem('beef_usuario_identificado', JSON.stringify({ nome: 'Adelso' }))
      localStorage.setItem('mobile-auth', JSON.stringify({ nome: 'Adelso', telefone: '', registeredAt: new Date().toISOString() }))
    } catch (_) {}
    setLoading(false)
  }, [])

  const handleEscolha = (opcao) => {
    if (opcao === 'relatorios') {
      router.push('/a')
    } else {
      router.push('/boletim-defesa')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Adelso - Beef-Sync</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-1">Olá, Adelso!</h1>
            <p className="text-gray-400">Para onde deseja ir?</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => handleEscolha('relatorios')}
              className="w-full flex items-center gap-4 p-6 bg-gray-800 rounded-2xl shadow-lg border-2 border-teal-800 hover:border-teal-500 transition-all"
            >
              <div className="w-14 h-14 rounded-xl bg-teal-900/50 flex items-center justify-center">
                <ChartBarIcon className="w-8 h-8 text-teal-400" />
              </div>
              <div className="text-left flex-1">
                <h2 className="text-lg font-bold text-white">Relatórios</h2>
                <p className="text-sm text-gray-400">Acessar relatórios e dashboard do app</p>
              </div>
              <span className="text-teal-500 text-xl">→</span>
            </button>

            <button
              onClick={() => handleEscolha('boletim')}
              className="w-full flex items-center gap-4 p-6 bg-gray-800 rounded-2xl shadow-lg border-2 border-orange-800 hover:border-orange-500 transition-all"
            >
              <div className="w-14 h-14 rounded-xl bg-orange-900/50 flex items-center justify-center">
                <DocumentTextIcon className="w-8 h-8 text-orange-400" />
              </div>
              <div className="text-left flex-1">
                <h2 className="text-lg font-bold text-white">Boletim Campo</h2>
                <p className="text-sm text-gray-400">Importar/exportar Excel e alterar quantidades</p>
              </div>
              <span className="text-orange-500 text-xl">→</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
