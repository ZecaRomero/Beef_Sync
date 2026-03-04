const { query } = require('./lib/database');
async function checkReportsTable() {
  try {
    const res = await query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'relatorios_personalizados'");
    console.log('COLUMNS:', JSON.stringify(res.rows));
  } catch (err) {
    console.error('ERROR:', err);
  }
}
checkReportsTable();
