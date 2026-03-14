const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'beef_sync',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function verificarEstrutura() {
  try {
    console.log('🔍 Verificando estrutura da tabela animais...\n');
    
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'animais'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Colunas da tabela animais:');
    result.rows.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Buscar receptora 8251
    console.log('\n🔍 Buscando receptora 8251...');
    const animal = await pool.query(`SELECT * FROM animais WHERE rg = '8251' LIMIT 1`);
    
    if (animal.rows.length > 0) {
      console.log('\n✅ Receptora encontrada:');
      console.log(JSON.stringify(animal.rows[0], null, 2));
    } else {
      console.log('\n❌ Receptora 8251 não encontrada');
      
      // Buscar RGs similares
      const similares = await pool.query(`
        SELECT rg, nome, sexo, tipo_animal
        FROM animais 
        WHERE rg LIKE '%8251%' OR rg LIKE '%251%'
        ORDER BY rg
        LIMIT 10
      `);
      
      if (similares.rows.length > 0) {
        console.log('\n📋 RGs similares encontrados:');
        similares.rows.forEach(a => {
          console.log(`- RG: ${a.rg}, Nome: ${a.nome || 'Sem nome'}, Sexo: ${a.sexo}, Tipo: ${a.tipo_animal}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

verificarEstrutura();
