require('dotenv').config();
const { query } = require('../lib/database');

async function main() {
  try {
    const res = await query(
      `SELECT *
       FROM lotes_operacoes
       ORDER BY id DESC
       LIMIT 10`
    );
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Erro ao consultar lotes_operacoes:', err);
    process.exitCode = 1;
  }
}

main();