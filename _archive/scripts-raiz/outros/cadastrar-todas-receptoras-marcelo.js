const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

// NF 229 - 18 cabeças
const receptorasNF229 = [
  'G 355', 'G 338', 'G 354', 'G 342', 'G 353', 'G 368', 'G 334', 'G 366',
  'G 339', 'G 363', 'G 11', 'G 3029', 'G 3022', 'G 3007', 'G 2966', 'G 2899',
  'G 17', 'G 3008'
];

// NF 230 - 17 cabeças (já cadastradas, mas vou verificar)
const receptorasNF230 = [
  'G 2996', 'G 2831', 'G 2978', 'G 2925', 'G 2979', 'G 3016', 'G 2974',
  'G 2973', 'G 2908', 'G 2924', 'G 3036', 'G 3003', 'G 3028', 'G 3032',
  'G 2977', 'G 2965', 'G 2881' // Adicionei G 2881 que estava na lista anterior
];

// NF 231 - 11 cabeças
const receptorasNF231 = [
  'G 3040', 'G 3012', 'G 2879', 'G 3027', 'G 2909', 'G 3045', 'G 2915',
  'G 2999', 'G 2920', 'G 2934', 'G 2947'
];

async function cadastrarReceptoras(nfNumero, receptoras, client) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📦 PROCESSANDO NF ${nfNumero}`);
  console.log('='.repeat(80));
  
  // 1. Buscar NF
  const nfResult = await client.query(`
    SELECT id, numero_nf, fornecedor, eh_receptoras
    FROM notas_fiscais
    WHERE numero_nf = $1
  `, [nfNumero]);
  
  if (nfResult.rows.length === 0) {
    console.log(`❌ NF ${nfNumero} não encontrada!`);
    return { sucesso: 0, erros: 0, jaExistentes: 0 };
  }
  
  const nf = nfResult.rows[0];
  console.log(`✅ NF ${nfNumero} encontrada (ID: ${nf.id})`);
  console.log(`   Fornecedor: ${nf.fornecedor}`);
  console.log(`   É Receptoras: ${nf.eh_receptoras ? 'SIM' : 'NÃO'}`);
  
  // 2. Marcar como receptoras se necessário
  if (!nf.eh_receptoras) {
    console.log(`\n⚠️ Marcando NF ${nfNumero} como receptoras...`);
    await client.query(`
      UPDATE notas_fiscais
      SET eh_receptoras = true
      WHERE id = $1
    `, [nf.id]);
    console.log(`✅ NF ${nfNumero} marcada como receptoras`);
  }
  
  // 3. Verificar itens existentes
  const itensExistentesResult = await client.query(`
    SELECT dados_item
    FROM notas_fiscais_itens
    WHERE nota_fiscal_id = $1
  `, [nf.id]);
  
  const tatuagensExistentes = new Set();
  itensExistentesResult.rows.forEach(row => {
    try {
      const dados = typeof row.dados_item === 'string' 
        ? JSON.parse(row.dados_item) 
        : row.dados_item;
      if (dados.tatuagem) {
        tatuagensExistentes.add(dados.tatuagem);
      }
    } catch (e) {
      // Ignorar erros de parse
    }
  });
  
  console.log(`\n📦 Itens já cadastrados: ${tatuagensExistentes.size}`);
  if (tatuagensExistentes.size > 0) {
    console.log(`   Tatuagens: ${Array.from(tatuagensExistentes).slice(0, 5).join(', ')}${tatuagensExistentes.size > 5 ? '...' : ''}`);
  }
  
  // 4. Cadastrar receptoras
  console.log(`\n📝 Cadastrando ${receptoras.length} receptoras...\n`);
  
  let cadastrados = 0;
  let erros = 0;
  let jaExistentes = 0;
  
  for (const tatuagem of receptoras) {
    try {
      // Verificar se já existe
      if (tatuagensExistentes.has(tatuagem)) {
        jaExistentes++;
        console.log(`⏭️  ${tatuagem} - já cadastrada`);
        continue;
      }
      
      const dadosItem = {
        tatuagem: tatuagem,
        sexo: 'femea',
        raca: 'Mestiça'
      };
      
      await client.query(`
        INSERT INTO notas_fiscais_itens (
          nota_fiscal_id,
          tipo_produto,
          quantidade,
          valor_unitario,
          valor_total,
          dados_item,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        nf.id,
        'bovino',
        1,
        0,
        0,
        JSON.stringify(dadosItem)
      ]);
      
      cadastrados++;
      console.log(`✅ ${cadastrados}. ${tatuagem} cadastrada`);
      
    } catch (error) {
      erros++;
      console.error(`❌ Erro ao cadastrar ${tatuagem}:`, error.message);
    }
  }
  
  // 5. Verificar total final
  const totalFinalResult = await client.query(`
    SELECT COUNT(*) as total
    FROM notas_fiscais_itens
    WHERE nota_fiscal_id = $1
  `, [nf.id]);
  
  const totalFinal = parseInt(totalFinalResult.rows[0].total);
  
  console.log(`\n📊 RESUMO NF ${nfNumero}:`);
  console.log(`   Receptoras esperadas: ${receptoras.length}`);
  console.log(`   Já existentes: ${jaExistentes}`);
  console.log(`   Cadastradas agora: ${cadastrados}`);
  console.log(`   Erros: ${erros}`);
  console.log(`   Total final na NF: ${totalFinal}`);
  
  return { sucesso: cadastrados, erros, jaExistentes, totalFinal };
}

