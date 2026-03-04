const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'estoque_semen',
  password: process.env.DB_PASSWORD || 'jcromero85',
  port: parseInt(process.env.DB_PORT) || 5432,
});

async function createTables() {
  try {
    console.log('Creating tables...');

    // Create pesagens table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pesagens (
        id SERIAL PRIMARY KEY,
        animal_id INTEGER NOT NULL REFERENCES animais(id) ON DELETE CASCADE,
        data DATE NOT NULL,
        peso DECIMAL(6,2) NOT NULL,
        ce DECIMAL(5,2),
        observacoes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_pesagens_animal_id ON pesagens(animal_id);
      CREATE INDEX IF NOT EXISTS idx_pesagens_data ON pesagens(data);
    `);
    console.log('Table pesagens created.');

    // Create inseminacoes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS inseminacoes (
        id SERIAL PRIMARY KEY,
        animal_id INTEGER NOT NULL REFERENCES animais(id) ON DELETE CASCADE,
        data_inseminacao DATE NOT NULL,
        touro VARCHAR(100),
        semen_id INTEGER, -- Optional link to estoque_semen
        inseminador VARCHAR(100),
        observacoes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_inseminacoes_animal_id ON inseminacoes(animal_id);
      CREATE INDEX IF NOT EXISTS idx_inseminacoes_data ON inseminacoes(data_inseminacao);
    `);
    console.log('Table inseminacoes created.');

  } catch (err) {
    console.error('Error creating tables:', err);
  } finally {
    await pool.end();
  }
}

createTables();
