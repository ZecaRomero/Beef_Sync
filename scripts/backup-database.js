#!/usr/bin/env node
/**
 * Script para fazer backup do banco de dados PostgreSQL
 * Uso: node scripts/backup-database.js [tipo] [formato] [--local]
 * 
 * Tipos: completo, animais, reprodutivo, comercial, financeiro
 * Formatos: json, sql
 * --local: forÃ§a uso do PostgreSQL local (ignora DATABASE_URL/Supabase)
 */

require('dotenv').config()
if (process.argv.includes('--local')) {
  delete process.env.DATABASE_URL
  console.log('ðÅ¸â€œÅ’ Modo local: usando PostgreSQL local (localhost)\n')
}

const { query } = require('../lib/database')
const fs = require('fs')
const path = require('path')

// ConfiguraÃ§Ã£o
const tipo = process.argv[2] || 'completo'
const formato = process.argv[3] || 'json'

console.log('ðÅ¸â€�â€ž Iniciando backup do banco de dados...')
console.log(`ðÅ¸â€œâ€¹ Tipo: ${tipo}`)
console.log(`ðÅ¸â€œâ€ž Formato: ${formato}`)
console.log('')

async function main() {
  try {
    // Testar conexÃ£o
    console.log('ðÅ¸â€�Å’ Testando conexÃ£o com banco de dados...')
    await query('SELECT NOW()')
    console.log('âÅ“â€¦ ConexÃ£o estabelecida!')
    console.log('')

    // Gerar backup
    console.log('ðÅ¸â€œ¦ Gerando backup...')
    let backupData = {}

    switch (tipo) {
      case 'completo':
        backupData = await generateCompleteBackup()
        break
      case 'animais':
        backupData = await generateAnimalsBackup()
        break
      case 'reprodutivo':
        backupData = await generateReproductiveBackup()
        break
      case 'comercial':
        backupData = await generateCommercialBackup()
        break
      case 'financeiro':
        backupData = await generateFinancialBackup()
        break
      default:
        console.error('â�Å’ Tipo de backup invÃ¡lido!')
        console.log('Tipos vÃ¡lidos: completo, animais, reprodutivo, comercial, financeiro')
        process.exit(1)
    }

    // Criar metadados
    const backup = {
      metadata: {
        tipo,
        formato,
        dataCriacao: new Date().toISOString(),
        versao: '1.0',
        totalRegistros: countTotalRecords(backupData),
        tabelas: Object.keys(backupData)
      },
      data: backupData
    }

    // Salvar arquivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')
    const fileName = `backup_${tipo}_${timestamp[0]}_${timestamp[1].split('-')[0]}.${formato}`
    const backupDir = path.join(process.cwd(), 'backups')
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }
    
    const filePath = path.join(backupDir, fileName)

    if (formato === 'json') {
      fs.writeFileSync(filePath, JSON.stringify(backup, null, 2))
    } else if (formato === 'sql') {
      const sqlContent = generateSQLBackup(backupData)
      fs.writeFileSync(filePath, sqlContent)
    } else {
      console.error('â�Å’ Formato invÃ¡lido!')
      console.log('Formatos vÃ¡lidos: json, sql')
      process.exit(1)
    }

    // Obter tamanho do arquivo
    const stats = fs.statSync(filePath)
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2)

    console.log('âÅ“â€¦ Backup concluÃ­do com sucesso!')
    console.log('')
    console.log('ðÅ¸â€œÅ  EstatÃ­sticas:')
    console.log(`   ââ‚¬¢ Total de registros: ${backup.metadata.totalRegistros}`)
    console.log(`   ââ‚¬¢ Tabelas: ${backup.metadata.tabelas.length}`)
    console.log(`   ââ‚¬¢ Tamanho: ${sizeMB} MB`)
    console.log('')
    console.log('ðÅ¸â€™¾ Arquivo salvo:')
    console.log(`   ${filePath}`)
    console.log('')

    process.exit(0)
  } catch (error) {
    console.error('â�Å’ Erro ao gerar backup:', error.message)
    console.error(error)
    process.exit(1)
  }
}

