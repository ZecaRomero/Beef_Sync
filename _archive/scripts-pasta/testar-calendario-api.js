const pool = require('../lib/database')

async function testarCalendario() {
  try {
    console.log('🔍 Testando query do calendário...\n')
    
    const sqlReceptoras = `
      SELECT DISTINCT
        nf.id as nf_id,
        nf.numero_nf,
        nf.data_compra,
        nf.receptora_letra,
        nf.receptora_numero,
        nf.data_te,
        nf.fornecedor,
        CASE 
          WHEN nf.data_compra IS NOT NULL THEN (nf.data_compra + INTERVAL '20 days')::date
          ELSE NULL
        END as data_prevista_dg,
        CASE 
          WHEN item.dados_item IS NOT NULL THEN item.dados_item->>'tatuagem'
          ELSE NULL
        END as tatuagem_item,
        item.id as item_id
      FROM notas_fiscais nf
      INNER JOIN notas_fiscais_itens item ON item.nota_fiscal_id = nf.id
      WHERE nf.eh_receptoras = true
        AND nf.tipo = 'entrada'
        AND (item.tipo_produto = 'bovino' OR item.tipo_produto IS NULL)
      ORDER BY nf.numero_nf, item.id
    `
    
    const result = await pool.query(sqlReceptoras)
    
    console.log(`📋 Total de itens encontrados: ${result.rows.length}\n`)
    
    if (result.rows.length > 0) {
      console.log('Primeiros 5 itens:')
      result.rows.slice(0, 5).forEach((row, idx) => {
        console.log(`\nItem ${idx + 1}:`)
        console.log(`  NF: ${row.numero_nf}`)
        console.log(`  Fornecedor: ${row.fornecedor}`)
        console.log(`  Data Compra: ${row.data_compra}`)
        console.log(`  Data TE: ${row.data_te}`)
        console.log(`  Data Prevista DG: ${row.data_prevista_dg}`)
        console.log(`  Tatuagem: ${row.tatuagem_item}`)
        console.log(`  Letra: ${row.receptora_letra}, Número: ${row.receptora_numero}`)
      })
      
      // Calcular data de parto para o primeiro item
      if (result.rows[0].data_te) {
        const dataTE = new Date(result.rows[0].data_te)
        const dataParto = new Date(dataTE)
        dataParto.setMonth(dataParto.getMonth() + 9)
        console.log(`\n📅 Exemplo de cálculo de parto:`)
        console.log(`  Data TE: ${dataTE.toLocaleDateString('pt-BR')}`)
        console.log(`  Data Parto Previsto: ${dataParto.toLocaleDateString('pt-BR')}`)
      }
    }
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro:', error)
    console.error(error.stack)
    process.exit(1)
  }
}

testarCalendario()
