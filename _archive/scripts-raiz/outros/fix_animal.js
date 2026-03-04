const { pool } = require('./lib/database');

async function fixAnimal() {
  try {
    console.log('Fixing animal CJCJ 15563...');
    const res = await pool.query("UPDATE animais SET sexo = 'Fêmea' WHERE serie = 'CJCJ' AND rg = '15563'");
    console.log('Updated rows:', res.rowCount);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

fixAnimal();