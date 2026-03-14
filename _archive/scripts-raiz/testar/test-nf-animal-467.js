// Script para testar se existe NF de saída para o animal CJCJ-16406 (ID: 467)
const { query } = require('./lib/database')

async function testNFAnimal() {
  try {
    console.log('🔍 Buscando animal CJCJ-16406 (ID: 467)...\n')
    
    // Buscar animal
    const animalResult = await query(`
      SELECT id, serie, rg, situacao, observacoes
      FROM animais
      WHERE id = 467 OR (serie = 'CJCJ' AND rg = '16406')
      LIMIT 1
    `)
    
    if (animalResult.rows.length === 0) {
      console.log('❌ Animal não encontrado')
      return
    }
    
    const animal = animalResult.rows[0]
    console.log('✅ Animal encontrado:')
    console.log(JSON.stringify(animal, null, 2))
    console.log('')
    
    // Buscar NFs de saída
    console.log('🔍 Buscando NFs de saída...\n')
    const nfsResult = await query(`
      SELECT id, numero_nf, data, destino, fornecedor, valor_total
      FROM notas_fiscais
      WHERE tipo = 'saida'
      ORDER BY data DESC
    `)
    
    console.log(`📋 Total de NFs de saída: ${nfsResult.rows.length}\n`)
    
    // Para cada NF, buscar itens
    for (const nf of nfsResult.rows) {
      const itensResult = await query(`
        SELECT id, tipo_produto, dados_item
        FROM notas_fiscais_itens
        WHERE nota_fiscal_id = $1
      `, [nf.id])
      
      console.log(`\n📄 NF ${nf.numero_nf} (ID: ${nf.id})`)
      console.log(`   Data: ${nf.data}`)
      console.log(`   Destino: ${nf.destino || nf.fornecedor}`)
      console.log(`   Valor Total: R$ ${nf.valor_total}`)
      console.log(`   Itens: ${itensResult.rows.length}`)
      
      // Verificar cada item
      for (const item of itensResult.rows) {
        const dadosItem = typeof item.dados_item === 'string' 
          ? JSON.parse(item.dados_item) 
          : item.dados_item
        
        const tatuagem = dadosItem.tatuagem || ''
        const animalId = dadosItem.animalId || dadosItem.animal_id
        
        console.log(`   - Item: tatuagem="${tatuagem}", animalId=${animalId}`)
        
        // Verificar se corresponde ao animal
        const match = (
          animalId === 467 ||
          tatuagem === 'CJCJ-16406' ||
          tatuagem === 'CJCJ 16406' ||
          tatuagem === 'CJCJ16406' ||
          (tatuagem.toLowerCase().includes('cjcj') && tatuagem.includes('16406'))
        )
        
        if (match) {
          console.log(`   ✅ MATCH ENCONTRADO!`)
          console.log(`   Dados completos do item:`)
          console.log(JSON.stringify(dadosItem, null, 2))
        }
      }
    }
    
    console.log('\n✅ Teste concluído')
    process.exit(0)
    
  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }
}

testNFAnimal()
