require('dotenv').config();
const https = require('https');

console.log('🔍 Testando conectividade com Supabase via API REST...\n');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL não configurada no .env');
  process.exit(1);
}

console.log('📡 Testando acesso ao Supabase:', supabaseUrl);

const url = new URL('/rest/v1/', supabaseUrl);

const options = {
  hostname: url.hostname,
  port: 443,
  path: url.pathname,
  method: 'GET',
  timeout: 10000
};

const req = https.request(options, (res) => {
  console.log('✅ Resposta recebida!');
  console.log('📊 Status:', res.statusCode);
  console.log('📋 Headers:', JSON.stringify(res.headers, null, 2));
  
  if (res.statusCode === 200 || res.statusCode === 401 || res.statusCode === 404) {
    console.log('\n✅ SUPABASE ESTÁ ACESSÍVEL VIA HTTPS!');
    console.log('\n⚠️  PROBLEMA IDENTIFICADO:');
    console.log('   Seu provedor de internet está bloqueando conexões PostgreSQL diretas');
    console.log('   (portas 5432 e 6543), mas permite HTTPS (porta 443)');
    console.log('\n💡 SOLUÇÕES:');
    console.log('   1. Use uma VPN para contornar o bloqueio');
    console.log('   2. Use o banco LOCAL (já configurado e funcionando)');
    console.log('   3. Configure o Supabase para usar connection pooling via HTTP');
    console.log('   4. Entre em contato com seu provedor de internet');
    console.log('\n✅ RECOMENDAÇÃO: Continue usando o banco LOCAL');
  }
  
  process.exit(0);
});

req.on('error', (error) => {
  console.error('❌ ERRO:', error.message);
  console.log('\n⚠️  Nem mesmo HTTPS está funcionando!');
  console.log('💡 Possível problema de rede mais amplo');
  process.exit(1);
});

req.on('timeout', () => {
  console.error('❌ TIMEOUT na requisição HTTPS');
  req.destroy();
  process.exit(1);
});

req.end();
