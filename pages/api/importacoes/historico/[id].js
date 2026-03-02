import { pool } from '../../../../lib/database'

export default async function handler(req, res) {
  const { id } = req.query

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    // Verificar se o registro existe
    const checkResult = await pool.query(
      'SELECT id FROM importacoes_historico WHERE id = $1',
      [id]
    )

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Registro não encontrado' })
    }

    // Excluir o registro
    await pool.query(
      'DELETE FROM importacoes_historico WHERE id = $1',
      [id]
    )

    return res.status(200).json({
      success: true,
      message: 'Registro excluído com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir registro:', error)
    return res.status(500).json({
      error: 'Erro ao excluir registro',
      message: error.message
    })
  }
}
