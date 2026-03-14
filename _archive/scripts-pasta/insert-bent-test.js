#!/usr/bin/env node

// Script simples para inserir um animal de teste com SERIE "BENT"
// Usa o módulo de banco existente para garantir credenciais e conexão corretas

require('dotenv').config()
const { query, closePool, testConnection } = require('../lib/database')

async function run() {
  try {
    console.log('📡 Testando conexão...')
    const info = await testConnection()
    if (!info.success) throw new Error(info.error || 'Falha na conexão')
    console.log(`✅ Conectado em ${info.database} como ${info.user}`)

    const serie = 'BENT'
    const rg = `TEST_${Date.now().toString().slice(-6)}`
    const sexo = 'Fêmea'
    const raca = 'Nelore'

    console.log(`📝 Inserindo ${serie}-${rg}...`)
    const insert = await query(`
      INSERT INTO animais (
        nome, serie, rg, sexo, raca, situacao, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING id, nome, serie, rg, sexo, raca
    `, [
      'Teste BENT',
      serie,
      rg,
      sexo,
      raca,
      'Ativo'
    ])

    const animal = insert.rows[0]
    console.log('✅ Inserido:', animal)

    console.log('🔎 Verificando busca por SERIE BENT...')
    const verify = await query(
      'SELECT id, serie, rg FROM animais WHERE serie = $1 ORDER BY id DESC LIMIT 5',
      [serie]
    )
    console.log('📊 Últimos BENT no banco:', verify.rows)

  } catch (err) {
    console.error('❌ Erro no teste:', err)
    process.exitCode = 1
  } finally {
    await closePool()
  }
}

if (require.main === module) {
  run()
}