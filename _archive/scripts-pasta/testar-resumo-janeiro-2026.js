const { query } = require('../lib/database')
require('dotenv').config()

async function testarResumoJaneiro2026() {
  try {
    console.log('🔍 Testando resumo Pardinho para janeiro de 2026...\n')
    
    const pgStart = '2026-01-01'
    const pgEnd = '2026-01-31'
    
    // Simular a função getResumoPardinho
    const cnpjDestinoPardinho = '18978214000445'
    const cnpjFornecedorPardinho = '44017440001018'
    
    const nfsResult = await query(`
      SELECT DISTINCT
        nf.id,
        nf.numero_nf,
        nf.data_compra,
        nf.data,
        nf.itens,
        nf.cnpj_origem_destino,
        nf.incricao
      FROM notas_fiscais nf
      LEFT JOIN notas_fiscais_itens nfi ON nfi.nota_fiscal_id = nf.id
      WHERE nf.tipo = 'entrada'
        AND (
          CAST(nf.numero_nf AS TEXT) = '4346'
          OR (
            (nf.data_compra BETWEEN $1 AND $2 OR nf.data BETWEEN $1 AND $2)
            AND (
              nf.cnpj_origem_destino = $3
              OR nf.cnpj_origem_destino = $4
            )
            AND COALESCE(UPPER(nf.incricao), '') != 'SANT ANNA'
          )
          OR (
            (nf.data_compra BETWEEN $1 AND $2 OR nf.data BETWEEN $1 AND $2)
            AND (
              COALESCE(nfi.dados_item::jsonb->>'local', '') ILIKE '%pardinho%'
              OR COALESCE(nf.itens::jsonb->0->>'local', '') ILIKE '%pardinho%'
            )
          )
        )
    `, [pgStart, pgEnd, cnpjDestinoPardinho, cnpjFornecedorPardinho])
    
    console.log(`📊 NFs encontradas para janeiro/2026: ${nfsResult.rows.length}`)
    nfsResult.rows.forEach(nf => {
      console.log(`  - NF ${nf.numero_nf} (Data: ${nf.data_compra || nf.data})`)
    })
    
    // Processar itens
    let totalAnimais = 0
    let totalFemeas36Mais = 0
    
    for (const nf of nfsResult.rows) {
      let itens = []
      
      // Buscar da tabela separada
      try {
        const itensTabela = await query(`
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
      
      for (const item of itens) {
        const quantidade = parseInt(item.quantidade) || 1
        totalAnimais += quantidade
        
        const sexo = String(item.sexo || '').toLowerCase()
        const meses = item.meses || 0
        const era = String(item.era || '').toLowerCase()
        
        if ((sexo.includes('f') || sexo.includes('fêmea')) && 
            (meses >= 36 || era.includes('36') || era.includes('+36'))) {
          totalFemeas36Mais += quantidade
        }
      }
    }
    
    console.log(`\n📈 Total de animais: ${totalAnimais}`)
    console.log(`👩 Fêmeas +36 meses: ${totalFemeas36Mais}`)
    
  } catch (error) {
    console.error('❌ Erro:', error)
    throw error
  }
}

testarResumoJaneiro2026()
  .then(() => {
    console.log('\n✅ Teste concluído')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error)
    process.exit(1)
  })
