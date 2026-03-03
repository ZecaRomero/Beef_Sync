/**
 * Corrige iABCZ e DECA do animal CJCJ 17039 (valores corretos: iABCZ 24,99, Deca 1)
 * Execute: node scripts/corrigir-cjcj-17039-iabcZ.js
 */
const { query } = require('../lib/database');

async function corrigir() {
  try {
    const res = await query(
      `UPDATE animais SET abczg = '24.99', deca = '1', updated_at = CURRENT_TIMESTAMP
       WHERE UPPER(TRIM(serie)) = 'CJCJ' AND TRIM(rg::text) = '17039'
       RETURNING id, serie, rg, nome, abczg, deca, iqg, pt_iqg`
    );
    if (res.rows.length > 0) {
      console.log('✅ Corrigido:', res.rows[0]);
    } else {
      console.log('Animal CJCJ 17039 não encontrado.');
    }
  } catch (err) {
    console.error('Erro:', err.message);
    process.exit(1);
  }
}

corrigir();
