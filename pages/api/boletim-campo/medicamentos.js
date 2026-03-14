import { query } from '../../../lib/database'

let tableReady = false
async function ensureTable() {
  if (tableReady) return
  await query(`
    CREATE TABLE IF NOT EXISTS boletim_campo_medicamentos (
      id SERIAL PRIMARY KEY,
      boletim_campo_id INTEGER,
      local VARCHAR(200),
      local_1 VARCHAR(200),
      sub_local_2 VARCHAR(200),
      medicamento VARCHAR(200) NOT NULL,
      data_aplicacao DATE NOT NULL,
      data_proxima_aplicacao DATE,
      observacao TEXT,
      usuario VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)
  await query(`CREATE INDEX IF NOT EXISTS idx_med_campo_id ON boletim_campo_medicamentos(boletim_campo_id)`)
  await query(`CREATE INDEX IF NOT EXISTS idx_med_data ON boletim_campo_medicamentos(data_aplicacao DESC)`)
  tableReady = true
}

export default async function handler(req, res) {
  try {
    await ensureTable()
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Erro ao criar tabela', error: e.message })
  }

  // GET — busca medicamentos (todos ou filtrado por boletim_campo_id)
  if (req.method === 'GET') {
    try {
      const { id } = req.query
      let result
      if (id) {
        result = await query(
          `SELECT id, boletim_campo_id, local, local_1, sub_local_2, medicamento,
                  data_aplicacao, data_proxima_aplicacao, observacao, usuario, created_at
           FROM boletim_campo_medicamentos
           WHERE boletim_campo_id = $1
           ORDER BY data_aplicacao DESC, created_at DESC`,
          [id]
        )
      } else {
        result = await query(`
          SELECT id, boletim_campo_id, local, local_1, sub_local_2, medicamento,
                 data_aplicacao, data_proxima_aplicacao, observacao, usuario, created_at
          FROM boletim_campo_medicamentos
          ORDER BY data_aplicacao DESC, created_at DESC
        `)
      }
      return res.status(200).json({ success: true, data: result.rows })
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message })
    }
  }

  // POST — registrar nova aplicação de medicamento
  if (req.method === 'POST') {
    try {
      const {
        boletim_campo_id, local, local_1, sub_local_2,
        medicamento, data_aplicacao, data_proxima_aplicacao,
        observacao, usuario
      } = req.body

      if (!medicamento || !data_aplicacao) {
        return res.status(400).json({ success: false, message: 'Medicamento e data de aplicação são obrigatórios' })
      }

      const result = await query(
        `INSERT INTO boletim_campo_medicamentos
           (boletim_campo_id, local, local_1, sub_local_2, medicamento, data_aplicacao, data_proxima_aplicacao, observacao, usuario)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          boletim_campo_id || null,
          local || null,
          local_1 || null,
          sub_local_2 || null,
          medicamento.trim(),
          data_aplicacao,
          data_proxima_aplicacao || null,
          observacao || null,
          usuario || 'Adelso'
        ]
      )

      return res.status(201).json({ success: true, data: result.rows[0] })
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message })
    }
  }

  // DELETE — remover registro de medicamento
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query
      if (!id) return res.status(400).json({ success: false, message: 'ID obrigatório' })
      await query('DELETE FROM boletim_campo_medicamentos WHERE id = $1', [id])
      return res.status(200).json({ success: true })
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message })
    }
  }

  return res.status(405).json({ message: 'Método não permitido' })
}
