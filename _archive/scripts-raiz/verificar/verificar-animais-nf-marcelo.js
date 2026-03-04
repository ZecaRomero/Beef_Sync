const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

async function verificarAnimaisNF() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 VERIFICANDO ANIMAIS DAS NFs DO MARCELO\n');
    console.log('='.repeat(80));
    
    const nfs = ['229', '230', '231'];
    
    for (const nf of nfs) {
      console.log(`\n📋 NF ${nf}:`);
      
      // Verificar se há campo numero_nf ou outro campo de vínculo
      const result = await client.query(`
        SELECT id, rg, nome, sexo, situacao, fornecedor, data_chegada
        FROM animais
        WHERE rg LIKE '%${nf}%' OR nome LIKE '%${nf}%'
        LIMIT 5
      `);
      
      console.log(`   Animais com "${nf}" no RG ou nome: ${result.rows.length}`);
      
      if (result.rows.length > 0) {
        result.rows.forEach((a, idx) => {
          console.log(`   ${idx + 1}. RG: ${a.rg} | Nome: ${a.nome || 'S/N'} | Fornecedor: ${a.fornecedor || 'N/A'}`);
        });
      }
    }
    
    // Verificar se há itens_nota_fiscal
    console.log('\n\n📦 ITENS DAS NOTAS FISCAIS:');
    for (const nf of nfs) {
      const nfResult = await client.query(`
        SELECT id FROM notas_fiscais WHERE numero_nf = $1
      `, [nf]);
      
      if (nfResult.rows.length > 0) {
        const nfId = nfResult.rows[0].id;
        
        const itensResult = await client.query(`
          SELECT * FROM itens_nota_fiscal WHERE nota_fiscal_id = $1
        `, [nfId]);
        
        console.log(`\n   NF ${nf} (ID: ${nfId}):`);
        console.log(`   Itens cadastrados: ${itensResult.rows.length}`);
        
        if (itensResult.rows.length > 0) {
          itensResult.rows.forEach((item, idx) => {
            console.log(`   ${idx + 1}. Tipo: ${item.tipo_produto} | Qtd: ${item.quantidade}`);
          });
        }
      }
    }
    
    // Buscar todos os animais com data_chegada próxima às datas das NFs
    console.log('\n\n📅 ANIMAIS POR DATA DE CHEGADA (Jan 2026):');
    const animaisJanResult = await client.query(`
      SELECT id, rg, nome, sexo, fornecedor, data_chegada
      FROM animais
      WHERE data_chegada >= '2026-01-01' AND data_chegada <= '2026-01-31'
      ORDER BY data_chegada, rg
    `);
    
    console.log(`\nTotal: ${animaisJanResult.rows.length} animais\n`);
    
    if (animaisJanResult.rows.length > 0) {
      // Agrupar por data
      const porData = {};
      animaisJanResult.rows.forEach(a => {
        const data = a.data_chegada ? a.data_chegada.toISOString().split('T')[0] : 'SEM_DATA';
        if (!porData[data]) {
          porData[data] = [];
        }
        porData[data].push(a);
      });
      
      console.log('📊 Distribuição por data:');
      Object.entries(porData).forEach(([data, animais]) => {
        console.log(`\n   ${data}: ${animais.length} animais`);
        console.log(`   Fornecedores: ${[...new Set(animais.map(a => a.fornecedor || 'N/A'))].join(', ')}`);
        
        // Mostrar primeiros 5
        animais.slice(0, 5).forEach((a, idx) => {
          console.log(`      ${idx + 1}. RG: ${a.rg} | ${a.nome || 'S/N'} | Fornecedor: ${a.fornecedor || 'N/A'}`);
        });
        
        if (animais.length > 5) {
          console.log(`      ... e mais ${animais.length - 5} animais`);
        }
      });
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

verificarAnimaisNF();
