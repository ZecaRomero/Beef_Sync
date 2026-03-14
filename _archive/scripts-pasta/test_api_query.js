const { query } = require('../lib/database');

async function testApiQuery() {
  console.log('≈∏ß™ Testando query da API de insemina√ß√µes...');
  
  // Simular a query original com JOIN em estoque_semen
  let sqlQuery = `
    SELECT 
      i.*,
      a.serie as animal_serie,
      a.rg as animal_rg,
      a.nome as animal_nome,
      a.tatuagem as animal_tatuagem,
      es.nome_touro as semen_nome_touro
    FROM inseminacoes i
    LEFT JOIN animais a ON i.animal_id = a.id
    LEFT JOIN estoque_semen es ON i.semen_id = es.id
    WHERE 1=1
  `;
  sqlQuery += ` ORDER BY i.created_at DESC LIMIT 5`;

  try {
    console.log('Trying original query (with estoque_semen join)...');
    const result = await query(sqlQuery);
    console.log('‚≈ì‚Ä¶ Original query success!');
    console.table(result.rows.map(r => ({ 
      id: r.id, 
      touro_nome: r.touro_nome, 
      semen_nome_touro: r.semen_nome_touro 
    })));
  } catch (error) {
    console.error('‚ù≈í Original query failed:', error.message);
    console.error('Error code:', error.code);

    if (error.code === '42P01') {
      console.log('‚≈°†Ô∏è Tabela n√£o encontrada detected (42P01). Testing fallback query...');
      
      let simpleQuery = `
        SELECT 
          i.*,
          a.serie as animal_serie,
          a.rg as animal_rg,
          a.nome as animal_nome,
          a.tatuagem as animal_tatuagem
        FROM inseminacoes i
        LEFT JOIN animais a ON i.animal_id = a.id
        WHERE 1=1
      `;
      simpleQuery += ` ORDER BY i.data_ia DESC, i.created_at DESC LIMIT 5`;
      
      try {
        const result = await query(simpleQuery);
        console.log('‚≈ì‚Ä¶ Fallback query success!');
        
        // Simular a l√≥gica de mapeamento da API
        const isPiquete = (v) => {
            if (!v || typeof v !== 'string') return false
            return /^PIQUETE\s*\d*$/i.test(v.trim()) || /^PIQ\s*\d*$/i.test(v.trim())
        }
        
        const rows = result.rows.map(row => {
            const touroAtual = row.touro_nome || row.touro || ''
            const semenNome = row.semen_nome_touro
            let touroExibir = touroAtual
            if (isPiquete(touroAtual) && semenNome) {
              touroExibir = semenNome
            } else if (!touroAtual && semenNome) {
              touroExibir = semenNome
            }
            const { semen_nome_touro, ...rest } = row
            return { ...rest, touro_nome: touroExibir || touroAtual || null }
        })

        console.table(rows.map(r => ({ 
          id: r.id, 
          touro_nome: r.touro_nome,
          origem_db: r.touro_nome === 'N√£o informado' ? '‚ù≈í' : '‚≈ì‚Ä¶'
        })));
      } catch (fallbackError) {
        console.error('‚ù≈í Fallback query also failed:', fallbackError.message);
      }
    }
  }
}

testApiQuery();
