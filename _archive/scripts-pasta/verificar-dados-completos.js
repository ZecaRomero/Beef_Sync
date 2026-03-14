#!/usr/bin/env node

/**
 * Script para verificar se h√° dados sendo carregados de outros lugares
 */

const { query } = require('../lib/database')

async function verificarDadosCompletos() {
  try {
    console.log('≈∏‚Äùç VERIFICANDO TODOS OS DADOS NO SISTEMA...')
    
    // Verificar conex√£o
    const connectionTest = await query('SELECT NOW() as timestamp')
    console.log('‚≈ì‚Ä¶ Conex√£o PostgreSQL OK:', connectionTest.rows[0].timestamp)
    
    // 1. Verificar notas fiscais
    console.log('\n≈∏‚Äú‚Äû VERIFICANDO NOTAS FISCAIS:')
    const nfs = await query('SELECT COUNT(*) as total FROM notas_fiscais')
    console.log(`Total de notas fiscais: ${nfs.rows[0].total}`)
    
    const nfsDetalhes = await query(`
      SELECT 
        id,
        numero_nf,
        fornecedor,
        tipo,
        valor_total,
        created_at
      FROM notas_fiscais 
      ORDER BY created_at DESC
    `)
    
    console.log('\nDetalhes das notas fiscais:')
    nfsDetalhes.rows.forEach((nf, index) => {
      console.log(`  ${index + 1}. ID: ${nf.id} | ${nf.numero_nf} | ${nf.fornecedor} | ${nf.tipo} | R$ ${nf.valor_total}`)
    })
    
    // 2. Verificar itens das notas fiscais
    console.log('\n≈∏‚Äú¶ VERIFICANDO ITENS DAS NOTAS FISCAIS:')
    const itens = await query('SELECT COUNT(*) as total FROM notas_fiscais_itens')
    console.log(`Total de itens: ${itens.rows[0].total}`)
    
    const itensDetalhes = await query(`
      SELECT 
        nfi.id,
        nfi.nota_fiscal_id,
        nf.numero_nf,
        nf.fornecedor
      FROM notas_fiscais_itens nfi
      LEFT JOIN notas_fiscais nf ON nf.id = nfi.nota_fiscal_id
      ORDER BY nfi.created_at DESC
    `)
    
    console.log('\nDetalhes dos itens:')
    itensDetalhes.rows.forEach((item, index) => {
      console.log(`  ${index + 1}. Item ID: ${item.id} | NF ID: ${item.nota_fiscal_id} | ${item.numero_nf} | ${item.fornecedor}`)
    })
    
    // 3. Verificar tabelas de sincroniza√ß√£o
    console.log('\n≈∏‚Äù‚Äû VERIFICANDO TABELAS DE SINCRONIZA√‚Ä°√∆íO:')
    try {
      const sync = await query('SELECT COUNT(*) as total FROM notas_fiscais_sincronizadas')
      console.log(`Total de sincroniza√ß√µes: ${sync.rows[0].total}`)
    } catch (error) {
      console.log('Tabela de sincroniza√ß√£o n√£o existe (OK)')
    }
    
    // 4. Verificar animais
    console.log('\n≈∏ê‚Äû VERIFICANDO ANIMAIS:')
    try {
      const animais = await query('SELECT COUNT(*) as total FROM animais')
      console.log(`Total de animais: ${animais.rows[0].total}`)
      
      if (animais.rows[0].total > 0) {
        const animaisDetalhes = await query(`
          SELECT 
            id,
            serie,
            rg,
            situacao,
            nota_fiscal
          FROM animais 
          ORDER BY created_at DESC
          LIMIT 5
        `)
        
        console.log('\n√≈°ltimos 5 animais:')
        animaisDetalhes.rows.forEach((animal, index) => {
          console.log(`  ${index + 1}. ${animal.serie}-${animal.rg} | ${animal.situacao} | NF: ${animal.nota_fiscal || 'N/A'}`)
        })
      }
    } catch (error) {
      console.log('Tabela de animais n√£o existe ou erro:', error.message)
    }
    
    // 5. Verificar estoque de s√™men
    console.log('\n≈∏ß™ VERIFICANDO ESTOQUE DE S√≈†MEN:')
    try {
      const semen = await query('SELECT COUNT(*) as total FROM estoque_semen')
      console.log(`Total de s√™men: ${semen.rows[0].total}`)
    } catch (error) {
      console.log('Tabela de estoque_semen n√£o existe ou erro:', error.message)
    }
    
    // 6. Verificar custos
    console.log('\n≈∏‚Äô∞ VERIFICANDO CUSTOS:')
    try {
      const custos = await query('SELECT COUNT(*) as total FROM custos')
      console.log(`Total de custos: ${custos.rows[0].total}`)
    } catch (error) {
      console.log('Tabela de custos n√£o existe ou erro:', error.message)
    }
    
    console.log('\n‚≈ì‚Ä¶ VERIFICA√‚Ä°√∆íO COMPLETA!')
    console.log('\n≈∏‚Äú≈† RESUMO:')
    console.log(`- Notas fiscais: ${nfs.rows[0].total}`)
    console.log(`- Itens: ${itens.rows[0].total}`)
    
    if (nfs.rows[0].total === 1) {
      console.log('\n≈∏≈ΩØ SITUA√‚Ä°√∆íO CORRETA:')
      console.log('- PostgreSQL tem apenas 1 nota fiscal')
      console.log('- Se o frontend mostra mais, √© problema de cache/estado')
      console.log('- Execute a limpeza completa do navegador')
    } else {
      console.log('\n‚≈°†Ô∏è PROBLEMA DETECTADO:')
      console.log('- PostgreSQL tem mais de 1 nota fiscal')
      console.log('- Execute limpeza do banco de dados')
    }
    
  } catch (error) {
    console.error('‚ù≈í Erro na verifica√ß√£o:', error)
    throw error
  }
}

// Executar verifica√ß√£o
if (require.main === module) {
  verificarDadosCompletos()
    .then(() => {
      console.log('\n‚≈ì‚Ä¶ VERIFICA√‚Ä°√∆íO EXECUTADA COM SUCESSO!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n‚ù≈í Erro ao executar verifica√ß√£o:', error)
      process.exit(1)
    })
}

module.exports = { verificarDadosCompletos }
