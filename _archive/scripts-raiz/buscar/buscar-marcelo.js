const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

async function buscarMarcelo() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 BUSCANDO MARCELO NO BANCO\n');
    console.log('='.repeat(80));
    
    // 1. Buscar em notas_fiscais
    console.log('\n📋 1. NOTAS FISCAIS:');
    const nfResult = await client.query(`
      SELECT id, numero_nf, origem, fornecedor, destino, tipo, data_compra
      FROM notas_fiscais
      WHERE LOWER(origem) LIKE '%marcelo%' 
         OR LOWER(fornecedor) LIKE '%marcelo%'
         OR LOWER(destino) LIKE '%marcelo%'
      ORDER BY data_compra DESC
    `);
    
    console.log(`Total: ${nfResult.rows.length} notas\n`);
    nfResult.rows.forEach((nf, idx) => {
      console.log(`${idx + 1}. NF: ${nf.numero_nf} | Tipo: ${nf.tipo} | Data: ${nf.data_compra}`);
      console.log(`   Origem: ${nf.origem || 'N/A'}`);
      console.log(`   Fornecedor: ${nf.fornecedor || 'N/A'}`);
      console.log(`   Destino: ${nf.destino || 'N/A'}`);
      console.log('');
    });
    
    // 2. Buscar em animais
    console.log('\n🐮 2. ANIMAIS:');
    const animaisResult = await client.query(`
      SELECT id, rg, nome, fornecedor, sexo, situacao, data_chegada
      FROM animais
      WHERE LOWER(fornecedor) LIKE '%marcelo%'
      ORDER BY rg
    `);
    
    console.log(`Total: ${animaisResult.rows.length} animais\n`);
    
    if (animaisResult.rows.length > 0) {
      // Estatísticas
      
      console.log(`📊 Resumo:`);
      console.log(`   Total: ${animaisResult.rows.length}`);
      
      // Por sexo
      const porSexo = {};
      animaisResult.rows.forEach(a => {
        porSexo[a.sexo] = (porSexo[a.sexo] || 0) + 1;
      });
      
      console.log(`\n   Por Sexo:`);
      Object.entries(porSexo).forEach(([sexo, qtd]) => {
        console.log(`   - ${sexo}: ${qtd}`);
      });
      
      // Por situação
      const porSituacao = {};
      animaisResult.rows.forEach(a => {
        porSituacao[a.situacao] = (porSituacao[a.situacao] || 0) + 1;
      });
      
      console.log(`\n   Por Situação:`);
      Object.entries(porSituacao).forEach(([sit, qtd]) => {
        console.log(`   - ${sit}: ${qtd}`);
      });
      
      // Mostrar alguns exemplos
      console.log(`\n   📝 Primeiros 10 animais:`);
      animaisResult.rows.slice(0, 10).forEach((a, idx) => {
        console.log(`   ${idx + 1}. RG: ${a.rg} | ${a.nome || 'S/N'} | ${a.sexo} | ${a.situacao}`);
      });
    }
    
    // 3. Buscar em contatos
    console.log('\n\n👤 3. CONTATOS:');
    const contatosResult = await client.query(`
      SELECT id, nome, documento, tipo, municipio, uf
      FROM contatos
      WHERE LOWER(nome) LIKE '%marcelo%'
    `);
    
    console.log(`Total: ${contatosResult.rows.length} contatos\n`);
    contatosResult.rows.forEach((c, idx) => {
      console.log(`${idx + 1}. ${c.nome}`);
      console.log(`   Documento: ${c.documento || 'N/A'}`);
      console.log(`   Tipo: ${c.tipo || 'N/A'}`);
      console.log(`   Local: ${c.municipio || 'N/A'}/${c.uf || 'N/A'}`);
      console.log('');
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

buscarMarcelo();
