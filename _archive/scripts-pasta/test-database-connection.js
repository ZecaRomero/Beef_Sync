#!/usr/bin/env node

/**
 * Script para testar a conexão com PostgreSQL
 * Uso: node scripts/test-database-connection.js
 */

const { testConnection, initDatabase, createTables, closePool } = require('../lib/database');

async function testDatabaseConnection() {
  console.log('�Ÿ�� Iniciando teste de conexão com PostgreSQL...\n');
  
  try {
    // Inicializar pool
    console.log('1️�ƒ� Inicializando pool de conexões...');
    const pool = initDatabase();
    
    if (!pool) {
      throw new Error('Falha ao inicializar pool de conexões');
    }
    console.log('�œ… Pool inicializado com sucesso\n');
    
    // Testar conexão
    console.log('2️�ƒ� Testando conexão...');
    const testResult = await testConnection();
    console.log('�œ… Conexão testada com sucesso:');
    console.log(`   - Timestamp: ${testResult.timestamp}`);
    console.log(`   - Versão: ${testResult.version}`);
    console.log(`   - Pool Info:`, testResult.poolInfo);
    console.log('');
    
    // Testar criação de tabelas
    console.log('3️�ƒ� Testando criação de tabelas...');
    await createTables();
    console.log('�œ… Tabelas criadas/verificadas com sucesso\n');
    
    // Testar algumas consultas básicas
    console.log('4️�ƒ� Testando consultas básicas...');
    const { query } = require('../lib/database');
    
    // Contar animais
    const animaisCount = await query('SELECT COUNT(*) as total FROM animais');
    console.log(`   - Total de animais: ${animaisCount.rows[0].total}`);
    
    // Contar gestações
    const gestacoesCount = await query('SELECT COUNT(*) as total FROM gestacoes');
    console.log(`   - Total de gestações: ${gestacoesCount.rows[0].total}`);
    
    // Contar estoque de sêmen
    const semenCount = await query('SELECT COUNT(*) as total FROM estoque_semen');
    console.log(`   - Total de itens no estoque: ${semenCount.rows[0].total}`);
    
    console.log('�œ… Consultas básicas executadas com sucesso\n');
    
    console.log('�ŸŽ‰ Todos os testes passaram! O banco de dados está funcionando corretamente.');
    
  } catch (error) {
    console.error('�Œ Erro durante o teste:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
    
    console.log('\n�Ÿ”� Possíveis soluções:');
    console.log('   - Verifique se o PostgreSQL está rodando');
    console.log('   - Confirme as credenciais no arquivo .env');
    console.log('   - Verifique se o banco de dados existe');
    console.log('   - Confirme se o usuário tem permissões adequadas');
    
    process.exit(1);
  } finally {
    // Fechar pool
    console.log('\n5️�ƒ� Fechando pool de conexões...');
    await closePool();
    console.log('�œ… Pool fechado com sucesso');
  }
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testDatabaseConnection()
    .then(() => {
      console.log('\n�œ� Teste concluído com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n�Ÿ’� Teste falhou:', error.message);
      process.exit(1);
    });
}

module.exports = { testDatabaseConnection };
