
const { query } = require('./lib/database');

async function checkAnimal() {
  try {
    console.log('Checking animal CJCJ 17328...');
    const res = await query('SELECT * FROM animals WHERE rg = $1', ['17328']); // Try strict RG match first
    console.log('Found by RG 17328:', res.rows);
    
    if (res.rows.length === 0) {
        // Try loose search
        const res2 = await query('SELECT * FROM animals WHERE rg::text LIKE $1', ['%17328%']);
        console.log('Found by LIKE 17328:', res2.rows);
    }
    
    // Check series for found animals
    if (res.rows.length > 0) {
        res.rows.forEach(a => {
            console.log(`ID: ${a.id}, Serie: "${a.serie}", RG: "${a.rg}", Situacao: "${a.situacao}"`);
        });
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

checkAnimal();
