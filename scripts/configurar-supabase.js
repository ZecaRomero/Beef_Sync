#!/usr/bin/env node
/**
 * Configura o Beef-Sync para usar Supabase
 * Uso: node scripts/configurar-supabase.js [PROJECT_REF]
 * 
 * PROJECT_REF: encontre em Supabase Dashboard → Settings → General → Reference ID
 * Ou na URL: https://supabase.com/dashboard/project/SEU_PROJECT_REF
 */
require('dotenv').config()
const fs = require('fs')
const path = require('path')
const readline = require('readline')

const SENHA_SUPABASE = 'jcromero1985zeca'
const REGIAO_PADRAO = 'sa-east-1' // São Paulo

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

async function main() {
  let projectRef = process.argv[2]
  
  if (!projectRef) {
    console.log('')
    console.log('📋 Para configurar o Supabase, preciso do Reference ID do seu projeto.')
    console.log('   Encontre em: Supabase Dashboard → Settings → General → Reference ID')
    console.log('   Ou na URL do projeto: .../project/XXXXXXXXXX')
    console.log('')
    projectRef = await ask('Cole o Reference ID (ex: apbkobhfnmcqqzqeeqss): ')
  }

  if (!projectRef) {
    console.error('❌ Reference ID é obrigatório.')
    process.exit(1)
  }

  const databaseUrl = `postgresql://postgres.${projectRef}:${SENHA_SUPABASE}@aws-0-${REGIAO_PADRAO}.pooler.supabase.com:6543/postgres?pgbouncer=true`
  const supabaseUrl = `https://${projectRef}.supabase.co`

  const envPath = path.join(process.cwd(), '.env')
  let envContent = ''

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8')
    // Remover DATABASE_URL antiga se existir
    envContent = envContent.replace(/^DATABASE_URL=.*$/m, '')
    envContent = envContent.replace(/^# DATABASE_URL=.*$/m, '')
  }

  const supabaseBlock = `
# ===========================================
# Supabase (configurado automaticamente)
# ===========================================
DATABASE_URL=${databaseUrl}
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
# NEXT_PUBLIC_SUPABASE_ANON_KEY=cole aqui em: Settings → API → anon key
`

  if (!envContent.includes('DATABASE_URL=')) {
    envContent = supabaseBlock + '\n' + (envContent || '')
  } else {
    envContent = envContent.trim() + '\n' + supabaseBlock
  }

  fs.writeFileSync(envPath, envContent.trim() + '\n')
  console.log('')
  console.log('✅ Arquivo .env configurado!')
  console.log('')
  console.log('📋 Próximos passos:')
  console.log('   1. Obtenha a Anon Key em: Supabase → Settings → API')
  console.log('   2. Adicione no .env: NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key')
  console.log('   3. Faça backup: npm run backup:completo')
  console.log('   4. Inicialize: npm run db:init')
  console.log('   5. Restaure: node scripts/restore-database.js backups/backup_completo_XXXX.json --force')
  console.log('')
  console.log('   Ou consulte: docs/guides/MIGRAR-SUPABASE.md')
  console.log('')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
