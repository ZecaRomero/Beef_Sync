const { query, pool } = require('../lib/database')
require('dotenv').config()

async function corrigirDatasFIV() {
  const client = await pool.connect()
  
  try {
    console.log('🔍 Verificando coletas FIV com datas incorretas (1900-1999)...\n')
    
    // Buscar todas as coletas FIV
    const coletas = await query(`
      SELECT id, doadora_nome, data_fiv, data_transferencia, created_at
      FROM coleta_fiv
      ORDER BY data_fiv DESC
    `)
    
    console.log(`📊 Total de coletas FIV encontradas: ${coletas.rows.length}\n`)
    
    // Filtrar coletas com datas entre 1900-1999
    const coletasIncorretas = coletas.rows.filter(coleta => {
      if (!coleta.data_fiv) return false
      const data = new Date(coleta.data_fiv)
      const year = data.getFullYear()
      return year >= 1900 && year < 2000
    })
    
    console.log(`⚠️  Coletas com datas incorretas (1900-1999): ${coletasIncorretas.length}\n`)
    
    if (coletasIncorretas.length === 0) {
      console.log('✅ Nenhuma data incorreta encontrada!')
      return
    }
    
    // Mostrar lista das coletas que serão corrigidas
    console.log('📋 Coletas que serão corrigidas:')
    console.log('─'.repeat(100))
    coletasIncorretas.forEach((coleta, index) => {
      const dataOriginal = new Date(coleta.data_fiv)
      const dataCorrigida = new Date(dataOriginal)
      dataCorrigida.setFullYear(dataOriginal.getFullYear() + 100)
      
      const dataTransfOriginal = coleta.data_transferencia ? new Date(coleta.data_transferencia) : null
      const dataTransfCorrigida = dataTransfOriginal ? new Date(dataTransfOriginal) : null
      if (dataTransfCorrigida) {
        dataTransfCorrigida.setFullYear(dataTransfOriginal.getFullYear() + 100)
      }
      
      console.log(`${index + 1}. ID: ${coleta.id} | ${coleta.doadora_nome || 'N/A'}`)
      console.log(`   Data FIV: ${dataOriginal.toLocaleDateString('pt-BR')} → ${dataCorrigida.toLocaleDateString('pt-BR')}`)
      if (dataTransfOriginal) {
        console.log(`   Data Transf: ${dataTransfOriginal.toLocaleDateString('pt-BR')} → ${dataTransfCorrigida.toLocaleDateString('pt-BR')}`)
      }
    })
    console.log('─'.repeat(100))
    console.log()
    
    // Perguntar confirmação
    const args = process.argv.slice(2)
    const autoConfirm = args.includes('--yes') || args.includes('-y')
    
    if (!autoConfirm) {
      console.log('⚠️  Para executar a correção, execute novamente com --yes ou -y')
      console.log('   Exemplo: node scripts/corrigir-datas-fiv.js --yes\n')
      return
    }
    
    // Corrigir cada coleta
    console.log('🔧 Iniciando correção...\n')
    let corrigidas = 0
    let erros = 0
    
    await client.query('BEGIN')
    
    try {
      for (const coleta of coletasIncorretas) {
        try {
          const dataOriginal = new Date(coleta.data_fiv)
          const dataCorrigida = new Date(dataOriginal)
          dataCorrigida.setFullYear(dataOriginal.getFullYear() + 100)
          
          let dataTransfCorrigida = null
          if (coleta.data_transferencia) {
            const dataTransfOriginal = new Date(coleta.data_transferencia)
            dataTransfCorrigida = new Date(dataTransfOriginal)
            dataTransfCorrigida.setFullYear(dataTransfOriginal.getFullYear() + 100)
          }
          
          const result = await query(
            `UPDATE coleta_fiv 
             SET data_fiv = $1, 
                 data_transferencia = $2,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING id, doadora_nome, data_fiv, data_transferencia`,
            [
              dataCorrigida.toISOString().split('T')[0],
              dataTransfCorrigida ? dataTransfCorrigida.toISOString().split('T')[0] : null,
              coleta.id
            ]
          )
          
          if (result.rows.length > 0) {
            const atualizado = result.rows[0]
            console.log(`✅ Corrigido ID ${atualizado.id} | ${atualizado.doadora_nome || 'N/A'}`)
            console.log(`   ${dataOriginal.toLocaleDateString('pt-BR')} → ${new Date(atualizado.data_fiv).toLocaleDateString('pt-BR')}`)
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
      SELECT id, doadora_nome, data_fiv
      FROM coleta_fiv
      WHERE EXTRACT(YEAR FROM data_fiv) BETWEEN 1900 AND 1999
    `)
    
    if (verificacao.rows.length === 0) {
      console.log('✅ Todas as datas foram corrigidas!')
    } else {
      console.log(`⚠️  Ainda existem ${verificacao.rows.length} coletas com datas incorretas:`)
      verificacao.rows.forEach(coleta => {
        console.log(`   - ID: ${coleta.id} | ${coleta.doadora_nome || 'N/A'} | ${new Date(coleta.data_fiv).toLocaleDateString('pt-BR')}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Erro ao executar correção:', error)
    throw error
  } finally {
    client.release()
  }
}

// Executar
corrigirDatasFIV()
  .then(() => {
    console.log('\n✅ Script finalizado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error)
    process.exit(1)
  })
