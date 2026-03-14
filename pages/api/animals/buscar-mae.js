/**
 * Busca sÃ©rie e RG da mÃ£e por nome ou via gestaÃ§Ãµes/nascimentos.
 * Usado quando o animal tem mae (nome) mas nÃ£o tem serie_mae/rg_mae.
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
      return res.status(400).json({ success: false, message: 'ParÃ¢metro mae Ã© obrigatÃ³rio' })
    }

    const maeNome = mae.trim()
    if (maeNome.length < 2) {
      return res.status(400).json({ success: false, message: 'Nome da mÃ£e muito curto' })
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

    // 2. Se nÃ£o achou, buscar com LIKE
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

    // 3. Buscar em gestaÃ§Ãµes (receptora_nome - receptora da gestaÃ§Ã£o)
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

    // 3b. Buscar em gestaÃ§Ãµes (mae_serie/mae_rg = doadora biolÃ³gica) - mÃ£e pode estar inativa
    if (!serie && !rg) {
      r = await query(
        `SELECT g.mae_serie as serie, g.mae_rg as rg 
         FROM gestacoes g
         INNER JOIN animais a ON UPPER(TRIM(COALESCE(a.serie,''))) = UPPER(TRIM(COALESCE(g.mae_serie,''))) 
           AND TRIM(COALESCE(a.rg,'')::text) = TRIM(COALESCE(g.mae_rg,'')::text)
         WHERE (UPPER(TRIM(COALESCE(a.nome,''))) = UPPER(TRIM($1))
            OR UPPER(TRIM(COALESCE(a.nome,''))) LIKE UPPER($2))
           AND g.mae_serie IS NOT NULL AND g.mae_rg IS NOT NULL
         LIMIT 1`,
        [maeNome, `%${maeNome}%`]
      )
      if (r.rows.length > 0) {
        serie = r.rows[0].serie
        rg = r.rows[0].rg
      }
    }

    // 3c. Buscar em coleta_fiv (doadora com doadora_id - mÃ£e pode ter coletas mesmo inativa)
    if (!serie && !rg) {
      r = await query(
        `SELECT a.serie, a.rg FROM coleta_fiv cf
         JOIN animais a ON a.id = cf.doadora_id
         WHERE (UPPER(TRIM(COALESCE(a.nome,''))) = UPPER(TRIM($1))
            OR UPPER(TRIM(COALESCE(cf.doadora_nome,''))) = UPPER(TRIM($1))
            OR UPPER(TRIM(COALESCE(a.nome,''))) LIKE UPPER($2))
           AND cf.doadora_id IS NOT NULL AND a.serie IS NOT NULL AND a.rg IS NOT NULL
         LIMIT 1`,
        [maeNome, `%${maeNome}%`]
      )
      if (r.rows.length > 0) {
        serie = r.rows[0].serie
        rg = r.rows[0].rg
      }
    }

    // 3d. coleta_fiv doadora_nome com formato "SÃâ€°RIE RG" ou "NOME SÃâ€°RIE RG" - extrair identificaÃ§Ã£o
    if (!serie && !rg) {
      const matchDoadora = maeNome.match(/([A-Za-z]{2,})\s+(\d+)\s*$/)
      if (matchDoadora) {
        const [, seriePart, rgPart] = matchDoadora
        const serieTent = serieFilho || (maeNome.match(/^CJ/i) ? 'CJCJ' : seriePart)
        r = await query(
          `SELECT serie, rg FROM animais 
           WHERE (UPPER(TRIM(serie)) = UPPER(TRIM($1)) AND TRIM(rg::text) = $2)
              OR (UPPER(TRIM(COALESCE(nome,''))) LIKE $3 AND TRIM(rg::text) = $2)
           LIMIT 1`,
          [serieTent, rgPart, `%${maeNome}%`]
        )
        if (r.rows.length > 0) {
          serie = r.rows[0].serie
          rg = r.rows[0].rg
        }
      }
    }

    // 3e. coleta_fiv: doadora_nome igual ao nome da mÃ£e (doadora pode nÃ£o ter doadora_id) - buscar em animais por nome
    // JÃ¡ coberto em 1 e 2 - mas se doadora_nome em coleta_fiv = maeNome e temos doadora_id, 3c cobre.
    // Se doadora_nome contÃ©m identificaÃ§Ã£o (ex: "MANEKA SANT ANNA CJCJ 16982"), tentar extrair
    if (!serie && !rg) {
      r = await query(
        `SELECT doadora_nome FROM coleta_fiv 
         WHERE UPPER(TRIM(COALESCE(doadora_nome,''))) = UPPER(TRIM($1))
            OR UPPER(TRIM(COALESCE(doadora_nome,''))) LIKE UPPER($2)
         LIMIT 1`,
        [maeNome, `%${maeNome}%`]
      )
      if (r.rows.length > 0) {
        const dn = String(r.rows[0].doadora_nome || '').trim()
        const matchIdent = dn.match(/([A-Za-z]{2,})\s*[-]?\s*(\d+)\s*$/)
        if (matchIdent) {
          const [, sPart, rPart] = matchIdent
          const sTent = serieFilho || (dn.match(/^CJ/i) ? 'CJCJ' : sPart)
          const r2 = await query(
            `SELECT serie, rg FROM animais WHERE UPPER(TRIM(serie)) = UPPER(TRIM($1)) AND TRIM(rg::text) = $2 LIMIT 1`,
            [sTent, rPart]
          )
          if (r2.rows.length > 0) {
            serie = r2.rows[0].serie
            rg = r2.rows[0].rg
          }
        }
      }
    }

    // 4. Buscar via nascimentos (gestaÃ§Ã£o onde este animal nasceu)
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

    return res.status(200).json({ success: false, message: 'MÃ£e nÃ£o encontrada' })
  } catch (error) {
    console.error('Erro ao buscar mÃ£e:', error)
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar mÃ£e',
      error: error.message
    })
  }
}
