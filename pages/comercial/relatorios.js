
import React, { useEffect, useState, useCallback, useRef } from 'react'

import Layout from '../../components/Layout'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'

export default function ComercialReports() {
  const [period, setPeriod] = useState(() => {
    const end = new Date()
    const start = new Date(end)
    start.setMonth(end.getMonth() - 1)
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString()
    }
  })
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState({ pdf: false, xlsx: false })
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')
  const previewCache = useRef(new Map())
  const retryCount = useRef(0)
  const maxRetries = 3

  const sections = {
    monthly_summary: { nascimentos: true, mortes: true, vendas: true, compras: true, gestacao: true, estatisticas_gerais: true },
    births_analysis: { nascimentos_por_pai: true, nascimentos_por_mae: true, distribuicao_sexo: true },
    breeding_report: { femeas_gestantes: true, taxa_prenhez: true, previsao_partos: true },
    financial_summary: { receitas: true, custos: true },
    inventory_report: { estoque_semen: true }
  }

  // Gerar chave de cache baseada no período
  const getCacheKey = useCallback(() => {
    return `${period.startDate}_${period.endDate}`
  }, [period])

  const doPreview = useCallback(async (forceRefresh = false) => {
    const cacheKey = getCacheKey()
    
    // Verificar cache se não for refresh forçado
    if (!forceRefresh && previewCache.current.has(cacheKey)) {
      setPreview(previewCache.current.get(cacheKey))
      return
    }

    try {
      setLoading(true)
      setError(null)
      setProgress(0)
      setStatusMessage('🔄 Preparando dados...')
      
      // Simular progresso
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30000) // 30s timeout

      try {
        setStatusMessage('📊 Buscando dados do banco...')
        const res = await fetch('/api/reports/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reports: Object.keys(sections),
            period,
            sections,
            preview: true
          }),
          signal: controller.signal
        })

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          throw new Error(errorData.message || 'Erro ao gerar preview do relatório')
        }

        setStatusMessage('✅ Processando resultados...')
        const data = await res.json()
        
        clearInterval(progressInterval)
        setProgress(100)
        setPreview(data)
        
        // Salvar no cache (válido por 5 minutos)
        previewCache.current.set(cacheKey, { ...data, cachedAt: Date.now() })
        
        // Limpar cache antigo (mantém apenas os últimos 10)
        if (previewCache.current.size > 10) {
          const firstKey = previewCache.current.keys().next().value
          previewCache.current.delete(firstKey)
        }
        
        setStatusMessage('✅ Preview gerado com sucesso!')
        setTimeout(() => setStatusMessage(''), 2000)
        retryCount.current = 0
      } finally {
        clearTimeout(timeout)
        clearInterval(progressInterval)
      }
    } catch (err) {
      clearInterval(progressInterval)
      
      if (err.name === 'AbortError') {
        setError('⏱️ Tempo de espera excedido. Tente novamente.')
      } else {
        const errorMsg = err.message || 'Erro ao gerar preview do relatório'
        setError(errorMsg)
        
        // Retry automático
        if (retryCount.current < maxRetries) {
          retryCount.current++
          setStatusMessage(`🔄 Tentando novamente... (${retryCount.current}/${maxRetries})`)
          setTimeout(() => {
            doPreview(true)
          }, 1000 * retryCount.current) // Backoff exponencial
        } else {
          retryCount.current = 0
        }
      }
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }, [period, sections, getCacheKey])

  useEffect(() => { 
    doPreview() 
  }, [doPreview])

  const download = async (format = 'pdf') => {
    try {
      setDownloadLoading(prev => ({ ...prev, [format]: true }))
      setError(null)
      setProgress(0)
      setStatusMessage(`📥 Gerando relatório ${format.toUpperCase()}...`)

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 60000) // 60s timeout para download

      // Simular progresso para feedback visual
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 85) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 5
        })
      }, 300)

      try {
        const res = await fetch('/api/reports/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reports: Object.keys(sections),
            period,
            sections,
            format
          }),
          signal: controller.signal
        })

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          throw new Error(errorData.message || `Erro ao gerar relatório ${format.toUpperCase()}`)
        }

        setStatusMessage('📦 Preparando download...')
        setProgress(90)

        const blob = await res.blob()
        
        clearInterval(progressInterval)
        setProgress(100)

        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const fileName = `relatorio-${format}-${new Date().toISOString().slice(0,10)}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        
        // Cleanup
        setTimeout(() => {
          a.remove()
          window.URL.revokeObjectURL(url)
        }, 100)

        setStatusMessage(`✅ Download iniciado: ${fileName}`)
        setTimeout(() => {
          setStatusMessage('')
          setProgress(0)
        }, 3000)
      } finally {
        clearTimeout(timeout)
        clearInterval(progressInterval)
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('⏱️ Tempo de espera excedido. O relatório pode ser muito grande. Tente novamente.')
      } else {
        setError(err.message || `Erro ao baixar relatório ${format.toUpperCase()}`)
      }
      setProgress(0)
      setStatusMessage('')
    } finally {
      setDownloadLoading(prev => ({ ...prev, [format]: false }))
    }
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios Comerciais</h1>
          <p className="text-gray-600 dark:text-gray-400">Geração de relatórios PDF/Excel com dados reais.</p>
        </div>

        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Período</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ajuste e gere o preview antes de baixar.</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => download('pdf')} 
                disabled={downloadLoading.pdf || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                {downloadLoading.pdf ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Gerando PDF...</span>
                  </>
                ) : (
                  <>
                    📄 Baixar PDF
                  </>
                )}
              </button>
              <button 
                onClick={() => download('xlsx')} 
                disabled={downloadLoading.xlsx || loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                {downloadLoading.xlsx ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Gerando Excel...</span>
                  </>
                ) : (
                  <>
                    📊 Baixar Excel
                  </>
                )}
              </button>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <label className="block">
                <span className="text-sm text-gray-700 dark:text-gray-300">Início</span>
                <input type="date" className="mt-1 w-full p-2 rounded-md border dark:bg-gray-900" value={new Date(period.startDate).toISOString().slice(0,10)} onChange={(e) => setPeriod(p => ({ ...p, startDate: new Date(e.target.value).toISOString() }))} />
              </label>
              <label className="block">
                <span className="text-sm text-gray-700 dark:text-gray-300">Fim</span>
                <input type="date" className="mt-1 w-full p-2 rounded-md border dark:bg-gray-900" value={new Date(period.endDate).toISOString().slice(0,10)} onChange={(e) => setPeriod(p => ({ ...p, endDate: new Date(e.target.value).toISOString() }))} />
              </label>
            </div>

            <button 
              onClick={() => doPreview(true)} 
              disabled={loading}
              className="px-4 py-2 bg-gray-800 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
            >
              {loading ? '🔄 Atualizando...' : '🔄 Atualizar Preview'}
            </button>

            {/* Progress Bar */}
            {(loading || downloadLoading.pdf || downloadLoading.xlsx) && (
              <div className="mt-4 space-y-2">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {statusMessage && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">
                    {statusMessage}
                  </p>
                )}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start">
                  <span className="text-red-600 dark:text-red-400 text-xl mr-2">⚠️</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
                    <button
                      onClick={() => {
                        setError(null)
                        retryCount.current = 0
                        doPreview(true)
                      }}
                      className="mt-2 text-xs text-red-600 dark:text-red-400 hover:underline"
                    >
                      Tentar novamente
                    </button>
                  </div>
                </div>
              </div>
            )}

            {preview && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Animais</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{preview.totalAnimals}</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Nascimentos</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{preview.births}</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Mortes</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{preview.deaths}</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Vendas</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{preview.sales}</p>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </Layout>
  )
}