require('dotenv').config();
const { Pool } = require('pg');

console.log('🔍 Testando conexão com Supabase...\n');

// Testar com porta 6543 (pooler)
const pool6543 = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 60000
});

async function testarConexao() {
  console.log('📡 Tentando conectar na porta 6543 (pooler)...');
  console.log('URL:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));
  
  try {
    const client = await pool6543.connect();
    const result = await client.query('SELECT NOW(), version(), current_database()');
    
    console.log('✅ CONEXÃO ESTABELECIDA COM SUCESSO!\n');
    console.log('⏰ Timestamp:', result.rows[0].now);
    console.log('🗄️  Database:', result.rows[0].current_database);
    console.log('📦 Versão:', result.rows[0].version.split(' ').slice(0, 2).join(' '));
    
    // Testar query simples
    const testQuery = await client.query('SELECT COUNT(*) as total FROM animais');
    console.log('🐄 Total de animais:', testQuery.rows[0].total);
    
    client.release();
    await pool6543.end();
    
    console.log('\n✅ Teste concluído com sucesso!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ ERRO DE CONEXÃO:\n');
    console.error('Código:', error.code);
    console.error('Mensagem:', error.message);
    
    if (error.code === 'ETIMEDOUT') {
      console.log('\n💡 SOLUÇÕES POSSÍVEIS:');
      console.log('1. Verifique se o projeto Supabase está ativo (não pausado)');
      console.log('2. Verifique seu firewall/antivírus');
      console.log('3. Tente usar uma VPN ou outra rede');
      console.log('4. Verifique se a porta 6543 não está bloqueada');
    }
    
    await pool6543.end();
    process.exit(1);
  }
}

testarConexao();
