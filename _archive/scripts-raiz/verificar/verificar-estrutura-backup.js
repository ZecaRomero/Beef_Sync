const fs = require('fs');

const jsonFile = 'backup_completo_2026-02-10_12.json';

console.log('📦 Analisando estrutura do backup JSON...\n');

const backup = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));

console.log('Estrutura do backup:');
console.log(JSON.stringify(Object.keys(backup), null, 2));

if (backup.data) {
  console.log('\n📊 Tabelas dentro de "data":');
  Object.keys(backup.data).sort().forEach(table => {
    const records = backup.data[table];
    console.log(`  ✓ ${table}: ${Array.isArray(records) ? records.length : 'N/A'} registros`);
  });
}

if (backup.metadata) {
  console.log('\n📋 Metadata:');
  console.log(JSON.stringify(backup.metadata, null, 2));
}

// Verificar tabelas específicas
const tabelasImportantes = ['dna_envios', 'nitrogenio', 'exames_andrologicos'];
console.log('\n🔍 Verificando tabelas importantes:');
tabelasImportantes.forEach(tabela => {
  if (backup.data && backup.data[tabela]) {
    console.log(`  ✅ ${tabela}: ${backup.data[tabela].length} registros`);
  } else {
    console.log(`  ❌ ${tabela}: NÃO ENCONTRADA`);
  }
});
