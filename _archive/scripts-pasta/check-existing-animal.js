const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'estoque_semen',
  password: 'jcromero85',
  port: 5432,
});

async function checkExistingAnimal() {
  try {
    console.log('🔍 Verificando se TOURO 001 já existe...');
    
    const result = await pool.query("SELECT * FROM animais WHERE serie = 'TOURO' AND rg = '001'");
    
    if (result.rows.length > 0) {
      console.log('\n📊 Animal encontrado:');
      const animal = result.rows[0];
      console.log('  - ID:', animal.id);
      console.log('  - Série:', animal.serie);
      console.log('  - RG:', animal.rg);
      console.log('  - Raça:', animal.raca);
      console.log('  - Sexo:', animal.sexo);
      console.log('  - Peso:', animal.peso);
      console.log('  - Situação:', animal.situacao);
    } else {
      console.log('\n❌ Animal não encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

checkExistingAnimal();
