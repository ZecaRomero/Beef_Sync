const { query } = require('./lib/database');
async function checkDnaTables() {
  const tables = ['dna_envios', 'dna_animais'];
  for (const table of tables) {
    try {
      const res = await query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${table}'`);
      console.log(`COLUMNS FOR ${table}:`, JSON.stringify(res.rows));
    } catch (err) {
      console.error(`ERROR in ${table}:`, err);
    }
  }
}
checkDnaTables();
