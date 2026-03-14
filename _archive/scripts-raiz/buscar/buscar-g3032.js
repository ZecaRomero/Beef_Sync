const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

async function buscarG3032() {
  const client = await pool.connect();
  
  try {
    console.log('≈∏‚Äùç BUSCANDO G 3032\n');
    console.log('='.repeat(80));
    
    // 1. Buscar na NF 230
    console.log('\n≈∏‚Äú‚Äπ 1. VERIFICANDO NF 230:');
    const nfResult = await client.query(`
      SELECT id, numero_nf, fornecedor
      FROM notas_fiscais
      WHERE numero_nf = '230'
    `);
    
    if (nfResult.rows.length === 0) {
      console.log('‚ù≈í NF 230 n√£o encontrada!');
      return;
    }
    
    const nf = nfResult.rows[0];
    console.log(`‚≈ì‚Ä¶ NF 230 encontrada (ID: ${nf.id})`);
    console.log(`   Fornecedor: ${nf.fornecedor}`);
    
    // 2. Buscar todos os itens da NF 230
    console.log('\n≈∏‚Äú¶ 2. TODOS OS ITENS DA NF 230:');
    const itensResult = await client.query(`
      SELECT id, tipo_produto, dados_item
      FROM notas_fiscais_itens
      WHERE nota_fiscal_id = $1
      ORDER BY id
    `, [nf.id]);
    
    console.log(`\nTotal de itens: ${itensResult.rows.length}\n`);
    
    let encontrouG3032 = false;
    
    itensResult.rows.forEach((item, idx) => {
      try {
        const dados = typeof item.dados_item === 'string' 
          ? JSON.parse(item.dados_item) 
          : item.dados_item;
        
        const tatuagem = dados.tatuagem || 'N/A';
        
        // Verificar se √© G 3032
        if (tatuagem.includes('3032')) {
          encontrouG3032 = true;
          console.log(`‚≈ì‚Ä¶ ${idx + 1}. ENCONTRADA! Tatuagem: ${tatuagem}`);
          console.log(`   ID do item: ${item.id}`);
          console.log(`   Tipo: ${item.tipo_produto}`);
          console.log(`   Dados completos:`, JSON.stringify(dados, null, 2));
        } else {
          console.log(`${idx + 1}. Tatuagem: ${tatuagem}`);
        }
      } catch (e) {
        console.log(`${idx + 1}. ‚≈°†Ô∏è Erro ao parsear dados_item`);
      }
    });
    
    if (!encontrouG3032) {
      console.log('\n‚ù≈í G 3032 N√∆íO ENCONTRADA na NF 230!');
    }
    
    // 3. Buscar G 3032 em TODAS as NFs
    console.log('\n\n≈∏‚Äùç 3. BUSCANDO G 3032 EM TODAS AS NFs:');
    const todasNFsResult = await client.query(`
      SELECT 
        nf.numero_nf,
        nf.fornecedor,
        i.id as item_id,
        i.dados_item
      FROM notas_fiscais nf
      INNER JOIN notas_fiscais_itens i ON i.nota_fiscal_id = nf.id
      WHERE i.dados_item::text LIKE '%3032%'
    `);
    
    console.log(`Total encontrado: ${todasNFsResult.rows.length}\n`);
    
    if (todasNFsResult.rows.length > 0) {
      todasNFsResult.rows.forEach((row, idx) => {
        try {
          const dados = typeof row.dados_item === 'string' 
            ? JSON.parse(row.dados_item) 
            : row.dados_item;
          
          console.log(`${idx + 1}. NF: ${row.numero_nf} | Fornecedor: ${row.fornecedor || 'N/A'}`);
          console.log(`   Tatuagem: ${dados.tatuagem || 'N/A'}`);
          console.log(`   Item ID: ${row.item_id}`);
          console.log('');
        } catch (e) {
          console.log(`${idx + 1}. ‚≈°†Ô∏è Erro ao parsear dados_item`);
        }
      });
    } else {
      console.log('‚ù≈í G 3032 n√£o encontrada em nenhuma NF!');
    }
    
    // 4. Buscar na tabela animais
    console.log('\n≈∏êÆ 4. BUSCANDO NA TABELA ANIMAIS:');
    const animaisResult = await client.query(`
      SELECT id, serie, rg, tatuagem, nome, fornecedor
      FROM animais
      WHERE rg = '3032' OR tatuagem LIKE '%3032%'
    `);
    
    console.log(`Total encontrado: ${animaisResult.rows.length}\n`);
    
    if (animaisResult.rows.length > 0) {
      animaisResult.rows.forEach((a, idx) => {
        console.log(`${idx + 1}. S√©rie: ${a.serie} | RG: ${a.rg} | Tatuagem: ${a.tatuagem || 'N/A'}`);
        console.log(`   Nome: ${a.nome || 'S/N'}`);
        console.log(`   Fornecedor: ${a.fornecedor || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('‚ù≈í G 3032 n√£o encontrada na tabela animais');
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n‚≈ì‚Ä¶ Busca conclu√≠da!');
    
  } catch (error) {
    console.error('‚ù≈í Erro:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

buscarG3032();
