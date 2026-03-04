/**
 * API para buscar animais por RG
 * Retorna todos os animais que possuem o RG informado
 */
import { query } from '../../../lib/database'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Método não permitido' })
  }

  const { rg } = req.query

  if (!rg || !rg.trim()) {
    return res.status(400).json({ success: false, message: 'RG é obrigatório' })
  }

  try {
    const rgTrimmed = rg.trim()
    
    // Buscar animais com o RG informado
    const result = await query(
      `SELECT 
        id,
        serie,
        rg,
        nome,
        sexo,
        raca,
        data_nascimento,
        situacao
      FROM animais 
      WHERE CAST(rg AS TEXT) = $1
      ORDER BY serie, rg
      LIMIT 10`,
      [rgTrimmed]
    )
    
    if (result.rows.length === 0) {
      console.log(`❌ Nenhum animal encontrado com RG: "${rgTrimmed}"`)
      return res.status(200).json({
        success: true,
        data: [],
        message: 'Nenhum animal encontrado'
      })
    }

    console.log(`✅ ${result.rows.length} animal(is) encontrado(s) com RG: "${rgTrimmed}"`)
    
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
