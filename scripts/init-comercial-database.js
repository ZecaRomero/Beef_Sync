const { query, createTables } = require('../lib/database');
const fs = require('fs');
const path = require('path');

async function initComercialDatabase() {
  try {
    console.log('🚀 Iniciando criação de tabelas comerciais...\n');

    // Primeiro criar as tabelas básicas
    await createTables();

    // Ler e executar o script SQL de tabelas comerciais
    const sqlFile = path.join(__dirname, 'create-comercial-tables.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Dividir em comandos individuais e executar
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);

    for (const command of commands) {
      try {
        await query(command);
        console.log(`✅ Comando executado com sucesso`);
      } catch (error) {
        if (error.code === '23505') {
          // Ignorar erros de duplicação (constraint já existe)
          console.log(`⚠️ Item já existe, continuando...`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n✅ Todas as tabelas comerciais foram criadas com sucesso!');
    console.log('\n📋 Tabelas criadas:');
    console.log('   - notas_fiscais');
    console.log('   - servicos');
    console.log('   - naturezas_operacao');
    console.log('   - origens_receptoras');
    
    console.log('\n🎯 Banco de dados pronto para uso!');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro ao criar tabelas comerciais:', error);
    console.error('Detalhes:', error.message);
    process.exit(1);
  }
}

// Executar se for chamado diretamente
if (require.main === module) {
  initComercialDatabase();
}

module.exports = { initComercialDatabase };

