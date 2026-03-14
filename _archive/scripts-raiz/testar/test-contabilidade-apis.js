const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3020';

const endpoints = [
  { method: 'GET', url: '/api/animals', name: 'Animals' },
  { method: 'GET', url: '/api/notas-fiscais', name: 'Notas Fiscais' },
  { method: 'GET', url: '/api/contabilidade/resumo-boletins?period=2024-01-01,2024-12-31', name: 'Resumo Boletins' },
  { method: 'POST', url: '/api/contabilidade/graficos', name: 'GrÃ¡ficos', body: { period: { startDate: '2024-01-01', endDate: '2024-12-31' } } },
  { method: 'GET', url: '/api/semen', name: 'SÃªmen' },
  { method: 'GET', url: '/api/custos', name: 'Custos' },
  { method: 'GET', url: '/api/statistics', name: 'Statistics' }
];

async function testEndpoint(endpoint) {
  try {
    console.log(`ðÅ¸§ª Testando ${endpoint.name} (${endpoint.method} ${endpoint.url})...`);
    
    const options = {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    };
    
    if (endpoint.body) {
      options.body = JSON.stringify(endpoint.body);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint.url}`, options);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`âÅ“â€¦ ${endpoint.name}: OK (${response.status})`);
      return { success: true, status: response.status, endpoint: endpoint.name };
    } else {
      const errorText = await response.text();
      console.log(`âÅ’ ${endpoint.name}: ERRO ${response.status}`);
      console.log(`   Detalhes: ${errorText.substring(0, 200)}...`);
      return { success: false, status: response.status, endpoint: endpoint.name, error: errorText };
    }
  } catch (error) {
    console.log(`ðÅ¸â€™¥ ${endpoint.name}: EXCEÃâ€¡ÃÆ’O - ${error.message}`);
    return { success: false, status: 'EXCEPTION', endpoint: endpoint.name, error: error.message };
  }
}

async function testAllEndpoints() {
  console.log('ðÅ¸Å¡â‚¬ Iniciando teste de todos os endpoints da pÃ¡gina de contabilidade...\n');
  
  const results = [];
  
  // Testar sequencialmente (como a pÃ¡gina faz)
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    // Aguardar um pouco entre requisiÃ§Ãµes
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\nðÅ¸â€œÅ  RESUMO DOS TESTES:');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`âÅ“â€¦ Sucessos: ${successful.length}/${results.length}`);
  console.log(`âÅ’ Falhas: ${failed.length}/${results.length}`);
  
  if (failed.length > 0) {
    console.log('\nâÅ’ ENDPOINTS COM FALHA:');
    failed.forEach(f => {
      console.log(`   - ${f.endpoint}: ${f.status} - ${f.error?.substring(0, 100) || 'Sem detalhes'}`);
    });
  }
  
  console.log('\nðÅ¸â€â€ž Testando requisiÃ§Ãµes simultÃ¢neas (como o browser faz)...');
  
  // Testar todas as requisiÃ§Ãµes simultaneamente
  const simultaneousPromises = endpoints.map(endpoint => testEndpoint(endpoint));
  const simultaneousResults = await Promise.allSettled(simultaneousPromises);
  
  const simultaneousSuccessful = simultaneousResults.filter(r => r.status === 'fulfilled' && r.value.success);
  const simultaneousFailed = simultaneousResults.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success));
  
  console.log(`âÅ“â€¦ Sucessos simultÃ¢neos: ${simultaneousSuccessful.length}/${simultaneousResults.length}`);
  console.log(`âÅ’ Falhas simultÃ¢neas: ${simultaneousFailed.length}/${simultaneousResults.length}`);
  
  if (simultaneousFailed.length > 0) {
    console.log('\nâÅ’ FALHAS EM REQUISIÃâ€¡Ãâ€¢ES SIMULTÃâ€šNEAS:');
    simultaneousFailed.forEach((f, index) => {
      if (f.status === 'rejected') {
        console.log(`   - ${endpoints[index].name}: REJECTED - ${f.reason?.message || 'Erro desconhecido'}`);
      } else if (f.value && !f.value.success) {
        console.log(`   - ${f.value.endpoint}: ${f.value.status} - ${f.value.error?.substring(0, 100) || 'Sem detalhes'}`);
      }
    });
  }
}

testAllEndpoints().catch(console.error);