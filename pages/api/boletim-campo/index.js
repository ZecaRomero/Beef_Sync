import { query } from '../../../lib/database'
import { blockIfNotAdelso } from '../../../utils/boletimAccess'

// Inicializar tabela uma única vez por processo (não em toda requisição)
let tableReady = false
async function ensureBoletimCampoTable() {
  if (tableReady) return
  await query(`
    CREATE TABLE IF NOT EXISTS boletim_campo (
      id SERIAL PRIMARY KEY,
      local VARCHAR(200) NOT NULL,
      local_1 VARCHAR(200),
      sub_local_2 VARCHAR(200),
      quant INTEGER DEFAULT 0,
      sexo CHAR(1),
      categoria VARCHAR(100),
      raca VARCHAR(100),
      era VARCHAR(50),
      observacao TEXT,
      usuario VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
  tableReady = true
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      await ensureBoletimCampoTable()
      const result = await query(`
        SELECT id, local, local_1, sub_local_2, quant, sexo, categoria, raca, era, observacao, usuario, created_at, updated_at
        FROM boletim_campo
        ORDER BY local, local_1, sub_local_2
      `)
      return res.status(200).json({
        success: true,
        data: result.rows || []
      })
    } catch (error) {
      console.error('Erro ao buscar boletim campo:', error)
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar dados',
        error: error.message
      })
    }
  }

  if (req.method === 'POST') {
    if (blockIfNotAdelso(req, res)) return
    try {
      const { local, local_1, sub_local_2, quant, sexo, categoria, raca, era, observacao, usuario } = req.body
      const result = await query(`
        INSERT INTO boletim_campo (local, local_1, sub_local_2, quant, sexo, categoria, raca, era, observacao, usuario)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, local, local_1, sub_local_2, quant, sexo, categoria, raca, era, observacao, usuario, created_at
      `, [
        local || '',
        local_1 || null,
        sub_local_2 || null,
        parseInt(quant) || 0,
        sexo || null,
        categoria || null,
        raca || null,
        era || null,
        observacao || null,
        usuario || null
      ])
      return res.status(201).json({
        success: true,
        data: result.rows[0]
      })
    } catch (error) {
      console.error('Erro ao criar registro:', error)
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar registro',
        error: error.message
      })
    }
  }

  if (req.method === 'PUT') {
    if (blockIfNotAdelso(req, res)) return
    try {
      const { id, local, local_1, sub_local_2, quant, sexo, categoria, raca, era, observacao, usuario } = req.body
      if (!id) {
        return res.status(400).json({ success: false, message: 'ID é obrigatório' })
      }
      await query(`
        UPDATE boletim_campo
        SET local = COALESCE($2, local),
            local_1 = COALESCE($3, local_1),
            sub_local_2 = COALESCE($4, sub_local_2),
            quant = COALESCE($5, quant),
            sexo = COALESCE($6, sexo),
            categoria = COALESCE($7, categoria),
            raca = COALESCE($8, raca),
            era = COALESCE($9, era),
            observacao = COALESCE($10, observacao),
            usuario = COALESCE($11, usuario),
            updated_at = NOW()
        WHERE id = $1
      `, [id, local, local_1, sub_local_2, quant, sexo, categoria, raca, era, observacao, usuario])
      const updated = await query('SELECT * FROM boletim_campo WHERE id = $1', [id])
      return res.status(200).json({
        success: true,
        data: updated.rows[0]
      })
    } catch (error) {
      console.error('Erro ao atualizar:', error)
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar',
        error: error.message
      })
    }
  }

  if (req.method === 'DELETE') {
    if (blockIfNotAdelso(req, res)) return
    try {
      const { id } = req.body
      if (!id) {
        return res.status(400).json({ success: false, message: 'ID é obrigatório' })
      }
      await query('DELETE FROM boletim_campo WHERE id = $1', [id])
      return res.status(200).json({ success: true, message: 'Registro excluído' })
    } catch (error) {
      console.error('Erro ao excluir:', error)
      return res.status(500).json({
        success: false,
        message: 'Erro ao excluir',
        error: error.message
      })
    }
  }

  return res.status(405).json({ message: 'Método não permitido' })
}
