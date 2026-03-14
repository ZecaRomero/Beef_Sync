const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

async function buscarM1815() {
  const client = await pool.connect();
  
  try {
    console.log('\n=== BUSCANDO M 1815 ===\n');
    
    const result = await client.query(`
      SELECT id, serie, rg, raca, sexo, situacao, observacoes, data_chegada
      FROM animais 
      WHERE serie LIKE 'M1815%' OR serie LIKE 'M 1815%'
    `);
    
    console.log(`Encontrados: ${result.rows.length} animais\n`);
    
    if (result.rows.length > 0) {
      result.rows.forEach(animal => {
        console.log(`ID: ${animal.id} | Série: ${animal.serie} | RG: ${animal.rg} | Raça: ${animal.raca}`);
        console.log(`Observações: ${animal.observacoes}`);
        console.log('---');
      });
    } else {
      console.log('❌ M 1815 NÃO ENCONTRADA!\n');
    }
    
    console.log('\n=== BUSCANDO TODOS OS ANIMAIS M ===\n');
    
    const todosM = await client.query(`
      SELECT id, serie, rg, raca, data_chegada, observacoes
      FROM animais 
      WHERE serie LIKE 'M%'
      ORDER BY serie DESC
      LIMIT 30
    `);
    
    console.log(`Total de animais série M: ${todosM.rows.length}\n`);
    
    todosM.rows.forEach(animal => {
      console.log(`${animal.serie} | RG: ${animal.rg} | Raça: ${animal.raca} | Data chegada: ${animal.data_chegada || 'N/A'}`);
    });
    
    console.log('\n=== VERIFICANDO TABELA LOTES_RECEPTORAS ===\n');
    
    // Verificar se existe tabela lotes (pode ter as receptoras)
    const lotes = await client.query(`
      SELECT * FROM lotes 
      WHERE numero_nf = '2141'
      LIMIT 5
    `);
    
    console.log(`Lotes da NF 2141: ${lotes.rows.length}\n`);
    
    if (lotes.rows.length > 0) {
      console.log('Estrutura do lote:');
      console.log(JSON.stringify(lotes.rows[0], null, 2));
    }
    
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

buscarM1815();
