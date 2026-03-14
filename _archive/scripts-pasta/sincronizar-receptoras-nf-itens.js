/**
 * Sincroniza receptoras a partir dos ITENS reais da NF 2141.
 * Cria animais que não existem, cria TEs, atualiza dados.
 */
require('dotenv').config()
const { query } = require('../lib/database')

const DATA_TE = '2025-10-30'
const NUMERO_NF = '2141'

async function sincronizar() {
  console.log('\n=== SINCRONIZANDO RECEPTORAS DA NF 2141 (A PARTIR DOS ITENS) ===\n')

  try {
    const nf = await query(`SELECT id, numero_nf, data_te, data_chegada_animais, data_compra, data, fornecedor FROM notas_fiscais WHERE numero_nf = $1`, [NUMERO_NF])
    if (nf.rows.length === 0) {
      console.log('❌ NF 2141 não encontrada')
      return
    }
    const nfRow = nf.rows[0]

    await query(`UPDATE notas_fiscais SET data_te = $1, eh_receptoras = true WHERE id = $2`, [DATA_TE, nfRow.id])
    const dataChegada = nfRow.data_chegada_animais || nfRow.data_compra || nfRow.data
    const dataChegadaStr = dataChegada ? new Date(dataChegada).toISOString().split('T')[0] : null
    const fornecedor = nfRow.fornecedor || 'Não informado'

    const itens = await query(`
      SELECT id, dados_item FROM notas_fiscais_itens
      WHERE nota_fiscal_id = $1 AND (tipo_produto = 'bovino' OR tipo_produto IS NULL)
    `, [nfRow.id])

    console.log(`📋 ${itens.rows.length} receptoras encontradas na NF\n`)

    let criados = 0, teCriadas = 0, atualizados = 0

    for (const item of itens.rows) {
      const d = item.dados_item || {}
      const tatuagem = (d.tatuagem || d.brinco || '').toString().trim().replace(/\s+/g, ' ')
      if (!tatuagem) continue

      const match = tatuagem.match(/^(\D*)\s*(\d+)$/)
      const parteLetra = match ? (match[1] || 'M').trim() : 'M'
      const parteNum = match ? match[2] : tatuagem.replace(/\D/g, '')
      const serie = (parteLetra + parteNum).replace(/\s/g, '') || 'M' + parteNum
      const rg = parteNum || ''

      if (!serie || !rg) continue

      let animal = (await query(`SELECT id, serie, rg FROM animais WHERE (serie = $1 AND rg = $2) OR (serie = $3 AND rg = $2) LIMIT 1`, [serie, rg, serie.replace(/(\d+)$/, '') + rg]))?.rows[0]

      if (!animal) {
        const insert = await query(`
          INSERT INTO animais (serie, rg, nome, sexo, raca, situacao, data_chegada, data_compra, fornecedor)
          VALUES ($1, $2, $3, 'Fêmea', 'Mestiça', 'Ativo', $4, $5, $6)
          RETURNING id, serie, rg
        `, [serie, rg, `${serie} ${rg}`.trim(), dataChegadaStr, dataChegadaStr, fornecedor])
        animal = insert.rows[0]
        criados++
        console.log(`  ✅ Animal criado: ${serie}`)
      } else {
        await query(`UPDATE animais SET data_chegada = COALESCE(data_chegada, $1), data_compra = COALESCE(data_compra, $2), fornecedor = COALESCE(fornecedor, $3), updated_at = NOW() WHERE id = $4`, [dataChegadaStr, dataChegadaStr, fornecedor, animal.id])
        atualizados++
      }

      const teExiste = (await query(`SELECT id FROM transferencias_embrioes WHERE receptora_id = $1 AND data_te = $2`, [animal.id, DATA_TE])).rows.length > 0
      if (!teExiste) {
        await query(`
          INSERT INTO transferencias_embrioes (numero_te, receptora_id, data_te, local_te, status, observacoes)
          VALUES ($1, $2, $3, $4, 'realizada', $5)
        `, [`TE-NF-${NUMERO_NF}-${animal.id}`, animal.id, DATA_TE, fornecedor, `NF de Entrada: ${NUMERO_NF} - Data TE 30/10/2025`])
        teCriadas++
        console.log(`  📅 TE criada para ${animal.serie}`)
      }
    }

    console.log('\n=== RESUMO ===')
    console.log(`✅ Animais criados: ${criados}`)
    console.log(`📅 TEs criadas: ${teCriadas}`)
    console.log(`📝 Animais atualizados: ${atualizados}`)
    console.log('\n💡 As 19 receptoras estão em: Animais > busque "M" ou NF 2141')
    console.log('   Ou em: Notas Fiscais > busque 2141 > Ver detalhes\n')
  } catch (err) {
    console.error('❌ Erro:', err.message)
  }
}

sincronizar().then(() => process.exit(0))
