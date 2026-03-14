#!/usr/bin/env node
/**
 * Script para gerenciar backups do sistema
 * Uso: node scripts/manage-backups.js [comando] [opções]
 * 
 * Comandos:
 *   list: Lista todos os backups disponíveis
 *   info <arquivo>: Mostra informações detalhadas de um backup
 *   clean: Remove backups antigos (mantém os 10 mais recentes)
 *   compare <arquivo1> <arquivo2>: Compara dois backups
 */

const fs = require('fs')
const path = require('path')

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleString('pt-BR')
}

function getBackupsDirectory() {
  const backupDir = path.join(process.cwd(), 'backups')
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }
  return backupDir
}

function listBackupFiles() {
  const backupDir = getBackupsDirectory()
  const files = fs.readdirSync(backupDir)
    .filter(file => file.endsWith('.json') || file.endsWith('.sql'))
    .map(file => {
      const filePath = path.join(backupDir, file)
      const stats = fs.statSync(filePath)
      return {
        name: file,
        path: filePath,
        size: stats.size,
        modified: stats.mtime,
        extension: path.extname(file)
      }
    })
    .sort((a, b) => b.modified - a.modified) // Mais recentes primeiro

  return files
}

function loadBackupMetadata(filePath) {
  try {
    if (path.extname(filePath) === '.json') {
      const content = fs.readFileSync(filePath, 'utf8')
      const backup = JSON.parse(content)
      return backup.metadata || null
    } else {
      // Para arquivos SQL, extrair metadados do cabeçalho
      const content = fs.readFileSync(filePath, 'utf8')
      const lines = content.split('\n').slice(0, 10) // Primeiras 10 linhas
      const metadata = {
        tipo: 'sql_backup',
        formato: 'sql',
        dataCriacao: null,
        versao: 'unknown',
        totalRegistros: 'unknown',
        tabelas: []
      }
      
      // Tentar extrair data do cabeçalho
      const dateMatch = content.match(/-- Gerado em: (.+)/)
      if (dateMatch) {
        metadata.dataCriacao = dateMatch[1]
      }
      
      return metadata
    }
  } catch (error) {
    return null
  }
}

function listBackups() {
  log('📋 LISTA DE BACKUPS DISPONÍVEIS', 'bold')
  log('=' .repeat(80), 'blue')

  const files = listBackupFiles()
  
  if (files.length === 0) {
    log('📁 Nenhum backup encontrado na pasta backups/', 'yellow')
    log('💡 Use "npm run backup" para criar um backup', 'blue')
    return
  }

  log(`📊 Total de backups: ${files.length}`, 'cyan')
  log('')

  files.forEach((file, index) => {
    const metadata = loadBackupMetadata(file.path)
    
    log(`${index + 1}. 📄 ${file.name}`, 'bold')
    log(`   📅 Modificado: ${formatDate(file.modified)}`, 'blue')
    log(`   📊 Tamanho: ${formatBytes(file.size)}`, 'blue')
    log(`   📋 Formato: ${file.extension.substring(1).toUpperCase()}`, 'blue')
    
    if (metadata) {
      log(`   🏷️  Tipo: ${metadata.tipo}`, 'cyan')
      if (metadata.totalRegistros !== 'unknown') {
        log(`   📈 Registros: ${metadata.totalRegistros}`, 'cyan')
      }
      if (metadata.tabelas && metadata.tabelas.length > 0) {
        log(`   🗂️  Tabelas: ${metadata.tabelas.join(', ')}`, 'cyan')
      }
    }
    log('')
  })

  log('💡 Comandos úteis:', 'yellow')
  log('   • Informações: node scripts/manage-backups.js info <nome-arquivo>', 'yellow')
  log('   • Restaurar: node scripts/restore-database.js <nome-arquivo>', 'yellow')
  log('   • Limpar antigos: node scripts/manage-backups.js clean', 'yellow')
}

