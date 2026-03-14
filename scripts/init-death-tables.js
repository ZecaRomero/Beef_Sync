#!/usr/bin/env node

/**
 * Script para inicializar tabelas de mortes no PostgreSQL
 * Executa: node scripts/init-death-tables.js
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'estoque_semen',
  password: process.env.DB_PASSWORD || 'jcromero85',
  port: process.env.DB_PORT || 5432,
});

async function initDeathTables() {
  const client = await pool.connect();
  
  try {
    console.log('ðÅ¸Å¡â‚¬ Inicializando tabelas de mortes...');
    
    await client.query('BEGIN');

    // Criar tabela de causas de morte
    await client.query(`
      CREATE TABLE IF NOT EXISTS causas_morte (
        id SERIAL PRIMARY KEY,
        causa VARCHAR(100) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('âÅ“â€¦ Tabela causas_morte criada/verificada');

    // Criar tabela de mortes
    await client.query(`
      CREATE TABLE IF NOT EXISTS mortes (
        id SERIAL PRIMARY KEY,
        animal_id INTEGER REFERENCES animais(id) ON DELETE CASCADE,
        data_morte DATE NOT NULL,
        causa_morte VARCHAR(100) NOT NULL,
        observacoes TEXT,
        valor_perda DECIMAL(12,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('âÅ“â€¦ Tabela mortes criada/verificada');

    // Inserir causas de morte padrÃ£o
    await client.query(`
      INSERT INTO causas_morte (causa) VALUES 
        ('DoenÃ§a'),
        ('Acidente'),
        ('Parto'),
        ('PredaÃ§Ã£o'),
        ('IntoxicaÃ§Ã£o'),
        ('DesnutriÃ§Ã£o'),
        ('Idade avanÃ§ada'),
        ('Problemas cardÃ­acos'),
        ('Problemas respiratÃ³rios'),
        ('Outros')
      ON CONFLICT (causa) DO NOTHING
    `);
    console.log('âÅ“â€¦ Causas de morte padrÃ£o inseridas');

    // Criar Ã­ndices para performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_mortes_animal_id ON mortes(animal_id);
      CREATE INDEX IF NOT EXISTS idx_mortes_data_morte ON mortes(data_morte);
      CREATE INDEX IF NOT EXISTS idx_mortes_causa ON mortes(causa_morte);
      CREATE INDEX IF NOT EXISTS idx_causas_morte_causa ON causas_morte(causa);
    `);
    console.log('âÅ“â€¦ Ã�ndices criados');

    await client.query('COMMIT');
    console.log('ðÅ¸Å½â€° Tabelas de mortes inicializadas com sucesso!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('â�Å’ Erro ao inicializar tabelas de mortes:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await initDeathTables();
    process.exit(0);
  } catch (error) {
    console.error('Falha na inicializaÃ§Ã£o:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = { initDeathTables };
