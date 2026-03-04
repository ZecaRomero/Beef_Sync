#!/usr/bin/env node

/**
 * Script de Verificação Completa do PostgreSQL
 * 
 * Este script verifica:
 * - Conectividade com o PostgreSQL
 * - Existência de todas as tabelas necessárias
 * - Integridade dos índices
 * - Estatísticas do banco de dados
 */

const { testConnection, query, createTables, getPoolInfo } = require('../lib/database')
const logger = require('../utils/logger.cjs')

const TABELAS_REQUERIDAS = [
  'animais',
  'custos',
  'gestacoes',
  'nascimentos',
  'estoque_semen',
  'transferencias_embrioes',
  'servicos',
  'notificacoes',
  'protocolos_reprodutivos',
  'protocolos_aplicados',
  'ciclos_reprodutivos',
  'relatorios_personalizados',
  'notas_fiscais',
  'naturezas_operacao',
  'origens_receptoras'
]

const INDICES_REQUERIDOS = [
  'idx_animais_serie_rg',
  'idx_animais_situacao',
  'idx_animais_raca',
  'idx_custos_animal_id',
  'idx_gestacoes_situacao',
  'idx_semen_status',
  'idx_semen_nome_touro',
  'idx_nf_numero',
  'idx_nf_data',
  'idx_te_numero',
  'idx_te_data',
  'idx_te_status',
  'idx_servicos_animal_id',
  'idx_servicos_tipo',
  'idx_servicos_data',
  'idx_notificacoes_lida',
  'idx_notificacoes_tipo',
  'idx_protocolos_aplicados_animal_id',
  'idx_ciclos_animal_id'
]

async function verificarConexao() {
  console.log('\n🔍 VERIFICAÇÃO DE CONEXÃO COM POSTGRESQL\n')
  console.log('=' .repeat(70))
  
  try {
    const resultado = await testConnection()
    
    if (resultado.success) {
      console.log('✅ Conexão estabelecida com sucesso!')
      console.log(`   📅 Timestamp: ${resultado.timestamp}`)
      console.log(`   🗄️  Banco: ${resultado.database}`)
      console.log(`   👤 Usuário: ${resultado.user}`)
      console.log(`   📊 Versão: ${resultado.version}`)
      
      if (resultado.poolInfo) {
        console.log(`   🔗 Conexões ativas: ${resultado.poolInfo.totalCount}`)
        console.log(`   💤 Conexões idle: ${resultado.poolInfo.idleCount}`)
        console.log(`   ⏳ Conexões esperando: ${resultado.poolInfo.waitingCount}`)
      }
      
      return true
    } else {
      console.log('❌ Falha na conexão!')
      console.log(`   ⚠️  Erro: ${resultado.error}`)
      console.log(`   🔢 Código: ${resultado.code}`)
      return false
    }
  } catch (error) {
    console.log('❌ Erro ao testar conexão:', error.message)
    return false
  }
}

