const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testarValorTotalNF() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando valores totais das notas fiscais...\n');
    
    // Buscar últimas 10 NFs
    const result = await client.query(`
      SELECT 
        nf.id,
        nf.numero_nf,
        nf.tipo,
        nf.valor_total,
        nf.data,
        COUNT(nfi.id) as total_itens,
        COALESCE(SUM(
          CASE 
            WHEN nfi.tipo_produto = 'bovino' AND (nfi.dados_item::jsonb->>'modoCadastro') = 'categoria' THEN
              (CAST(nfi.dados_item::jsonb->>'quantidade' AS INTEGER) * CAST(REPLACE(REPLACE(nfi.dados_item::jsonb->>'valorUnitario', '.', ''), ',', '.') AS NUMERIC))
            WHEN nfi.tipo_produto = 'semen' THEN
              (CAST(nfi.dados_item::jsonb->>'quantidadeDoses' AS INTEGER) * CAST(REPLACE(REPLACE(nfi.dados_item::jsonb->>'valorUnitario', '.', ''), ',', '.') AS NUMERIC))
            WHEN nfi.tipo_produto = 'embriao' THEN
              (CAST(nfi.dados_item::jsonb->>'quantidadeEmbrioes' AS INTEGER) * CAST(REPLACE(REPLACE(nfi.dados_item::jsonb->>'valorUnitario', '.', ''), ',', '.') AS NUMERIC))
            ELSE
              CAST(REPLACE(REPLACE(nfi.dados_item::jsonb->>'valorUnitario', '.', ''), ',', '.') AS NUMERIC)
          END
        ), 0) as valor_calculado_itens
      FROM notas_fiscais nf
      LEFT JOIN notas_fiscais_itens nfi ON nfi.nota_fiscal_id = nf.id
      GROUP BY nf.id, nf.numero_nf, nf.tipo, nf.valor_total, nf.data
      ORDER BY nf.data DESC, nf.id DESC
      LIMIT 10
    `);
    
    console.log(`📊 Últimas ${result.rows.length} Notas Fiscais:\n`);
    
    result.rows.forEach(nf => {
      const valorNF = parseFloat(nf.valor_total) || 0;
      const valorCalculado = parseFloat(nf.valor_calculado_itens) || 0;
      const diferenca = Math.abs(valorNF - valorCalculado);
      const status = diferenca < 0.01 ? '✅' : '⚠️';
      
      console.log(`${status} NF ${nf.numero_nf} (${nf.tipo})`);
      console.log(`   Data: ${nf.data}`);
      console.log(`   Valor NF: R$ ${valorNF.toFixed(2)}`);
      console.log(`   Valor Calculado (itens): R$ ${valorCalculado.toFixed(2)}`);
      console.log(`   Total de Itens: ${nf.total_itens}`);
      if (diferenca >= 0.01) {
        console.log(`   ⚠️ Diferença: R$ ${diferenca.toFixed(2)}`);
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

testarValorTotalNF();
