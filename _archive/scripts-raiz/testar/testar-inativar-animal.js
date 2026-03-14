const http = require('http');

// ID do animal para testar (M290 = ID 1631)
const animalId = 1631;

// Dados para atualizar
const dadosAtualizacao = {
  situacao: 'Inativo'
};

const options = {
  hostname: 'localhost',
  port: 3020,
  path: `/api/animals/${animalId}`,
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log(`\n=== TESTANDO INATIVAÇÃO DO ANIMAL ${animalId} ===\n`);
console.log('Dados enviados:', JSON.stringify(dadosAtualizacao, null, 2));

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`\nStatus: ${res.statusCode}`);
    console.log('Headers:', res.headers);
    
    try {
      const response = JSON.parse(data);
      console.log('\nResposta:');
      console.log(JSON.stringify(response, null, 2));
      
      if (res.statusCode === 200) {
        console.log('\n✅ Animal inativado com sucesso!');
        console.log(`Situação atual: ${response.data?.situacao || response.situacao}`);
      } else {
        console.log('\n❌ Erro ao inativar animal');
      }
    } catch (error) {
      console.error('\n❌ Erro ao parsear resposta:', error.message);
      console.log('Resposta bruta:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('\n❌ Erro na requisição:', error.message);
  console.log('\n⚠️  O servidor está rodando na porta 3020?');
});

req.write(JSON.stringify(dadosAtualizacao));
req.end();
