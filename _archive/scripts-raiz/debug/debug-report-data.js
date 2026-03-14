const fetch = require('node-fetch');

async function debugReportData() {
  try {
    console.log('�Ÿ”� Testando geração de dados do relatório...');
    
    const response = await fetch('http://localhost:3020/api/reports/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reports: ['location_report'],
        period: {
          startDate: '2025-01-01',
          endDate: '2025-01-31'
        },
        preview: true
      })
    });

    console.log('�Ÿ“Š Status da resposta:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('�Œ Erro na resposta:', errorText);
      return;
    }

    const data = await response.json();
    console.log('�Ÿ“‹ Dados do preview:', JSON.stringify(data, null, 2));

    // Agora testar com dados completos
    console.log('\n�Ÿ”� Testando geração completa...');
    
    const fullResponse = await fetch('http://localhost:3020/api/reports/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reports: ['location_report'],
        period: {
          startDate: '2025-01-01',
          endDate: '2025-01-31'
        }
      })
    });

    if (!fullResponse.ok) {
      const errorText = await fullResponse.text();
      console.log('�Œ Erro na resposta completa:', errorText);
      return;
    }

    const fullData = await fullResponse.json();
    console.log('�Ÿ“‹ Dados completos:', JSON.stringify(fullData, null, 2));

  } catch (error) {
    console.error('�Œ Erro ao testar dados:', error.message);
  }
}

debugReportData();