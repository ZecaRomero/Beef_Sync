/**
 * API de diagnóstico: verificar dados de venda/baixa para um animal
 * GET /api/animals/debug-baixas?serie=CJCJ&rg=16013
 */
import databaseService from '../../../services/databaseService'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  const { serie, rg } = req.query || {}
  if (!serie || !rg) {
    return res.status(400).json({ error: 'Informe serie e rg (ex: ?serie=CJCJ&rg=16013)' })
  }

  try {
    const serieNorm = String(serie).trim()
    const rgNorm = String(rg).trim()

    const [animais, baixas, vendaMov, vendaNf] = await Promise.all([
      databaseService.buscarAnimais({ serie: serieNorm, rg: rgNorm }),
      databaseService.buscarBaixasPorSerieRg(serieNorm, rgNorm),
      databaseService.buscarVendaPorMovimentacaoContabil(serieNorm, rgNorm),
      databaseService.buscarVendaPorNotaFiscalSaida(serieNorm, rgNorm).catch(() => null),
    ])

    const animal = animais && animais.length > 0 ? animais[0] : null
    const vendaBaixas = baixas?.find(b => b.tipo === 'VENDA') || null

    return res.status(200).json({
      success: true,
      serie: serieNorm,
      rg: rgNorm,
      diagnostic: {
        emAnimais: !!animal,
        animalSituacao: animal?.situacao || null,
        animalValorVenda: animal?.valor_venda != null ? parseFloat(animal.valor_venda) : null,
        emBaixas: (baixas?.length || 0) > 0,
        vendaEmBaixas: vendaBaixas ? {
          numero_nf: vendaBaixas.numero_nf,
          data_baixa: vendaBaixas.data_baixa,
          valor: vendaBaixas.valor != null ? parseFloat(vendaBaixas.valor) : null,
          comprador: vendaBaixas.comprador,
        } : null,
        emMovimentacoes: !!vendaMov,
        vendaMovimentacoes: vendaMov ? {
          valor: vendaMov.valor != null ? parseFloat(vendaMov.valor) : null,
          data_movimento: vendaMov.data_movimento,
        } : null,
        emNotasFiscais: !!vendaNf,
        vendaNotasFiscais: vendaNf ? {
          numero_nf: vendaNf.numero_nf,
          destino: vendaNf.destino,
          data_compra: vendaNf.data_compra,
        } : null,
      },
      conclusao: (() => {
        if (vendaBaixas) return 'Venda encontrada em baixas - deve aparecer'
        if (animal && (animal.situacao === 'Vendido' || animal.valor_venda)) return 'Venda em animais - deve aparecer (fallback)'
        if (vendaMov) return 'Venda em movimentações - deve aparecer (fallback 3)'
        if (vendaNf) return 'Venda em notas fiscais - deve aparecer (fallback 4)'
        return 'Nenhuma venda encontrada - use o link "Registrar venda" na ficha do animal'
      })(),
    })
  } catch (error) {
    console.error('Erro debug baixas:', error)
    return res.status(500).json({ error: error.message })
  }
}
