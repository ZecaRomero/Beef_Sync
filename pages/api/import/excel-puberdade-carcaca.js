/**
 * POST /api/import/excel-puberdade-carcaca
 * Importa dados de Puberdade e/ou Carcaça a partir de JSON.
 *
 * Body: { tipo: 'puberdade' | 'carcaca', data: [...] }
 *
 * Puberdade: { serie_rg, classe, idade, pct_media, grupo, classif }
 * Carcaça:   { serie_rg, aol, aol_100kg, ratio, mar, egs, egs_100kg, picanha }
 */
const { query } = require('../../../lib/database')

const parseNum = (v) => {
  if (v == null || v === '' || v === '-') return null
  const n = parseFloat(String(v).replace(',', '.'))
  return isNaN(n) ? null : n
}

const parseSerieRg = (serieRg) => {
  if (!serieRg) return { serie: null, rg: null }
  const s = String(serieRg).trim()
  // "CJCJ 16974" → serie=CJCJ, rg=16974
  const m = s.match(/^([A-Za-z]+)\s+(\d+)$/)
  if (m) return { serie: m[1].toUpperCase(), rg: m[2] }
  // "CJCJ-16974"
  const m2 = s.match(/^([A-Za-z]+)-(\d+)$/)
  if (m2) return { serie: m2[1].toUpperCase(), rg: m2[2] }
  return { serie: null, rg: s }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const { tipo, data } = req.body || {}
  if (!tipo || !Array.isArray(data) || data.length === 0) {
    return res.status(400).json({ error: 'Informe tipo (puberdade ou carcaca) e data []' })
  }

  const results = { atualizados: 0, naoEncontrados: [], erros: [] }

  for (const row of data) {
    try {
      const { serie, rg } = parseSerieRg(row.serie_rg)
      if (!serie || !rg) { results.naoEncontrados.push(row.serie_rg); continue }

      // Buscar animal
      const found = await query(
        `SELECT id FROM animais WHERE UPPER(serie) = $1 AND rg = $2 LIMIT 1`,
        [serie.toUpperCase(), rg]
      )
      if (found.rows.length === 0) { results.naoEncontrados.push(`${serie} ${rg}`); continue }

      const id = found.rows[0].id

      if (tipo === 'puberdade') {
        await query(
          `UPDATE animais SET
            pub_classe   = $1,
            pub_idade    = $2,
            pub_pct_media = $3,
            pub_grupo    = $4,
            pub_classif  = $5,
            updated_at   = NOW()
          WHERE id = $6`,
          [
            row.classe || null,
            parseNum(row.idade),
            parseNum(row.pct_media),
            row.grupo || null,
            parseNum(row.classif),
            id
          ]
        )
      } else if (tipo === 'carcaca') {
        await query(
          `UPDATE animais SET
            carc_aol       = $1,
            carc_aol_100kg = $2,
            carc_ratio     = $3,
            carc_mar       = $4,
            carc_egs       = $5,
            carc_egs_100kg = $6,
            carc_picanha   = $7,
            updated_at     = NOW()
          WHERE id = $8`,
          [
            parseNum(row.aol),
            parseNum(row.aol_100kg),
            parseNum(row.ratio),
            parseNum(row.mar),
            parseNum(row.egs),
            parseNum(row.egs_100kg),
            parseNum(row.picanha),
            id
          ]
        )
      }

      results.atualizados++
    } catch (e) {
      results.erros.push({ row: row.serie_rg, erro: e.message })
    }
  }

  return res.status(200).json({
    success: true,
    message: `${results.atualizados} animal(is) atualizado(s).`,
    ...results
  })
}
