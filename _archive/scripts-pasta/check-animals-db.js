const { query } = require('../lib/database');

async function checkAnimals() {
  try {
    console.log('🔍 Verificando animais no PostgreSQL...');
    
    // Verificar total de animais
    const result = await query('SELECT COUNT(*) as total FROM animais');
    console.log('📊 Total de animais:', result.rows[0].total);
    
    // Verificar receptoras especificamente
    const receptoras = await query(`
      SELECT serie, rg, raca, sexo, meses, situacao, created_at, data_nascimento 
      FROM animais 
      WHERE raca ILIKE '%receptora%' OR serie = 'RPT'
      ORDER BY created_at DESC
    `);
    
    console.log('🐄 Receptoras encontradas:', receptoras.rows.length);
    receptoras.rows.forEach(animal => {
      console.log(`- ${animal.serie}${animal.rg} | ${animal.raca} | ${animal.sexo} | ${animal.meses}m | ${animal.situacao} | Nasc: ${animal.data_nascimento} | Criado: ${animal.created_at}`);
    });
    
    // Verificar últimos 10 animais
    const ultimos = await query(`
      SELECT serie, rg, raca, sexo, meses, situacao, created_at, data_nascimento 
      FROM animais 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log('\n📋 Últimos 10 animais cadastrados:');
    ultimos.rows.forEach(animal => {
      console.log(`- ${animal.serie}${animal.rg} | ${animal.raca} | ${animal.sexo} | ${animal.meses}m | ${animal.situacao} | Nasc: ${animal.data_nascimento} | Criado: ${animal.created_at}`);
    });
    
    // Verificar estrutura da tabela
    const estrutura = await query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'animais' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n🗂️ Estrutura da tabela animais:');
    estrutura.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
  process.exit(0);
}

checkAnimals();
