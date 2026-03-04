const { query } = require('../lib/database')

async function identificarTourosFaltantes() {
  console.log('🔍 Identificando transferências com touro "REM Não Informado" ou vazio...\n')

  try {
    // 1. Buscar todas as transferências com touro faltante
    const transferenciasSemTouro = await query(`
      SELECT 
        id,
        numero_te,
        data_te,
        doadora_nome,
        receptora_nome,
        touro,
        central,
        sexo_prenhez,
        status,
        touro_id
      FROM transferencias_embrioes
      WHERE (touro IS NULL OR touro = '' OR touro ILIKE '%não informado%' OR touro ILIKE '%nao informado%' OR touro ILIKE '%REM Não Informado%' OR touro ILIKE '%REM Nao Informado%')
      ORDER BY data_te DESC
    `)

    console.log(`📊 Total de transferências sem touro informado: ${transferenciasSemTouro.rows.length}\n`)

    if (transferenciasSemTouro.rows.length === 0) {
      console.log('✅ Todas as transferências têm touro informado!')
      return
    }

    // 2. Para cada transferência, tentar encontrar o touro baseado em padrões
    console.log('🔎 Analisando cada transferência...\n')

    for (const te of transferenciasSemTouro.rows) {
      console.log(`\n📋 TE ${te.numero_te || te.id}:`)
      console.log(`   Data: ${te.data_te}`)
      console.log(`   Doadora: ${te.doadora_nome || 'Não informado'}`)
      console.log(`   Receptora: ${te.receptora_nome || 'Não informado'}`)
      console.log(`   Touro atual: ${te.touro || '(vazio)'}`)
      console.log(`   Central: ${te.central || 'Não informado'}`)
      console.log(`   Status: ${te.status || 'Não informado'}`)

      // Tentar encontrar touros relacionados à mesma doadora
      if (te.doadora_nome) {
        const tourosMesmaDoadora = await query(`
          SELECT DISTINCT touro, COUNT(*) as total
          FROM transferencias_embrioes
          WHERE doadora_nome = $1
            AND touro IS NOT NULL
            AND touro != ''
            AND touro NOT ILIKE '%não informado%'
            AND touro NOT ILIKE '%nao informado%'
            AND ABS(EXTRACT(EPOCH FROM (data_te::date - $2::date))) < 90 * 86400
          GROUP BY touro
          ORDER BY total DESC
          LIMIT 3
        `, [te.doadora_nome, te.data_te])

        if (tourosMesmaDoadora.rows.length > 0) {
          console.log(`   💡 Possíveis touros (mesma doadora, período próximo):`)
          tourosMesmaDoadora.rows.forEach((t, idx) => {
            console.log(`      ${idx + 1}. ${t.touro} (${t.total} transferências)`)
          })
        }
      }

      // Tentar encontrar touros na mesma data
      const tourosMesmaData = await query(`
        SELECT DISTINCT touro, COUNT(*) as total
        FROM transferencias_embrioes
        WHERE data_te = $1
          AND touro IS NOT NULL
          AND touro != ''
          AND touro NOT ILIKE '%não informado%'
          AND touro NOT ILIKE '%nao informado%'
          AND touro NOT ILIKE '%REM%'
        GROUP BY touro
        ORDER BY total DESC
        LIMIT 3
      `, [te.data_te])

      if (tourosMesmaData.rows.length > 0) {
        console.log(`   💡 Possíveis touros (mesma data):`)
        tourosMesmaData.rows.forEach((t, idx) => {
          console.log(`      ${idx + 1}. ${t.touro} (${t.total} transferências)`)
        })
      }

      // Tentar encontrar touros na mesma central
      if (te.central) {
        const tourosMesmaCentral = await query(`
          SELECT DISTINCT touro, COUNT(*) as total
          FROM transferencias_embrioes
          WHERE central = $1
            AND touro IS NOT NULL
            AND touro != ''
            AND touro NOT ILIKE '%não informado%'
            AND touro NOT ILIKE '%nao informado%'
            AND ABS(EXTRACT(EPOCH FROM (data_te::date - $2::date))) < 30 * 86400
          GROUP BY touro
          ORDER BY total DESC
          LIMIT 3
        `, [te.central, te.data_te])

        if (tourosMesmaCentral.rows.length > 0) {
          console.log(`   💡 Possíveis touros (mesma central, período próximo):`)
          tourosMesmaCentral.rows.forEach((t, idx) => {
            console.log(`      ${idx + 1}. ${t.touro} (${t.total} transferências)`)
          })
        }
      }
    }

    // 3. Resumo estatístico
    console.log('\n\n📊 RESUMO ESTATÍSTICO:\n')
    
    const porData = await query(`
      SELECT 
        data_te,
        COUNT(*) as total
      FROM transferencias_embrioes
      WHERE (touro IS NULL OR touro = '' OR touro ILIKE '%não informado%' OR touro ILIKE '%nao informado%' OR touro ILIKE '%REM Não Informado%' OR touro ILIKE '%REM Nao Informado%')
      GROUP BY data_te
      ORDER BY total DESC
      LIMIT 10
    `)

    console.log('📅 Transferências sem touro por data (top 10):')
    porData.rows.forEach((row, idx) => {
      console.log(`   ${idx + 1}. ${row.data_te}: ${row.total} transferências`)
    })

    const porDoadora = await query(`
      SELECT 
        doadora_nome,
        COUNT(*) as total
      FROM transferencias_embrioes
      WHERE (touro IS NULL OR touro = '' OR touro ILIKE '%não informado%' OR touro ILIKE '%nao informado%' OR touro ILIKE '%REM Não Informado%' OR touro ILIKE '%REM Nao Informado%')
        AND doadora_nome IS NOT NULL
        AND doadora_nome != ''
      GROUP BY doadora_nome
      ORDER BY total DESC
      LIMIT 10
    `)

    console.log('\n🐄 Transferências sem touro por doadora (top 10):')
    porDoadora.rows.forEach((row, idx) => {
      console.log(`   ${idx + 1}. ${row.doadora_nome}: ${row.total} transferências`)
    })

    const porCentral = await query(`
      SELECT 
        central,
        COUNT(*) as total
      FROM transferencias_embrioes
      WHERE (touro IS NULL OR touro = '' OR touro ILIKE '%não informado%' OR touro ILIKE '%nao informado%' OR touro ILIKE '%REM Não Informado%' OR touro ILIKE '%REM Nao Informado%')
        AND central IS NOT NULL
        AND central != ''
      GROUP BY central
      ORDER BY total DESC
      LIMIT 10
    `)

    console.log('\n🏢 Transferências sem touro por central (top 10):')
    porCentral.rows.forEach((row, idx) => {
      console.log(`   ${idx + 1}. ${row.central || '(sem central)'}: ${row.total} transferências`)
    })

    console.log('\n✅ Análise concluída!')
    console.log('\n💡 Dica: Use essas informações para identificar padrões e completar os dados faltantes.')

  } catch (error) {
    console.error('❌ Erro ao identificar touros faltantes:', error)
    throw error
  }
}

// Executar
if (require.main === module) {
  identificarTourosFaltantes()
    .then(() => {
      console.log('\n✅ Script finalizado!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Erro:', error)
      process.exit(1)
    })
}

module.exports = { identificarTourosFaltantes }
