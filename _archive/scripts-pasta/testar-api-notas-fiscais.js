const { query } = require('../lib/database')

async function testarAPI() {
  try {
    console.log('🔍 Testando busca de notas fiscais via API...\n')

    // Simular a query da API
    const result = await query(`
      SELECT 
        nf.id,
        nf.numero_nf,
        nf.data,
        nf.data_compra,
        nf.fornecedor,
        nf.destino,
        nf.cnpj_origem_destino,
        nf.natureza_operacao,
        nf.observacoes,
        nf.tipo,
        nf.tipo_produto,
        nf.valor_total,
        nf.incricao,
        nf.created_at,
        nf.updated_at,
        COUNT(nfi.id) as total_itens,
        COALESCE(SUM(
          CASE 
            WHEN nfi.tipo_produto = 'bovino' AND (nfi.dados_item::jsonb->>'modoCadastro') = 'categoria' THEN
              (CAST(nfi.dados_item::jsonb->>'quantidade' AS INTEGER) * CAST(REPLACE(nfi.dados_item::jsonb->>'valorUnitario', ',', '.') AS NUMERIC))
            WHEN nfi.tipo_produto = 'semen' THEN
              (CAST(nfi.dados_item::jsonb->>'quantidadeDoses' AS INTEGER) * CAST(REPLACE(nfi.dados_item::jsonb->>'valorUnitario', ',', '.') AS NUMERIC))
            WHEN nfi.tipo_produto = 'embriao' THEN
              (CAST(nfi.dados_item::jsonb->>'quantidadeEmbrioes' AS INTEGER) * CAST(REPLACE(nfi.dados_item::jsonb->>'valorUnitario', ',', '.') AS NUMERIC))
            ELSE
              CAST(REPLACE(nfi.dados_item::jsonb->>'valorUnitario', ',', '.') AS NUMERIC)
          END
        ), nf.valor_total, 0) as valor_total_calculado
      FROM notas_fiscais nf
      LEFT JOIN notas_fiscais_itens nfi ON nfi.nota_fiscal_id = nf.id
      GROUP BY nf.id, nf.numero_nf, nf.data, nf.data_compra, nf.fornecedor, nf.destino, 
               nf.cnpj_origem_destino, nf.natureza_operacao, nf.observacoes, nf.tipo, 
               nf.tipo_produto, nf.valor_total, nf.incricao, nf.created_at, nf.updated_at
      ORDER BY nf.data DESC, nf.created_at DESC
    `)

    console.log(`📊 Total de notas fiscais: ${result.rows.length}\n`)

    // Separar por tipo
    const entradas = result.rows.filter(nf => nf.tipo === 'entrada')
    const saidas = result.rows.filter(nf => nf.tipo === 'saida')

    console.log(`📥 Entradas: ${entradas.length}`)
    entradas.forEach(nf => {
      console.log(`   - NF ${nf.numero_nf}: R$ ${parseFloat(nf.valor_total || 0).toFixed(2)} - Data: ${nf.data || nf.data_compra || nf.created_at}`)
    })

    console.log(`\n📤 Saídas: ${saidas.length}`)
    saidas.forEach(nf => {
      console.log(`   - NF ${nf.numero_nf}: R$ ${parseFloat(nf.valor_total || 0).toFixed(2)} - Data: ${nf.data || nf.data_compra || nf.created_at}`)
      console.log(`     Destino: ${nf.destino || 'N/A'}`)
    })

    // Verificar NF 4393 especificamente
    console.log('\n🔍 Verificando NF 4393:')
    const nf4393 = result.rows.find(nf => nf.numero_nf == '4393' || nf.numero_nf == 4393)
    if (nf4393) {
      console.log(`   ✅ Encontrada!`)
      console.log(`   Tipo: ${nf4393.tipo}`)
      console.log(`   Valor: R$ ${parseFloat(nf4393.valor_total || 0).toFixed(2)}`)
      console.log(`   Data: ${nf4393.data || nf4393.data_compra || nf4393.created_at}`)
      console.log(`   Destino: ${nf4393.destino || 'N/A'}`)
    } else {
      console.log(`   ❌ Não encontrada na lista`)
    }

    // Verificar formato dos dados
    console.log('\n📋 Exemplo de dados de uma saída:')
    if (saidas.length > 0) {
      const exemplo = saidas[0]
      console.log(`   ID: ${exemplo.id}`)
      console.log(`   numero_nf: ${exemplo.numero_nf} (tipo: ${typeof exemplo.numero_nf})`)
      console.log(`   tipo: ${exemplo.tipo}`)
      console.log(`   destino: ${exemplo.destino}`)
      console.log(`   fornecedor: ${exemplo.fornecedor}`)
      console.log(`   data: ${exemplo.data}`)
      console.log(`   data_compra: ${exemplo.data_compra}`)
      console.log(`   created_at: ${exemplo.created_at}`)
      console.log(`   valor_total: ${exemplo.valor_total}`)
    }

  } catch (error) {
    console.error('❌ Erro:', error)
    throw error
  }
}

if (require.main === module) {
  testarAPI()
    .then(() => {
      console.log('\n✅ Teste concluído!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Erro:', error)
      process.exit(1)
    })
}

module.exports = { testarAPI }
