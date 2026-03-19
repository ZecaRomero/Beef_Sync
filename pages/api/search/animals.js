import { query } from '../../../lib/database'
import { sendSuccess, sendError, asyncHandler } from '../../../utils/apiResponse'

function normalizeSearch(value) {
  return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
}

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { q, type } = req.query

  if (!q || q.length < 2) {
    return sendSuccess(res, [])
  }

  try {
    let results = []
    const cleanQ = q.trim()
    const normalizedQ = normalizeSearch(cleanQ)
    const searchTerm = `%${cleanQ}%`

    // Parse composite search (Serie + RG)
    let seriePart = ''
    let rgPart = ''
    let useComposite = false
    
    // Check for space or hyphen separator
    const splitRegex = /[\s-]+/
    if (splitRegex.test(cleanQ)) {
      const parts = cleanQ.split(splitRegex).filter(p => p.trim().length > 0)
      if (parts.length >= 2) {
        useComposite = true
        seriePart = parts[0]
        rgPart = parts[parts.length - 1] // Assume last part is RG
      }
    }
    const seriePartNorm = normalizeSearch(seriePart)
    const rgPartNorm = String(rgPart || '').replace(/\D/g, '')

    if (type === 'touro') {
      // Search in estoque_semen and animals (male)
      const [semenResults, animalResults] = await Promise.all([
        query(`
          SELECT DISTINCT nome_touro as nome, rg_touro as rg, raca, 'semen' as source
          FROM estoque_semen 
          WHERE (
            nome_touro ILIKE $1
            OR rg_touro ILIKE $1
            OR UPPER(REGEXP_REPLACE(COALESCE(rg_touro, ''), '[^A-Za-z0-9]', '', 'g')) LIKE $5
            OR UPPER(REGEXP_REPLACE(COALESCE(nome_touro, ''), '[^A-Za-z0-9]', '', 'g')) LIKE $5
            OR ($2::boolean AND UPPER(REGEXP_REPLACE(COALESCE(rg_touro, '') || ' ' || COALESCE(nome_touro, ''), '[^A-Za-z0-9]', '', 'g')) LIKE $6)
          )
          AND COALESCE(doses_disponiveis, 0) > 0
          LIMIT 10
        `, [
          searchTerm,
          useComposite,
          useComposite ? `${seriePart}%` : '',
          useComposite ? `${rgPart}%` : '',
          `%${normalizedQ}%`,
          useComposite ? `%${seriePartNorm}${rgPartNorm}%` : '',
        ]),
        query(`
          SELECT id, nome, rg, serie, raca, 'animal' as source
          FROM animais 
          WHERE (
            nome ILIKE $1 OR rg ILIKE $1 OR serie ILIKE $1
            OR ($2::boolean AND serie ILIKE $3 AND rg ILIKE $4)
            OR UPPER(REGEXP_REPLACE(COALESCE(serie, '') || COALESCE(rg, ''), '[^A-Za-z0-9]', '', 'g')) LIKE $5
          )
          AND (sexo ILIKE 'M%' OR sexo = 'M')
          LIMIT 10
        `, [
          searchTerm,
          useComposite,
          useComposite ? `${seriePart}%` : '',
          useComposite ? `${rgPart}%` : '',
          `%${normalizedQ}%`,
        ])
      ])

      // Combine and deduplicate based on RG or Name
      const combined = [...semenResults.rows, ...animalResults.rows]
      const seen = new Set()
      results = combined.filter(item => {
        const key = item.rg ? item.rg : item.nome
        if (!key) return false
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      
    } else if (type === 'doadora' || type === 'receptora') {
      // Search in animals (female)
      const animalResults = await query(`
        SELECT id, nome, rg, serie, raca, 'animal' as source
        FROM animais 
        WHERE (
            nome ILIKE $1 OR rg ILIKE $1 OR serie ILIKE $1
            OR ($2::boolean AND serie ILIKE $3 AND rg ILIKE $4)
            OR UPPER(REGEXP_REPLACE(COALESCE(serie, '') || COALESCE(rg, ''), '[^A-Za-z0-9]', '', 'g')) LIKE $5
        )
        AND (sexo ILIKE 'F%' OR sexo = 'F')
        LIMIT 20
      `, [
        searchTerm,
        useComposite,
        useComposite ? `${seriePart}%` : '',
        useComposite ? `${rgPart}%` : '',
        `%${normalizedQ}%`,
      ])
      
      results = animalResults.rows
    } else {
      // Generic search
      const animalResults = await query(`
        SELECT id, nome, rg, serie, raca, sexo, 'animal' as source
        FROM animais 
        WHERE (
            nome ILIKE $1 OR rg ILIKE $1 OR serie ILIKE $1
            OR ($2::boolean AND serie ILIKE $3 AND rg ILIKE $4)
            OR UPPER(REGEXP_REPLACE(COALESCE(serie, '') || COALESCE(rg, ''), '[^A-Za-z0-9]', '', 'g')) LIKE $5
        )
        LIMIT 20
      `, [
        searchTerm,
        useComposite,
        useComposite ? `${seriePart}%` : '',
        useComposite ? `${rgPart}%` : '',
        `%${normalizedQ}%`,
      ])
      
      results = animalResults.rows
    }

    return sendSuccess(res, results)

  } catch (error) {
    console.error('Search error:', error)
    return sendError(res, 'Error performing search')
  }
}

export default asyncHandler(handler)
