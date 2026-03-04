const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'estoque_semen',
  password: 'jcromero85',
  port: 5432,
});

async function checkTableStructure() {
  try {
    console.log('🔍 Verificando estrutura da tabela animais...');
    
    const result = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'animais' ORDER BY ordinal_position");
    
    console.log('\n📊 Colunas da tabela animais:');
    result.rows.forEach(row => {
      console.log('  -', row.column_name, '(' + row.data_type + ')');
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

checkTableStructure();