const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

async function verificarExtracaoG3032() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 SIMULANDO EXTRAÇÃO DA API receptoras/lista-dg\n');
    console.log('='.repeat(80));
    
    // Simular a query da API
    const receptorasQuery = `
      SELECT 
        nf.id as nf_id,
        nf.numero_nf,
        nf.data_compra,
        nf.data_chegada_animais,
        nf.receptora_letra,
        nf.receptora_numero,
        nf.data_te,
        nf.fornecedor,
        CASE 
          WHEN COALESCE(nf.data_chegada_animais, nf.data_compra) IS NOT NULL THEN (COALESCE(nf.data_chegada_animais, nf.data_compra) + INTERVAL '15 days')::date
          ELSE NULL
        END as data_prevista_dg,
        CASE 
          WHEN item.dados_item IS NOT NULL THEN item.dados_item->>'tatuagem'
          ELSE NULL
        END as tatuagem_item,
        CASE 
          WHEN item.dados_item IS NOT NULL THEN item.dados_item->>'sexo'
          ELSE NULL
        END as sexo_item,
        item.dados_item as dados_item_completo,
        item.id as item_id
      FROM notas_fiscais nf
      INNER JOIN notas_fiscais_itens item ON item.nota_fiscal_id = nf.id
      WHERE nf.eh_receptoras = true
        AND nf.tipo = 'entrada'
        AND (item.tipo_produto = 'bovino' OR item.tipo_produto IS NULL)
        AND nf.numero_nf = '230'
      ORDER BY nf.numero_nf, item.id
    `;
    
    const result = await client.query(receptorasQuery);
    
    console.log(`\n📋 Total de itens retornados: ${result.rows.length}\n`);
    
    let encontrouG3032 = false;
    
    result.rows.forEach((row, idx) => {
      const tatuagem = row.tatuagem_item || 'N/A';
      
      if (tatuagem.includes('3032')) {
        encontrouG3032 = true;
        console.log(`✅ ${idx + 1}. ENCONTRADA! Tatuagem: ${tatuagem}`);
        console.log(`   NF: ${row.numero_nf}`);
        console.log(`   Fornecedor: ${row.fornecedor}`);
        console.log(`   Data Compra: ${row.data_compra}`);
        console.log(`   Data Chegada: ${row.data_chegada_animais || 'N/A'}`);
        console.log(`   Data TE: ${row.data_te || 'N/A'}`);
        console.log(`   Data Prevista DG: ${row.data_prevista_dg || 'N/A'}`);
        console.log(`   Receptora Letra: ${row.receptora_letra || 'N/A'}`);
        console.log(`   Receptora Número: ${row.receptora_numero || 'N/A'}`);
        console.log('');
        
        // Processar extração de letra e número
        const tatuagemCompleta = tatuagem;
        const matchLetra = tatuagemCompleta.match(/^([A-Za-z]+)/);
        const matchNumero = tatuagemCompleta.match(/(\d+)/);
        
        const letra = matchLetra ? matchLetra[1].toUpperCase() : '';
        const numero = matchNumero ? matchNumero[1] : '';
        
        console.log(`   📝 Extração:`);
        console.log(`      Letra extraída: ${letra}`);
        console.log(`      Número extraído: ${numero}`);
        console.log('');
      } else {
        console.log(`${idx + 1}. Tatuagem: ${tatuagem}`);
      }
    });
    
    if (!encontrouG3032) {
      console.log('\n❌ G 3032 NÃO foi retornada pela query da API!');
    } else {
      console.log('\n✅ G 3032 FOI retornada pela query da API!');
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Verificação concluída!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

verificarExtracaoG3032();
