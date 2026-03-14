const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function verificarInseminacoes() {
  try {
    console.log('�Ÿ”� Verificando estrutura da tabela inseminacoes...\n');

    // Ver estrutura da tabela
    const estrutura = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'inseminacoes'
      ORDER BY ordinal_position
    `);

    console.log('�Ÿ“‹ Estrutura da tabela inseminacoes:');
    estrutura.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });

    // Buscar inseminações que aparecem na tela
    console.log('\n\n�Ÿ”� Buscando inseminações da tela...\n');
    
    const inseminacoes = await pool.query(`
      SELECT *
      FROM inseminacoes
      ORDER BY created_at DESC
      LIMIT 10
    `);

    console.log(`Total de inseminações encontradas: ${inseminacoes.rows.length}\n`);

    inseminacoes.rows.forEach((ia, idx) => {
      console.log(`${idx + 1}. ID: ${ia.id}`);
      console.log(`   Animal ID: ${ia.animal_id || 'NULL'}`);
      console.log(`   Série: ${ia.serie || ia.animal_serie || 'N/A'}`);
      console.log(`   RG: ${ia.rg || ia.animal_rg || 'N/A'}`);
      console.log(`   Data IA: ${ia.data_ia ? new Date(ia.data_ia).toLocaleDateString('pt-BR') : 'N/A'}`);
      console.log(`   Touro: ${ia.touro_nome || 'N/A'}`);
      console.log(`   Status: ${ia.status_gestacao || 'N/A'}`);
      console.log(`   Criado em: ${ia.created_at}`);
      console.log('   �”€'.repeat(40));
    });

    // Verificar se há campos serie/rg na tabela inseminacoes
    const temSerieRG = estrutura.rows.some(col => col.column_name === 'serie' || col.column_name === 'animal_serie');
    
    if (temSerieRG) {
      console.log('\n�œ… A tabela inseminacoes TEM campos para série/RG');
      
      // Buscar inseminações com série CJC
      const iasCJC = await pool.query(`
        SELECT *
        FROM inseminacoes
        WHERE serie LIKE 'CJC%' OR animal_serie LIKE 'CJC%'
        ORDER BY created_at DESC
        LIMIT 5
      `);
      
      console.log(`\n�Ÿ“Š Inseminações com série CJC: ${iasCJC.rows.length}`);
    } else {
      console.log('\n�š�️ A tabela inseminacoes N�ƒO tem campos para série/RG');
      console.log('   As inseminações dependem do animal_id para identificar o animal');
    }

  } catch (error) {
    console.error('�Œ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

verificarInseminacoes();
