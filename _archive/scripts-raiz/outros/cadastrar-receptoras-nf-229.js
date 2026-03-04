const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

// 18 receptoras da NF 229 (G 355, G 338, G 354, etc.)
// Você precisa fornecer a lista completa das 18 receptoras
const receptorasNF229 = [
  { tatuagem: 'G 355', sexo: 'femea', raca: 'Mestiça' },
  { tatuagem: 'G 338', sexo: 'femea', raca: 'Mestiça' },
  { tatuagem: 'G 354', sexo: 'femea', raca: 'Mestiça' },
  // ADICIONE AS OUTRAS 15 RECEPTORAS AQUI
  // Exemplo:
  // { tatuagem: 'G 340', sexo: 'femea', raca: 'Mestiça' },
  // { tatuagem: 'G 341', sexo: 'femea', raca: 'Mestiça' },
  // ... até completar 18
];

async function cadastrarReceptorasNF229() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 CADASTRANDO RECEPTORAS NA NF 229\n');
    console.log('='.repeat(80));
    
    // 1. Verificar se NF 229 existe
    const nfResult = await client.query(`
      SELECT id, numero_nf, fornecedor, eh_receptoras
      FROM notas_fiscais
      WHERE numero_nf = '229'
    `);
    
    if (nfResult.rows.length === 0) {
      console.log('❌ NF 229 não encontrada!');
      return;
    }
    
    const nf = nfResult.rows[0];
    console.log(`✅ NF 229 encontrada (ID: ${nf.id})`);
    console.log(`   Fornecedor: ${nf.fornecedor}`);
    console.log(`   É Receptoras: ${nf.eh_receptoras ? 'SIM' : 'NÃO'}`);
    
    // 2. Se não está marcada como receptoras, marcar
    if (!nf.eh_receptoras) {
      console.log('\n⚠️ Marcando NF 229 como receptoras...');
      await client.query(`
        UPDATE notas_fiscais
        SET eh_receptoras = true
        WHERE id = $1
      `, [nf.id]);
      console.log('✅ NF 229 marcada como receptoras');
    }
    
    // 3. Verificar quantos itens já existem
    const itensExistentesResult = await client.query(`
      SELECT COUNT(*) as total
      FROM notas_fiscais_itens
      WHERE nota_fiscal_id = $1
    `, [nf.id]);
    
    const totalExistente = parseInt(itensExistentesResult.rows[0].total);
    console.log(`\n📦 Itens já cadastrados: ${totalExistente}`);
    
    // 4. Cadastrar as receptoras
    console.log(`\n📝 Cadastrando ${receptorasNF229.length} receptoras...\n`);
    
    let cadastrados = 0;
    let erros = 0;
    
    for (const receptora of receptorasNF229) {
      try {
        const dadosItem = {
          tatuagem: receptora.tatuagem,
          sexo: receptora.sexo,
          raca: receptora.raca
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
          1, // quantidade
          0, // valor_unitario
          0, // valor_total
          JSON.stringify(dadosItem)
        ]);
        
        cadastrados++;
        console.log(`✅ ${cadastrados}. ${receptora.tatuagem} cadastrada`);
        
      } catch (error) {
        erros++;
        console.error(`❌ Erro ao cadastrar ${receptora.tatuagem}:`, error.message);
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 RESUMO:');
    console.log(`   Total de receptoras: ${receptorasNF229.length}`);
    console.log(`   Cadastradas com sucesso: ${cadastrados}`);
    console.log(`   Erros: ${erros}`);
    
    // 5. Verificar total final
    const totalFinalResult = await client.query(`
      SELECT COUNT(*) as total
      FROM notas_fiscais_itens
      WHERE nota_fiscal_id = $1
    `, [nf.id]);
    
    const totalFinal = parseInt(totalFinalResult.rows[0].total);
    console.log(`\n✅ Total de itens na NF 229 agora: ${totalFinal}`);
    
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Cadastro concluído!');
    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('   1. Atualize a página de Receptoras DG');
    console.log('   2. Verifique se as 18 receptoras aparecem no lote');
    console.log('   3. Se faltarem receptoras, adicione-as ao array receptorasNF229');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

// ATENÇÃO: Este script só cadastra 3 receptoras como exemplo
// Você precisa fornecer a lista completa das 18 receptoras
console.log('⚠️  ATENÇÃO: Este script está configurado para cadastrar apenas 3 receptoras como exemplo.');
console.log('⚠️  Você precisa adicionar as outras 15 receptoras no array receptorasNF229.');
console.log('⚠️  Deseja continuar mesmo assim? (Ctrl+C para cancelar)\n');

setTimeout(() => {
  cadastrarReceptorasNF229();
}, 3000);
