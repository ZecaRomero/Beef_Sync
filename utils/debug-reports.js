
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function debugReports() {
  console.log('--- Iniciando Diagnóstico de Queries ---');

  try {
    // 1. Verificando colunas de notas_fiscais e nascimentos
    console.log('\n1. Verificando colunas...');
    
    const nfCols = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'notas_fiscais'
    `);
    const nfColumns = nfCols.rows.map(r => r.column_name);
    console.log('Colunas notas_fiscais:', nfColumns.join(', '));
    const hasDataTe = nfColumns.includes('data_te');
    console.log(`Tem coluna 'data_te'? ${hasDataTe ? '✅ SIM' : '❌ NÃO'}`);

    const nascCols = await pool.query(`
       SELECT column_name 
       FROM information_schema.columns 
       WHERE table_name = 'nascimentos'
     `);
     const nascColumns = nascCols.rows.map(r => r.column_name);
     console.log('Colunas nascimentos:', nascColumns.join(', '));

     const gestCols = await pool.query(`
       SELECT column_name 
       FROM information_schema.columns 
       WHERE table_name = 'gestacoes'
     `);
     const gestColumns = gestCols.rows.map(r => r.column_name);
     console.log('Colunas gestacoes:', gestColumns.join(', '));

     // Amostra de dados
     console.log('\n--- Amostra de Dados ---');
     const nascimentosSample = await pool.query('SELECT * FROM nascimentos LIMIT 3');
     console.log('Nascimentos:', nascimentosSample.rows);
     
     const gestacoesSample = await pool.query('SELECT * FROM gestacoes LIMIT 3');
     console.log('Gestacoes:', gestacoesSample.rows);

     const insCols = await pool.query(`
       SELECT column_name 
       FROM information_schema.columns 
       WHERE table_name = 'inseminacoes'
     `);
     const insColumns = insCols.rows.map(r => r.column_name);
     console.log('Colunas inseminacoes:', insColumns.join(', '));

     const teCols = await pool.query(`
       SELECT column_name 
       FROM information_schema.columns 
       WHERE table_name = 'transferencias_embrioes'
     `);
     const teColumns = teCols.rows.map(r => r.column_name);
     console.log('Colunas transferencias_embrioes:', teColumns.join(', '));

     // 4. Testar Query de Receptoras Faltam DG (CORRIGIDA)
    console.log('\n4. Testando query de Receptoras Faltam DG (CORRIGIDA)...');
    try {
      const dgQuery = `
        SELECT DISTINCT
          nf.numero_nf,
          nf.data_compra,
          nf.receptora_letra,
          nf.receptora_numero,
          (nf.data_compra + INTERVAL '20 days')::date as data_prevista_dg,
          CASE 
            WHEN (nf.data_compra + INTERVAL '20 days')::date < CURRENT_DATE THEN 'Atrasado'
            WHEN (nf.data_compra + INTERVAL '20 days')::date <= CURRENT_DATE + INTERVAL '7 days' THEN 'Próximo'
            ELSE 'Normal'
          END as status
        FROM notas_fiscais nf
        WHERE nf.eh_receptoras = true
          AND nf.tipo = 'entrada'
          AND nf.data_compra IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM transferencias_embrioes te
            WHERE te.receptora_nome = CONCAT(nf.receptora_letra, nf.receptora_numero)
              AND te.data_diagnostico IS NOT NULL
          )
        ORDER BY data_prevista_dg ASC
        LIMIT 5
      `;
      await pool.query(dgQuery);
      console.log('✅ Query Receptoras Faltam DG (CORRIGIDA) executada com sucesso!');
    } catch (error) {
      console.error('❌ Erro na query Receptoras Faltam DG (CORRIGIDA):', error.message);
    }
    try {
      const nfQuery = `
        SELECT 
          nf.*,
          COALESCE(
            (SELECT SUM(
              CASE 
                WHEN dados_item->>'quantidade' IS NOT NULL AND dados_item->>'quantidade' != '' AND (dados_item->>'quantidade')::int > 0 
                  THEN (dados_item->>'quantidade')::int
                WHEN dados_item->>'quantidadeAnimais' IS NOT NULL AND dados_item->>'quantidadeAnimais' != '' AND (dados_item->>'quantidadeAnimais')::int > 0
                  THEN (dados_item->>'quantidadeAnimais')::int
                WHEN dados_item->>'qtd' IS NOT NULL AND dados_item->>'qtd' != '' AND (dados_item->>'qtd')::int > 0
                  THEN (dados_item->>'qtd')::int
                ELSE 1
              END
            ) FROM notas_fiscais_itens WHERE nota_fiscal_id = nf.id),
            (SELECT COUNT(*) FROM notas_fiscais_itens WHERE nota_fiscal_id = nf.id),
            nf.quantidade_receptoras,
            0
          ) as quantidade_calculada,
          ARRAY(
            SELECT 
              COALESCE(
                dados_item->>'tatuagem', 
                dados_item->>'brinco', 
                dados_item->>'nome', 
                dados_item->>'identificacao',
                CONCAT(dados_item->>'serie', dados_item->>'rg')
              )
            FROM notas_fiscais_itens 
            WHERE nota_fiscal_id = nf.id 
            AND (
              dados_item->>'tatuagem' IS NOT NULL OR 
              dados_item->>'brinco' IS NOT NULL OR 
              dados_item->>'nome' IS NOT NULL OR
              dados_item->>'identificacao' IS NOT NULL OR
              (dados_item->>'serie' IS NOT NULL AND dados_item->>'rg' IS NOT NULL)
            )
          ) as identificacoes_itens
        FROM notas_fiscais nf
        LIMIT 5
      `;
      await pool.query(nfQuery);
      console.log('✅ Query NF executada com sucesso!');
    } catch (error) {
      console.error('❌ Erro na query NF:', error.message);
    }

    // 3. Testar Query de Receptoras Faltam Parir (QUERY CORRIGIDA PROPOSTA)
    console.log('\n3. Testando query de Receptoras Faltam Parir (CORRIGIDA)...');
    if (!hasDataTe) {
      console.warn('⚠️ Pulando teste pois coluna data_te não existe.');
    } else {
      try {
        const parirQuery = `
          SELECT DISTINCT
            nf.numero_nf,
            nf.data_compra,
            nf.receptora_letra,
            nf.receptora_numero,
            nf.data_te,
            (nf.data_te + INTERVAL '285 days')::date as previsao_parto,
            CASE 
              WHEN (nf.data_te + INTERVAL '285 days')::date < CURRENT_DATE THEN 'Atrasado'
              WHEN (nf.data_te + INTERVAL '285 days')::date <= CURRENT_DATE + INTERVAL '30 days' THEN 'Próximo'
              ELSE 'Normal'
            END as status
          FROM notas_fiscais nf
          WHERE nf.eh_receptoras = true
            AND nf.tipo = 'entrada'
            AND nf.data_te IS NOT NULL
            AND EXISTS (
              SELECT 1 FROM gestacoes g
              WHERE (
                g.receptora_nome = CONCAT(nf.receptora_letra, nf.receptora_numero) OR 
                (g.receptora_serie = nf.receptora_letra AND g.receptora_rg = nf.receptora_numero)
              )
              AND g.data_cobertura = nf.data_te
              AND NOT EXISTS (
                SELECT 1 FROM nascimentos n 
                WHERE (
                  n.receptora = g.receptora_nome OR
                  n.receptora = CONCAT(g.receptora_serie, g.receptora_rg)
                )
                AND (
                   CASE WHEN n.data != '' AND n.data IS NOT NULL 
                     THEN n.data::date > g.data_cobertura 
                     ELSE false 
                   END
                )
              )
            )
          ORDER BY previsao_parto ASC
          LIMIT 5
        `;
        await pool.query(parirQuery);
        console.log('✅ Query Receptoras Faltam Parir (CORRIGIDA) executada com sucesso!');
      } catch (error) {
        console.error('❌ Erro na query Receptoras Faltam Parir (CORRIGIDA):', error.message);
      }
    }

  } catch (error) {
    console.error('Erro geral:', error);
  } finally {
    await pool.end();
  }
}

debugReports();
