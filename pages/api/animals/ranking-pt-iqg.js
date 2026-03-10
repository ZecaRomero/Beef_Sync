import { query } from '../../../lib/database';

/**
 * Ranking por Pt IQG (maior = melhor)
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const limit = Math.min(parseInt(req.query.limit || '10', 10), 50);
  const serie = (req.query.serie || '').trim().toUpperCase();

  try {
    let result;
    try {
      result = await query(
        `SELECT 
          a.id, a.serie, a.rg, a.nome, a.pt_iqg, a.iqg, a.raca, a.sexo, a.data_nascimento,
          a.serie_mae, a.rg_mae
         FROM animais a
         WHERE a.situacao = 'Ativo' 
           AND a.pt_iqg IS NOT NULL 
           AND TRIM(a.pt_iqg::text) != ''
           ${serie ? 'AND UPPER(TRIM(COALESCE(a.serie, \'\'))) = $2' : ''}
         ORDER BY 
           CASE 
             WHEN a.pt_iqg::text ~ '^[0-9]+[.,]?[0-9]*$'
             THEN (REPLACE(REPLACE(TRIM(a.pt_iqg::text), ',', '.'), ' ', '')::numeric)
             ELSE NULL
           END DESC NULLS LAST,
           a.rg DESC
        LIMIT $1`,
        serie ? [limit, serie] : [limit]
      );
    } catch (colErr) {
      if (/column.*does not exist/i.test(colErr?.message || '')) {
        result = await query(
          `SELECT a.id, a.serie, a.rg, a.nome, a.decile_2 AS pt_iqg, a.genetica_2 AS iqg,
            a.raca, a.sexo, a.data_nascimento, a.serie_mae, a.rg_mae
           FROM animais a 
           WHERE a.situacao = 'Ativo' AND a.decile_2 IS NOT NULL AND TRIM(a.decile_2::text) != ''
             ${serie ? 'AND UPPER(TRIM(COALESCE(a.serie, \'\'))) = $2' : ''}
           ORDER BY 
             CASE WHEN a.decile_2::text ~ '^[0-9]+[.,]?[0-9]*$'
               THEN (REPLACE(REPLACE(TRIM(a.decile_2::text), ',', '.'), ' ', '')::numeric)
               ELSE NULL END DESC NULLS LAST, a.rg DESC
           LIMIT $1`,
          serie ? [limit, serie] : [limit]
        );
      } else throw colErr;
    }

    const rows = result.rows || [];
    const ranking = rows.map((r, i) => ({
      posicao: i + 1,
      id: r.id,
      serie: r.serie,
      rg: r.rg,
      serie_mae: r.serie_mae,
      rg_mae: r.rg_mae,
      identificacao: `${r.serie || ''}-${r.rg || ''}`.replace(/^-|-$/g, ''),
      nome: r.nome,
      pt_iqg: r.pt_iqg,
      iqg: r.iqg,
      raca: r.raca,
      sexo: r.sexo,
      data_nascimento: r.data_nascimento
    }));

    return res.status(200).json({ success: true, data: ranking });
  } catch (error) {
    console.error('Erro ao buscar ranking Pt IQG:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar ranking',
      details: String(error?.message || error),
    });
  }
}
