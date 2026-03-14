require('dotenv').config();
const readline = require('readline');
const { exec } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n‚‚Ä¢‚Äù‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢‚Äî');
console.log('‚‚Ä¢‚Äò  ≈∏§‚Äì ASSISTENTE DE MIGRA√‚Ä°√∆íO PARA SUPABASE                 ‚‚Ä¢‚Äò');
console.log('‚‚Ä¢≈°‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ù\n');

console.log('≈∏‚Äú± Objetivo: Configurar app mobile para funcionar 24/7\n');
console.log('‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê\n');

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
  console.log('≈∏‚Äùç Verificando Cloudflare WARP...\n');
  
  const warpAtivo = await pergunta('O Cloudflare WARP est√° CONECTADO? (s/n): ');
  
  if (warpAtivo !== 's') {
    console.log('\n‚≈°†Ô∏è  Por favor, conecte o Cloudflare WARP primeiro!');
    console.log('   1. Abra o app WARP');
    console.log('   2. Clique em "Conectar"');
    console.log('   3. Execute este script novamente\n');
    rl.close();
    return;
  }
  
  console.log('\n≈∏ß™ Testando conex√£o com Supabase...\n');
  
  try {
    await executarComando('node testar-conexao-supabase.js');
    console.log('\n‚≈ì‚Ä¶ WARP FUNCIONOU! Conex√£o estabelecida!\n');
    
    const continuar = await pergunta('Deseja iniciar a migra√ß√£o agora? (s/n): ');
    
    if (continuar === 's') {
      console.log('\n≈∏≈°‚Ç¨ Iniciando migra√ß√£o...\n');
      console.log('‚è≥ Isso pode levar 5-10 minutos. N√£o feche esta janela!\n');
      
      try {
        await executarComando('node migrar-local-para-supabase.js');
        console.log('\n‚≈ì‚Ä¶ MIGRA√‚Ä°√∆íO CONCLU√çDA COM SUCESSO!\n');
        console.log('≈∏‚Äú± Configure o app mobile com:');
        console.log('   URL: https://bpsltnglmbwdpvumjeaf.supabase.co\n');
      } catch (error) {
        console.error('\n‚ù≈í Erro na migra√ß√£o:', error.message);
      }
    }
    
  } catch (error) {
    console.log('\n‚ù≈í WARP n√£o est√° desbloqueando as portas PostgreSQL\n');
    console.log('‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê\n');
    console.log('≈∏‚Äô° SOLU√‚Ä°√‚Ä¢ES ALTERNATIVAS:\n');
    
    console.log('1Ô∏è‚∆í£  USAR HOTSPOT DO CELULAR (RECOMENDADO) ‚≠ê\n');
    console.log('   ≈∏‚Äúù PASSOS:');
    console.log('   a) Ative hotspot no celular');
    console.log('   b) Conecte o PC no hotspot do celular');
    console.log('   c) Execute: node migrar-local-para-supabase.js');
    console.log('   d) Aguarde 10 minutos');
    console.log('   e) Pronto! Pode voltar ao WiFi normal\n');
    console.log('   ‚è±Ô∏è  Tempo: 10-15 minutos');
    console.log('   ≈∏‚Äú≈† Dados: ~50-100MB\n');
    
    console.log('2Ô∏è‚∆í£  CONFIGURAR WARP PARA MODO COMPLETO\n');
    console.log('   a) Abra WARP ‚‚Ä†‚Äô Configura√ß√µes');
    console.log('   b) Mude para "WARP+" ou "Full Tunnel"');
    console.log('   c) Reconecte e teste novamente\n');
    
    console.log('3Ô∏è‚∆í£  TENTAR OUTRA VPN\n');
    console.log('   ‚‚Ç¨¢ ProtonVPN: https://protonvpn.com/');
    console.log('   ‚‚Ç¨¢ Windscribe: https://windscribe.com/\n');
    
    console.log('‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê\n');
    
    const opcao = await pergunta('Voc√™ est√° usando HOTSPOT agora? (s/n): ');
    
    if (opcao === 's') {
      console.log('\n≈∏≈°‚Ç¨ √‚Äútimo! Iniciando migra√ß√£o...\n');
      
      try {
        await executarComando('node migrar-local-para-supabase.js');
        console.log('\n‚≈ì‚Ä¶ MIGRA√‚Ä°√∆íO CONCLU√çDA!\n');
        console.log('≈∏≈Ω‚Ä∞ Agora pode desligar o hotspot e voltar ao WiFi normal\n');
      } catch (error) {
        console.error('\n‚ù≈í Erro:', error.message);
      }
    } else {
      console.log('\n≈∏‚Äú‚Äπ Quando estiver pronto:');
      console.log('   1. Ative hotspot do celular');
      console.log('   2. Conecte PC no hotspot');
      console.log('   3. Execute: node migrar-local-para-supabase.js\n');
    }
  }
  
  rl.close();
}

main();