function showBackupInfo(fileName) {
  const backupDir = getBackupsDirectory()
  let filePath = fileName
  
  // Se não for caminho absoluto, procurar na pasta backups
  if (!path.isAbsolute(fileName)) {
    filePath = path.join(backupDir, fileName)
  }
  
  if (!fs.existsSync(filePath)) {
    log(`❌ Arquivo não encontrado: ${fileName}`, 'red')
    return
  }

  const stats = fs.statSync(filePath)
  const metadata = loadBackupMetadata(filePath)

  log(`📄 INFORMAÇÕES DO BACKUP: ${path.basename(filePath)}`, 'bold')
  log('=' .repeat(60), 'blue')

  log(`📁 Arquivo: ${filePath}`, 'blue')
  log(`📊 Tamanho: ${formatBytes(stats.size)}`, 'blue')
  log(`📅 Criado: ${formatDate(stats.birthtime)}`, 'blue')
  log(`📅 Modificado: ${formatDate(stats.mtime)}`, 'blue')
  log(`📋 Formato: ${path.extname(filePath).substring(1).toUpperCase()}`, 'blue')

  if (metadata) {
    log('', 'reset')
    log('📋 METADADOS DO BACKUP:', 'bold')
    log(`🏷️  Tipo: ${metadata.tipo}`, 'cyan')
    log(`📅 Data de Criação: ${formatDate(metadata.dataCriacao)}`, 'cyan')
    log(`🔢 Versão: ${metadata.versao}`, 'cyan')
    log(`📈 Total de Registros: ${metadata.totalRegistros}`, 'cyan')
    
    if (metadata.tabelas && metadata.tabelas.length > 0) {
      log(`🗂️  Tabelas (${metadata.tabelas.length}):`, 'cyan')
      metadata.tabelas.forEach(table => {
        log(`   • ${table}`, 'cyan')
      })
    }

    // Se for JSON, mostrar contagem por tabela
    if (path.extname(filePath) === '.json') {
      try {
        const content = fs.readFileSync(filePath, 'utf8')
        const backup = JSON.parse(content)
        
        if (backup.data) {
          log('', 'reset')
          log('📊 REGISTROS POR TABELA:', 'bold')
          
          Object.entries(backup.data).forEach(([table, records]) => {
            const count = Array.isArray(records) ? records.length : 0
            const color = count > 0 ? 'green' : 'yellow'
            log(`   📋 ${table}: ${count} registros`, color)
          })
        }
      } catch (error) {
        log('⚠️  Erro ao analisar conteúdo do backup', 'yellow')
      }
    }
  } else {
    log('⚠️  Metadados não disponíveis ou arquivo corrompido', 'yellow')
  }

  log('', 'reset')
  log('💡 Para restaurar este backup:', 'yellow')
  log(`   node scripts/restore-database.js "${path.basename(filePath)}"`, 'yellow')
}

function cleanOldBackups() {
  log('🧹 LIMPEZA DE BACKUPS ANTIGOS', 'bold')
  log('=' .repeat(50), 'blue')

  const files = listBackupFiles()
  const keepCount = 10 // Manter os 10 mais recentes
  
  if (files.length <= keepCount) {
    log(`✅ Apenas ${files.length} backups encontrados (mantendo todos)`, 'green')
    return
  }

  const filesToDelete = files.slice(keepCount)
  log(`📊 Backups encontrados: ${files.length}`, 'blue')
  log(`🎯 Mantendo os ${keepCount} mais recentes`, 'blue')
  log(`🗑️  Removendo ${filesToDelete.length} backups antigos`, 'yellow')
  log('')

  let deletedCount = 0
  let deletedSize = 0

  filesToDelete.forEach(file => {
    try {
      fs.unlinkSync(file.path)
      deletedCount++
      deletedSize += file.size
      log(`   ✅ Removido: ${file.name}`, 'green')
    } catch (error) {
      log(`   ❌ Erro ao remover: ${file.name} - ${error.message}`, 'red')
    }
  })

  log('')
  log(`🎉 Limpeza concluída!`, 'green')
  log(`📊 Arquivos removidos: ${deletedCount}`, 'blue')
  log(`💾 Espaço liberado: ${formatBytes(deletedSize)}`, 'blue')
}

