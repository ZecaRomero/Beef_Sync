/**
 * Verifica situacao_abcz no banco e identifica possíveis erros.
 * "Ok para RGN" = elegível para obter RGN | "POSSUI RGN" = já possui RGN
 */
require('dotenv').config({ path: '.env.local' })
const { query } = require('../lib/database')

async function verificar() {
  console.log('🔍 Verificando Situação ABCZ no banco...\n')

  try {
    // 1. Valores distintos e contagem
    const dist = await query(`
      SELECT situacao_abcz, COUNT(*) as total 
      FROM animais 
      WHERE situacao_abcz IS NOT NULL AND TRIM(situacao_abcz) <> ''
      GROUP BY situacao_abcz 
      ORDER BY total DESC
    `)
    console.log('📊 Valores de situacao_abcz no banco:')
    dist.rows.forEach((r) => console.log(`   "${r.situacao_abcz}": ${r.total} animais`))

    // 2. Animais com "Ok para RGN" (possivelmente errado - deveriam ser "POSSUI RGN")
    const okParaRgn = await query(`
      SELECT id, serie, rg, situacao_abcz 
      FROM animais 
      WHERE UPPER(TRIM(situacao_abcz)) = 'OK PARA RGN'
      ORDER BY serie, rg::int
    `)
    console.log(`\n⚠️ Animais com "Ok para RGN" (${okParaRgn.rows.length}):`)
    if (okParaRgn.rows.length > 0) {
      okParaRgn.rows.slice(0, 30).forEach((r) => console.log(`   ${r.serie} ${r.rg} (ID ${r.id})`))
      if (okParaRgn.rows.length > 30) console.log(`   ... e mais ${okParaRgn.rows.length - 30}`)
    }

    // 3. Animais CJCJ 16958-16976 (faixa do Excel do usuário)
    const cjcjFaixa = await query(`
      SELECT id, serie, rg, situacao_abcz 
      FROM animais 
      WHERE UPPER(TRIM(serie)) = 'CJCJ' 
        AND rg::text ~ '^[0-9]+$' 
        AND rg::int BETWEEN 16958 AND 16976
      ORDER BY rg::int
    `)
    console.log(`\n📋 Animais CJCJ 16958-16976 (faixa do Excel): ${cjcjFaixa.rows.length}`)
    const comOk = cjcjFaixa.rows.filter((r) => (r.situacao_abcz || '').toUpperCase().includes('OK PARA RGN'))
    const comPossui = cjcjFaixa.rows.filter((r) => (r.situacao_abcz || '').toUpperCase().includes('POSSUI RGN'))
    console.log(`   Com "Ok para RGN": ${comOk.length}`)
    console.log(`   Com "POSSUI RGN": ${comPossui.length}`)
    if (comOk.length > 0) {
      console.log('   IDs com "Ok para RGN":', comOk.map((r) => `${r.serie} ${r.rg}`).join(', '))
    }

    // 4. Total de animais no banco
    const total = await query('SELECT COUNT(*) as c FROM animais')
    console.log(`\n📦 Total de animais no banco: ${total.rows[0].c}`)
  } catch (err) {
    console.error('❌ Erro:', err.message)
    process.exit(1)
  }
  process.exit(0)
}

verificar()
