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

async function testarLancarDG() {
  try {
    console.log('🧪 Testando lançamento de DG para receptora 8251...\n');
    
    const dataDG = '2026-02-19';
    const veterinario = 'Dr. Teste';
    const resultadoDG = 'Prenha';
    const observacoes = 'Teste de lançamento';
    
    // Buscar o animal
    const animalResult = await pool.query(`
      SELECT id, rg, serie, nome
      FROM animais 
      WHERE rg = '8251'
    `);
    
    if (animalResult.rows.length === 0) {
      console.log('❌ Animal não encontrado');
      return;
    }
    
    const animal = animalResult.rows[0];
    console.log('✅ Animal encontrado:');
    console.log(`ID: ${animal.id}`);
    console.log(`RG: ${animal.rg}`);
    console.log(`Série: ${animal.serie}`);
    console.log(`Nome: ${animal.nome}`);
    
    // Atualizar o DG
    console.log('\n📝 Atualizando DG...');
    const updateResult = await pool.query(`
      UPDATE animais 
      SET 
        data_dg = $1, 
        veterinario_dg = $2, 
        resultado_dg = $3, 
        observacoes_dg = $4, 
        updated_at = NOW()
      WHERE id = $5
      RETURNING id, data_dg, veterinario_dg, resultado_dg, observacoes_dg
    `, [dataDG, veterinario, resultadoDG, observacoes, animal.id]);
    
    if (updateResult.rows.length > 0) {
      console.log('\n✅ DG atualizado com sucesso!');
      const updated = updateResult.rows[0];
      console.log(`Data DG: ${new Date(updated.data_dg).toLocaleDateString('pt-BR')}`);
      console.log(`Veterinário: ${updated.veterinario_dg}`);
      console.log(`Resultado: ${updated.resultado_dg}`);
      console.log(`Observações: ${updated.observacoes_dg}`);
    } else {
      console.log('❌ Falha ao atualizar DG');
    }
    
    // Verificar se foi salvo
    console.log('\n🔍 Verificando se foi salvo...');
    const verificacao = await pool.query(`
      SELECT data_dg, veterinario_dg, resultado_dg, observacoes_dg
      FROM animais 
      WHERE id = $1
    `, [animal.id]);
    
    if (verificacao.rows.length > 0) {
      const v = verificacao.rows[0];
      console.log('\n📊 Dados salvos no banco:');
      console.log(`Data DG: ${v.data_dg ? new Date(v.data_dg).toLocaleDateString('pt-BR') : 'NULL'}`);
      console.log(`Veterinário: ${v.veterinario_dg || 'NULL'}`);
      console.log(`Resultado: ${v.resultado_dg || 'NULL'}`);
      console.log(`Observações: ${v.observacoes_dg || 'NULL'}`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

testarLancarDG();
