const { query, pool } = require('../lib/database')
require('dotenv').config()

async function corrigirDatasCJCJ15890() {
  const client = await pool.connect()
  
  try {
    console.log('🔍 Verificando coletas FIV para CJCJ 15890...\n')
    
    // Buscar todas as coletas FIV para esse animal
    const coletas = await query(`
      SELECT 
        cf.id,
        cf.doadora_nome,
        cf.data_fiv,
        cf.data_transferencia,
        cf.quantidade_oocitos,
        cf.touro,
        cf.laboratorio,
        cf.veterinario
      FROM coleta_fiv cf
      WHERE cf.doadora_nome ILIKE '%CJCJ%15890%'
         OR cf.doadora_id IN (
           SELECT id FROM animais WHERE serie = 'CJCJ' AND rg = '15890'
         )
      ORDER BY cf.data_fiv ASC
    `)
    
    console.log(`📊 Total de coletas encontradas: ${coletas.rows.length}\n`)
    
    if (coletas.rows.length === 0) {
      console.log('❌ Nenhuma coleta encontrada para CJCJ 15890')
      return
    }
    
    // Datas corretas conforme a planilha Excel
    const datasCorretas = [
      { dataFIV: '2025-01-14', dataTransf: '2025-01-21', oocitos: null, touro: null }, // 14/01/2025
      { dataFIV: '2025-02-11', dataTransf: '2025-02-18', oocitos: null, touro: null }, // 11/02/2025
      { dataFIV: '2025-03-11', dataTransf: '2025-03-18', oocitos: null, touro: null }  // 11/03/2025
    ]
    
    console.log('📋 Coletas atuais:')
    coletas.rows.forEach((coleta, index) => {
      const dataFIV = new Date(coleta.data_fiv)
      console.log(`${index + 1}. ID: ${coleta.id} | Data FIV: ${dataFIV.toLocaleDateString('pt-BR')} | Oócitos: ${coleta.quantidade_oocitos} | Touro: ${coleta.touro || 'N/A'}`)
    })
    console.log()
    
    console.log('📋 Datas corretas (conforme planilha Excel):')
    datasCorretas.forEach((data, index) => {
      const dataFIV = new Date(data.dataFIV)
      const dataTransf = new Date(data.dataTransf)
      console.log(`${index + 1}. Data FIV: ${dataFIV.toLocaleDateString('pt-BR')} | Data Transf: ${dataTransf.toLocaleDateString('pt-BR')}`)
    })
    console.log()
    
    // Perguntar confirmação
    const args = process.argv.slice(2)
    const autoConfirm = args.includes('--yes') || args.includes('-y')
    
    if (!autoConfirm) {
      console.log('⚠️  Para executar a correção, execute novamente com --yes ou -y')
      console.log('   Exemplo: node scripts/corrigir-datas-cjcj-15890.js --yes\n')
      return
    }
    
    // Corrigir cada coleta
    console.log('🔧 Iniciando correção...\n')
    let corrigidas = 0
    let erros = 0
    
    await client.query('BEGIN')
    
    try {
      // Ordenar coletas por data atual para mapear corretamente
      const coletasOrdenadas = [...coletas.rows].sort((a, b) => 
        new Date(a.data_fiv) - new Date(b.data_fiv)
      )
      
      for (let i = 0; i < coletasOrdenadas.length && i < datasCorretas.length; i++) {
        const coleta = coletasOrdenadas[i]
        const dataCorreta = datasCorretas[i]
        
        try {
          const result = await query(
            `UPDATE coleta_fiv 
             SET data_fiv = $1, 
                 data_transferencia = $2,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING id, doadora_nome, data_fiv, data_transferencia`,
            [
              dataCorreta.dataFIV,
              dataCorreta.dataTransf,
              coleta.id
            ]
          )
          
          if (result.rows.length > 0) {
            const atualizado = result.rows[0]
            const dataFIVAntiga = new Date(coleta.data_fiv).toLocaleDateString('pt-BR')
            const dataFIVNova = new Date(atualizado.data_fiv).toLocaleDateString('pt-BR')
            console.log(`✅ Corrigido ID ${atualizado.id} | ${atualizado.doadora_nome || 'N/A'}`)
            console.log(`   ${dataFIVAntiga} → ${dataFIVNova}`)
            corrigidas++
          } else {
            console.log(`⚠️  Coleta ID ${coleta.id} não encontrada para atualização`)
            erros++
          }
        } catch (error) {
          console.error(`❌ Erro ao corrigir coleta ID ${coleta.id}:`, error.message)
          erros++
        }
      }
      
      await client.query('COMMIT')
      console.log('\n' + '='.repeat(100))
      console.log(`✅ Correção concluída!`)
      console.log(`   Corrigidas: ${corrigidas}`)
      console.log(`   Erros: ${erros}`)
      console.log('='.repeat(100))
      
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('\n❌ Erro durante a correção. Rollback executado.')
      throw error
    }
    
    // Verificar novamente após correção
    console.log('\n🔍 Verificando novamente após correção...\n')
    const verificacao = await query(`
      SELECT 
        cf.id,
        cf.data_fiv,
        cf.data_transferencia,
        cf.quantidade_oocitos,
        cf.touro
      FROM coleta_fiv cf
      WHERE cf.doadora_nome ILIKE '%CJCJ%15890%'
         OR cf.doadora_id IN (
           SELECT id FROM animais WHERE serie = 'CJCJ' AND rg = '15890'
         )
      ORDER BY cf.data_fiv ASC
    `)
    
    console.log('📋 Coletas após correção:')
    verificacao.rows.forEach((coleta, index) => {
      const dataFIV = new Date(coleta.data_fiv)
      const dataTransf = coleta.data_transferencia ? new Date(coleta.data_transferencia) : null
      console.log(`${index + 1}. ID: ${coleta.id} | Data FIV: ${dataFIV.toLocaleDateString('pt-BR')} | Data Transf: ${dataTransf ? dataTransf.toLocaleDateString('pt-BR') : 'N/A'} | Oócitos: ${coleta.quantidade_oocitos} | Touro: ${coleta.touro || 'N/A'}`)
    })
    
  } catch (error) {
    console.error('❌ Erro ao executar correção:', error)
    throw error
  } finally {
    client.release()
  }
}

// Executar
corrigirDatasCJCJ15890()
  .then(() => {
    console.log('\n✅ Script finalizado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error)
    process.exit(1)
  })
