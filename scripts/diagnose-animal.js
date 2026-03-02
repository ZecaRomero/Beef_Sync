
// scripts/diagnose-animal.js
require('dotenv').config();
const { query } = require('../lib/database');

async function main() {
  const searchTerm = '921'; // Ajustar conforme necessário
  
  console.log(`Buscando animal com termo: ${searchTerm}`);
  
  try {
    const result = await query(
      `SELECT * FROM animais WHERE id = $1 OR rg LIKE $2 OR nome LIKE $2 LIMIT 1`,
      [parseInt(searchTerm) || 0, `%${searchTerm}%`]
    );
    
    if (result.rows.length === 0) {
      console.log('Nenhum animal encontrado.');
      return;
    }
    
    const animal = result.rows[0];
    console.log('--- Animal Encontrado ---');
    console.log(`ID: ${animal.id}`);
    console.log(`Nome: ${animal.nome}`);
    console.log(`RG: ${animal.rg}`);
    console.log(`Série: ${animal.serie}`);
    console.log(`Mãe (Nome): ${animal.mae}`);
    console.log(`Mãe (Série): ${animal.serie_mae}`);
    console.log(`Mãe (RG): ${animal.rg_mae}`);
    
    if (animal.mae) {
      console.log(`\nBuscando mãe pelo nome: "${animal.mae}"...`);
      
      // Tentar extrair RG do nome da mãe
      const rgMatch = animal.mae.match(/(\d+)/);
      let rgMae = rgMatch ? rgMatch[1] : null;
      
      if (rgMae) {
        console.log(`Tentando buscar mãe por RG extraído do nome: ${rgMae}`);
        const maeRgResult = await query(
          `SELECT * FROM animais WHERE rg = $1 LIMIT 1`,
          [rgMae]
        );
        
        if (maeRgResult.rows.length > 0) {
            const mae = maeRgResult.rows[0];
            console.log('--- Mãe Encontrada (por RG) ---');
            console.log(`ID: ${mae.id}`);
            console.log(`Nome: ${mae.nome}`);
            console.log(`RG: ${mae.rg}`);
            console.log(`Série: ${mae.serie}`);
            return;
        }
      }

      const maeResult = await query(
        `SELECT * FROM animais WHERE UPPER(TRIM(nome)) = UPPER(TRIM($1)) LIMIT 1`,
        [animal.mae]
      );
      
      if (maeResult.rows.length > 0) {
        const mae = maeResult.rows[0];
        console.log('--- Mãe Encontrada ---');
        console.log(`ID: ${mae.id}`);
        console.log(`Nome: ${mae.nome}`);
        console.log(`RG: ${mae.rg}`);
        console.log(`Série: ${mae.serie}`);
      } else {
        console.log('Mãe não encontrada pelo nome exato. Tentando LIKE...');
        const maeLikeResult = await query(
            `SELECT * FROM animais WHERE UPPER(nome) LIKE UPPER($1) LIMIT 1`,
            [`%${String(animal.mae).trim()}%`]
        );
        if (maeLikeResult.rows.length > 0) {
            const mae = maeLikeResult.rows[0];
            console.log('--- Mãe Encontrada (LIKE) ---');
            console.log(`ID: ${mae.id}`);
            console.log(`Nome: ${mae.nome}`);
            console.log(`RG: ${mae.rg}`);
            console.log(`Série: ${mae.serie}`);
        } else {
            console.log('Mãe não encontrada no banco de dados.');
        }
      }
    } else {
      console.log('\nCampo "mae" está vazio no registro do animal.');
    }
    
  } catch (err) {
    console.error('Erro ao executar query:', err);
  }
}

main();
