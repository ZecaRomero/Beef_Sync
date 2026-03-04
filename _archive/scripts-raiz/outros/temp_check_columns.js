const { query } = require('./lib/database');
async function checkColumns() {
  try {
    const res = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'notas_fiscais'");
    console.log('COLUMNS:', JSON.stringify(res.rows));
  } catch (err) {
    console.error('ERROR:', err);
  }
}
checkColumns();
