#!/usr/bin/env node

require('dotenv').config();
const { query, closePool } = require('../lib/database');

async function resetTables() {
  console.log('�Ÿ”„ Removendo tabelas problemáticas...');
  
  try {
    await query('DROP TABLE IF EXISTS protocolos_aplicados CASCADE');
    await query('DROP TABLE IF EXISTS protocolos_reprodutivos CASCADE');
    console.log('�œ… Tabelas removidas');
    
    // Recriar tabelas
    await query(`
      CREATE TABLE protocolos_reprodutivos (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        descricao TEXT,
        tipo VARCHAR(50) NOT NULL,
        duracao_dias INTEGER,
        medicamentos JSONB,
        observacoes TEXT,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await query(`
      CREATE TABLE protocolos_aplicados (
        id SERIAL PRIMARY KEY,
        animal_id INTEGER NOT NULL REFERENCES animais(id) ON DELETE CASCADE,
        protocolo_id INTEGER NOT NULL REFERENCES protocolos_reprodutivos(id) ON DELETE CASCADE,
        data_inicio DATE NOT NULL,
        data_fim DATE,
        status VARCHAR(20) DEFAULT 'em_andamento',
        observacoes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('�œ… Tabelas recriadas sem constraints');
    
  } catch (error) {
    console.error('�Œ Erro:', error.message);
  } finally {
    await closePool();
  }
}

resetTables();