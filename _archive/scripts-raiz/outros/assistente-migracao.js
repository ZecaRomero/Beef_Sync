require('dotenv').config();
const readline = require('readline');
const { exec } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║  🤖 ASSISTENTE DE MIGRAÇÃO PARA SUPABASE                 ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

console.log('📱 Objetivo: Configurar app mobile para funcionar 24/7\n');
console.log('═══════════════════════════════════════════════════════════\n');

function pergunta(texto) {
  return new Promise((resolve) => {
    rl.question(texto, (resposta) => {
      resolve(resposta.trim().toLowerCase());
    });
  });
}

async function executarComando(comando) {
  return new Promise((resolve, reject) => {
    exec(comando, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

async function main() {
  console.log('🔍 Verificando Cloudflare WARP...\n');
  
  const warpAtivo = await pergunta('O Cloudflare WARP está CONECTADO? (s/n): ');
  
  if (warpAtivo !== 's') {
    console.log('\n⚠️  Por favor, conecte o Cloudflare WARP primeiro!');
    console.log('   1. Abra o app WARP');
    console.log('   2. Clique em "Conectar"');
    console.log('   3. Execute este script novamente\n');
    rl.close();
    return;
  }
  
  console.log('\n🧪 Testando conexão com Supabase...\n');
  
  try {
    await executarComando('node testar-conexao-supabase.js');
    console.log('\n✅ WARP FUNCIONOU! Conexão estabelecida!\n');
    
    const continuar = await pergunta('Deseja iniciar a migração agora? (s/n): ');
    
    if (continuar === 's') {
      console.log('\n🚀 Iniciando migração...\n');
      console.log('⏳ Isso pode levar 5-10 minutos. Não feche esta janela!\n');
      
      try {
        await executarComando('node migrar-local-para-supabase.js');
        console.log('\n✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!\n');
        console.log('📱 Configure o app mobile com:');
        console.log('   URL: https://bpsltnglmbwdpvumjeaf.supabase.co\n');
      } catch (error) {
        console.error('\n❌ Erro na migração:', error.message);
      }
    }
    
  } catch (error) {
    console.log('\n❌ WARP não está desbloqueando as portas PostgreSQL\n');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('💡 SOLUÇÕES ALTERNATIVAS:\n');
    
    console.log('1️⃣  USAR HOTSPOT DO CELULAR (RECOMENDADO) ⭐\n');
    console.log('   📝 PASSOS:');
    console.log('   a) Ative hotspot no celular');
    console.log('   b) Conecte o PC no hotspot do celular');
    console.log('   c) Execute: node migrar-local-para-supabase.js');
    console.log('   d) Aguarde 10 minutos');
    console.log('   e) Pronto! Pode voltar ao WiFi normal\n');
    console.log('   ⏱️  Tempo: 10-15 minutos');
    console.log('   📊 Dados: ~50-100MB\n');
    
    console.log('2️⃣  CONFIGURAR WARP PARA MODO COMPLETO\n');
    console.log('   a) Abra WARP → Configurações');
    console.log('   b) Mude para "WARP+" ou "Full Tunnel"');
    console.log('   c) Reconecte e teste novamente\n');
    
    console.log('3️⃣  TENTAR OUTRA VPN\n');
    console.log('   • ProtonVPN: https://protonvpn.com/');
    console.log('   • Windscribe: https://windscribe.com/\n');
    
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const opcao = await pergunta('Você está usando HOTSPOT agora? (s/n): ');
    
    if (opcao === 's') {
      console.log('\n🚀 Ótimo! Iniciando migração...\n');
      
      try {
        await executarComando('node migrar-local-para-supabase.js');
        console.log('\n✅ MIGRAÇÃO CONCLUÍDA!\n');
        console.log('🎉 Agora pode desligar o hotspot e voltar ao WiFi normal\n');
      } catch (error) {
        console.error('\n❌ Erro:', error.message);
      }
    } else {
      console.log('\n📋 Quando estiver pronto:');
      console.log('   1. Ative hotspot do celular');
      console.log('   2. Conecte PC no hotspot');
      console.log('   3. Execute: node migrar-local-para-supabase.js\n');
    }
  }
  
  rl.close();
}

main();
