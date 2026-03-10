/**
 * API: Registrar venda manualmente (insere em baixas)
 * POST /api/animals/registrar-venda
 * Body: { serie, rg, data_venda, valor, comprador?, numero_nf? }
 */
import databaseService from '../../../services/databaseService'

function parseData(val) {
  if (!val) return null
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) return val.slice(0, 10)
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    const { serie, rg, data_venda, valor, comprador, numero_nf } = req.body || {}
    const serieNorm = String(serie || '').trim()
    const rgNorm = String(rg || '').trim()

    if (!serieNorm || !rgNorm) {
      return res.status(400).json({ success: false, error: 'Informe serie e rg' })
    }

    const dataBaixa = parseData(data_venda) || new Date().toISOString().slice(0, 10)
    const valorNum = valor != null ? parseFloat(String(valor).replace(',', '.')) : null

    const animais = await databaseService.buscarAnimais({ serie: serieNorm, rg: rgNorm })
    const animal = animais && animais.length > 0 ? animais[0] : null

    await databaseService.inserirBaixa({
      animal_id: animal?.id || null,
      serie: serieNorm,
      rg: rgNorm,
      tipo: 'VENDA',
      causa: null,
      data_baixa: dataBaixa,
      comprador: comprador ? String(comprador).trim() : null,
      valor: valorNum,
      numero_nf: numero_nf ? String(numero_nf).trim() : null,
      serie_mae: null,
      rg_mae: null,
    })

    if (animal?.id && valorNum != null) {
      const { pool } = require('../../../lib/database')
      await pool.query(
        `UPDATE animais SET situacao = 'Vendido', valor_venda = COALESCE($2, valor_venda), updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [animal.id, valorNum]
      )
    }

    return res.status(200).json({
      success: true,
      message: `Venda de ${serieNorm} ${rgNorm} registrada com sucesso`,
    })
  } catch (error) {
    console.error('Erro ao registrar venda:', error)
    return res.status(500).json({ success: false, error: error.message })
  }
}
