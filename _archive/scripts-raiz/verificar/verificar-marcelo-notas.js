const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

async function verificarMarceloNotas() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 INVESTIGANDO NOTAS DO MARCELO\n');
    console.log('='.repeat(80));
    
    // 1. Buscar todas as notas fiscais do Marcelo
    console.log('\n📋 1. NOTAS FISCAIS DO MARCELO:');
    const notasResult = await client.query(`
      SELECT 
        id,
        numero_nf,
        data_compra,
        origem,
        tipo,
        cnpj_origem_destino,
        valor_total
      FROM notas_fiscais
      WHERE LOWER(origem) LIKE '%marcelo%'
      ORDER BY data_compra DESC
    `);
    
    console.log(`\nTotal de notas encontradas: ${notasResult.rows.length}\n`);
    
    notasResult.rows.forEach((nf, idx) => {
      console.log(`${idx + 1}. NF: ${nf.numero_nf}`);
      console.log(`   Origem: ${nf.origem}`);
      console.log(`   Data: ${nf.data_compra}`);
      console.log(`   Tipo: ${nf.tipo}`);
      console.log(`   CNPJ: ${nf.cnpj_origem_destino || 'N/A'}`);
      console.log(`   Valor: R$ ${nf.valor_total || '0,00'}`);
      console.log(`   ID: ${nf.id}`);
      console.log('');
    });
    
    // 2. Buscar itens de cada nota
    console.log('\n📦 2. ITENS DAS NOTAS FISCAIS:');
    for (const nf of notasResult.rows) {
      const itensResult = await client.query(`
        SELECT 
          id,
          tipo_produto,
          quantidade,
          valor_unitario,
          valor_total,
          observacoes
        FROM itens_nota_fiscal
        WHERE nota_fiscal_id = $1
      `, [nf.id]);
      
      console.log(`\n   NF ${nf.numero_nf}:`);
      if (itensResult.rows.length === 0) {
        console.log(`   ❌ Nenhum item cadastrado`);
      } else {
        console.log(`   ✅ ${itensResult.rows.length} itens cadastrados:`);
        itensResult.rows.forEach((item, idx) => {
          console.log(`      ${idx + 1}. Tipo: ${item.tipo_produto} | Qtd: ${item.quantidade} | Valor Unit: R$ ${item.valor_unitario} | Total: R$ ${item.valor_total}`);
          if (item.observacoes) {
            console.log(`         Obs: ${item.observacoes}`);
          }
        });
      }
    }
    
    // 3. Buscar animais vinculados às notas
    console.log('\n\n🐮 3. ANIMAIS VINCULADOS ÀS NOTAS:');
    for (const nf of notasResult.rows) {
      const animaisResult = await client.query(`
        SELECT 
          id,
          rg,
          nome,
          sexo,
          categoria,
          situacao,
          inativo,
          data_chegada
        FROM animais
        WHERE numero_nf = $1
        ORDER BY rg
      `, [nf.numero_nf]);
      
      console.log(`\n   NF ${nf.numero_nf}:`);
      if (animaisResult.rows.length === 0) {
        console.log(`   ❌ Nenhum animal vinculado`);
      } else {
        console.log(`   ✅ ${animaisResult.rows.length} animais vinculados:`);
        
        // Contar por situação
        const porSituacao = {};
        const porCategoria = {};
        let ativos = 0;
        let inativos = 0;
        
        animaisResult.rows.forEach(animal => {
          porSituacao[animal.situacao] = (porSituacao[animal.situacao] || 0) + 1;
          porCategoria[animal.categoria] = (porCategoria[animal.categoria] || 0) + 1;
          if (animal.inativo) {
            inativos++;
          } else {
            ativos++;
          }
        });
        
        console.log(`\n      📊 Resumo:`);
        console.log(`         Total: ${animaisResult.rows.length} animais`);
        console.log(`         Ativos: ${ativos} | Inativos: ${inativos}`);
        console.log(`\n         Por Situação:`);
        Object.entries(porSituacao).forEach(([sit, qtd]) => {
          console.log(`         - ${sit}: ${qtd}`);
        });
        console.log(`\n         Por Categoria:`);
        Object.entries(porCategoria).forEach(([cat, qtd]) => {
          console.log(`         - ${cat}: ${qtd}`);
        });
        
        // Mostrar alguns exemplos
        console.log(`\n      📝 Primeiros 5 animais:`);
        animaisResult.rows.slice(0, 5).forEach((animal, idx) => {
          console.log(`         ${idx + 1}. RG: ${animal.rg} | Nome: ${animal.nome || 'S/N'} | ${animal.sexo} | ${animal.categoria} | ${animal.situacao} | ${animal.inativo ? '🔴 INATIVO' : '🟢 ATIVO'}`);
        });
      }
    }
    
    // 4. Buscar todos os animais do Marcelo (independente de NF)
    console.log('\n\n🔍 4. BUSCA GERAL DE ANIMAIS DO MARCELO:');
    const todosAnimaisResult = await client.query(`
      SELECT 
        a.id,
        a.rg,
        a.nome,
        a.numero_nf,
        a.categoria,
        a.situacao,
        a.inativo,
        nf.origem as fornecedor
      FROM animais a
      LEFT JOIN notas_fiscais nf ON a.numero_nf = nf.numero_nf
      WHERE LOWER(nf.origem) LIKE '%marcelo%' OR a.numero_nf IN (
        SELECT numero_nf FROM notas_fiscais WHERE LOWER(origem) LIKE '%marcelo%'
      )
      ORDER BY a.numero_nf, a.rg
    `);
    
    console.log(`\nTotal de animais encontrados: ${todosAnimaisResult.rows.length}`);
    
    // Agrupar por NF
    const porNF = {};
    todosAnimaisResult.rows.forEach(animal => {
      const nf = animal.numero_nf || 'SEM_NF';
      if (!porNF[nf]) {
        porNF[nf] = [];
      }
      porNF[nf].push(animal);
    });
    
    console.log(`\n📊 Distribuição por NF:`);
    Object.entries(porNF).forEach(([nf, animais]) => {
      const ativos = animais.filter(a => !a.inativo).length;
      const inativos = animais.filter(a => a.inativo).length;
      console.log(`   NF ${nf}: ${animais.length} animais (${ativos} ativos, ${inativos} inativos)`);
    });
    
    // 5. Verificar se há animais sem NF mas com fornecedor Marcelo
    console.log('\n\n🔍 5. ANIMAIS SEM NF MAS COM FORNECEDOR MARCELO:');
    const semNFResult = await client.query(`
      SELECT 
        id,
        rg,
        nome,
        fornecedor,
        categoria,
        situacao,
        inativo
      FROM animais
      WHERE LOWER(fornecedor) LIKE '%marcelo%' AND (numero_nf IS NULL OR numero_nf = '')
    `);
    
    if (semNFResult.rows.length > 0) {
      console.log(`\n⚠️ Encontrados ${semNFResult.rows.length} animais sem NF:`);
      semNFResult.rows.slice(0, 10).forEach((animal, idx) => {
        console.log(`   ${idx + 1}. RG: ${animal.rg} | Fornecedor: ${animal.fornecedor} | ${animal.categoria} | ${animal.inativo ? '🔴 INATIVO' : '🟢 ATIVO'}`);
      });
    } else {
      console.log(`\n✅ Todos os animais do Marcelo têm NF vinculada`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Análise concluída!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

verificarMarceloNotas();
