import { query } from '../../../lib/database'
import { asyncHandler } from '../../../utils/apiResponse'

async function transferirHandler(req, res) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const { id, tipo } = req.body
  if (!id || !tipo) {
    return res.status(400).json({ success: false, message: 'id e tipo são obrigatórios' })
  }
  if (!['semen', 'embriao'].includes(tipo)) {
    return res.status(400).json({ success: false, message: 'tipo deve ser "semen" ou "embriao"' })
  }

  // Garante que a coluna existe (idempotente)
  await query(`ALTER TABLE estoque_semen ADD COLUMN IF NOT EXISTS tipo VARCHAR(20)`)

  await query(
    `UPDATE estoque_semen SET tipo = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
    [tipo, id]
  )

  const result = await query(`SELECT * FROM estoque_semen WHERE id = $1`, [id])
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Registro não encontrado' })
  }

  return res.status(200).json({ success: true, data: result.rows[0] })
}

export default asyncHandler(transferirHandler)
