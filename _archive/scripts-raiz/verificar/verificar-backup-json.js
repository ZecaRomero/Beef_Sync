const fs = require('fs');

const jsonFile = 'backup_completo_2026-02-10_12.json';

console.log('≈∏‚Äú¶ Verificando conte√∫do do backup JSON...\n');

const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));

console.log('Tabelas encontradas no backup:\n');
Object.keys(data).sort().forEach(table => {
  console.log(`  ‚≈ì‚Äú ${table}: ${data[table].length} registros`);
});

console.log('\n≈∏‚Äú≈† Total de tabelas:', Object.keys(data).length);

// Verificar tabelas espec√≠ficas
const tabelasImportantes = ['dna_envios', 'nitrogenio', 'exames_andrologicos'];
console.log('\n≈∏‚Äùç Verificando tabelas importantes:');
tabelasImportantes.forEach(tabela => {
  if (data[tabela]) {
    console.log(`  ‚≈ì‚Ä¶ ${tabela}: ${data[tabela].length} registros`);
  } else {
    console.log(`  ‚ù≈í ${tabela}: N√∆íO ENCONTRADA`);
  }
});
