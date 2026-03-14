const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3020,
  path: '/api/animals',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      console.log('\n=== TESTANDO API /api/animals ===\n');
      console.log(`Status: ${res.statusCode}`);
      console.log(`Total de animais: ${response.data?.length || 0}\n`);
      
      // Buscar M 1815
      const m1815 = response.data?.find(a => a.serie === 'M1815' || (a.serie === 'M' && a.rg === '1815'));
      
      if (m1815) {
        console.log('✅ M 1815 ENCONTRADA NA API!');
        console.log(JSON.stringify(m1815, null, 2));
      } else {
        console.log('❌ M 1815 NÃO ENCONTRADA NA API');
        
        // Mostrar alguns animais M
        const animaisM = response.data?.filter(a => a.serie?.startsWith('M')) || [];
        console.log(`\nAnimais com série M na API: ${animaisM.length}`);
        animaisM.slice(0, 5).forEach(a => {
          console.log(`- ${a.serie} ${a.rg} | Raça: ${a.raca} | Status: ${a.situacao}`);
        });
      }
      
    } catch (error) {
      console.error('Erro ao parsear resposta:', error.message);
      console.log('Resposta:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro na requisição:', error.message);
  console.log('\n⚠️  O servidor está rodando na porta 3020?');
  console.log('Execute: npm run dev');
});

req.end();
