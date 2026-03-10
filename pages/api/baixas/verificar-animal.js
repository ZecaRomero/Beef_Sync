/**
 * API para verificar dados de baixas de um animal específico
 */

import { query } from '../../../lib/database'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  const { serie, rg } = req.query

  if (!serie || !rg) {
    return res.status(400).json({ error: 'Informe serie e rg' })
  }

  try {
    // Buscar animal
    const animal = await query(`
      SELECT id, serie, rg, nome, situacao, valor_venda
      FROM animais
      WHERE UPPER(TRIM(serie)) = UPPER(TRIM($1))
        AND TRIM(rg::text) = TRIM($2::text)
    `, [serie, rg])

    // Buscar baixas do animal
    const baixas = await query(`
      SELECT *
      FROM baixas
      WHERE UPPER(TRIM(serie)) = UPPER(TRIM($1))
        AND TRIM(rg::text) = TRIM($2::text)
      ORDER BY data_baixa DESC
    `, [serie, rg])

    // Buscar baixas como mãe
    const baixasMae = await query(`
      SELECT *
      FROM baixas
      WHERE UPPER(TRIM(serie_mae)) = UPPER(TRIM($1))
        AND TRIM(rg_mae::text) = TRIM($2::text)
      ORDER BY data_baixa DESC
    `, [serie, rg])

    return res.status(200).json({
      success: true,
      animal: animal.rows[0] || null,
      baixasProprias: baixas.rows || [],
      baixasComoMae: baixasMae.rows || []
    })

  } catch (error) {
    console.error('Erro ao verificar animal:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao verificar animal'
    })
  }
}
