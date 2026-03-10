/**
 * API para corrigir valores de vendas na tabela baixas
 * Multiplica por 1000 valores suspeitos (< 100 e tipo VENDA)
 */

import { query } from '../../../lib/database'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    // 1. Buscar todas as vendas com valores suspeitos (< 100)
    const result = await query(`
      SELECT id, serie, rg, valor, comprador, numero_nf, data_baixa
      FROM baixas
      WHERE tipo = 'VENDA' 
        AND valor IS NOT NULL 
        AND valor > 0 
        AND valor < 100
      ORDER BY valor DESC
    `)

    const registros = result.rows || []

    if (registros.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Nenhum registro precisa de correção',
        corrigidos: 0,
        registros: []
      })
    }

    // Executar correção
    const corrigidos = []
    const erros = []

    for (const registro of registros) {
      try {
        const valorAtual = parseFloat(registro.valor)
        const valorCorrigido = valorAtual * 1000

        await query(`
          UPDATE baixas
          SET valor = $1
          WHERE id = $2
        `, [valorCorrigido, registro.id])

        // Também atualizar o valor_venda na tabela animais se existir
        await query(`
          UPDATE animais
          SET valor_venda = $1
          WHERE serie = $2 AND rg = $3
        `, [valorCorrigido, registro.serie, registro.rg])

        corrigidos.push({
          serie: registro.serie,
          rg: registro.rg,
          valorAnterior: valorAtual,
          valorNovo: valorCorrigido,
          comprador: registro.comprador,
          numeroNf: registro.numero_nf
        })
      } catch (err) {
        erros.push({
          serie: registro.serie,
          rg: registro.rg,
          erro: err.message
        })
      }
    }

    return res.status(200).json({
      success: true,
      message: `Correção concluída: ${corrigidos.length} registros corrigidos`,
      corrigidos: corrigidos.length,
      erros: erros.length,
      registros: corrigidos,
      errosDetalhes: erros
    })

  } catch (error) {
    console.error('Erro ao corrigir valores:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao corrigir valores'
    })
  }
}
