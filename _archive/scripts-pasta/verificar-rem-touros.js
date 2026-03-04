const { query } = require('../lib/database')

async function verificarRemTouros() {
  try {
    // Buscar todas as transferências com REM no touro
    const result = await query(`
      SELECT 
        id, 
        numero_te, 
        data_te, 
        doadora_nome, 
        receptora_nome, 
        touro, 
        central,
        touro_id
      FROM transferencias_embrioes 
      WHERE touro ILIKE '%REM%' 
      ORDER BY data_te DESC 
      LIMIT 50
    `)

    console.log(`\n📊 Total de transferências com "REM" no touro: ${result.rows.length}\n`)

    if (result.rows.length > 0) {
      result.rows.forEach((r, idx) => {
        console.log(`${idx + 1}. ID: ${r.id}`)
        console.log(`   TE: ${r.numero_te || 'N/A'}`)
        console.log(`   Data: ${r.data_te}`)
        console.log(`   Doadora: ${r.doadora_nome || 'N/A'}`)
        console.log(`   Receptora: ${r.receptora_nome || 'N/A'}`)
        console.log(`   Touro: "${r.touro || '(vazio)'}"`)
        console.log(`   Touro ID: ${r.touro_id || 'NULL'}`)
        console.log(`   Central: ${r.central || 'N/A'}`)
        console.log('')
      })

      // Agrupar por valor do touro
      const agrupado = {}
      result.rows.forEach(r => {
        const touro = r.touro || '(vazio)'
        if (!agrupado[touro]) {
          agrupado[touro] = []
        }
        agrupado[touro].push(r)
      })

      console.log('\n📊 Agrupado por valor do touro:\n')
      Object.keys(agrupado).sort().forEach(touro => {
        console.log(`   "${touro}": ${agrupado[touro].length} transferência(s)`)
      })
    } else {
      console.log('✅ Nenhuma transferência encontrada com "REM" no touro')
    }

    // Verificar também touros vazios ou nulos
    const vazios = await query(`
      SELECT COUNT(*) as total
      FROM transferencias_embrioes 
      WHERE touro IS NULL OR touro = ''
    `)

    console.log(`\n📊 Transferências com touro vazio ou NULL: ${vazios.rows[0].total}`)

  } catch (error) {
    console.error('❌ Erro:', error)
    throw error
  }
}

if (require.main === module) {
  verificarRemTouros()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Erro:', error)
      process.exit(1)
    })
}

module.exports = { verificarRemTouros }
