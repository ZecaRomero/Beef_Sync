import { query } from '../../../lib/database'

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Buscar todas as categorias distintas
      const result = await query(`
        SELECT DISTINCT categoria 
        FROM tipos_servicos 
        WHERE ativo = true 
          AND categoria NOT IN ('Alimentação', 'Nutrição', 'Ração', 'Suplementação')
        ORDER BY categoria
      `)

      const categorias = result.rows.map(row => row.categoria)
      res.status(200).json(categorias)

    } else {
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ message: 'Método não permitido' })
    }

  } catch (error) {
    console.error('Erro ao buscar categorias:', error)
    res.status(500).json({
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
}

