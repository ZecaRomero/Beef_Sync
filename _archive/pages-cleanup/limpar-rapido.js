import React, { useState, useEffect } from 'react'
import { TrashIcon, CheckCircleIcon } from '../components/ui/Icons'

export default function LimparRapido() {
  const [mounted, setMounted] = useState(false)
  const [limpando, setLimpando] = useState(false)
  const [concluido, setConcluido] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const limparTudo = async () => {
    setLimpando(true)
    
    try {
      // 1. Remover dados do localStorage
      const chavesParaRemover = [
        'sales', // vendas
        'equipamentos',
        'custosNutricionais',
        'consumoRacao', 
        'dietas',
        'protocolosSanitarios',
        'medicamentos',
        'insumos'
      ]

      chavesParaRemover.forEach(chave => {
        localStorage.removeItem(chave)
      })

      // 2. Limpar dados mock do banco (transfer√™ncias de embri√µes)
      try {
        const transferenciasRes = await fetch('/api/transferencias-embrioes')
        if (transferenciasRes.ok) {
          const transferenciasData = await transferenciasRes.json()
          const transferencias = transferenciasData.data || transferenciasData

          if (Array.isArray(transferencias)) {
            for (const transferencia of transferencias) {
              const isMock = (
                (transferencia.receptora_nome && transferencia.receptora_nome.toLowerCase().includes('vaca')) ||
                (transferencia.doadora_nome && transferencia.doadora_nome.toLowerCase().includes('vaca')) ||
                (transferencia.receptora_nome && /\d{3}/.test(transferencia.receptora_nome)) ||
                (transferencia.doadora_nome && /\d{3}/.test(transferencia.doadora_nome))
              )

              if (isMock) {
                await fetch(`/api/transferencias-embrioes?id=${transferencia.id}`, {
                  method: 'DELETE'
                })
              }
            }
          }
        }
      } catch (error) {
        console.error('Erro ao limpar dados do banco:', error)
      }

      setTimeout(() => {
        setLimpando(false)
        setConcluido(true)
        
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 2000)
      }, 1000)

    } catch (error) {
      console.error('Erro durante a limpeza:', error)
      setLimpando(false)
      alert('Erro durante a limpeza: ' + error.message)
    }
  }

  if (!mounted) {
    return <div>Carregando...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {concluido ? (
          <>
            <CheckCircleIcon className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-2">
              ‚≈ì‚Ä¶ Dados Removidos!
            </h1>
            <p className="text-green-700 dark:text-green-300 mb-4">
              Todos os dados fict√≠cios foram removidos com sucesso.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Redirecionando para o dashboard...
            </p>
          </>
        ) : (
          <>
            <TrashIcon className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              ≈∏ßπ Limpeza R√°pida
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Remove todos os dados fict√≠cios/mock do sistema, incluindo:
            </p>
            <ul className="text-left text-sm text-gray-600 dark:text-gray-400 mb-6 space-y-1">
              <li>‚‚Ç¨¢ Vendas (Nelore 001, Angus 045, etc.)</li>
              <li>‚‚Ç¨¢ Transfer√™ncias (Vaca 001, Vaca 002, etc.)</li>
              <li>‚‚Ç¨¢ Equipamentos de teste</li>
              <li>‚‚Ç¨¢ Custos nutricionais fict√≠cios</li>
              <li>‚‚Ç¨¢ Dietas de exemplo</li>
              <li>‚‚Ç¨¢ Outros dados de demonstra√ß√£o</li>
            </ul>
            
            <button
              onClick={limparTudo}
              disabled={limpando}
              className="w-full bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {limpando ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Limpando...
                </div>
              ) : (
                'Limpar Dados Fict√≠cios'
              )}
            </button>
            
            <div className="mt-4 space-y-2">
              <a 
                href="/comercial/vendas" 
                className="block text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm"
              >
                ‚‚Ä†‚Äô Ver P√°gina de Vendas
              </a>
              <a 
                href="/dashboard" 
                className="block text-gray-600 hover:text-gray-800 dark:text-gray-400 text-sm"
              >
                ‚‚Ä†‚Äô Voltar ao Dashboard
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}