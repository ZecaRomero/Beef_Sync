const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

async function buscarReceptorasG() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 BUSCANDO RECEPTORAS G DA NF 229\n');
    console.log('='.repeat(80));
    
    // 1. Buscar na tabela animais
    console.log('\n🐮 1. BUSCA NA TABELA ANIMAIS:');
    const animaisResult = await client.query(`
      SELECT id, serie, rg, nome, tatuagem, sexo, fornecedor, data_chegada
      FROM animais
      WHERE (serie = 'G' AND rg IN ('355', '338', '354'))
         OR tatuagem LIKE '%G%355%'
         OR tatuagem LIKE '%G%338%'
         OR tatuagem LIKE '%G%354%'
         OR tatuagem LIKE '%G 355%'
         OR tatuagem LIKE '%G 338%'
         OR tatuagem LIKE '%G 354%'
      ORDER BY rg
    `);
    
    console.log(`Total encontrado: ${animaisResult.rows.length}\n`);
    
    if (animaisResult.rows.length > 0) {
      animaisResult.rows.forEach((a, idx) => {
        console.log(`${idx + 1}. Série: ${a.serie} | RG: ${a.rg} | Tatuagem: ${a.tatuagem || 'N/A'}`);
        console.log(`   Nome: ${a.nome || 'S/N'}`);
        console.log(`   Fornecedor: ${a.fornecedor || 'N/A'}`);
        console.log(`   Data Chegada: ${a.data_chegada || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('❌ Nenhum animal encontrado com essas tatuagens');
    }
    
    // 2. Buscar todas as receptoras G (para ver o padrão)
    console.log('\n🔍 2. TODAS AS RECEPTORAS COM SÉRIE G:');
    const todasGResult = await client.query(`
      SELECT id, serie, rg, tatuagem, fornecedor
      FROM animais
      WHERE serie = 'G' OR tatuagem LIKE 'G %' OR tatuagem LIKE 'G%'
      ORDER BY rg
      LIMIT 50
    `);
    
    console.log(`Total encontrado: ${todasGResult.rows.length}\n`);
    
    if (todasGResult.rows.length > 0) {
      console.log('Primeiras 20 receptoras G:');
      todasGResult.rows.slice(0, 20).forEach((a, idx) => {
        console.log(`${idx + 1}. Série: ${a.serie} | RG: ${a.rg} | Tatuagem: ${a.tatuagem || 'N/A'} | Fornecedor: ${a.fornecedor || 'N/A'}`);
      });
      
      if (todasGResult.rows.length > 20) {
        console.log(`... e mais ${todasGResult.rows.length - 20} receptoras`);
      }
    }
    
    // 3. Buscar na tabela notas_fiscais_itens
    console.log('\n\n📦 3. BUSCA NA TABELA notas_fiscais_itens:');
    
    // Primeiro, pegar o ID da NF 229
    const nfResult = await client.query(`
      SELECT id FROM notas_fiscais WHERE numero_nf = '229'
    `);
    
    if (nfResult.rows.length > 0) {
      const nfId = nfResult.rows[0].id;
      console.log(`NF 229 ID: ${nfId}\n`);
      
      // Buscar todos os itens da NF 229
      const itensResult = await client.query(`
        SELECT id, tipo_produto, dados_item
        FROM notas_fiscais_itens
        WHERE nota_fiscal_id = $1
      `, [nfId]);
      
      console.log(`Total de itens na NF 229: ${itensResult.rows.length}\n`);
      
      if (itensResult.rows.length > 0) {
        console.log('✅ Itens encontrados:');
        itensResult.rows.forEach((item, idx) => {
          console.log(`\n${idx + 1}. Tipo: ${item.tipo_produto || 'N/A'}`);
          
          if (item.dados_item) {
            try {
              const dados = typeof item.dados_item === 'string' 
                ? JSON.parse(item.dados_item) 
                : item.dados_item;
              
              console.log(`   Tatuagem: ${dados.tatuagem || 'N/A'}`);
              console.log(`   Sexo: ${dados.sexo || 'N/A'}`);
              console.log(`   Raça: ${dados.raca || 'N/A'}`);
            } catch (e) {
              console.log(`   ⚠️ Erro ao parsear dados_item`);
            }
          }
        });
      } else {
        console.log('❌ Nenhum item cadastrado na NF 229');
      }
    } else {
      console.log('❌ NF 229 não encontrada');
    }
    
    // 4. Buscar itens com tatuagens G específicas em TODAS as NFs
    console.log('\n\n🔍 4. BUSCAR TATUAGENS G 355, G 338, G 354 EM TODAS AS NFs:');
    const todasNFsResult = await client.query(`
      SELECT 
        nf.numero_nf,
        nf.fornecedor,
        i.id as item_id,
        i.dados_item
      FROM notas_fiscais nf
      INNER JOIN notas_fiscais_itens i ON i.nota_fiscal_id = nf.id
      WHERE i.dados_item::text LIKE '%G%355%'
         OR i.dados_item::text LIKE '%G%338%'
         OR i.dados_item::text LIKE '%G%354%'
         OR i.dados_item::text LIKE '%G 355%'
         OR i.dados_item::text LIKE '%G 338%'
         OR i.dados_item::text LIKE '%G 354%'
    `);
    
    console.log(`Total encontrado: ${todasNFsResult.rows.length}\n`);
    
    if (todasNFsResult.rows.length > 0) {
      todasNFsResult.rows.forEach((row, idx) => {
        console.log(`${idx + 1}. NF: ${row.numero_nf} | Fornecedor: ${row.fornecedor || 'N/A'}`);
        
        if (row.dados_item) {
          try {
            const dados = typeof row.dados_item === 'string' 
              ? JSON.parse(row.dados_item) 
              : row.dados_item;
            
            console.log(`   Tatuagem: ${dados.tatuagem || 'N/A'}`);
          } catch (e) {
            console.log(`   ⚠️ Erro ao parsear dados_item`);
          }
        }
        console.log('');
      });
    } else {
      console.log('❌ Nenhuma tatuagem G 355, G 338 ou G 354 encontrada em nenhuma NF');
    }
    
    // 5. Buscar receptoras G com números próximos (350-360)
    console.log('\n\n🔍 5. RECEPTORAS G COM NÚMEROS ENTRE 350-360:');
    const proximasResult = await client.query(`
      SELECT 
        nf.numero_nf,
        nf.fornecedor,
        i.dados_item
      FROM notas_fiscais nf
      INNER JOIN notas_fiscais_itens i ON i.nota_fiscal_id = nf.id
      WHERE i.dados_item::text ~ 'G.*(35[0-9]|36[0-9])'
      ORDER BY nf.numero_nf
    `);
    
    console.log(`Total encontrado: ${proximasResult.rows.length}\n`);
    
    if (proximasResult.rows.length > 0) {
      proximasResult.rows.forEach((row, idx) => {
        if (row.dados_item) {
          try {
            const dados = typeof row.dados_item === 'string' 
              ? JSON.parse(row.dados_item) 
              : row.dados_item;
            
            console.log(`${idx + 1}. NF: ${row.numero_nf} | Tatuagem: ${dados.tatuagem || 'N/A'}`);
          } catch (e) {
            // Ignorar erros de parse
          }
        }
      });
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Busca concluída!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

buscarReceptorasG();
