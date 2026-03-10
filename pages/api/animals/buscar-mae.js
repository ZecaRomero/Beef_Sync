/**
 * Busca série e RG da mãe por nome ou via gestações/nascimentos.
 * Usado quando o animal tem mae (nome) mas não tem serie_mae/rg_mae.
 */
import { query } from '../../../lib/database'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { mae, animalSerie, animalRg } = req.query
    const serieFilho = (animalSerie || '').trim()

    if (!mae || typeof mae !== 'string') {
      return res.status(400).json({ success: false, message: 'Parâmetro mae é obrigatório' })
    }

    const maeNome = mae.trim()
    if (maeNome.length < 2) {
      return res.status(400).json({ success: false, message: 'Nome da mãe muito curto' })
    }

    let serie = null
    let rg = null

    // 0. Formato "CJ SANT ANNA 13604" - extrair RG do final e buscar por serie+rg
    const m3 = maeNome.match(/\s+(\d+)$/)
    if (m3) {
      const rgExtraido = m3[1]
      const serieTentativa = serieFilho || (maeNome.match(/^CJ/i) ? 'CJCJ' : null)
      if (serieTentativa && rgExtraido) {
        const r = await query(
          `SELECT serie, rg FROM animais 
           WHERE UPPER(TRIM(serie)) = UPPER(TRIM($1)) AND TRIM(rg::text) = $2
           LIMIT 1`,
          [serieTentativa, rgExtraido]
        )
        if (r.rows.length > 0) {
          serie = r.rows[0].serie
          rg = r.rows[0].rg
        }
      }
      if (!serie && !rg) {
        const r = await query(
          `SELECT serie, rg FROM animais WHERE TRIM(rg::text) = $1 OR rg = $2 LIMIT 1`,
          [rgExtraido, parseInt(rgExtraido, 10)]
        )
        if (r.rows.length > 0) {
          serie = r.rows[0].serie
          rg = r.rows[0].rg
        }
      }
    }

    // 1. Buscar em animais por nome
    let r = await query(
      `SELECT serie, rg FROM animais 
       WHERE UPPER(TRIM(COALESCE(nome,''))) = UPPER(TRIM($1)) 
         AND serie IS NOT NULL AND rg IS NOT NULL
       LIMIT 1`,
      [maeNome]
    )
    if (r.rows.length > 0) {
      serie = r.rows[0].serie
      rg = r.rows[0].rg
    }

    // 2. Se não achou, buscar com LIKE
    if (!serie && !rg) {
      r = await query(
        `SELECT serie, rg FROM animais 
         WHERE UPPER(TRIM(COALESCE(nome,''))) LIKE UPPER($1) 
           AND serie IS NOT NULL AND rg IS NOT NULL
         LIMIT 1`,
        [`%${maeNome}%`]
      )
      if (r.rows.length > 0) {
        serie = r.rows[0].serie
        rg = r.rows[0].rg
      }
    }

    // 3. Buscar em gestações (receptora_nome)
    if (!serie && !rg) {
      r = await query(
        `SELECT receptora_serie as serie, receptora_rg as rg 
         FROM gestacoes 
         WHERE UPPER(TRIM(COALESCE(receptora_nome,''))) = UPPER(TRIM($1))
           AND receptora_serie IS NOT NULL AND receptora_rg IS NOT NULL
         LIMIT 1`,
        [maeNome]
      )
      if (r.rows.length === 0) {
        r = await query(
          `SELECT receptora_serie as serie, receptora_rg as rg 
           FROM gestacoes 
           WHERE UPPER(TRIM(COALESCE(receptora_nome,''))) LIKE UPPER($1)
             AND receptora_serie IS NOT NULL AND receptora_rg IS NOT NULL
           LIMIT 1`,
          [`%${maeNome}%`]
        )
      }
      if (r.rows.length > 0) {
        serie = r.rows[0].serie
        rg = r.rows[0].rg
      }
    }

    // 4. Buscar via nascimentos (gestação onde este animal nasceu)
    if (!serie && !rg && animalSerie && animalRg) {
      r = await query(
        `SELECT g.receptora_serie as serie, g.receptora_rg as rg 
         FROM gestacoes g
         JOIN nascimentos n ON n.gestacao_id = g.id
         WHERE TRIM(COALESCE(n.serie,'')) = TRIM($1) AND TRIM(n.rg::text) = TRIM($2)
           AND g.receptora_serie IS NOT NULL AND g.receptora_rg IS NOT NULL
         LIMIT 1`,
        [String(animalSerie).trim(), String(animalRg).trim()]
      )
      if (r.rows.length > 0) {
        serie = r.rows[0].serie
        rg = r.rows[0].rg
      }
    }

    if (serie && rg) {
      return res.status(200).json({ success: true, serie, rg })
    }

    return res.status(200).json({ success: false, message: 'Mãe não encontrada' })
  } catch (error) {
    console.error('Erro ao buscar mãe:', error)
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar mãe',
      error: error.message
    })
  }
}
