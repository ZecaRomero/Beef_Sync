
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85', // Trying the dev password found in lib/database.js
  port: 5432,
});

async function run() {
  try {
    console.log('Connecting...');
    const res = await pool.query('SELECT NOW()');
    console.log('Connected:', res.rows[0]);

    console.log('Checking animal CJCJ 17328...');
    // Check exact match
    const res1 = await pool.query("SELECT id, serie, rg FROM animals WHERE rg = '17328'");
    console.log('Exact RG 17328:', res1.rows);

    // Check with LIKE
    const res2 = await pool.query("SELECT id, serie, rg FROM animals WHERE rg::text LIKE '%17328%'");
    console.log('Like RG 17328:', res2.rows);

    // Check series CJCJ
    const res3 = await pool.query("SELECT id, serie, rg FROM animals WHERE serie ILIKE '%CJCJ%' LIMIT 5");
    console.log('Any CJCJ animals:', res3.rows);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

run();
