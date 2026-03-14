const fetch = require('node-fetch');

async function createCompleteTestData() {
  try {
    console.log('≈∏‚Äùç Criando dados completos de teste...');
    
    // Criar mais nascimentos com dados variados
    const births = [
      {
        receptora: 'Vaca 001',
        sexo: 'F',
        data: '2025-01-10',
        nascimento: '2025-01-10',
        touro: 'Touro Nelore',
        observacao: 'Parto normal',
        custo_dna: 45.50
      },
      {
        receptora: 'Vaca 002',
        sexo: 'M',
        data: '2025-01-12',
        nascimento: '2025-01-12',
        touro: 'Touro Angus',
        observacao: 'Parto dif√≠cil',
        custo_dna: 52.00
      },
      {
        receptora: 'Vaca 003',
        sexo: 'F',
        data: '2025-01-18',
        nascimento: '2025-01-18',
        touro: 'Touro Nelore',
        observacao: 'Parto normal',
        custo_dna: 48.75
      },
      {
        receptora: 'Vaca 004',
        sexo: 'M',
        data: '2025-01-25',
        nascimento: '2025-01-25',
        touro: 'Touro Brahman',
        observacao: 'Parto normal',
        custo_dna: 55.00
      }
    ];

    console.log('≈∏‚Äò∂ Criando nascimentos variados...');
    for (const birth of births) {
      try {
        const response = await fetch('http://localhost:3020/api/births', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(birth)
        });

        if (response.ok) {
          console.log(`‚≈ì‚Ä¶ Nascimento de ${birth.sexo} (${birth.touro}) criado`);
        } else {
          const error = await response.text();
          console.log(`‚ù≈í Erro ao criar nascimento:`, error);
        }
      } catch (error) {
        console.log(`‚ù≈í Erro ao criar nascimento:`, error.message);
      }
    }

    // Aguardar e testar relat√≥rio completo
    console.log('\n‚è≥ Testando relat√≥rio completo...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    const reportResponse = await fetch('http://localhost:3020/api/reports/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reports: ['monthly_summary', 'births_analysis', 'inventory_report'],
        period: {
          startDate: '2025-01-01',
          endDate: '2025-01-31'
        }
      })
    });

    if (reportResponse.ok) {
      const reportData = await reportResponse.json();
      console.log('≈∏‚Äú≈† Relat√≥rio completo gerado:', JSON.stringify(reportData, null, 2));
    }

    // Testar download em PDF
    console.log('\n≈∏‚Äú‚Äû Testando download em PDF...');
    const pdfResponse = await fetch('http://localhost:3020/api/reports/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reports: ['monthly_summary', 'births_analysis', 'inventory_report'],
        period: {
          startDate: '2025-01-01',
          endDate: '2025-01-31'
        },
        format: 'pdf'
      })
    });

    if (pdfResponse.ok) {
      const fs = require('fs');
      const pdfBuffer = await pdfResponse.buffer();
      console.log('≈∏‚Äú‚Äû Tamanho do PDF:', pdfBuffer.length, 'bytes');
      fs.writeFileSync('relatorio-completo-teste.pdf', pdfBuffer);
      console.log('≈∏‚Äôæ PDF salvo como relatorio-completo-teste.pdf');
    }

    // Testar download em Excel
    console.log('\n≈∏‚Äú≈† Testando download em Excel...');
    const excelResponse = await fetch('http://localhost:3020/api/reports/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reports: ['monthly_summary', 'births_analysis', 'inventory_report'],
        period: {
          startDate: '2025-01-01',
          endDate: '2025-01-31'
        },
        format: 'xlsx'
      })
    });

    if (excelResponse.ok) {
      const fs = require('fs');
      const excelBuffer = await excelResponse.buffer();
      console.log('≈∏‚Äú≈† Tamanho do Excel:', excelBuffer.length, 'bytes');
      fs.writeFileSync('relatorio-completo-teste.xlsx', excelBuffer);
      console.log('≈∏‚Äôæ Excel salvo como relatorio-completo-teste.xlsx');
    }

  } catch (error) {
    console.error('‚ù≈í Erro geral:', error.message);
  }
}

createCompleteTestData();