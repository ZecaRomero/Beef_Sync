const fetch = require('node-fetch');
const fs = require('fs');

async function testInventoryReportDetailed() {
  try {
    console.log('�Ÿ”� Testando relatório de estoque detalhado...');
    
    // Primeiro testar a geração de dados
    const dataResponse = await fetch('http://localhost:3020/api/reports/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reports: ['inventory_report'],
        period: {
          startDate: '2024-01-01',
          endDate: '2025-12-31'
        }
      })
    });

    if (!dataResponse.ok) {
      const errorText = await dataResponse.text();
      console.log('�Œ Erro na geração de dados:', errorText);
      return;
    }

    const data = await dataResponse.json();
    console.log('�Ÿ“‹ Dados do relatório de estoque:', JSON.stringify(data, null, 2));

    // Testar download em Excel
    console.log('\n�Ÿ“Š Testando download em Excel...');
    const excelResponse = await fetch('http://localhost:3020/api/reports/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reports: ['inventory_report'],
        period: {
          startDate: '2024-01-01',
          endDate: '2025-12-31'
        },
        format: 'xlsx'
      })
    });

    if (!excelResponse.ok) {
      const errorText = await excelResponse.text();
      console.log('�Œ Erro no download Excel:', errorText);
      return;
    }

    const excelBuffer = await excelResponse.buffer();
    console.log('�Ÿ“Š Tamanho do Excel:', excelBuffer.length, 'bytes');
    
    if (excelBuffer.length > 0) {
      fs.writeFileSync('test-relatorio-estoque-detalhado.xlsx', excelBuffer);
      console.log('�Ÿ’� Excel salvo como test-relatorio-estoque-detalhado.xlsx');
      console.log('�œ… Relatório de estoque gerado com sucesso!');
    } else {
      console.log('�Œ Arquivo Excel está vazio!');
    }

  } catch (error) {
    console.error('�Œ Erro ao testar relatório de estoque:', error.message);
  }
}

testInventoryReportDetailed();