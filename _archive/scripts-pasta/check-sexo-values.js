const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'estoque_semen',
  password: 'jcromero85',
  port: 5432,
});

async function checkSexoValues() {
  try {
    console.log('🔍 Verificando valores válidos para sexo...');
    
    const result = await pool.query('SELECT DISTINCT sexo FROM animais WHERE sexo IS NOT NULL');
    
    console.log('\n📊 Valores de sexo existentes:');
    result.rows.forEach(row => {
      console.log('  -', row.sexo);
    });
    
    // Verificar constraint
    const constraintResult = await pool.query("SELECT conname, consrc FROM pg_constraint WHERE conname LIKE '%sexo%'");
    console.log('\n🔍 Constraints de sexo:');
    constraintResult.rows.forEach(row => {
      console.log('  -', row.conname, ':', row.consrc);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

checkSexoValues();
