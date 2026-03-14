const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

async function buscarTodosAnimaisMarcelo() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 BUSCANDO TODOS OS ANIMAIS RELACIONADOS AO MARCELO\n');
    console.log('='.repeat(80));
    
    // 1. Buscar animais com data_chegada em janeiro 2026 (período das NFs)
    console.log('\n📅 1. ANIMAIS COM DATA DE CHEGADA EM JANEIRO 2026:');
    const jan2026Result = await client.query(`
      SELECT id, rg, nome, sexo, data_chegada, fornecedor
      FROM animais
      WHERE data_chegada >= '2026-01-06' AND data_chegada <= '2026-01-07'
      ORDER BY data_chegada, rg
    `);
    
    console.log(`Total: ${jan2026Result.rows.length} animais\n`);
    
    if (jan2026Result.rows.length > 0) {
      jan2026Result.rows.forEach((a, idx) => {
        console.log(`${idx + 1}. RG: ${a.rg} | ${a.nome || 'S/N'} | Data: ${a.data_chegada} | Fornecedor: ${a.fornecedor || 'N/A'}`);
      });
    }
    
    // 2. Buscar animais com RG contendo 229, 230 ou 231
    console.log('\n\n🔢 2. ANIMAIS COM RG CONTENDO 229, 230 OU 231:');
    const rgResult = await client.query(`
      SELECT id, rg, nome, sexo, data_chegada, fornecedor
      FROM animais
      WHERE rg LIKE '%229%' OR rg LIKE '%230%' OR rg LIKE '%231%'
      ORDER BY rg
    `);
    
    console.log(`Total: ${rgResult.rows.length} animais\n`);
    
    // Agrupar por padrão
    const por229 = rgResult.rows.filter(a => a.rg.includes('229'));
    const por230 = rgResult.rows.filter(a => a.rg.includes('230'));
    const por231 = rgResult.rows.filter(a => a.rg.includes('231'));
    
    console.log(`📊 Distribuição:`);
    console.log(`   Com "229": ${por229.length} animais`);
    console.log(`   Com "230": ${por230.length} animais`);
    console.log(`   Com "231": ${por231.length} animais`);
    
    console.log(`\n📝 Todos os animais:`);
    rgResult.rows.forEach((a, idx) => {
      console.log(`${idx + 1}. RG: ${a.rg} | ${a.nome || 'S/N'} | Data: ${a.data_chegada || 'N/A'} | Fornecedor: ${a.fornecedor || 'N/A'}`);
    });
    
    // 3. Buscar animais cadastrados recentemente (últimos 30 dias)
    console.log('\n\n🆕 3. ANIMAIS CADASTRADOS RECENTEMENTE (últimos 30 dias):');
    const recentesResult = await client.query(`
      SELECT id, rg, nome, sexo, data_chegada, fornecedor, created_at
      FROM animais
      WHERE created_at >= NOW() - INTERVAL '30 days'
      ORDER BY created_at DESC
      LIMIT 50
    `);
    
    console.log(`Total: ${recentesResult.rows.length} animais\n`);
    
    if (recentesResult.rows.length > 0) {
      // Agrupar por data de cadastro
      const porDataCadastro = {};
      recentesResult.rows.forEach(a => {
        const data = a.created_at ? a.created_at.toISOString().split('T')[0] : 'SEM_DATA';
        if (!porDataCadastro[data]) {
          porDataCadastro[data] = [];
        }
        porDataCadastro[data].push(a);
      });
      
      console.log('📊 Distribuição por data de cadastro:');
      Object.entries(porDataCadastro).forEach(([data, animais]) => {
        console.log(`\n   ${data}: ${animais.length} animais`);
        
        // Mostrar primeiros 10
        animais.slice(0, 10).forEach((a, idx) => {
          console.log(`      ${idx + 1}. RG: ${a.rg} | ${a.nome || 'S/N'} | Chegada: ${a.data_chegada || 'N/A'} | Fornecedor: ${a.fornecedor || 'N/A'}`);
        });
        
        if (animais.length > 10) {
          console.log(`      ... e mais ${animais.length - 10} animais`);
        }
      });
    }
    
    // 4. Verificar se há campo de vínculo com NF
    console.log('\n\n🔗 4. VERIFICANDO CAMPOS DE VÍNCULO COM NF:');
    const colunas = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'animais' AND column_name LIKE '%nf%'
    `);
    
    console.log(`Colunas com "nf" no nome:`);
    colunas.rows.forEach(col => {
      console.log(`   - ${col.column_name}`);
    });
    
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

buscarTodosAnimaisMarcelo();
