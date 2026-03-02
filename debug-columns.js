
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

async function checkColumns() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'animais'
      ORDER BY column_name;
    `);
    
    console.log('Columns in animais table:');
    res.rows.forEach(r => console.log(`${r.column_name} (${r.data_type})`));
    
    const genetica2 = res.rows.find(r => r.column_name === 'genetica_2');
    const decile2 = res.rows.find(r => r.column_name === 'decile_2');
    
    console.log('\nVerification:');
    console.log('genetica_2 exists:', !!genetica2);
    console.log('decile_2 exists:', !!decile2);
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

checkColumns();
