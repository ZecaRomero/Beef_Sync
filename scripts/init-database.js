#!/usr/bin/env node

/**
 * Script para inicializar o banco de dados PostgreSQL
 * Este script cria todas as tabelas necessárias para o sistema Beef-Sync
 */

require('dotenv').config()

const { initDatabase, createTables, testConnection } = require('../lib/database')

async function initializeDatabase() {
  console.log('🚀 Iniciando configuração do banco de dados PostgreSQL...')
  
  try {
    // Inicializar conexão
    console.log('📡 Conectando ao banco de dados...')
    const pool = initDatabase()
    
    if (!pool) {
      throw new Error('❌ Falha ao inicializar pool de conexões')
    }
    
    // Testar conexão
    await testConnection()
    
    // Criar tabelas
    await createTables()
    
    console.log('✅ Banco de dados configurado com sucesso!')
    console.log('📊 Tabelas criadas:')
    console.log('   - animais')
    console.log('   - custos')
    console.log('   - gestacoes')
    console.log('   - nascimentos')
    console.log('   - estoque_semen')
    console.log('   - protocolos_aplicados')
    
    console.log('\n🎉 Sistema pronto para uso!')
    process.exit(0)
    
  } catch (error) {
    console.error('❌ Erro ao configurar banco de dados:', error.message)
    console.error('\n🔧 Verifique se:')
    console.error('   - O PostgreSQL está rodando')
    console.error('   - O banco "estoque_semen" existe')
    console.error('   - As credenciais estão corretas (usuario: postgres, senha: jcromero85)')
    console.error('   - O usuário tem permissões para criar tabelas')
    
    process.exit(1)
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  initializeDatabase()
}

module.exports = { initializeDatabase }