async function cadastrarTodasReceptorasMarcelo() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 CADASTRANDO TODAS AS RECEPTORAS DO MARCELO\n');
    console.log('='.repeat(80));
    console.log('📋 RESUMO DAS NFs:');
    console.log(`   NF 229: ${receptorasNF229.length} receptoras`);
    console.log(`   NF 230: ${receptorasNF230.length} receptoras`);
    console.log(`   NF 231: ${receptorasNF231.length} receptoras`);
    console.log(`   TOTAL: ${receptorasNF229.length + receptorasNF230.length + receptorasNF231.length} receptoras`);
    console.log('='.repeat(80));
    
    await client.query('BEGIN');
    
    // Cadastrar NF 229
    const resultado229 = await cadastrarReceptoras('229', receptorasNF229, client);
    
    // Cadastrar NF 230 (verificar se já estão todas)
    const resultado230 = await cadastrarReceptoras('230', receptorasNF230, client);
    
    // Cadastrar NF 231
    const resultado231 = await cadastrarReceptoras('231', receptorasNF231, client);
    
    await client.query('COMMIT');
    
    // Resumo final
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 RESUMO GERAL');
    console.log('='.repeat(80));
    console.log(`\nNF 229:`);
    console.log(`   Cadastradas: ${resultado229.sucesso}`);
    console.log(`   Já existentes: ${resultado229.jaExistentes}`);
    console.log(`   Total final: ${resultado229.totalFinal}`);
    
    console.log(`\nNF 230:`);
    console.log(`   Cadastradas: ${resultado230.sucesso}`);
    console.log(`   Já existentes: ${resultado230.jaExistentes}`);
    console.log(`   Total final: ${resultado230.totalFinal}`);
    
    console.log(`\nNF 231:`);
    console.log(`   Cadastradas: ${resultado231.sucesso}`);
    console.log(`   Já existentes: ${resultado231.jaExistentes}`);
    console.log(`   Total final: ${resultado231.totalFinal}`);
    
    const totalGeral = resultado229.totalFinal + resultado230.totalFinal + resultado231.totalFinal;
    console.log(`\n✅ TOTAL GERAL: ${totalGeral} receptoras cadastradas`);
    
    if (totalGeral === 46) {
      console.log('🎉 PERFEITO! Total de 46 cabeças conforme esperado!');
    } else {
      console.log(`⚠️ ATENÇÃO: Esperado 46, encontrado ${totalGeral}`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('   1. Atualize a página de Receptoras DG (F5)');
    console.log('   2. Verifique se os 3 lotes aparecem com as quantidades corretas');
    console.log('   3. Lote 1 (NF 229): 18 cabeças');
    console.log('   4. Lote 2 (NF 230): 17 cabeças');
    console.log('   5. Lote 3 (NF 231): 11 cabeças');
    console.log('   6. TOTAL: 46 cabeças');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

cadastrarTodasReceptorasMarcelo();
