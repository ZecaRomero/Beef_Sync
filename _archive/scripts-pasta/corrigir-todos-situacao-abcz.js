/**
 * Corrige situacao_abcz: "Ok para RGN" -> "POSSUI RGN"
 * Para animais que já possuem RGN (conforme planilha ABCZ).
 * 
 * Uso: node scripts/corrigir-todos-situacao-abcz.js [--dry-run]
 */
require('dotenv').config({ path: '.env.local' })
const { query } = require('../lib/database')

const DRY_RUN = process.argv.includes('--dry-run')

async function corrigir() {
  console.log(DRY_RUN ? '�Ÿ”� Modo dry-run (não altera o banco)\n' : '�Ÿ”� Corrigindo Situação ABCZ...\n')

  try {
    // 1. CJCJ 16958-16976: garantir que todos tenham POSSUI RGN (faixa do Excel do usuário)
    const cjcjFaixa = await query(`
      SELECT id, serie, rg, situacao_abcz 
      FROM animais 
      WHERE UPPER(TRIM(serie)) = 'CJCJ' 
        AND rg::text ~ '^[0-9]+$' 
        AND rg::int BETWEEN 16958 AND 16976
        AND (situacao_abcz IS NULL OR UPPER(TRIM(situacao_abcz)) <> 'POSSUI RGN')
      ORDER BY rg::int
    `)

    if (cjcjFaixa.rows.length > 0) {
      console.log(`�Ÿ“‹ CJCJ 16958-16976 a corrigir (${cjcjFaixa.rows.length}):`)
      cjcjFaixa.rows.forEach((r) => console.log(`   ${r.serie} ${r.rg} (atual: ${r.situacao_abcz || 'null'})`))
      if (!DRY_RUN) {
        await query(`
          UPDATE animais 
          SET situacao_abcz = 'POSSUI RGN', updated_at = CURRENT_TIMESTAMP
          WHERE UPPER(TRIM(serie)) = 'CJCJ' 
            AND rg::text ~ '^[0-9]+$' 
            AND rg::int BETWEEN 16958 AND 16976
        `)
        console.log(`   �œ… Atualizados: ${cjcjFaixa.rows.length}`)
      }
    }

    // 2. Todos com "Ok para RGN" -> "POSSUI RGN" (animais que já possuem RGN)
    const okParaRgn = await query(`
      SELECT id, serie, rg FROM animais 
      WHERE UPPER(TRIM(situacao_abcz)) = 'OK PARA RGN'
    `)

    if (okParaRgn.rows.length > 0) {
      console.log(`\n�Ÿ“‹ "Ok para RGN" -> "POSSUI RGN" (${okParaRgn.rows.length} animais)`)
      if (okParaRgn.rows.length <= 20) {
        okParaRgn.rows.forEach((r) => console.log(`   ${r.serie} ${r.rg}`))
      } else {
        okParaRgn.rows.slice(0, 10).forEach((r) => console.log(`   ${r.serie} ${r.rg}`))
        console.log(`   ... e mais ${okParaRgn.rows.length - 10}`)
      }
      if (!DRY_RUN) {
        await query(`
          UPDATE animais 
          SET situacao_abcz = 'POSSUI RGN', updated_at = CURRENT_TIMESTAMP
          WHERE UPPER(TRIM(situacao_abcz)) = 'OK PARA RGN'
        `)
        console.log(`   �œ… Corrigidos: ${okParaRgn.rows.length}`)
      }
    }

    // 3. Resumo final
    const resumo = await query(`
      SELECT situacao_abcz, COUNT(*) as total 
      FROM animais 
      WHERE situacao_abcz IS NOT NULL AND TRIM(situacao_abcz) <> ''
      GROUP BY situacao_abcz ORDER BY total DESC
    `)
    console.log('\n�Ÿ“Š Situação após correção:')
    resumo.rows.forEach((r) => console.log(`   "${r.situacao_abcz}": ${r.total}`))

    const total = await query('SELECT COUNT(*) as c FROM animais')
    console.log(`\n�Ÿ“� Total de animais no banco: ${total.rows[0].c}`)
  } catch (err) {
    console.error('�Œ Erro:', err.message)
    process.exit(1)
  }
  process.exit(0)
}

corrigir()
