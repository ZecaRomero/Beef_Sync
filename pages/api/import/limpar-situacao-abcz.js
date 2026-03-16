import { query } from '../../../lib/database';
import { blockIfNotZecaDeveloper } from '../../../utils/importAccess';

/**
 * Limpa TODOS os dados genéticos: abczg, deca, iqg, pt_iqg, situacao_abcz.
 * Útil antes de reimportar dados do Excel.
 * POST /api/import/limpar-situacao-abcz
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const blocked = blockIfNotZecaDeveloper(req, res);
  if (blocked) return blocked;

  try {
    let result;
    try {
      result = await query(`
        UPDATE animais SET
          abczg = NULL, deca = NULL,
          iqg = NULL, pt_iqg = NULL,
          situacao_abcz = NULL,
          updated_at = CURRENT_TIMESTAMP
      `);
    } catch (e) {
      if (/column.*does not exist/i.test(e?.message || '')) {
        result = await query(`
          UPDATE animais SET
            abczg = NULL, deca = NULL,
            genetica_2 = NULL, decile_2 = NULL,
            situacao_abcz = NULL,
            updated_at = CURRENT_TIMESTAMP
        `);
      } else throw e;
    }

    const total = result?.rowCount ?? 0;

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    return res.status(200).json({
      success: true,
      message: `${total} animais tiveram todos os dados genéticos limpos (iABCZ, DECA, IQG, Pt IQG, Situação ABCZ). Agora você pode importar novamente.`,
      total,
    });
  } catch (error) {
    console.error('❌ Erro ao limpar dados genéticos:', error);
    return res.status(500).json({
      error: 'Erro ao limpar dados genéticos',
      details: String(error?.message || error),
    });
  }
}
