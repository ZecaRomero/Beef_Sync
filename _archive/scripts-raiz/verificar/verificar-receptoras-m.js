const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

async function verificarReceptoras() {
  const client = await pool.connect();
  
  try {
    console.log('\n=== VERIFICANDO ANIMAIS COM LETRA M ===\n');
    
    // Buscar animais com letra M
    const result = await client.query(`
      SELECT id, numero, letra, raca, sexo, data_nascimento, status, nf_origem
      FROM animais 
      WHERE letra = 'M'
      ORDER BY numero DESC
      LIMIT 30
    `);
    
    console.log(`Total de animais com letra M: ${result.rows.length}\n`);
    
    result.rows.forEach(animal => {
      console.log(`ID: ${animal.id} | ${animal.letra} ${animal.numero} | Raça: ${animal.raca} | Status: ${animal.status} | NF: ${animal.nf_origem || 'N/A'}`);
    });
    
    console.log('\n=== VERIFICANDO TABELA RECEPTORAS ===\n');
    
    // Verificar se existe tabela de receptoras
    const tabelasResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%recept%'
    `);
    
    console.log('Tabelas relacionadas a receptoras:');
    tabelasResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    console.log('\n=== VERIFICANDO TABELA LOTES_RECEPTORAS ===\n');
    
    // Verificar tabela lotes_receptoras
    const lotesResult = await client.query(`
      SELECT * FROM lotes_receptoras 
      WHERE nf_origem = '2141'
      ORDER BY numero
    `);
    
    console.log(`Total de receptoras na NF 2141: ${lotesResult.rows.length}\n`);
    
    if (lotesResult.rows.length > 0) {
      console.log('Receptoras encontradas:');
      lotesResult.rows.forEach(rec => {
        console.log(`${rec.letra} ${rec.numero} | TE: ${rec.data_te} | DG: ${rec.data_dg || 'Pendente'} | Status: ${rec.status_dg || 'Pendente'}`);
      });
    }
    
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

verificarReceptoras();