function compareBackups(file1, file2) {
  log('🔍 COMPARAÇÃO DE BACKUPS', 'bold')
  log('=' .repeat(50), 'blue')

  const backupDir = getBackupsDirectory()
  
  // Resolver caminhos
  const path1 = path.isAbsolute(file1) ? file1 : path.join(backupDir, file1)
  const path2 = path.isAbsolute(file2) ? file2 : path.join(backupDir, file2)

  if (!fs.existsSync(path1)) {
    log(`❌ Arquivo 1 não encontrado: ${file1}`, 'red')
    return
  }

  if (!fs.existsSync(path2)) {
    log(`❌ Arquivo 2 não encontrado: ${file2}`, 'red')
    return
  }

  const metadata1 = loadBackupMetadata(path1)
  const metadata2 = loadBackupMetadata(path2)

  log(`📄 Arquivo 1: ${path.basename(path1)}`, 'cyan')
  log(`📄 Arquivo 2: ${path.basename(path2)}`, 'cyan')
  log('')

  if (metadata1 && metadata2) {
    log('📊 COMPARAÇÃO DE METADADOS:', 'bold')
    log(`   Tipo: ${metadata1.tipo} vs ${metadata2.tipo}`, 'blue')
    log(`   Registros: ${metadata1.totalRegistros} vs ${metadata2.totalRegistros}`, 'blue')
    log(`   Data: ${formatDate(metadata1.dataCriacao)} vs ${formatDate(metadata2.dataCriacao)}`, 'blue')
    
    // Comparar tabelas
    const tables1 = new Set(metadata1.tabelas || [])
    const tables2 = new Set(metadata2.tabelas || [])
    
    const commonTables = [...tables1].filter(t => tables2.has(t))
    const onlyIn1 = [...tables1].filter(t => !tables2.has(t))
    const onlyIn2 = [...tables2].filter(t => !tables1.has(t))
    
    log('')
    log('🗂️  COMPARAÇÃO DE TABELAS:', 'bold')
    log(`   Tabelas em comum: ${commonTables.length}`, 'green')
    
    if (onlyIn1.length > 0) {
      log(`   Apenas no arquivo 1: ${onlyIn1.join(', ')}`, 'yellow')
    }
    
    if (onlyIn2.length > 0) {
      log(`   Apenas no arquivo 2: ${onlyIn2.join(', ')}`, 'yellow')
    }

    // Se ambos são JSON, comparar contagens
    if (path.extname(path1) === '.json' && path.extname(path2) === '.json') {
      try {
        const backup1 = JSON.parse(fs.readFileSync(path1, 'utf8'))
        const backup2 = JSON.parse(fs.readFileSync(path2, 'utf8'))
        
        log('')
        log('📈 COMPARAÇÃO DE REGISTROS:', 'bold')
        
        commonTables.forEach(table => {
          const count1 = backup1.data[table]?.length || 0
          const count2 = backup2.data[table]?.length || 0
          const diff = count2 - count1
          const diffText = diff > 0 ? `(+${diff})` : diff < 0 ? `(${diff})` : '(=)'
          const color = diff > 0 ? 'green' : diff < 0 ? 'red' : 'blue'
          
          log(`   📋 ${table}: ${count1} → ${count2} ${diffText}`, color)
        })
      } catch (error) {
        log('⚠️  Erro ao comparar conteúdo dos backups', 'yellow')
      }
    }
  } else {
    log('⚠️  Não foi possível carregar metadados para comparação', 'yellow')
  }
}

function showHelp() {
  log('📋 GERENCIADOR DE BACKUPS - AJUDA', 'bold')
  log('=' .repeat(50), 'blue')
  log('')
  log('Uso: node scripts/manage-backups.js [comando] [opções]', 'cyan')
  log('')
  log('Comandos disponíveis:', 'yellow')
  log('  list                     Lista todos os backups', 'green')
  log('  info <arquivo>           Mostra informações de um backup', 'green')
  log('  clean                    Remove backups antigos (mantém 10)', 'green')
  log('  compare <arq1> <arq2>    Compara dois backups', 'green')
  log('  help                     Mostra esta ajuda', 'green')
  log('')
  log('Exemplos:', 'yellow')
  log('  node scripts/manage-backups.js list', 'blue')
  log('  node scripts/manage-backups.js info backup_completo_2025-10-30.json', 'blue')
  log('  node scripts/manage-backups.js clean', 'blue')
  log('  node scripts/manage-backups.js compare backup1.json backup2.json', 'blue')
}

function main() {
  const command = process.argv[2] || 'list'
  
  switch (command) {
    case 'list':
      listBackups()
      break
      
    case 'info':
      const fileName = process.argv[3]
      if (!fileName) {
        log('❌ Especifique o nome do arquivo', 'red')
        log('Uso: node scripts/manage-backups.js info <arquivo>', 'yellow')
        process.exit(1)
      }
      showBackupInfo(fileName)
      break
      
    case 'clean':
      cleanOldBackups()
      break
      
    case 'compare':
      const file1 = process.argv[3]
      const file2 = process.argv[4]
      if (!file1 || !file2) {
        log('❌ Especifique dois arquivos para comparar', 'red')
        log('Uso: node scripts/manage-backups.js compare <arquivo1> <arquivo2>', 'yellow')
        process.exit(1)
      }
      compareBackups(file1, file2)
      break
      
    case 'help':
    case '--help':
    case '-h':
      showHelp()
      break
      
    default:
      log(`❌ Comando desconhecido: ${command}`, 'red')
      log('Use "help" para ver os comandos disponíveis', 'yellow')
      process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = {
  listBackupFiles,
  loadBackupMetadata,
  showBackupInfo,
  cleanOldBackups,
  compareBackups
}