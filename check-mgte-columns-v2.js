require('dotenv').config();
const { query } = require('./lib/database');

// Fallback manual se não carregar do .env
if (!process.env.DB_PASSWORD) {
  process.env.DB_PASSWORD = 'jcromero85';
}

async function checkColumns() {
  try {
    console.log('Verificando colunas na tabela animais...');
    const res = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'animais' 
      AND column_name ~* 'mgte|top'
    `);
    
    if (res.rows.length === 0) {
      console.log('Nenhuma coluna MGTe ou TOP encontrada.');
    } else {
      console.log('Colunas encontradas:');
      res.rows.forEach(row => {
        console.log(`- ${row.column_name} (${row.data_type})`);
      });
    }

    // Verificar se há dados nessas colunas
    if (res.rows.length > 0) {
      const colNames = res.rows.map(r => r.column_name).join(', ');
      console.log(`\nVerificando dados em: ${colNames}`);
      
      const dataRes = await query(`
        SELECT count(*) as total,
               count(${res.rows[0].column_name}) as not_null_count
        FROM animais
      `);
      console.log('Total de animais:', dataRes.rows[0].total);
      console.log(`Animais com ${res.rows[0].column_name}:`, dataRes.rows[0].not_null_count);

      // Amostra de dados
      const sampleRes = await query(`
        SELECT id, nome, ${colNames}
        FROM animais
        WHERE ${res.rows[0].column_name} IS NOT NULL
        LIMIT 5
      `);
      console.log('\nAmostra de dados:');
      console.table(sampleRes.rows);
    }

  } catch (err) {
    console.error('Erro:', err);
  } finally {
    // Encerrar o pool para o script terminar
    // O pool é exportado mas não tem método end exposto diretamente no objeto retornado por require('./lib/database') se for o pool do pg.
    // Verificando lib/database.js: "const pool = new Pool(dbConfig)" e "module.exports = { query, ..., pool }" (assumindo exportação).
    // Se não tiver exportado o pool, o script pode ficar pendurado, mas o console.log vai sair antes.
    process.exit(0);
  }
}

checkColumns();
