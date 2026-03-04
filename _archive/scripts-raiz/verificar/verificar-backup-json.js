const fs = require('fs');

const jsonFile = 'backup_completo_2026-02-10_12.json';

console.log('📦 Verificando conteúdo do backup JSON...\n');

const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));

console.log('Tabelas encontradas no backup:\n');
Object.keys(data).sort().forEach(table => {
  console.log(`  ✓ ${table}: ${data[table].length} registros`);
});

console.log('\n📊 Total de tabelas:', Object.keys(data).length);

// Verificar tabelas específicas
const tabelasImportantes = ['dna_envios', 'nitrogenio', 'exames_andrologicos'];
console.log('\n🔍 Verificando tabelas importantes:');
tabelasImportantes.forEach(tabela => {
  if (data[tabela]) {
    console.log(`  ✅ ${tabela}: ${data[tabela].length} registros`);
  } else {
    console.log(`  ❌ ${tabela}: NÃO ENCONTRADA`);
  }
});
