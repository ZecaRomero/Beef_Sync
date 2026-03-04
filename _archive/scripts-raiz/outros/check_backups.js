const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'estoque_semen',
  password: process.env.DB_PASSWORD || 'jcromero85',
  port: parseInt(process.env.DB_PORT) || 5432,
});

async function checkBackups() {
  try {
    const client = await pool.connect();
    
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const allTables = res.rows.map(r => r.table_name);
    const backupTables = allTables.filter(t => t.includes('backup') || t.includes('exclus') || t.includes('old') || t.includes('bkp'));
    
    console.log('Found potential backup/restore tables:', backupTables);
    
    for (const table of backupTables) {
      const countRes = await client.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`${table}: ${countRes.rows[0].count} rows`);
      if (countRes.rows[0].count > 0) {
        const sample = await client.query(`SELECT * FROM ${table} LIMIT 1`);
        console.log(`Sample ${table}:`, sample.rows[0]);
      }
    }

    client.release();
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkBackups();
