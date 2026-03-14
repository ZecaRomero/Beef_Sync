/**
 * API para importar dados do Excel "AVALIAÃâ€¡ÃÆ’O - PROJEÃâ€¡ÃÆ’O DA CRIA"
 * Colunas: SÃ©rie, RGN, LOTE, OBSERVAÃâ€¡ÃÆ’O (situaÃ§Ã£o reprodutiva), PREV PARTO, CRIA, SEXO CRIA, PAI DA CRIA, iABCZg*, DECA, IQG, PtIQG, MGT, TOP
 * Permite aplicar carimbo de leilÃ£o aos animais importados
 */
import { query } from '../../../lib/database'
import { asyncHandler } from '../../../utils/apiResponse'
import logger from '../../../utils/logger'

const getVal = (row, keys) => {
  if (!row || typeof row !== 'object') return null
  for (const k of keys) {
    if (!k) continue
    const v = row[k]
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim()
  }
  const rowKeys = Object.keys(row)
  const keyLower = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s/g, '')
  for (const k of keys) {
    if (!k) continue
    const match = rowKeys.find(rk => keyLower(rk) === keyLower(k))
    if (match) {
      const v = row[match]
      if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim()
    }
  }
  return null
}

export default asyncHandler(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'MÃ©todo nÃ£o permitido' })
  }

  const { registros = [], carimboLeilao = '' } = req.body || {}

  if (!Array.isArray(registros) || registros.length === 0) {
    return res.status(400).json({ success: false, message: 'Nenhum registro para importar' })
  }

  const carimbo = String(carimboLeilao || '').trim()

  let atualizados = 0
  const erros = []

  try {
  for (const row of registros) {
    try {
      const serie = getVal(row, ['SÃ©rie', 'Serie', 'SERIE', 'serie'])
      const rg = getVal(row, ['RGN', 'RG', 'rg', 'rgn'])
      if (!serie || !rg) {
        erros.push({ serie: String(row?.SÃ©rie || row?.Serie || row?.RGN || ''), rg: String(row?.RG || row?.RGN || ''), motivo: 'SÃ©rie ou RGN ausente' })
        continue
      }

      const situacaoReprodutiva = getVal(row, ['OBSERVAÃâ€¡ÃÆ’O', 'OBSERVACAO', 'ObservaÃ§Ã£o', 'observacao', 'OBS'])
      const prevParto = getVal(row, ['PREV PARTO', 'Prev Parto', 'prev_parto', 'PREV_PARTO'])
      const lote = getVal(row, ['LOTE', 'Lote', 'lote'])
      const cria = getVal(row, ['CRIA', 'Cria', 'cria'])
      const sexoCria = getVal(row, ['SEXO CRIA', 'Sexo Cria', 'sexo_cria'])
      const paiCria = getVal(row, ['PAI DA CRIA', 'Pai da Cria', 'PAI_CRIA', 'pai_cria'])
      const iabczg = getVal(row, ['iABCZg*', 'iABCZg', 'IABCZG', 'iabczg'])
      const deca = getVal(row, ['DECA', 'Deca', 'deca'])
      const iqg = getVal(row, ['IQG', 'Iqg', 'iqg'])
      const ptIqg = getVal(row, ['PtIQG', 'Pt Iqg', 'PT_IQG', 'pt_iqg'])
      const mgte = getVal(row, ['MGT', 'MGT', 'mgte', 'MGT'])
      const top = getVal(row, ['TOP', 'Top', 'top'])

      // Verificar se animal existe
      const existente = await query(
        `SELECT id FROM animais WHERE UPPER(TRIM(COALESCE(serie,''))) = UPPER(TRIM($1)) AND (rg::text = $2 OR TRIM(rg::text) = TRIM($2))`,
        [serie, String(rg)]
      )

      if (existente.rows.length === 0) {
        erros.push({ serie: String(serie), rg: String(rg), motivo: 'Animal nÃ£o encontrado no banco' })
        continue
      }

      const animalId = existente.rows[0].id

      // Montar UPDATE dinÃ¢mico
      const updates = []
      const values = []
      let idx = 1

      if (situacaoReprodutiva) {
        updates.push(`situacao_reprodutiva = $${idx++}`)
        values.push(situacaoReprodutiva)
      }
      if (prevParto) {
        updates.push(`prev_parto = $${idx++}`)
        values.push(prevParto)
      }
      if (carimbo) {
        updates.push(`carimbo_leilao = $${idx++}`)
        values.push(carimbo)
      }
      if (iabczg) {
        updates.push(`abczg = $${idx++}`)
        values.push(iabczg)
      }
      if (deca) {
        updates.push(`deca = $${idx++}`)
        values.push(deca)
      }
      if (iqg) {
        updates.push(`iqg = $${idx++}`)
        values.push(iqg)
      }
      if (ptIqg) {
        updates.push(`pt_iqg = $${idx++}`)
        values.push(ptIqg)
      }
      if (mgte) {
        updates.push(`mgte = $${idx++}`)
        values.push(mgte)
      }
      if (top) {
        updates.push(`"top" = $${idx++}`)
        values.push(top)
      }

      // Concatenar observaÃ§Ãµes existentes com LOTE, CRIA, SEXO CRIA, PAI DA CRIA se necessÃ¡rio
      if (lote || cria || sexoCria || paiCria) {
        const obsParts = []
        if (lote) obsParts.push(`Lote: ${lote}`)
        if (cria) obsParts.push(`Cria: ${cria}`)
        if (sexoCria) obsParts.push(`Sexo Cria: ${sexoCria}`)
        if (paiCria) obsParts.push(`Pai Cria: ${paiCria}`)
        const novaObs = obsParts.join(' | ')
        const resObs = await query('SELECT observacoes FROM animais WHERE id = $1', [animalId])
        const obsAtual = resObs.rows[0]?.observacoes || ''
        const obsFinal = obsAtual ? `${obsAtual}\n${novaObs}` : novaObs
        updates.push(`observacoes = $${idx++}`)
        values.push(obsFinal)
      }

      if (updates.length === 0) continue

      updates.push(`updated_at = CURRENT_TIMESTAMP`)
      values.push(animalId)

      await query(
        `UPDATE animais SET ${updates.join(', ')} WHERE id = $${idx}`,
        values
      )
      atualizados++
    } catch (e) {
      logger.error('Erro ao atualizar animal na importaÃ§Ã£o leilÃ£o:', e)
      const msg = e.message || ''
      if (msg.includes('column') && msg.includes('does not exist')) {
        throw new Error('Colunas do banco nÃ£o encontradas. Reinicie o servidor para aplicar as migraÃ§Ãµes.')
      }
      erros.push({ serie: getVal(row, ['SÃ©rie', 'Serie', 'SERIE']), rg: getVal(row, ['RGN', 'RG', 'rg']), motivo: msg })
    }
  }

  return res.status(200).json({
    success: true,
    data: {
      atualizados,
      erros: erros.length,
      detalhes: erros.slice(0, 10),
      carimboAplicado: carimbo || null
    },
    message: `${atualizados} animal(is) atualizado(s)${carimbo ? ` com carimbo "${carimbo}"` : ''}`
  })
  } catch (dbError) {
    logger.error('Erro na importaÃ§Ã£o leilÃ£o:', dbError)
    const msg = dbError.message || ''
    const isColumnError = msg.includes('column') && msg.includes('does not exist') || msg.includes('Colunas do banco nÃ£o encontradas')
    return res.status(500).json({
      success: false,
      message: isColumnError
        ? 'Colunas do banco nÃ£o encontradas. Reinicie o servidor (npm run dev) para aplicar as migraÃ§Ãµes (carimbo_leilao, situacao_reprodutiva, prev_parto).'
        : ('Erro ao importar: ' + (msg || 'Erro no servidor'))
    })
  }
})
