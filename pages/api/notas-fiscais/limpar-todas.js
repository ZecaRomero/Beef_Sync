import { query } from '../../../lib/database'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  const { senha } = req.body || {}
  if (senha !== 'dev2026') {
    return res.status(403).json({ success: false, message: 'Senha incorreta' })
  }

  try {
    // Apagar itens primeiro (FK)
    await query('DELETE FROM notas_fiscais_itens')
    // Apagar notas
    const result = await query('DELETE FROM notas_fiscais')
    const deletados = result.rowCount || 0

    return res.status(200).json({ success: true, deletados })
  } catch (err) {
    console.error('Erro ao limpar notas fiscais:', err)
    return res.status(500).json({ success: false, message: err.message })
  }
}
