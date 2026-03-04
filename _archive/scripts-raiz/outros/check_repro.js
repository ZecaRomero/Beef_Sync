const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'estoque_semen',
  password: process.env.DB_PASSWORD || 'jcromero85',
  port: parseInt(process.env.DB_PORT) || 5432,
});

async function checkTables() {
  try {
    const tablesToCheck = ['protocolos_reprodutivos', 'ciclos_reprodutivos', 'semen_usage', 'transferencias_embrioes'];
    for (const table of tablesToCheck) {
        const cols = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = '${table}'
        `);
        console.log(`Columns for ${table}:`, cols.rows.map(c => `${c.column_name} (${c.data_type})`));
    }

  } catch (err) {
    console.error('Error checking tables:', err);
  } finally {
    await pool.end();
  }
}

checkTables();
