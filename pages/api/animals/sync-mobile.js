import { query } from '../../../lib/database'
import { logger } from '../../../utils/logger'
import { sendSuccess, sendError } from '../../../utils/apiResponse'

/**
 * Endpoint para forçar sincronização de dados do animal no mobile
 * Remove gestações órfãs e retorna dados atualizados
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    const { animalId, animalRg, forceClearCache } = req.body

    if (!animalId && !animalRg) {
      return res.status(400).json({ 
        error: 'animalId ou animalRg é obrigatório' 
      })
    }

    logger.info('Sincronizando dados do animal para mobile', { animalId, animalRg })

    // Buscar o animal
    let animal
    if (animalId) {
      const result = await query('SELECT * FROM animais WHERE id = $1', [animalId])
      animal = result.rows[0]
    } else {
      const result = await query('SELECT * FROM animais WHERE rg = $1', [animalRg])
      animal = result.rows[0]
    }

    if (!animal) {
      return sendError(res, 'Animal não encontrado', 404)
    }

    // Limpar gestações órfãs deste animal
    const gestacoesOrfas = await query(`
      SELECT g.id
      FROM gestacoes g
      LEFT JOIN nascimentos n ON n.gestacao_id = g.id
      WHERE (g.receptora_rg = $1 OR g.mae_rg = $1 OR g.pai_rg = $1)
        AND n.id IS NULL
    `, [animal.rg])

    const idsOrfas = gestacoesOrfas.rows.map(g => g.id)

    if (idsOrfas.length > 0) {
      await query('DELETE FROM gestacoes WHERE id = ANY($1)', [idsOrfas])
      logger.info(`Gestações órfãs removidas para animal ${animal.serie}-${animal.rg}`, {
        total: idsOrfas.length,
        ids: idsOrfas
      })
    }

    // Buscar gestações ativas restantes
    const gestacoesAtivas = await query(`
      SELECT g.*
      FROM gestacoes g
      WHERE (g.receptora_rg = $1 OR g.mae_rg = $1 OR g.pai_rg = $1)
      ORDER BY g.data_cobertura DESC
    `, [animal.rg])

    // Buscar dados completos do animal (com tratamento de erros para tabelas que podem não existir)
    const buscarDadosSafe = async (queryStr, params, defaultValue = []) => {
      try {
        const result = await query(queryStr, params)
        return result.rows
      } catch (error) {
        logger.warn(`Tabela não existe ou erro na query: ${error.message}`)
        return defaultValue
      }
    }

    const [pesagens, inseminacoes, custos, protocolos, localizacoes, fivs] = await Promise.all([
      buscarDadosSafe('SELECT * FROM pesagens WHERE animal_id = $1 ORDER BY data DESC', [animal.id]),
      buscarDadosSafe('SELECT * FROM inseminacoes WHERE animal_id = $1 ORDER BY data_ia DESC', [animal.id]),
      buscarDadosSafe('SELECT * FROM custos WHERE animal_id = $1 ORDER BY data DESC', [animal.id]),
      buscarDadosSafe('SELECT * FROM protocolos_aplicados WHERE animal_id = $1 ORDER BY data_inicio DESC', [animal.id]),
      buscarDadosSafe('SELECT * FROM localizacoes_animais WHERE animal_id = $1 ORDER BY data_entrada DESC', [animal.id]),
      buscarDadosSafe('SELECT * FROM coleta_fiv WHERE doadora_nome = $1 OR doadora_nome = $2 ORDER BY data_fiv DESC', 
        [`${animal.serie} ${animal.rg}`, `${animal.serie}-${animal.rg}`])
    ])

    const animalCompleto = {
      ...animal,
      pesagens,
      inseminacoes,
      custos,
      gestacoes: gestacoesAtivas.rows,
      protocolos,
      localizacoes,
      fivs,
      _sync_timestamp: new Date().toISOString(),
      _gestacoes_orfas_removidas: idsOrfas.length
    }

    return sendSuccess(res, {
      animal: animalCompleto,
      sync: {
        timestamp: new Date().toISOString(),
        gestacoesOrfasRemovidas: idsOrfas.length,
        gestacoesAtivas: gestacoesAtivas.rows.length,
        forceClearCache: forceClearCache || false
      }
    }, 'Dados sincronizados com sucesso')

  } catch (error) {
    logger.error('Erro ao sincronizar dados do animal:', error)
    return sendError(res, 'Erro ao sincronizar dados', 500, {
      details: error.message
    })
  }
}
