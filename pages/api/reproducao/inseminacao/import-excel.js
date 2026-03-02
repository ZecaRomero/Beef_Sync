/**
 * API para importar Inseminações Artificiais do Excel
 */

import { pool } from '../../../../lib/database'
import { asyncHandler, sendSuccess, sendValidationError } from '../../../../utils/apiResponse'
import logger from '../../../../utils/logger'

export default asyncHandler(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método não permitido' })
  }

  const { data } = req.body

  if (!data || !Array.isArray(data) || data.length === 0) {
    return sendValidationError(res, 'Dados inválidos ou vazios')
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const created = []
    const errors = []

    const converterData = (dataStr) => {
      if (!dataStr) return null
      try {
        const parts = dataStr.toString().split(/[\/\-]/)
        if (parts.length === 3) {
          const day = parseInt(parts[0])
          const month = parseInt(parts[1]) - 1
          const year = parseInt(parts[2])
          return new Date(year, month, day).toISOString().split('T')[0]
        }
      } catch (e) {
        return null
      }
      return null
    }

    for (const item of data) {
      try {
        // Buscar animal
        const animalResult = await client.query(
          'SELECT id, sexo FROM animais WHERE serie = $1 AND rg = $2',
          [item.serie, item.rg]
        )

        if (animalResult.rows.length === 0) {
          errors.push(`Animal ${item.serie}${item.rg} não encontrado`)
          continue
        }

        const animal = animalResult.rows[0]
        const sexo = (animal.sexo || '').toString().trim()

        if (sexo !== 'Fêmea' && sexo !== 'F' && sexo !== 'Femea') {
          errors.push(`Animal ${item.serie}${item.rg} não é fêmea (${sexo})`)
          continue
        }

        // Processar até 3 inseminações
        const inseminacoes = []

        await client.query('ALTER TABLE inseminacoes ADD COLUMN IF NOT EXISTS valida BOOLEAN DEFAULT true').catch(() => {})

        for (let i = 1; i <= 3; i++) {
          const dataIA = converterData(item[`data_ia${i}`] || item[`dataIA${i}`])
          if (!dataIA) continue

          await client.query(`
            UPDATE inseminacoes SET valida = false, status_gestacao = 'Vazia',
              resultado_dg = COALESCE(NULLIF(TRIM(resultado_dg), ''), 'Vazia'),
              updated_at = CURRENT_TIMESTAMP
            WHERE animal_id = $1
          `, [animal.id])

          const touro = item[`touro${i}`] || item[`touro_${i}`] || null
          const serieTouro = item[`serie_touro${i}`] || item[`serieTouro${i}`] || null
          const rgTouro = item[`rg_touro${i}`] || item[`rgTouro${i}`] || null
          const dataDG = converterData(item[`data_dg${i}`] || item[`dataDG${i}`])
          const resultado = item[`resultado${i}`] || item[`resultado_${i}`] || null

          // Buscar sêmen do touro se informado
          let semenId = null
          if (serieTouro && rgTouro) {
            const semenResult = await client.query(
              'SELECT id FROM semen WHERE serie_touro = $1 AND rg_touro = $2 ORDER BY created_at DESC LIMIT 1',
              [serieTouro, rgTouro]
            )
            if (semenResult.rows.length > 0) {
              semenId = semenResult.rows[0].id
            }
          }

          // Inserir inseminação
          const inseminacaoResult = await client.query(
            `INSERT INTO inseminacoes 
             (animal_id, numero_ia, touro, serie_touro, rg_touro, semen_id, data_ia, data_dg, resultado_dg, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             RETURNING *`,
            [animal.id, i, touro, serieTouro, rgTouro, semenId, dataIA, dataDG, resultado]
          )

          inseminacoes.push(inseminacaoResult.rows[0])

          // Se resultado for positivo, criar gestação
          if (resultado && (resultado.toString().toUpperCase().includes('P') || resultado.toString().toUpperCase().includes('POSITIVO'))) {
            await client.query(
              `INSERT INTO gestacoes 
               (animal_id, data_inseminacao, data_diagnostico, resultado_diagnostico, ativa, created_at, updated_at)
               VALUES ($1, $2, $3, $4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
               ON CONFLICT DO NOTHING`,
              [animal.id, dataIA, dataDG, resultado]
            )
          }
        }

        if (inseminacoes.length > 0) {
          created.push({
            animal_id: animal.id,
            serie: item.serie,
            rg: item.rg,
            inseminacoes: inseminacoes.length
          })
        }
      } catch (error) {
        logger.error(`Erro ao processar IA para ${item.serie}${item.rg}:`, error)
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
    }, `${created.length} inseminações importadas com sucesso`)
  } catch (error) {
    await client.query('ROLLBACK')
    logger.error('Erro ao importar inseminações:', error)
    return sendValidationError(res, `Erro ao importar: ${error.message}`)
  } finally {
    client.release()
  }
})
