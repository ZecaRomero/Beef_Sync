import { query } from '../../../lib/database';

/**
 * Retorna a posição do animal no ranking MGTe.
 * GET ?serie=CJCJ&rg=16974 => { posicao: 137, total: 500, mgte: "36.50" }
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const serie = (req.query.serie || '').trim().toUpperCase();
  const rg = String(req.query.rg || '').trim().replace(/^0+/, '') || '0';

  if (!serie || !rg) {
    return res.status(400).json({ error: 'Informe serie e rg' });
  }

  try {
    const result = await query(
      `WITH ranked AS (
        SELECT 
          a.id, a.serie, a.rg, a.mgte,
          ROW_NUMBER() OVER (
            ORDER BY 
              CASE 
                WHEN a.mgte::text ~ '^[0-9]+[.,]?[0-9]*$'
                THEN (REPLACE(REPLACE(TRIM(a.mgte::text), ',', '.'), ' ', '')::numeric)
                ELSE NULL
              END DESC NULLS LAST,
              a.rg DESC
          ) as posicao
        FROM animais a
        WHERE a.situacao = 'Ativo' 
          AND a.mgte IS NOT NULL 
          AND TRIM(a.mgte::text) != ''
      ),
      total AS (
        SELECT COUNT(*)::int as total FROM ranked
      )
      SELECT r.posicao, r.mgte, t.total
      FROM ranked r
      CROSS JOIN total t
      WHERE UPPER(TRIM(COALESCE(r.serie, ''))) = UPPER($1)
        AND COALESCE(NULLIF(REGEXP_REPLACE(TRIM(r.rg::text), '^0+', ''), ''), '0') = $2`,
      [serie, rg]
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(200).json({
        success: true,
        posicao: null,
        total: 0,
        mgte: null,
        message: 'Animal não possui MGTe ou não está no ranking'
      });
    }

    const row = result.rows[0];
    return res.status(200).json({
      success: true,
      posicao: row.posicao,
      total: row.total || 0,
      mgte: row.mgte
    });
  } catch (error) {
    if (/column.*mgte|does not exist/i.test(error?.message || '')) {
      return res.status(200).json({
        success: true,
        posicao: null,
        total: 0,
        mgte: null
      });
    }
    console.error('Erro ao buscar posição MGTe:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar posição',
      details: String(error?.message || error),
    });
  }
}
