import { query } from '../../../lib/database'
import { logger } from '../../../utils/logger'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    const { animalRg, forceDelete } = req.body

    logger.info('Iniciando limpeza de gestações órfãs', { animalRg, forceDelete })

    // Se um RG específico foi fornecido
    if (animalRg) {
      // Buscar gestações do animal
      const gestacoes = await query(`
        SELECT 
          g.*,
          CASE 
            WHEN n.id IS NOT NULL THEN true
            ELSE false
          END as tem_nascimento
        FROM gestacoes g
        LEFT JOIN nascimentos n ON n.gestacao_id = g.id
        WHERE 
          g.receptora_rg = $1 
          OR g.mae_rg = $1
          OR g.pai_rg = $1
      `, [animalRg])

      const gestacoesOrfas = gestacoes.rows.filter(g => !g.tem_nascimento)

      if (gestacoesOrfas.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'Nenhuma gestação órfã encontrada',
          total: 0,
          gestacoes: []
        })
      }

      // Se forceDelete = true, excluir
      if (forceDelete) {
        const idsParaExcluir = gestacoesOrfas.map(g => g.id)
        
        await query(`
          DELETE FROM gestacoes 
          WHERE id = ANY($1)
        `, [idsParaExcluir])

        logger.info(`Gestações órfãs excluídas para animal ${animalRg}`, { 
          total: idsParaExcluir.length,
          ids: idsParaExcluir 
        })

        return res.status(200).json({
          success: true,
          message: `${idsParaExcluir.length} gestação(ões) órfã(s) excluída(s)`,
          total: idsParaExcluir.length,
          gestacoes: gestacoesOrfas.map(g => ({
            id: g.id,
            data_cobertura: g.data_cobertura,
            situacao: g.situacao,
            receptora: `${g.receptora_serie} ${g.receptora_rg}`
          }))
        })
      }

      // Apenas retornar as gestações órfãs sem excluir
      return res.status(200).json({
        success: true,
        message: `${gestacoesOrfas.length} gestação(ões) órfã(s) encontrada(s)`,
        total: gestacoesOrfas.length,
        gestacoes: gestacoesOrfas.map(g => ({
          id: g.id,
          data_cobertura: g.data_cobertura,
          situacao: g.situacao,
          receptora: `${g.receptora_serie} ${g.receptora_rg}`,
          mae: `${g.mae_serie} ${g.mae_rg}`,
          pai: `${g.pai_serie} ${g.pai_rg}`
        }))
      })
    }

    // Buscar todas as gestações órfãs (sem nascimento vinculado)
    const todasOrfas = await query(`
      SELECT 
        g.*,
        COUNT(n.id) as nascimentos_count
      FROM gestacoes g
      LEFT JOIN nascimentos n ON n.gestacao_id = g.id
      GROUP BY g.id
      HAVING COUNT(n.id) = 0
      ORDER BY g.data_cobertura DESC
    `)

    if (todasOrfas.rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Nenhuma gestação órfã encontrada no sistema',
        total: 0,
        gestacoes: []
      })
    }

    // Se forceDelete = true, excluir todas
    if (forceDelete) {
      const idsParaExcluir = todasOrfas.rows.map(g => g.id)
      
      await query(`
        DELETE FROM gestacoes 
        WHERE id = ANY($1)
      `, [idsParaExcluir])

      logger.info('Todas as gestações órfãs foram excluídas', { 
        total: idsParaExcluir.length 
      })

      return res.status(200).json({
        success: true,
        message: `${idsParaExcluir.length} gestação(ões) órfã(s) excluída(s) do sistema`,
        total: idsParaExcluir.length
      })
    }

    // Apenas retornar as gestações órfãs
    return res.status(200).json({
      success: true,
      message: `${todasOrfas.rows.length} gestação(ões) órfã(s) encontrada(s) no sistema`,
      total: todasOrfas.rows.length,
      gestacoes: todasOrfas.rows.map(g => ({
        id: g.id,
        data_cobertura: g.data_cobertura,
        situacao: g.situacao,
        receptora: `${g.receptora_serie} ${g.receptora_rg}`,
        mae: `${g.mae_serie} ${g.mae_rg}`,
        pai: `${g.pai_serie} ${g.pai_rg}`
      }))
    })

  } catch (error) {
    logger.error('Erro ao limpar gestações órfãs:', error)
    return res.status(500).json({ 
      error: 'Erro ao limpar gestações órfãs',
      details: error.message 
    })
  }
}
