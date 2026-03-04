const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3020';

const endpoints = [
  { method: 'GET', url: '/api/animals', name: 'Animals' },
  { method: 'GET', url: '/api/notas-fiscais', name: 'Notas Fiscais' },
  { method: 'GET', url: '/api/contabilidade/resumo-boletins?period=2024-01-01,2024-12-31', name: 'Resumo Boletins' },
  { method: 'POST', url: '/api/contabilidade/graficos', name: 'Gráficos', body: { period: { startDate: '2024-01-01', endDate: '2024-12-31' } } },
  { method: 'GET', url: '/api/semen', name: 'Sêmen' },
  { method: 'GET', url: '/api/custos', name: 'Custos' },
  { method: 'GET', url: '/api/statistics', name: 'Statistics' }
];

async function testEndpoint(endpoint) {
  try {
    console.log(`🧪 Testando ${endpoint.name} (${endpoint.method} ${endpoint.url})...`);
    
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
      console.log(`✅ ${endpoint.name}: OK (${response.status})`);
      return { success: true, status: response.status, endpoint: endpoint.name };
    } else {
      const errorText = await response.text();
      console.log(`❌ ${endpoint.name}: ERRO ${response.status}`);
      console.log(`   Detalhes: ${errorText.substring(0, 200)}...`);
      return { success: false, status: response.status, endpoint: endpoint.name, error: errorText };
    }
  } catch (error) {
    console.log(`💥 ${endpoint.name}: EXCEÇÃO - ${error.message}`);
    return { success: false, status: 'EXCEPTION', endpoint: endpoint.name, error: error.message };
  }
}

async function testAllEndpoints() {
  console.log('🚀 Iniciando teste de todos os endpoints da página de contabilidade...\n');
  
  const results = [];
  
  // Testar sequencialmente (como a página faz)
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    // Aguardar um pouco entre requisições
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n📊 RESUMO DOS TESTES:');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Sucessos: ${successful.length}/${results.length}`);
  console.log(`❌ Falhas: ${failed.length}/${results.length}`);
  
  if (failed.length > 0) {
    console.log('\n❌ ENDPOINTS COM FALHA:');
    failed.forEach(f => {
      console.log(`   - ${f.endpoint}: ${f.status} - ${f.error?.substring(0, 100) || 'Sem detalhes'}`);
    });
  }
  
  console.log('\n🔄 Testando requisições simultâneas (como o browser faz)...');
  
  // Testar todas as requisições simultaneamente
  const simultaneousPromises = endpoints.map(endpoint => testEndpoint(endpoint));
  const simultaneousResults = await Promise.allSettled(simultaneousPromises);
  
  const simultaneousSuccessful = simultaneousResults.filter(r => r.status === 'fulfilled' && r.value.success);
  const simultaneousFailed = simultaneousResults.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success));
  
  console.log(`✅ Sucessos simultâneos: ${simultaneousSuccessful.length}/${simultaneousResults.length}`);
  console.log(`❌ Falhas simultâneas: ${simultaneousFailed.length}/${simultaneousResults.length}`);
  
  if (simultaneousFailed.length > 0) {
    console.log('\n❌ FALHAS EM REQUISIÇÕES SIMULTÂNEAS:');
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