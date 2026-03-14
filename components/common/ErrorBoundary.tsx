/**
 * Error Boundary unificado - Beef Sync
 * Consolida tratamento de erros com UI aprimorada, logging e utilitários
 */
import React, { Component, ErrorInfo, ReactNode } from 'react'
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon } from '@heroicons/react/24/outline'
import logger from '../../utils/logger'

export interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  fallbackMessage?: string
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  onReset?: () => void
  showDetails?: boolean
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorCount: number
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Error Boundary capturou erro:', {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
    })

    // Tratamento específico para erro total_tokens (dados corrompidos)
    if (error.message?.includes('total_tokens') && typeof window !== 'undefined') {
      try {
        const keys = Object.keys(localStorage)
        keys.forEach((key) => {
          try {
            const value = localStorage.getItem(key)
            if (value?.includes('total_tokens')) {
              logger.warn(`Removendo chave corrompida do localStorage: ${key}`)
              localStorage.removeItem(key)
            }
          } catch {
            // ignorar
          }
        })
      } catch {
        // ignorar
      }
    }

    this.setState((prev) => ({
      error,
      errorInfo,
      errorCount: prev.errorCount + 1,
    }))

    this.props.onError?.(error, errorInfo)

    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined' && (window as any).gtag) {
      ;(window as any).gtag('event', 'exception', { description: error.toString(), fatal: false })
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    this.props.onReset?.()
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const message = this.props.fallbackMessage || 'Encontramos um erro inesperado. Não se preocupe, seus dados estão seguros.'
      const showDetails = process.env.NODE_ENV === 'development' || this.props.showDetails

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
          <div className="max-w-2xl w-full">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 border-2 border-red-200 dark:border-red-800">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-red-100 dark:bg-red-900 p-4 rounded-full">
                  <ExclamationTriangleIcon className="h-12 w-12 text-red-600 dark:text-red-400" />
                </div>
              </div>

              <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">
                Ops! Algo deu errado
              </h1>

              <p className="text-center text-gray-600 dark:text-gray-400 mb-6">{message}</p>

              {showDetails && this.state.error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
                    Detalhes do erro:
                  </h3>
                  <p className="text-xs font-mono text-red-700 dark:text-red-400 break-all">
                    {this.state.error.message}
                  </p>
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer hover:underline">
                        Ver stack trace
                      </summary>
                      <pre className="mt-2 text-xs text-red-600 dark:text-red-400 overflow-auto max-h-40 p-2 bg-red-100 dark:bg-red-900/30 rounded">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {this.state.errorCount > 1 && (
                <div className="mb-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 text-center">
                    Este erro ocorreu <strong>{this.state.errorCount} vezes</strong> seguidas.
                    {this.state.errorCount >= 3 && ' Considere recarregar a página.'}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                  Tentar Novamente
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
                >
                  <HomeIcon className="h-5 w-5" />
                  Ir para o Início
                </button>
                <button
                  onClick={this.handleReload}
                  className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
                >
                  Recarregar Página
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  Se o problema persistir, entre em contato com o suporte técnico.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook para usar ErrorBoundary em componentes funcionais
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => setError(null), [])
  const captureError = React.useCallback((err: Error) => setError(err), [])

  React.useEffect(() => {
    if (error) throw error
  }, [error])

  return { captureError, resetError }
}

// Componente para capturar erros assíncronos
export function AsyncErrorBoundary({
  children,
  onError,
}: {
  children: ReactNode
  onError?: (error: unknown) => void
}) {
  const { captureError } = useErrorHandler()

  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      captureError(new Error(String(event.reason)))
      onError?.(event.reason)
    }
    const handleError = (event: ErrorEvent) => {
      captureError(event.error || new Error('Unknown error'))
      onError?.(event.error)
    }
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
    }
  }, [captureError, onError])

  return <>{children}</>
}

// Fallback customizado para uso com prop fallback
export function ErrorFallback({ retry }: { error?: Error; retry?: () => void }) {
  return (
    <div className="p-4 border border-red-200 rounded-md bg-red-50 dark:bg-red-900/20">
      <div className="flex">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Erro no componente</h3>
          <p className="mt-2 text-sm text-red-700 dark:text-red-400">
            Ocorreu um erro ao renderizar este componente.
          </p>
          {retry && (
            <button
              onClick={retry}
              className="mt-4 bg-red-100 dark:bg-red-900/30 px-2 py-1 text-xs font-medium text-red-800 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50"
            >
              Tentar novamente
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ErrorBoundary
