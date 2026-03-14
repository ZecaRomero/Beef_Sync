const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function verificarAnimais() {
  try {
    console.log('�Ÿ”� Verificando animais das inseminações...\n');

    // IDs dos animais das últimas inseminações
    const animalIds = [355, 269, 266, 258, 252, 231, 586, 585, 578, 487];

    console.log('�Ÿ“‹ IDs para verificar:', animalIds.join(', '));
    console.log('�”€'.repeat(100));

    for (const animalId of animalIds) {
      const animal = await pool.query(`
        SELECT id, serie, rg, nome, sexo, raca, situacao, created_at
        FROM animais
        WHERE id = $1
      `, [animalId]);

      if (animal.rows.length > 0) {
        const a = animal.rows[0];
        console.log(`\n�œ… ID ${animalId} - ENCONTRADO`);
        console.log(`   Série: ${a.serie}`);
        console.log(`   RG: ${a.rg}`);
        console.log(`   Nome: ${a.nome || '(sem nome)'}`);
        console.log(`   Sexo: ${a.sexo}`);
        console.log(`   Raça: ${a.raca || 'N/A'}`);
        console.log(`   Situação: ${a.situacao}`);
      } else {
        console.log(`\n�Œ ID ${animalId} - N�ƒO ENCONTRADO`);
      }
    }

    console.log('\n' + '�”€'.repeat(100));
    
    // Buscar animais com série CJC e RGs específicos
    console.log('\n�Ÿ”� Buscando animais CJC com RGs da tela...\n');
    
    const rgs = ['5', '19599', '19788', '19770', '19748', '19714', '19627', '19595'];
    
    for (const rg of rgs) {
      const result = await pool.query(`
        SELECT id, serie, rg, nome, sexo
        FROM animais
        WHERE serie LIKE 'CJC%' AND rg = $1
      `, [rg]);
      
      if (result.rows.length > 0) {
        console.log(`�œ… CJC ${rg} encontrado - ID: ${result.rows[0].id}`);
      } else {
        console.log(`�Œ CJC ${rg} N�ƒO encontrado`);
      }
    }

  } catch (error) {
    console.error('�Œ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

verificarAnimais();
