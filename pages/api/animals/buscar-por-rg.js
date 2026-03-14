/**
 * API para buscar animais por RG
 * Retorna todos os animais que possuem o RG informado
 */
const { query } = require('../../../lib/database')

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'MÃ©todo nÃ£o permitido' })
  }

  const { rg } = req.query

  if (!rg || typeof rg !== 'string' || !rg.trim()) {
    return res.status(400).json({ success: false, message: 'RG Ã© obrigatÃ³rio' })
  }

  try {
    const rgTrimmed = String(rg).trim()
    
    // Query mÃ­nima para mÃ¡xima compatibilidade (rg pode ser VARCHAR ou INTEGER)
    const result = await query(
      `SELECT id, serie, rg, nome, sexo, raca, data_nascimento, situacao
       FROM animais 
       WHERE TRIM(COALESCE(rg::text, '')) = $1
       ORDER BY serie, rg
       LIMIT 10`,
      [rgTrimmed]
    )
    
    if (result.rows.length === 0) {
      console.log(`â�Å’ Nenhum animal encontrado com RG: "${rgTrimmed}"`)
      return res.status(200).json({
        success: true,
        data: [],
        message: 'Nenhum animal encontrado'
      })
    }

    console.log(`âÅ“â€¦ ${result.rows.length} animal(is) encontrado(s) com RG: "${rgTrimmed}"`)
    
    return res.status(200).json({
      success: true,
      data: result.rows.map(animal => ({
        id: animal.id,
        serie: animal.serie,
        rg: animal.rg,
        nome: animal.nome,
        sexo: animal.sexo,
        raca: animal.raca
      })),
      count: result.rows.length
    })
  } catch (error) {
    console.error('Erro ao buscar animais por RG:', error)
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar animais',
      error: error.message
    })
  }
}
