
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

async function checkCJCS() {
  try {
    console.log('Checking animals with series CJCS...');
    
    // First, verify exact match on 'CJCS'
    const res = await pool.query(`
      SELECT id, serie, rg 
      FROM animais 
      WHERE serie = 'CJCS' 
      ORDER BY id 
      LIMIT 10
    `);
    
    if (res.rows.length > 0) {
        console.log('Found animals with serie="CJCS":');
        console.table(res.rows);
    } else {
        console.log('No animals found with serie="CJCS". Trying LIKE...');
        
        const resLike = await pool.query(`
          SELECT id, serie, rg 
          FROM animais 
          WHERE serie ILIKE '%CJCS%' 
          ORDER BY id 
          LIMIT 10
        `);
        
        if (resLike.rows.length > 0) {
            console.log('Found animals with LIKE "%CJCS%":');
            console.table(resLike.rows);
        } else {
            console.log('No animals found with series containing "CJCS".');
            
            // List all distinct series to see what we have
            const resAllSeries = await pool.query(`
                SELECT DISTINCT serie FROM animais ORDER BY serie LIMIT 20
            `);
            console.log('Available series:', resAllSeries.rows.map(r => r.serie));
        }
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

checkCJCS();
