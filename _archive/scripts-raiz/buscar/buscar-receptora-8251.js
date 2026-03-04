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

async function buscarReceptora8251() {
  try {
    console.log('🔍 Buscando receptora 8251...\n');
    
    // Buscar por RG exato
    const resultRG = await pool.query(`
      SELECT id, rg, nome, sexo, categoria, situacao, inativo
      FROM animais 
      WHERE rg = '8251'
    `);
    
    if (resultRG.rows.length > 0) {
      console.log('✅ Receptora encontrada por RG exato:');
      console.log(JSON.stringify(resultRG.rows[0], null, 2));
    } else {
      console.log('❌ Receptora não encontrada por RG exato');
      
      // Buscar por RG parcial
      const resultParcial = await pool.query(`
        SELECT id, rg, nome, sexo, categoria, situacao, inativo
        FROM animais 
        WHERE rg LIKE '%8251%'
        ORDER BY rg
      `);
      
      if (resultParcial.rows.length > 0) {
        console.log('\n📋 Animais encontrados com "8251" no RG:');
        resultParcial.rows.forEach(animal => {
          console.log(`- RG: ${animal.rg}, Nome: ${animal.nome || 'Sem nome'}, Categoria: ${animal.categoria}, Situação: ${animal.situacao}, Inativo: ${animal.inativo}`);
        });
      } else {
        console.log('\n❌ Nenhum animal encontrado com "8251" no RG');
      }
    }
    
    // Verificar todas as receptoras
    const resultReceptoras = await pool.query(`
      SELECT COUNT(*) as total
      FROM animais 
      WHERE categoria = 'Receptora' AND (inativo = false OR inativo IS NULL)
    `);
    
    console.log(`\n📊 Total de receptoras ativas: ${resultReceptoras.rows[0].total}`);
    
  } catch (error) {
    console.error('❌ Erro ao buscar receptora:', error.message);
  } finally {
    await pool.end();
  }
}

buscarReceptora8251();
