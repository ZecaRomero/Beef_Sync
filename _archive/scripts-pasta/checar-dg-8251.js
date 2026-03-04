const { query } = require('../lib/database')

async function run() {
  try {
    const sql = `
      SELECT id, serie, rg, nome, data_dg, resultado_dg, veterinario_dg
      FROM animais
      WHERE 
        (TRIM(COALESCE(serie, '')) = 'M' AND TRIM(rg::text) = '8251')
        OR REPLACE(LOWER(COALESCE(serie, '')), ' ', '') = 'm8251'
      ORDER BY id DESC
      LIMIT 5
    `
    const res = await query(sql)
    console.log('Rows:', res.rows)
  } catch (e) {
    console.error('Erro:', e.message)
  }
}

run()
