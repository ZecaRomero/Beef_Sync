
import { query } from '../../lib/database'

export default async function handler(req, res) {
  const { id } = req.query
  
  if (!id) {
    return res.status(400).json({ error: 'ID or RG is required' })
  }

  try {
    // 1. Buscar o animal
    let animalResult = await query(
      `SELECT * FROM animais WHERE id = $1 OR rg = $2 OR (serie || '-' || rg) = $2 LIMIT 1`,
      [parseInt(id) || 0, id]
    )
    
    if (animalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Animal not found' })
    }
    
    const animal = animalResult.rows[0]
    
    // 2. Buscar informações da mãe
    let maeInfo = {
      searchMethod: null,
      found: false,
      data: null
    }

    // Tentar pelo ID da mãe se existir coluna (verificar colunas primeiro)
    // Como não sei as colunas, vou ver o que veio em 'animal'
    
    // Tentar pelo nome da mãe
    if (animal.mae) {
      maeInfo.searchMethod = 'name'
      maeInfo.searchTerm = animal.mae
      
      const maeResult = await query(
        `SELECT * FROM animais WHERE UPPER(TRIM(nome)) = UPPER(TRIM($1)) LIMIT 1`,
        [animal.mae]
      )
      
      if (maeResult.rows.length > 0) {
        maeInfo.found = true
        maeInfo.data = maeResult.rows[0]
      } else {
        // Tentar LIKE
        const maeLikeResult = await query(
            `SELECT * FROM animais WHERE UPPER(nome) LIKE UPPER($1) LIMIT 1`,
            [`%${String(animal.mae).trim()}%`]
        )
        if (maeLikeResult.rows.length > 0) {
            maeInfo.found = true
            maeInfo.searchMethod = 'name_like'
            maeInfo.data = maeLikeResult.rows[0]
        }
      }
    }

    return res.status(200).json({
      animal,
      maeAnalysis: maeInfo
    })
    
  } catch (error) {
    return res.status(500).json({ error: error.message, stack: error.stack })
  }
}
