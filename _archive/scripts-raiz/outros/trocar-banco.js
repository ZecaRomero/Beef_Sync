const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔄 Trocar configuração de banco de dados\n');
console.log('Escolha uma opção:');
console.log('1 - Usar banco LOCAL (PostgreSQL localhost)');
console.log('2 - Usar banco SUPABASE (nuvem)');
console.log('3 - Cancelar\n');

rl.question('Digite sua escolha (1, 2 ou 3): ', (resposta) => {
  let envContent = fs.readFileSync('.env', 'utf8');
  
  if (resposta === '1') {
    // Comentar Supabase, descomentar local
    envContent = envContent.replace(
      /^DATABASE_URL=postgresql:\/\/postgres\.bpsltnglmbwdpvumjeaf/m,
      '# DATABASE_URL=postgresql://postgres.bpsltnglmbwdpvumjeaf'
    );
    
    console.log('\n✅ Configurado para usar banco LOCAL');
    console.log('📍 Host: localhost:5432');
    console.log('🗄️  Database: beef_sync');
    
  } else if (resposta === '2') {
    // Descomentar Supabase
    envContent = envContent.replace(
      /^# DATABASE_URL=postgresql:\/\/postgres\.bpsltnglmbwdpvumjeaf/m,
      'DATABASE_URL=postgresql://postgres.bpsltnglmbwdpvumjeaf'
    );
    
    console.log('\n✅ Configurado para usar SUPABASE');
    console.log('📍 Host: aws-0-sa-east-1.pooler.supabase.com');
    console.log('⚠️  Certifique-se de que:');
    console.log('   1. O projeto Supabase está ativo');
    console.log('   2. Não há bloqueio de firewall');
    console.log('   3. A rede permite conexões na porta 6543');
    
  } else {
    console.log('\n❌ Operação cancelada');
    rl.close();
    process.exit(0);
  }
  
  fs.writeFileSync('.env', envContent);
  console.log('\n💾 Arquivo .env atualizado!');
  console.log('🔄 Reinicie o servidor para aplicar as mudanças\n');
  
  rl.close();
  process.exit(0);
});