// FunÃ§Ãµes de backup (mesmas da API)
async function generateCompleteBackup() {
  const backup = {}
  const tabelas = [
    'animais', 'custos', 'gestacoes', 'nascimentos',
    'estoque_semen', 'protocolos_aplicados', 'transferencias_embrioes',
    'protocolos_reprodutivos', 'ciclos_reprodutivos', 'relatorios_personalizados',
    'notificacoes', 'notas_fiscais', 'servicos', 'naturezas_operacao',
    'origens_receptoras'
  ]

  for (const tabela of tabelas) {
    try {
      const result = await query(`SELECT * FROM ${tabela} ORDER BY id`)
      backup[tabela] = result.rows
      console.log(`   âÅ“â€œ ${tabela}: ${result.rows.length} registros`)
    } catch (error) {
      console.log(`   âÅ¡  ${tabela}: tabela nÃ£o encontrada`)
      backup[tabela] = []
    }
  }

  return backup
}

async function generateAnimalsBackup() {
  const backup = {}
  const tabelas = ['animais', 'custos', 'gestacoes', 'nascimentos']

  for (const tabela of tabelas) {
    const result = await query(`SELECT * FROM ${tabela} ORDER BY id`)
    backup[tabela] = result.rows
    console.log(`   âÅ“â€œ ${tabela}: ${result.rows.length} registros`)
  }

  return backup
}

async function generateReproductiveBackup() {
  const backup = {}
  const tabelas = [
    'transferencias_embrioes', 'protocolos_reprodutivos', 'ciclos_reprodutivos',
    'gestacoes', 'nascimentos', 'estoque_semen', 'protocolos_aplicados'
  ]

  for (const tabela of tabelas) {
    try {
      const result = await query(`SELECT * FROM ${tabela} ORDER BY id`)
      backup[tabela] = result.rows
      console.log(`   âÅ“â€œ ${tabela}: ${result.rows.length} registros`)
    } catch (error) {
      backup[tabela] = []
    }
  }

  return backup
}

async function generateCommercialBackup() {
  const backup = {}
  const tabelas = ['notas_fiscais', 'servicos', 'naturezas_operacao', 'origens_receptoras']

  for (const tabela of tabelas) {
    try {
      const result = await query(`SELECT * FROM ${tabela} ORDER BY id`)
      backup[tabela] = result.rows
      console.log(`   âÅ“â€œ ${tabela}: ${result.rows.length} registros`)
    } catch (error) {
      backup[tabela] = []
    }
  }

  return backup
}

async function generateFinancialBackup() {
  const backup = {}
  
  const animaisResult = await query(
    'SELECT id, serie, rg, custo_aquisicao, custo_total, valor_venda FROM animais ORDER BY id'
  )
  backup.animais = animaisResult.rows
  console.log(`   âÅ“â€œ animais: ${animaisResult.rows.length} registros`)

  const custosResult = await query('SELECT * FROM custos ORDER BY id')
  backup.custos = custosResult.rows
  console.log(`   âÅ“â€œ custos: ${custosResult.rows.length} registros`)

  try {
    const nfResult = await query('SELECT * FROM notas_fiscais ORDER BY id')
    backup.notas_fiscais = nfResult.rows
    console.log(`   âÅ“â€œ notas_fiscais: ${nfResult.rows.length} registros`)

    const servicosResult = await query('SELECT * FROM servicos ORDER BY id')
    backup.servicos = servicosResult.rows
    console.log(`   âÅ“â€œ servicos: ${servicosResult.rows.length} registros`)
  } catch (error) {
    backup.notas_fiscais = []
    backup.servicos = []
  }

  return backup
}

function countTotalRecords(backupData) {
  return Object.values(backupData).reduce((total, records) => {
    return total + (Array.isArray(records) ? records.length : 0)
  }, 0)
}

function generateSQLBackup(backupData) {
  let sql = '-- Backup do Sistema Beef-Sync\n'
  sql += `-- Gerado em: ${new Date().toISOString()}\n\n`

  for (const [tableName, records] of Object.entries(backupData)) {
    if (records.length === 0) continue

    sql += `-- Tabela: ${tableName}\n`
    sql += `DELETE FROM ${tableName};\n`

    const columns = Object.keys(records[0])
    const values = records.map(record => {
      const rowValues = columns.map(col => {
        const value = record[col]
        if (value === null) return 'NULL'
        if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`
        if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`
        return value
      })
      return `(${rowValues.join(', ')})`
    })

    sql += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES\n`
    sql += values.join(',\n') + ';\n\n'
  }

  return sql
}

// Executar
main()
