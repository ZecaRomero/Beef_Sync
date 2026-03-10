/**
 * Script de debug para verificar animais que aparecem para brucelose
 * Verifica se há animais com menos de 90 dias sendo retornados
 */

const databaseService = require('./services/databaseService')

async function debugBrucelose() {
  try {
    console.log('🔍 Verificando animais para brucelose...\n')

    // Query corrigida (verifica custos E histórico de ocorrências)
    const result = await databaseService.query(`
      WITH animais_com_brucelose AS (
        SELECT DISTINCT c.animal_id
        FROM custos c
        WHERE c.tipo ILIKE '%brucelose%' OR c.subtipo ILIKE '%brucelose%' OR c.observacoes ILIKE '%brucelose%'
        UNION
        SELECT DISTINCT h.animal_id
        FROM historia_ocorrencias h
        WHERE LOWER(h.tipo) LIKE '%brucelose%' OR LOWER(h.descricao) LIKE '%brucelose%'
      )
      SELECT
        a.id,
        a.serie,
        a.rg,
        a.sexo,
        a.data_nascimento,
        (CURRENT_DATE - a.data_nascimento::date) as idade_dias,
        ROUND((CURRENT_DATE - a.data_nascimento::date) / 30.44, 2) as idade_meses_decimal,
        FLOOR((CURRENT_DATE - a.data_nascimento::date) / 30.44) as idade_meses
      FROM animais a
      LEFT JOIN animais_com_brucelose b ON a.id = b.animal_id
      WHERE a.situacao = 'Ativo'
        AND a.sexo = 'Fêmea'
        AND a.data_nascimento IS NOT NULL
        AND b.animal_id IS NULL
        AND (CURRENT_DATE - a.data_nascimento::date) BETWEEN 90 AND 240
      ORDER BY idade_dias ASC
    `)

    console.log(`Total de animais encontrados: ${result.rows.length}\n`)

    // Verificar se há animais com menos de 90 dias
    const animaisComMenosDe90Dias = result.rows.filter(a => a.idade_dias < 90)
    if (animaisComMenosDe90Dias.length > 0) {
      console.log('⚠️  PROBLEMA ENCONTRADO: Animais com menos de 90 dias (menos de 3 meses):')
      animaisComMenosDe90Dias.forEach(a => {
        console.log(`  - ${a.serie} ${a.rg}: ${a.idade_dias} dias (${a.idade_meses} meses)`)
      })
      console.log('')
    } else {
      console.log('✅ Nenhum animal com menos de 90 dias encontrado\n')
    }

    // Mostrar os primeiros 10 animais
    console.log('📋 Primeiros 10 animais (ordenados por idade crescente):')
    result.rows.slice(0, 10).forEach(a => {
      console.log(`  - ${a.serie} ${a.rg}: ${a.idade_dias} dias (${a.idade_meses_decimal} meses)`)
    })

    // Verificar se há animais com mais de 240 dias
    const animaisComMaisDe240Dias = result.rows.filter(a => a.idade_dias > 240)
    if (animaisComMaisDe240Dias.length > 0) {
      console.log('\n⚠️  PROBLEMA ENCONTRADO: Animais com mais de 240 dias (mais de 8 meses):')
      animaisComMaisDe240Dias.forEach(a => {
        console.log(`  - ${a.serie} ${a.rg}: ${a.idade_dias} dias (${a.idade_meses} meses)`)
      })
    } else {
      console.log('\n✅ Nenhum animal com mais de 240 dias encontrado')
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }
}

debugBrucelose()
