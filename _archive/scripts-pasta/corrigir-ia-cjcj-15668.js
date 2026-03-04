/**
 * Corrige IAs da CJCJ 15668 (MAESTRA SANT ANNA):
 * - IA com LANDROVES DA XARAES → Prenha (gestação atual)
 * - IA com REM 11627, JAMANTA ou qualquer outro → Vazia
 *
 * Uso: node scripts/corrigir-ia-cjcj-15668.js
 */
require('dotenv').config({ path: '.env.local' })
const { query } = require('../lib/database')

const SERIE = 'CJCJ'
const RG = '15668'

async function corrigir() {
  console.log('🔧 Corrigindo IAs da CJCJ 15668 (MAESTRA SANT ANNA)\n')

  try {
    const cols = await query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'inseminacoes' AND column_name IN ('resultado_dg', 'status_gestacao', 'touro_nome', 'touro')
    `)
    let temResultadoDg = cols.rows.some(r => r.column_name === 'resultado_dg')
    let temStatusGestacao = cols.rows.some(r => r.column_name === 'status_gestacao')

    if (!temResultadoDg) {
      console.log('   Adicionando coluna resultado_dg em inseminacoes...')
      await query('ALTER TABLE inseminacoes ADD COLUMN IF NOT EXISTS resultado_dg VARCHAR(50)')
      temResultadoDg = true
    }
    if (!temStatusGestacao) {
      console.log('   Adicionando coluna status_gestacao em inseminacoes...')
      await query('ALTER TABLE inseminacoes ADD COLUMN IF NOT EXISTS status_gestacao VARCHAR(20)')
      temStatusGestacao = true
    }
    console.log('')

    const animal = await query(
      `SELECT id, serie, rg, nome FROM animais 
       WHERE UPPER(TRIM(serie)) = $1 AND TRIM(rg::text) = $2`,
      [SERIE.toUpperCase(), RG]
    )
    if (animal.rows.length === 0) {
      console.log('❌ Animal CJCJ 15668 não encontrado.')
      process.exit(1)
    }
    const animalId = animal.rows[0].id
    console.log(`   Animal: ${animal.rows[0].nome || `${SERIE} ${RG}`} (ID ${animalId})\n`)

    const temTouroNome = cols.rows.some(r => r.column_name === 'touro_nome')
    const temTouro = cols.rows.some(r => r.column_name === 'touro')
    const touroCol = temTouroNome ? 'touro_nome' : (temTouro ? 'touro' : null)
    let ins
    try {
      const selCols = ['i.id', 'i.data_ia', touroCol ? `COALESCE(i.${touroCol}, es.nome_touro) as touro` : "COALESCE(es.nome_touro, '') as touro"]
      if (temResultadoDg) selCols.push('i.resultado_dg')
      if (temStatusGestacao) selCols.push('i.status_gestacao')
      ins = await query(
        `SELECT ${selCols.join(', ')}
         FROM inseminacoes i
         LEFT JOIN estoque_semen es ON i.semen_id = es.id
         WHERE i.animal_id = $1 
         ORDER BY i.data_ia DESC`,
        [animalId]
      )
    } catch (e) {
      if (e.code === '42P01' || e.message?.includes('estoque_semen')) {
        const selCols = ['id', 'data_ia', touroCol ? `${touroCol} as touro` : "'' as touro"]
        if (temResultadoDg) selCols.push('resultado_dg')
        if (temStatusGestacao) selCols.push('status_gestacao')
        ins = await query(
          `SELECT ${selCols.join(', ')} FROM inseminacoes WHERE animal_id = $1 ORDER BY data_ia DESC`,
          [animalId]
        )
      } else throw e
    }

    if (ins.rows.length === 0) {
      console.log('   ⚠️ Nenhuma inseminação encontrada.')
      process.exit(0)
    }

    console.log('   IAs encontradas:')
    ins.rows.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.data_ia} | ${r.touro || '-'} | DG: ${r.resultado_dg || '-'} | Status: ${r.status_gestacao || '-'}`)
    })
    console.log('')

    const ehLandrovesXaraes = (t) => {
      const u = (t || '').toUpperCase()
      return (u.includes('LANDROVES') || u.includes('LANDROVER')) && u.includes('XARAES')
    }

    const setResultado = temResultadoDg ? "resultado_dg = 'Vazia', " : ''
    const setPrenha = temResultadoDg ? "resultado_dg = 'Prenha', " : ''
    let atualizados = 0

    for (const row of ins.rows) {
      const touro = (row.touro || '').trim()
      if (ehLandrovesXaraes(touro)) {
        await query(
          `UPDATE inseminacoes SET ${setPrenha}status_gestacao = 'Prenha', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [row.id]
        )
        console.log(`   ✅ IA ${row.id} (${touro}) → Prenha`)
        atualizados++
      } else {
        await query(
          `UPDATE inseminacoes SET ${setResultado}status_gestacao = 'Vazia', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [row.id]
        )
        console.log(`   ✅ IA ${row.id} (${touro}) → Vazia`)
        atualizados++
      }
    }

    console.log(`\n   📋 ${atualizados} registro(s) atualizado(s).`)
    console.log('\n   💡 Acesse /consulta-animal/239 ou busque CJCJ 15668 para ver o touro correto (LANDROVES DA XARAES) e a previsão de parto.')
  } catch (err) {
    console.error('❌ Erro:', err.message)
    process.exit(1)
  }
  process.exit(0)
}

corrigir()
