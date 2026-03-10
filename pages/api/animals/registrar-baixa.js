/**
 * API: Registrar baixa (venda, morte ou abate) - para animais cadastrados ou não
 * POST /api/animals/registrar-baixa
 * Body: { serie, rg, tipo: 'VENDA'|'MORTE/BAIXA', data_baixa, valor?, comprador?, numero_nf?, causa? }
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
    const { serie, rg, tipo, data_baixa, valor, comprador, numero_nf, causa } = req.body || {}
    const serieNorm = String(serie || '').trim()
    const rgNorm = String(rg || '').trim()
    const tipoNorm = tipo === 'MORTE/BAIXA' ? 'MORTE/BAIXA' : 'VENDA'

    if (!serieNorm || !rgNorm) {
      return res.status(400).json({ success: false, error: 'Informe serie e rg' })
    }

    const dataBaixa = parseData(data_baixa) || new Date().toISOString().slice(0, 10)
    const valorNum = valor != null ? parseFloat(String(valor).replace(',', '.')) : null

    const animais = await databaseService.buscarAnimais({ serie: serieNorm, rg: rgNorm })
    const animal = animais && animais.length > 0 ? animais[0] : null

    await databaseService.inserirBaixa({
      animal_id: animal?.id || null,
      serie: serieNorm,
      rg: rgNorm,
      tipo: tipoNorm,
      causa: tipoNorm === 'MORTE/BAIXA' ? (causa ? String(causa).trim() : 'Abate') : null,
      data_baixa: dataBaixa,
      comprador: tipoNorm === 'VENDA' ? (comprador ? String(comprador).trim() : null) : null,
      valor: tipoNorm === 'VENDA' ? valorNum : null,
      numero_nf: tipoNorm === 'VENDA' ? (numero_nf ? String(numero_nf).trim() : null) : null,
      serie_mae: null,
      rg_mae: null,
    })

    if (animal?.id) {
      const { pool } = require('../../../lib/database')
      if (tipoNorm === 'VENDA' && valorNum != null) {
        await pool.query(
          `UPDATE animais SET situacao = 'Vendido', valor_venda = COALESCE($2, valor_venda), updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [animal.id, valorNum]
        )
      } else if (tipoNorm === 'MORTE/BAIXA') {
        await pool.query(
          `UPDATE animais SET situacao = 'Morto', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [animal.id]
        )
      }
    }

    return res.status(200).json({
      success: true,
      message: `${tipoNorm === 'VENDA' ? 'Venda' : 'Baixa (abate/morte)'} de ${serieNorm} ${rgNorm} registrada com sucesso`,
    })
  } catch (error) {
    console.error('Erro ao registrar baixa:', error)
    return res.status(500).json({ success: false, error: error.message })
  }
}
