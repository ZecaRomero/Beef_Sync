const fetch = require('node-fetch');
const fs = require('fs');

async function testAllReportsExport() {
  try {
    console.log('�Ÿ”� Testando TODOS os relatórios (PDF e Excel)...\n');
    
    const reportTypes = [
      'monthly_summary',
      'births_analysis', 
      'breeding_report',
      'financial_summary',
      'inventory_report',
      'location_report'
    ];

    const period = {
      startDate: '2024-01-01',
      endDate: '2025-12-31'
    };

    const formats = ['pdf', 'xlsx'];

    for (const format of formats) {
      console.log(`\n�Ÿ“Š === TESTANDO FORMATO ${format.toUpperCase()} ===`);
      
      for (const reportType of reportTypes) {
        console.log(`\n�Ÿ”� Testando ${reportType} em ${format}...`);
        
        try {
          // Primeiro testar a geração de dados
          const generateResponse = await fetch('http://localhost:3020/api/reports/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              reports: [reportType],
              period
            })
          });

          if (!generateResponse.ok) {
            console.log(`�Œ ${reportType}: Erro na geração de dados (${generateResponse.status})`);
            continue;
          }

          const generateData = await generateResponse.json();
          const reportData = generateData.data?.data?.[reportType];
          
          if (!reportData || Object.keys(reportData).length === 0) {
            console.log(`�š�️ ${reportType}: Sem dados para o período`);
          } else {
            console.log(`�œ… ${reportType}: Dados encontrados (${Object.keys(reportData).length} seções)`);
          }

          // Testar o download
          const downloadResponse = await fetch('http://localhost:3020/api/reports/download', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              reports: [reportType],
              period,
              format
            })
          });

          if (!downloadResponse.ok) {
            console.log(`�Œ ${reportType}: Erro no download ${format} (${downloadResponse.status})`);
            continue;
          }

          const buffer = await downloadResponse.buffer();
          console.log(`�Ÿ“Š ${reportType}: ${format} gerado - ${buffer.length} bytes`);
          
          if (buffer.length === 0) {
            console.log(`�Œ ${reportType}: Arquivo ${format} está VAZIO!`);
          } else if (buffer.length < 1000) {
            console.log(`�š�️ ${reportType}: Arquivo ${format} muito pequeno (${buffer.length} bytes)`);
          } else {
            console.log(`�œ… ${reportType}: Arquivo ${format} OK`);
          }

          // Salvar arquivo para verificação manual
          const filename = `test-${reportType}.${format}`;
          fs.writeFileSync(filename, buffer);
          
        } catch (error) {
          console.log(`�Œ ${reportType}: Erro - ${error.message}`);
        }
      }
    }

    // Teste combinado (múltiplos relatórios)
    console.log(`\n�Ÿ“Š === TESTANDO RELAT�“RIOS COMBINADOS ===`);
    
    for (const format of formats) {
      console.log(`\n�Ÿ”� Testando relatórios combinados em ${format}...`);
      
      try {
        const downloadResponse = await fetch('http://localhost:3020/api/reports/download', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reports: ['monthly_summary', 'inventory_report', 'financial_summary'],
            period,
            format
          })
        });

        if (downloadResponse.ok) {
          const buffer = await downloadResponse.buffer();
          console.log(`�Ÿ“Š Relatórios combinados ${format}: ${buffer.length} bytes`);
          
          if (buffer.length > 0) {
            fs.writeFileSync(`test-combinado.${format}`, buffer);
            console.log(`�œ… Relatórios combinados ${format}: OK`);
          } else {
            console.log(`�Œ Relatórios combinados ${format}: VAZIO!`);
          }
        } else {
          console.log(`�Œ Relatórios combinados ${format}: Erro ${downloadResponse.status}`);
        }
      } catch (error) {
        console.log(`�Œ Relatórios combinados ${format}: ${error.message}`);
      }
    }

    console.log('\n�ŸŽ‰ Teste completo finalizado!');
    console.log('�Ÿ“� Arquivos salvos para verificação manual.');

  } catch (error) {
    console.error('�Œ Erro geral:', error.message);
  }
}

testAllReportsExport();