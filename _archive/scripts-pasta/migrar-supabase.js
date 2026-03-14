#!/usr/bin/env node
/**
 * Script para migrar o Beef-Sync para Supabase
 * 
 * Uso:
 *   1. Configure DATABASE_URL no .env com a connection string do Supabase
 *   2. Execute: npm run db:migrar-supabase
 * 
 * Ou: DATABASE_URL="postgresql://..." node scripts/migrar-supabase.js
 */
require('dotenv').config()
const { Pool } = require('pg')

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL || !DATABASE_URL.includes('supabase')) {
  console.error('❌ Configure DATABASE_URL com a connection string do Supabase.')
  console.error('')
  console.error('   Onde encontrar: Supabase Dashboard → Settings → Database → Connection string (URI)')
  console.error('   Formato: postgresql://postgres.[ref]:[senha]@aws-0-[regiao].pooler.supabase.com:6543/postgres?pgbouncer=true')
  console.error('')
  console.error('   Adicione no .env e execute: npm run db:migrar-supabase')
  process.exit(1)
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function run() {
  const client = await pool.connect()
  try {
    console.log('🔌 Conectando ao Supabase...')
    await client.query('SELECT 1')
    console.log('✅ Conectado ao Supabase!')
    console.log('')

    // Verificar se tabela animais existe
    const tableCheck = await client.query(`
      SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'animais')
    `)
    const animaisExists = tableCheck.rows[0].exists

    if (animaisExists) {
      const count = await client.query('SELECT COUNT(*) FROM animais')
      console.log(`📊 Banco já possui dados: ${count.rows[0].count} animais`)
      console.log('')
      console.log('✅ Migração concluída. O Beef-Sync está pronto para usar o Supabase.')
      console.log('')
      console.log('💡 Para acessar pelo celular com PC desligado:')
      console.log('   - Faça deploy na Vercel (vercel.com)')
      console.log('   - Adicione DATABASE_URL nas variáveis de ambiente')
      return
    }

    console.log('📋 Banco vazio. Execute os passos abaixo para migrar os dados:')
    console.log('')
    console.log('   1. Com o banco LOCAL ativo, faça backup:')
    console.log('      npm run backup:completo')
    console.log('')
    console.log('   2. No .env, use DATABASE_URL do Supabase (já configurado)')
    console.log('')
    console.log('   3. Inicialize o schema:')
    console.log('      npm run db:init')
    console.log('')
    console.log('   4. Restaure o backup:')
    console.log('      node scripts/restore-database.js backups/backup_completo_XXXX.json --force')
    console.log('')
    console.log('   Ou consulte: docs/guides/MIGRAR-SUPABASE.md')
  } catch (err) {
    console.error('❌ Erro:', err.message)
    if (err.code === '28P01') {
      console.error('   Senha incorreta. Verifique a connection string.')
    } else if (err.code === 'ENOTFOUND') {
      console.error('   Host não encontrado. Verifique a URL do Supabase.')
    }
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

run()
