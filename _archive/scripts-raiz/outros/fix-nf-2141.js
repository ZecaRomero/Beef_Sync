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

const rgs = [
  '1815', '3233', 
  '3238', '3239', '3240', '3241', '3242', '3243', '3244', '3245', '3246', '3247', '3248', '3249', '3250',
  '8251',
  '3251', '3252', '3253', '3254'
];

async function fix() {
  const client = await pool.connect();
  try {
    console.log('--- Fixing NF 2141 Data ---');
    
    // 1. Update NF 2141 quantity
    const updateNf = await client.query(`
      UPDATE notas_fiscais 
      SET quantidade_receptoras = 20
      WHERE numero_nf = '2141'
      RETURNING *
    `);
    console.log('Updated NF:', updateNf.rows[0].numero_nf, 'Quantity:', updateNf.rows[0].quantidade_receptoras);

    // 2. Update Animals data_chegada
    // Use the date from the NF: 2026-02-11
    const dataChegada = '2026-02-11';
    
    console.log(`Updating ${rgs.length} animals with data_chegada = ${dataChegada}...`);
    
    // We update animals that match the RGs and have null data_chegada
    // We'll just update them regardless to be sure, or check if null.
    // Given the previous debug showed they are null, updating is safe.
    
    // Using unnest to handle the array of RGs
    const updateAnimals = await client.query(`
      UPDATE animais
      SET data_chegada = $1
      WHERE rg = ANY($2::text[])
      RETURNING id, rg, data_chegada
    `, [dataChegada, rgs]);
    
    console.log(`Updated ${updateAnimals.rowCount} animals.`);
    updateAnimals.rows.forEach(a => {
      console.log(`- Updated Animal ${a.rg} (ID: ${a.id})`);
    });

  } catch (e) {
    console.error('Error:', e);
  } finally {
    client.release();
    pool.end();
  }
}

fix();
