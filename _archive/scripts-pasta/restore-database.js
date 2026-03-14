#!/usr/bin/env node
/**
 * Script para restaurar backup do banco de dados PostgreSQL
 * Uso: node scripts/restore-database.js <arquivo-backup> [opções]
 * 
 * Opções:
 *   --force: Força a restauração sem confirmação
 *   --tables=tabela1,tabela2: Restaura apenas tabelas específicas
 *   --dry-run: Simula a restauração sem executar
 */

require('dotenv').config()
const { query, pool } = require('../lib/database')
const fs = require('fs')
const path = require('path')
const readline = require('readline')

// Configuração
const backupFile = process.argv[2]
const options = {
  force: process.argv.includes('--force'),
  dryRun: process.argv.includes('--dry-run'),
  tables: process.argv.find(arg => arg.startsWith('--tables='))?.split('=')[1]?.split(',') || null
}

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

async function validateBackupFile(filePath) {
  if (!fs.existsSync(filePath)) {
    log(`�Œ Arquivo de backup não encontrado: ${filePath}`, 'red')
    return false
  }

  const stats = fs.statSync(filePath)
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2)
  
  log(`�Ÿ“� Arquivo encontrado: ${path.basename(filePath)}`, 'green')
  log(`�Ÿ“Š Tamanho: ${sizeMB} MB`, 'blue')
  log(`�Ÿ“… Modificado: ${stats.mtime.toLocaleString('pt-BR')}`, 'blue')

  return true
}

async function loadBackupData(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  
  if (ext === '.json') {
    const content = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(content)
  } else if (ext === '.sql') {
    log('�Œ Restauração de arquivos SQL ainda não implementada', 'red')
    log('�Ÿ’� Use arquivos JSON para restauração automática', 'yellow')
    process.exit(1)
  } else {
    log('�Œ Formato de arquivo não suportado. Use .json ou .sql', 'red')
    process.exit(1)
  }
}

async function validateBackupStructure(backup) {
  if (!backup.metadata || !backup.data) {
    log('�Œ Estrutura de backup inválida', 'red')
    log('�Ÿ’� O arquivo deve conter "metadata" e "data"', 'yellow')
    return false
  }

  log('�œ… Estrutura de backup válida', 'green')
  log(`�Ÿ“‹ Tipo: ${backup.metadata.tipo}`, 'blue')
  log(`�Ÿ“… Criado em: ${new Date(backup.metadata.dataCriacao).toLocaleString('pt-BR')}`, 'blue')
  log(`�Ÿ“Š Total de registros: ${backup.metadata.totalRegistros}`, 'blue')
  log(`�Ÿ—‚️  Tabelas: ${backup.metadata.tabelas.join(', ')}`, 'blue')

  return true
}

async function checkDatabaseConnection() {
  try {
    await query('SELECT NOW()')
    log('�œ… Conexão com banco de dados estabelecida', 'green')
    return true
  } catch (error) {
    log(`�Œ Erro de conexão: ${error.message}`, 'red')
    return false
  }
}

async function getTableCounts(tables) {
  const counts = {}
  
  for (const table of tables) {
    try {
      const result = await query(`SELECT COUNT(*) as count FROM ${table}`)
      counts[table] = parseInt(result.rows[0].count)
    } catch (error) {
      counts[table] = 0
    }
  }
  
  return counts
}

async function backupCurrentData(tables) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')
  const backupName = `backup_pre_restore_${timestamp[0]}_${timestamp[1].split('-')[0]}.json`
  const backupDir = path.join(process.cwd(), 'backups')
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  const currentData = {}
  let totalRecords = 0

  for (const table of tables) {
    try {
      const result = await query(`SELECT * FROM ${table} ORDER BY id`)
      currentData[table] = result.rows
      totalRecords += result.rows.length
      log(`   �Ÿ“‹ ${table}: ${result.rows.length} registros`, 'blue')
    } catch (error) {
      currentData[table] = []
      log(`   �š�️  ${table}: tabela não encontrada`, 'yellow')
    }
  }

  const backup = {
    metadata: {
      tipo: 'pre_restore_backup',
      formato: 'json',
      dataCriacao: new Date().toISOString(),
      versao: '1.0',
      totalRegistros: totalRecords,
      tabelas: tables
    },
    data: currentData
  }

  const filePath = path.join(backupDir, backupName)
  fs.writeFileSync(filePath, JSON.stringify(backup, null, 2))
  
  log(`�Ÿ’� Backup atual salvo em: ${backupName}`, 'green')
  return filePath
}

