/**
 * Verifica animais com múltiplas IAs e identifica possíveis inconsistências.
 * Casos: última IA (cronológica) é Vazia mas existe IA prenha mais antiga.
 *
 * Uso: node scripts/verificar-ias-prenhez.js
 */
require('dotenv').config({ path: '.env.local' })
const { query } = require('../lib/database')

async function verificar() {
  console.log('🔍 Verificando IAs e prenhez...\n')

  try {
    const cols = await query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'inseminacoes' AND column_name IN ('resultado_dg', 'status_gestacao', 'touro_nome', 'touro', 'data_ia')
    `)
    const temResultadoDg = cols.rows.some(r => r.column_name === 'resultado_dg')
    const temStatusGestacao = cols.rows.some(r => r.column_name === 'status_gestacao')
    const temTouroNome = cols.rows.some(r => r.column_name === 'touro_nome')
    const temTouro = cols.rows.some(r => r.column_name === 'touro')
    const touroCol = temTouroNome ? 'touro_nome' : (temTouro ? 'touro' : null)

    let ins
    try {
      const selCols = [
        'i.id', 'i.animal_id', 'i.data_ia',
        touroCol ? `COALESCE(i.${touroCol}, es.nome_touro) as touro` : "COALESCE(es.nome_touro, '') as touro",
        temResultadoDg ? 'i.resultado_dg' : "'' as resultado_dg",
        temStatusGestacao ? 'i.status_gestacao' : "'' as status_gestacao"
      ]
      ins = await query(`
        SELECT ${selCols.join(', ')}
        FROM inseminacoes i
        LEFT JOIN estoque_semen es ON i.semen_id = es.id
        WHERE i.data_ia IS NOT NULL
        ORDER BY i.animal_id, i.data_ia DESC
      `)
    } catch (e) {
      if (e.code === '42P01' || e.message?.includes('estoque_semen')) {
        const selCols = ['id', 'animal_id', 'data_ia', touroCol ? `${touroCol} as touro` : "'' as touro", temResultadoDg ? 'resultado_dg' : "'' as resultado_dg", temStatusGestacao ? 'status_gestacao' : "'' as status_gestacao"]
        ins = await query(`SELECT ${selCols.join(', ')} FROM inseminacoes WHERE data_ia IS NOT NULL ORDER BY animal_id, data_ia DESC`)
      } else throw e
    }

    const ehVazia = (r) => {
      const s = String(r || '').toLowerCase()
      return s.includes('vazia') || s.includes('vazio') || s.includes('negativo')
    }
    const ehPrenha = (r) => {
      if (ehVazia(r)) return false
      const s = String(r || '').toLowerCase()
      return s.includes('prenha') || s.includes('pren') || s.includes('positivo') || s.trim() === 'p'
    }

    // Agrupar por animal
    const porAnimal = new Map()
    for (const row of ins.rows) {
      const aid = row.animal_id
      if (!porAnimal.has(aid)) porAnimal.set(aid, [])
      porAnimal.get(aid).push(row)
    }

    // Buscar nomes dos animais
    const animalIds = [...porAnimal.keys()]
    let nomes = {}
    if (animalIds.length > 0) {
      const anim = await query(
        `SELECT id, serie, rg, nome FROM animais WHERE id = ANY($1)`,
        [animalIds]
      )
      anim.rows.forEach(a => { nomes[a.id] = `${a.serie || ''} ${a.rg || ''}`.trim() || a.nome || `ID ${a.id}` })
    }

    const suspeitos = []
    for (const [animalId, ias] of porAnimal) {
      if (ias.length < 2) continue
      const ultima = ias[0]
      const penultima = ias[1]
      const ultimaVazia = ehVazia(ultima.resultado_dg) || ehVazia(ultima.status_gestacao)
      const ultimaPrenha = ehPrenha(ultima.resultado_dg) || ehPrenha(ultima.status_gestacao)
      const temPrenhaAntiga = ias.some((ia, idx) => idx > 0 && (ehPrenha(ia.resultado_dg) || ehPrenha(ia.status_gestacao)))

      if (ultimaVazia && temPrenhaAntiga) {
        const iaPrenha = ias.find((ia, idx) => idx > 0 && (ehPrenha(ia.resultado_dg) || ehPrenha(ia.status_gestacao)))
        suspeitos.push({
          animalId,
          nome: nomes[animalId] || `ID ${animalId}`,
          ultimaIA: { data: ultima.data_ia, touro: ultima.touro, status: ultima.resultado_dg || ultima.status_gestacao },
          iaPrenha: iaPrenha ? { data: iaPrenha.data_ia, touro: iaPrenha.touro, status: iaPrenha.resultado_dg || iaPrenha.status_gestacao } : null,
          totalIAs: ias.length
        })
      }
    }

    // Listar todos os animais com 2+ IAs para revisão
    const multiIA = [...porAnimal.entries()].filter(([, ias]) => ias.length >= 2)
    console.log(`   📊 Animais com 2+ IAs: ${multiIA.length}\n`)

    if (suspeitos.length === 0) {
      console.log('   ✅ Nenhum animal com "última IA vazia" e "IA prenha mais antiga" encontrado.')
      console.log('   (Sistema prioriza IA prenha → touro correto exibido.)\n')
    } else {
      console.log(`   ⚠️ ${suspeitos.length} animal(is) com última IA vazia e IA prenha mais antiga:\n`)
      console.log('   (Última IA = vazia, mas existe IA prenha mais antiga → sistema mostra touro da IA prenha)\n')
      suspeitos.forEach((s, i) => {
        console.log(`   ${i + 1}. ${s.nome} (ID ${s.animalId})`)
        console.log(`      Última IA: ${s.ultimaIA.data} | ${s.ultimaIA.touro || '-'} | ${s.ultimaIA.status || '-'}`)
        if (s.iaPrenha) {
          console.log(`      IA Prenha: ${s.iaPrenha.data} | ${s.iaPrenha.touro || '-'} | ${s.iaPrenha.status || '-'}`)
        }
        console.log('')
      })
      console.log('   💡 Para corrigir dados no banco: node scripts/corrigir-ias-prenhez.js')
    }
    console.log('\n   📋 Lógica: 1) IA prenha, 2) IA não-vazia, 3) última IA cronológica')
  } catch (err) {
    console.error('❌ Erro:', err.message)
    process.exit(1)
  }
  process.exit(0)
}

verificar()
