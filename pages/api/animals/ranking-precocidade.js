import { query } from '../../../lib/database'

/**
 * GET /api/animals/ranking-precocidade
 * Retorna o ranking das fÃªmeas mais precoces ââ‚¬â€� aquelas que emprenharam
 * na menor idade (meses de vida na data da IA confirmada como prenha).
 * ParÃ¢metros opcionais:
 *   ?limit=10  ââ‚¬â€� quantas retornar (default 10)
 *   ?animalId  ââ‚¬â€� se informado, inclui a posiÃ§Ã£o deste animal no ranking
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'MÃ©todo nÃ£o permitido' })

  const limit = Math.min(parseInt(req.query.limit) || 10, 50)
  const animalId = req.query.animalId ? parseInt(req.query.animalId) : null

  try {
    // Primeira IA confirmada como prenha para cada fÃªmea
    const result = await query(`
      WITH primeira_prenha AS (
        SELECT
          i.animal_id,
          MIN(i.data_ia) AS data_ia_prenha
        FROM inseminacoes i
        WHERE i.resultado_dg ILIKE '%prenha%'
          AND i.data_ia IS NOT NULL
          AND i.valida IS NOT FALSE
        GROUP BY i.animal_id
      ),
      ranking AS (
        SELECT
          a.id,
          a.nome,
          a.serie,
          a.rg,
          a.data_nascimento,
          pp.data_ia_prenha,
          EXTRACT(EPOCH FROM (pp.data_ia_prenha::timestamp - a.data_nascimento::timestamp)) / 2629746.0 AS meses_decimal,
          FLOOR(EXTRACT(EPOCH FROM (pp.data_ia_prenha::timestamp - a.data_nascimento::timestamp)) / 2629746.0) AS meses,
          FLOOR(EXTRACT(EPOCH FROM (pp.data_ia_prenha::timestamp - a.data_nascimento::timestamp)) / 86400.0) % 30 AS dias_extras,
          ROW_NUMBER() OVER (
            ORDER BY (pp.data_ia_prenha - a.data_nascimento)
          ) AS posicao
        FROM animais a
        JOIN primeira_prenha pp ON a.id = pp.animal_id
        WHERE (a.sexo ILIKE '%F%' OR a.sexo ILIKE '%fem%')
          AND a.data_nascimento IS NOT NULL
          AND (pp.data_ia_prenha - a.data_nascimento) > INTERVAL '0 days'
          AND (pp.data_ia_prenha - a.data_nascimento) < INTERVAL '1825 days'
      )
      SELECT * FROM ranking
      ORDER BY posicao
      LIMIT $1
    `, [limit])

    const ranking = result.rows.map(r => ({
      posicao:        parseInt(r.posicao),
      id:             r.id,
      nome:           r.nome || r.serie || r.rg || `Animal #${r.id}`,
      serie:          r.serie,
      rg:             r.rg,
      dataNascimento: r.data_nascimento,
      dataIAPrenha:   r.data_ia_prenha,
      meses:          parseInt(r.meses),
      diasExtras:     parseInt(r.dias_extras) || 0,
      mesesDecimal:   parseFloat(r.meses_decimal),
      superPrecoce:   parseInt(r.meses) < 14,
    }))

    // PosiÃ§Ã£o do animal solicitado (mesmo se nÃ£o estiver no top limit)
    let posicaoAnimal = null
    if (animalId) {
      const posResult = await query(`
        WITH primeira_prenha AS (
          SELECT animal_id, MIN(data_ia) AS data_ia_prenha
          FROM inseminacoes
          WHERE resultado_dg ILIKE '%prenha%' AND data_ia IS NOT NULL AND valida IS NOT FALSE
          GROUP BY animal_id
        ),
        ranking AS (
          SELECT
            a.id,
            ROW_NUMBER() OVER (ORDER BY (pp.data_ia_prenha - a.data_nascimento)) AS posicao,
            FLOOR(EXTRACT(EPOCH FROM (pp.data_ia_prenha::timestamp - a.data_nascimento::timestamp)) / 2629746.0) AS meses,
            FLOOR(EXTRACT(EPOCH FROM (pp.data_ia_prenha::timestamp - a.data_nascimento::timestamp)) / 86400.0) % 30 AS dias_extras
          FROM animais a
          JOIN primeira_prenha pp ON a.id = pp.animal_id
          WHERE (a.sexo ILIKE '%F%' OR a.sexo ILIKE '%fem%')
            AND a.data_nascimento IS NOT NULL
            AND (pp.data_ia_prenha - a.data_nascimento) > INTERVAL '0 days'
            AND (pp.data_ia_prenha - a.data_nascimento) < INTERVAL '1825 days'
        )
        SELECT posicao, meses, dias_extras FROM ranking WHERE id = $1
      `, [animalId])

      if (posResult.rows.length > 0) {
        posicaoAnimal = {
          posicao:    parseInt(posResult.rows[0].posicao),
          meses:      parseInt(posResult.rows[0].meses),
          diasExtras: parseInt(posResult.rows[0].dias_extras) || 0,
        }
      }
    }

    return res.status(200).json({ success: true, ranking, posicaoAnimal, total: result.rows.length })
  } catch (error) {
    console.error('Erro ranking precocidade:', error)
    return res.status(500).json({ success: false, error: error.message })
  }
}
