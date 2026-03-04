
// scripts/fix-animal-mother.js
require('dotenv').config();
const { query } = require('../lib/database');

async function main() {
  const animalId = 290; // ID do animal identificado anteriormente
  
  console.log(`Buscando animal ID: ${animalId}`);
  
  try {
    const result = await query(
      `SELECT * FROM animais WHERE id = $1`,
      [animalId]
    );
    
    if (result.rows.length === 0) {
      console.log('Animal não encontrado.');
      return;
    }
    
    const animal = result.rows[0];
    console.log(`Animal: ${animal.nome} (${animal.serie}-${animal.rg})`);
    console.log(`Mãe atual (Nome): ${animal.mae}`);
    console.log(`Mãe atual (Série/RG): ${animal.serie_mae}/${animal.rg_mae}`);
    
    if (animal.serie_mae && animal.rg_mae) {
      console.log('Série e RG da mãe já estão preenchidos. Nenhuma ação necessária.');
      return;
    }
    
    if (!animal.mae) {
      console.log('Nome da mãe não preenchido. Impossível extrair.');
      return;
    }
    
    // Lógica de extração melhorada
    let serie = null;
    let rg = null;
    
    // 1. Tentar formato "SERIE NOME RG" (ex: CJ SANT ANNA 14091)
    const matchFim = animal.mae.match(/^([A-Za-z]+).*?\s(\d+)$/);
    if (matchFim) {
      serie = matchFim[1];
      rg = matchFim[2];
    } else {
      // 2. Tentar formato padrão "SERIE RG"
      const matchPadrao = animal.mae.match(/^([A-Za-z]+)[\s\/\-]*(\d+)/);
      if (matchPadrao) {
        serie = matchPadrao[1];
        rg = matchPadrao[2];
      }
    }
    
    if (serie && rg) {
      console.log(`Extraído com sucesso: Série=${serie}, RG=${rg}`);
      
      console.log('Atualizando banco de dados...');
      await query(
        `UPDATE animais SET serie_mae = $1, rg_mae = $2 WHERE id = $3`,
        [serie, rg, animalId]
      );
      console.log('Atualização concluída com sucesso!');
    } else {
      console.log('Não foi possível extrair Série e RG do nome da mãe de forma confiável.');
    }
    
  } catch (err) {
    console.error('Erro:', err);
  }
}

main();
