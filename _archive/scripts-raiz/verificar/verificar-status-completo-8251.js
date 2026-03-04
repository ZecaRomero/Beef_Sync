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

async function verificarStatusCompleto() {
  try {
    console.log('🔍 Verificando status completo da receptora 8251...\n');
    
    const result = await pool.query(`
      SELECT 
        id, rg, serie, nome, sexo, situacao,
        data_dg, veterinario_dg, resultado_dg, observacoes_dg,
        data_chegada
      FROM animais 
      WHERE rg = '8251'
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ Animal não encontrado');
      return;
    }
    
    const animal = result.rows[0];
    
    console.log('📊 DADOS COMPLETOS DO ANIMAL:');
    console.log('═'.repeat(60));
    console.log(`ID: ${animal.id}`);
    console.log(`RG: ${animal.rg}`);
    console.log(`Série: ${animal.serie}`);
    console.log(`Nome: ${animal.nome}`);
    console.log(`Sexo: ${animal.sexo}`);
    console.log(`Situação: ${animal.situacao}`);
    console.log('');
    console.log('📅 DATAS:');
    console.log(`Data Chegada: ${animal.data_chegada ? new Date(animal.data_chegada).toLocaleDateString('pt-BR') : 'Não registrada'}`);
    console.log('');
    console.log('🤰 DADOS DO DG:');
    console.log(`Data DG: ${animal.data_dg ? new Date(animal.data_dg).toLocaleDateString('pt-BR') : '❌ NÃO REGISTRADO'}`);
    console.log(`Veterinário: ${animal.veterinario_dg || '❌ NÃO REGISTRADO'}`);
    console.log(`Resultado: ${animal.resultado_dg || '❌ NÃO REGISTRADO'}`);
    console.log(`Observações: ${animal.observacoes_dg || 'Nenhuma'}`);
    console.log('');
    
    // Calcular situação reprodutiva
    console.log('🔍 SITUAÇÃO REPRODUTIVA CALCULADA:');
    console.log('═'.repeat(60));
    
    if (animal.resultado_dg && animal.resultado_dg.toLowerCase().includes('pren')) {
      console.log('✅ Status: PRENHA');
      
      if (animal.data_chegada) {
        const dataChegada = new Date(animal.data_chegada);
        const previsaoParto = new Date(dataChegada);
        previsaoParto.setDate(previsaoParto.getDate() + 285);
        
        const hoje = new Date();
        const diasRestantes = Math.max(0, Math.floor((previsaoParto - hoje) / (1000 * 60 * 60 * 24)));
        
        console.log(`📅 Data Chegada: ${dataChegada.toLocaleDateString('pt-BR')}`);
        console.log(`📅 Parto Previsto (estimado): ${previsaoParto.toLocaleDateString('pt-BR')}`);
        console.log(`⏰ Dias Restantes: ${diasRestantes} dias`);
      } else {
        console.log('⚠️ Sem data de referência para calcular parto previsto');
      }
    } else if (animal.resultado_dg && (animal.resultado_dg.toLowerCase().includes('vaz') || animal.resultado_dg.toLowerCase().includes('negat'))) {
      console.log('❌ Status: VAZIA');
    } else if (animal.data_dg) {
      console.log('⚠️ Status: DG realizado mas resultado não reconhecido');
      console.log(`   Resultado registrado: "${animal.resultado_dg}"`);
    } else {
      console.log('⏳ Status: AGUARDANDO DG');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

verificarStatusCompleto();
