/**
 * Serviço de banco de dados otimizado com cache e pooling melhorado
 */

import { query as dbQuery } from '../lib/database';
import { animalsCache, semenCache, dashboardCache } from '../lib/cacheManager';
import { handleDatabaseError, retryOperation, DatabaseError } from '../lib/errorHandler';
import type { 
  Animal, 
  Custo, 
  AnimalFilter,
  PaginatedResponse
} from '../types';

/**
 * Classe de serviço de banco de dados otimizado
 */
export class OptimizedDatabaseService {
  private static instance: OptimizedDatabaseService;

  private constructor() {}

  /**
   * Singleton pattern
   */
  static getInstance(): OptimizedDatabaseService {
    if (!OptimizedDatabaseService.instance) {
      OptimizedDatabaseService.instance = new OptimizedDatabaseService();
    }
    return OptimizedDatabaseService.instance;
  }

  /**
   * Executar query com retry automático
   */
  private async executeQuery<T = any>(
    query: string,
    params?: any[],
    options: { retries?: number; cache?: boolean; cacheKey?: string; cacheTTL?: number } = {}
  ): Promise<T> {
    const { retries = 3, cache = false, cacheKey, cacheTTL } = options;

    // Verificar cache se habilitado
    if (cache && cacheKey) {
      const cached = animalsCache.get(cacheKey);
      if (cached) {
        return cached as T;
      }
    }

    try {
      const result = await retryOperation(
        () => dbQuery(query, params),
        {
          maxRetries: retries,
          onRetry: (attempt, error) => {
            console.warn(`Tentativa ${attempt} de query falhou:`, error.message);
          },
        }
      );

      const data = result.rows as T;

      // Salvar no cache se habilitado
      if (cache && cacheKey) {
        animalsCache.set(cacheKey, data, cacheTTL);
      }

      return data;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  // ============ OPERAÇÕES COM ANIMAIS ============

  /**
   * Buscar todos os animais com filtros e paginação
   */
  async getAnimals(
    filters?: AnimalFilter,
    page: number = 1,
    limit: number = 50
  ): Promise<PaginatedResponse<Animal>> {
    const offset = (page - 1) * limit;
    const cacheKey = `animals:${JSON.stringify(filters)}:${page}:${limit}`;

    try {
      // Construir query dinamicamente com filtros
      let whereConditions: string[] = [];
      let params: any[] = [];
      let paramIndex = 1;

      if (filters) {
        if (filters.situacao) {
          whereConditions.push(`situacao = $${paramIndex++}`);
          params.push(filters.situacao);
        }
        if (filters.sexo) {
          whereConditions.push(`sexo = $${paramIndex++}`);
          params.push(filters.sexo);
        }
        if (filters.raca) {
          whereConditions.push(`raca = $${paramIndex++}`);
          params.push(filters.raca);
        }
        if (filters.serie) {
          whereConditions.push(`serie = $${paramIndex++}`);
          params.push(filters.serie);
        }
        if (filters.rg) {
          whereConditions.push(`rg ILIKE $${paramIndex++}`);
          params.push(`%${filters.rg}%`);
        }
        if (filters.search) {
          whereConditions.push(`(
            serie ILIKE $${paramIndex} OR 
            rg ILIKE $${paramIndex} OR 
            tatuagem ILIKE $${paramIndex} OR
            observacoes ILIKE $${paramIndex}
          )`);
          params.push(`%${filters.search}%`);
          paramIndex++;
        }
        if (filters.is_fiv !== undefined) {
          whereConditions.push(`is_fiv = $${paramIndex++}`);
          params.push(filters.is_fiv);
        }
        if (filters.data_inicio) {
          whereConditions.push(`data_nascimento >= $${paramIndex++}`);
          params.push(filters.data_inicio);
        }
        if (filters.data_fim) {
          whereConditions.push(`data_nascimento <= $${paramIndex++}`);
          params.push(filters.data_fim);
        }
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}` 
        : '';

      // Query para contar total
      const countQuery = `SELECT COUNT(*) as count FROM animais ${whereClause}`;
      const countResult = await this.executeQuery<any[]>(countQuery, params);
      const total = parseInt(countResult[0].count);

      // Query para buscar dados
      const dataQuery = `
        SELECT * FROM animais 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      const animals = await this.executeQuery<Animal[]>(
        dataQuery,
        [...params, limit, offset],
        { cache: true, cacheKey, cacheTTL: 300000 } // 5 minutos
      );

      return {
        success: true,
        data: animals,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * Buscar animal por ID
   */
  async getAnimalById(id: number): Promise<Animal | null> {
    const cacheKey = `animal:${id}`;

    try {
      const animals = await this.executeQuery<Animal[]>(
        'SELECT * FROM animais WHERE id = $1',
        [id],
        { cache: true, cacheKey }
      );

      return animals[0] || null;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * Criar novo animal
   */
  async createAnimal(animal: Partial<Animal>): Promise<Animal> {
    try {
      const query = `
        INSERT INTO animais (
          serie, rg, tatuagem, sexo, raca, data_nascimento, hora_nascimento,
          peso, cor, tipo_nascimento, dificuldade_parto, meses, situacao,
          pai, mae, receptora, is_fiv, custo_total, valor_venda, valor_real,
          veterinario, observacoes
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22
        ) RETURNING *
      `;

      const result = await this.executeQuery<Animal[]>(query, [
        animal.serie,
        animal.rg,
        animal.tatuagem,
        animal.sexo,
        animal.raca,
        animal.data_nascimento,
        animal.hora_nascimento,
        animal.peso,
        animal.cor,
        animal.tipo_nascimento,
        animal.dificuldade_parto,
        animal.meses,
        animal.situacao || 'Ativo',
        animal.pai,
        animal.mae,
        animal.receptora,
        animal.is_fiv || false,
        animal.custo_total || 0,
        animal.valor_venda,
        animal.valor_real,
        animal.veterinario,
        animal.observacoes,
      ]);

      // Invalidar cache
      animalsCache.invalidate('animals:');

      return result[0];
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * Atualizar animal
   */
  async updateAnimal(id: number, updates: Partial<Animal>): Promise<Animal> {
    try {
      // Construir query dinâmica apenas com campos fornecidos
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      Object.entries(updates).forEach(([key, value]) => {
        if (key !== 'id' && value !== undefined) {
          fields.push(`${key} = $${paramIndex++}`);
          values.push(value);
        }
      });

      if (fields.length === 0) {
        throw new DatabaseError('Nenhum campo para atualizar');
      }

      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const query = `
        UPDATE animais 
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await this.executeQuery<Animal[]>(query, values);

      // Invalidar cache
      animalsCache.delete(`animal:${id}`);
      animalsCache.invalidate('animals:');

      return result[0];
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * Deletar animal
   */
  async deleteAnimal(id: number): Promise<boolean> {
    try {
      await this.executeQuery(
        'DELETE FROM animais WHERE id = $1',
        [id]
      );

      // Invalidar cache
      animalsCache.delete(`animal:${id}`);
      animalsCache.invalidate('animals:');

      return true;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  // ============ OPERAÇÕES COM CUSTOS ============

  /**
   * Buscar custos de um animal
   */
  async getCustosByAnimalId(animalId: number): Promise<Custo[]> {
    const cacheKey = `custos:animal:${animalId}`;

    try {
      return await this.executeQuery<Custo[]>(
        `SELECT * FROM custos 
         WHERE animal_id = $1 
         ORDER BY data DESC`,
        [animalId],
        { cache: true, cacheKey, cacheTTL: 180000 } // 3 minutos
      );
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * Adicionar custo
   */
  async addCusto(custo: Partial<Custo>): Promise<Custo> {
    try {
      const result = await this.executeQuery<Custo[]>(
        `INSERT INTO custos (
          animal_id, tipo, subtipo, valor, data, observacoes, detalhes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          custo.animal_id,
          custo.tipo,
          custo.subtipo,
          custo.valor,
          custo.data,
          custo.observacoes,
          custo.detalhes ? JSON.stringify(custo.detalhes) : null,
        ]
      );

      // Atualizar custo total do animal
      await this.executeQuery(
        `UPDATE animais 
         SET custo_total = (
           SELECT COALESCE(SUM(valor), 0) FROM custos WHERE animal_id = $1
         ),
         updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [custo.animal_id]
      );

      // Invalidar cache
      animalsCache.delete(`custos:animal:${custo.animal_id}`);
      animalsCache.delete(`animal:${custo.animal_id}`);
      dashboardCache.clear();

      return result[0];
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  // ============ ESTATÍSTICAS ============

  /**
   * Obter estatísticas do dashboard
   */
  async getDashboardStats(): Promise<any> {
    const cacheKey = 'dashboard:stats';

    // Verificar cache primeiro
    const cached = dashboardCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Queries paralelas para melhor performance
      const [
        animalsCount,
        activeAnimalsCount,
        costSum,
        revenueSum,
        semenCount,
      ] = await Promise.all([
        this.executeQuery<any[]>('SELECT COUNT(*) as count FROM animais'),
        this.executeQuery<any[]>('SELECT COUNT(*) as count FROM animais WHERE situacao = $1', ['Ativo']),
        this.executeQuery<any[]>('SELECT COALESCE(SUM(valor), 0) as total FROM custos'),
        this.executeQuery<any[]>('SELECT COALESCE(SUM(valor_venda), 0) as total FROM animais WHERE situacao = $1', ['Vendido']),
        this.executeQuery<any[]>('SELECT COALESCE(SUM(doses_disponiveis), 0) as total FROM estoque_semen'),
      ]);

      const stats = {
        totalAnimals: parseInt(animalsCount[0].count),
        activeAnimals: parseInt(activeAnimalsCount[0].count),
        totalCosts: parseFloat(costSum[0].total),
        totalRevenue: parseFloat(revenueSum[0].total),
        semenStock: parseInt(semenCount[0].total),
        roi: 0,
      };

      // Calcular ROI
      if (stats.totalCosts > 0) {
        stats.roi = ((stats.totalRevenue - stats.totalCosts) / stats.totalCosts) * 100;
      }

      // Salvar no cache por 3 minutos
      dashboardCache.set(cacheKey, stats, 180000);

      return stats;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * Limpar todos os caches
   */
  clearAllCaches(): void {
    animalsCache.clear();
    semenCache.clear();
    dashboardCache.clear();
  }
}

// Exportar instância singleton
export const dbService = OptimizedDatabaseService.getInstance();
export default dbService;

