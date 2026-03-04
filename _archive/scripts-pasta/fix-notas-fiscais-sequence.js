#!/usr/bin/env node
/**
 * Corrige a sequência de ID da tabela notas_fiscais.
 * Use quando aparecer erro: "duplicar valor da chave viola a restrição de unicidade notas_fiscais_pkey"
 * 
 * Executar: node scripts/fix-notas-fiscais-sequence.js
 */
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'beef_sync',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'jcromero85'
});

async function fixSequence() {
  const client = await pool.connect();
  try {
    const maxResult = await client.query('SELECT MAX(id) as max_id FROM notas_fiscais');
    const maxId = maxResult.rows[0]?.max_id || 0;
    const nextVal = maxId + 1;
    
    await client.query(`SELECT setval('notas_fiscais_id_seq', $1)`, [nextVal]);
    console.log(`✅ Sequência notas_fiscais_id_seq corrigida. Próximo ID será: ${nextVal}`);
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

fixSequence();
