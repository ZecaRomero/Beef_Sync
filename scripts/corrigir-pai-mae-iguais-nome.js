/**
 * Encontra e corrige animais onde pai ou mae estão preenchidos com o nome do próprio animal.
 * Isso ocorreu por bug no mapeamento de colunas do Excel (coluna "Nome" era usada para Pai/Mãe).
 *
 * Uso: node scripts/corrigir-pai-mae-iguais-nome.js [--corrigir]
 *      --corrigir = aplica a correção (zera pai/mae quando iguais ao nome)
 */
const { query } = require('../lib/database')

function normalizar(s) {
  if (!s) return ''
  return String(s).trim().toUpperCase()
}

async function main() {
  const corrigir = process.argv.includes('--corrigir')

  console.log('🔍 Buscando animais com pai ou mae = nome do próprio animal...\n')

  const r = await query(`
    SELECT id, serie, rg, nome, pai, mae, serie_pai, rg_pai, serie_mae, rg_mae
    FROM animais
    WHERE (pai IS NOT NULL AND TRIM(pai) != '')
       OR (mae IS NOT NULL AND TRIM(mae) != '')
  `)

  const afetados = []
  for (const a of r.rows) {
    const nomeNorm = normalizar(a.nome)
    const paiNorm = normalizar(a.pai)
    const maeNorm = normalizar(a.mae)
    if (!nomeNorm) continue

    const paiErrado = paiNorm && paiNorm === nomeNorm
    const maeErrada = maeNorm && maeNorm === nomeNorm

    if (paiErrado || maeErrada) {
      afetados.push({
        ...a,
        paiErrado: !!paiErrado,
        maeErrada: !!maeErrada
      })
    }
  }

  console.log(`📊 Encontrados: ${afetados.length} animal(is) com pai/mae incorretos\n`)

  if (afetados.length === 0) {
    console.log('✅ Nenhum animal com esse problema.')
    return
  }

  console.log('Lista (primeiros 30):')
  afetados.slice(0, 30).forEach((a, i) => {
    console.log(`  ${i + 1}. ${a.serie} ${a.rg} | ${a.nome}`)
    if (a.paiErrado) console.log(`     Pai (errado): "${a.pai}"`)
    if (a.maeErrada) console.log(`     Mãe (errada): "${a.mae}"`)
  })
  if (afetados.length > 30) {
    console.log(`  ... e mais ${afetados.length - 30} animais`)
  }

  if (corrigir) {
    console.log('\n🔧 Aplicando correção (zerando pai/mae incorretos)...')
    let corrigidos = 0
    for (const a of afetados) {
      const updates = []
      const values = []
      let i = 1
      if (a.paiErrado) {
        updates.push(`pai = $${i++}`)
        values.push(null)
      }
      if (a.maeErrada) {
        updates.push(`mae = $${i++}`)
        values.push(null)
      }
      if (updates.length > 0) {
        values.push(a.id)
        await query(
          `UPDATE animais SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length}`,
          values
        )
        corrigidos++
      }
    }
    console.log(`✅ ${corrigidos} animal(is) corrigido(s)`)
  } else {
    console.log('\n💡 Para aplicar a correção, execute: node scripts/corrigir-pai-mae-iguais-nome.js --corrigir')
  }
}

main().catch(e => {
  console.error('Erro:', e)
  process.exit(1)
}).finally(() => process.exit(0))
