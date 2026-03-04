const { query, pool } = require('../lib/database')
require('dotenv').config()

async function testarQueryResumoPardinho() {
  const client = await pool.connect()
  
  try {
    console.log('🔍 Testando query do resumo Pardinho...\n')
    
    const pgStart = '2025-01-01'
    const pgEnd = '2026-12-31'
    const cnpjDestinoPardinho = '18978214000445'
    const cnpjFornecedorPardinho = '44017440001018'
    
    // Testar a query atualizada
    const nfsResult = await client.query(`
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
          -- NF 4346 (sempre incluída - única NF da PARDINHO)
          CAST(nf.numero_nf AS TEXT) = '4346'
          -- OU NFs com CNPJ da PARDINHO E que não sejam SANT ANNA
          OR (
            (nf.data_compra BETWEEN $1 AND $2 OR nf.data BETWEEN $1 AND $2)
            AND (
              nf.cnpj_origem_destino = $3
              OR nf.cnpj_origem_destino = $4
            )
            AND COALESCE(UPPER(nf.incricao), '') != 'SANT ANNA'
          )
          -- OU NFs com itens que tenham local = 'Pardinho'
          OR (
            (nf.data_compra BETWEEN $1 AND $2 OR nf.data BETWEEN $1 AND $2)
            AND (
              COALESCE(nfi.dados_item::jsonb->>'local', '') ILIKE '%pardinho%'
              OR COALESCE(nf.itens::jsonb->0->>'local', '') ILIKE '%pardinho%'
            )
          )
        )
    `, [pgStart, pgEnd, cnpjDestinoPardinho, cnpjFornecedorPardinho])
    
    console.log(`📊 Total de NFs encontradas: ${nfsResult.rows.length}\n`)
    
    for (const nf of nfsResult.rows) {
      console.log(`NF ${nf.numero_nf} (ID: ${nf.id})`)
      console.log(`  Data: ${nf.data_compra || nf.data}`)
      console.log(`  CNPJ: ${nf.cnpj_origem_destino || 'N/A'}`)
      console.log(`  Inscrição: ${nf.incricao || 'N/A'}`)
      
      // Verificar itens
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
      
      const totalQuantidade = itens.reduce((sum, item) => sum + (parseInt(item.quantidade) || 1), 0)
      const femeas36Mais = itens.filter(item => {
        const sexo = String(item.sexo || '').toLowerCase()
        const meses = item.meses || 0
        const era = String(item.era || '').toLowerCase()
        return (sexo.includes('f') || sexo.includes('fêmea')) && 
               (meses >= 36 || era.includes('36') || era.includes('+36'))
      }).reduce((sum, item) => sum + (parseInt(item.quantidade) || 1), 0)
      
      console.log(`  Total de itens: ${itens.length}`)
      console.log(`  Total de animais: ${totalQuantidade}`)
      console.log(`  Fêmeas +36 meses: ${femeas36Mais}`)
      console.log('')
    }
    
    // Verificar especificamente a NF 239
    console.log('\n🔍 Verificando especificamente a NF 239:')
    const nf239 = nfsResult.rows.find(nf => nf.numero_nf === '239' || nf.numero_nf === 239)
    if (nf239) {
      console.log('✅ NF 239 ENCONTRADA na query!')
    } else {
      console.log('❌ NF 239 NÃO encontrada na query')
      
      // Verificar por que não foi encontrada
      const nf239Check = await client.query(`
        SELECT 
          nf.id,
          nf.numero_nf,
          nf.data_compra,
          nf.data,
          nf.cnpj_origem_destino,
          nf.incricao,
          nfi.dados_item::jsonb->>'local' as local_item
        FROM notas_fiscais nf
        LEFT JOIN notas_fiscais_itens nfi ON nfi.nota_fiscal_id = nf.id
        WHERE nf.numero_nf = '239'
      `)
      
      if (nf239Check.rows.length > 0) {
        console.log('\n📋 Dados da NF 239:')
        console.log(JSON.stringify(nf239Check.rows[0], null, 2))
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error)
    throw error
  } finally {
    client.release()
  }
}

testarQueryResumoPardinho()
  .then(() => {
    console.log('\n✅ Teste concluído')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error)
    process.exit(1)
  })
