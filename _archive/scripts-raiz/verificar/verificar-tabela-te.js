const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

async function verificarTabelaTE() {
  const client = await pool.connect();
  
  try {
    console.log('\n=== VERIFICANDO TABELAS DE TE NO POSTGRES ===\n');
    
    // Listar todas as tabelas
    const tabelas = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND (table_name LIKE '%transfer%' OR table_name LIKE '%embriao%' OR table_name LIKE '%embrion%')
      ORDER BY table_name
    `);
    
    console.log('Tabelas relacionadas a TE/Embriões:');
    if (tabelas.rows.length > 0) {
      tabelas.rows.forEach(row => {
        console.log(`- ${row.table_name}`);
      });
    } else {
      console.log('❌ Nenhuma tabela encontrada');
    }
    
    // Verificar estrutura da tabela transferencias_embrioes
    console.log('\n=== ESTRUTURA DA TABELA transferencias_embrioes ===\n');
    
    const colunas = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'transferencias_embrioes'
      ORDER BY ordinal_position
    `);
    
    if (colunas.rows.length > 0) {
      console.log('Colunas:');
      colunas.rows.forEach(col => {
        console.log(`- ${col.column_name} (${col.data_type})`);
      });
      
      // Buscar TEs das 7 receptoras
      console.log('\n=== BUSCANDO TEs DAS 7 RECEPTORAS ===\n');
      
      const receptoras = ['8535', '8251', '9775', '8326', '8962', '9305', '9487'];
      
      for (const rg of receptoras) {
        const result = await client.query(`
          SELECT * FROM transferencias_embrioes 
          WHERE receptora_nome LIKE '%${rg}%'
          ORDER BY data_te DESC
          LIMIT 1
        `);
        
        if (result.rows.length > 0) {
          const te = result.rows[0];
          console.log(`\nM ${rg}:`);
          console.log(`  ID: ${te.id}`);
          console.log(`  Receptora: ${te.receptora_nome}`);
          console.log(`  Data TE: ${te.data_te ? new Date(te.data_te).toLocaleDateString('pt-BR') : 'N/A'}`);
          console.log(`  Doadora: ${te.doadora_nome || 'N/A'}`);
          console.log(`  Touro: ${te.touro || 'N/A'}`);
          console.log(`  Status: ${te.status || 'N/A'}`);
        } else {
          console.log(`\n❌ M ${rg}: Nenhuma TE encontrada`);
        }
      }
      
      // Buscar todas as TEs com data 27/11/2025
      console.log('\n\n=== TEs COM DATA 27/11/2025 ===\n');
      
      const tes2711 = await client.query(`
        SELECT receptora_nome, data_te, doadora_nome, touro, status
        FROM transferencias_embrioes 
        WHERE data_te = '2025-11-27'
        ORDER BY receptora_nome
      `);
      
      console.log(`Total: ${tes2711.rows.length} TEs\n`);
      
      tes2711.rows.forEach(te => {
        console.log(`${te.receptora_nome} | TE: ${new Date(te.data_te).toLocaleDateString('pt-BR')} | Status: ${te.status || 'N/A'}`);
      });
      
    } else {
      console.log('❌ Tabela transferencias_embrioes não existe ou está vazia');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

verificarTabelaTE();
