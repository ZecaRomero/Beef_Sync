import React, { useEffect } from 'react'
import { useRouter } from 'next/router'
import { DocumentTextIcon, ArrowRightIcon, CurrencyDollarIcon, TruckIcon } from '../../components/ui/Icons'

export default function VendasRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirecionar automaticamente apÃ³s 5 segundos
    const timer = setTimeout(() => {
      router.push('/notas-fiscais')
    }, 5000)

    return () => clearTimeout(timer)
  }, [router])

  const handleRedirect = () => {
    router.push('/notas-fiscais')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
        {/* Ã�cone principal */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <DocumentTextIcon className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
              <ArrowRightIcon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        {/* TÃ­tulo */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Vendas Integradas Ã s Notas Fiscais
        </h1>

        {/* DescriÃ§Ã£o */}
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
          O controle de vendas agora estÃ¡ integrado ao sistema de <strong>Notas Fiscais</strong>. 
          As vendas sÃ£o registradas como <strong>Notas Fiscais de SaÃ­da</strong>, proporcionando 
          melhor controle fiscal e organizacional.
        </p>

        {/* Cards informativos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-6 border border-green-200 dark:border-green-800">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <TruckIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">SaÃ­das = Vendas</h3>
            <p className="text-sm text-green-700 dark:text-green-300">
              Registre suas vendas como Notas Fiscais de SaÃ­da para controle fiscal completo
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <CurrencyDollarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Controle Unificado</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Entradas e saÃ­das em um sÃ³ lugar, com relatÃ³rios fiscais automÃ¡ticos
            </p>
          </div>
        </div>

        {/* BenefÃ­cios */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 mb-8">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">âÅ“¨ BenefÃ­cios da IntegraÃ§Ã£o:</h3>
          <ul className="text-left space-y-2 text-gray-700 dark:text-gray-300">
            <li className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              Controle fiscal automÃ¡tico e completo
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              RelatÃ³rios de entrada e saÃ­da unificados
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              Melhor organizaÃ§Ã£o e rastreabilidade
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              Conformidade com obrigaÃ§Ãµes fiscais
            </li>
          </ul>
        </div>

        {/* BotÃ£o de redirecionamento */}
        <button
          onClick={handleRedirect}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          <div className="flex items-center justify-center space-x-3">
            <DocumentTextIcon className="w-6 h-6" />
            <span>Ir para Notas Fiscais</span>
            <ArrowRightIcon className="w-5 h-5" />
          </div>
        </button>

        {/* Contador de redirecionamento */}
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
          VocÃª serÃ¡ redirecionado automaticamente em alguns segundos...
        </p>
      </div>
    </div>
  )
}
