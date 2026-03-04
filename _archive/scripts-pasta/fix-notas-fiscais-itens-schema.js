#!/usr/bin/env node
/**
 * Corrige a estrutura da tabela notas_fiscais_itens.
 * A API espera a coluna dados_item (JSONB) - se não existir, os itens não são salvos.
 * 
 * Situação: notas_fiscais tem 3610 registros, notas_fiscais_itens tem 0
 * Causa provável: tabela tem schema antigo (descricao, quantidade...) sem dados_item
 * 
 * Executar: node scripts/fix-notas-fiscais-itens-schema.js
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

async function fixSchema() {
  const client = await pool.connect();
  try {
    // Verificar colunas existentes
    const cols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'notas_fiscais_itens'
      ORDER BY ordinal_position
    `);
    console.log('Colunas atuais:', cols.rows.map(r => r.column_name).join(', '));

    const hasDadosItem = cols.rows.some(r => r.column_name === 'dados_item');
    
    if (!hasDadosItem) {
      console.log('Adicionando coluna dados_item JSONB...');
      await client.query(`
        ALTER TABLE notas_fiscais_itens 
        ADD COLUMN IF NOT EXISTS dados_item JSONB
      `);
      console.log('Coluna dados_item adicionada.');
    } else {
      console.log('Coluna dados_item já existe.');
    }

    // Verificar estrutura final
    const final = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'notas_fiscais_itens'
      ORDER BY ordinal_position
    `);
    console.log('Estrutura final:', final.rows.map(r => r.column_name).join(', '));
    console.log('Total registros:', (await client.query('SELECT COUNT(*) FROM notas_fiscais_itens')).rows[0].count);
    
  } catch (err) {
    console.error('Erro:', err.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

fixSchema();
