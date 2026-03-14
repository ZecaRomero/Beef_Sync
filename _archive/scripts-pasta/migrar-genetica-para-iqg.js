/**
 * Migração: renomeia genetica_2 -> iqg e decile_2 -> pt_iqg na tabela animais
 * Execute: node scripts/migrar-genetica-para-iqg.js
 */
const { query } = require('../lib/database');

async function migrate() {
  try {
    console.log('Iniciando migração genetica_2/decile_2 -> iqg/pt_iqg...');

    // Verificar se genetica_2 existe e iqg não existe
    const colGenetica = await query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'animais' AND column_name IN ('genetica_2', 'iqg')`
    );
    const hasGenetica2 = colGenetica.rows.some(r => r.column_name === 'genetica_2');
    const hasIqg = colGenetica.rows.some(r => r.column_name === 'iqg');

    if (hasGenetica2 && !hasIqg) {
      await query('ALTER TABLE animais RENAME COLUMN genetica_2 TO iqg');
      console.log('  �œ“ genetica_2 renomeado para iqg');
    } else if (!hasIqg) {
      await query('ALTER TABLE animais ADD COLUMN iqg VARCHAR(50)');
      console.log('  �œ“ Coluna iqg adicionada');
    } else {
      console.log('  - Coluna iqg já existe');
    }

    // Verificar se decile_2 existe e pt_iqg não existe
    const colDecile = await query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'animais' AND column_name IN ('decile_2', 'pt_iqg')`
    );
    const hasDecile2 = colDecile.rows.some(r => r.column_name === 'decile_2');
    const hasPtIqg = colDecile.rows.some(r => r.column_name === 'pt_iqg');

    if (hasDecile2 && !hasPtIqg) {
      await query('ALTER TABLE animais RENAME COLUMN decile_2 TO pt_iqg');
      console.log('  �œ“ decile_2 renomeado para pt_iqg');
    } else if (!hasPtIqg) {
      await query('ALTER TABLE animais ADD COLUMN pt_iqg VARCHAR(50)');
      console.log('  �œ“ Coluna pt_iqg adicionada');
    } else {
      console.log('  - Coluna pt_iqg já existe');
    }

    console.log('Migração concluída com sucesso!');
  } catch (err) {
    console.error('Erro na migração:', err.message);
    process.exit(1);
  }
}

migrate();
