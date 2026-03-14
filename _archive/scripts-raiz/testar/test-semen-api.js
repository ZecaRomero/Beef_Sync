const fetch = require('node-fetch');

async function testSemenAPI() {
  try {
    console.log('🔍 Testando API de sêmen...');
    
    const response = await fetch('http://localhost:3020/api/semen');
    if (response.ok) {
      const data = await response.json();
      console.log('📊 Dados da API semen:', JSON.stringify(data, null, 2));
      
      if (data.data && data.data.length > 0) {
        console.log('📋 Estrutura do primeiro registro:');
        console.log(Object.keys(data.data[0]));
      }
    } else {
      console.log('❌ Erro na API:', response.status);
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testSemenAPI();