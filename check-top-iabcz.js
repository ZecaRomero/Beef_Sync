const { query } = require('./lib/database');

async function checkTopIABCZ() {
  try {
    const res = await query(`
      SELECT 
         id, serie, rg, nome, mae, serie_mae, rg_mae, abczg
       FROM animais
       WHERE situacao = 'Ativo' 
         AND abczg IS NOT NULL 
         AND TRIM(abczg) != ''
       ORDER BY 
         CASE 
           WHEN abczg ~ '^[0-9]+[.,]?[0-9]*$'
           THEN (REPLACE(REPLACE(TRIM(abczg), ',', '.'), ' ', '')::numeric)
          ELSE NULL
        END DESC NULLS LAST,
        rg DESC
      LIMIT 5
    `);

    if (res.rows.length > 0) {
      console.log('Top 5 iABCZ Animals:', res.rows);
    } else {
      console.log('No animals found with iABCZ');
    }
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}

checkTopIABCZ();
