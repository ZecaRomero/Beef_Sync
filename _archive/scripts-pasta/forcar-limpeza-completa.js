#!/usr/bin/env node

/**
 * Script para FORÇAR limpeza completa e reinicialização
 */

const { query } = require('../lib/database')

async function forcarLimpezaCompleta() {
  try {
    console.log('🚨 FORÇANDO LIMPEZA COMPLETA - SOLUÇÃO DEFINITIVA...')
    
    // Verificar conexão
    const connectionTest = await query('SELECT NOW() as timestamp')
    console.log('✅ Conexão PostgreSQL OK:', connectionTest.rows[0].timestamp)
    
    // 1. LIMPAR TUDO - TODAS as tabelas relacionadas
    console.log('\n🗑️ LIMPANDO TODAS AS TABELAS...')
    
    // Limpar todas as tabelas relacionadas
    await query('DELETE FROM notas_fiscais_itens')
    await query('DELETE FROM notas_fiscais')
    
    // Limpar tabelas de sincronização se existirem
    try {
      await query('DROP TABLE IF EXISTS notas_fiscais_sincronizadas')
      console.log('✅ Tabela de sincronização removida')
    } catch (error) {
      console.log('ℹ️ Tabela de sincronização não existia')
    }
    
    // Limpar cache de contabilidade se existir
    try {
      await query('DELETE FROM cache_contabilidade WHERE tipo = "notas_fiscais"')
      console.log('✅ Cache de contabilidade limpo')
    } catch (error) {
      console.log('ℹ️ Cache de contabilidade não existia')
    }
    
    console.log('✅ Todas as tabelas limpas')
    
    // 2. INSERIR APENAS A NF REAL DO JOAOZINHO
    console.log('\n📄 INSERINDO APENAS A NF REAL...')
    
    const nfResult = await query(`
      INSERT INTO notas_fiscais (
        numero_nf,
        data,
        data_compra,
        fornecedor,
        destino,
        natureza_operacao,
        observacoes,
        tipo,
        tipo_produto,
        valor_total,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
      RETURNING id
    `, [
      'NF-JOAOZINHO-001',
      '2025-10-15',
      '2025-10-15',
      'JOAOZINHO',
      null,
      'Compra de Animais',
      'Nota fiscal real - compra de bovinos',
      'entrada',
      'bovino',
      15000.00
    ])
    
    const nfId = nfResult.rows[0].id
    console.log(`✅ NF real inserida com ID: ${nfId}`)
    
    // 3. CRIAR TABELA DE CONTROLE PARA EVITAR PROBLEMAS FUTUROS
    console.log('\n🛡️ CRIANDO TABELA DE CONTROLE...')
    
    await query(`
      CREATE TABLE IF NOT EXISTS controle_limpeza (
        id SERIAL PRIMARY KEY,
        data_limpeza TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        tipo VARCHAR(50) NOT NULL,
        descricao TEXT,
        dados_antes INTEGER,
        dados_depois INTEGER
      )
    `)
    
    // Registrar a limpeza
    await query(`
      INSERT INTO controle_limpeza (tipo, descricao, dados_antes, dados_depois)
      VALUES ($1, $2, $3, $4)
    `, [
      'limpeza_completa',
      'Limpeza forçada - removidas todas as NFs antigas, mantida apenas JOAOZINHO',
      0, // dados_antes (já limpo)
      1  // dados_depois (apenas JOAOZINHO)
    ])
    
    console.log('✅ Controle de limpeza criado')
    
    // 4. VERIFICAR RESULTADO FINAL
    const countResult = await query('SELECT COUNT(*) as total FROM notas_fiscais')
    const totalNFs = countResult.rows[0].total
    
    console.log('\n🎉 LIMPEZA FORÇADA CONCLUÍDA!')
    console.log(`📊 Total de notas fiscais no banco: ${totalNFs}`)
    
    // Mostrar detalhes da NF real
    const nfDetails = await query(`
      SELECT 
        nf.id,
        nf.numero_nf,
        nf.fornecedor,
        nf.valor_total,
        nf.tipo,
        COUNT(nfi.id) as total_itens
      FROM notas_fiscais nf
      LEFT JOIN notas_fiscais_itens nfi ON nfi.nota_fiscal_id = nf.id
      GROUP BY nf.id, nf.numero_nf, nf.fornecedor, nf.valor_total, nf.tipo
    `)
    
    console.log('\n📋 Detalhes da NF real:')
    nfDetails.rows.forEach(nf => {
      console.log(`  ID: ${nf.id}`)
      console.log(`  Número: ${nf.numero_nf}`)
      console.log(`  Fornecedor: ${nf.fornecedor}`)
      console.log(`  Valor: R$ ${nf.valor_total}`)
      console.log(`  Tipo: ${nf.tipo}`)
      console.log(`  Itens: ${nf.total_itens}`)
    })
    
    console.log('\n✅ AGORA O APP DEVE MOSTRAR:')
    console.log('  - 1 nota fiscal (JOAOZINHO)')
    console.log('  - Valor total: R$ 15.000,00')
    console.log('  - 0 itens (estrutura simplificada)')
    console.log('  - Contadores corretos')
    console.log('  - SEM dados antigos')
    
    console.log('\n🚨 INSTRUÇÕES FINAIS:')
    console.log('1. Feche TODAS as abas do localhost:3020')
    console.log('2. Abra uma nova aba')
    console.log('3. Acesse: http://localhost:3020/notas-fiscais')
    console.log('4. Se ainda aparecer dados antigos, pressione Ctrl+Shift+R')
    
    console.log('\n✅ LIMPEZA FORÇADA EXECUTADA COM SUCESSO!')
    
  } catch (error) {
    console.error('❌ Erro na limpeza forçada:', error)
    throw error
  }
}

// Executar limpeza forçada
if (require.main === module) {
  forcarLimpezaCompleta()
    .then(() => {
      console.log('\n✅ SCRIPT EXECUTADO COM SUCESSO!')
      console.log('🔄 Agora feche todas as abas e abra uma nova!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Erro ao executar script:', error)
      process.exit(1)
    })
}

module.exports = { forcarLimpezaCompleta }