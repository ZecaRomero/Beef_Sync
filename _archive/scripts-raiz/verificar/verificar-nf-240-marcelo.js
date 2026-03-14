const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

async function verificarNF240Marcelo() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 VERIFICANDO NF 240 DO MARCELO\n');
    console.log('='.repeat(80));
    
    // 1. Buscar NF 240
    console.log('\n📋 1. BUSCANDO NF 240:');
    const nfResult = await client.query(`
      SELECT id, numero_nf, fornecedor, data_compra, eh_receptoras
      FROM notas_fiscais
      WHERE numero_nf = '240'
    `);
    
    if (nfResult.rows.length === 0) {
      console.log('❌ NF 240 não encontrada!');
      console.log('\n💡 A NF 240 precisa ser cadastrada primeiro.');
      
      // Buscar todas as NFs do Marcelo
      console.log('\n📋 NFs do Marcelo cadastradas:');
      const todasNFsResult = await client.query(`
        SELECT numero_nf, data_compra, eh_receptoras
        FROM notas_fiscais
        WHERE LOWER(fornecedor) LIKE '%marcelo%'
        ORDER BY numero_nf
      `);
      
      todasNFsResult.rows.forEach(nf => {
        console.log(`   - NF ${nf.numero_nf} | Data: ${nf.data_compra} | Receptoras: ${nf.eh_receptoras ? 'SIM' : 'NÃO'}`);
      });
      
      return;
    }
    
    const nf = nfResult.rows[0];
    console.log(`✅ NF 240 encontrada (ID: ${nf.id})`);
    console.log(`   Fornecedor: ${nf.fornecedor}`);
    console.log(`   Data: ${nf.data_compra}`);
    console.log(`   É Receptoras: ${nf.eh_receptoras ? 'SIM' : 'NÃO'}`);
    
    // 2. Buscar itens da NF 240
    console.log('\n📦 2. ITENS DA NF 240:');
    const itensResult = await client.query(`
      SELECT id, tipo_produto, dados_item
      FROM notas_fiscais_itens
      WHERE nota_fiscal_id = $1
      ORDER BY id
    `, [nf.id]);
    
    console.log(`\nTotal de itens: ${itensResult.rows.length}\n`);
    
    if (itensResult.rows.length === 0) {
      console.log('❌ Nenhum item cadastrado na NF 240!');
      console.log('\n💡 Você precisa adicionar os 33 itens (receptoras) na NF 240.');
      return;
    }
    
    let encontrouG363 = false;
    const tatuagens = [];
    
    itensResult.rows.forEach((item, idx) => {
      try {
        const dados = typeof item.dados_item === 'string' 
          ? JSON.parse(item.dados_item) 
          : item.dados_item;
        
        const tatuagem = dados.tatuagem || 'N/A';
        tatuagens.push(tatuagem);
        
        if (tatuagem.includes('363')) {
          encontrouG363 = true;
          console.log(`✅ ${idx + 1}. ENCONTRADA! Tatuagem: ${tatuagem}`);
        } else {
          console.log(`${idx + 1}. Tatuagem: ${tatuagem}`);
        }
      } catch (e) {
        console.log(`${idx + 1}. ⚠️ Erro ao parsear dados_item`);
      }
    });
    
    console.log(`\n📊 Total de itens na NF 240: ${itensResult.rows.length}`);
    
    if (!encontrouG363) {
      console.log('\n❌ G 363 NÃO ENCONTRADA na NF 240!');
      console.log('\n💡 Você precisa adicionar a G 363 nos itens da NF 240.');
    } else {
      console.log('\n✅ G 363 ENCONTRADA na NF 240!');
    }
    
    // 3. Verificar se G 363 existe como animal
    console.log('\n\n🐮 3. VERIFICANDO G 363 NA TABELA ANIMAIS:');
    const animalResult = await client.query(`
      SELECT id, serie, rg, nome, fornecedor
      FROM animais
      WHERE serie = 'G' AND rg = '363'
    `);
    
    if (animalResult.rows.length > 0) {
      console.log('✅ G 363 existe como animal!');
      console.log(`   ID: ${animalResult.rows[0].id}`);
      console.log(`   Nome: ${animalResult.rows[0].nome}`);
      console.log(`   Fornecedor: ${animalResult.rows[0].fornecedor}`);
    } else {
      console.log('❌ G 363 NÃO existe como animal!');
      console.log('\n💡 Precisa criar o animal G 363.');
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

verificarNF240Marcelo();
