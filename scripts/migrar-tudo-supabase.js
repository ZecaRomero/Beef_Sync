#!/usr/bin/env node
/**
 * Migração completa para Supabase - executa todos os passos
 * Uso: node scripts/migrar-tudo-supabase.js [PROJECT_REF]
 * 
 * Pré-requisito: banco local rodando com dados
 */
require('dotenv').config()
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const readline = require('readline')

const SENHA_SUPABASE = 'jcromero1985zeca'
const REGIAO_PADRAO = 'sa-east-1'

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

function run(cmd, opts = {}) {
  console.log(`\n▶ ${cmd}\n`)
  try {
    execSync(cmd, { stdio: 'inherit', ...opts })
    return true
  } catch (e) {
    return false
  }
}

async function main() {
  let projectRef = process.argv[2]
  
  if (!projectRef) {
    console.log('\n📋 Reference ID do Supabase (Settings → General):')
    projectRef = await ask('> ')
  }

  if (!projectRef) {
    console.error('❌ Reference ID obrigatório.')
    process.exit(1)
  }

  const databaseUrl = `postgresql://postgres.${projectRef}:${SENHA_SUPABASE}@aws-0-${REGIAO_PADRAO}.pooler.supabase.com:6543/postgres?pgbouncer=true`
  const envPath = path.join(process.cwd(), '.env')
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : ''

  console.log('\n═══════════════════════════════════════════')
  console.log('  Migração Beef-Sync → Supabase')
  console.log('═══════════════════════════════════════════')

  // 1. Backup do banco local (--local força PostgreSQL local mesmo com DATABASE_URL)
  console.log('\n📦 Passo 1: Backup do banco local...')
  if (!run('node scripts/backup-database.js completo json --local')) {
    console.error('\n❌ Backup falhou. Verifique se o PostgreSQL local está rodando.')
    process.exit(1)
  }

  // Encontrar o backup mais recente
  const backupsDir = path.join(process.cwd(), 'backups')
  let backupFile = null
  if (fs.existsSync(backupsDir)) {
    const files = fs.readdirSync(backupsDir)
      .filter(f => f.endsWith('.json') && f.includes('completo'))
      .map(f => ({ name: f, mtime: fs.statSync(path.join(backupsDir, f)).mtime }))
      .sort((a, b) => b.mtime - a.mtime)
    backupFile = files[0]?.name
  }

  // 2. Configurar .env para Supabase
  console.log('\n⚙️  Passo 2: Configurando .env...')
  envContent = envContent.replace(/^DATABASE_URL=.*$/m, '')
  envContent = envContent.replace(/^# DATABASE_URL=.*$/m, '')
  envContent = `DATABASE_URL=${databaseUrl}\n` + envContent.trim() + '\n'
  fs.writeFileSync(envPath, envContent)

  // 3. Inicializar schema no Supabase
  console.log('\n📋 Passo 3: Criando tabelas no Supabase...')
  if (!run('npm run db:init')) {
    console.log('\n⚠️  db:init falhou - o schema pode já existir. Continuando...')
  }

  // 4. Restaurar backup
  if (backupFile) {
    const backupPath = path.join(backupsDir, backupFile)
    console.log(`\n📥 Passo 4: Restaurando ${backupFile}...`)
    if (!run(`node scripts/restore-database.js "${backupPath}" --force`)) {
      console.error('\n❌ Restauração falhou.')
      process.exit(1)
    }
  } else {
    console.log('\n⚠️  Nenhum backup encontrado. Restaure manualmente:')
    console.log('   node scripts/restore-database.js backups/backup_completo_XXXX.json --force')
  }

  console.log('\n═══════════════════════════════════════════')
  console.log('  ✅ Migração concluída!')
  console.log('═══════════════════════════════════════════')
  console.log('\n   Reinicie o app: npm run dev')
  console.log('   Para acesso 24/7: faça deploy na Vercel\n')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
