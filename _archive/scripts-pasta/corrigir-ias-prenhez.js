/**
 * Corrige IAs de prenhez para animais específicos:
 * - CJCJ 15959 (MOSCA SANT ANNA): Prenha do IDEAL GUADALUPE
 * - CJCJ 15668 (MAESTRA SANT ANNA): Prenha do LANDROVES DA XARAES
 *
 * Uso: node scripts/corrigir-ias-prenhez.js
 */
require('dotenv').config({ path: '.env.local' })
const { query } = require('../lib/database')

const CORRECOES = [
  { serie: 'CJCJ', rg: '15959', touroPrenha: (t) => (t || '').toUpperCase().includes('IDEAL') && (t || '').toUpperCase().includes('GUADALUPE') },
  { serie: 'CJCJ', rg: '15668', touroPrenha: (t) => { const u = (t || '').toUpperCase(); return (u.includes('LANDROVES') || u.includes('LANDROVER')) && u.includes('XARAES') } }
]

async function corrigir() {
  console.log('🔧 Corrigindo IAs de prenhez (CJCJ 15959 e CJCJ 15668)\n')

  try {
    const cols = await query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'inseminacoes' AND column_name IN ('resultado_dg', 'status_gestacao', 'touro_nome', 'touro')
    `)
    let temResultadoDg = cols.rows.some(r => r.column_name === 'resultado_dg')
    let temStatusGestacao = cols.rows.some(r => r.column_name === 'status_gestacao')

    if (!temResultadoDg) {
      await query('ALTER TABLE inseminacoes ADD COLUMN IF NOT EXISTS resultado_dg VARCHAR(50)')
      temResultadoDg = true
    }
    if (!temStatusGestacao) {
      await query('ALTER TABLE inseminacoes ADD COLUMN IF NOT EXISTS status_gestacao VARCHAR(20)')
      temStatusGestacao = true
    }

    const temTouroNome = cols.rows.some(r => r.column_name === 'touro_nome')
    const temTouro = cols.rows.some(r => r.column_name === 'touro')
    const touroCol = temTouroNome ? 'touro_nome' : (temTouro ? 'touro' : null)
    const setResultado = temResultadoDg ? "resultado_dg = 'Vazia', " : ''
    const setPrenha = temResultadoDg ? "resultado_dg = 'Prenha', " : ''

    let totalAtualizados = 0

    for (const { serie, rg, touroPrenha } of CORRECOES) {
      const animal = await query(
        `SELECT id, serie, rg, nome FROM animais 
         WHERE UPPER(TRIM(serie)) = $1 AND TRIM(rg::text) = $2`,
        [serie.toUpperCase(), rg]
      )
      if (animal.rows.length === 0) {
        console.log(`   ⚠️ Animal ${serie} ${rg} não encontrado.`)
        continue
      }
      const animalId = animal.rows[0].id
      const nome = animal.rows[0].nome || `${serie} ${rg}`
      console.log(`\n   📌 ${serie} ${rg} (${nome}) - ID ${animalId}`)

      let ins
      try {
        const selCols = ['i.id', 'i.data_ia', touroCol ? `COALESCE(i.${touroCol}, es.nome_touro) as touro` : "COALESCE(es.nome_touro, '') as touro"]
        if (temResultadoDg) selCols.push('i.resultado_dg')
        if (temStatusGestacao) selCols.push('i.status_gestacao')
        ins = await query(
          `SELECT ${selCols.join(', ')}
           FROM inseminacoes i
           LEFT JOIN estoque_semen es ON i.semen_id = es.id
           WHERE i.animal_id = $1 ORDER BY i.data_ia DESC`,
          [animalId]
        )
      } catch (e) {
        if (e.code === '42P01' || e.message?.includes('estoque_semen')) {
          const selCols = ['id', 'data_ia', touroCol ? `${touroCol} as touro` : "'' as touro"]
          if (temResultadoDg) selCols.push('resultado_dg')
          if (temStatusGestacao) selCols.push('status_gestacao')
          ins = await query(`SELECT ${selCols.join(', ')} FROM inseminacoes WHERE animal_id = $1 ORDER BY data_ia DESC`, [animalId])
        } else throw e
      }

      if (ins.rows.length === 0) {
        console.log('      Nenhuma IA encontrada.')
        continue
      }

      for (const row of ins.rows) {
        const touro = (row.touro || '').trim()
        if (touroPrenha(touro)) {
          await query(`UPDATE inseminacoes SET ${setPrenha}status_gestacao = 'Prenha', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [row.id])
          console.log(`      ✅ IA ${row.id} (${touro}) → Prenha`)
          totalAtualizados++
        } else {
          await query(`UPDATE inseminacoes SET ${setResultado}status_gestacao = 'Vazia', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [row.id])
          console.log(`      ✅ IA ${row.id} (${touro}) → Vazia`)
          totalAtualizados++
        }
      }
    }

    console.log(`\n   📋 Total: ${totalAtualizados} registro(s) atualizado(s).`)
    console.log('\n   💡 Recarregue as páginas de consulta para ver os touros corretos.')
  } catch (err) {
    console.error('❌ Erro:', err.message)
    process.exit(1)
  }
  process.exit(0)
}

corrigir()
