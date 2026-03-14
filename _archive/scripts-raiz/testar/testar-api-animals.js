// Script para testar a API de animais
const http = require('http');

console.log('≈∏‚Äùç TESTANDO API DE ANIMAIS\n');
console.log('='.repeat(60));

// Testar endpoint /api/animals
const options = {
  hostname: 'localhost',
  port: 3020,
  path: '/api/animals',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('\n≈∏‚Äú° Fazendo requisi√ß√£o para http://localhost:3020/api/animals...\n');

const req = http.request(options, (res) => {
  console.log(`‚≈ì‚Ä¶ Status: ${res.statusCode} ${res.statusMessage}`);
  console.log(`≈∏‚Äú‚Äπ Headers:`, res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n≈∏‚Äú¶ Resposta recebida:');
    console.log('='.repeat(60));
    
    try {
      const json = JSON.parse(data);
      console.log('‚≈ì‚Ä¶ JSON v√°lido');
      console.log('\n≈∏‚Äú‚Äû Resposta completa:');
      console.log(JSON.stringify(json, null, 2));
      console.log('\n' + '='.repeat(60));
      
      if (json.success === false) {
        console.log('‚ù≈í API retornou erro!');
        console.log(`≈∏‚Äú‚Äπ Mensagem: ${json.message || 'Sem mensagem'}`);
        console.log(`≈∏‚Äú‚Äπ Erro: ${json.error || 'Sem detalhes'}`);
      } else if (Array.isArray(json.data)) {
        console.log(`‚≈ì‚Ä¶ API funcionando! Total de animais: ${json.data.length}`);
        if (json.data.length > 0) {
          console.log('\n≈∏ê‚Äû Primeiro animal:');
          console.log(JSON.stringify(json.data[0], null, 2));
        }
      }
      
    } catch (error) {
      console.error('‚ù≈í Erro ao parsear JSON:', error.message);
      console.log('≈∏‚Äú‚Äû Resposta bruta:');
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('\n‚ù≈í ERRO NA REQUISI√‚Ä°√∆íO:', error.message);
  console.error('\n≈∏‚Äô° POSS√çVEIS CAUSAS:');
  console.error('   1. Servidor Next.js n√£o est√° rodando');
  console.error('   2. Servidor est√° rodando em outra porta');
  console.error('   3. Firewall bloqueando a conex√£o');
  console.error('\n≈∏‚Äùß SOLU√‚Ä°√∆íO:');
  console.error('   Execute: npm run dev');
  console.error('   Ou use o atalho: ≈∏ê‚Äû Beef Sync.lnk');
});

req.on('timeout', () => {
  console.error('\n‚è±Ô∏è TIMEOUT: Servidor n√£o respondeu em tempo h√°bil');
  req.destroy();
});

req.setTimeout(5000); // 5 segundos de timeout
req.end();
