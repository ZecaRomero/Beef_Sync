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
    console.log('≈∏‚Äùç Verificando status completo da receptora 8251...\n');
    
    const result = await pool.query(`
      SELECT 
        id, rg, serie, nome, sexo, situacao,
        data_dg, veterinario_dg, resultado_dg, observacoes_dg,
        data_chegada
      FROM animais 
      WHERE rg = '8251'
    `);
    
    if (result.rows.length === 0) {
      console.log('‚ù≈í Animal n√£o encontrado');
      return;
    }
    
    const animal = result.rows[0];
    
    console.log('≈∏‚Äú≈† DADOS COMPLETOS DO ANIMAL:');
    console.log('‚‚Ä¢ê'.repeat(60));
    console.log(`ID: ${animal.id}`);
    console.log(`RG: ${animal.rg}`);
    console.log(`S√©rie: ${animal.serie}`);
    console.log(`Nome: ${animal.nome}`);
    console.log(`Sexo: ${animal.sexo}`);
    console.log(`Situa√ß√£o: ${animal.situacao}`);
    console.log('');
    console.log('≈∏‚Äú‚Ä¶ DATAS:');
    console.log(`Data Chegada: ${animal.data_chegada ? new Date(animal.data_chegada).toLocaleDateString('pt-BR') : 'N√£o registrada'}`);
    console.log('');
    console.log('≈∏§∞ DADOS DO DG:');
    console.log(`Data DG: ${animal.data_dg ? new Date(animal.data_dg).toLocaleDateString('pt-BR') : '‚ù≈í N√∆íO REGISTRADO'}`);
    console.log(`Veterin√°rio: ${animal.veterinario_dg || '‚ù≈í N√∆íO REGISTRADO'}`);
    console.log(`Resultado: ${animal.resultado_dg || '‚ù≈í N√∆íO REGISTRADO'}`);
    console.log(`Observa√ß√µes: ${animal.observacoes_dg || 'Nenhuma'}`);
    console.log('');
    
    // Calcular situa√ß√£o reprodutiva
    console.log('≈∏‚Äùç SITUA√‚Ä°√∆íO REPRODUTIVA CALCULADA:');
    console.log('‚‚Ä¢ê'.repeat(60));
    
    if (animal.resultado_dg && animal.resultado_dg.toLowerCase().includes('pren')) {
      console.log('‚≈ì‚Ä¶ Status: PRENHA');
      
      if (animal.data_chegada) {
        const dataChegada = new Date(animal.data_chegada);
        const previsaoParto = new Date(dataChegada);
        previsaoParto.setDate(previsaoParto.getDate() + 285);
        
        const hoje = new Date();
        const diasRestantes = Math.max(0, Math.floor((previsaoParto - hoje) / (1000 * 60 * 60 * 24)));
        
        console.log(`≈∏‚Äú‚Ä¶ Data Chegada: ${dataChegada.toLocaleDateString('pt-BR')}`);
        console.log(`≈∏‚Äú‚Ä¶ Parto Previsto (estimado): ${previsaoParto.toLocaleDateString('pt-BR')}`);
        console.log(`‚è∞ Dias Restantes: ${diasRestantes} dias`);
      } else {
        console.log('‚≈°†Ô∏è Sem data de refer√™ncia para calcular parto previsto');
      }
    } else if (animal.resultado_dg && (animal.resultado_dg.toLowerCase().includes('vaz') || animal.resultado_dg.toLowerCase().includes('negat'))) {
      console.log('‚ù≈í Status: VAZIA');
    } else if (animal.data_dg) {
      console.log('‚≈°†Ô∏è Status: DG realizado mas resultado n√£o reconhecido');
      console.log(`   Resultado registrado: "${animal.resultado_dg}"`);
    } else {
      console.log('‚è≥ Status: AGUARDANDO DG');
    }
    
  } catch (error) {
    console.error('‚ù≈í Erro:', error.message);
  } finally {
    await pool.end();
  }
}

verificarStatusCompleto();
