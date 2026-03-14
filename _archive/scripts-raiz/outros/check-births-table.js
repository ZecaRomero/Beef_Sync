const fetch = require('node-fetch');

async function checkBirthsTable() {
  try {
    console.log('🔍 Verificando estrutura da tabela nascimentos...');
    
    // Tentar criar um nascimento simples
    const birthData = {
      sexo: 'M',
      data: '2025-01-15',
      nascimento: '2025-01-15',
      touro: 'Touro Teste',
      observacao: 'Teste'
    };

    console.log('📝 Tentando criar nascimento:', JSON.stringify(birthData, null, 2));

    const response = await fetch('http://localhost:3020/api/births', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(birthData)
    });

    const result = await response.text();
    console.log('📊 Resposta:', result);

    if (response.ok) {
      console.log('✅ Nascimento criado com sucesso!');
      
      // Agora testar o relatório
      console.log('\n🔍 Testando relatório com nascimento...');
      const reportResponse = await fetch('http://localhost:3020/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reports: ['births_analysis'],
          period: {
            startDate: '2025-01-01',
            endDate: '2025-01-31'
          }
        })
      });

      if (reportResponse.ok) {
        const reportData = await reportResponse.json();
        console.log('📊 Dados do relatório:', JSON.stringify(reportData, null, 2));
      }
    } else {
      console.log('❌ Erro ao criar nascimento');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkBirthsTable();