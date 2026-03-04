const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

async function checkAnimal() {
  try {
    console.log('Checking animal CJCJ 17039...\n');
    
    const res = await pool.query(`
      SELECT id, serie, rg, nome, abczg, deca, iqg, pt_iqg, genetica_2, decile_2
      FROM animais 
      WHERE rg = '17039' AND serie = 'CJCJ';
    `);
    
    if (res.rows.length > 0) {
      console.log('Animal found:');
      console.log(res.rows[0]);
    } else {
      console.log('Animal not found. Searching by RG only...');
      const res2 = await pool.query(`
        SELECT id, serie, rg, nome, abczg, deca, iqg, pt_iqg, genetica_2, decile_2
        FROM animais 
        WHERE rg = '17039';
      `);
      console.log('Results:', res2.rows);
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

checkAnimal();
