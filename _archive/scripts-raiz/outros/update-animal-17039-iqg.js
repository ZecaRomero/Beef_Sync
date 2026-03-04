const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

async function updateAnimal() {
  try {
    console.log('Updating animal CJCJ 17039 with IQG and Pt IQG values...\n');
    
    // Baseado na imagem, vou adicionar valores de exemplo
    // Você pode ajustar esses valores conforme necessário
    const iqgValue = 30.39; // Mesmo valor do iABCZ como exemplo
    const ptIqgValue = 2; // Mesmo valor do DECA como exemplo
    
    await pool.query(`
      UPDATE animais 
      SET iqg = $1, pt_iqg = $2
      WHERE rg = '17039' AND serie = 'CJCJ';
    `, [iqgValue, ptIqgValue]);
    
    console.log('Animal updated successfully.');
    
    // Verificar
    const res = await pool.query(`
      SELECT id, serie, rg, nome, abczg, deca, iqg, pt_iqg
      FROM animais 
      WHERE rg = '17039' AND serie = 'CJCJ';
    `);
    
    console.log('\nUpdated animal data:');
    console.log(res.rows[0]);
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

updateAnimal();
