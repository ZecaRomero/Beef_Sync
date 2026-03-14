/**
 * Corrige situacao_abcz para animais CJCJ que constam no Excel como POSSUI RGN.
 * Linhas visíveis: 16234, 16236, 16238, 16239, 16243, 16245
 * Uso: node scripts/corrigir-situacao-abcz-cjcj.js
 */
require('dotenv').config({ path: '.env.local' })
const { query } = require('../lib/database')

const RGS = ['16234', '16236', '16238', '16239', '16243', '16245']

async function corrigir() {
  console.log('�Ÿ”� Corrigindo Situação ABCZ (POSSUI RGN) para CJCJ...\n')

  try {
    for (const rg of RGS) {
      const res = await query(
        `UPDATE animais 
         SET situacao_abcz = 'POSSUI RGN', updated_at = CURRENT_TIMESTAMP
         WHERE UPPER(TRIM(serie)) = 'CJCJ' AND TRIM(rg::text) = $1
         RETURNING id, serie, rg`,
        [rg]
      )
      if (res.rows.length > 0) {
        console.log(`   �œ… CJCJ ${rg} (ID ${res.rows[0].id})`)
      } else {
        console.log(`   �š�️ CJCJ ${rg} não encontrado`)
      }
    }

    // Verificar quantos CJCJ ainda sem situacao_abcz
    const sem = await query(`
      SELECT COUNT(*) as c FROM animais 
      WHERE UPPER(TRIM(serie)) = 'CJCJ' 
        AND (situacao_abcz IS NULL OR TRIM(situacao_abcz) = '')
    `)
    console.log(`\n�Ÿ“‹ CJCJ ainda sem Situação ABCZ: ${sem.rows[0].c}`)
    console.log('   �Ÿ’� Use "Excluir todas e importar novamente" + seu Excel para preencher todos.')
  } catch (err) {
    console.error('�Œ Erro:', err.message)
    process.exit(1)
  }
  process.exit(0)
}

corrigir()
