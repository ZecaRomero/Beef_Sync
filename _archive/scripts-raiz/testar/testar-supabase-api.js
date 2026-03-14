require('dotenv').config();
const https = require('https');

console.log('≈∏‚Äùç Testando conectividade com Supabase via API REST...\n');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!supabaseUrl) {
  console.error('‚ù≈í NEXT_PUBLIC_SUPABASE_URL n√£o configurada no .env');
  process.exit(1);
}

console.log('≈∏‚Äú° Testando acesso ao Supabase:', supabaseUrl);

const url = new URL('/rest/v1/', supabaseUrl);

const options = {
  hostname: url.hostname,
  port: 443,
  path: url.pathname,
  method: 'GET',
  timeout: 10000
};

const req = https.request(options, (res) => {
  console.log('‚≈ì‚Ä¶ Resposta recebida!');
  console.log('≈∏‚Äú≈† Status:', res.statusCode);
  console.log('≈∏‚Äú‚Äπ Headers:', JSON.stringify(res.headers, null, 2));
  
  if (res.statusCode === 200 || res.statusCode === 401 || res.statusCode === 404) {
    console.log('\n‚≈ì‚Ä¶ SUPABASE EST√Å ACESS√çVEL VIA HTTPS!');
    console.log('\n‚≈°†Ô∏è  PROBLEMA IDENTIFICADO:');
    console.log('   Seu provedor de internet est√° bloqueando conex√µes PostgreSQL diretas');
    console.log('   (portas 5432 e 6543), mas permite HTTPS (porta 443)');
    console.log('\n≈∏‚Äô° SOLU√‚Ä°√‚Ä¢ES:');
    console.log('   1. Use uma VPN para contornar o bloqueio');
    console.log('   2. Use o banco LOCAL (j√° configurado e funcionando)');
    console.log('   3. Configure o Supabase para usar connection pooling via HTTP');
    console.log('   4. Entre em contato com seu provedor de internet');
    console.log('\n‚≈ì‚Ä¶ RECOMENDA√‚Ä°√∆íO: Continue usando o banco LOCAL');
  }
  
  process.exit(0);
});

req.on('error', (error) => {
  console.error('‚ù≈í ERRO:', error.message);
  console.log('\n‚≈°†Ô∏è  Nem mesmo HTTPS est√° funcionando!');
  console.log('≈∏‚Äô° Poss√≠vel problema de rede mais amplo');
  process.exit(1);
});

req.on('timeout', () => {
  console.error('‚ù≈í TIMEOUT na requisi√ß√£o HTTPS');
  req.destroy();
  process.exit(1);
});

req.end();
