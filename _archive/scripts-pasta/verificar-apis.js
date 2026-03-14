#!/usr/bin/env node

/**
 * Script de Verifica√ß√£o de APIs
 * Testa todas as conex√µes e APIs do sistema Beef-Sync
 */

const { testConnection, query } = require('../lib/database')

// Cores para console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function header(message) {
  console.log('\n' + '='.repeat(60))
  log(message, 'bright')
  console.log('='.repeat(60) + '\n')
}

async function verificarPostgreSQL() {
  header('≈∏‚Äù≈í Verificando Conex√£o PostgreSQL')
  
  try {
    const result = await testConnection()
    
    if (result.success) {
      log('‚≈ì‚Ä¶ PostgreSQL Conectado com Sucesso!', 'green')
      log(`   Database: ${result.database}`, 'cyan')
      log(`   Usu√°rio: ${result.user}`, 'cyan')
      log(`   Vers√£o: ${result.version}`, 'cyan')
      log(`   Timestamp: ${new Date(result.timestamp).toLocaleString('pt-BR')}`, 'cyan')
      
      if (result.poolInfo) {
        log(`\n≈∏‚Äú≈† Pool de Conex√µes:`, 'blue')
        log(`   Status: ${result.poolInfo.connected ? 'Conectado' : 'Desconectado'}`, 'cyan')
        log(`   Total: ${result.poolInfo.totalCount}`, 'cyan')
        log(`   Ociosas: ${result.poolInfo.idleCount}`, 'cyan')
        log(`   Aguardando: ${result.poolInfo.waitingCount}`, 'cyan')
      }
      
      return true
    } else {
      log('‚ù≈í Falha na Conex√£o PostgreSQL', 'red')
      log(`   Erro: ${result.error}`, 'yellow')
      log(`   C√≥digo: ${result.code}`, 'yellow')
      return false
    }
  } catch (error) {
    log('‚ù≈í Erro ao Conectar ao PostgreSQL', 'red')
    log(`   ${error.message}`, 'yellow')
    return false
  }
}

