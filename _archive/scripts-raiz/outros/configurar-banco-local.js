require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

console.log('≈∏‚Äùß Configurando banco de dados LOCAL...\n');

const poolLocal = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'beef_sync',
  user: 'postgres',
  password: 'jcromero85',
  connectionTimeoutMillis: 5000
});

async function configurarLocal() {
  try {
    console.log('≈∏‚Äú° Testando conex√£o com PostgreSQL local...');
    const client = await poolLocal.connect();
    
    console.log('‚≈ì‚Ä¶ PostgreSQL local conectado!\n');
    
    // Verificar se o banco existe
    const dbCheck = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'beef_sync'"
    );
    
    if (dbCheck.rows.length === 0) {
      console.log('≈∏‚Äú¶ Criando banco de dados beef_sync...');
      await client.query('CREATE DATABASE beef_sync');
      console.log('‚≈ì‚Ä¶ Banco criado!');
    } else {
      console.log('‚≈ì‚Ä¶ Banco beef_sync j√° existe');
    }
    
    client.release();
    await poolLocal.end();
    
    // Atualizar .env para usar banco local
    console.log('\n≈∏‚Äúù Atualizando arquivo .env...');
    
    let envContent = fs.readFileSync('.env', 'utf8');
    
    // Comentar a URL do Supabase
    envContent = envContent.replace(
      /^DATABASE_URL=/m,
      '# DATABASE_URL='
    );
    
    fs.writeFileSync('.env', envContent);
    
    console.log('‚≈ì‚Ä¶ Arquivo .env atualizado para usar banco local\n');
    console.log('≈∏≈Ω‚Ä∞ CONFIGURA√‚Ä°√∆íO CONCLU√çDA!');
    console.log('\n≈∏‚Äú‚Äπ Pr√≥ximos passos:');
    console.log('1. Execute: node scripts/restore-database.js backup');
    console.log('2. Ou execute: npm run dev');
    console.log('\n≈∏‚Äô° O sistema agora usar√° o PostgreSQL local');
    
    process.exit(0);
    
  } catch (error) {
    console.error('‚ù≈í ERRO:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n‚≈°†Ô∏è  PostgreSQL n√£o est√° rodando localmente!');
      console.log('\n≈∏‚Äùß SOLU√‚Ä°√‚Ä¢ES:');
      console.log('1. Instale o PostgreSQL: https://www.postgresql.org/download/windows/');
      console.log('2. Ou use o Docker: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=jcromero85 postgres');
      console.log('3. Ou inicie o servi√ßo PostgreSQL no Windows');
      console.log('\n≈∏‚Äô° Ap√≥s instalar, execute este script novamente');
    }
    
    await poolLocal.end();
    process.exit(1);
  }
}

configurarLocal();
