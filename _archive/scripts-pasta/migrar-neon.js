#!/usr/bin/env node
/**
 * Migração automática para o Neon - cria estrutura e insere animal CJCJ 15563
 * Execute: npm run db:migrar-neon
 * Ou: DATABASE_URL="sua_connection_string_neon" node scripts/migrar-neon.js
 */
require('dotenv').config()
const { Pool } = require('pg')

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL || !DATABASE_URL.includes('neon.tech')) {
  console.error('❌ Configure DATABASE_URL com a connection string do Neon.')
  console.error('   Copie em: console.neon.tech → Connection details')
  console.error('   Exemplo: DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require" node scripts/migrar-neon.js')
  process.exit(1)
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function run() {
  const client = await pool.connect()
  try {
    console.log('🔌 Conectando ao Neon...')
    await client.query('SELECT 1')
    console.log('✅ Conectado!')

    // Verificar se tabela animais existe
    const tableCheck = await client.query(`
      SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'animais')
    `)
    const animaisExists = tableCheck.rows[0].exists

    if (!animaisExists) {
      console.log('📋 Criando tabela animais...')
      await client.query(`
        CREATE TABLE animais (
          id SERIAL PRIMARY KEY,
          nome VARCHAR(100),
          serie VARCHAR(10) NOT NULL,
          rg VARCHAR(20) NOT NULL,
          data_nascimento DATE,
          situacao VARCHAR(20) DEFAULT 'Ativo',
          sexo VARCHAR(10) DEFAULT 'Fêmea',
          raca VARCHAR(50) DEFAULT 'Nelore',
          laboratorio_dna VARCHAR(100),
          data_envio_dna DATE,
          custo_dna DECIMAL(12,2),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(serie, rg)
        )
      `)
      console.log('✅ Tabela animais criada')
    } else {
      console.log('📋 Tabela animais já existe, adicionando colunas faltantes...')
      const cols = ['data_nascimento', 'situacao', 'laboratorio_dna', 'data_envio_dna', 'custo_dna', 'sexo', 'raca']
      const types = { data_nascimento: 'DATE', data_envio_dna: 'DATE', custo_dna: 'DECIMAL(12,2)', situacao: "VARCHAR(20) DEFAULT 'Ativo'", sexo: "VARCHAR(10) DEFAULT 'Fêmea'", raca: "VARCHAR(50) DEFAULT 'Nelore'", laboratorio_dna: 'VARCHAR(100)' }
      for (const col of cols) {
        const r = await client.query(`
          SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'animais' AND column_name = $1)
        `, [col])
        if (!r.rows[0].exists) {
          try {
            await client.query(`ALTER TABLE animais ADD COLUMN ${col} ${types[col] || 'VARCHAR(100)'}`)
            console.log(`   + Coluna ${col} adicionada`)
          } catch (e) {
            if (!e.message.includes('already exists')) throw e
          }
        }
      }
    }

    // Criar tabela custos
    console.log('📋 Criando tabela custos...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS custos (
        id SERIAL PRIMARY KEY,
        animal_id INTEGER NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        subtipo VARCHAR(50),
        valor DECIMAL(12,2) NOT NULL,
        data DATE NOT NULL,
        observacoes TEXT,
        data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Tabela custos OK')

    // Inserir animal CJCJ 15563
    const check = await client.query('SELECT id FROM animais WHERE serie = $1 AND rg = $2', ['CJCJ', '15563'])
    if (check.rows.length === 0) {
      console.log('📥 Inserindo animal CJCJ 15563...')
      await client.query(`
        INSERT INTO animais (nome, serie, rg, situacao, sexo, raca)
        VALUES ('CJ SANT ANNA 15563', 'CJCJ', '15563', 'Ativo', 'Fêmea', 'Nelore')
      `)
      console.log('✅ Animal CJCJ 15563 inserido!')
    } else {
      console.log('✅ Animal CJCJ 15563 já existe')
    }

    const count = await client.query('SELECT COUNT(*) as total FROM animais')
    console.log('')
    console.log(`🎉 Pronto! Total de animais no Neon: ${count.rows[0].total}`)
    console.log('   Teste em: https://beef-sync-2.vercel.app/a (Série: CJCJ, RG: 15563)')
  } catch (err) {
    console.error('❌ Erro:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

run()
