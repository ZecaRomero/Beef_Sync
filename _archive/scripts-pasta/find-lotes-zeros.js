require('dotenv').config();
const { query } = require('../lib/database');

async function main() {
  try {
    const res = await query(
      `SELECT id, numero_lote, data_criacao
       FROM lotes_operacoes
       WHERE numero_lote LIKE 'LOTE-000%'
       ORDER BY id DESC
       LIMIT 20`
    );
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Erro ao consultar lotes com zeros:', err);
    process.exitCode = 1;
  }
}

main();