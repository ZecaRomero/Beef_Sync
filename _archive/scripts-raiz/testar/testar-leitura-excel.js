const ExcelJS = require('exceljs');
const path = require('path');

async function testarLeituraExcel() {
  console.log('🧪 TESTANDO LEITURA DE EXCEL\n');
  console.log('='.repeat(80));
  
  // Você precisa fornecer o caminho do seu arquivo Excel
  const arquivoExcel = process.argv[2] || 'exemplo-importacao-piquetes.xlsx';
  
  console.log(`📁 Arquivo: ${arquivoExcel}\n`);
  
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(arquivoExcel);
    
    const worksheet = workbook.worksheets[0];
    console.log(`📊 Planilha: ${worksheet.name}`);
    console.log(`📏 Total de linhas: ${worksheet.rowCount}\n`);
    
    console.log('Primeiras 5 linhas:\n');
    
    for (let i = 1; i <= Math.min(6, worksheet.rowCount); i++) {
      const row = worksheet.getRow(i);
      
      console.log(`Linha ${i}:`);
      console.log(`  A (SÉRIE): ${row.getCell(1).value} (tipo: ${typeof row.getCell(1).value})`);
      console.log(`  B (RG): ${row.getCell(2).value} (tipo: ${typeof row.getCell(2).value})`);
      console.log(`  C (LOCAL): ${row.getCell(3).value} (tipo: ${typeof row.getCell(3).value})`);
      console.log(`  D (TOURO): ${row.getCell(4).value} (tipo: ${typeof row.getCell(4).value})`);
      console.log(`  E (SÉRIE pai): ${row.getCell(5).value} (tipo: ${typeof row.getCell(5).value})`);
      console.log(`  F (RG pai): ${row.getCell(6).value} (tipo: ${typeof row.getCell(6).value})`);
      
      const dataIA = row.getCell(7).value;
      const dataDG = row.getCell(8).value;
      
      console.log(`  G (DATA I.A): ${dataIA} (tipo: ${typeof dataIA})`);
      if (dataIA instanceof Date) {
        console.log(`    → Date: ${dataIA.toISOString()}`);
        console.log(`    → UTC: ${dataIA.getUTCFullYear()}-${String(dataIA.getUTCMonth() + 1).padStart(2, '0')}-${String(dataIA.getUTCDate()).padStart(2, '0')}`);
      }
      
      console.log(`  H (DATA DG): ${dataDG} (tipo: ${typeof dataDG})`);
      if (dataDG instanceof Date) {
        console.log(`    → Date: ${dataDG.toISOString()}`);
        console.log(`    → UTC: ${dataDG.getUTCFullYear()}-${String(dataDG.getUTCMonth() + 1).padStart(2, '0')}-${String(dataDG.getUTCDate()).padStart(2, '0')}`);
      }
      
      console.log(`  I (Result): ${row.getCell(9).value} (tipo: ${typeof row.getCell(9).value})`);
      console.log('');
    }
    
    console.log('='.repeat(80));
    console.log('\n✅ Leitura concluída!');
    
  } catch (error) {
    console.error('❌ Erro ao ler Excel:', error.message);
    console.error(error);
  }
}

testarLeituraExcel();
