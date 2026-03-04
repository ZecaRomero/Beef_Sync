const { query, pool } = require('../lib/database')
require('dotenv').config()

async function verificarNFsRecentes() {
  const client = await pool.connect()
  
  try {
    console.log('🔍 Verificando Notas Fiscais recentes (últimos 30 dias)...\n')
    
    // Buscar todas as NFs de entrada dos últimos 30 dias
    const result = await client.query(`
      SELECT 
        id,
        numero_nf,
        data_compra,
        data,
        tipo,
        incricao,
        cnpj_origem_destino,
        origem,
        fornecedor
      FROM notas_fiscais
      WHERE tipo = 'entrada'
        AND (data_compra >= CURRENT_DATE - INTERVAL '30 days' 
             OR data >= CURRENT_DATE - INTERVAL '30 days')
      ORDER BY COALESCE(data_compra, data) DESC
      LIMIT 20
    `)
    
    console.log(`📊 Total de NFs encontradas (últimos 30 dias): ${result.rows.length}\n`)
    
    for (const nf of result.rows) {
      // Buscar itens da tabela separada
      let itens = []
      try {
        const itensTabela = await client.query(`
          SELECT dados_item FROM notas_fiscais_itens
          WHERE nota_fiscal_id = $1
        `, [nf.id])
        
        if (itensTabela.rows.length > 0) {
          itens = itensTabela.rows.map(row => {
            try {
              return typeof row.dados_item === 'string' ? JSON.parse(row.dados_item) : row.dados_item
            } catch {
              return {}
            }
          })
        }
      } catch (e) {}
      
      // Se não encontrou na tabela, buscar do JSONB
      if (itens.length === 0 && nf.itens) {
        try {
          if (typeof nf.itens === 'string') {
            itens = JSON.parse(nf.itens || '[]')
          } else if (Array.isArray(nf.itens)) {
            itens = nf.itens
          }
        } catch (e) {}
      }
      
      const totalItens = itens.length
      const totalQuantidade = itens.reduce((sum, item) => sum + (parseInt(item.quantidade) || 1), 0)
      const femeas36Mais = itens.filter(item => {
        const sexo = String(item.sexo || '').toLowerCase()
        const meses = item.meses || 0
        const era = String(item.era || '').toLowerCase()
        const quantidade = parseInt(item.quantidade) || 1
        const isFemea36 = (sexo.includes('f') || sexo.includes('fêmea')) && 
                          (meses >= 36 || era.includes('36') || era.includes('+36'))
        return isFemea36 ? quantidade : 0
      }).reduce((sum, item) => sum + (parseInt(item.quantidade) || 1), 0)
      
      console.log(`NF ${nf.numero_nf} (ID: ${nf.id})`)
      console.log(`  Data: ${nf.data_compra || nf.data}`)
      console.log(`  Fornecedor: ${nf.fornecedor || nf.origem || 'N/A'}`)
      console.log(`  Inscrição: ${nf.incricao || 'N/A'}`)
      console.log(`  CNPJ: ${nf.cnpj_origem_destino || 'N/A'}`)
      console.log(`  Total de itens: ${totalItens}`)
      console.log(`  Total de animais (quantidade): ${totalQuantidade}`)
      console.log(`  Fêmeas +36 meses (quantidade): ${femeas36Mais}`)
      console.log('')
    }
    
  } catch (error) {
    console.error('❌ Erro:', error)
    throw error
  } finally {
    client.release()
  }
}

verificarNFsRecentes()
  .then(() => {
    console.log('\n✅ Verificação concluída')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error)
    process.exit(1)
  })
