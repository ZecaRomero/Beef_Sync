const fetch = require('node-fetch');
const fs = require('fs');

async function testInventoryReportDetailed() {
  try {
    console.log('🔍 Testando relatório de estoque detalhado...');
    
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
      console.log('❌ Erro na geração de dados:', errorText);
      return;
    }

    const data = await dataResponse.json();
    console.log('📋 Dados do relatório de estoque:', JSON.stringify(data, null, 2));

    // Testar download em Excel
    console.log('\n📊 Testando download em Excel...');
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
      console.log('❌ Erro no download Excel:', errorText);
      return;
    }

    const excelBuffer = await excelResponse.buffer();
    console.log('📊 Tamanho do Excel:', excelBuffer.length, 'bytes');
    
    if (excelBuffer.length > 0) {
      fs.writeFileSync('test-relatorio-estoque-detalhado.xlsx', excelBuffer);
      console.log('💾 Excel salvo como test-relatorio-estoque-detalhado.xlsx');
      console.log('✅ Relatório de estoque gerado com sucesso!');
    } else {
      console.log('❌ Arquivo Excel está vazio!');
    }

  } catch (error) {
    console.error('❌ Erro ao testar relatório de estoque:', error.message);
  }
}

testInventoryReportDetailed();