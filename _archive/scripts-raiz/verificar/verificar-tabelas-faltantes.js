const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'beef_sync',
  user: 'postgres',
  password: 'jcromero85',
});

async function verificarTabelas() {
  console.log('≈∏‚Äùç Verificando tabelas no banco de dados...\n');

  try {
    // Listar todas as tabelas
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log(`≈∏‚Äú≈† Total de tabelas encontradas: ${result.rows.length}\n`);
    
    const tabelas = result.rows.map(r => r.table_name);
    
    // Verificar tabelas importantes
    const tabelasImportantes = [
      'dna_envios',
      'abastecimento_nitrogenio',
      'exames_andrologicos',
      'inseminacao',
      'lotes'
    ];

    console.log('≈∏‚Äùç Verificando tabelas importantes:\n');
    for (const tabela of tabelasImportantes) {
      if (tabelas.includes(tabela)) {
        // Contar registros
        const count = await pool.query(`SELECT COUNT(*) FROM ${tabela}`);
        console.log(`  ‚≈ì‚Ä¶ ${tabela}: ${count.rows[0].count} registros`);
      } else {
        console.log(`  ‚ù≈í ${tabela}: N√∆íO EXISTE`);
      }
    }

    console.log('\n≈∏‚Äú‚Äπ Todas as tabelas no banco:');
    tabelas.forEach(t => console.log(`  - ${t}`));

  } catch (error) {
    console.error('‚ù≈í Erro:', error.message);
  } finally {
    await pool.end();
  }
}

verificarTabelas();
