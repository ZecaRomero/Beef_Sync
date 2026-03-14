const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testEntradasDisponiveis() {
  try {
    console.log('ğÅ¸§ª Testando API de entradas disponÃ­veis...');
    
    const response = await fetch('http://localhost:3020/api/semen/entradas-disponiveis');
    const data = await response.json();
    
    console.log('ğÅ¸â€œÅ  Resultado:', data);
    
    if (response.ok) {
      console.log('âÅ“â€¦ API funcionando corretamente!');
      console.log(`ğÅ¸â€œ¦ ${data.data.length} entradas disponÃ­veis encontradas`);
    } else {
      console.log('âÅ’ Erro na API:', data);
    }
    
  } catch (error) {
    console.error('ğÅ¸â€™¥ Erro no teste:', error);
  }
}

testEntradasDisponiveis();