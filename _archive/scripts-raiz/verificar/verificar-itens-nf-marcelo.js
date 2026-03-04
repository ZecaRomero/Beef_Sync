const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

async function verificarItensNFMarcelo() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 VERIFICANDO ITENS DAS NFs DO MARCELO\n');
    console.log('='.repeat(80));
    
    // 1. Buscar as NFs do Marcelo
    const nfsResult = await client.query(`
      SELECT id, numero_nf, fornecedor, data_compra, eh_receptoras
      FROM notas_fiscais
      WHERE LOWER(fornecedor) LIKE '%marcelo%'
      ORDER BY numero_nf
    `);
    
    console.log(`📋 NFs do Marcelo: ${nfsResult.rows.length}\n`);
    
    let totalItens = 0;
    
    for (const nf of nfsResult.rows) {
      console.log(`\n📦 NF ${nf.numero_nf} (ID: ${nf.id}):`);
      console.log(`   Fornecedor: ${nf.fornecedor}`);
      console.log(`   Data: ${nf.data_compra}`);
      console.log(`   É Receptoras: ${nf.eh_receptoras ? 'SIM' : 'NÃO'}`);
      
      // Buscar itens da NF
      const itensResult = await client.query(`
        SELECT 
          id,
          tipo_produto,
          quantidade,
          valor_unitario,
          valor_total,
          dados_item
        FROM notas_fiscais_itens
        WHERE nota_fiscal_id = $1
      `, [nf.id]);
      
      console.log(`   Itens cadastrados: ${itensResult.rows.length}`);
      totalItens += itensResult.rows.length;
      
      if (itensResult.rows.length > 0) {
        itensResult.rows.forEach((item, idx) => {
          console.log(`\n   ${idx + 1}. Tipo: ${item.tipo_produto || 'N/A'}`);
          console.log(`      Quantidade: ${item.quantidade || 0}`);
          console.log(`      Valor Unit: R$ ${item.valor_unitario || '0,00'}`);
          console.log(`      Valor Total: R$ ${item.valor_total || '0,00'}`);
          
          // Parse dados_item se existir
          if (item.dados_item) {
            try {
              const dados = typeof item.dados_item === 'string' 
                ? JSON.parse(item.dados_item) 
                : item.dados_item;
              
              console.log(`      Dados do Item:`);
              if (dados.tatuagem) console.log(`         Tatuagem: ${dados.tatuagem}`);
              if (dados.sexo) console.log(`         Sexo: ${dados.sexo}`);
              if (dados.raca) console.log(`         Raça: ${dados.raca}`);
              if (dados.peso) console.log(`         Peso: ${dados.peso}`);
            } catch (e) {
              console.log(`      ⚠️ Erro ao parsear dados_item: ${e.message}`);
            }
          }
        });
      } else {
        console.log(`   ❌ Nenhum item cadastrado nesta NF`);
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log(`\n📊 RESUMO:`);
    console.log(`   Total de NFs: ${nfsResult.rows.length}`);
    console.log(`   Total de Itens: ${totalItens}`);
    console.log(`   Média de itens por NF: ${nfsResult.rows.length > 0 ? (totalItens / nfsResult.rows.length).toFixed(1) : 0}`);
    
    // Verificar se há tabela notas_fiscais_itens
    console.log('\n\n🔍 VERIFICANDO ESTRUTURA DA TABELA notas_fiscais_itens:');
    const estruturaResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'notas_fiscais_itens'
      ORDER BY ordinal_position
    `);
    
    if (estruturaResult.rows.length > 0) {
      console.log('\n✅ Tabela existe com as seguintes colunas:');
      estruturaResult.rows.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    } else {
      console.log('\n❌ Tabela notas_fiscais_itens NÃO existe!');
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

verificarItensNFMarcelo();
