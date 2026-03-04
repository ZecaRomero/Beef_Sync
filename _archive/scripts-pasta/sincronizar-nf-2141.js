/**
 * Script para sincronizar dados da NF 2141 para todas as receptoras.
 * M1815 e demais: data_te 30/10/2025, NF de origem, fornecedor, data de compra/chegada.
 * 
 * Uso: node scripts/sincronizar-nf-2141.js
 */
require('dotenv').config()
const { query } = require('../lib/database')

const DATA_TE_NF_2141 = '2025-10-30' // 30/10/2025
const NUMERO_NF = '2141'

// 19 receptoras da NF 2141 (série M + número)
const NUMEROS_RECEPTORAS = ['1815', '3233', '3238', '3239', '3240', '3241', '3242', '3243', '3244', '3245', '3246', '3247', '3248', '3249', '3250', '3251', '3252', '3253', '3254']

async function sincronizarNF2141() {
  console.log('\n=== SINCRONIZANDO DADOS DA NF 2141 PARA TODAS AS RECEPTORAS ===\n')
  console.log(`Data da TE: ${DATA_TE_NF_2141} (30/10/2025)`)
  console.log(`Receptoras: ${NUMEROS_RECEPTORAS.length}\n`)

  try {
    // 1. Buscar NF 2141
    const nfResult = await query(`
      SELECT id, numero_nf, data_te, data_chegada_animais, data_compra, data,
             receptora_letra, receptora_numero, fornecedor
      FROM notas_fiscais
      WHERE numero_nf = $1
    `, [NUMERO_NF])

    if (nfResult.rows.length === 0) {
      console.log('❌ NF 2141 não encontrada no banco!')
      console.log('   Verifique se a NF foi cadastrada em Notas Fiscais > Entrada.')
      return
    }

    const nf = nfResult.rows[0]
    console.log(`✅ NF 2141 encontrada (ID: ${nf.id})`)
    console.log(`   Fornecedor: ${nf.fornecedor || 'Não informado'}`)
    console.log(`   Data TE atual: ${nf.data_te || 'Não definida'}`)
    console.log(`   Data chegada: ${nf.data_chegada_animais || nf.data_compra || nf.data || 'Não informada'}\n`)

    // 2. Atualizar NF com data_te se não estiver correta
    if (!nf.data_te || new Date(nf.data_te).toISOString().split('T')[0] !== DATA_TE_NF_2141) {
      await query(`
        UPDATE notas_fiscais 
        SET data_te = $1, eh_receptoras = true, updated_at = NOW()
        WHERE id = $2
      `, [DATA_TE_NF_2141, nf.id])
      console.log(`📝 NF 2141 atualizada com data_te = 30/10/2025\n`)
    }

    const dataChegada = nf.data_chegada_animais || nf.data_compra || nf.data
    const dataChegadaStr = dataChegada ? new Date(dataChegada).toISOString().split('T')[0] : null
    const dataCompraStr = nf.data_compra ? new Date(nf.data_compra).toISOString().split('T')[0] : (dataChegadaStr || new Date().toISOString().split('T')[0])
    const fornecedor = nf.fornecedor || 'Não informado'

    // 3. Garantir colunas na tabela animais
    await query(`ALTER TABLE animais ADD COLUMN IF NOT EXISTS data_chegada DATE`).catch(() => {})
    await query(`ALTER TABLE animais ADD COLUMN IF NOT EXISTS data_compra DATE`).catch(() => {})
    await query(`ALTER TABLE animais ADD COLUMN IF NOT EXISTS fornecedor VARCHAR(255)`).catch(() => {})

    let teCriadas = 0
    let teJaExistiam = 0
    let animaisAtualizados = 0
    let naoEncontrados = []

    for (const numero of NUMEROS_RECEPTORAS) {
      const serie = `M${numero}`
      const rg = numero

      // Buscar animal
      const animalRes = await query(`
        SELECT id, serie, rg, nome FROM animais
        WHERE (serie = $1 AND rg = $2) OR (serie = $3 AND rg = $2)
        LIMIT 1
      `, [serie, rg, `M ${numero}`])

      if (animalRes.rows.length === 0) {
        naoEncontrados.push(serie)
        continue
      }

      const animal = animalRes.rows[0]

      // Criar TE se não existir
      const teExiste = await query(`
        SELECT id FROM transferencias_embrioes
        WHERE receptora_id = $1 AND data_te = $2
      `, [animal.id, DATA_TE_NF_2141])

      if (teExiste.rows.length === 0) {
        const numeroTE = `TE-NF-${NUMERO_NF}-${animal.id}-${Date.now()}`
        await query(`
          INSERT INTO transferencias_embrioes (
            numero_te, receptora_id, data_te, local_te, status, observacoes
          ) VALUES ($1, $2, $3, $4, 'realizada', $5)
        `, [numeroTE, animal.id, DATA_TE_NF_2141, fornecedor, `NF de Entrada: ${NUMERO_NF} - Data TE 30/10/2025`])
        teCriadas++
        console.log(`  ✅ TE criada para ${serie}`)
      } else {
        teJaExistiam++
      }

      // Atualizar animal com dados da NF
      const updates = []
      const valores = []
      let p = 0
      if (dataChegadaStr) {
        updates.push(`data_chegada = $${++p}`)
        valores.push(dataChegadaStr)
      }
      if (dataCompraStr) {
        updates.push(`data_compra = $${++p}`)
        valores.push(dataCompraStr)
      }
      if (fornecedor) {
        updates.push(`fornecedor = $${++p}`)
        valores.push(fornecedor)
      }
      if (updates.length > 0) {
        valores.push(animal.id)
        await query(`
          UPDATE animais SET ${updates.join(', ')}, updated_at = NOW()
          WHERE id = $${++p}
        `, valores)
        animaisAtualizados++
      }
    }

    console.log('\n=== RESUMO ===')
    console.log(`✅ TEs criadas: ${teCriadas}`)
    console.log(`ℹ️ TEs já existiam: ${teJaExistiam}`)
    console.log(`📅 Animais atualizados (data_chegada, data_compra, fornecedor): ${animaisAtualizados}`)
    if (naoEncontrados.length > 0) {
      console.log(`⚠️ Animais não encontrados: ${naoEncontrados.join(', ')}`)
    }
    console.log('\n💡 Recarregue a página do animal (M1815) para ver os dados atualizados.')
    console.log('   NF de Origem, Data da TE e Data de Compra devem aparecer corretamente.\n')

  } catch (err) {
    console.error('❌ Erro:', err.message)
    throw err
  }
}

sincronizarNF2141()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
