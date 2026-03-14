/**
 * API para gerar dados do Boletim Contábil
 * Conectado ao PostgreSQL
 */

import databaseService from '../../../services/databaseService'
import { logger } from '../../../utils/logger'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { periodo } = req.body

    if (!periodo) {
      return res.status(400).json({ message: 'Período é obrigatório' })
    }

    // Carregar dados do PostgreSQL
    const boletim = await databaseService.obterBoletimPeriodo(periodo)
    
    // Buscar movimentações do período
    const movimentacoes = await databaseService.buscarMovimentacoes(periodo)
    
    // Processar movimentações por tipo
    const entradas = movimentacoes.filter(m => m.tipo === 'entrada')
    const saidas = movimentacoes.filter(m => m.tipo === 'saida')
    const custos = movimentacoes.filter(m => m.tipo === 'custo')
    const receitas = movimentacoes.filter(m => m.tipo === 'receita')
    
    // Calcular totais
    const totalEntradas = entradas.reduce((sum, m) => sum + parseFloat(m.valor || 0), 0)
    const totalSaidas = saidas.reduce((sum, m) => sum + parseFloat(m.valor || 0), 0)
    const totalCustos = custos.reduce((sum, m) => sum + parseFloat(m.valor || 0), 0)
    const totalReceitas = receitas.reduce((sum, m) => sum + parseFloat(m.valor || 0), 0)
    
    const boletimData = {
      id: boletim?.id || `boletim_${periodo}`,
      periodo,
      dataCriacao: boletim?.data_criacao || new Date().toISOString(),
      dataAtualizacao: boletim?.data_atualizacao || new Date().toISOString(),
      status: boletim?.status || 'aberto',
      entradas: {
        nascimentos: entradas.filter(m => m.subtipo === 'nascimento'),
        compras: entradas.filter(m => m.subtipo === 'compra'),
        outrasEntradas: entradas.filter(m => !['nascimento', 'compra'].includes(m.subtipo))
      },
      saidas: {
        vendas: saidas.filter(m => m.subtipo === 'venda'),
        mortes: saidas.filter(m => m.subtipo === 'morte'),
        outrasSaidas: saidas.filter(m => !['venda', 'morte'].includes(m.subtipo))
      },
      custos,
      receitas,
      resumo: {
        totalEntradas,
        totalSaidas,
        totalCustos,
        totalReceitas,
        saldoPeriodo: totalReceitas + totalEntradas - totalSaidas - totalCustos
      }
    }

    res.status(200).json({
      success: true,
      data: boletimData
    })

  } catch (error) {
    logger.error('❌ Erro ao gerar boletim:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
}
