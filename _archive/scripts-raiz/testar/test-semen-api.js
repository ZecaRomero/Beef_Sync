const fetch = require('node-fetch');

async function testSemenAPI() {
  try {
    console.log('≈∏‚Äùç Testando API de s√™men...');
    
    const response = await fetch('http://localhost:3020/api/semen');
    if (response.ok) {
      const data = await response.json();
      console.log('≈∏‚Äú≈† Dados da API semen:', JSON.stringify(data, null, 2));
      
      if (data.data && data.data.length > 0) {
        console.log('≈∏‚Äú‚Äπ Estrutura do primeiro registro:');
        console.log(Object.keys(data.data[0]));
      }
    } else {
      console.log('‚ù≈í Erro na API:', response.status);
    }
  } catch (error) {
    console.error('‚ù≈í Erro:', error.message);
  }
}

testSemenAPI();