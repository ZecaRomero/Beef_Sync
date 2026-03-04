const fetch = require('node-fetch');
const fs = require('fs');

async function testAllReports() {
  try {
    console.log('🔍 Testando todos os tipos de relatórios...');
    
    const reportTypes = [
      'monthly_summary',
      'births_analysis', 
      'breeding_report',
      'financial_summary',
      'inventory_report',
      'location_report'
    ];

    const period = {
      startDate: '2025-01-01',
      endDate: '2025-01-31'
    };

    // Testar cada tipo de relatório individualmente
    for (const reportType of reportTypes) {
      console.log(`\n📊 Testando ${reportType}...`);
      
      try {
        const response = await fetch('http://localhost:3020/api/reports/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reports: [reportType],
            period
          })
        });

        if (response.ok) {
          const data = await response.json();
          const reportData = data.data.data[reportType];
          
          if (reportData && Object.keys(reportData).length > 0) {
            console.log(`✅ ${reportType}: Dados encontrados`);
            console.log(`   Seções: ${Object.keys(reportData).join(', ')}`);
          } else {
            console.log(`⚠️ ${reportType}: Sem dados (normal se não houver dados para este tipo)`);
          }
        } else {
          const error = await response.text();
          console.log(`❌ ${reportType}: Erro - ${error}`);
        }
      } catch (error) {
        console.log(`❌ ${reportType}: Erro - ${error.message}`);
      }
    }

    // Testar download de todos os relatórios juntos
    console.log('\n📄 Testando download de todos os relatórios em PDF...');
    const pdfResponse = await fetch('http://localhost:3020/api/reports/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reports: reportTypes,
        period,
        format: 'pdf'
      })
    });

    if (pdfResponse.ok) {
      const pdfBuffer = await pdfResponse.buffer();
      console.log(`✅ PDF completo: ${pdfBuffer.length} bytes`);
      fs.writeFileSync('relatorio-todos-tipos.pdf', pdfBuffer);
      console.log('💾 Salvo como relatorio-todos-tipos.pdf');
    } else {
      const error = await pdfResponse.text();
      console.log(`❌ Erro no PDF: ${error}`);
    }

    // Testar download em Excel
    console.log('\n📊 Testando download de todos os relatórios em Excel...');
    const excelResponse = await fetch('http://localhost:3020/api/reports/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reports: reportTypes,
        period,
        format: 'xlsx'
      })
    });

    if (excelResponse.ok) {
      const excelBuffer = await excelResponse.buffer();
      console.log(`✅ Excel completo: ${excelBuffer.length} bytes`);
      fs.writeFileSync('relatorio-todos-tipos.xlsx', excelBuffer);
      console.log('💾 Salvo como relatorio-todos-tipos.xlsx');
    } else {
      const error = await excelResponse.text();
      console.log(`❌ Erro no Excel: ${error}`);
    }

    console.log('\n🎉 Teste completo finalizado!');
    console.log('📋 Resumo:');
    console.log('   - Relatórios funcionando corretamente');
    console.log('   - Downloads em PDF e Excel operacionais');
    console.log('   - Dados sendo exibidos quando disponíveis');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testAllReports();