const fs = require('fs');
const path = require('path');

const backupsDir = 'backups';
const files = fs.readdirSync(backupsDir).filter(f => f.endsWith('.json'));

console.log('🔍 Verificando backups JSON para dados de DNA, Nitrogênio e Andrológicos...\n');

const tabelasProcuradas = ['dna_envios', 'abastecimento_nitrogenio', 'exames_andrologicos'];

for (const file of files) {
  const filePath = path.join(backupsDir, file);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    let encontrou = false;
    
    if (data.data) {
      for (const tabela of tabelasProcuradas) {
        if (data.data[tabela] && data.data[tabela].length > 0) {
          if (!encontrou) {
            console.log(`📦 ${file}:`);
            encontrou = true;
          }
          console.log(`   ✅ ${tabela}: ${data.data[tabela].length} registros`);
        }
      }
    }
    
  } catch (err) {
    console.log(`   ⚠️  ${file}: Erro ao ler - ${err.message}`);
  }
}

console.log('\n✅ Verificação concluída!');
