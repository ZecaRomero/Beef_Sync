/**
 * Error Boundary aprimorado com melhor UX e logging
 */
import { Component, ErrorInfo, ReactNode } from 'react'

import { ExclamationTriangleIcon, ArrowPathIcon } from '../ui/Icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

export class ErrorBoundaryEnhanced extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log do erro
    console.error('Error Boundary capturou erro:', error, errorInfo);

    // Atualizar estado
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Callback customizado
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Em produção, enviar para serviço de logging
    if (process.env.NODE_ENV === 'production') {
      // Aqui você pode integrar com Sentry, LogRocket, etc
      this.logErrorToService(error, errorInfo);
    }
  }

  logErrorToService(_error: Error, _errorInfo: ErrorInfo) {
    // Implementar integração com serviço de logging
    // Exemplo: Sentry.captureException(error, { extra: errorInfo });
    // Parâmetros prefixados com _ para indicar que não são utilizados atualmente
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Usar fallback customizado se fornecido
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Renderizar UI de erro padrão
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
          <div className="max-w-2xl w-full">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 border-2 border-red-200 dark:border-red-800">
              {/* Ícone e título */}
              <div className="flex items-center justify-center mb-6">
                <div className="bg-red-100 dark:bg-red-900 p-4 rounded-full">
                  <ExclamationTriangleIcon className="h-12 w-12 text-red-600 dark:text-red-400" />
                </div>
              </div>

              <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">
                Ops! Algo deu errado
              </h1>

              <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                Encontramos um erro inesperado. Não se preocupe, seus dados estão seguros.
              </p>

              {/* Mensagem de erro (apenas em desenvolvimento ou se showDetails) */}
              {(process.env.NODE_ENV === 'development' || this.props.showDetails) && this.state.error && (
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

              {/* Contador de erros */}
              {this.state.errorCount > 1 && (
                <div className="mb-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 text-center">
                    Este erro ocorreu <strong>{this.state.errorCount} vezes</strong> seguidas.
                    {this.state.errorCount >= 3 && ' Considere recarregar a página.'}
                  </p>
                </div>
              )}

              {/* Ações */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                  Tentar Novamente
                </button>

                <button
                  onClick={this.handleReload}
                  className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
                >
                  Recarregar Página
                </button>
              </div>

              {/* Informações adicionais */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  Se o problema persistir, entre em contato com o suporte técnico.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundaryEnhanced;

