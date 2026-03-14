const pool = require('../lib/database')

async function verificarNFs() {
  try {
    console.log('🔍 Buscando NFs do Eduardo Muniz de Lima...\n')
    
    const result = await pool.query(`
      SELECT 
        id, 
        numero_nf, 
        data_compra, 
        data_te, 
        fornecedor, 
        receptora_letra, 
        receptora_numero, 
        eh_receptoras,
        tipo
      FROM notas_fiscais 
      WHERE (fornecedor ILIKE '%eduardo%' OR fornecedor ILIKE '%muniz%')
      ORDER BY data_compra DESC
    `)
    
    console.log(`📋 Total de NFs encontradas: ${result.rows.length}\n`)
    
    result.rows.forEach(nf => {
      console.log(`NF ${nf.numero_nf}:`)
      console.log(`  ID: ${nf.id}`)
      console.log(`  Fornecedor: ${nf.fornecedor}`)
      console.log(`  Data Compra: ${nf.data_compra}`)
      console.log(`  Data TE: ${nf.data_te}`)
      console.log(`  Tipo: ${nf.tipo}`)
      console.log(`  É Receptoras: ${nf.eh_receptoras}`)
      console.log(`  Letra: ${nf.receptora_letra}, Número: ${nf.receptora_numero}`)
      console.log('')
    })
    
    // Buscar itens das NFs
    if (result.rows.length > 0) {
      console.log('\n📦 Verificando itens das NFs...\n')
      
      for (const nf of result.rows) {
        const itens = await pool.query(`
          SELECT id, tipo_produto, dados_item
          FROM notas_fiscais_itens
          WHERE nota_fiscal_id = $1
        `, [nf.id])
        
        console.log(`NF ${nf.numero_nf} - ${itens.rows.length} item(ns):`)
        itens.rows.forEach((item, idx) => {
          console.log(`  Item ${idx + 1}:`)
          console.log(`    Tipo: ${item.tipo_produto}`)
          if (item.dados_item) {
            const dados = typeof item.dados_item === 'string' 
              ? JSON.parse(item.dados_item) 
              : item.dados_item
            console.log(`    Tatuagem: ${dados.tatuagem || '-'}`)
            console.log(`    Sexo: ${dados.sexo || '-'}`)
          }
        })
        console.log('')
      }
    }
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }
}

verificarNFs()
