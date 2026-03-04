const { query } = require('./lib/database');
async function listTables() {
  try {
    const res = await query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('TABLES:', JSON.stringify(res.rows.map(r => r.table_name)));
  } catch (err) {
    console.error('ERROR:', err);
  }
}
listTables();
