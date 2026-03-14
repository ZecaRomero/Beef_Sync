import React, { useState } from 'react'

;
import { ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon } from './ui/Icons';

export default function DatabaseSync() {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    
    try {
      const response = await fetch('/api/database/sync-semen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const result = await response.json();
      setSyncResult(result);
      
      if (result.success) {
        // Recarregar a página após 2 segundos para mostrar os novos dados
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      setSyncResult({
        success: false,
        message: 'Erro ao conectar com o servidor',
        error: error.message
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
            Sincronização de Dados
          </h3>
          <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
            Se você não está vendo todos os touros do PostgreSQL, clique em sincronizar para importar os dados da tabela entradas_semen.
          </p>
          
          {syncResult && (
            <div className={`mt-3 p-3 rounded-md ${
              syncResult.success 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' 
                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
            }`}>
              <div className="flex items-center">
                {syncResult.success ? (
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                ) : (
                  <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                )}
                <span className="text-sm font-medium">{syncResult.message}</span>
              </div>
              {syncResult.success && (
                <div className="mt-2 text-sm">
                  <p>• {syncResult.migrated} novos registros importados</p>
                  <p>• {syncResult.skipped} registros já existentes</p>
                  <p>• Total de {syncResult.totalRecords} touros no estoque</p>
                  <p className="mt-2 font-medium">A página será recarregada automaticamente...</p>
                </div>
              )}
            </div>
          )}
          
          <div className="mt-3">
            <button
              onClick={handleSync}
              disabled={syncing}
              className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md ${
                syncing
                  ? 'text-blue-400 bg-blue-100 dark:bg-blue-900/50 cursor-not-allowed'
                  : 'text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-200 dark:hover:bg-blue-900/70'
              } transition-colors duration-200`}
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Sincronizar Dados'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}