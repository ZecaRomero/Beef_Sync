/**
 * Página para limpar dados mock - Acesso direto
 */
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router';

export default function ClearData() {
  const router = useRouter();
  const [status, setStatus] = useState('Limpando dados...');

  useEffect(() => {
    // Limpar localStorage
    if (typeof window !== 'undefined') {
      try {
        // Limpar dados específicos
        localStorage.removeItem('animals');
        localStorage.removeItem('birthData');
        localStorage.removeItem('costs');
        localStorage.removeItem('semenStock');
        localStorage.removeItem('notasFiscais');
        
        // Limpar tudo também
        localStorage.clear();
        sessionStorage.clear();
        
        setStatus('✅ Dados mock removidos com sucesso!');
        console.log('🧹 Dados mock removidos!');
        
        // Redirecionar para dashboard
        setTimeout(() => {
          router.push('/');
        }, 3000);
        
      } catch (error) {
        setStatus('❌ Erro ao limpar dados: ' + error.message);
        console.error('Erro:', error);
      }
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900">
            <svg className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            Limpando Sistema
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {status}
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Aguarde... redirecionando para o dashboard limpo
          </p>
          
          <div className="mt-4 text-xs text-gray-400 dark:text-gray-500">
            <p>Dados removidos:</p>
            <ul className="list-disc list-inside text-left mt-2">
              <li>animals</li>
              <li>birthData</li>
              <li>costs</li>
              <li>semenStock</li>
              <li>notasFiscais</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
