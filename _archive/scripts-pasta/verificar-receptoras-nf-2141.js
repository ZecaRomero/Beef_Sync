/**
 * Verifica receptoras da NF 2141 no banco de dados.
 * Mostra quais existem, quais faltam, e onde encontrá-las.
 */
require('dotenv').config()
const { query } = require('../lib/database')

async function verificar() {
  console.log('\n=== VERIFICANDO RECEPTORAS DA NF 2141 ===\n')

  try {
    // 1. Buscar NF 2141
    const nf = await query(`
      SELECT id, numero_nf, eh_receptoras, receptora_letra, receptora_numero, data_te, fornecedor
      FROM notas_fiscais WHERE numero_nf = '2141'
    `)
    if (nf.rows.length === 0) {
      console.log('❌ NF 2141 não encontrada')
      return
    }
    console.log('✅ NF 2141 encontrada\n')

    // 2. Buscar itens da NF (receptoras cadastradas na NF)
    const itens = await query(`
      SELECT id, dados_item, tipo_produto
      FROM notas_fiscais_itens
      WHERE nota_fiscal_id = $1 AND (tipo_produto = 'bovino' OR tipo_produto IS NULL)
      ORDER BY id
    `, [nf.rows[0].id])
    console.log(`📋 Itens na NF (notas_fiscais_itens): ${itens.rows.length}`)
    if (itens.rows.length > 0) {
      itens.rows.forEach((item, i) => {
        const d = item.dados_item || {}
        const tat = d.tatuagem || d.brinco || '-'
        console.log(`   ${i + 1}. ${tat}`)
      })
    } else {
      console.log('   (NF pode ter sido cadastrada sem itens - receptoras criadas por script)')
    }

    // 3. Buscar animais que têm TE da NF 2141
    const teReceptoras = await query(`
      SELECT a.id, a.serie, a.rg, a.nome, te.data_te
      FROM transferencias_embrioes te
      JOIN animais a ON a.id = te.receptora_id
      WHERE te.observacoes LIKE '%2141%'
      ORDER BY a.serie
    `)
    console.log(`\n📋 Animais com TE da NF 2141 (no banco): ${teReceptoras.rows.length}`)
    teReceptoras.rows.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.serie} (ID: ${r.id}) - /animals/${r.id}`)
    })

    // 4. Buscar todos animais Mestiça/Receptora com série M
    const todasM = await query(`
      SELECT id, serie, rg, nome, raca
      FROM animais
      WHERE LOWER(raca) LIKE '%mesti%' OR LOWER(raca) LIKE '%receptora%'
      ORDER BY serie
    `)
    console.log(`\n📋 Total de receptoras (Mestiça) no banco: ${todasM.rows.length}`)
    const seriesM = todasM.rows.filter(a => (a.serie || '').startsWith('M'))
    console.log(`   Com série M...: ${seriesM.length}`)
    seriesM.slice(0, 25).forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.serie} (ID: ${r.id})`)
    })
    if (seriesM.length > 25) console.log(`   ... e mais ${seriesM.length - 25}`)

    console.log('\n💡 Para ver na tela:')
    console.log('   - Animais: /animals (busque por "M" ou "1815")')
    console.log('   - Detalhe: /animals/1632 (ex: M1815)')
    console.log('   - Notas Fiscais: /notas-fiscais (busque 2141)\n')
  } catch (err) {
    console.error('❌ Erro:', err.message)
  }
}

verificar().then(() => process.exit(0))
