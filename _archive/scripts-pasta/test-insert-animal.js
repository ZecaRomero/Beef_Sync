const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'beef_sync',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function testInsert() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testando INSERT direto no banco...');
    
    // Verificar quantos animais existem antes
    const antes = await client.query('SELECT COUNT(*) as total FROM animais');
    console.log(`📊 Animais antes do teste: ${antes.rows[0].total}`);
    
    // Tentar inserir um animal de teste
    const testAnimal = {
      serie: 'TEST',
      rg: '99999',
      sexo: 'Macho',
      raca: 'Nelore',
      situacao: 'Ativo'
    };
    
    console.log('📝 Inserindo animal de teste:', testAnimal);
    
    const insertQuery = `
      INSERT INTO animais (
        serie, rg, sexo, raca, situacao, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    const result = await client.query(insertQuery, [
      testAnimal.serie,
      testAnimal.rg,
      testAnimal.sexo,
      testAnimal.raca,
      testAnimal.situacao
    ]);
    
    const insertedAnimal = result.rows[0];
    console.log('✅ Animal inserido:', insertedAnimal);
    
    // Verificar se foi salvo
    const verificar = await client.query(
      'SELECT * FROM animais WHERE id = $1',
      [insertedAnimal.id]
    );
    
    if (verificar.rows.length > 0) {
      console.log('✅ Animal encontrado no banco:', verificar.rows[0]);
    } else {
      console.error('❌ Animal NÃO encontrado após INSERT!');
    }
    
    // Contar novamente
    const depois = await client.query('SELECT COUNT(*) as total FROM animais');
    console.log(`📊 Animais depois do teste: ${depois.rows[0].total}`);
    
    // Limpar - remover animal de teste
    await client.query('DELETE FROM animais WHERE serie = $1 AND rg = $2', [
      testAnimal.serie,
      testAnimal.rg
    ]);
    console.log('🧹 Animal de teste removido');
    
    const final = await client.query('SELECT COUNT(*) as total FROM animais');
    console.log(`📊 Animais após limpeza: ${final.rows[0].total}`);
    
    console.log('✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    console.error('Stack:', error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

testInsert();

