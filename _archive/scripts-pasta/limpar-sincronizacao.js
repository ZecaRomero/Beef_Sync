#!/usr/bin/env node

/**
 * Script para limpar dados de sincronização que estão causando problemas
 */

const { query } = require('../lib/database')

async function limparDadosSincronizacao() {
  try {
    console.log('🧹 LIMPANDO DADOS DE SINCRONIZAÇÃO...')
    
    // Verificar conexão
    const connectionTest = await query('SELECT NOW() as timestamp')
    console.log('✅ Conexão PostgreSQL OK:', connectionTest.rows[0].timestamp)
    
    // Limpar tabela de sincronização se existir
    try {
      await query('DROP TABLE IF EXISTS notas_fiscais_sincronizadas')
      console.log('✅ Tabela de sincronização removida')
    } catch (error) {
      console.log('ℹ️ Tabela de sincronização não existia')
    }
    
    // Verificar se há animais que podem estar causando o problema
    const animais = await query('SELECT COUNT(*) as total FROM animais')
    console.log(`📊 Total de animais no banco: ${animais.rows[0].total}`)
    
    // Mostrar animais que podem estar gerando NFs automáticas
    const animaisDetalhes = await query(`
      SELECT 
        serie,
        rg,
        situacao,
        fornecedor,
        nota_fiscal
      FROM animais 
      ORDER BY created_at DESC
      LIMIT 10
    `)
    
    console.log('\n📋 Últimos 10 animais (que podem gerar NFs automáticas):')
    animaisDetalhes.rows.forEach((animal, index) => {
      console.log(`  ${index + 1}. ${animal.serie}-${animal.rg} | ${animal.situacao} | ${animal.fornecedor || 'Sem fornecedor'}`)
    })
    
    // Verificar NFs atuais
    const nfsAtuais = await query('SELECT COUNT(*) as total FROM notas_fiscais')
    console.log(`\n📄 Total de notas fiscais atuais: ${nfsAtuais.rows[0].total}`)
    
    const nfsDetalhes = await query(`
      SELECT 
        id,
        numero_nf,
        fornecedor,
        tipo,
        valor_total
      FROM notas_fiscais 
      ORDER BY created_at DESC
    `)
    
    console.log('\n📋 Notas fiscais atuais:')
    nfsDetalhes.rows.forEach((nf, index) => {
      console.log(`  ${index + 1}. ${nf.numero_nf} | ${nf.fornecedor} | ${nf.tipo} | R$ ${nf.valor_total}`)
    })
    
    console.log('\n✅ LIMPEZA CONCLUÍDA!')
    console.log('🎯 Agora o botão Sincronizar não deve mais restaurar dados antigos.')
    
  } catch (error) {
    console.error('❌ Erro na limpeza:', error)
    throw error
  }
}

// Executar limpeza
if (require.main === module) {
  limparDadosSincronizacao()
    .then(() => {
      console.log('\n✅ SCRIPT EXECUTADO COM SUCESSO!')
      console.log('🔄 Agora recarregue o app - o botão Sincronizar está desabilitado.')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Erro ao executar script:', error)
      process.exit(1)
    })
}

module.exports = { limparDadosSincronizacao }
