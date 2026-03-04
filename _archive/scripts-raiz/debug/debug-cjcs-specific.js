
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

async function checkSpecificCJCS() {
  try {
    console.log('Checking specific CJCS animals...');
    
    // Check for RG 39, 41 (from user screenshot)
    const rgs = ['39', '41', '0039', '0041'];
    
    const res = await pool.query(`
      SELECT id, serie, rg 
      FROM animais 
      WHERE serie = 'CJCS' AND rg IN ($1, $2, $3, $4)
    `, rgs);
    
    console.log('Query result for CJCS 39/41:', res.rows);
    
    if (res.rows.length === 0) {
        console.log('Not found. Checking LIKE...');
        const resLike = await pool.query(`
            SELECT id, serie, rg 
            FROM animais 
            WHERE serie = 'CJCS' AND (rg LIKE '%39' OR rg LIKE '%41')
        `);
        console.log('Like result:', resLike.rows);
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

checkSpecificCJCS();
