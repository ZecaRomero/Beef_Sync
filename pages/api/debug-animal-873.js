/**
 * Endpoint de debug temporário - remover após resolver o 404
 * GET /api/debug-animal-873
 */
const { query } = require('../../lib/database')
const databaseService = require('../../services/databaseService').default || require('../../services/databaseService')

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // 1. Query direta
    const r = await query('SELECT id, serie, rg, nome FROM animais WHERE id = 873')
    const direto = r.rows[0] || null

    // 2. Via databaseService
    const viaService = await databaseService.buscarAnimalPorId(873)
    const historico = await databaseService.buscarHistoricoAnimal(873)

    return res.status(200).json({
      dbConfig: process.env.DATABASE_URL ? 'DATABASE_URL' : `host=${process.env.DB_HOST || 'localhost'}, db=${process.env.DB_NAME || 'beef_sync'}`,
      queryDireta: direto,
      buscarAnimalPorId: viaService ? { id: viaService.id, serie: viaService.serie, rg: viaService.rg, nome: viaService.nome } : null,
      buscarHistoricoAnimal: historico ? { id: historico.id, serie: historico.serie, rg: historico.rg, nome: historico.nome } : null
    })
  } catch (err) {
    console.error('debug-animal-873 erro:', err)
    return res.status(500).json({ error: err.message, stack: err.stack })
  }
}