async function verificarTabelas() {
  console.log('\n📋 VERIFICANDO TABELAS DO BANCO DE DADOS\n')
  console.log('=' .repeat(70))
  
  try {
    const result = await query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `)
    
    const tabelasExistentes = result.rows.map(row => row.tablename)
    
    console.log(`   Total de tabelas encontradas: ${tabelasExistentes.length}\n`)
    
    let todasEncontradas = true
    
    for (const tabela of TABELAS_REQUERIDAS) {
      if (tabelasExistentes.includes(tabela)) {
        // Contar registros na tabela
        const countResult = await query(`SELECT COUNT(*) as count FROM ${tabela}`)
        const count = parseInt(countResult.rows[0].count)
        console.log(`   ✅ ${tabela.padEnd(30)} - ${count} registro(s)`)
      } else {
        console.log(`   ❌ ${tabela.padEnd(30)} - TABELA NÃO ENCONTRADA!`)
        todasEncontradas = false
      }
    }
    
    // Listar tabelas extras
    const tabelasExtras = tabelasExistentes.filter(t => !TABELAS_REQUERIDAS.includes(t))
    if (tabelasExtras.length > 0) {
      console.log(`\n   ℹ️  Tabelas adicionais encontradas:`)
      tabelasExtras.forEach(t => console.log(`      - ${t}`))
    }
    
    return todasEncontradas
  } catch (error) {
    console.log('❌ Erro ao verificar tabelas:', error.message)
    return false
  }
}

async function verificarIndices() {
  console.log('\n🔍 VERIFICANDO ÍNDICES DO BANCO DE DADOS\n')
  console.log('=' .repeat(70))
  
  try {
    const result = await query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY indexname
    `)
    
    const indicesExistentes = result.rows.map(row => row.indexname)
    
    console.log(`   Total de índices encontrados: ${indicesExistentes.length}\n`)
    
    let todosEncontrados = true
    
    for (const indice of INDICES_REQUERIDOS) {
      if (indicesExistentes.includes(indice)) {
        console.log(`   ✅ ${indice}`)
      } else {
        console.log(`   ⚠️  ${indice} - NÃO ENCONTRADO (não crítico)`)
        todosEncontrados = false
      }
    }
    
    return todosEncontrados
  } catch (error) {
    console.log('❌ Erro ao verificar índices:', error.message)
    return false
  }
}

async function obterEstatisticas() {
  console.log('\n📊 ESTATÍSTICAS DO BANCO DE DADOS\n')
  console.log('=' .repeat(70))
  
  try {
    // Total de animais
    const animais = await query('SELECT COUNT(*) as total FROM animais')
    const animaisAtivos = await query("SELECT COUNT(*) as total FROM animais WHERE situacao = 'Ativo'")
    
    // Total de nascimentos
    const nascimentos = await query('SELECT COUNT(*) as total FROM nascimentos')
    
    // Total de custos
    const custos = await query('SELECT COUNT(*) as total, COALESCE(SUM(valor), 0) as soma FROM custos')
    
    // Total de estoque de sêmen
    const semen = await query('SELECT COUNT(*) as total, COALESCE(SUM(doses_disponiveis), 0) as doses FROM estoque_semen')
    
    // Total de notas fiscais
    const nfs = await query('SELECT COUNT(*) as total FROM notas_fiscais')
    
    // Total de transferências de embriões
    const tes = await query('SELECT COUNT(*) as total FROM transferencias_embrioes')
    
    console.log(`   🐄 Animais:`)
    console.log(`      - Total: ${animais.rows[0].total}`)
    console.log(`      - Ativos: ${animaisAtivos.rows[0].total}`)
    
    console.log(`\n   👶 Nascimentos: ${nascimentos.rows[0].total}`)
    
    console.log(`\n   💰 Custos:`)
    console.log(`      - Total de registros: ${custos.rows[0].total}`)
    console.log(`      - Soma total: R$ ${parseFloat(custos.rows[0].soma).toFixed(2)}`)
    
    console.log(`\n   🧪 Estoque de Sêmen:`)
    console.log(`      - Touros cadastrados: ${semen.rows[0].total}`)
    console.log(`      - Doses disponíveis: ${semen.rows[0].doses}`)
    
    console.log(`\n   📄 Notas Fiscais: ${nfs.rows[0].total}`)
    
    console.log(`\n   🧬 Transferências de Embriões: ${tes.rows[0].total}`)
    
    return true
  } catch (error) {
    console.log('❌ Erro ao obter estatísticas:', error.message)
    return false
  }
}

