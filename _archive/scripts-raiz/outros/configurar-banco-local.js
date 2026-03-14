require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

console.log('🔧 Configurando banco de dados LOCAL...\n');

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
    console.log('📡 Testando conexão com PostgreSQL local...');
    const client = await poolLocal.connect();
    
    console.log('✅ PostgreSQL local conectado!\n');
    
    // Verificar se o banco existe
    const dbCheck = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'beef_sync'"
    );
    
    if (dbCheck.rows.length === 0) {
      console.log('📦 Criando banco de dados beef_sync...');
      await client.query('CREATE DATABASE beef_sync');
      console.log('✅ Banco criado!');
    } else {
      console.log('✅ Banco beef_sync já existe');
    }
    
    client.release();
    await poolLocal.end();
    
    // Atualizar .env para usar banco local
    console.log('\n📝 Atualizando arquivo .env...');
    
    let envContent = fs.readFileSync('.env', 'utf8');
    
    // Comentar a URL do Supabase
    envContent = envContent.replace(
      /^DATABASE_URL=/m,
      '# DATABASE_URL='
    );
    
    fs.writeFileSync('.env', envContent);
    
    console.log('✅ Arquivo .env atualizado para usar banco local\n');
    console.log('🎉 CONFIGURAÇÃO CONCLUÍDA!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Execute: node scripts/restore-database.js backup');
    console.log('2. Ou execute: npm run dev');
    console.log('\n💡 O sistema agora usará o PostgreSQL local');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n⚠️  PostgreSQL não está rodando localmente!');
      console.log('\n🔧 SOLUÇÕES:');
      console.log('1. Instale o PostgreSQL: https://www.postgresql.org/download/windows/');
      console.log('2. Ou use o Docker: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=jcromero85 postgres');
      console.log('3. Ou inicie o serviço PostgreSQL no Windows');
      console.log('\n💡 Após instalar, execute este script novamente');
    }
    
    await poolLocal.end();
    process.exit(1);
  }
}

configurarLocal();
