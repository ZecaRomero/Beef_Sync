const fetch = require('node-fetch');

async function checkBirthsTable() {
  try {
    console.log('≈∏‚Äùç Verificando estrutura da tabela nascimentos...');
    
    // Tentar criar um nascimento simples
    const birthData = {
      sexo: 'M',
      data: '2025-01-15',
      nascimento: '2025-01-15',
      touro: 'Touro Teste',
      observacao: 'Teste'
    };

    console.log('≈∏‚Äúù Tentando criar nascimento:', JSON.stringify(birthData, null, 2));

    const response = await fetch('http://localhost:3020/api/births', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(birthData)
    });

    const result = await response.text();
    console.log('≈∏‚Äú≈† Resposta:', result);

    if (response.ok) {
      console.log('‚≈ì‚Ä¶ Nascimento criado com sucesso!');
      
      // Agora testar o relat√≥rio
      console.log('\n≈∏‚Äùç Testando relat√≥rio com nascimento...');
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
        console.log('≈∏‚Äú≈† Dados do relat√≥rio:', JSON.stringify(reportData, null, 2));
      }
    } else {
      console.log('‚ù≈í Erro ao criar nascimento');
    }

  } catch (error) {
    console.error('‚ù≈í Erro:', error.message);
  }
}

checkBirthsTable();