async function verificarIntegridade() {
  console.log('\n🔐 VERIFICANDO INTEGRIDADE REFERENCIAL\n')
  console.log('=' .repeat(70))
  
  try {
    // Verificar custos órfãos (sem animal correspondente)
    const custosOrfaos = await query(`
      SELECT COUNT(*) as total 
      FROM custos c 
      LEFT JOIN animais a ON c.animal_id = a.id 
      WHERE a.id IS NULL
    `)
    
    if (parseInt(custosOrfaos.rows[0].total) > 0) {
      console.log(`   ⚠️  ${custosOrfaos.rows[0].total} custo(s) órfão(s) encontrado(s)`)
    } else {
      console.log(`   ✅ Integridade de custos OK`)
    }
    
    // Verificar protocolos aplicados órfãos
    const protocolosOrfaos = await query(`
      SELECT COUNT(*) as total 
      FROM protocolos_aplicados pa 
      LEFT JOIN animais a ON pa.animal_id = a.id 
      WHERE a.id IS NULL
    `)
    
    if (parseInt(protocolosOrfaos.rows[0].total) > 0) {
      console.log(`   ⚠️  ${protocolosOrfaos.rows[0].total} protocolo(s) aplicado(s) órfão(s)`)
    } else {
      console.log(`   ✅ Integridade de protocolos aplicados OK`)
    }
    
    console.log(`   ✅ Verificação de integridade concluída`)
    
    return true
  } catch (error) {
    console.log('❌ Erro ao verificar integridade:', error.message)
    return false
  }
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════════╗')
  console.log('║       BEEF SYNC - VERIFICAÇÃO COMPLETA DO POSTGRESQL            ║')
  console.log('╚══════════════════════════════════════════════════════════════════╝')
  
  const resultados = {
    conexao: false,
    tabelas: false,
    indices: false,
    estatisticas: false,
    integridade: false
  }
  
  // 1. Verificar conexão
  resultados.conexao = await verificarConexao()
  
  if (!resultados.conexao) {
    console.log('\n❌ FALHA: Não foi possível conectar ao PostgreSQL!')
    console.log('\n💡 Verifique se:')
    console.log('   - O PostgreSQL está rodando')
    console.log('   - As credenciais em lib/database.js estão corretas')
    console.log('   - O banco de dados "estoque_semen" existe')
    process.exit(1)
  }
  
  // 2. Verificar tabelas
  resultados.tabelas = await verificarTabelas()
  
  if (!resultados.tabelas) {
    console.log('\n⚠️  Algumas tabelas estão faltando!')
    console.log('💡 Execute: npm run db:init')
  }
  
  // 3. Verificar índices
  resultados.indices = await verificarIndices()
  
  // 4. Obter estatísticas
  resultados.estatisticas = await obterEstatisticas()
  
  // 5. Verificar integridade
  resultados.integridade = await verificarIntegridade()
  
  // Resumo final
  console.log('\n' + '=' .repeat(70))
  console.log('📋 RESUMO DA VERIFICAÇÃO')
  console.log('=' .repeat(70))
  
  console.log(`   ${resultados.conexao ? '✅' : '❌'} Conexão com PostgreSQL`)
  console.log(`   ${resultados.tabelas ? '✅' : '⚠️ '} Tabelas do banco`)
  console.log(`   ${resultados.indices ? '✅' : '⚠️ '} Índices do banco`)
  console.log(`   ${resultados.estatisticas ? '✅' : '❌'} Estatísticas`)
  console.log(`   ${resultados.integridade ? '✅' : '⚠️ '} Integridade referencial`)
  
  const todasOK = Object.values(resultados).every(r => r === true)
  
  if (todasOK) {
    console.log('\n✅ SISTEMA 100% FUNCIONAL E CONECTADO AO POSTGRESQL!')
  } else if (resultados.conexao && resultados.tabelas) {
    console.log('\n⚠️  Sistema funcional com pequenas inconsistências')
  } else {
    console.log('\n❌ Sistema com problemas críticos!')
  }
  
  console.log('\n' + '=' .repeat(70))
  console.log('🎉 Verificação concluída!')
  console.log('=' .repeat(70) + '\n')
  
  process.exit(todasOK ? 0 : 1)
}

// Executar script
main().catch(error => {
  console.error('\n❌ Erro fatal:', error.message)
  process.exit(1)
})

