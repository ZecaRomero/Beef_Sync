const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
})

async function sincronizarAnimaisNF2141() {
  const client = await pool.connect()
  
  try {
    console.log('≈∏‚Äùç Buscando animais da NF #2141...\n')
    
    // Buscar a NF
    const nfResult = await client.query(`
      SELECT * FROM notas_fiscais 
      WHERE numero_nf = '2141'
      ORDER BY id DESC
      LIMIT 1
    `)
    
    if (nfResult.rows.length === 0) {
      console.log('‚ù≈í NF #2141 n√£o encontrada!')
      return
    }
    
    const nf = nfResult.rows[0]
    console.log('‚≈ì‚Ä¶ NF encontrada:', {
      id: nf.id,
      numero: nf.numero_nf,
      fornecedor: nf.fornecedor,
      data_emissao: nf.data_emissao || nf.data_compra || nf.data,
      total_bovinos: nf.total_bovinos
    })
    
    // Buscar itens da NF (est√£o no campo JSON)
    const itens = nf.itens || []
    
    console.log(`\n≈∏‚Äú¶ ${itens.length} itens encontrados na NF\n`)
    
    if (itens.length === 0) {
      console.log('‚≈°†Ô∏è  Nenhum item encontrado na NF!')
      return
    }
    
    let criados = 0
    let jaExistentes = 0
    let erros = 0
    
    for (const item of itens) {
      try {
        // Extrair s√©rie e RG do identificador
        const match = item.identificador?.match(/([A-Z]+)\s*(\d+)/)
        if (!match) {
          console.log(`‚≈°†Ô∏è  N√£o foi poss√≠vel extrair s√©rie/RG de: ${item.identificador}`)
          erros++
          continue
        }
        
        const serie = match[1]
        const rg = match[2]
        
        // Verificar se animal j√° existe
        const existeResult = await client.query(`
          SELECT id FROM animais 
          WHERE serie = $1 AND rg = $2
        `, [serie, rg])
        
        if (existeResult.rows.length > 0) {
          console.log(`‚‚ÄûπÔ∏è  ${serie} ${rg} - J√° existe (ID: ${existeResult.rows[0].id})`)
          jaExistentes++
          continue
        }
        
        // Criar animal
        const insertResult = await client.query(`
          INSERT INTO animais (
            serie, rg, nome, sexo, raca, situacao,
            data_nascimento, peso, cor,
            nf_numero, fornecedor, data_chegada,
            valor_compra, local_atual,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9,
            $10, $11, $12,
            $13, $14,
            NOW(), NOW()
          ) RETURNING id
        `, [
          serie,                                    // serie
          rg,                                       // rg
          `${serie} ${rg}`,                        // nome
          'F√™mea',                                 // sexo
          item.raca || 'Mesti√ßa',                  // raca
          'Ativo',                                 // situacao
          null,                                    // data_nascimento
          0,                                       // peso
          '-',                                     // cor
          nf.numero_nf,                            // nf_numero
          nf.fornecedor,                           // fornecedor
          nf.data_emissao || nf.data_compra || nf.data,      // data_chegada
          item.valor_unitario || 0,                // valor_compra
          item.local || 'Rancharia'                // local_atual
        ])
        
        console.log(`‚≈ì‚Ä¶ ${serie} ${rg} - Criado com sucesso (ID: ${insertResult.rows[0].id})`)
        criados++
        
      } catch (error) {
        console.error(`‚ù≈í Erro ao processar ${item.identificador}:`, error.message)
        erros++
      }
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('≈∏‚Äú≈† RESUMO:')
    console.log(`   ‚≈ì‚Ä¶ Criados: ${criados}`)
    console.log(`   ‚‚ÄûπÔ∏è  J√° existentes: ${jaExistentes}`)
    console.log(`   ‚ù≈í Erros: ${erros}`)
    console.log(`   ≈∏‚Äú¶ Total processados: ${itens.length}`)
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('‚ù≈í Erro geral:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

sincronizarAnimaisNF2141()
