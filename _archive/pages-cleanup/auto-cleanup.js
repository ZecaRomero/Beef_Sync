
import React, { useEffect, useState } from 'react'

import { useRouter } from 'next/router'

export default function AutoCleanup() {
  const [status, setStatus] = useState('Iniciando...')
  const [step, setStep] = useState(0)
  const [completed, setCompleted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    performCleanup()
  }, [])

  const performCleanup = async () => {
    try {
      setStep(1)
      setStatus('🧹 Limpando localStorage...')
      
      // Limpar localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('animals')
        localStorage.removeItem('animalData')
        localStorage.removeItem('animalCosts')
        localStorage.removeItem('animalCostsData')
        localStorage.removeItem('birthData')
        localStorage.removeItem('customPrices')
        localStorage.removeItem('customMedicamentos')
        localStorage.removeItem('customProtocolos')
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setStep(2)
      setStatus('🔄 Verificando PostgreSQL...')
      
      // Verificar se PostgreSQL está limpo
      try {
        const response = await fetch('/api/animals')
        if (response.ok) {
          const data = await response.json()
          if (data.length === 0) {
            setStatus('✅ PostgreSQL já está limpo')
          } else {
            setStatus(`⚠️ PostgreSQL ainda tem ${data.length} animais`)
          }
        }
      } catch (error) {
        setStatus('❌ Erro ao verificar PostgreSQL')
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setStep(3)
      setStatus('✅ Limpeza concluída!')
      setCompleted(true)
      
      // Redirecionar após 3 segundos
      setTimeout(() => {
        router.push('/animals')
      }, 3000)
      
    } catch (error) {
      setStatus('❌ Erro na limpeza: ' + error.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="mb-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/20 mb-4">
              {completed ? (
                <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              )}
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              🧹 Limpeza Automática
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {status}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Passo {step} de 3
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-3 text-sm">
            <div className={`flex items-center ${step >= 1 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
              <div className={`w-4 h-4 rounded-full mr-3 ${step >= 1 ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                {step > 1 && <div className="w-2 h-2 bg-white rounded-full m-1"></div>}
              </div>
              Limpar localStorage
            </div>
            
            <div className={`flex items-center ${step >= 2 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
              <div className={`w-4 h-4 rounded-full mr-3 ${step >= 2 ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                {step > 2 && <div className="w-2 h-2 bg-white rounded-full m-1"></div>}
              </div>
              Verificar PostgreSQL
            </div>
            
            <div className={`flex items-center ${step >= 3 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
              <div className={`w-4 h-4 rounded-full mr-3 ${step >= 3 ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                {step > 3 && <div className="w-2 h-2 bg-white rounded-full m-1"></div>}
              </div>
              Concluir limpeza
            </div>
          </div>

          {completed && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-green-700 dark:text-green-300 text-sm">
                ✅ Limpeza concluída com sucesso!<br/>
                Redirecionando para a lista de animais...
              </p>
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={() => router.push('/animals')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              👀 Ir para Lista de Animais
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
