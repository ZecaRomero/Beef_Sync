const { query, pool } = require('../lib/database')
require('dotenv').config()

async function verificarNFsPardinho() {
  const client = await pool.connect()
  
  try {
    console.log('🔍 Verificando Notas Fiscais de Pardinho...\n')
    
    // Buscar todas as NFs de entrada relacionadas a Pardinho
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
        fornecedor,
        itens
      FROM notas_fiscais
      WHERE tipo = 'entrada'
        AND (
          CAST(numero_nf AS TEXT) = '4346'
          OR COALESCE(incricao, '') ILIKE '%pardinho%'
          OR COALESCE(cnpj_origem_destino, '') = '18978214000445'
          OR COALESCE(cnpj_origem_destino, '') = '44017440001018'
        )
        AND COALESCE(UPPER(incricao), '') != 'SANT ANNA'
      ORDER BY data_compra DESC, data DESC
      LIMIT 20
    `)
    
    console.log(`📊 Total de NFs encontradas: ${result.rows.length}\n`)
    
    for (const nf of result.rows) {
      let itens = []
      try {
        if (typeof nf.itens === 'string') {
          itens = JSON.parse(nf.itens || '[]')
        } else if (Array.isArray(nf.itens)) {
          itens = nf.itens
        }
      } catch (e) {}
      
      // Buscar itens da tabela separada
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
      
      const totalItens = itens.length
      const femeas36Mais = itens.filter(item => {
        const sexo = String(item.sexo || '').toLowerCase()
        const meses = item.meses || 0
        const era = String(item.era || '').toLowerCase()
        return (sexo.includes('f') || sexo.includes('fêmea')) && 
               (meses >= 36 || era.includes('36') || era.includes('+36'))
      }).length
      
      console.log(`NF ${nf.numero_nf} (ID: ${nf.id})`)
      console.log(`  Data: ${nf.data_compra || nf.data}`)
      console.log(`  Inscrição: ${nf.incricao || 'N/A'}`)
      console.log(`  CNPJ: ${nf.cnpj_origem_destino || 'N/A'}`)
      console.log(`  Total de itens: ${totalItens}`)
      console.log(`  Fêmeas +36 meses: ${femeas36Mais}`)
      console.log('')
    }
    
  } catch (error) {
    console.error('❌ Erro:', error)
    throw error
  } finally {
    client.release()
  }
}

verificarNFsPardinho()
  .then(() => {
    console.log('\n✅ Verificação concluída')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error)
    process.exit(1)
  })
