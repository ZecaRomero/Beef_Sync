const fs = require('fs');

const backupFile = 'backups/backup_completo_2025-12-16_14.sql';

console.log(`📦 Analisando: ${backupFile}\n`);

const content = fs.readFileSync(backupFile, 'utf8');

// Encontrar todas as linhas que começam com "-- Tabela:"
const tabelas = [];
const lines = content.split('\n');

for (const line of lines) {
  if (line.startsWith('-- Tabela:')) {
    const match = line.match(/-- Tabela: (\w+) \((\d+) registros\)/);
    if (match) {
      tabelas.push({
        nome: match[1],
        registros: parseInt(match[2])
      });
    }
  }
}

console.log('📊 Tabelas encontradas no backup:\n');
tabelas.forEach(t => {
  console.log(`  ${t.nome}: ${t.registros} registros`);
});

console.log(`\n📈 Total: ${tabelas.length} tabelas`);

// Verificar tabelas importantes
const importantes = ['dna_envios', 'abastecimento_nitrogenio', 'exames_andrologicos'];
console.log('\n🔍 Tabelas importantes:');
importantes.forEach(nome => {
  const tabela = tabelas.find(t => t.nome === nome);
  if (tabela) {
    console.log(`  ✅ ${nome}: ${tabela.registros} registros`);
  } else {
    console.log(`  ❌ ${nome}: NÃO ENCONTRADA`);
  }
});
