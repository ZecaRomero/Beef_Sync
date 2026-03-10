/**
 * API para corrigir animais onde pai ou mae estão iguais ao nome do próprio animal.
 * GET = lista os afetados | POST = aplica a correção
 */
import { query } from '../../../lib/database'

function normalizar(s) {
  if (!s) return ''
  return String(s).trim().toUpperCase()
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' })
  }

  try {
    const r = await query(`
      SELECT id, serie, rg, nome, pai, mae, serie_pai, rg_pai, serie_mae, rg_mae
      FROM animais
      WHERE (pai IS NOT NULL AND TRIM(pai) != '')
         OR (mae IS NOT NULL AND TRIM(mae) != '')
    `)

    const afetados = []
    for (const a of r.rows) {
      const nomeNorm = normalizar(a.nome)
      const paiNorm = normalizar(a.pai)
      const maeNorm = normalizar(a.mae)
      if (!nomeNorm) continue

      const paiErrado = paiNorm && paiNorm === nomeNorm
      const maeErrada = maeNorm && maeNorm === nomeNorm

      if (paiErrado || maeErrada) {
        afetados.push({
          ...a,
          paiErrado: !!paiErrado,
          maeErrada: !!maeErrada
        })
      }
    }

    if (req.method === 'GET') {
      return res.status(200).json({
        success: true,
        total: afetados.length,
        afetados: afetados.slice(0, 100)
      })
    }

    if (req.method === 'POST') {
      let corrigidos = 0
      for (const a of afetados) {
        const updates = []
        const values = []
        if (a.paiErrado) {
          updates.push('pai = $' + (values.length + 1))
          values.push(null)
        }
        if (a.maeErrada) {
          updates.push('mae = $' + (values.length + 1))
          values.push(null)
        }
        if (updates.length > 0) {
          values.push(a.id)
          await query(
            `UPDATE animais SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length}`,
            values
          )
          corrigidos++
        }
      }
      return res.status(200).json({
        success: true,
        message: `${corrigidos} animal(is) corrigido(s)`,
        corrigidos,
        totalAfetados: afetados.length
      })
    }
  } catch (error) {
    console.error('Erro ao corrigir pai/mae:', error)
    return res.status(500).json({
      success: false,
      message: 'Erro ao processar',
      error: error.message
    })
  }
}
