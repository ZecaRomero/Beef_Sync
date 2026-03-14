#!/usr/bin/env node

/**
 * Script para limpeza definitiva - remove TODOS os dados antigos
 */

const { query } = require('../lib/database')

async function limpezaDefinitiva() {
  try {
    console.log('�Ÿ�� LIMPEZA DEFINITIVA - REMOVENDO TODOS OS DADOS ANTIGOS...')
    
    // Verificar conexão
    const connectionTest = await query('SELECT NOW() as timestamp')
    console.log('�œ… Conexão PostgreSQL OK:', connectionTest.rows[0].timestamp)
    
    // 1. Limpar TODAS as notas fiscais
    console.log('\n�Ÿ—‘️ Removendo TODAS as notas fiscais...')
    await query('DELETE FROM notas_fiscais_itens')
    await query('DELETE FROM notas_fiscais')
    console.log('�œ… Todas as notas fiscais removidas')
    
    // 2. Limpar tabelas de sincronização
    console.log('\n�Ÿ�� Limpando tabelas de sincronização...')
    try {
      await query('DROP TABLE IF EXISTS notas_fiscais_sincronizadas')
      console.log('�œ… Tabela de sincronização removida')
    } catch (error) {
      console.log('�„�️ Tabela de sincronização não existia')
    }
    
    // 3. Inserir APENAS a NF real do JOAOZINHO
    console.log('\n�Ÿ“„ Inserindo APENAS a NF real do JOAOZINHO...')
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
      '2025-10-15', // data_compra = data da NF
      'JOAOZINHO',
      null,
      'Compra de Animais',
      'Nota fiscal real - compra de bovinos',
      'entrada',
      'bovino',
      15000.00
    ])
    
    const nfId = nfResult.rows[0].id
    console.log(`�œ… NF real inserida com ID: ${nfId}`)
    
    // 4. Inserir os 2 itens reais
    console.log('\n�Ÿ“� Inserindo itens reais...')
    
    // Item 1
    await query(`
      INSERT INTO notas_fiscais_itens (
        nota_fiscal_id,
        tatuagem,
        sexo,
        raca,
        peso,
        valor_unitario,
        quantidade,
        tipo_produto,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
    `, [
      nfId,
      'JZ-001',
      'Fêmea',
      'Nelore',
      350.0,
      7500.00,
      1,
      'bovino'
    ])
    
    // Item 2
    await query(`
      INSERT INTO notas_fiscais_itens (
        nota_fiscal_id,
        tatuagem,
        sexo,
        raca,
        peso,
        valor_unitario,
        quantidade,
        tipo_produto,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
    `, [
      nfId,
      'JZ-002',
      'Macho',
      'Nelore',
      400.0,
      7500.00,
      1,
      'bovino'
    ])
    
    console.log('�œ… 2 itens reais inseridos')
    
    // 5. Verificar resultado final
    const countResult = await query('SELECT COUNT(*) as total FROM notas_fiscais')
    const totalNFs = countResult.rows[0].total
    
    console.log('\n�ŸŽ‰ LIMPEZA DEFINITIVA CONCLUÍDA!')
    console.log(`�Ÿ“Š Total de notas fiscais no banco: ${totalNFs}`)
    
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
    
    console.log('\n�Ÿ“‹ Detalhes da NF real:')
    nfDetails.rows.forEach(nf => {
      console.log(`  ID: ${nf.id}`)
      console.log(`  Número: ${nf.numero_nf}`)
      console.log(`  Fornecedor: ${nf.fornecedor}`)
      console.log(`  Valor: R$ ${nf.valor_total}`)
      console.log(`  Tipo: ${nf.tipo}`)
      console.log(`  Itens: ${nf.total_itens}`)
    })
    
    console.log('\n�œ… AGORA O APP DEVE MOSTRAR:')
    console.log('  - 1 nota fiscal (JOAOZINHO)')
    console.log('  - Valor total: R$ 15.000,00')
    console.log('  - 2 itens')
    console.log('  - Contadores corretos')
    console.log('  - SEM dados antigos ao pressionar F5')
    
    console.log('\n�œ… LIMPEZA DEFINITIVA EXECUTADA COM SUCESSO!')
    console.log('�Ÿ”„ Agora recarregue o app - não deve mais voltar dados antigos.')
    
  } catch (error) {
    console.error('�Œ Erro na limpeza definitiva:', error)
    throw error
  }
}

// Executar limpeza
if (require.main === module) {
  limpezaDefinitiva()
    .then(() => {
      console.log('\n�œ… SCRIPT EXECUTADO COM SUCESSO!')
      console.log('�Ÿ”„ Agora recarregue o app - problema do F5 resolvido!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n�Œ Erro ao executar script:', error)
      process.exit(1)
    })
}

module.exports = { limpezaDefinitiva }