async function verificarTabelas() {
  header('≈∏‚Äú‚Äπ Verificando Tabelas do Banco de Dados')
  
  try {
    const tabelas = [
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
    
    log('Verificando exist√™ncia das tabelas...\n', 'blue')
    
    for (const tabela of tabelas) {
      try {
        const result = await query(
          `SELECT COUNT(*) as total FROM ${tabela} LIMIT 1`
        )
        const total = parseInt(result.rows[0]?.total || 0)
        log(`‚≈ì‚Ä¶ ${tabela.padEnd(30)} - ${total} registro(s)`, 'green')
      } catch (error) {
        log(`‚ù≈í ${tabela.padEnd(30)} - N√∆íO EXISTE`, 'red')
      }
    }
    
    return true
  } catch (error) {
    log(`‚ù≈í Erro ao verificar tabelas: ${error.message}`, 'red')
    return false
  }
}

async function verificarEstatisticas() {
  header('≈∏‚Äú≈† Verificando Estat√≠sticas do Sistema')
  
  try {
    // Animais
    const animaisResult = await query('SELECT COUNT(*) as total FROM animais')
    const totalAnimais = parseInt(animaisResult.rows[0]?.total || 0)
    
    const ativosResult = await query(
      "SELECT COUNT(*) as total FROM animais WHERE situacao = 'Ativo'"
    )
    const totalAtivos = parseInt(ativosResult.rows[0]?.total || 0)
    
    // Nascimentos
    const nascimentosResult = await query('SELECT COUNT(*) as total FROM nascimentos')
    const totalNascimentos = parseInt(nascimentosResult.rows[0]?.total || 0)
    
    // S√™men
    const semenResult = await query(`
      SELECT 
        COUNT(*) as total_touros,
        COALESCE(SUM(doses_disponiveis), 0) as total_doses
      FROM estoque_semen
      WHERE status = 'disponivel'
    `)
    const semenStats = semenResult.rows[0] || { total_touros: 0, total_doses: 0 }
    
    // Custos
    const custosResult = await query('SELECT COUNT(*) as total, COALESCE(SUM(valor), 0) as soma FROM custos')
    const custosStats = custosResult.rows[0] || { total: 0, soma: 0 }
    
    log('≈∏ê‚Äû Animais:', 'blue')
    log(`   Total: ${totalAnimais}`, 'cyan')
    log(`   Ativos: ${totalAtivos}`, 'cyan')
    log(`   Inativos: ${totalAnimais - totalAtivos}`, 'cyan')
    
    log('\n≈∏‚Äò∂ Nascimentos:', 'blue')
    log(`   Total: ${totalNascimentos}`, 'cyan')
    
    log('\n≈∏‚Äô‚Ä∞ Estoque de S√™men:', 'blue')
    log(`   Touros: ${semenStats.total_touros}`, 'cyan')
    log(`   Doses Dispon√≠veis: ${semenStats.total_doses}`, 'cyan')
    
    log('\n≈∏‚Äô∞ Custos:', 'blue')
    log(`   Total de Registros: ${custosStats.total}`, 'cyan')
    log(`   Valor Total: R$ ${parseFloat(custosStats.soma).toFixed(2)}`, 'cyan')
    
    return true
  } catch (error) {
    log(`‚ù≈í Erro ao verificar estat√≠sticas: ${error.message}`, 'red')
    return false
  }
}

async function verificarMarketAPI() {
  header('≈∏‚ÄúÀÜ Verificando Market API (Simula√ß√£o)')
  
  try {
    const { MarketAPI } = require('../services/marketAPI')
    
    log('Testando obten√ß√£o de pre√ßos...', 'blue')
    const prices = await MarketAPI.getCattlePrices()
    
    if (prices && prices.prices) {
      log('‚≈ì‚Ä¶ Market API Funcional!', 'green')
      log('\n≈∏‚Äô∞ Pre√ßos Atuais:', 'blue')
      log(`   Boi Gordo: R$ ${prices.prices.boi_gordo.price}/arroba`, 'cyan')
      log(`   Vaca Gorda: R$ ${prices.prices.vaca_gorda.price}/arroba`, 'cyan')
      log(`   Bezerro: R$ ${prices.prices.bezerro_macho.price}/cabe√ßa`, 'cyan')
      
      log('\n≈∏‚Äú≈† √çndices:', 'blue')
      log(`   D√≥lar: R$ ${prices.indices.dolar.value.toFixed(2)}`, 'cyan')
      log(`   Milho: R$ ${prices.indices.milho.value.toFixed(2)}/saca`, 'cyan')
      
      log('\n≈∏‚Ä¢ê Status do Mercado:', 'blue')
      log(`   ${prices.marketStatus.session.label}`, 
        prices.marketStatus.session.status === 'open' ? 'green' : 'yellow')
      
      return true
    } else {
      log('‚ù≈í Market API n√£o retornou dados v√°lidos', 'red')
      return false
    }
  } catch (error) {
    log(`‚ù≈í Erro ao verificar Market API: ${error.message}`, 'red')
    return false
  }
}

async function verificarIndices() {
  header('≈∏‚Äùç Verificando √çndices do Banco de Dados')
  
  try {
    const result = await query(`
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM
        pg_indexes
      WHERE
        schemaname = 'public'
      ORDER BY
        tablename,
        indexname
    `)
    
    if (result.rows.length > 0) {
      log(`‚≈ì‚Ä¶ Encontrados ${result.rows.length} √≠ndices\n`, 'green')
      
      const indicesPorTabela = {}
      result.rows.forEach(row => {
        if (!indicesPorTabela[row.tablename]) {
          indicesPorTabela[row.tablename] = []
        }
        indicesPorTabela[row.tablename].push(row.indexname)
      })
      
      Object.keys(indicesPorTabela).sort().forEach(tabela => {
        log(`≈∏‚Äú‚Äπ ${tabela}:`, 'blue')
        indicesPorTabela[tabela].forEach(indice => {
          log(`   - ${indice}`, 'cyan')
        })
      })
      
      return true
    } else {
      log('‚≈°†Ô∏è  Nenhum √≠ndice encontrado', 'yellow')
      return false
    }
  } catch (error) {
    log(`‚ù≈í Erro ao verificar √≠ndices: ${error.message}`, 'red')
    return false
  }
}

async function verificarAlertas() {
  header('‚≈°†Ô∏è  Verificando Alertas do Sistema')
  
  try {
    const alertas = []
    
    // Verificar estoque baixo
    const lowStock = await query(`
      SELECT nome_touro, doses_disponiveis 
      FROM estoque_semen 
      WHERE doses_disponiveis < 5 AND doses_disponiveis > 0
      ORDER BY doses_disponiveis ASC
    `)
    
    if (lowStock.rows.length > 0) {
      alertas.push({
        tipo: 'warning',
        mensagem: `${lowStock.rows.length} touro(s) com estoque baixo (< 5 doses)`,
        dados: lowStock.rows
      })
    }
    
    // Verificar s√™men esgotado
    const outOfStock = await query(`
      SELECT nome_touro 
      FROM estoque_semen 
      WHERE doses_disponiveis = 0
    `)
    
    if (outOfStock.rows.length > 0) {
      alertas.push({
        tipo: 'error',
        mensagem: `${outOfStock.rows.length} touro(s) com estoque esgotado`,
        dados: outOfStock.rows
      })
    }
    
    // Verificar s√™men vencendo (pr√≥ximos 30 dias)
    const expiringSoon = await query(`
      SELECT nome_touro, data_validade 
      FROM estoque_semen 
      WHERE data_validade IS NOT NULL 
        AND data_validade BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
      ORDER BY data_validade ASC
    `)
    
    if (expiringSoon.rows.length > 0) {
      alertas.push({
        tipo: 'warning',
        mensagem: `${expiringSoon.rows.length} lote(s) de s√™men vencendo em 30 dias`,
        dados: expiringSoon.rows
      })
    }
    
    if (alertas.length === 0) {
      log('‚≈ì‚Ä¶ Nenhum alerta no momento', 'green')
    } else {
      log(`‚≈°†Ô∏è  ${alertas.length} alerta(s) encontrado(s):\n`, 'yellow')
      alertas.forEach((alerta, index) => {
        const cor = alerta.tipo === 'error' ? 'red' : 'yellow'
        log(`${index + 1}. ${alerta.mensagem}`, cor)
        if (alerta.dados.length <= 3) {
          alerta.dados.forEach(item => {
            log(`   - ${item.nome_touro || item.serie} ${item.doses_disponiveis !== undefined ? `(${item.doses_disponiveis} doses)` : ''} ${item.data_validade ? `(vence em ${new Date(item.data_validade).toLocaleDateString('pt-BR')})` : ''}`, 'cyan')
          })
        }
      })
    }
    
    return true
  } catch (error) {
    log(`‚ù≈í Erro ao verificar alertas: ${error.message}`, 'red')
    return false
  }
}

async function resumoFinal(resultados) {
  header('≈∏‚Äúù Resumo da Verifica√ß√£o')
  
  const total = resultados.length
  const sucesso = resultados.filter(r => r.status).length
  const falha = total - sucesso
  
  log(`Total de Verifica√ß√µes: ${total}`, 'blue')
  log(`‚≈ì‚Ä¶ Sucesso: ${sucesso}`, 'green')
  if (falha > 0) {
    log(`‚ù≈í Falha: ${falha}`, 'red')
  }
  
  console.log('\n' + '='.repeat(60))
  
  if (falha === 0) {
    log('\n≈∏≈Ω‚Ä∞ TODAS AS APIS EST√∆íO CONECTADAS E FUNCIONAIS! ≈∏≈Ω‚Ä∞\n', 'green')
  } else {
    log('\n‚≈°†Ô∏è  ALGUMAS VERIFICA√‚Ä°√‚Ä¢ES FALHARAM. REVISE OS LOGS ACIMA.\n', 'yellow')
  }
  
  log(`Data/Hora: ${new Date().toLocaleString('pt-BR')}`, 'cyan')
  console.log('')
}

// Fun√ß√£o principal
async function main() {
  console.clear()
  
  log(`
  ‚‚Ä¢‚Äù‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢‚Äî
  ‚‚Ä¢‚Äò         BEEF-SYNC - VERIFICA√‚Ä°√∆íO DE APIS                 ‚‚Ä¢‚Äò
  ‚‚Ä¢‚Äò         Sistema de Gest√£o Pecu√°ria                      ‚‚Ä¢‚Äò
  ‚‚Ä¢≈°‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ù
  `, 'bright')
  
  const resultados = []
  
  // PostgreSQL
  resultados.push({
    nome: 'PostgreSQL Connection',
    status: await verificarPostgreSQL()
  })
  
  if (resultados[0].status) {
    // Tabelas
    resultados.push({
      nome: 'Database Tables',
      status: await verificarTabelas()
    })
    
    // Estat√≠sticas
    resultados.push({
      nome: 'System Statistics',
      status: await verificarEstatisticas()
    })
    
    // √çndices
    resultados.push({
      nome: 'Database Indexes',
      status: await verificarIndices()
    })
    
    // Alertas
    resultados.push({
      nome: 'System Alerts',
      status: await verificarAlertas()
    })
  }
  
  // Market API
  resultados.push({
    nome: 'Market API',
    status: await verificarMarketAPI()
  })
  
  // Resumo
  await resumoFinal(resultados)
  
  process.exit(resultados.every(r => r.status) ? 0 : 1)
}

// Executar
main().catch(error => {
  log(`\n‚ù≈í Erro fatal: ${error.message}`, 'red')
  console.error(error)
  process.exit(1)
})

