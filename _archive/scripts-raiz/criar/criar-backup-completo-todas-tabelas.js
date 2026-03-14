const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'beef_sync',
  user: 'postgres',
  password: 'jcromero85',
});

async function criarBackupCompleto() {
  console.log('🔄 Criando backup completo de TODAS as tabelas...\n');

  try {
    // Listar TODAS as tabelas
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    const tabelas = result.rows.map(r => r.table_name);
    console.log(`📊 Total de tabelas encontradas: ${tabelas.length}\n`);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const sqlFile = `backup_completo_TODAS_${timestamp}.sql`;
    const jsonFile = `backup_completo_TODAS_${timestamp}.json`;

    let sqlContent = `-- Backup COMPLETO do Sistema Beef-Sync\n`;
    sqlContent += `-- Gerado em: ${new Date().toISOString()}\n`;
    sqlContent += `-- Tipo: TODAS AS TABELAS\n\n`;

    const jsonData = { metadata: {}, data: {} };
    let totalRegistros = 0;

    for (const tabela of tabelas) {
      try {
        const countResult = await pool.query(`SELECT COUNT(*) FROM ${tabela}`);
        const count = parseInt(countResult.rows[0].count);

        console.log(`📝 ${tabela}: ${count} registros`);

        // SQL Backup
        sqlContent += `-- Tabela: ${tabela} (${count} registros)\n`;
        sqlContent += `DELETE FROM ${tabela};\n`;

        if (count > 0) {
          const data = await pool.query(`SELECT * FROM ${tabela}`);
          
          // JSON Backup
          jsonData.data[tabela] = data.rows;
          totalRegistros += count;

          // SQL Backup - gerar INSERTs
          for (const row of data.rows) {
            const columns = Object.keys(row);
            const values = Object.values(row).map(v => {
              if (v === null) return 'NULL';
              if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
              if (v instanceof Date) return `'${v.toISOString()}'`;
              if (typeof v === 'boolean') return v ? 'true' : 'false';
              return v;
            });

            sqlContent += `INSERT INTO ${tabela} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
          }
        }

        sqlContent += `\n`;

      } catch (err) {
        console.error(`   ❌ Erro ao processar ${tabela}:`, err.message);
      }
    }

    // Salvar arquivos
    fs.writeFileSync(sqlFile, sqlContent, 'utf8');
    console.log(`\n✅ Backup SQL salvo: ${sqlFile}`);

    jsonData.metadata = {
      tipo: 'completo_todas_tabelas',
      formato: 'json',
      dataCriacao: new Date().toISOString(),
      versao: '1.0',
      totalRegistros,
      tabelas
    };

    fs.writeFileSync(jsonFile, JSON.stringify(jsonData, null, 2), 'utf8');
    console.log(`✅ Backup JSON salvo: ${jsonFile}`);

    console.log(`\n📊 Resumo:`);
    console.log(`   - Total de tabelas: ${tabelas.length}`);
    console.log(`   - Total de registros: ${totalRegistros}`);

  } catch (error) {
    console.error('\n❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

criarBackupCompleto();
