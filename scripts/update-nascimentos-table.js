#!/usr/bin/env node

/**
 * Script para atualizar a tabela nascimentos com os campos necessários
 */

require('dotenv').config()
const { Pool } = require('pg')

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'estoque_semen',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'jcromero85',
}

async function updateNascimentosTable() {
  const pool = new Pool(dbConfig)
  
  try {
    console.log('🔧 Atualizando tabela nascimentos...')
    
    // Drop a tabela antiga se existir e criar uma nova com a estrutura correta
    await pool.query(`
      DROP TABLE IF EXISTS nascimentos CASCADE;
      
      CREATE TABLE nascimentos (
        id SERIAL PRIMARY KEY,
        receptora VARCHAR(100) NOT NULL,
        doador VARCHAR(100),
        rg VARCHAR(50),
        prev_parto VARCHAR(20),
        nascimento VARCHAR(20),
        tatuagem VARCHAR(50),
        cc VARCHAR(50),
        ps1 VARCHAR(50),
        ps2 VARCHAR(50),
        sexo VARCHAR(1) CHECK (sexo IN ('M', 'F')),
        status VARCHAR(30) DEFAULT 'gestante',
        touro TEXT,
        data VARCHAR(20),
        observacao TEXT,
        tipo_cobertura VARCHAR(20),
        custo_dna DECIMAL(12,2) DEFAULT 0,
        descarte BOOLEAN DEFAULT false,
        morte TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX idx_nascimentos_status ON nascimentos(status);
      CREATE INDEX idx_nascimentos_touro ON nascimentos(touro);
      CREATE INDEX idx_nascimentos_sexo ON nascimentos(sexo);
    `)
    
    console.log('✅ Tabela nascimentos atualizada com sucesso!')
    console.log('📊 Campos disponíveis:')
    console.log('   - receptora, doador, rg, prev_parto')
    console.log('   - nascimento, tatuagem, cc, ps1, ps2')
    console.log('   - sexo, status, touro, data')
    console.log('   - observacao, tipo_cobertura, custo_dna')
    console.log('   - descarte, morte')
    
    await pool.end()
    process.exit(0)
    
  } catch (error) {
    console.error('❌ Erro ao atualizar tabela:', error.message)
    await pool.end()
    process.exit(1)
  }
}

updateNascimentosTable()

