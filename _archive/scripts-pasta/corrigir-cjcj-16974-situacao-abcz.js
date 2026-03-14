/**
 * Corrige situacao_abcz do animal CJCJ 16974: "Ok para RGN" -> "POSSUI RGN"
 * O animal já possui RGN, conforme planilha ABCZ.
 */
require('dotenv').config({ path: '.env.local' })
const { query } = require('../lib/database')

async function corrigir() {
  console.log('�Ÿ”� Corrigindo Situação ABCZ do CJCJ 16974...\n')

  try {
    const res = await query(
      `UPDATE animais 
       SET situacao_abcz = 'POSSUI RGN', updated_at = CURRENT_TIMESTAMP
       WHERE UPPER(TRIM(serie)) = 'CJCJ' AND TRIM(rg::text) = '16974'
       RETURNING id, serie, rg, situacao_abcz`
    )

    if (res.rows.length > 0) {
      console.log('�œ… Corrigido com sucesso!')
      console.log(`   ID: ${res.rows[0].id}`)
      console.log(`   Série: ${res.rows[0].serie} | RG: ${res.rows[0].rg}`)
      console.log(`   Situação ABCZ: ${res.rows[0].situacao_abcz}`)
    } else {
      console.log('�š�️ Animal CJCJ 16974 não encontrado no banco.')
    }
  } catch (err) {
    console.error('�Œ Erro:', err.message)
    process.exit(1)
  }
  process.exit(0)
}

corrigir()
