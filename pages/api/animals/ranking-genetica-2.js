import { query } from '../../../lib/database';

function validarLocal(val) {
  if (!val || typeof val !== 'string') return null
  const n = val.trim()
  if (!n) return null
  if (/^PIQUETE\s+(\d+|CABANHA|CONF|GUARITA|PISTA)$/i.test(n)) return val
  if (/^PROJETO\s+[\dA-Za-z\-]+$/i.test(n)) return val
  if (/^CONFINA$/i.test(n)) return val
  if (/^PIQ\s+\d+$/i.test(n)) return val.replace(/^PIQ\s+/i, 'PIQUETE ')
  if (/^(CABANHA|GUARITA|PISTA|CONF)$/i.test(n)) return val
  return null
}

/**
 * Retorna o ranking dos animais por Genetica 2 (maior = melhor).
 * Mesma lógica do ranking iABCZ.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    let result
    try {
      result = await query(
      `SELECT 
         a.id, a.serie, a.rg, a.nome, a.iqg, a.pt_iqg, a.raca, a.sexo, a.situacao,
         a.data_nascimento, a.pasto_atual, a.piquete_atual,
         p_ult.peso AS ultimo_peso,
         p_ult.ce   AS ultimo_ce,
         p_ult.data AS data_ultima_pesagem,
         la.piquete AS localizacao_piquete
       FROM animais a
       LEFT JOIN LATERAL (
         SELECT p.peso, p.ce, p.data
         FROM pesagens p
         WHERE p.animal_id = a.id
         ORDER BY p.data DESC, p.created_at DESC
         LIMIT 1
       ) p_ult ON TRUE
       LEFT JOIN LATERAL (
         SELECT l.piquete
         FROM localizacoes_animais l
         WHERE l.animal_id = a.id
           AND (l.data_saida IS NULL OR l.data_saida >= CURRENT_DATE)
         ORDER BY l.data_entrada DESC
         LIMIT 1
       ) la ON TRUE
       WHERE a.situacao = 'Ativo' 
AND a.iqg IS NOT NULL
         AND TRIM(a.iqg) != ''
       ORDER BY 
         CASE 
           WHEN a.iqg ~ '^[0-9]+[.,]?[0-9]*$' 
           THEN (REPLACE(REPLACE(TRIM(a.iqg), ',', '.'), ' ', '')::numeric)
          ELSE NULL
        END DESC NULLS LAST,
        a.rg DESC
      LIMIT $1`,
        [limit]
      )
    } catch (colErr) {
      if (/column.*does not exist/i.test(colErr?.message || '')) {
        return res.status(200).json({ success: true, data: [] });
      }
      throw colErr
    }

    const rows = result.rows || [];
    const ranking = rows.map((r, i) => ({
      posicao: i + 1,
      id: r.id,
      serie: r.serie,
      rg: r.rg,
      identificacao: `${r.serie || ''}-${r.rg || ''}`.replace(/^-|-$/g, ''),
      nome: r.nome,
      iqg: r.iqg,
      pt_iqg: r.pt_iqg,
      raca: r.raca,
      sexo: r.sexo,
      data_nascimento: r.data_nascimento,
      ultimo_peso: r.ultimo_peso,
      ultimo_ce: r.ultimo_ce,
      data_ultima_pesagem: r.data_ultima_pesagem,
      local: validarLocal(r.localizacao_piquete || r.piquete_atual || r.pasto_atual || null)
    }));

    return res.status(200).json({
      success: true,
      data: ranking,
    });
  } catch (error) {
    console.error('Erro ao buscar ranking IQG:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar ranking',
      details: String(error?.message || error),
    });
  }
}
