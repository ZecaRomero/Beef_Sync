const { query, pool } = require('../lib/database')
require('dotenv').config()

async function corrigirDatasFuturasFIV() {
  const client = await pool.connect()
  
  try {
    console.log('�Ÿ”� Verificando coletas FIV com datas futuras suspeitas (2027+)...\n')
    
    // Buscar coletas com datas em 2027 ou depois (suspeitas)
    const coletasSuspeitas = await query(`
      SELECT 
        cf.id,
        cf.doadora_nome,
        cf.doadora_id,
        cf.data_fiv,
        cf.data_transferencia,
        cf.quantidade_oocitos,
        a.serie,
        a.rg
      FROM coleta_fiv cf
      LEFT JOIN animais a ON cf.doadora_id = a.id
      WHERE EXTRACT(YEAR FROM cf.data_fiv) >= 2027
      ORDER BY cf.doadora_nome, cf.data_fiv ASC
    `)
    
    console.log(`�Ÿ“Š Total de coletas com datas em 2027 ou depois: ${coletasSuspeitas.rows.length}\n`)
    
    if (coletasSuspeitas.rows.length === 0) {
      console.log('�œ… Nenhuma coleta com data futura suspeita encontrada')
      return
    }
    
    // Agrupar por doadora para análise
    const coletasPorDoadora = {}
    coletasSuspeitas.rows.forEach(coleta => {
      const key = coleta.doadora_nome || 
                  (coleta.serie && coleta.rg ? `${coleta.serie} ${coleta.rg}` : null) ||
                  `ID_${coleta.doadora_id}`
      
      if (!coletasPorDoadora[key]) {
        coletasPorDoadora[key] = []
      }
      coletasPorDoadora[key].push(coleta)
    })
    
    console.log(`�Ÿ“‹ Doadoras com datas futuras: ${Object.keys(coletasPorDoadora).length}\n`)
    
    // Mostrar resumo
    console.log('�Ÿ“‹ Coletas com datas futuras (2027+):')
    console.log('�”€'.repeat(120))
    
    Object.keys(coletasPorDoadora).sort().forEach(key => {
      const coletas = coletasPorDoadora[key]
      console.log(`\n${key}:`)
      coletas.forEach(coleta => {
        const dataFIV = new Date(coleta.data_fiv)
        const ano = dataFIV.getFullYear()
        console.log(`   ID ${coleta.id} | Data FIV: ${dataFIV.toLocaleDateString('pt-BR')} (ano ${ano}) | Oócitos: ${coleta.quantidade_oocitos || 0}`)
      })
    })
    
    console.log('\n' + '�”€'.repeat(120))
    console.log('\n�š�️  ATEN�‡�ƒO: Este script irá subtrair 1 ano das datas em 2027+')
    console.log('   Isso corrige datas que foram importadas incorretamente como 2027 quando deveriam ser 2026')
    console.log('   ou datas que foram interpretadas incorretamente durante a importação.\n')
    
    const args = process.argv.slice(2)
    const autoConfirm = args.includes('--yes') || args.includes('-y')
    
    if (!autoConfirm) {
      console.log('�š�️  Para executar a correção, execute novamente com --yes ou -y')
      console.log('   Exemplo: node scripts/corrigir-datas-futuras-fiv.js --yes\n')
      return
    }
    
    // Corrigir: subtrair 1 ano das datas em 2027+
    console.log('�Ÿ”� Iniciando correção (subtraindo 1 ano das datas em 2027+)...\n')
    let corrigidas = 0
    let erros = 0
    
    await client.query('BEGIN')
    
    try {
      for (const coleta of coletasSuspeitas.rows) {
        try {
          const dataFIV = new Date(coleta.data_fiv)
          const anoAtual = dataFIV.getFullYear()
          
          // Subtrair 1 ano
          const novaDataFIV = new Date(dataFIV)
          novaDataFIV.setFullYear(anoAtual - 1)
          const novaDataFIVISO = novaDataFIV.toISOString().split('T')[0]
          
          let novaDataTransfISO = null
          if (coleta.data_transferencia) {
            const dataTransf = new Date(coleta.data_transferencia)
            const anoTransf = dataTransf.getFullYear()
            const novaDataTransf = new Date(dataTransf)
            novaDataTransf.setFullYear(anoTransf - 1)
            novaDataTransfISO = novaDataTransf.toISOString().split('T')[0]
          }
          
          const result = await query(
            `UPDATE coleta_fiv 
             SET data_fiv = $1, 
                 data_transferencia = $2,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING id, doadora_nome, data_fiv, data_transferencia`,
            [
              novaDataFIVISO,
              novaDataTransfISO,
              coleta.id
            ]
          )
          
          if (result.rows.length > 0) {
            const atualizado = result.rows[0]
            const dataFIVAntiga = new Date(coleta.data_fiv).toLocaleDateString('pt-BR')
            const dataFIVNova = new Date(atualizado.data_fiv).toLocaleDateString('pt-BR')
            console.log(`�œ… Corrigido ID ${atualizado.id} | ${atualizado.doadora_nome || 'N/A'}`)
            console.log(`   ${dataFIVAntiga} �†’ ${dataFIVNova}`)
            corrigidas++
          } else {
            console.log(`�š�️  Coleta ID ${coleta.id} não encontrada para atualização`)
            erros++
          }
        } catch (error) {
          console.error(`�Œ Erro ao corrigir coleta ID ${coleta.id}:`, error.message)
          erros++
        }
      }
      
      await client.query('COMMIT')
      console.log('\n' + '='.repeat(100))
      console.log(`�œ… Correção concluída!`)
      console.log(`   Corrigidas: ${corrigidas}`)
      console.log(`   Erros: ${erros}`)
      console.log('='.repeat(100))
      
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('\n�Œ Erro durante a correção. Rollback executado.')
      throw error
    }
    
    // Verificar novamente após correção
    console.log('\n�Ÿ”� Verificando novamente após correção...\n')
    const verificacao = await query(`
      SELECT COUNT(*) as total
      FROM coleta_fiv
      WHERE EXTRACT(YEAR FROM data_fiv) >= 2027
    `)
    
    const restantes = parseInt(verificacao.rows[0].total)
    if (restantes === 0) {
      console.log('�œ… Todas as datas futuras foram corrigidas!')
    } else {
      console.log(`�š�️  Ainda existem ${restantes} coletas com datas em 2027 ou depois`)
    }
    
  } catch (error) {
    console.error('�Œ Erro ao executar correção:', error)
    throw error
  } finally {
    client.release()
  }
}

// Executar
corrigirDatasFuturasFIV()
  .then(() => {
    console.log('\n�œ… Script finalizado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n�Œ Erro fatal:', error)
    process.exit(1)
  })
