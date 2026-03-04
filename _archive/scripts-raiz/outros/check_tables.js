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
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables:', res.rows.map(r => r.table_name));
    
    // Check columns for specific tables if they exist
    const tablesToCheck = ['pesagens', 'protocolos_aplicados', 'inseminacoes'];
    for (const table of tablesToCheck) {
        if (res.rows.find(r => r.table_name === table)) {
            const cols = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = '${table}'
            `);
            console.log(`Columns for ${table}:`, cols.rows.map(c => `${c.column_name} (${c.data_type})`));
        } else {
            console.log(`Table ${table} does not exist.`);
        }
    }

  } catch (err) {
    console.error('Error checking tables:', err);
  } finally {
    await pool.end();
  }
}

checkTables();
