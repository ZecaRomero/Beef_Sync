require('dotenv').config();
const { Pool } = require('pg');

console.log('🔍 Testando conexão DIRETA com Supabase (sem pooler)...\n');

// Extrair informações da URL
const dbUrl = process.env.DATABASE_URL;
const match = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);

if (!match) {
  console.error('❌ URL do banco inválida');
  process.exit(1);
}

const [, user, password, host, port, database] = match;
const hostDireto = host.replace('.pooler.', '.').replace('pooler.', '');

console.log('📡 Tentando conexão direta (porta 5432)...');
console.log('Host:', hostDireto);

const poolDireto = new Pool({
  host: hostDireto,
  port: 5432,
  database: database,
  user: user,
  password: password,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 60000
});

async function testarConexao() {
  try {
    const client = await poolDireto.connect();
    const result = await client.query('SELECT NOW(), version(), current_database()');
    
    console.log('✅ CONEXÃO DIRETA ESTABELECIDA COM SUCESSO!\n');
    console.log('⏰ Timestamp:', result.rows[0].now);
    console.log('🗄️  Database:', result.rows[0].current_database);
    console.log('📦 Versão:', result.rows[0].version.split(' ').slice(0, 2).join(' '));
    
    // Testar query simples
    const testQuery = await client.query('SELECT COUNT(*) as total FROM animais');
    console.log('🐄 Total de animais:', testQuery.rows[0].total);
    
    client.release();
    await poolDireto.end();
    
    console.log('\n✅ Conexão direta funcionando!');
    console.log('\n💡 Use esta URL no .env:');
    console.log(`DATABASE_URL=postgresql://${user}:${password}@${hostDireto}:5432/${database}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ ERRO NA CONEXÃO DIRETA:\n');
    console.error('Código:', error.code);
    console.error('Mensagem:', error.message);
    
    console.log('\n🔄 Tentando com porta 6543...');
    
    const pool6543 = new Pool({
      host: hostDireto,
      port: 6543,
      database: database,
      user: user,
      password: password,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 60000
    });
    
    try {
      const client = await pool6543.connect();
      const result = await client.query('SELECT NOW()');
      
      console.log('✅ CONEXÃO NA PORTA 6543 FUNCIONOU!\n');
      console.log('💡 Use esta URL no .env:');
      console.log(`DATABASE_URL=postgresql://${user}:${password}@${hostDireto}:6543/${database}`);
      
      client.release();
      await pool6543.end();
      process.exit(0);
      
    } catch (error2) {
      console.error('❌ Porta 6543 também falhou:', error2.message);
      
      console.log('\n⚠️  PROBLEMA DE REDE DETECTADO');
      console.log('\n💡 POSSÍVEIS CAUSAS:');
      console.log('1. 🔥 Firewall bloqueando conexões PostgreSQL');
      console.log('2. 🛡️  Antivírus bloqueando a porta 5432/6543');
      console.log('3. 🌐 Rede corporativa/escola bloqueando');
      console.log('4. ⏸️  Projeto Supabase pausado (inatividade)');
      console.log('5. 📡 Problema de DNS/roteamento');
      
      console.log('\n🔧 SOLUÇÕES:');
      console.log('1. Acesse https://supabase.com/dashboard e verifique se o projeto está ativo');
      console.log('2. Desative temporariamente o firewall/antivírus para testar');
      console.log('3. Tente usar outra rede (celular, VPN)');
      console.log('4. Adicione exceção no firewall para Node.js');
      
      await pool6543.end();
      process.exit(1);
    }
  }
}

testarConexao();
