// Testar conversão de datas do Excel

function converterData(data) {
  if (!data) return null;
  
  console.log(`\nTestando: "${data}" (tipo: ${typeof data})`);
  
  if (data instanceof Date) {
    const resultado = data.toISOString().split('T')[0];
    console.log(`  → Date object: ${resultado}`);
    return resultado;
  }
  
  if (typeof data === 'string') {
    // Remover espaços
    data = data.trim();
    
    // Tentar formato DD/MM/AAAA ou DD/MM/AA
    const partes = data.split('/');
    if (partes.length === 3) {
      let [dia, mes, ano] = partes;
      
      console.log(`  → Partes: dia=${dia}, mes=${mes}, ano=${ano}`);
      
      // Se ano tem 2 dígitos, converter para 4
      if (ano.length === 2) {
        const anoNum = parseInt(ano);
        // Se >= 50, é 19xx, senão é 20xx
        ano = anoNum >= 50 ? `19${ano}` : `20${ano}`;
        console.log(`  → Ano convertido: ${ano}`);
      }
      
      // Validar valores
      const diaNum = parseInt(dia);
      const mesNum = parseInt(mes);
      const anoNum = parseInt(ano);
      
      console.log(`  → Valores: dia=${diaNum}, mes=${mesNum}, ano=${anoNum}`);
      
      if (diaNum >= 1 && diaNum <= 31 && mesNum >= 1 && mesNum <= 12 && anoNum >= 1900) {
        const resultado = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
        console.log(`  ✅ Resultado: ${resultado}`);
        return resultado;
      } else {
        console.log(`  ❌ Valores inválidos`);
      }
    }
  }
  
  // Se for número (serial date do Excel)
  if (typeof data === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    const dataConvertida = new Date(excelEpoch.getTime() + data * 86400000);
    const resultado = dataConvertida.toISOString().split('T')[0];
    console.log(`  → Serial Excel: ${resultado}`);
    return resultado;
  }
  
  console.log(`  ❌ Formato não reconhecido`);
  return null;
}

// Testes
console.log('🧪 TESTANDO CONVERSÃO DE DATAS\n');
console.log('='.repeat(80));

// Formatos que devem funcionar
const testes = [
  '05/12/25',      // DD/MM/AA (ano com 2 dígitos)
  '05/01/26',      // DD/MM/AA
  '13/11/25',      // DD/MM/AA
  '16/12/25',      // DD/MM/AA
  '19/09/25',      // DD/MM/AA
  '24/10/25',      // DD/MM/AA
  '05/12/2025',    // DD/MM/AAAA (ano com 4 dígitos)
  '13/11/2025',    // DD/MM/AAAA
  new Date('2025-12-05'), // Date object
  45635,           // Serial date do Excel (05/12/2025)
];

testes.forEach(teste => {
  converterData(teste);
});

console.log('\n' + '='.repeat(80));
console.log('\n✅ Teste concluído!');
