const ExcelJS = require('exceljs');
const path = require('path');

async function criarExcelExemplo() {
  console.log('📊 CRIANDO EXCEL DE EXEMPLO\n');
  console.log('='.repeat(80));
  
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Beef-Sync';
  workbook.created = new Date();
  workbook.title = 'Exemplo - Importação de Piquetes';

  const worksheet = workbook.addWorksheet('Dados');

  // Configurar largura das colunas
  worksheet.columns = [
    { width: 12 }, // SÉRIE
    { width: 12 }, // RG
    { width: 20 }, // LOCAL
    { width: 20 }, // TOURO_1ª I.A
    { width: 12 }, // SÉRIE (pai)
    { width: 12 }, // RG (pai)
    { width: 15 }, // DATA I.A
    { width: 18 }, // DATA DG 1ª I.A
    { width: 15 }  // Result
  ];

  // Cabeçalho
  const headerRow = worksheet.addRow([
    'SÉRIE',
    'RG',
    'LOCAL',
    'TOURO_1ª I.A',
    'SÉRIE (pai)',
    'RG (pai)',
    'DATA I.A',
    'DATA DG 1ª I.A',
    'Result'
  ]);

  // Estilizar cabeçalho
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.height = 25;

  // Dados de exemplo
  const dadosExemplo = [
    ['M', '1001', 'Piquete A', 'Touro Brahman', 'T', '500', '10/01/2026', '25/01/2026', 'Prenha'],
    ['M', '1002', 'Piquete A', 'Touro Nelore', 'T', '501', '10/01/2026', '25/01/2026', 'Vazia'],
    ['M', '1003', 'Piquete B', 'Touro Angus', 'T', '502', '12/01/2026', '27/01/2026', 'Prenha'],
    ['G', '2001', 'Piquete B', 'Touro Brahman', 'T', '500', '12/01/2026', '27/01/2026', 'Pendente'],
    ['G', '2002', 'Piquete C', 'Touro Nelore', 'T', '501', '15/01/2026', '30/01/2026', 'Prenha'],
    ['CJCJ', '3001', 'Piquete C', 'Touro Angus', 'T', '502', '15/01/2026', '30/01/2026', 'Prenha'],
    ['CJCJ', '3002', 'Piquete D', 'Touro Brahman', 'T', '500', '18/01/2026', '02/02/2026', 'Vazia'],
    ['M', '1004', 'Piquete D', 'Touro Nelore', 'T', '501', '18/01/2026', '02/02/2026', 'Prenha']
  ];

  // Adicionar dados
  dadosExemplo.forEach(dados => {
    const row = worksheet.addRow(dados);
    row.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Adicionar bordas
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  // Salvar arquivo
  const filename = 'exemplo-importacao-piquetes.xlsx';
  const filepath = path.join(process.cwd(), filename);

  await workbook.xlsx.writeFile(filepath);
  
  console.log(`✅ Arquivo criado: ${filename}`);
  console.log(`📁 Localização: ${filepath}`);
  console.log('\n' + '='.repeat(80));
  console.log('\n💡 Como usar:');
  console.log('   1. Abra o arquivo no Excel');
  console.log('   2. Edite os dados conforme necessário');
  console.log('   3. Acesse http://localhost:3000/importar-piquetes');
  console.log('   4. Faça upload do arquivo');
  console.log('\n📋 Dados de exemplo incluídos:');
  console.log(`   - ${dadosExemplo.length} animais`);
  console.log('   - 4 piquetes (A, B, C, D)');
  console.log('   - Dados de IA e DG');
}

criarExcelExemplo().catch(console.error);
