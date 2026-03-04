const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testSemenAPI() {
  try {
    console.log('🧪 Testando API de sêmen...');
    
    // Teste 1: Buscar estoque atual
    console.log('\n1️⃣ Buscando estoque atual...');
    const stockResponse = await fetch('http://localhost:3020/api/semen');
    const stockData = await stockResponse.json();
    console.log('📊 Estoque atual:', stockData);
    
    // Encontrar uma entrada disponível para teste
    const entradas = stockData.data?.filter(item => 
      item.tipo_operacao === 'entrada' && 
      (item.doses_disponiveis || 0) > 0
    ) || [];
    
    if (entradas.length === 0) {
      console.log('❌ Nenhuma entrada disponível para teste');
      return;
    }
    
    const entrada = entradas[0];
    console.log('🎯 Usando entrada para teste:', {
      id: entrada.id,
      nome_touro: entrada.nome_touro,
      doses_disponiveis: entrada.doses_disponiveis
    });
    
    // Teste 2: Registrar saída
    console.log('\n2️⃣ Testando registro de saída...');
    const saidaData = {
      tipoOperacao: 'saida',
      entradaId: entrada.id,
      destino: 'Teste API',
      quantidadeDoses: 1,
      observacoes: 'Teste automatizado da API',
      dataOperacao: new Date().toISOString().split('T')[0]
    };
    
    console.log('📤 Dados da saída:', saidaData);
    
    const saidaResponse = await fetch('http://localhost:3020/api/semen', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(saidaData)
    });
    
    const saidaResult = await saidaResponse.json();
    console.log('📋 Resultado da saída:', saidaResult);
    
    if (saidaResponse.ok) {
      console.log('✅ Saída registrada com sucesso!');
    } else {
      console.log('❌ Erro ao registrar saída:', saidaResult);
    }
    
  } catch (error) {
    console.error('💥 Erro no teste:', error);
  }
}

testSemenAPI();