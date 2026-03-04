
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

async function runMigration() {
  try {
    console.log('Adding genetica_2 and decile_2 columns to animais table...');
    
    await pool.query(`
      ALTER TABLE animais 
      ADD COLUMN IF NOT EXISTS genetica_2 NUMERIC,
      ADD COLUMN IF NOT EXISTS decile_2 VARCHAR(50);
    `);
    
    console.log('Columns added successfully.');
    
    // Verify
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'animais' AND column_name IN ('genetica_2', 'decile_2');
    `);
    console.log('Verification:', res.rows);
    
  } catch (err) {
    console.error('Error running migration:', err);
  } finally {
    await pool.end();
  }
}

runMigration();
