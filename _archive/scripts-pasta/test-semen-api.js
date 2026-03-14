const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testSemenAPI() {
  try {
    console.log('ğÅ¸§ª Testando API de sÃªmen...');
    
    // Teste 1: Buscar estoque atual
    console.log('\n1ï¸âÆ’£ Buscando estoque atual...');
    const stockResponse = await fetch('http://localhost:3020/api/semen');
    const stockData = await stockResponse.json();
    console.log('ğÅ¸â€œÅ  Estoque atual:', stockData);
    
    // Encontrar uma entrada disponÃ­vel para teste
    const entradas = stockData.data?.filter(item => 
      item.tipo_operacao === 'entrada' && 
      (item.doses_disponiveis || 0) > 0
    ) || [];
    
    if (entradas.length === 0) {
      console.log('âÅ’ Nenhuma entrada disponÃ­vel para teste');
      return;
    }
    
    const entrada = entradas[0];
    console.log('ğÅ¸Å½¯ Usando entrada para teste:', {
      id: entrada.id,
      nome_touro: entrada.nome_touro,
      doses_disponiveis: entrada.doses_disponiveis
    });
    
    // Teste 2: Registrar saÃ­da
    console.log('\n2ï¸âÆ’£ Testando registro de saÃ­da...');
    const saidaData = {
      tipoOperacao: 'saida',
      entradaId: entrada.id,
      destino: 'Teste API',
      quantidadeDoses: 1,
      observacoes: 'Teste automatizado da API',
      dataOperacao: new Date().toISOString().split('T')[0]
    };
    
    console.log('ğÅ¸â€œ¤ Dados da saÃ­da:', saidaData);
    
    const saidaResponse = await fetch('http://localhost:3020/api/semen', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(saidaData)
    });
    
    const saidaResult = await saidaResponse.json();
    console.log('ğÅ¸â€œâ€¹ Resultado da saÃ­da:', saidaResult);
    
    if (saidaResponse.ok) {
      console.log('âÅ“â€¦ SaÃ­da registrada com sucesso!');
    } else {
      console.log('âÅ’ Erro ao registrar saÃ­da:', saidaResult);
    }
    
  } catch (error) {
    console.error('ğÅ¸â€™¥ Erro no teste:', error);
  }
}

testSemenAPI();