async function restoreTable(tableName, records, dryRun = false) {
  if (records.length === 0) {
    log(`   �š�️  ${tableName}: Nenhum registro para restaurar`, 'yellow')
    return { success: true, inserted: 0, errors: 0 }
  }

  let inserted = 0
  let errors = 0

  try {
    if (!dryRun) {
      // Limpar tabela
      await query(`DELETE FROM ${tableName}`)
      log(`   �Ÿ—‘️  ${tableName}: Dados existentes removidos`, 'yellow')
    }

    // Inserir registros
    for (const record of records) {
      try {
        if (!dryRun) {
          const columns = Object.keys(record)
          const values = Object.values(record)
          const placeholders = values.map((_, index) => `$${index + 1}`).join(', ')
          
          const insertQuery = `
            INSERT INTO ${tableName} (${columns.join(', ')}) 
            VALUES (${placeholders})
          `
          
          await query(insertQuery, values)
        }
        inserted++
      } catch (error) {
        errors++
        if (errors <= 5) { // Mostrar apenas os primeiros 5 erros
          log(`   �Œ Erro ao inserir registro: ${error.message}`, 'red')
        }
      }
    }

    if (!dryRun) {
      // Resetar sequência de ID se existir
      try {
        await query(`SELECT setval(pg_get_serial_sequence('${tableName}', 'id'), COALESCE(MAX(id), 1)) FROM ${tableName}`)
      } catch (error) {
        // Ignorar se não houver sequência
      }
    }

    const status = errors === 0 ? '�œ…' : '�š�️'
    log(`   ${status} ${tableName}: ${inserted} inseridos, ${errors} erros`, errors === 0 ? 'green' : 'yellow')
    
    return { success: errors === 0, inserted, errors }
  } catch (error) {
    log(`   �Œ ${tableName}: Erro crítico - ${error.message}`, 'red')
    return { success: false, inserted: 0, errors: records.length }
  }
}

