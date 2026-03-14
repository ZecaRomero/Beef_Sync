const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'estoque_semen',
  password: 'jcromero85',
  port: 5432,
});

async function checkBulletinData() {
  try {
    console.log('🔍 Verificando dados do boletim...');
    
    // Verificar animais por raça
    const result = await pool.query('SELECT raca, COUNT(*) as count FROM animais GROUP BY raca ORDER BY raca');
    
    console.log('\n📊 Animais por raça:');
    result.rows.forEach(row => {
      console.log('  -', row.raca + ':', row.count, 'animais');
    });
    
    // Verificar se há animais Nelore
    const neloreResult = await pool.query("SELECT COUNT(*) as count FROM animais WHERE raca = 'Nelore'");
    console.log('\n🔍 Total de animais Nelore:', neloreResult.rows[0].count);
    
    // Verificar detalhes dos animais Nelore
    const neloreDetails = await pool.query("SELECT serie, rg, peso, meses, situacao FROM animais WHERE raca = 'Nelore' ORDER BY serie, rg");
    console.log('\n📋 Detalhes dos animais Nelore:');
    neloreDetails.rows.forEach(row => {
      console.log(`  - ${row.serie} ${row.rg}: ${row.peso}kg, ${row.meses} meses, ${row.situacao}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

checkBulletinData();
