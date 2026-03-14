const fetch = require('node-fetch');

async function checkAllData() {
  try {
    console.log('≈∏‚Äùç Verificando todas as APIs de dados...');
    
    // Lista de endpoints para verificar
    const endpoints = [
      { name: 'Animais', url: '/api/animals' },
      { name: 'Nascimentos', url: '/api/births' },
      { name: 'Localiza√ß√µes', url: '/api/localizacoes' },
      { name: 'Mortes', url: '/api/deaths' },
      { name: 'Custos', url: '/api/custos' },
      { name: 'Gesta√ß√µes', url: '/api/gestacoes' },
      { name: 'S√™men', url: '/api/semen' },
      { name: 'Lotes', url: '/api/lotes' }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`http://localhost:3020${endpoint.url}`);
        if (response.ok) {
          const data = await response.json();
          const count = data.data?.length || data.length || 0;
          console.log(`≈∏‚Äú≈† ${endpoint.name}: ${count} registros`);
          
          if (count > 0 && data.data && data.data[0]) {
            const firstRecord = data.data[0];
            console.log(`   ≈∏‚Äú‚Ä¶ Primeiro registro: ${JSON.stringify(firstRecord).substring(0, 100)}...`);
          }
        } else {
          console.log(`‚ù≈í ${endpoint.name}: Erro ${response.status}`);
        }
      } catch (error) {
        console.log(`‚ù≈í ${endpoint.name}: ${error.message}`);
      }
    }

    // Verificar status do banco
    console.log('\n≈∏‚Äùç Verificando status do banco...');
    try {
      const dbResponse = await fetch('http://localhost:3020/api/database/status');
      if (dbResponse.ok) {
        const dbData = await dbResponse.json();
        console.log('≈∏‚Äî‚ÄûÔ∏è Status do banco:', JSON.stringify(dbData, null, 2));
      }
    } catch (error) {
      console.log('‚ù≈í Erro ao verificar status do banco:', error.message);
    }

    // Verificar se h√° dados na tabela animais diretamente
    console.log('\n≈∏‚Äùç Verificando dados diretamente...');
    try {
      const directResponse = await fetch('http://localhost:3020/api/animals?limit=1');
      if (directResponse.ok) {
        const directData = await directResponse.json();
        console.log('≈∏ê‚Äû Resposta direta da API animals:', JSON.stringify(directData, null, 2));
      }
    } catch (error) {
      console.log('‚ù≈í Erro na verifica√ß√£o direta:', error.message);
    }

  } catch (error) {
    console.error('‚ù≈í Erro geral:', error.message);
  }
}

checkAllData();