import { query } from '../../../lib/database';

/**
 * Limpa TODOS os dados genÃ©ticos: abczg, deca, iqg, pt_iqg, situacao_abcz.
 * ÃÅ¡til antes de reimportar dados do Excel.
 * POST /api/import/limpar-situacao-abcz
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'MÃ©todo nÃ£o permitido' });
  }

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
      message: `${total} animais tiveram todos os dados genÃ©ticos limpos (iABCZ, DECA, IQG, Pt IQG, SituaÃ§Ã£o ABCZ). Agora vocÃª pode importar novamente.`,
      total,
    });
  } catch (error) {
    console.error('â�Å’ Erro ao limpar dados genÃ©ticos:', error);
    return res.status(500).json({
      error: 'Erro ao limpar dados genÃ©ticos',
      details: String(error?.message || error),
    });
  }
}
