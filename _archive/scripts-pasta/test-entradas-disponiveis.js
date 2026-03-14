const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testEntradasDisponiveis() {
  try {
    console.log('🧪 Testando API de entradas disponíveis...');
    
    const response = await fetch('http://localhost:3020/api/semen/entradas-disponiveis');
    const data = await response.json();
    
    console.log('📊 Resultado:', data);
    
    if (response.ok) {
      console.log('✅ API funcionando corretamente!');
      console.log(`📦 ${data.data.length} entradas disponíveis encontradas`);
    } else {
      console.log('❌ Erro na API:', data);
    }
    
  } catch (error) {
    console.error('💥 Erro no teste:', error);
  }
}

testEntradasDisponiveis();