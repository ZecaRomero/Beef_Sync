const { query } = require('../../../lib/database')

function formatData(value) {
  if (!value) return null
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.split('T')[0]
  if (value instanceof Date) return value.toISOString().split('T')[0]
  return String(value)
}

export const config = { api: { externalResolver: true } }
export default async function handler(req, res) {
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query
      if (id && /^\d+$/.test(String(id))) {
        const result = await query('DELETE FROM pesagens WHERE id = $1 RETURNING id', [parseInt(id, 10)])
        return res.status(200).json({ success: true, deletados: result.rowCount ?? (result.rows || []).length })
      }
      const result = await query('DELETE FROM pesagens RETURNING id')
      const deletados = result.rowCount ?? (result.rows || []).length
      return res.status(200).json({ success: true, deletados })
    } catch (error) {
      console.error('Erro ao excluir pesagens:', error)
      return res.status(500).json({ error: 'Erro ao excluir pesagens: ' + (error.message || 'Erro interno') })
    }
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    const { animalId } = req.query

    let sql = `
      SELECT p.id, p.animal_id, p.peso, p.ce, p.data, p.observacoes, p.created_at,
             a.serie, a.rg, a.sexo as animal_sexo
      FROM pesagens p
      JOIN animais a ON a.id = p.animal_id
      ORDER BY p.data DESC, p.created_at DESC
    `
    const params = []

    if (animalId) {
      sql = `
        SELECT p.id, p.animal_id, p.peso, p.ce, p.data, p.observacoes, p.created_at
        FROM pesagens p
        WHERE p.animal_id = $1
        ORDER BY p.data DESC, p.created_at DESC
      `
      params.push(parseInt(animalId, 10))
    }

    const result = await query(sql, params)
    const pesagens = (result.rows || []).map(r => ({
      id: r.id,
      animal_id: r.animal_id,
      peso: parseFloat(r.peso),
      ce: r.ce != null ? parseFloat(r.ce) : null,
      data: formatData(r.data),
      observacoes: r.observacoes,
      created_at: r.created_at,
      animal: r.serie && r.rg ? `${r.serie} - ${r.rg}` : null,
      animal_sexo: r.animal_sexo
    }))

    return res.status(200).json({ success: true, pesagens })
  } catch (error) {
    console.error('Erro ao buscar pesagens:', error)
    return res.status(500).json({ error: 'Erro ao buscar pesagens: ' + (error.message || 'Erro interno') })
  }
}
