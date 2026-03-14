const http = require('http');

// ID do animal para testar (M290 = ID 1631)
const animalId = 1631;

console.log('\n=== TESTE COMPLETO: INATIVAR E REATIVAR ANIMAL ===\n');

// Função para fazer requisição
function fazerRequisicao(situacao) {
  return new Promise((resolve, reject) => {
    const dadosAtualizacao = { situacao };
    
    const options = {
      hostname: 'localhost',
      port: 3020,
      path: `/api/animals/${animalId}`,
      method: 'PUT',
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
          resolve({ status: res.statusCode, data: response });
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(JSON.stringify(dadosAtualizacao));
    req.end();
  });
}

// Executar testes
async function executarTestes() {
  try {
    // Teste 1: Inativar
    console.log('�Ÿ“� TESTE 1: Inativando animal...');
    const resultInativar = await fazerRequisicao('Inativo');
    
    if (resultInativar.status === 200) {
      console.log('�œ… Animal inativado com sucesso!');
      console.log(`   Situação: ${resultInativar.data.data?.situacao}`);
    } else {
      console.log('�Œ Erro ao inativar:', resultInativar.data);
      return;
    }
    
    // Aguardar 1 segundo
    console.log('\n⏳ Aguardando 1 segundo...\n');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Teste 2: Reativar
    console.log('�Ÿ“� TESTE 2: Reativando animal...');
    const resultReativar = await fazerRequisicao('Ativo');
    
    if (resultReativar.status === 200) {
      console.log('�œ… Animal reativado com sucesso!');
      console.log(`   Situação: ${resultReativar.data.data?.situacao}`);
    } else {
      console.log('�Œ Erro ao reativar:', resultReativar.data);
      return;
    }
    
    console.log('\n�ŸŽ‰ TODOS OS TESTES PASSARAM!');
    console.log('\n�Ÿ“Š Resumo:');
    console.log('   �œ… Inativação: OK');
    console.log('   �œ… Reativação: OK');
    
  } catch (error) {
    console.error('\n�Œ Erro durante os testes:', error.message);
  }
}

executarTestes();
