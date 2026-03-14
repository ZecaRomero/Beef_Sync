#!/usr/bin/env node

/**
 * Script de Verifica√ß√£o Completa do PostgreSQL
 * 
 * Este script verifica:
 * - Conectividade com o PostgreSQL
 * - Exist√™ncia de todas as tabelas necess√°rias
 * - Integridade dos √≠ndices
 * - Estat√≠sticas do banco de dados
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
  console.log('\n≈∏‚Äùç VERIFICA√‚Ä°√∆íO DE CONEX√∆íO COM POSTGRESQL\n')
  console.log('=' .repeat(70))
  
  try {
    const resultado = await testConnection()
    
    if (resultado.success) {
      console.log('‚≈ì‚Ä¶ Conex√£o estabelecida com sucesso!')
      console.log(`   ≈∏‚Äú‚Ä¶ Timestamp: ${resultado.timestamp}`)
      console.log(`   ≈∏‚Äî‚ÄûÔ∏è  Banco: ${resultado.database}`)
      console.log(`   ≈∏‚Äò§ Usu√°rio: ${resultado.user}`)
      console.log(`   ≈∏‚Äú≈† Vers√£o: ${resultado.version}`)
      
      if (resultado.poolInfo) {
        console.log(`   ≈∏‚Äù‚Äî Conex√µes ativas: ${resultado.poolInfo.totalCount}`)
        console.log(`   ≈∏‚Äô§ Conex√µes idle: ${resultado.poolInfo.idleCount}`)
        console.log(`   ‚è≥ Conex√µes esperando: ${resultado.poolInfo.waitingCount}`)
      }
      
      return true
    } else {
      console.log('‚ù≈í Falha na conex√£o!')
      console.log(`   ‚≈°†Ô∏è  Erro: ${resultado.error}`)
      console.log(`   ≈∏‚Äù¢ C√≥digo: ${resultado.code}`)
      return false
    }
  } catch (error) {
    console.log('‚ù≈í Erro ao testar conex√£o:', error.message)
    return false
  }
}

async function verificarTabelas() {
  console.log('\n≈∏‚Äú‚Äπ VERIFICANDO TABELAS DO BANCO DE DADOS\n')
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
        console.log(`   ‚≈ì‚Ä¶ ${tabela.padEnd(30)} - ${count} registro(s)`)
      } else {
        console.log(`   ‚ù≈í ${tabela.padEnd(30)} - TABELA N√∆íO ENCONTRADA!`)
        todasEncontradas = false
      }
    }
    
    // Listar tabelas extras
    const tabelasExtras = tabelasExistentes.filter(t => !TABELAS_REQUERIDAS.includes(t))
    if (tabelasExtras.length > 0) {
      console.log(`\n   ‚‚ÄûπÔ∏è  Tabelas adicionais encontradas:`)
      tabelasExtras.forEach(t => console.log(`      - ${t}`))
    }
    
    return todasEncontradas
  } catch (error) {
    console.log('‚ù≈í Erro ao verificar tabelas:', error.message)
    return false
  }
}

async function verificarIndices() {
  console.log('\n≈∏‚Äùç VERIFICANDO √çNDICES DO BANCO DE DADOS\n')
  console.log('=' .repeat(70))
  
  try {
    const result = await query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY indexname
    `)
    
    const indicesExistentes = result.rows.map(row => row.indexname)
    
    console.log(`   Total de √≠ndices encontrados: ${indicesExistentes.length}\n`)
    
    let todosEncontrados = true
    
    for (const indice of INDICES_REQUERIDOS) {
      if (indicesExistentes.includes(indice)) {
        console.log(`   ‚≈ì‚Ä¶ ${indice}`)
      } else {
        console.log(`   ‚≈°†Ô∏è  ${indice} - N√∆íO ENCONTRADO (n√£o cr√≠tico)`)
        todosEncontrados = false
      }
    }
    
    return todosEncontrados
  } catch (error) {
    console.log('‚ù≈í Erro ao verificar √≠ndices:', error.message)
    return false
  }
}

async function obterEstatisticas() {
  console.log('\n≈∏‚Äú≈† ESTAT√çSTICAS DO BANCO DE DADOS\n')
  console.log('=' .repeat(70))
  
  try {
    // Total de animais
    const animais = await query('SELECT COUNT(*) as total FROM animais')
    const animaisAtivos = await query("SELECT COUNT(*) as total FROM animais WHERE situacao = 'Ativo'")
    
    // Total de nascimentos
    const nascimentos = await query('SELECT COUNT(*) as total FROM nascimentos')
    
    // Total de custos
    const custos = await query('SELECT COUNT(*) as total, COALESCE(SUM(valor), 0) as soma FROM custos')
    
    // Total de estoque de s√™men
    const semen = await query('SELECT COUNT(*) as total, COALESCE(SUM(doses_disponiveis), 0) as doses FROM estoque_semen')
    
    // Total de notas fiscais
    const nfs = await query('SELECT COUNT(*) as total FROM notas_fiscais')
    
    // Total de transfer√™ncias de embri√µes
    const tes = await query('SELECT COUNT(*) as total FROM transferencias_embrioes')
    
    console.log(`   ≈∏ê‚Äû Animais:`)
    console.log(`      - Total: ${animais.rows[0].total}`)
    console.log(`      - Ativos: ${animaisAtivos.rows[0].total}`)
    
    console.log(`\n   ≈∏‚Äò∂ Nascimentos: ${nascimentos.rows[0].total}`)
    
    console.log(`\n   ≈∏‚Äô∞ Custos:`)
    console.log(`      - Total de registros: ${custos.rows[0].total}`)
    console.log(`      - Soma total: R$ ${parseFloat(custos.rows[0].soma).toFixed(2)}`)
    
    console.log(`\n   ≈∏ß™ Estoque de S√™men:`)
    console.log(`      - Touros cadastrados: ${semen.rows[0].total}`)
    console.log(`      - Doses dispon√≠veis: ${semen.rows[0].doses}`)
    
    console.log(`\n   ≈∏‚Äú‚Äû Notas Fiscais: ${nfs.rows[0].total}`)
    
    console.log(`\n   ≈∏ß¨ Transfer√™ncias de Embri√µes: ${tes.rows[0].total}`)
    
    return true
  } catch (error) {
    console.log('‚ù≈í Erro ao obter estat√≠sticas:', error.message)
    return false
  }
}

async function verificarIntegridade() {
  console.log('\n≈∏‚Äùê VERIFICANDO INTEGRIDADE REFERENCIAL\n')
  console.log('=' .repeat(70))
  
  try {
    // Verificar custos √≥rf√£os (sem animal correspondente)
    const custosOrfaos = await query(`
      SELECT COUNT(*) as total 
      FROM custos c 
      LEFT JOIN animais a ON c.animal_id = a.id 
      WHERE a.id IS NULL
    `)
    
    if (parseInt(custosOrfaos.rows[0].total) > 0) {
      console.log(`   ‚≈°†Ô∏è  ${custosOrfaos.rows[0].total} custo(s) √≥rf√£o(s) encontrado(s)`)
    } else {
      console.log(`   ‚≈ì‚Ä¶ Integridade de custos OK`)
    }
    
    // Verificar protocolos aplicados √≥rf√£os
    const protocolosOrfaos = await query(`
      SELECT COUNT(*) as total 
      FROM protocolos_aplicados pa 
      LEFT JOIN animais a ON pa.animal_id = a.id 
      WHERE a.id IS NULL
    `)
    
    if (parseInt(protocolosOrfaos.rows[0].total) > 0) {
      console.log(`   ‚≈°†Ô∏è  ${protocolosOrfaos.rows[0].total} protocolo(s) aplicado(s) √≥rf√£o(s)`)
    } else {
      console.log(`   ‚≈ì‚Ä¶ Integridade de protocolos aplicados OK`)
    }
    
    console.log(`   ‚≈ì‚Ä¶ Verifica√ß√£o de integridade conclu√≠da`)
    
    return true
  } catch (error) {
    console.log('‚ù≈í Erro ao verificar integridade:', error.message)
    return false
  }
}

async function main() {
  console.log('\n‚‚Ä¢‚Äù‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢‚Äî')
  console.log('‚‚Ä¢‚Äò       BEEF SYNC - VERIFICA√‚Ä°√∆íO COMPLETA DO POSTGRESQL            ‚‚Ä¢‚Äò')
  console.log('‚‚Ä¢≈°‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ù')
  
  const resultados = {
    conexao: false,
    tabelas: false,
    indices: false,
    estatisticas: false,
    integridade: false
  }
  
  // 1. Verificar conex√£o
  resultados.conexao = await verificarConexao()
  
  if (!resultados.conexao) {
    console.log('\n‚ù≈í FALHA: N√£o foi poss√≠vel conectar ao PostgreSQL!')
    console.log('\n≈∏‚Äô° Verifique se:')
    console.log('   - O PostgreSQL est√° rodando')
    console.log('   - As credenciais em lib/database.js est√£o corretas')
    console.log('   - O banco de dados "estoque_semen" existe')
    process.exit(1)
  }
  
  // 2. Verificar tabelas
  resultados.tabelas = await verificarTabelas()
  
  if (!resultados.tabelas) {
    console.log('\n‚≈°†Ô∏è  Algumas tabelas est√£o faltando!')
    console.log('≈∏‚Äô° Execute: npm run db:init')
  }
  
  // 3. Verificar √≠ndices
  resultados.indices = await verificarIndices()
  
  // 4. Obter estat√≠sticas
  resultados.estatisticas = await obterEstatisticas()
  
  // 5. Verificar integridade
  resultados.integridade = await verificarIntegridade()
  
  // Resumo final
  console.log('\n' + '=' .repeat(70))
  console.log('≈∏‚Äú‚Äπ RESUMO DA VERIFICA√‚Ä°√∆íO')
  console.log('=' .repeat(70))
  
  console.log(`   ${resultados.conexao ? '‚≈ì‚Ä¶' : '‚ù≈í'} Conex√£o com PostgreSQL`)
  console.log(`   ${resultados.tabelas ? '‚≈ì‚Ä¶' : '‚≈°†Ô∏è '} Tabelas do banco`)
  console.log(`   ${resultados.indices ? '‚≈ì‚Ä¶' : '‚≈°†Ô∏è '} √çndices do banco`)
  console.log(`   ${resultados.estatisticas ? '‚≈ì‚Ä¶' : '‚ù≈í'} Estat√≠sticas`)
  console.log(`   ${resultados.integridade ? '‚≈ì‚Ä¶' : '‚≈°†Ô∏è '} Integridade referencial`)
  
  const todasOK = Object.values(resultados).every(r => r === true)
  
  if (todasOK) {
    console.log('\n‚≈ì‚Ä¶ SISTEMA 100% FUNCIONAL E CONECTADO AO POSTGRESQL!')
  } else if (resultados.conexao && resultados.tabelas) {
    console.log('\n‚≈°†Ô∏è  Sistema funcional com pequenas inconsist√™ncias')
  } else {
    console.log('\n‚ù≈í Sistema com problemas cr√≠ticos!')
  }
  
  console.log('\n' + '=' .repeat(70))
  console.log('≈∏≈Ω‚Ä∞ Verifica√ß√£o conclu√≠da!')
  console.log('=' .repeat(70) + '\n')
  
  process.exit(todasOK ? 0 : 1)
}

// Executar script
main().catch(error => {
  console.error('\n‚ù≈í Erro fatal:', error.message)
  process.exit(1)
})

