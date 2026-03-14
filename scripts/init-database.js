#!/usr/bin/env node

/**
 * Script para inicializar o banco de dados PostgreSQL
 * Este script cria todas as tabelas necessÃ¡rias para o sistema Beef-Sync
 */

require('dotenv').config()

const { initDatabase, createTables, testConnection } = require('../lib/database')

async function initializeDatabase() {
  console.log('ðÅ¸Å¡â‚¬ Iniciando configuraÃ§Ã£o do banco de dados PostgreSQL...')
  
  try {
    // Inicializar conexÃ£o
    console.log('ðÅ¸â€œ¡ Conectando ao banco de dados...')
    const pool = initDatabase()
    
    if (!pool) {
      throw new Error('â�Å’ Falha ao inicializar pool de conexÃµes')
    }
    
    // Testar conexÃ£o
    await testConnection()
    
    // Criar tabelas
    await createTables()
    
    console.log('âÅ“â€¦ Banco de dados configurado com sucesso!')
    console.log('ðÅ¸â€œÅ  Tabelas criadas:')
    console.log('   - animais')
    console.log('   - custos')
    console.log('   - gestacoes')
    console.log('   - nascimentos')
    console.log('   - estoque_semen')
    console.log('   - protocolos_aplicados')
    
    console.log('\nðÅ¸Å½â€° Sistema pronto para uso!')
    process.exit(0)
    
  } catch (error) {
    console.error('â�Å’ Erro ao configurar banco de dados:', error.message)
    console.error('\nðÅ¸â€�§ Verifique se:')
    console.error('   - O PostgreSQL estÃ¡ rodando')
    console.error('   - O banco "estoque_semen" existe')
    console.error('   - As credenciais estÃ£o corretas (usuario: postgres, senha: jcromero85)')
    console.error('   - O usuÃ¡rio tem permissÃµes para criar tabelas')
    
    process.exit(1)
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  initializeDatabase()
}

module.exports = { initializeDatabase }
