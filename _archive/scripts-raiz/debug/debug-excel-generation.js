const fetch = require('node-fetch');
const fs = require('fs');

async function debugExcelGeneration() {
  try {
    console.log('🔍 Debugando geração de Excel...');
    
    // Testar primeiro a API de geração de dados
    console.log('\n1. Testando API de geração de dados...');
    const generateResponse = await fetch('http://localhost:3020/api/reports/generate', {
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

    if (!generateResponse.ok) {
      console.log('❌ Erro na API generate:', generateResponse.status);
      const errorText = await generateResponse.text();
      console.log('Erro:', errorText);
      return;
    }

    const generateData = await generateResponse.json();
    console.log('✅ API generate funcionando');
    console.log('📊 Estrutura dos dados:');
    console.log('- success:', generateData.success);
    console.log('- data exists:', !!generateData.data);
    console.log('- data.data exists:', !!generateData.data?.data);
    console.log('- inventory_report exists:', !!generateData.data?.data?.inventory_report);
    
    if (generateData.data?.data?.inventory_report) {
      const report = generateData.data.data.inventory_report;
      console.log('- estoque_semen exists:', !!report.estoque_semen);
      console.log('- detalhes_touros exists:', !!report.detalhes_touros);
      console.log('- detalhes_touros length:', report.detalhes_touros?.length || 0);
    }

    // Testar a API de download
    console.log('\n2. Testando API de download...');
    const downloadResponse = await fetch('http://localhost:3020/api/reports/download', {
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

    console.log('📊 Status download:', downloadResponse.status);
    console.log('📊 Headers:', Object.fromEntries(downloadResponse.headers.entries()));

    if (!downloadResponse.ok) {
      const errorText = await downloadResponse.text();
      console.log('❌ Erro no download:', errorText);
      return;
    }

    const buffer = await downloadResponse.buffer();
    console.log('📊 Tamanho do buffer:', buffer.length, 'bytes');
    
    if (buffer.length > 0) {
      fs.writeFileSync('debug-excel-output.xlsx', buffer);
      console.log('💾 Arquivo salvo como debug-excel-output.xlsx');
      
      // Verificar se o arquivo tem conteúdo
      const fileStats = fs.statSync('debug-excel-output.xlsx');
      console.log('📁 Tamanho do arquivo salvo:', fileStats.size, 'bytes');
      
      // Verificar os primeiros bytes para ver se é um arquivo Excel válido
      const firstBytes = buffer.slice(0, 4);
      console.log('🔍 Primeiros 4 bytes (hex):', firstBytes.toString('hex'));
      console.log('🔍 Primeiros 4 bytes (string):', firstBytes.toString());
      
      // Arquivo Excel deve começar com PK (ZIP signature)
      if (firstBytes[0] === 0x50 && firstBytes[1] === 0x4B) {
        console.log('✅ Arquivo parece ser um ZIP/Excel válido');
      } else {
        console.log('❌ Arquivo não parece ser um Excel válido');
      }
    } else {
      console.log('❌ Buffer está vazio!');
    }

  } catch (error) {
    console.error('❌ Erro no debug:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugExcelGeneration();