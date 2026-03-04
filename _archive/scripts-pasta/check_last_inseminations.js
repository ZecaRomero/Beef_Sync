const { query } = require('../lib/database');

async function check() {
  console.log('🔍 DATABASE_URL definida?', !!process.env.DATABASE_URL);
  console.log('🔍 DATABASE_URL (primeiros 20 chars):', (process.env.DATABASE_URL || 'undefined').substring(0, 20));

  try {
    const res = await query(`
      SELECT id, animal_id, data_ia, touro_nome, created_at 
      FROM inseminacoes 
      ORDER BY data_ia DESC, created_at DESC 
      LIMIT 20
    `);
    console.table(res.rows);
  } catch (e) {
    console.error('Erro:', e);
  }
}

check();
