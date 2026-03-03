/**
 * Corrige animais onde iABCZ e DECA foram erroneamente sobrescritos com valores de IQG/Pt IQG.
 * Quando abczg = iqg (ou genetica_2) E deca = pt_iqg (ou decile_2), limpa abczg e deca
 * para remover a duplicação. Os valores corretos de iABCZ/DECA podem ser importados depois.
 *
 * Execute: node scripts/corrigir-iabcZ-deca-duplicados.js
 * Modo dry-run (só mostra): node scripts/corrigir-iabcZ-deca-duplicados.js --dry-run
 */
const { query } = require('../lib/database');

async function corrigir() {
  const dryRun = process.argv.includes('--dry-run');

  try {
    // Buscar animais onde abczg = iqg/genetica_2 E deca = pt_iqg/decile_2 (duplicação errada)
    // Tenta colunas iqg/pt_iqg; se não existirem, usa genetica_2/decile_2
    let res;
    try {
      res = await query(`
        SELECT id, serie, rg, nome, abczg, deca,
               COALESCE(iqg::text, genetica_2::text) as iqg_val,
               COALESCE(pt_iqg::text, decile_2::text) as pt_iqg_val
        FROM animais
        WHERE abczg IS NOT NULL AND TRIM(abczg::text) != ''
          AND TRIM(REPLACE(abczg::text, ',', '.')) = TRIM(REPLACE(COALESCE(iqg::text, genetica_2::text), ',', '.'))
          AND TRIM(COALESCE(deca::text, '')) = TRIM(COALESCE(pt_iqg::text, decile_2::text, ''))
      `);
    } catch (e) {
      if (/column.*does not exist/i.test(e?.message || '')) {
        res = await query(`
          SELECT id, serie, rg, nome, abczg, deca,
                 genetica_2::text as iqg_val,
                 decile_2::text as pt_iqg_val
          FROM animais
          WHERE abczg IS NOT NULL AND TRIM(abczg::text) != ''
            AND genetica_2 IS NOT NULL
            AND TRIM(REPLACE(abczg::text, ',', '.')) = TRIM(REPLACE(genetica_2::text, ',', '.'))
            AND TRIM(COALESCE(deca::text, '')) = TRIM(COALESCE(decile_2::text, ''))
        `);
      } else throw e;
    }

    const afetados = res.rows || [];
    console.log(`Encontrados ${afetados.length} animal(is) com iABCZ/DECA duplicados de IQG/Pt IQG:`);
    afetados.slice(0, 20).forEach((a, i) => {
      console.log(`  ${i + 1}. ${a.serie}-${a.rg} (${a.nome}) - abczg=${a.abczg} deca=${a.deca}`);
    });
    if (afetados.length > 20) {
      console.log(`  ... e mais ${afetados.length - 20}`);
    }

    if (afetados.length === 0) {
      console.log('Nenhum animal para corrigir.');
      return;
    }

    if (dryRun) {
      console.log('\n[DRY-RUN] Nenhuma alteração feita. Execute sem --dry-run para aplicar.');
      return;
    }

    const ids = afetados.map(a => a.id);
    const updateRes = await query(
      `UPDATE animais SET abczg = NULL, deca = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = ANY($1::int[])
       RETURNING id, serie, rg, nome`,
      [ids]
    );

    console.log(`\n✅ ${updateRes.rows.length} animal(is) corrigido(s). iABCZ e DECA foram limpos.`);
    console.log('   Importe os valores corretos de iABCZ/DECA quando tiver o arquivo.');
  } catch (err) {
    console.error('Erro:', err.message);
    process.exit(1);
  }
}

corrigir();
