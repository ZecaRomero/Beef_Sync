// Script para testar a API de animais
const http = require('http');

console.log('🔍 TESTANDO API DE ANIMAIS\n');
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

console.log('\n📡 Fazendo requisição para http://localhost:3020/api/animals...\n');

const req = http.request(options, (res) => {
  console.log(`✅ Status: ${res.statusCode} ${res.statusMessage}`);
  console.log(`📋 Headers:`, res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n📦 Resposta recebida:');
    console.log('='.repeat(60));
    
    try {
      const json = JSON.parse(data);
      console.log('✅ JSON válido');
      console.log('\n📄 Resposta completa:');
      console.log(JSON.stringify(json, null, 2));
      console.log('\n' + '='.repeat(60));
      
      if (json.success === false) {
        console.log('❌ API retornou erro!');
        console.log(`📋 Mensagem: ${json.message || 'Sem mensagem'}`);
        console.log(`📋 Erro: ${json.error || 'Sem detalhes'}`);
      } else if (Array.isArray(json.data)) {
        console.log(`✅ API funcionando! Total de animais: ${json.data.length}`);
        if (json.data.length > 0) {
          console.log('\n🐄 Primeiro animal:');
          console.log(JSON.stringify(json.data[0], null, 2));
        }
      }
      
    } catch (error) {
      console.error('❌ Erro ao parsear JSON:', error.message);
      console.log('📄 Resposta bruta:');
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('\n❌ ERRO NA REQUISIÇÃO:', error.message);
  console.error('\n💡 POSSÍVEIS CAUSAS:');
  console.error('   1. Servidor Next.js não está rodando');
  console.error('   2. Servidor está rodando em outra porta');
  console.error('   3. Firewall bloqueando a conexão');
  console.error('\n🔧 SOLUÇÃO:');
  console.error('   Execute: npm run dev');
  console.error('   Ou use o atalho: 🐄 Beef Sync.lnk');
});

req.on('timeout', () => {
  console.error('\n⏱️ TIMEOUT: Servidor não respondeu em tempo hábil');
  req.destroy();
});

req.setTimeout(5000); // 5 segundos de timeout
req.end();
