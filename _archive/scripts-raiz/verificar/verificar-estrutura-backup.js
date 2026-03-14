const fs = require('fs');

const jsonFile = 'backup_completo_2026-02-10_12.json';

console.log('≈∏‚Äú¶ Analisando estrutura do backup JSON...\n');

const backup = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));

console.log('Estrutura do backup:');
console.log(JSON.stringify(Object.keys(backup), null, 2));

if (backup.data) {
  console.log('\n≈∏‚Äú≈† Tabelas dentro de "data":');
  Object.keys(backup.data).sort().forEach(table => {
    const records = backup.data[table];
    console.log(`  ‚≈ì‚Äú ${table}: ${Array.isArray(records) ? records.length : 'N/A'} registros`);
  });
}

if (backup.metadata) {
  console.log('\n≈∏‚Äú‚Äπ Metadata:');
  console.log(JSON.stringify(backup.metadata, null, 2));
}

// Verificar tabelas espec√≠ficas
const tabelasImportantes = ['dna_envios', 'nitrogenio', 'exames_andrologicos'];
console.log('\n≈∏‚Äùç Verificando tabelas importantes:');
tabelasImportantes.forEach(tabela => {
  if (backup.data && backup.data[tabela]) {
    console.log(`  ‚≈ì‚Ä¶ ${tabela}: ${backup.data[tabela].length} registros`);
  } else {
    console.log(`  ‚ù≈í ${tabela}: N√∆íO ENCONTRADA`);
  }
});
