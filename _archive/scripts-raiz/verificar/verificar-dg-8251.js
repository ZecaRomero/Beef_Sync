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

async function verificarDG8251() {
  try {
    console.log('🔍 Verificando DG da receptora 8251...\n');
    
    // Verificar na tabela animais
    const animalResult = await pool.query(`
      SELECT 
        id, rg, serie, nome, sexo,
        data_dg, veterinario_dg, resultado_dg, observacoes_dg,
        situacao
      FROM animais 
      WHERE rg = '8251'
    `);
    
    if (animalResult.rows.length > 0) {
      const animal = animalResult.rows[0];
      console.log('📋 Dados do Animal na tabela ANIMAIS:');
      console.log(`ID: ${animal.id}`);
      console.log(`RG: ${animal.rg}`);
      console.log(`Série: ${animal.serie}`);
      console.log(`Nome: ${animal.nome}`);
      console.log(`Sexo: ${animal.sexo}`);
      console.log(`Situação: ${animal.situacao}`);
      console.log(`\n📊 Dados do DG:`);
      console.log(`Data DG: ${animal.data_dg || 'NÃO REGISTRADO'}`);
      console.log(`Veterinário: ${animal.veterinario_dg || 'NÃO REGISTRADO'}`);
      console.log(`Resultado: ${animal.resultado_dg || 'NÃO REGISTRADO'}`);
      console.log(`Observações: ${animal.observacoes_dg || 'Nenhuma'}`);
      
      // Verificar inseminações
      console.log('\n🔍 Verificando INSEMINAÇÕES...');
      const inseminacaoResult = await pool.query(`
        SELECT 
          id, data_ia, touro_nome, tecnico,
          data_dg, status_gestacao, observacoes
        FROM inseminacoes 
        WHERE animal_id = $1
        ORDER BY data_ia DESC
      `, [animal.id]);
      
      if (inseminacaoResult.rows.length > 0) {
        console.log(`\n✅ Encontradas ${inseminacaoResult.rows.length} inseminação(ões):`);
        inseminacaoResult.rows.forEach((ins, idx) => {
          console.log(`\n--- Inseminação ${idx + 1} ---`);
          console.log(`ID: ${ins.id}`);
          console.log(`Data IA: ${ins.data_ia ? new Date(ins.data_ia).toLocaleDateString('pt-BR') : '-'}`);
          console.log(`Touro: ${ins.touro_nome || '-'}`);
          console.log(`Técnico: ${ins.tecnico || '-'}`);
          console.log(`Data DG: ${ins.data_dg ? new Date(ins.data_dg).toLocaleDateString('pt-BR') : 'NÃO REGISTRADO'}`);
          console.log(`Status Gestação: ${ins.status_gestacao || 'NÃO REGISTRADO'}`);
          console.log(`Observações: ${ins.observacoes || 'Nenhuma'}`);
        });
      } else {
        console.log('❌ Nenhuma inseminação encontrada');
      }
      
      // Verificar gestações
      console.log('\n🔍 Verificando GESTAÇÕES...');
      const gestacaoResult = await pool.query(`
        SELECT 
          id, data_inicio, data_prevista_parto, status
        FROM gestacoes 
        WHERE animal_id = $1
        ORDER BY data_inicio DESC
      `, [animal.id]);
      
      if (gestacaoResult.rows.length > 0) {
        console.log(`\n✅ Encontradas ${gestacaoResult.rows.length} gestação(ões):`);
        gestacaoResult.rows.forEach((gest, idx) => {
          console.log(`\n--- Gestação ${idx + 1} ---`);
          console.log(`ID: ${gest.id}`);
          console.log(`Data Início: ${gest.data_inicio ? new Date(gest.data_inicio).toLocaleDateString('pt-BR') : '-'}`);
          console.log(`Parto Previsto: ${gest.data_prevista_parto ? new Date(gest.data_prevista_parto).toLocaleDateString('pt-BR') : '-'}`);
          console.log(`Status: ${gest.status || '-'}`);
        });
      } else {
        console.log('❌ Nenhuma gestação encontrada');
      }
      
      // Verificar alertas DG
      console.log('\n🔍 Verificando ALERTAS DG...');
      const alertaResult = await pool.query(`
        SELECT 
          id, animal_id, tipo, mensagem, data_prevista, status, created_at
        FROM alertas_dg 
        WHERE animal_id = $1
        ORDER BY created_at DESC
      `, [animal.id]);
      
      if (alertaResult.rows.length > 0) {
        console.log(`\n✅ Encontrados ${alertaResult.rows.length} alerta(s):`);
        alertaResult.rows.forEach((alerta, idx) => {
          console.log(`\n--- Alerta ${idx + 1} ---`);
          console.log(`ID: ${alerta.id}`);
          console.log(`Tipo: ${alerta.tipo}`);
          console.log(`Mensagem: ${alerta.mensagem}`);
          console.log(`Data Prevista: ${alerta.data_prevista ? new Date(alerta.data_prevista).toLocaleDateString('pt-BR') : '-'}`);
          console.log(`Status: ${alerta.status}`);
          console.log(`Criado em: ${new Date(alerta.created_at).toLocaleString('pt-BR')}`);
        });
      } else {
        console.log('❌ Nenhum alerta encontrado');
      }
      
    } else {
      console.log('❌ Animal 8251 não encontrado na tabela animais');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

verificarDG8251();
