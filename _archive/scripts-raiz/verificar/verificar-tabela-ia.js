const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

async function verificar() {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema='public' 
        AND (table_name LIKE '%insem%' OR table_name LIKE '%ia%')
    `);
    
    console.log('Tabelas encontradas:');
    result.rows.forEach(r => console.log(`  - ${r.table_name}`));
    
  } finally {
    client.release();
    await pool.end();
  }
}

verificar();
