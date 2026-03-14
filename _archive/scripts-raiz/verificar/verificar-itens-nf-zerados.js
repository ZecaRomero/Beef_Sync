const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function verificarItensZerados() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando notas fiscais com itens zerados...\n');
    
    // Buscar NFs com total_itens = 0
    const result = await client.query(`
      SELECT 
        nf.id,
        nf.numero_nf,
        nf.tipo,
        nf.tipo_produto,
        nf.data,
        nf.fornecedor,
        nf.destino,
        COUNT(nfi.id) as total_itens_real
      FROM notas_fiscais nf
      LEFT JOIN notas_fiscais_itens nfi ON nfi.nota_fiscal_id = nf.id
      GROUP BY nf.id, nf.numero_nf, nf.tipo, nf.tipo_produto, nf.data, nf.fornecedor, nf.destino
      HAVING COUNT(nfi.id) = 0
      ORDER BY nf.data DESC
    `);
    
    if (result.rows.length === 0) {
      console.log('✅ Todas as notas fiscais têm itens cadastrados!');
    } else {
      console.log(`⚠️ Encontradas ${result.rows.length} notas fiscais SEM itens:\n`);
      
      result.rows.forEach(nf => {
        console.log(`📋 NF ${nf.numero_nf} (${nf.tipo})`);
        console.log(`   ID: ${nf.id}`);
        console.log(`   Data: ${nf.data}`);
        console.log(`   Tipo Produto: ${nf.tipo_produto}`);
        console.log(`   ${nf.tipo === 'entrada' ? 'Fornecedor' : 'Destino'}: ${nf.fornecedor || nf.destino || 'N/A'}`);
        console.log(`   Total de Itens: ${nf.total_itens_real}`);
        console.log('');
      });
      
      console.log('\n💡 Essas notas fiscais foram criadas mas não têm itens associados.');
      console.log('   Você pode:');
      console.log('   1. Editar cada NF e adicionar os itens manualmente');
      console.log('   2. Excluir as NFs vazias se não forem mais necessárias');
    }
    
    // Verificar também se há itens órfãos (sem NF)
    const orfaos = await client.query(`
      SELECT 
        nfi.id,
        nfi.nota_fiscal_id,
        nfi.tipo_produto,
        nfi.dados_item
      FROM notas_fiscais_itens nfi
      LEFT JOIN notas_fiscais nf ON nf.id = nfi.nota_fiscal_id
      WHERE nf.id IS NULL
    `);
    
    if (orfaos.rows.length > 0) {
      console.log(`\n⚠️ Encontrados ${orfaos.rows.length} itens órfãos (sem nota fiscal):`);
      orfaos.rows.forEach(item => {
        console.log(`   Item ID ${item.id} - NF ID ${item.nota_fiscal_id} (não existe)`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

verificarItensZerados();
