const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

async function testarAPIReceptorasDG() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 TESTANDO API receptoras/lista-dg COMPLETA\n');
    console.log('='.repeat(80));
    
    // Executar a query EXATA da API
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
      ORDER BY nf.numero_nf, item.id
    `;
    
    const result = await client.query(receptorasQuery);
    
    console.log(`\n📋 Total de receptoras retornadas: ${result.rows.length}\n`);
    
    // Processar como a API faz
    const receptorasProcessadas = [];
    
    result.rows.forEach((row, index) => {
      try {
        let dadosItem = null;
        if (row.dados_item_completo) {
          if (typeof row.dados_item_completo === 'string') {
            try {
              dadosItem = JSON.parse(row.dados_item_completo);
            } catch (e) {
              console.log(`Erro ao parsear dados_item do item ${index + 1}:`, e.message);
            }
          } else {
            dadosItem = row.dados_item_completo;
          }
        }
        
        const tatuagem = row.tatuagem_item || (dadosItem?.tatuagem) || '';
        let letra = row.receptora_letra || '';
        let numero = row.receptora_numero || '';
        
        // Se tem tatuagem, tentar extrair letra e número
        if (tatuagem) {
          const matchLetra = tatuagem.match(/^([A-Za-z]+)/);
          const matchNumero = tatuagem.match(/(\d+)/);
          
          if (matchLetra) letra = matchLetra[1].toUpperCase();
          if (matchNumero) numero = matchNumero[1];
        }
        
        // Se ainda não tem número, usar da NF
        if (!numero && row.receptora_numero) {
          numero = row.receptora_numero;
        }
        if (!letra && row.receptora_letra) {
          letra = row.receptora_letra.toUpperCase();
        }
        
        if (numero) {
          receptorasProcessadas.push({
            letra: letra,
            numero: numero,
            numeroOrdenado: parseInt(numero) || 0,
            dataPrevistaDG: row.data_prevista_dg,
            dataChegadaAnimais: row.data_chegada_animais,
            dataTE: row.data_te,
            numeroNF: row.numero_nf,
            fornecedor: row.fornecedor,
            tatuagemCompleta: tatuagem || `${letra}${numero}`,
            animalId: null,
            serie: letra,
            rg: numero
          });
        } else {
          console.log(`⚠️ Item ${index + 1} sem número:`, { tatuagem, receptora_letra: row.receptora_letra, receptora_numero: row.receptora_numero });
        }
      } catch (error) {
        console.error(`Erro ao processar item ${index + 1}:`, error);
      }
    });
    
    console.log(`✅ Receptoras processadas: ${receptorasProcessadas.length}\n`);
    
    // Agrupar por NF
    const porNF = {};
    receptorasProcessadas.forEach(r => {
      const nf = r.numeroNF || 'SEM_NF';
      if (!porNF[nf]) {
        porNF[nf] = [];
      }
      porNF[nf].push(r);
    });
    
    console.log('📊 DISTRIBUIÇÃO POR NF:\n');
    Object.entries(porNF).forEach(([nf, receptoras]) => {
      console.log(`NF ${nf}: ${receptoras.length} receptoras`);
      console.log(`Fornecedor: ${receptoras[0].fornecedor || 'N/A'}`);
      console.log(`Tatuagens: ${receptoras.map(r => r.tatuagemCompleta).join(', ')}`);
      console.log('');
    });
    
    // Verificar se G 3032 está na lista final
    const g3032 = receptorasProcessadas.find(r => r.numero === '3032' && r.letra === 'G');
    
    if (g3032) {
      console.log('✅ G 3032 ENCONTRADA NA LISTA FINAL!');
      console.log('Dados:', JSON.stringify(g3032, null, 2));
    } else {
      console.log('❌ G 3032 NÃO ESTÁ NA LISTA FINAL!');
      console.log('\nReceptoras com número 3032:');
      const com3032 = receptorasProcessadas.filter(r => r.numero === '3032');
      console.log(com3032);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

testarAPIReceptorasDG();
