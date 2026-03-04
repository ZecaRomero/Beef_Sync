/**
 * Hook otimizado para buscar dados com cache automático e gestão de estado
 */
import { useCallback, useEffect, useRef, useState } from 'react'

;
import type { UseFetchOptions, UseFetchResult, ApiResponse } from '@/types';

// Cache global para compartilhar entre instâncias
const globalCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export function useOptimizedFetch<T = any>(
  options: UseFetchOptions<T>
): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const { url, method = 'GET', body, headers, onSuccess, onError, cache = true, cacheTTL = 15000 } = options;

  const getCacheKey = useCallback(() => {
    return `${method}:${url}:${JSON.stringify(body || {})}`;
  }, [url, method, body]);

  const fetchData = useCallback(async () => {
    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Verificar cache
    if (cache && method === 'GET') {
      const cacheKey = getCacheKey();
      const cachedData = globalCache.get(cacheKey);
      
      if (cachedData && Date.now() - cachedData.timestamp < cachedData.ttl) {
        setData(cachedData.data);
        setLoading(false);
        return;
      }
    }

    // Criar novo AbortController
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<T> = await response.json();

      if (result.success && result.data) {
        setData(result.data);
        
        // Atualizar cache para GET requests
        if (cache && method === 'GET') {
          const cacheKey = getCacheKey();
          globalCache.set(cacheKey, {
            data: result.data,
            timestamp: Date.now(),
            ttl: cacheTTL,
          });
        }

        if (onSuccess) {
          onSuccess(result.data);
        }
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
    } catch (err: any) {
      // Ignorar erros de abort
      if (err.name === 'AbortError') {
        return;
      }

      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      
      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  }, [url, method, body, headers, cache, cacheTTL, getCacheKey, onSuccess, onError]);

  useEffect(() => {
    fetchData();

    // Cleanup ao desmontar
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

// Função para limpar cache manualmente
export function clearCache(pattern?: string) {
  if (!pattern) {
    globalCache.clear();
    return;
  }

  // Limpar apenas entradas que correspondem ao padrão
  for (const key of globalCache.keys()) {
    if (key.includes(pattern)) {
      globalCache.delete(key);
    }
  }
}

// Função para invalidar cache de uma URL específica
export function invalidateCache(url: string) {
  for (const key of globalCache.keys()) {
    if (key.includes(url)) {
      globalCache.delete(key);
    }
  }
}

