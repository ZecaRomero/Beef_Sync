const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'beef_sync',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'jcromero85',
  max: 5,
  connectionTimeoutMillis: 10000,
});

async function run() {
  const numero = '8251';
  const letra = 'M';
  const key = (letra + numero).replace(/\s/g, '').toLowerCase();
  console.log('Key:', key);
  try {
    const res = await pool.query(
      `SELECT id, serie, rg, nome, data_dg, resultado_dg
       FROM animais
       WHERE REPLACE(LOWER(COALESCE(serie, '') || TRIM(COALESCE(rg::text, ''))), ' ', '') = $1
          OR LOWER(REPLACE(COALESCE(nome, ''), ' ', '')) LIKE $2
       ORDER BY id DESC
       LIMIT 5`,
      [key, key + '%']
    );
    console.log('Rows:', res.rows.length);
    console.log(res.rows);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

run();
