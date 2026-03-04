require('dotenv').config();
const { query } = require('./lib/database');

async function check() {
  try {
    console.log('Searching for RG 17836...');
    const resRg = await query("SELECT id, serie, rg, nome, situacao FROM animais WHERE rg ILIKE '%17836%'");
    console.log('Results by RG:', resRg.rows);

    console.log('Searching for ID 1612...');
    const resId = await query("SELECT id, serie, rg, nome, situacao FROM animais WHERE id = 1612");
    console.log('Results by ID:', resId.rows);
    
  } catch (err) {
    console.error(err);
  } finally {
      process.exit(0);
  }
}

check();
