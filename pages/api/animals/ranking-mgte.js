import { query } from '../../../lib/database';

/**
 * Ranking por MGTe (maior = melhor).
 * Ordena por mgte numérico DESC.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const limit = Math.min(parseInt(req.query.limit || '10', 10), 50);
  const serie = (req.query.serie || '').trim().toUpperCase();

  try {
    const result = await query(
      `SELECT 
        a.id, a.serie, a.rg, a.nome, a.mgte, a.top, a.raca, a.sexo, a.data_nascimento,
        a.serie_mae, a.rg_mae
       FROM animais a
       WHERE a.situacao = 'Ativo' 
         AND a.mgte IS NOT NULL 
         AND TRIM(a.mgte::text) != ''
         ${serie ? 'AND UPPER(TRIM(COALESCE(a.serie, \'\'))) = $2' : ''}
       ORDER BY 
         CASE 
           WHEN a.mgte::text ~ '^[0-9]+[.,]?[0-9]*$'
           THEN (REPLACE(REPLACE(TRIM(a.mgte::text), ',', '.'), ' ', '')::numeric)
           ELSE NULL
         END DESC NULLS LAST,
         a.rg DESC
      LIMIT $1`,
      serie ? [limit, serie] : [limit]
    );

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
      mgte: r.mgte,
      top: r.top,
      raca: r.raca,
      sexo: r.sexo,
      data_nascimento: r.data_nascimento
    }));

    return res.status(200).json({
      success: true,
      data: ranking,
    });
  } catch (error) {
    if (/column.*mgte|does not exist/i.test(error?.message || '')) {
      return res.status(200).json({ success: true, data: [] });
    }
    console.error('Erro ao buscar ranking MGTe:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar ranking',
      details: String(error?.message || error),
    });
  }
}
