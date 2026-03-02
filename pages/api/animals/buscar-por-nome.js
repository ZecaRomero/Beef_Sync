import { query } from '../../../lib/database'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { nome } = req.query

    if (!nome) {
      return res.status(400).json({ message: 'Nome é obrigatório' })
    }

    const nomeTrim = nome.trim()
    
    if (nomeTrim.length < 2) {
      return res.status(400).json({ 
        success: false,
        message: 'Digite pelo menos 2 caracteres' 
      })
    }

    // Buscar múltiplos animais que correspondam ao nome (para autocomplete)
    const result = await query(
      `SELECT id, serie, rg, nome, sexo, raca
       FROM animais 
       WHERE UPPER(nome) LIKE UPPER($1)
       ORDER BY nome
       LIMIT 10`,
      [`%${nomeTrim}%`]
    )

    if (result.rows.length === 0) {
      console.log(`❌ Nenhum animal encontrado com: "${nomeTrim}"`)
      return res.status(200).json({ 
        success: true,
        data: [],
        message: 'Nenhum animal encontrado'
      })
    }

    console.log(`✅ ${result.rows.length} animal(is) encontrado(s) com: "${nomeTrim}"`)
    
    res.status(200).json({
      success: true,
      data: result.rows.map(animal => ({
        id: animal.id,
        serie: animal.serie,
        rg: animal.rg,
        nome: animal.nome,
        sexo: animal.sexo,
        raca: animal.raca
      }))
    })
  } catch (error) {
    console.error('Erro ao buscar animal por nome:', error)
    res.status(500).json({ 
      success: false,
      message: 'Erro ao buscar animal', 
      error: error.message 
    })
  }
}
