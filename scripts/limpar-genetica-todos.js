/**
 * Limpa abczg, deca, iqg, pt_iqg (e genetica_2, decile_2) de TODOS os animais.
 * Use antes de reimportar os dados genéticos.
 *
 * Execute: node scripts/limpar-genetica-todos.js
 * Dry-run: node scripts/limpar-genetica-todos.js --dry-run
 */
require('dotenv').config({ path: '.env.local' });
require('dotenv').config(); // fallback para .env
const { query } = require('../lib/database');

async function limpar() {
  const dryRun = process.argv.includes('--dry-run');

  try {
    const countRes = await query('SELECT COUNT(*) as total FROM animais');
    const total = parseInt(countRes.rows[0]?.total || 0, 10);
    console.log(`Total de animais: ${total}`);

    if (dryRun) {
      console.log('[DRY-RUN] Nenhuma alteração. Execute sem --dry-run para limpar.');
      return;
    }

    // Limpar todas as colunas genéticas (suporta iqg/pt_iqg ou genetica_2/decile_2)
    try {
      await query(`
        UPDATE animais SET
          abczg = NULL, deca = NULL,
          iqg = NULL, pt_iqg = NULL,
          situacao_abcz = NULL,
          updated_at = CURRENT_TIMESTAMP
      `);
      console.log('✅ Limpeza concluída (iqg/pt_iqg).');
    } catch (e) {
      if (/column.*does not exist/i.test(e?.message || '')) {
        await query(`
          UPDATE animais SET
            abczg = NULL, deca = NULL,
            genetica_2 = NULL, decile_2 = NULL,
            situacao_abcz = NULL,
            updated_at = CURRENT_TIMESTAMP
        `);
        console.log('✅ Limpeza concluída (genetica_2/decile_2).');
      } else throw e;
    }
  } catch (err) {
    console.error('Erro:', err.message);
    process.exit(1);
  }
}

limpar();
