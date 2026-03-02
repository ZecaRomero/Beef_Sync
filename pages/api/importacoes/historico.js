import { pool } from '../../../lib/database'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    const result = await pool.query(`
      SELECT 
        id,
        tipo,
        descricao,
        registros,
        usuario,
        status,
        data_importacao as data,
        detalhes
      FROM importacoes_historico
      ORDER BY data_importacao DESC
      LIMIT 50
    `)

    return res.status(200).json({
      success: true,
      historico: result.rows
    })
  } catch (error) {
    console.error('Erro ao buscar histórico:', error)
    return res.status(500).json({
      error: 'Erro ao buscar histórico',
      message: error.message
    })
  }
}
