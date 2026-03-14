#!/usr/bin/env node

/**
 * Script para corrigir completamente as notas fiscais
 * Remove todas as NFs e deixa apenas a real do JOAOZINHO
 */

const { query } = require('../lib/database')

async function corrigirNotasFiscais() {
  try {
    console.log('�Ÿ�� LIMPANDO TODAS AS NOTAS FISCAIS...')
    
    // Verificar conexão
    const connectionTest = await query('SELECT NOW() as timestamp')
    console.log('�œ… Conexão PostgreSQL OK:', connectionTest.rows[0].timestamp)
    
    // Limpar TUDO
    console.log('�Ÿ—‘️ Removendo todas as notas fiscais...')
    await query('DELETE FROM notas_fiscais_itens')
    await query('DELETE FROM notas_fiscais')
    console.log('�œ… Todas as notas fiscais removidas')
    
    // Inserir APENAS a NF real do JOAOZINHO
    console.log('�Ÿ“„ Inserindo APENAS a NF real do JOAOZINHO...')
    
    const nfReal = {
      numeroNF: "NF-JOAOZINHO-001",
      data: "2025-10-15",
      fornecedor: "JOAOZINHO",
      destino: null,
      naturezaOperacao: "Compra de Animais",
      observacoes: "Nota fiscal real - compra de bovinos",
      tipo: "entrada",
      tipoProduto: "bovino",
      valorTotal: 15000.00, // Valor real
      itens: [
        {
          tatuagem: "001-001",
          sexo: "Macho",
          era: "Novilho",
          raca: "Nelore",
          peso: 350,
          valorUnitario: 7500.00,
          tipoProduto: "bovino"
        },
        {
          tatuagem: "002-001", 
          sexo: "Fêmea",
          era: "Novilha",
          raca: "Nelore",
          peso: 320,
          valorUnitario: 7500.00,
          tipoProduto: "bovino"
        }
      ]
    }
    
    // Inserir nota fiscal principal
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
      nfReal.numeroNF,
      nfReal.data,
      nfReal.data,
      nfReal.fornecedor,
      nfReal.destino,
      nfReal.naturezaOperacao,
      nfReal.observacoes,
      nfReal.tipo,
      nfReal.tipoProduto,
      nfReal.valorTotal
    ])
    
    const nfId = nfResult.rows[0].id
    console.log(`�œ… NF real inserida com ID: ${nfId}`)
    
    // Inserir itens da NF real
    for (const item of nfReal.itens) {
      await query(`
        INSERT INTO notas_fiscais_itens (
          nota_fiscal_id,
          tipo_produto,
          dados_item
        ) VALUES ($1, $2, $3)
      `, [nfId, item.tipoProduto, JSON.stringify(item)])
    }
    console.log(`�œ… ${nfReal.itens.length} itens reais inseridos`)
    
    // Verificar resultado final
    const countResult = await query('SELECT COUNT(*) as total FROM notas_fiscais')
    const totalNFs = countResult.rows[0].total
    
    console.log('\n�ŸŽ‰ CORRE�‡�ƒO CONCLUÍDA!')
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
    
  } catch (error) {
    console.error('�Œ Erro na correção:', error)
    throw error
  }
}

// Executar correção
if (require.main === module) {
  corrigirNotasFiscais()
    .then(() => {
      console.log('\n�œ… CORRE�‡�ƒO EXECUTADA COM SUCESSO!')
      console.log('�Ÿ”„ Agora recarregue o app para ver os dados corretos.')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n�Œ Erro ao executar correção:', error)
      process.exit(1)
    })
}

module.exports = { corrigirNotasFiscais }
