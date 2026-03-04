const { query } = require('./lib/database');
async function checkItens() {
  try {
    const res = await query("SELECT count(*) FROM notas_fiscais WHERE itens IS NOT NULL AND itens != '[]'::jsonb");
    console.log('Records with items:', res.rows[0].count);
  } catch (err) {
    console.error('ERROR:', err);
  }
}
checkItens();
