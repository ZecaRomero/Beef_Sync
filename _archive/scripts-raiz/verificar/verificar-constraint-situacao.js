const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

async function verificarConstraint() {
  const client = await pool.connect();
  
  try {
    console.log('\n=== VERIFICANDO CONSTRAINT DE SITUAÇÃO ===\n');
    
    // Buscar constraint
    const result = await client.query(`
      SELECT 
        conname AS constraint_name,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM pg_constraint
      WHERE conrelid = 'animais'::regclass
      AND conname LIKE '%situacao%'
    `);
    
    if (result.rows.length > 0) {
      console.log('Constraint encontrada:');
      result.rows.forEach(row => {
        console.log(`\nNome: ${row.constraint_name}`);
        console.log(`Definição: ${row.constraint_definition}`);
      });
    } else {
      console.log('❌ Nenhuma constraint de situação encontrada');
    }
    
    console.log('\n=== VALORES ATUAIS DE SITUAÇÃO NO BANCO ===\n');
    
    const situacoes = await client.query(`
      SELECT DISTINCT situacao, COUNT(*) as total
      FROM animais
      GROUP BY situacao
      ORDER BY total DESC
    `);
    
    console.log('Situações em uso:');
    situacoes.rows.forEach(row => {
      console.log(`- ${row.situacao}: ${row.total} animais`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

verificarConstraint();
