/**
 * API para importar Notas Fiscais do Excel
 */

import { pool } from '../../../lib/database'
import { asyncHandler, sendSuccess, sendValidationError } from '../../../utils/apiResponse'
import logger from '../../../utils/logger'
import { blockIfNotZecaDeveloper } from '../../../utils/importAccess'

export default asyncHandler(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método não permitido' })
  }

  const blocked = blockIfNotZecaDeveloper(req, res)
  if (blocked) return blocked

  const { data } = req.body

  if (!data || !Array.isArray(data) || data.length === 0) {
    return sendValidationError(res, 'Dados inválidos ou vazios')
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const created = []
    const errors = []

    // Função para converter data
    const converterData = (dataStr) => {
      if (!dataStr) return null
      try {
        if (dataStr instanceof Date) {
          return dataStr.toISOString().split('T')[0]
        }
        if (typeof dataStr === 'string') {
          // Formato ISO
          if (/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) {
            return dataStr
          }
          // Formato brasileiro dd/MM/yyyy
          const parts = dataStr.toString().split(/[\/\-]/)
          if (parts.length === 3) {
            const day = parseInt(parts[0])
            const month = parseInt(parts[1]) - 1
            const year = parseInt(parts[2])
            return new Date(year, month, day).toISOString().split('T')[0]
          }
        }
      } catch (e) {
        logger.warn(`Erro ao converter data: ${dataStr}`, e)
      }
      return null
    }

    // Função para converter valor monetário
    const converterValor = (valor) => {
      if (!valor) return 0
      if (typeof valor === 'number') return valor
      if (typeof valor === 'string') {
        // Remove símbolos e espaços
        const limpo = valor.replace(/[R$\s\.]/g, '').replace(',', '.')
        const num = parseFloat(limpo)
        return isNaN(num) ? 0 : num
      }
      return 0
    }

    for (const item of data) {
      try {
        // Validar campos obrigatórios
        if (!item.numero_nf && !item.numeroNF && !item.numero_nfiscal) {
          errors.push(`Nota fiscal sem número: ${JSON.stringify(item)}`)
          continue
        }

        const numeroNF = item.numero_nf || item.numeroNF || item.numero_nfiscal
        const tipo = item.tipo || item.tipo_nf || 'entrada'
        const dataNF = converterData(item.data || item.data_nf || item.dataNF)
        const fornecedor = item.fornecedor || item.fornecedor_nome || ''
        const destino = item.destino || item.destino_nome || ''
        const valorTotal = converterValor(item.valor_total || item.valorTotal || item.valor || 0)

        // Verificar se já existe
        const existeResult = await client.query(
          'SELECT id FROM notas_fiscais WHERE numero_nf = $1',
          [numeroNF]
        )

        if (existeResult.rows.length > 0) {
          // Atualizar existente
          await client.query(
            `UPDATE notas_fiscais 
             SET tipo = $1, data = $2, fornecedor = $3, destino = $4, valor_total = $5, updated_at = CURRENT_TIMESTAMP
             WHERE numero_nf = $6`,
            [tipo, dataNF, fornecedor, destino, valorTotal, numeroNF]
          )
          created.push({
            numero_nf: numeroNF,
            action: 'updated'
          })
        } else {
          // Criar nova
          const insertResult = await client.query(
            `INSERT INTO notas_fiscais 
             (numero_nf, tipo, data, fornecedor, destino, valor_total, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             RETURNING *`,
            [numeroNF, tipo, dataNF, fornecedor, destino, valorTotal]
          )

          created.push({
            numero_nf: numeroNF,
            action: 'created',
            id: insertResult.rows[0].id
          })

          // Processar itens se existirem
          if (item.itens && Array.isArray(item.itens) && item.itens.length > 0) {
            for (const itemNF of item.itens) {
              const descricao = itemNF.descricao || itemNF.produto || ''
              const quantidade = parseFloat(itemNF.quantidade || itemNF.qtd || 1)
              const valorUnitario = converterValor(itemNF.valor_unitario || itemNF.valor_unit || itemNF.valor || 0)
              const valorItem = converterValor(itemNF.valor_total || itemNF.valor_item || valorUnitario * quantidade)

              await client.query(
                `INSERT INTO notas_fiscais_itens 
                 (nota_fiscal_id, descricao, quantidade, valor_unitario, valor_total, created_at)
                 VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
                [insertResult.rows[0].id, descricao, quantidade, valorUnitario, valorItem]
              )
            }
          }
        }
      } catch (error) {
        logger.error(`Erro ao processar NF ${item.numero_nf || item.numeroNF}:`, error)
        errors.push(`${item.numero_nf || item.numeroNF || 'Desconhecida'}: ${error.message}`)
      }
    }

    await client.query('COMMIT')

    return sendSuccess(res, {
      total: data.length,
      created: created.length,
      errors: errors.length,
      details: created,
      errorDetails: errors
    }, `${created.length} notas fiscais importadas com sucesso`)
  } catch (error) {
    await client.query('ROLLBACK')
    logger.error('Erro ao importar notas fiscais:', error)
    return sendValidationError(res, `Erro ao importar: ${error.message}`)
  } finally {
    client.release()
  }
})
