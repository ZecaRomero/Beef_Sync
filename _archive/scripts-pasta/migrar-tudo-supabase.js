#!/usr/bin/env node
/**
 * MigraÃ§Ã£o completa para Supabase - executa todos os passos
 * Uso: node scripts/migrar-tudo-supabase.js [PROJECT_REF]
 * 
 * PrÃ©-requisito: banco local rodando com dados
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
  console.log(`\nââ€“¶ ${cmd}\n`)
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
    console.log('\nðÅ¸â€œâ€¹ Reference ID do Supabase (Settings ââ€ â€™ General):')
    projectRef = await ask('> ')
  }

  if (!projectRef) {
    console.error('âÅ’ Reference ID obrigatÃ³rio.')
    process.exit(1)
  }

  // Porta 5432 = modo sessÃ£o (mais estÃ¡vel para migraÃ§Ã£o/restore)
  // Porta 6543 = modo transaÃ§Ã£o (melhor para app em produÃ§Ã£o)
  const databaseUrlSession = `postgresql://postgres.${projectRef}:${SENHA_SUPABASE}@aws-0-${REGIAO_PADRAO}.pooler.supabase.com:5432/postgres`
  const databaseUrlTransaction = `postgresql://postgres.${projectRef}:${SENHA_SUPABASE}@aws-0-${REGIAO_PADRAO}.pooler.supabase.com:6543/postgres?pgbouncer=true`
  const envPath = path.join(process.cwd(), '.env')
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : ''

  console.log('\nââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢')
  console.log('  MigraÃ§Ã£o Beef-Sync ââ€ â€™ Supabase')
  console.log('ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢')

  // 1. Backup do banco local (--local forÃ§a PostgreSQL local mesmo com DATABASE_URL)
  console.log('\nðÅ¸â€œ¦ Passo 1: Backup do banco local...')
  if (!run('node scripts/backup-database.js completo json --local')) {
    console.error('\nâÅ’ Backup falhou. Verifique se o PostgreSQL local estÃ¡ rodando.')
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

  // 2. Configurar .env para Supabase (porta 5432 para migraÃ§Ã£o - mais estÃ¡vel)
  console.log('\nâÅ¡â„¢ï¸  Passo 2: Configurando .env...')
  envContent = envContent.replace(/^DATABASE_URL=.*$/m, '')
  envContent = envContent.replace(/^# DATABASE_URL=.*$/m, '')
  envContent = `DATABASE_URL=${databaseUrlSession}\n` + envContent.trim() + '\n'
  fs.writeFileSync(envPath, envContent)

  // 3. Inicializar schema no Supabase
  console.log('\nðÅ¸â€œâ€¹ Passo 3: Criando tabelas no Supabase...')
  if (!run('npm run db:init')) {
    console.log('\nâÅ¡ ï¸  db:init falhou - o schema pode jÃ¡ existir. Continuando...')
  }

  // 4. Restaurar backup (usa porta 5432 - conexÃ£o mais estÃ¡vel para bulk)
  if (backupFile) {
    const backupPath = path.join(backupsDir, backupFile)
    console.log(`\nðÅ¸â€œ¥ Passo 4: Restaurando ${backupFile}...`)
    if (!run(`node scripts/restore-database.js "${backupPath}" --force`)) {
      console.error('\nâÅ’ RestauraÃ§Ã£o falhou.')
      process.exit(1)
    }
  } else {
    console.log('\nâÅ¡ ï¸  Nenhum backup encontrado. Restaure manualmente:')
    console.log('   node scripts/restore-database.js backups/backup_completo_XXXX.json --force')
  }

  // 5. Trocar para porta 6543 (modo transaÃ§Ã£o) para o app em produÃ§Ã£o
  console.log('\nâÅ¡â„¢ï¸  Passo 5: Configurando .env para produÃ§Ã£o (porta 6543)...')
  envContent = fs.readFileSync(envPath, 'utf8')
  envContent = envContent.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL=${databaseUrlTransaction}`)
  fs.writeFileSync(envPath, envContent)

  console.log('\nââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢')
  console.log('  âÅ“â€¦ MigraÃ§Ã£o concluÃ­da!')
  console.log('ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢ââ€¢')
  console.log('\n   Reinicie o app: npm run dev')
  console.log('   Para acesso 24/7: faÃ§a deploy na Vercel\n')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
