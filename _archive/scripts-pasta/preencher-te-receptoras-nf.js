/**
 * Script para preencher data_te e TEs das receptoras a partir das NFs de entrada.
 * 
 * - Busca NFs de receptoras com data_te
 * - Para cada item (receptora) da NF, cria TE em transferencias_embrioes se não existir
 * - Usa data_te da NF (informada na NF de entrada)
 * - Previsão de parto (9 meses após TE) só é aplicada quando DG = Prenha (não vazia)
 * 
 * Uso: node scripts/preencher-te-receptoras-nf.js
 */
require('dotenv').config()
const { query } = require('../lib/database')

async function preencherTEReceptoras() {
  console.log('\n=== PREENCHENDO DATA DE TE DAS RECEPTORAS A PARTIR DAS NFs ===\n')

  try {
    // 1. Buscar NFs de receptoras com data_te
    const nfsResult = await query(`
      SELECT id, numero_nf, data_te, data_chegada_animais, data_compra, 
             receptora_letra, receptora_numero, fornecedor
      FROM notas_fiscais
      WHERE eh_receptoras = true AND tipo = 'entrada'
        AND data_te IS NOT NULL
      ORDER BY data_te DESC
    `)

    if (nfsResult.rows.length === 0) {
      console.log('⚠️ Nenhuma NF de receptoras com data_te encontrada.')
      return
    }

    console.log(`📋 Encontradas ${nfsResult.rows.length} NFs de receptoras com data_te\n`)

    let teCriadas = 0
    let teJaExistiam = 0
    let animaisAtualizados = 0

    for (const nf of nfsResult.rows) {
      const dataTEStr = nf.data_te ? new Date(nf.data_te).toISOString().split('T')[0] : null
      if (!dataTEStr) continue

      console.log(`\n📄 NF ${nf.numero_nf} - Data TE: ${dataTEStr}`)

      // 2. Buscar itens da NF (receptoras)
      const itensResult = await query(`
        SELECT id, dados_item
        FROM notas_fiscais_itens
        WHERE nota_fiscal_id = $1
          AND (tipo_produto = 'bovino' OR tipo_produto IS NULL)
      `, [nf.id])

      if (itensResult.rows.length === 0) {
        // NF pode ter receptora_letra/numero sem itens - tentar criar por receptora
        if (nf.receptora_letra && nf.receptora_numero) {
          const animalRes = await query(`
            SELECT id, serie, rg, nome FROM animais
            WHERE (serie = $1 AND rg = $2) 
               OR (serie = $3 AND rg = $2)
            LIMIT 1
          `, [nf.receptora_letra, nf.receptora_numero, `${nf.receptora_letra}${nf.receptora_numero}`])
          
          if (animalRes.rows.length > 0) {
            const animal = animalRes.rows[0]
            const nomeReceptora = `${animal.serie} ${animal.rg}`.trim()
            const teExiste = await query(`
              SELECT id FROM transferencias_embrioes
              WHERE receptora_id = $1 AND data_te = $2
            `, [animal.id, dataTEStr])
            if (teExiste.rows.length === 0) {
              const numeroTE = `TE-NF-${nf.numero_nf}-${animal.id}-${Date.now()}`
              await query(`
                INSERT INTO transferencias_embrioes (
                  numero_te, receptora_id, data_te, local_te, status, observacoes
                ) VALUES ($1, $2, $3, $4, 'realizada', $5)
              `, [numeroTE, animal.id, dataTEStr, nf.fornecedor || 'Não informado',
                  `NF de Entrada: ${nf.numero_nf} - Preenchido por script`])
              teCriadas++
              console.log(`  ✅ TE criada para ${nomeReceptora}`)
            } else {
              teJaExistiam++
            }
          }
        }
        continue
      }

      for (const item of itensResult.rows) {
        const dados = item.dados_item || {}
        const tatuagem = (dados.tatuagem || '').toString().trim()
        if (!tatuagem) continue

        const match = tatuagem.match(/^(\D*)(\d+)$/)
        const serieReceptora = match ? (match[1] || nf.receptora_letra || '').trim() : (nf.receptora_letra || '').trim()
        const rgReceptora = match ? match[2] : (nf.receptora_numero || '')

        if (!serieReceptora && !rgReceptora) continue

        // Buscar animal
        const animalRes = await query(`
          SELECT id, serie, rg, nome, data_chegada
          FROM animais
          WHERE (serie = $1 AND rg = $2)
             OR (serie = $3 AND rg = $2)
             OR REPLACE(LOWER(nome), ' ', '') = REPLACE(LOWER($4), ' ', '')
          LIMIT 1
        `, [serieReceptora, rgReceptora, `${serieReceptora}${rgReceptora}`, tatuagem])

        if (animalRes.rows.length === 0) {
          console.log(`  ⚠️ Animal não encontrado: ${tatuagem}`)
          continue
        }

        const animal = animalRes.rows[0]
        const nomeReceptora = `${animal.serie} ${animal.rg}`.trim()

        // Verificar se já tem TE (por receptora_id)
        const teExiste = await query(`
          SELECT id FROM transferencias_embrioes
          WHERE receptora_id = $1 AND data_te = $2
        `, [animal.id, dataTEStr])

        if (teExiste.rows.length === 0) {
          const numeroTE = `TE-NF-${nf.numero_nf}-${animal.id}-${Date.now()}`
          await query(`
            INSERT INTO transferencias_embrioes (
              numero_te, receptora_id, data_te, local_te, status, observacoes
            ) VALUES ($1, $2, $3, $4, 'realizada', $5)
          `, [numeroTE, animal.id, dataTEStr, nf.fornecedor || 'Não informado',
              `NF de Entrada: ${nf.numero_nf} - Preenchido por script`])
          teCriadas++
          console.log(`  ✅ TE criada para ${nomeReceptora} (${tatuagem})`)
        } else {
          teJaExistiam++
        }

        // Atualizar data_chegada se não tiver
        const dataChegada = nf.data_chegada_animais || nf.data_compra
        if (dataChegada && !animal.data_chegada) {
          await query(`
            UPDATE animais SET data_chegada = $1, updated_at = NOW()
            WHERE id = $2
          `, [dataChegada, animal.id])
          animaisAtualizados++
        }
      }
    }

    console.log('\n=== RESUMO ===')
    console.log(`✅ TEs criadas: ${teCriadas}`)
    console.log(`ℹ️ TEs já existiam: ${teJaExistiam}`)
    console.log(`📅 Animais com data_chegada atualizada: ${animaisAtualizados}`)
    console.log('\n💡 Previsão de parto (9 meses após TE) é exibida apenas para receptoras Prenha no DG.')
    console.log('   Receptoras com DG vazia NÃO recebem previsão de parto.\n')

  } catch (err) {
    console.error('❌ Erro:', err.message)
    throw err
  }
}

preencherTEReceptoras()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
