/**
 * API para importar Diagnósticos de Gestação do Excel
 */

import { pool } from '../../../../lib/database'
import { asyncHandler, sendSuccess, sendValidationError } from '../../../../utils/apiResponse'
import logger from '../../../../utils/logger'
import { blockIfNotZecaDeveloper } from '../../../../utils/importAccess'

export default asyncHandler(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método não permitido' })
  }

  const blocked = blockIfNotZecaDeveloper(req, res)
  if (blocked) return blocked

  const { data } = req.body

  if (!data || !Array.isArray(data) || data.length === 0) {
    return sendValidationError(res, 'Dados inválidos ou vazios')
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const created = []
    const errors = []

    for (const item of data) {
      try {
        // Buscar animal
        const animalResult = await client.query(
          'SELECT id FROM animais WHERE serie = $1 AND rg = $2',
          [item.serie, item.rg]
        )

        if (animalResult.rows.length === 0) {
          errors.push(`Animal ${item.serie}${item.rg} não encontrado`)
          continue
        }

        const animalId = animalResult.rows[0].id

        // Converter data DG
        let dataDG = null
        if (item.data_dg) {
          const dateParts = item.data_dg.toString().split(/[\/\-]/)
          if (dateParts.length === 3) {
            const day = parseInt(dateParts[0])
            const month = parseInt(dateParts[1]) - 1
            const year = parseInt(dateParts[2])
            dataDG = new Date(year, month, day).toISOString().split('T')[0]
          }
        }

        // Normalizar resultado
        const resultado = item.resultado?.toString().toUpperCase().trim()
        const prenha = resultado === 'P' || resultado === 'POSITIVO' || resultado === 'POSITIVA' || resultado === 'SIM'

        // Verificar se já existe gestação ativa
        const gestacaoExistente = await client.query(
          'SELECT id FROM gestacoes WHERE animal_id = $1 AND ativa = true',
          [animalId]
        )

        if (gestacaoExistente.rows.length > 0 && prenha) {
          // Atualizar gestação existente
          await client.query(
            `UPDATE gestacoes 
             SET data_diagnostico = $1, 
                 resultado_diagnostico = $2,
                 updated_at = CURRENT_TIMESTAMP
             WHERE animal_id = $3 AND ativa = true`,
            [dataDG, resultado, animalId]
          )
        } else if (prenha && dataDG) {
          // Criar nova gestação
          await client.query(
            `INSERT INTO gestacoes 
             (animal_id, data_diagnostico, resultado_diagnostico, ativa, created_at, updated_at)
             VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [animalId, dataDG, resultado]
          )
        }

        created.push({
          animal_id: animalId,
          serie: item.serie,
          rg: item.rg,
          data_dg: dataDG,
          resultado
        })
      } catch (error) {
        logger.error(`Erro ao processar DG para ${item.serie}${item.rg}:`, error)
        errors.push(`${item.serie}${item.rg}: ${error.message}`)
      }
    }

    await client.query('COMMIT')

    return sendSuccess(res, {
      total: data.length,
      created: created.length,
      errors: errors.length,
      details: created,
      errorDetails: errors
    }, `${created.length} diagnósticos de gestação importados com sucesso`)
  } catch (error) {
    await client.query('ROLLBACK')
    logger.error('Erro ao importar DGs:', error)
    return sendValidationError(res, `Erro ao importar: ${error.message}`)
  } finally {
    client.release()
  }
})
