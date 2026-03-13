/**
 * API: Resumo de baixas do animal (próprias e como mãe)
 * GET /api/animals/baixas-resumo?serie=X&rg=Y
 */
import databaseService from '../../../services/databaseService'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  const { serie, rg } = req.query || {}
  if (!serie || !rg) {
    return res.status(400).json({ error: 'Informe serie e rg' })
  }

  try {
    const serieNorm = String(serie).trim()
    const rgNorm = String(rg).trim()
    const animais = await databaseService.buscarAnimais({ serie: serieNorm, rg: rgNorm })
    const animal = animais && animais.length > 0 ? animais[0] : null

    let baixaPropria = null
    let resumoMae = null

    // Baixa própria (animal vendido/morto) - buscar em baixas primeiro
    const baixasProprias = await databaseService.buscarBaixasPorSerieRg(serieNorm, rgNorm)
    if (baixasProprias && baixasProprias.length > 0) {
      const venda = baixasProprias.find(b => b.tipo === 'VENDA')
      const morte = baixasProprias.find(b => b.tipo === 'MORTE/BAIXA')
      baixaPropria = {
        vendido: !!venda,
        morto: !!morte,
        numero_nf: venda?.numero_nf || null,
        data_venda: venda?.data_baixa || null,
        valor: venda?.valor != null ? parseFloat(venda.valor) : null,
        comprador: venda?.comprador || null,
        causa: morte?.causa || null,
        data_baixa: morte?.data_baixa || venda?.data_baixa || null,
      }
    } else if (animal && (animal.situacao === 'Vendido' || animal.valor_venda)) {
      // Fallback 2: venda registrada em animais (valor_venda/situacao), sem registro em baixas
      baixaPropria = {
        vendido: true,
        morto: false,
        numero_nf: null,
        data_venda: null,
        valor: animal.valor_venda != null ? parseFloat(animal.valor_venda) : null,
        comprador: null,
        causa: null,
        data_baixa: null,
      }
    } else {
      // Fallback 3: venda em movimentacoes_contabeis (NF de saída) - animal precisa existir em animais
      const vendaMov = await databaseService.buscarVendaPorMovimentacaoContabil(serieNorm, rgNorm)
      if (vendaMov) {
        let dadosExtras = vendaMov.dados_extras || {}
        if (typeof dadosExtras === 'string') {
          try {
            dadosExtras = JSON.parse(dadosExtras)
          } catch {
            dadosExtras = {}
          }
        }
        baixaPropria = {
          vendido: true,
          morto: false,
          numero_nf: dadosExtras.numero_nf || dadosExtras.numeroNF || null,
          data_venda: vendaMov.data_movimento || null,
          valor: vendaMov.valor != null ? parseFloat(vendaMov.valor) : null,
          comprador: dadosExtras.destino || null,
          causa: null,
          data_baixa: vendaMov.data_movimento || null,
        }
      } else {
        // Fallback 4: venda em notas_fiscais de saída (doadoras não cadastradas em animais)
        const vendaNf = await databaseService.buscarVendaPorNotaFiscalSaida(serieNorm, rgNorm)
        if (vendaNf) {
          const dadosItem = (typeof vendaNf.dados_item === 'string' ? (() => { try { return JSON.parse(vendaNf.dados_item) } catch { return {} } })() : vendaNf.dados_item) || {}
          const valorItem = dadosItem.valorUnitario != null ? parseFloat(String(dadosItem.valorUnitario).replace(',', '.')) : null
          baixaPropria = {
            vendido: true,
            morto: false,
            numero_nf: vendaNf.numero_nf || null,
            data_venda: vendaNf.data_compra || null,
            valor: valorItem,
            comprador: vendaNf.destino || null,
            causa: null,
            data_baixa: vendaNf.data_compra || null,
          }
        }
      }
    }

    // Resumo prole (filhos vendidos/mortos) - SEMPRE buscar, mesmo se mãe não está cadastrada
    const resumo = await databaseService.buscarResumoBaixasMae(serieNorm, rgNorm)
    if (resumo && (parseInt(resumo.qtd_vendidos) > 0 || parseInt(resumo.qtd_mortes_baixas) > 0)) {
      resumoMae = {
        qtdVendidos: parseInt(resumo.qtd_vendidos) || 0,
        qtdMortesBaixas: parseInt(resumo.qtd_mortes_baixas) || 0,
        mediaVendas: parseFloat(resumo.media_vendas) || 0,
        totalVendas: parseFloat(resumo.total_vendas) || 0,
      }
      const proleDetalhes = await databaseService.buscarBaixasFilhosMae(serieNorm, rgNorm)
      resumoMae.proleDetalhes = (proleDetalhes || []).map(b => ({
        serie: b.serie || b.animal_serie,
        rg: b.rg || b.animal_rg,
        tipo: b.tipo,
        causa: b.causa,
        data_baixa: b.data_baixa,
        comprador: b.comprador,
        valor: b.valor != null ? parseFloat(b.valor) : null,
        numero_nf: b.numero_nf,
        sexo: b.sexo,
        pai: b.pai,
        mae: b.mae,
        avo_materno: b.avo_materno,
        data_nascimento: b.data_nascimento,
        meses: b.meses,
      }))
    }

    return res.status(200).json({
      success: true,
      data: {
        baixaPropria,
        resumoMae,
      },
    })
  } catch (error) {
    console.error('Erro ao buscar resumo baixas:', error)
    return res.status(500).json({ error: error.message || 'Erro ao buscar resumo' })
  }
}
