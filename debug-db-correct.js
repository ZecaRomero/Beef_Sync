
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

async function run() {
  try {
    console.log('Connecting...');
    
    // Check exact match
    console.log("Querying: SELECT id, serie, rg FROM animais WHERE rg = '17328'");
    const res1 = await pool.query("SELECT id, serie, rg FROM animais WHERE rg = '17328'");
    console.log('Exact RG 17328:', res1.rows);

    // Check with LIKE
    console.log("Querying: SELECT id, serie, rg FROM animais WHERE rg::text LIKE '%17328%'");
    const res2 = await pool.query("SELECT id, serie, rg FROM animais WHERE rg::text LIKE '%17328%'");
    console.log('Like RG 17328:', res2.rows);

    // Check series CJCJ
    console.log("Querying: SELECT id, serie, rg FROM animais WHERE serie ILIKE '%CJCJ%' LIMIT 5");
    const res3 = await pool.query("SELECT id, serie, rg FROM animais WHERE serie ILIKE '%CJCJ%' LIMIT 5");
    console.log('Any CJCJ animals:', res3.rows);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

run();
