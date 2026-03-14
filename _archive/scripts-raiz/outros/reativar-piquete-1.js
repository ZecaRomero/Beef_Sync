const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function reativarPiquete() {
  try {
    console.log('�Ÿ”„ Reativando PIQUETE 1...\n');

    // Reativar o piquete
    const result = await pool.query(`
      UPDATE piquetes
      SET ativo = true, updated_at = CURRENT_TIMESTAMP
      WHERE codigo = 'PIQUETE 1'
      RETURNING *
    `);

    if (result.rows.length > 0) {
      console.log('�œ… PIQUETE 1 reativado com sucesso!');
      console.log('\nDetalhes:');
      console.log(`  ID: ${result.rows[0].id}`);
      console.log(`  Código: ${result.rows[0].codigo}`);
      console.log(`  Nome: ${result.rows[0].nome}`);
      console.log(`  Ativo: ${result.rows[0].ativo ? 'Sim' : 'Não'}`);
      console.log(`  Atualizado em: ${result.rows[0].updated_at}`);
    } else {
      console.log('�Œ PIQUETE 1 não encontrado!');
    }

  } catch (error) {
    console.error('�Œ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

reativarPiquete();
