/**
 * Context da aplicação otimizado
 * Usa PostgreSQL como fonte primária com cache inteligente
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

;
import { dbService } from '@/services/optimizedDatabaseService';
import { animalsCache, dashboardCache } from '@/lib/cacheManager';
import type { Animal, Custo, EstoqueSemen, NotaFiscal, AppContextType } from '@/types';
import { useToast } from './ToastContext';

const OptimizedAppContext = createContext<AppContextType | null>(null);

/**
 * Hook para acessar o contexto otimizado
 */
export function useOptimizedApp() {
  const context = useContext(OptimizedAppContext);
  if (!context) {
    throw new Error('useOptimizedApp deve ser usado dentro de OptimizedAppProvider');
  }
  return context;
}

interface OptimizedAppProviderProps {
  children: React.ReactNode;
}

/**
 * Provider otimizado do contexto da aplicação
 * Usa PostgreSQL como fonte de dados com cache para performance
 */
export function OptimizedAppProvider({ children }: OptimizedAppProviderProps) {
  const toast = useToast();
  
  // Estados
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [birthData, setBirthData] = useState<any[]>([]);
  const [costs, setCosts] = useState<Custo[]>([]);
  const [semenStock, setSemenStock] = useState<EstoqueSemen[]>([]);
  const [notasFiscais, setNotasFiscais] = useState<NotaFiscal[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * Limpar erro
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Carregar animais do banco de dados
   */
  const loadAnimals = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      // Verificar cache se não for refresh forçado
      if (!forceRefresh) {
        const cached = animalsCache.get('animals:all');
        if (cached) {
          setAnimals(cached);
          return;
        }
      }

      const response = await dbService.getAnimals({}, 1, 1000);
      
      if (response.success && response.data) {
        setAnimals(response.data);
        
        // Atualizar cache
        animalsCache.set('animals:all', response.data, 300000); // 5 minutos
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao carregar animais';
      setError(errorMessage);
      if (toast && 'error' in toast && typeof (toast as any).error === 'function') {
        (toast as any).error(errorMessage);
      }
      console.error('Erro ao carregar animais:', err);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Adicionar animal
   */
  const addAnimal = useCallback(async (animal: Partial<Animal>) => {
    try {
      setLoading(true);
      const newAnimal = await dbService.createAnimal(animal);
      
      // Atualizar estado local
      setAnimals(prev => [newAnimal, ...prev]);
      
      // Invalidar cache
      animalsCache.delete('animals:all');
      dashboardCache.clear();
      
      if (toast && 'success' in toast) {
        (toast as any).success('Animal cadastrado com sucesso!');
      }
      return newAnimal;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao cadastrar animal';
      setError(errorMessage);
      if (toast && 'error' in toast) {
        (toast as any).error(errorMessage);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Atualizar animal
   */
  const updateAnimal = useCallback(async (id: number, updates: Partial<Animal>) => {
    try {
      setLoading(true);
      const updatedAnimal = await dbService.updateAnimal(id, updates);
      
      // Atualizar estado local
      setAnimals(prev => prev.map(a => a.id === id ? updatedAnimal : a));
      
      // Invalidar cache
      animalsCache.delete('animals:all');
      animalsCache.delete(`animal:${id}`);
      dashboardCache.clear();
      
      if (toast && 'success' in toast) {
        (toast as any).success('Animal atualizado com sucesso!');
      }
      return updatedAnimal;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao atualizar animal';
      setError(errorMessage);
      if (toast && 'error' in toast) {
        (toast as any).error(errorMessage);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Deletar animal
   */
  const deleteAnimal = useCallback(async (id: number) => {
    try {
      setLoading(true);
      await dbService.deleteAnimal(id);
      
      // Atualizar estado local
      setAnimals(prev => prev.filter(a => a.id !== id));
      
      // Invalidar cache
      animalsCache.delete('animals:all');
      animalsCache.delete(`animal:${id}`);
      dashboardCache.clear();
      
      if (toast && 'success' in toast) {
        (toast as any).success('Animal removido com sucesso!');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao remover animal';
      setError(errorMessage);
      if (toast && 'error' in toast) {
        (toast as any).error(errorMessage);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Carregar estatísticas do dashboard
   */
  const loadDashboardStats = useCallback(async (forceRefresh = false) => {
    try {
      // Verificar cache
      if (!forceRefresh) {
        const cached = dashboardCache.get('dashboard:stats');
        if (cached) {
          return cached;
        }
      }

      const stats = await dbService.getDashboardStats();
      
      // Atualizar cache
      dashboardCache.set('dashboard:stats', stats, 180000); // 3 minutos
      
      return stats;
    } catch (err: any) {
      console.error('Erro ao carregar estatísticas:', err);
      throw err;
    }
  }, []);

  /**
   * Resetar todos os dados (com confirmação)
   */
  const resetAllData = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const confirmed = window.confirm(
      'ATENÇÃO: Esta ação irá limpar TODOS os dados do banco de dados. Esta ação NÃO PODE ser desfeita. Tem certeza?'
    );
    
    if (confirmed) {
      const doubleConfirm = window.confirm(
        'Última chance! Confirma que deseja deletar TODOS os dados permanentemente?'
      );
      
      if (doubleConfirm) {
        // Limpar estados
        setAnimals([]);
        setBirthData([]);
        setCosts([]);
        setSemenStock([]);
        setNotasFiscais([]);
        
        // Limpar todos os caches
        dbService.clearAllCaches();
        
        if (toast && 'warning' in toast) {
          (toast as any).warning('Todos os dados foram limpos');
        }
      }
    }
  }, [toast]);

  /**
   * Inicialização - carregar dados do banco ao montar
   */
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoading(true);
        await loadAnimals();
        setIsInitialized(true);
      } catch (err) {
        console.error('Erro ao inicializar aplicação:', err);
      } finally {
        setLoading(false);
      }
    };

    if (!isInitialized) {
      initializeApp();
    }
  }, [isInitialized, loadAnimals]);

  /**
   * Estatísticas computadas a partir dos dados locais
   * Memoizadas para evitar recálculos desnecessários
   */
  const stats = useMemo(() => ({
    totalAnimals: Array.isArray(animals) ? animals.length : 0,
    activeAnimals: Array.isArray(animals) ? animals.filter(a => a.situacao === 'Ativo').length : 0,
    totalBirths: Array.isArray(birthData) ? birthData.length : 0,
    totalCosts: Array.isArray(costs) ? costs.reduce((sum, c) => sum + (c.valor || 0), 0) : 0,
    totalSemen: Array.isArray(semenStock) ? semenStock.reduce((sum, s) => sum + (s.doses_disponiveis || 0), 0) : 0,
  }), [animals, birthData, costs, semenStock]);

  /**
   * Valor do context memoizado
   */
  const contextValue = useMemo<AppContextType>(() => ({
    // Dados
    animals,
    setAnimals,
    birthData,
    setBirthData,
    costs,
    setCosts,
    semenStock,
    setSemenStock,
    notasFiscais,
    setNotasFiscais,
    
    // Estado
    loading,
    setLoading,
    error,
    setError,
    clearError,
    
    // Funções
    resetAllData,
    
    // Estatísticas
    stats,
    
    // Funções otimizadas
    loadAnimals,
    addAnimal,
    updateAnimal,
    deleteAnimal,
    loadDashboardStats,
  } as any), [
    animals,
    birthData,
    costs,
    semenStock,
    notasFiscais,
    loading,
    error,
    clearError,
    resetAllData,
    stats,
    loadAnimals,
    addAnimal,
    updateAnimal,
    deleteAnimal,
    loadDashboardStats,
  ]);

  return (
    <OptimizedAppContext.Provider value={contextValue}>
      {children}
    </OptimizedAppContext.Provider>
  );
}

export default OptimizedAppContext;

