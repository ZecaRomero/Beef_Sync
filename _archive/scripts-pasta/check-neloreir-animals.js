const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'estoque_semen',
  password: 'jcromero85',
  port: 5432,
});

async function checkNeloreirAnimals() {
  try {
    console.log('🔍 Verificando animais NELOREGIR nas notas fiscais...');
    
    // Buscar todas as NFs que contêm animais com raça NELOREGIR
    const nfResult = await pool.query('SELECT id, numero_nf, fornecedor, data_compra, itens FROM notas_fiscais WHERE itens IS NOT NULL');
    
    console.log('\n📄 NFs com animais NELOREGIR:');
    const neloreirAnimals = [];
    
    nfResult.rows.forEach(row => {
      if (row.itens && Array.isArray(row.itens)) {
        row.itens.forEach(item => {
          if (item.raca === 'NELOREGIR') {
            console.log(`  NF ${row.numero_nf}: ${item.tatuagem} - ${item.raca} - ${item.sexo}`);
            neloreirAnimals.push({
              nf: row.numero_nf,
              tatuagem: item.tatuagem,
              raca: item.raca,
              sexo: item.sexo
            });
          }
        });
      }
    });
    
    // Verificar se esses animais existem na tabela animais
    console.log('\n🔍 Verificando se existem na tabela animais...');
    for (const animal of neloreirAnimals) {
      const animalCheck = await pool.query(
        'SELECT id, serie, rg, raca FROM animais WHERE CONCAT(serie, \'-\', rg) = $1', 
        [animal.tatuagem]
      );
      
      if (animalCheck.rows.length === 0) {
        console.log(`  ❌ Animal ${animal.tatuagem} (NELOREGIR) NÃO existe na tabela animais`);
      } else {
        console.log(`  ✅ Animal ${animal.tatuagem} existe como: ${animalCheck.rows[0].raca}`);
      }
    }
    
    // Verificar quantos animais NELOREGIR existem nas NFs vs tabela animais
    console.log('\n📊 Resumo:');
    console.log(`  Animais NELOREGIR nas NFs: ${neloreirAnimals.length}`);
    
    const neloreAnimalsInDB = await pool.query('SELECT COUNT(*) as count FROM animais WHERE raca ILIKE \'%nelore%\'');
    console.log(`  Animais Nelore na tabela animais: ${neloreAnimalsInDB.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

checkNeloreirAnimals();
