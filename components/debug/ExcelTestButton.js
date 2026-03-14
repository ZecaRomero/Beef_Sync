import React, { useState } from 'react'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'

export default function ExcelTestButton() {
  const [loading, setLoading] = useState(false)
  const [lastError, setLastError] = useState(null)
  const [lastSuccess, setLastSuccess] = useState(null)

  const testExcelDownload = async () => {
    setLoading(true)
    setLastError(null)
    setLastSuccess(null)

    try {
      console.log('🧪 Iniciando teste de Excel...')
      
      const testData = {
        reports: ['location_report'],
        period: {
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        },
        format: 'xlsx'
      }

      console.log('📋 Dados do teste:', testData)

      const response = await fetch('/api/reports/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      })

      console.log('📡 Resposta:', {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length')
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Erro da API:', errorText)
        throw new Error(`Erro ${response.status}: ${errorText}`)
      }

      const blob = await response.blob()
      console.log('📦 Blob criado:', {
        size: blob.size,
        type: blob.type
      })

      // Verificar se o blob é válido
      if (blob.size === 0) {
        throw new Error('Arquivo vazio recebido')
      }

      // Criar URL e fazer download
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `teste-excel-${Date.now()}.xlsx`
      
      console.log('💾 Fazendo download:', a.download)
      
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setLastSuccess(`✅ Sucesso! Arquivo baixado: ${blob.size} bytes`)
      console.log('✅ Download concluído com sucesso!')

    } catch (error) {
      console.error('❌ Erro completo:', error)
      setLastError(`❌ Erro: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-600">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        🧪 Teste de Exportação Excel
      </h3>
      
      <button
        onClick={testExcelDownload}
        disabled={loading}
        className={`
          flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors
          ${loading 
            ? 'bg-gray-400 cursor-not-allowed text-white' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'
          }
        `}
      >
        <ArrowDownTrayIcon className="h-4 w-4" />
        <span>{loading ? 'Testando...' : 'Testar Download Excel'}</span>
      </button>

      {lastSuccess && (
        <div className="mt-3 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {lastSuccess}
        </div>
      )}

      {lastError && (
        <div className="mt-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {lastError}
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <p><strong>Este teste:</strong></p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Faz uma requisição direta para a API</li>
          <li>Baixa um relatório de localização em Excel</li>
          <li>Mostra logs detalhados no console</li>
          <li>Exibe o resultado aqui</li>
        </ul>
        <p className="mt-2">
          <strong>Abra o Console do Navegador (F12)</strong> para ver os logs detalhados.
        </p>
      </div>
    </div>
  )
}