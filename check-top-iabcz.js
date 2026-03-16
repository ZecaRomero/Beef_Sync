const { query } = require('./lib/database');

async function checkTopIABCZ() {
  try {
    const res = await query(`
      SELECT * FROM animais WHERE rg = '13604'
    `);

    if (res.rows.length > 0) {
      console.log('Animals with RG 13604:', res.rows);
    } else {
      console.log('No animals found with iABCZ');
    }
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}

checkTopIABCZ();
