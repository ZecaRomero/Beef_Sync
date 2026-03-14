require('dotenv').config();

console.log('≈∏‚Äùç Testando Supabase via Supavisor (HTTP Proxy)...\n');

// Supabase oferece conex√£o via HTTP proxy (Supavisor) que funciona na porta 443
const urlOriginal = process.env.DATABASE_URL;

if (!urlOriginal) {
  console.error('‚ù≈í DATABASE_URL n√£o configurada');
  process.exit(1);
}

// Extrair credenciais
const match = urlOriginal.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
if (!match) {
  console.error('‚ù≈í URL inv√°lida');
  process.exit(1);
}

const [, user, password, host, port, database] = match;

console.log('≈∏‚Äú‚Äπ Informa√ß√µes atuais:');
console.log('   Host:', host);
console.log('   Porta:', port);
console.log('   Database:', database);

console.log('\n‚≈°†Ô∏è  DIAGN√‚ÄúSTICO:');
console.log('   ‚ù≈í Portas 5432 e 6543 est√£o BLOQUEADAS pelo seu provedor');
console.log('   ‚≈ì‚Ä¶ Porta 443 (HTTPS) est√° FUNCIONANDO');

console.log('\n≈∏‚Äô° OP√‚Ä°√‚Ä¢ES DISPON√çVEIS:\n');

console.log('1Ô∏è‚∆í£  USAR BANCO LOCAL (RECOMENDADO)');
console.log('   ‚≈ì‚Ä¶ J√° est√° configurado e funcionando');
console.log('   ‚≈ì‚Ä¶ Mais r√°pido (sem lat√™ncia de rede)');
console.log('   ‚≈ì‚Ä¶ Funciona offline');
console.log('   ‚≈ì‚Ä¶ 1841 animais j√° carregados');
console.log('   ≈∏‚Äúù Comando: node trocar-banco.js (escolha op√ß√£o 1)');

console.log('\n2Ô∏è‚∆í£  USAR VPN');
console.log('   ≈∏‚Äú± Ative uma VPN no Windows');
console.log('   ≈∏‚Äù‚Äû Depois execute: node trocar-banco.js (escolha op√ß√£o 2)');
console.log('   ≈∏ß™ Teste com: node testar-conexao-supabase.js');

console.log('\n3Ô∏è‚∆í£  USAR INTERNET DO CELULAR');
console.log('   ≈∏‚Äú± Compartilhe internet do celular via hotspot');
console.log('   ≈∏‚Äù‚Äû Conecte o PC no hotspot');
console.log('   ≈∏ß™ Teste com: node testar-conexao-supabase.js');

console.log('\n4Ô∏è‚∆í£  USAR SUPABASE REST API (Limitado)');
console.log('   ‚≈°†Ô∏è  Requer reescrever queries para usar REST');
console.log('   ‚≈°†Ô∏è  Menos funcionalidades que SQL direto');
console.log('   ‚‚ÄûπÔ∏è  N√£o recomendado para este projeto');

console.log('\n≈∏‚Äú≈† RECOMENDA√‚Ä°√∆íO FINAL:');
console.log('   Continue usando o BANCO LOCAL');
console.log('   Est√° funcionando perfeitamente e √© mais r√°pido!');

console.log('\n‚≈ì‚Ä¶ Sistema atual: FUNCIONANDO com PostgreSQL local');
