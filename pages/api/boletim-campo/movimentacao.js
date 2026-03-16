/**
 * API para registrar movimentações (saída/entrada) no Boletim Campo
 */
import { query } from '../../../lib/database'
import { blockIfNotAdelso } from '../../../utils/boletimAccess'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' })
  }
  if (blockIfNotAdelso(req, res)) return

  try {
    const { boletimCampoId, tipo, destinoLocal, destinoSubLocal, motivo, quantidade, usuario, sexo, era, raca, categoria, observacao } = req.body

    if (!boletimCampoId || !tipo || !motivo) {
      return res.status(400).json({
        success: false,
        message: 'boletimCampoId, tipo e motivo são obrigatórios'
      })
    }

    const qtd = parseInt(quantidade) || 1

    await query(`
      INSERT INTO boletim_campo_movimentacoes 
      (boletim_campo_id, tipo, destino_local, destino_sub_local, motivo, quantidade, sexo, era, raca, categoria, observacao, usuario)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [boletimCampoId, tipo, destinoLocal || null, destinoSubLocal || null, motivo, qtd, sexo || null, era || null, raca || null, categoria || null, observacao || null, usuario || null])

    // Atualizar quantidade no boletim_campo
    const reg = await query('SELECT quant FROM boletim_campo WHERE id = $1', [boletimCampoId])
    if (reg.rows.length > 0) {
      let novaQuant = reg.rows[0].quant || 0
      if (tipo === 'saida') {
        novaQuant = Math.max(0, novaQuant - qtd)
      } else {
        novaQuant += qtd
      }
      await query('UPDATE boletim_campo SET quant = $1, updated_at = NOW() WHERE id = $2', [novaQuant, boletimCampoId])
    }

    // Se for saída para outro local, criar/atualizar o destino
    if (tipo === 'saida' && motivo === 'piquete' && (destinoLocal || destinoSubLocal)) {
      const destLocal = destinoLocal || destinoSubLocal
      const destSub = destinoSubLocal || destinoLocal
      const existente = await query(
        `SELECT id, quant FROM boletim_campo 
         WHERE local = $1 OR sub_local_2 = $2 OR local_1 = $2
         LIMIT 1`,
        [destLocal, destSub]
      )
      if (existente.rows.length > 0) {
        await query(
          'UPDATE boletim_campo SET quant = quant + $1, updated_at = NOW() WHERE id = $2',
          [qtd, existente.rows[0].id]
        )
      } else {
        await query(`
          INSERT INTO boletim_campo (local, local_1, sub_local_2, quant, usuario)
          VALUES ($1, $2, $3, $4, $5)
        `, [destLocal, destSub, destSub, qtd, usuario || null])
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Movimentação registrada'
    })
  } catch (error) {
    console.error('Erro ao registrar movimentação:', error)
    return res.status(500).json({
      success: false,
      message: 'Erro ao registrar',
      error: error.message
    })
  }
}
