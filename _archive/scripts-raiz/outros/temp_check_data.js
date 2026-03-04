const { query } = require('./lib/database');
async function checkData() {
  const tables = ['dna_envios', 'dna_animais', 'notas_fiscais_itens'];
  for (const table of tables) {
    try {
      const res = await query(`SELECT count(*) FROM ${table}`);
      console.log(`${table}: ${res.rows[0].count}`);
    } catch (err) {
      console.error(`Error in ${table}:`, err.message);
    }
  }
}
checkData();
