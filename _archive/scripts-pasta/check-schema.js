
const { query } = require('../lib/database');

async function checkSchema() {
  console.log('Checking schema for table "animais"...');
  try {
    const res = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'animais'
      ORDER BY column_name
    `);
    
    console.log('Columns in "animais":');
    res.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type})`);
    });

    const pasto = res.rows.find(r => r.column_name === 'pasto_atual');
    if (pasto) {
      console.log('\n‚≈ì‚Ä¶ "pasto_atual" column EXISTS.');
    } else {
      console.log('\n‚ù≈í "pasto_atual" column DOES NOT EXIST.');
    }

    const nascimento = res.rows.find(r => r.column_name === 'data_nascimento');
    if (nascimento) {
      console.log('‚≈ì‚Ä¶ "data_nascimento" column EXISTS.');
    } else {
      console.log('‚ù≈í "data_nascimento" column DOES NOT EXIST.');
    }

  } catch (err) {
    console.error('Error querying schema:', err);
  }
}

checkSchema();
