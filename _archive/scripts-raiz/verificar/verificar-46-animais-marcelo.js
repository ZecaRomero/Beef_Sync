const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

async function verificar46AnimaisMarcelo() {
  const client = await pool.connect();
  
  try {
    console.log('≈∏‚Äùç VERIFICANDO 46 ANIMAIS DO MARCELO NO BANCO\n');
    console.log('='.repeat(80));
    
    // Buscar todos os animais do Marcelo
    const result = await client.query(`
      SELECT 
        id,
        serie,
        rg,
        nome,
        tatuagem,
        sexo,
        raca,
        situacao,
        fornecedor,
        data_compra,
        data_chegada,
        created_at
      FROM animais
      WHERE LOWER(fornecedor) LIKE '%marcelo%'
      ORDER BY serie, CAST(rg AS INTEGER)
    `);
    
    console.log(`\n≈∏‚Äú≈† TOTAL DE ANIMAIS DO MARCELO: ${result.rows.length}\n`);
    
    if (result.rows.length === 46) {
      console.log('‚≈ì‚Ä¶ PERFEITO! Todos os 46 animais est√£o no banco!\n');
    } else if (result.rows.length > 46) {
      console.log(`‚≈°†Ô∏è ATEN√‚Ä°√∆íO: H√° ${result.rows.length} animais (${result.rows.length - 46} a mais que o esperado)\n`);
    } else {
      console.log(`‚ù≈í FALTAM ${46 - result.rows.length} animais!\n`);
    }
    
    // Agrupar por s√©rie
    const porSerie = {};
    result.rows.forEach(a => {
      const serie = a.serie || 'SEM_SERIE';
      if (!porSerie[serie]) {
        porSerie[serie] = [];
      }
      porSerie[serie].push(a);
    });
    
    console.log('≈∏‚Äú‚Äπ DISTRIBUI√‚Ä°√∆íO POR S√‚Ä∞RIE:\n');
    Object.entries(porSerie).forEach(([serie, animais]) => {
      console.log(`S√©rie ${serie}: ${animais.length} animais`);
      console.log(`RGs: ${animais.map(a => a.rg).join(', ')}`);
      console.log('');
    });
    
    // Verificar se tem a G 3032 especificamente
    const g3032 = result.rows.find(a => a.serie === 'G' && a.rg === '3032');
    
    if (g3032) {
      console.log('‚≈ì‚Ä¶ G 3032 ENCONTRADA!');
      console.log('Dados:', {
        id: g3032.id,
        nome: g3032.nome,
        tatuagem: g3032.tatuagem,
        sexo: g3032.sexo,
        raca: g3032.raca,
        situacao: g3032.situacao,
        fornecedor: g3032.fornecedor,
        data_compra: g3032.data_compra,
        data_chegada: g3032.data_chegada
      });
    } else {
      console.log('‚ù≈í G 3032 N√∆íO ENCONTRADA!');
    }
    
    // Listar todos os animais
    console.log('\n\n≈∏‚Äúù LISTA COMPLETA DOS ANIMAIS:\n');
    result.rows.forEach((a, idx) => {
      console.log(`${idx + 1}. ${a.serie} ${a.rg} (${a.nome}) - ${a.sexo} - ${a.raca} - ${a.situacao}`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('\n‚≈ì‚Ä¶ Verifica√ß√£o conclu√≠da!');
    
    if (result.rows.length === 46) {
      console.log('\n≈∏≈Ω‚Ä∞ TUDO CERTO! Os 46 animais do Marcelo est√£o no PostgreSQL!');
      console.log('≈∏‚Äô° Atualize a tela de Animais (F5) e filtre por "MARCELO" para ver todos.');
    }
    
  } catch (error) {
    console.error('‚ù≈í Erro:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

verificar46AnimaisMarcelo();
