const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'beef_sync',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function debug() {
  try {
    console.log('--- Checking NF 2141 ---');
    const nfRes = await pool.query("SELECT * FROM notas_fiscais WHERE numero_nf = '2141'");
    if (nfRes.rows.length === 0) {
      console.log('NF 2141 NOT FOUND');
    } else {
      const nf = nfRes.rows[0];
      console.log('NF Found:', JSON.stringify({
        numero_nf: nf.numero_nf,
        quantidade_receptoras: nf.quantidade_receptoras,
        data_chegada_animais: nf.data_chegada_animais
      }, null, 2));
    }

    console.log('\n--- Checking Animal 8251 ---');
    const animalRes = await pool.query("SELECT * FROM animais WHERE rg = '8251'");
    if (animalRes.rows.length === 0) {
      console.log('Animal 8251 NOT FOUND');
    } else {
      console.log('Animal 8251:', JSON.stringify(animalRes.rows.map(a => ({
        id: a.id,
        rg: a.rg,
        data_chegada: a.data_chegada
      })), null, 2));
    }
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

debug();
