const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function verificarPiquetes() {
  try {
    console.log('�Ÿ”� Verificando piquetes cadastrados...\n');

    // Buscar todos os piquetes
    const result = await pool.query(`
      SELECT *
      FROM piquetes
      ORDER BY codigo
    `);

    console.log(`�Ÿ“Š Total de piquetes: ${result.rows.length}\n`);

    if (result.rows.length === 0) {
      console.log('�Œ Nenhum piquete encontrado no banco de dados!');
    } else {
      console.log('Piquetes cadastrados:');
      console.log('�”€'.repeat(80));
      result.rows.forEach(p => {
        console.log(`ID: ${p.id}`);
        console.log(`Código: ${p.codigo}`);
        console.log(`Nome: ${p.nome || '(sem nome)'}`);
        console.log(`Área: ${p.area || 'N/A'}`);
        console.log(`Capacidade: ${p.capacidade || 'N/A'}`);
        console.log(`Tipo: ${p.tipo || 'N/A'}`);
        console.log(`Ativo: ${p.ativo ? 'Sim' : 'Não'}`);
        console.log(`Criado em: ${p.created_at}`);
        console.log(`Observações: ${p.observacoes || '(nenhuma)'}`);
        console.log('�”€'.repeat(80));
      });
    }

    // Verificar estrutura da tabela
    console.log('\n�Ÿ“‹ Estrutura da tabela piquetes:');
    const estrutura = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'piquetes'
      ORDER BY ordinal_position
    `);

    estrutura.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });

  } catch (error) {
    console.error('�Œ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

verificarPiquetes();
