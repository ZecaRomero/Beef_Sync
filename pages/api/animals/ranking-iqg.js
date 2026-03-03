import { query } from '../../../lib/database';

function validarLocal(val) {
  if (!val || typeof val !== 'string') return null;
  const n = val.trim();
  if (!n) return null;
  if (/^PIQUETE\s+(\d+|CABANHA|CONF|GUARITA|PISTA)$/i.test(n)) return val;
  if (/^PROJETO\s+[\dA-Za-z\-]+$/i.test(n)) return val;
  if (/^CONFINA$/i.test(n)) return val;
  if (/^PIQ\s+\d+$/i.test(n)) return val.replace(/^PIQ\s+/i, 'PIQUETE ');
  if (/^(CABANHA|GUARITA|PISTA|CONF)$/i.test(n)) return val;
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const limit = Math.min(parseInt(req.query.limit || '10', 10), 50);
  const serie = (req.query.serie || '').trim().toUpperCase();

  try {
    // Buscar animais com IQG preenchido, ordenados do maior para o menor
    // Se serie informada, filtra por série (ex: ranking só dos CJCJ)
    // Tratando números com vírgula e convertendo para numérico para ordenação correta
    const result = await query(
      `SELECT 
        a.id, 
        a.serie, 
        a.rg, 
        a.nome, 
        a.iqg, 
        a.pt_iqg,
        a.raca, 
        a.sexo, 
        a.data_nascimento,
        a.ultimo_peso,
        a.ultimo_ce,
        a.data_ultima_pesagem,
        a.local_nascimento,
        a.pasto_atual,
        a.piquete_atual,
        a.localizacao_piquete
       FROM animais a 
       WHERE a.situacao = 'Ativo' 
         AND a.iqg IS NOT NULL 
         AND TRIM(a.iqg) != ''
         ${serie ? 'AND UPPER(TRIM(COALESCE(a.serie, \'\'))) = $2' : ''}
       ORDER BY 
         CASE 
           WHEN a.iqg ~ '^[0-9]+[.,]?[0-9]*$' 
           THEN (REPLACE(REPLACE(TRIM(a.iqg), ',', '.'), ' ', '')::numeric)
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
