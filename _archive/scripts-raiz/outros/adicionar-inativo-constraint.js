const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

async function adicionarInativo() {
  const client = await pool.connect();
  
  try {
    console.log('\n=== ADICIONANDO "Inativo" �€ CONSTRAINT ===\n');
    
    // Remover constraint antiga
    console.log('1. Removendo constraint antiga...');
    await client.query(`
      ALTER TABLE animais DROP CONSTRAINT IF EXISTS animais_situacao_check
    `);
    console.log('�œ… Constraint antiga removida');
    
    // Adicionar nova constraint com "Inativo"
    console.log('\n2. Adicionando nova constraint com "Inativo"...');
    await client.query(`
      ALTER TABLE animais 
      ADD CONSTRAINT animais_situacao_check 
      CHECK (situacao IN ('Ativo', 'Vendido', 'Morto', 'Transferido', 'Inativo'))
    `);
    console.log('�œ… Nova constraint adicionada');
    
    console.log('\n=== VERIFICANDO NOVA CONSTRAINT ===\n');
    
    const result = await client.query(`
      SELECT 
        conname AS constraint_name,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM pg_constraint
      WHERE conrelid = 'animais'::regclass
      AND conname LIKE '%situacao%'
    `);
    
    if (result.rows.length > 0) {
      console.log('Nova constraint:');
      result.rows.forEach(row => {
        console.log(`\nNome: ${row.constraint_name}`);
        console.log(`Definição: ${row.constraint_definition}`);
      });
    }
    
    console.log('\n�œ… Agora você pode usar "Inativo" como situação!');
    
  } catch (error) {
    console.error('�Œ Erro:', error.message);
    console.error(error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

adicionarInativo();
