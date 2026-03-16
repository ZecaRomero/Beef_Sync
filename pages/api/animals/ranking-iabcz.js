import { query } from '../../../lib/database';

// Filtrar nomes de touros (LANDROVER, MALCOM SANT ANNA) que foram cadastrados como local por engano
function validarLocal(val) {
  if (!val || typeof val !== 'string') return null
  const n = val.trim()
  if (!n) return null
  if (/^PIQUETE\s+(\d+|CABANHA|CONF|GUARITA|PISTA)$/i.test(n)) return val
  if (/^PROJETO\s+[\dA-Za-z\-]+$/i.test(n)) return val
  if (/^CONFINA$/i.test(n)) return val
  if (/^PIQ\s+\d+$/i.test(n)) return val.replace(/^PIQ\s+/i, 'PIQUETE ')
  if (/^(CABANHA|GUARITA|PISTA|CONF)$/i.test(n)) return val
  return null // Nome de touro ou inválido
}

/**
 * Retorna o ranking dos animais por iABCZ (maior = melhor).
 * Ordena por abczg numérico DESC, limit 10.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const serie = (req.query.serie || '').trim().toUpperCase();

    // Ordenar por abczg como número (maior primeiro), NULLS LAST
    // Se serie informada, filtra por série (ex: ranking só dos CJCJ)
    // Incluir dados úteis para o ranking (último peso/CE, local e nascimento)
    // Fallback: localizacoes_animais -> piquete_atual -> pasto_atual (igual ao desktop)
    let result
    try {
      result = await query(
      `SELECT 
         a.id, a.serie, a.rg, a.nome, a.mae, a.abczg, a.deca, a.raca, a.sexo, a.situacao,
         a.data_nascimento, a.pasto_atual, a.piquete_atual,
         a.serie_mae, a.rg_mae,
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
         AND a.abczg IS NOT NULL 
         AND TRIM(a.abczg) != ''
         ${serie ? 'AND UPPER(TRIM(COALESCE(a.serie, \'\'))) = $2' : ''}
       ORDER BY 
         CASE 
           WHEN a.abczg ~ '^[0-9]+[.,]?[0-9]*$'
           THEN (REPLACE(REPLACE(TRIM(a.abczg), ',', '.'), ' ', '')::numeric)
          ELSE NULL
        END DESC NULLS LAST,
        a.rg DESC
      LIMIT $1`,
        serie ? [limit, serie] : [limit]
      )
    } catch (colErr) {
      if (/column.*does not exist/i.test(colErr?.message || '')) {
        try {
          result = await query(
            `SELECT 
             a.id, a.serie, a.rg, a.nome, a.mae, a.abczg, a.deca, a.raca, a.sexo, a.situacao,
             a.data_nascimento, a.pasto_atual,
             a.serie_mae, a.rg_mae,
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
             AND a.abczg IS NOT NULL 
             AND TRIM(a.abczg) != ''
             ${serie ? 'AND UPPER(TRIM(COALESCE(a.serie, \'\'))) = $2' : ''}
           ORDER BY 
             CASE 
               WHEN a.abczg ~ '^[0-9]+[.,]?[0-9]*$'
              THEN (REPLACE(REPLACE(TRIM(a.abczg), ',', '.'), ' ', '')::numeric)
              ELSE NULL
            END DESC NULLS LAST,
            a.rg DESC
          LIMIT $1`,
          serie ? [limit, serie] : [limit]
        )
        } catch (colErr2) {
          if (/column.*does not exist/i.test(colErr2?.message || '')) {
            result = await query(
              `SELECT 
               a.id, a.serie, a.rg, a.nome, a.mae, a.abczg, a.deca, a.raca, a.sexo, a.situacao,
               a.data_nascimento, a.pasto_atual,
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
               AND a.abczg IS NOT NULL 
               AND TRIM(a.abczg) != ''
               ${serie ? 'AND UPPER(TRIM(COALESCE(a.serie, \'\'))) = $2' : ''}
             ORDER BY 
               CASE 
                 WHEN a.abczg ~ '^[0-9]+[.,]?[0-9]*$'
                 THEN (REPLACE(REPLACE(TRIM(a.abczg), ',', '.'), ' ', '')::numeric)
                 ELSE NULL
               END DESC NULLS LAST,
               a.rg DESC
             LIMIT $1`,
              serie ? [limit, serie] : [limit]
            )
          } else throw colErr2
        }
      } else throw colErr
    }

    const rows = result.rows || [];
    const ranking = rows.map((r, i) => ({
      posicao: i + 1,
      id: r.id,
      serie: r.serie,
      rg: r.rg,
      serie_mae: r.serie_mae,
      rg_mae: r.rg_mae,
      mae: r.mae,
      identificacao: `${r.serie || ''}-${r.rg || ''}`.replace(/^-|-$/g, ''),
      nome: r.nome,
      abczg: r.abczg,
      deca: r.deca,
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
    console.error('Erro ao buscar ranking iABCZ:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar ranking',
      details: String(error?.message || error),
    });
  }
}
