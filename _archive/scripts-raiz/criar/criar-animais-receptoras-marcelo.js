const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

async function criarAnimaisReceptorasMarcelo() {
  const client = await pool.connect();
  
  try {
    console.log('�Ÿ�� CRIANDO ANIMAIS DAS RECEPTORAS DO MARCELO\n');
    console.log('='.repeat(80));
    
    // Buscar todas as receptoras do Marcelo das 3 NFs
    const itensResult = await client.query(`
      SELECT 
        nf.id as nf_id,
        nf.numero_nf,
        nf.fornecedor,
        nf.data_compra,
        nf.data_chegada_animais,
        nf.data_te,
        i.id as item_id,
        i.dados_item
      FROM notas_fiscais nf
      INNER JOIN notas_fiscais_itens i ON i.nota_fiscal_id = nf.id
      WHERE nf.numero_nf IN ('229', '230', '231')
        AND LOWER(nf.fornecedor) LIKE '%marcelo%'
        AND i.tipo_produto = 'bovino'
      ORDER BY nf.numero_nf, i.id
    `);
    
    console.log(`�Ÿ“‹ Total de itens encontrados: ${itensResult.rows.length}\n`);
    
    let criados = 0;
    let jaExistentes = 0;
    let erros = 0;
    
    for (const row of itensResult.rows) {
      try {
        // Parse dados_item
        const dados = typeof row.dados_item === 'string' 
          ? JSON.parse(row.dados_item) 
          : row.dados_item;
        
        const tatuagem = dados.tatuagem || '';
        
        if (!tatuagem) {
          console.log(`�š�️ Item sem tatuagem na NF ${row.numero_nf}`);
          continue;
        }
        
        // Extrair letra e número
        const matchLetra = tatuagem.match(/^([A-Za-z]+)/);
        const matchNumero = tatuagem.match(/(\d+)/);
        
        const letra = matchLetra ? matchLetra[1].toUpperCase() : 'G';
        const numero = matchNumero ? matchNumero[1] : '';
        
        if (!numero) {
          console.log(`�š�️ Não foi possível extrair número de: ${tatuagem}`);
          continue;
        }
        
        // Verificar se animal já existe
        const existeResult = await client.query(`
          SELECT id FROM animais WHERE serie = $1 AND rg = $2
        `, [letra, numero]);
        
        if (existeResult.rows.length > 0) {
          jaExistentes++;
          console.log(`⏭️  ${letra} ${numero} - já existe`);
          continue;
        }
        
        // Criar animal
        const nome = `${letra} ${numero}`;
        const dataChegada = row.data_chegada_animais || row.data_compra;
        
        // Calcular data DG prevista (15 dias após chegada)
        let dataDGPrevista = null;
        if (dataChegada) {
          const dataChegadaDate = new Date(dataChegada);
          dataChegadaDate.setDate(dataChegadaDate.getDate() + 15);
          dataDGPrevista = dataChegadaDate.toISOString().split('T')[0];
        }
        
        await client.query(`
          INSERT INTO animais (
            serie,
            rg,
            nome,
            tatuagem,
            sexo,
            raca,
            situacao,
            data_compra,
            fornecedor,
            data_chegada,
            data_dg_prevista,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        `, [
          letra,
          numero,
          nome,
          tatuagem,
          'Fêmea',
          dados.raca || 'Mestiça',
          'Ativo',
          row.data_compra,
          row.fornecedor,
          dataChegada,
          dataDGPrevista
        ]);
        
        criados++;
        console.log(`�œ… ${criados}. ${nome} criado (NF ${row.numero_nf})`);
        
      } catch (error) {
        erros++;
        console.error(`�Œ Erro ao processar item:`, error.message);
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n�Ÿ“Š RESUMO:');
    console.log(`   Total de itens: ${itensResult.rows.length}`);
    console.log(`   Animais criados: ${criados}`);
    console.log(`   Já existentes: ${jaExistentes}`);
    console.log(`   Erros: ${erros}`);
    
    // Verificar total de animais do Marcelo
    const totalResult = await client.query(`
      SELECT COUNT(*) as total
      FROM animais
      WHERE LOWER(fornecedor) LIKE '%marcelo%'
    `);
    
    console.log(`\n�œ… Total de animais do Marcelo no banco: ${totalResult.rows[0].total}`);
    
    console.log('\n' + '='.repeat(80));
    console.log('\n�Ÿ’� PR�“XIMOS PASSOS:');
    console.log('   1. Atualize a tela de Animais (F5)');
    console.log('   2. Use o filtro de fornecedor: "MARCELO"');
    console.log('   3. Deve aparecer 46 animais');
    console.log('   4. Todos com série G e números variados');
    
  } catch (error) {
    console.error('�Œ Erro:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

criarAnimaisReceptorasMarcelo();
