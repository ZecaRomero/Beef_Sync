import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  ClipboardDocumentListIcon,
  ChartBarIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

export default function AdelsoMenu() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar se está autenticado como Adelso
    const authData = localStorage.getItem('mobile-auth')
    if (!authData) {
      router.push('/mobile-auth')
      return
    }
    
    try {
      const data = JSON.parse(authData)
      if (data.nome?.toLowerCase() !== 'adelso') {
        // Se não for Adelso, redireciona para página normal
        router.push('/a')
        return
      }
      setLoading(false)
    } catch (e) {
      console.error('Erro ao verificar autenticação:', e)
      router.push('/mobile-auth')
    }
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Menu Adelso | Beef-Sync</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg mb-4"
            >
              <span className="text-4xl">👨‍💼</span>
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">Olá, Adelso!</h1>
            <p className="text-gray-400">Escolha uma opção para continuar</p>
          </div>

          {/* Menu Cards */}
          <div className="space-y-4">
            {/* Boletim de Defesa */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Link
                href="/boletim-defesa"
                className="block bg-gradient-to-br from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-xl">
                      <ClipboardDocumentListIcon className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">Boletim Campo</h2>
                      <p className="text-teal-100 text-sm">Gerenciar boletim de campo</p>
                    </div>
                  </div>
                  <ArrowRightIcon className="h-6 w-6 text-white/80" />
                </div>
              </Link>
            </motion.div>

            {/* Relatórios */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Link
                href="/mobile-relatorios"
                className="block bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-xl">
                      <ChartBarIcon className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">Relatórios</h2>
                      <p className="text-blue-100 text-sm">Visualizar relatórios do sistema</p>
                    </div>
                  </div>
                  <ArrowRightIcon className="h-6 w-6 text-white/80" />
                </div>
              </Link>
            </motion.div>
          </div>

          {/* Botão Sair */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <button
              onClick={() => {
                if (confirm('Deseja realmente sair?')) {
                  localStorage.removeItem('mobile-auth')
                  router.push('/mobile-auth')
                }
              }}
              className="w-full py-3 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-all"
            >
              Sair
            </button>
          </motion.div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Beef-Sync {new Date().getFullYear()} - Sistema de Gestão Pecuária
          </p>
        </motion.div>
      </div>
    </>
  )
}

// Desabilitar layout padrão
AdelsoMenu.getLayout = function getLayout(page) {
  return page
}
