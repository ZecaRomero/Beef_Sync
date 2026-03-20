/**
 * API: Registrar vendas do relatório de NF (Excel/base) como baixas tipo VENDA.
 * POST /api/animals/sincronizar-vendas-relatorio
 * Body: { vendas: [{ serie, rg, dataVenda?, valor?, comprador?, notaFiscal? }, ...] }
 *
 * - Exige série e RG para identificar o animal.
 * - Ignora se já existir baixa VENDA para o mesmo série+RG.
 * - Insere baixa mesmo sem animal no cadastro (animal_id null); se existir, atualiza situação/valor.
 */
import databaseService from '../../../services/databaseService'

function parseData(val) {
  if (!val) return null
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) return val.slice(0, 10)
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
}

function parseValorApi(v) {
  if (v == null || v === '') return null
  if (typeof v === 'number' && !isNaN(v)) return v
  const s = String(v).replace(/[R$\s]/g, '')
  if (/\d{1,3}(\.\d{3})*(,\d+)?$/.test(s)) return parseFloat(s.replace(/\./g, '').replace(',', '.')) || null
  const n = parseFloat(s.replace(',', '.'))
  return isNaN(n) ? null : n
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  const { vendas } = req.body || {}
  if (!Array.isArray(vendas)) {
    return res.status(400).json({ success: false, error: 'Envie vendas como array' })
  }

  const resultado = {
    success: true,
    inseridos: 0,
    animais_atualizados: 0,
    ignorados_sem_serie_rg: 0,
    ignorados_ja_vendidos: 0,
    ignorados_duplicados_no_lote: 0,
    erros: [],
  }

  const vistoNoLote = new Set()

  for (let i = 0; i < vendas.length; i++) {
    const v = vendas[i]
    try {
      const serieNorm = String(v?.serie || '').trim()
      const rgNorm = String(v?.rg || '').trim()
      if (!serieNorm || !rgNorm) {
        resultado.ignorados_sem_serie_rg++
        continue
      }

      const chaveLote = `${serieNorm.toUpperCase()}|${rgNorm}`
      if (vistoNoLote.has(chaveLote)) {
        resultado.ignorados_duplicados_no_lote++
        continue
      }
      vistoNoLote.add(chaveLote)

      const existentes = await databaseService.buscarBaixasPorSerieRg(serieNorm, rgNorm)
      if (existentes.some(b => String(b.tipo || '').toUpperCase() === 'VENDA')) {
        resultado.ignorados_ja_vendidos++
        continue
      }

      const dataBaixa = parseData(v.dataVenda) || new Date().toISOString().slice(0, 10)
      const valorNum = parseValorApi(v.valor)
      const comprador = v.comprador ? String(v.comprador).trim() : null
      const numero_nf = v.notaFiscal ? String(v.notaFiscal).trim() : null

      const animais = await databaseService.buscarAnimais({ serie: serieNorm, rg: rgNorm })
      const animal = animais && animais.length > 0 ? animais[0] : null

      await databaseService.inserirBaixa({
        animal_id: animal?.id || null,
        serie: serieNorm,
        rg: rgNorm,
        tipo: 'VENDA',
        causa: null,
        data_baixa: dataBaixa,
        comprador,
        valor: valorNum,
        numero_nf,
        serie_mae: null,
        rg_mae: null,
      })
      resultado.inseridos++

      if (animal?.id && valorNum != null && !isNaN(valorNum)) {
        const { pool } = require('../../../lib/database')
        await pool.query(
          `UPDATE animais SET situacao = 'Vendido', valor_venda = COALESCE($2, valor_venda), updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [animal.id, valorNum]
        )
        resultado.animais_atualizados++
      }
    } catch (e) {
      resultado.erros.push({
        idx: i,
        serie: v?.serie,
        rg: v?.rg,
        message: e.message || String(e),
      })
    }
  }

  return res.status(200).json(resultado)
}
