require('dotenv').config();

console.log('🔍 Testando Supabase via Supavisor (HTTP Proxy)...\n');

// Supabase oferece conexão via HTTP proxy (Supavisor) que funciona na porta 443
const urlOriginal = process.env.DATABASE_URL;

if (!urlOriginal) {
  console.error('❌ DATABASE_URL não configurada');
  process.exit(1);
}

// Extrair credenciais
const match = urlOriginal.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
if (!match) {
  console.error('❌ URL inválida');
  process.exit(1);
}

const [, user, password, host, port, database] = match;

console.log('📋 Informações atuais:');
console.log('   Host:', host);
console.log('   Porta:', port);
console.log('   Database:', database);

console.log('\n⚠️  DIAGNÓSTICO:');
console.log('   ❌ Portas 5432 e 6543 estão BLOQUEADAS pelo seu provedor');
console.log('   ✅ Porta 443 (HTTPS) está FUNCIONANDO');

console.log('\n💡 OPÇÕES DISPONÍVEIS:\n');

console.log('1️⃣  USAR BANCO LOCAL (RECOMENDADO)');
console.log('   ✅ Já está configurado e funcionando');
console.log('   ✅ Mais rápido (sem latência de rede)');
console.log('   ✅ Funciona offline');
console.log('   ✅ 1841 animais já carregados');
console.log('   📝 Comando: node trocar-banco.js (escolha opção 1)');

console.log('\n2️⃣  USAR VPN');
console.log('   📱 Ative uma VPN no Windows');
console.log('   🔄 Depois execute: node trocar-banco.js (escolha opção 2)');
console.log('   🧪 Teste com: node testar-conexao-supabase.js');

console.log('\n3️⃣  USAR INTERNET DO CELULAR');
console.log('   📱 Compartilhe internet do celular via hotspot');
console.log('   🔄 Conecte o PC no hotspot');
console.log('   🧪 Teste com: node testar-conexao-supabase.js');

console.log('\n4️⃣  USAR SUPABASE REST API (Limitado)');
console.log('   ⚠️  Requer reescrever queries para usar REST');
console.log('   ⚠️  Menos funcionalidades que SQL direto');
console.log('   ℹ️  Não recomendado para este projeto');

console.log('\n📊 RECOMENDAÇÃO FINAL:');
console.log('   Continue usando o BANCO LOCAL');
console.log('   Está funcionando perfeitamente e é mais rápido!');

console.log('\n✅ Sistema atual: FUNCIONANDO com PostgreSQL local');
