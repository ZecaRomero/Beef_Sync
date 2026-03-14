const ExcelJS = require('exceljs');

async function testExcelContent() {
  try {
    console.log('�Ÿ”� Testando conteúdo do Excel...');
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('debug-excel-output.xlsx');
    
    console.log('�Ÿ“Š Planilhas encontradas:');
    workbook.eachSheet((worksheet, sheetId) => {
      console.log(`- ${sheetId}: ${worksheet.name}`);
    });
    
    // Verificar a planilha de estoque
    const estoqueSheet = workbook.getWorksheet('Relatório de Estoque');
    if (estoqueSheet) {
      console.log('\n�Ÿ“� Conteúdo da planilha "Relatório de Estoque":');
      
      // Ler as primeiras 20 linhas
      for (let i = 1; i <= 20; i++) {
        const row = estoqueSheet.getRow(i);
        if (row.hasValues) {
          const values = [];
          row.eachCell((cell, colNumber) => {
            values.push(cell.value);
          });
          console.log(`Linha ${i}:`, values);
        }
      }
    } else {
      console.log('�Œ Planilha "Relatório de Estoque" não encontrada');
    }
    
    // Verificar a planilha resumo
    const resumoSheet = workbook.getWorksheet('Resumo');
    if (resumoSheet) {
      console.log('\n�Ÿ“‹ Conteúdo da planilha "Resumo":');
      
      // Ler as primeiras 10 linhas
      for (let i = 1; i <= 10; i++) {
        const row = resumoSheet.getRow(i);
        if (row.hasValues) {
          const values = [];
          row.eachCell((cell, colNumber) => {
            values.push(cell.value);
          });
          console.log(`Linha ${i}:`, values);
        }
      }
    }
    
  } catch (error) {
    console.error('�Œ Erro ao ler Excel:', error.message);
  }
}

testExcelContent();