async function main() {
  log('�Ÿ”„ SISTEMA DE RESTAURA�‡�ƒO DE BACKUP', 'bold')
  log('=' .repeat(50), 'blue')

  // Validar argumentos
  if (!backupFile) {
    log('�Œ Uso: node scripts/restore-database.js <arquivo-backup> [opções]', 'red')
    log('', 'reset')
    log('Opções disponíveis:', 'yellow')
    log('  --force: Força a restauração sem confirmação', 'yellow')
    log('  --tables=tabela1,tabela2: Restaura apenas tabelas específicas', 'yellow')
    log('  --dry-run: Simula a restauração sem executar', 'yellow')
    log('', 'reset')
    log('Exemplos:', 'blue')
    log('  node scripts/restore-database.js backups/backup_completo_2025-10-30.json', 'blue')
    log('  node scripts/restore-database.js backup.json --force --tables=animais,custos', 'blue')
    log('  node scripts/restore-database.js backup.json --dry-run', 'blue')
    process.exit(1)
  }

  // Resolver caminho do arquivo
  let filePath = backupFile
  if (!path.isAbsolute(filePath)) {
    // Remover prefixo backups/ se o usuário passou
    const baseName = backupFile.replace(/^backups[/\\]/, '')
    const backupsDir = path.join(process.cwd(), 'backups')
    const candidates = [
      path.join(backupsDir, baseName),
      path.join(backupsDir, baseName + (baseName.endsWith('.json') ? '' : '.json')),
      path.resolve(backupFile),
      path.resolve(backupFile + (backupFile.endsWith('.json') ? '' : '.json'))
    ]
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        filePath = p
        break
      }
    }
    if (!fs.existsSync(filePath)) {
      filePath = path.join(backupsDir, baseName)
    }
  }

  log(`\n1. �Ÿ“� VALIDANDO ARQUIVO DE BACKUP`, 'bold')
  if (!(await validateBackupFile(filePath))) {
    const backupsDir = path.join(process.cwd(), 'backups')
    if (fs.existsSync(backupsDir)) {
      const files = fs.readdirSync(backupsDir).filter(f => f.endsWith('.json') && f.includes('completo'))
      if (files.length > 0) {
        log('\n�Ÿ’� Backups disponíveis:', 'yellow')
        files.slice(-5).forEach(f => log(`   ${f}`, 'blue'))
        log('\n   Use: node scripts/restore-database.js backups/NOME_DO_ARQUIVO.json --force', 'yellow')
      }
    }
    process.exit(1)
  }

  log(`\n2. �Ÿ“‹ CARREGANDO DADOS DO BACKUP`, 'bold')
  let backup
  try {
    backup = await loadBackupData(filePath)
  } catch (error) {
    log(`�Œ Erro ao carregar backup: ${error.message}`, 'red')
    process.exit(1)
  }

  if (!(await validateBackupStructure(backup))) {
    process.exit(1)
  }

  log(`\n3. �Ÿ”Œ VERIFICANDO CONEX�ƒO COM BANCO`, 'bold')
  if (!(await checkDatabaseConnection())) {
    process.exit(1)
  }

  // Filtrar tabelas se especificado
  let tablesToRestore = backup.metadata.tabelas
  if (options.tables) {
    tablesToRestore = tablesToRestore.filter(table => options.tables.includes(table))
    log(`�ŸŽ� Restaurando apenas tabelas: ${tablesToRestore.join(', ')}`, 'yellow')
  }

  log(`\n4. �Ÿ“Š ANALISANDO DADOS ATUAIS`, 'bold')
  const currentCounts = await getTableCounts(tablesToRestore)
  
  let hasData = false
  for (const [table, count] of Object.entries(currentCounts)) {
    if (count > 0) {
      log(`   �Ÿ“‹ ${table}: ${count} registros existentes`, 'yellow')
      hasData = true
    } else {
      log(`   �Ÿ“‹ ${table}: vazio`, 'blue')
    }
  }

  // Confirmação
  if (!options.force && !options.dryRun) {
    log(`\n�š�️  ATEN�‡�ƒO: Esta operação irá ${hasData ? 'SUBSTITUIR' : 'INSERIR'} dados no banco!`, 'yellow')
    
    if (hasData) {
      log('�Ÿš� TODOS OS DADOS ATUAIS SER�ƒO PERDIDOS!', 'red')
      log('�Ÿ’� Um backup automático será criado antes da restauração', 'blue')
    }
    
    const answer = await askQuestion('\n�“ Deseja continuar? (sim/não): ')
    if (answer.toLowerCase() !== 'sim' && answer.toLowerCase() !== 's') {
      log('�Œ Operação cancelada pelo usuário', 'yellow')
      process.exit(0)
    }
  }

  // Backup dos dados atuais
  if (hasData && !options.dryRun) {
    log(`\n5. �Ÿ’� CRIANDO BACKUP DOS DADOS ATUAIS`, 'bold')
    await backupCurrentData(tablesToRestore)
  }

  // Restauração
  const actionText = options.dryRun ? 'SIMULANDO RESTAURA�‡�ƒO' : 'RESTAURANDO DADOS'
  log(`\n${options.dryRun ? '6' : hasData ? '6' : '5'}. �Ÿ”„ ${actionText}`, 'bold')
  
  if (options.dryRun) {
    log('�Ÿ�� MODO SIMULA�‡�ƒO - Nenhum dado será alterado', 'yellow')
  }

  const results = {}
  let totalInserted = 0
  let totalErrors = 0

  for (const table of tablesToRestore) {
    const records = backup.data[table] || []
    const result = await restoreTable(table, records, options.dryRun)
    results[table] = result
    totalInserted += result.inserted
    totalErrors += result.errors
  }

  // Resumo final
  log(`\n�Ÿ“Š RESUMO DA ${options.dryRun ? 'SIMULA�‡�ƒO' : 'RESTAURA�‡�ƒO'}`, 'bold')
  log('=' .repeat(50), 'blue')
  
  const successTables = Object.values(results).filter(r => r.success).length
  const totalTables = Object.keys(results).length
  
  log(`�œ… Tabelas processadas: ${successTables}/${totalTables}`, successTables === totalTables ? 'green' : 'yellow')
  log(`�Ÿ“Š Total de registros: ${totalInserted}`, 'blue')
  
  if (totalErrors > 0) {
    log(`�š�️  Total de erros: ${totalErrors}`, 'yellow')
  }

  if (options.dryRun) {
    log('\n�Ÿ’� Para executar a restauração real, remova a opção --dry-run', 'blue')
  } else if (totalErrors === 0) {
    log('\n�ŸŽ‰ Restauração concluída com sucesso!', 'green')
  } else {
    log('\n�š�️  Restauração concluída com alguns erros', 'yellow')
    log('�Ÿ’� Verifique os logs acima para detalhes', 'blue')
  }

  process.exit(totalErrors === 0 ? 0 : 1)
}

if (require.main === module) {
  main().catch(error => {
    log(`�Œ Erro crítico: ${error.message}`, 'red')
    console.error(error)
    process.exit(1)
  })
}

module.exports = { 
  validateBackupFile, 
  loadBackupData, 
  validateBackupStructure, 
  restoreTable 
}