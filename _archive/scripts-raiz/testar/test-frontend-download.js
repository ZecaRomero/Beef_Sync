const fetch = require('node-fetch');
const fs = require('fs');

async function testFrontendDownload() {
  try {
    console.log('≈∏‚Äùç Testando download via interface...');
    
    // Simular exatamente o que a interface faz
    const response = await fetch('http://localhost:3020/api/reports/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reports: ['inventory_report'],
        period: {
          startDate: '2025-10-01',
          endDate: '2025-10-31'
        },
        format: 'xlsx'
      })
    });

    console.log('≈∏‚Äú≈† Status:', response.status);
    console.log('≈∏‚Äú≈† Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.log('‚ù≈í Erro:', errorText);
      return;
    }

    const buffer = await response.buffer();
    console.log('≈∏‚Äú≈† Tamanho:', buffer.length, 'bytes');
    
    // Salvar com o nome que seria usado na interface
    const contentDisposition = response.headers.get('content-disposition');
    let filename = 'relatorio-teste.xlsx';
    
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="([^"]+)"/);
      if (match) {
        filename = match[1];
      }
    }
    
    console.log('≈∏‚ÄúÅ Nome do arquivo:', filename);
    
    fs.writeFileSync(filename, buffer);
    console.log('≈∏‚Äôæ Arquivo salvo como:', filename);
    
    // Verificar se tem conte√∫do
    if (buffer.length > 0) {
      console.log('‚≈ì‚Ä¶ Arquivo gerado com sucesso!');
      console.log('≈∏‚Äùç Primeiros bytes:', buffer.slice(0, 4).toString('hex'));
    } else {
      console.log('‚ù≈í Arquivo est√° vazio!');
    }

  } catch (error) {
    console.error('‚ù≈í Erro:', error.message);
  }
}

testFrontendDownload();