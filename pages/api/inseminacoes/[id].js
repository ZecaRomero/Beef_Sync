import { query } from '../../../lib/database'
import { broadcast } from '../../../lib/sseClients'

/**
 * GET    /api/inseminacoes/:id  → busca inseminação por ID
 * PUT    /api/inseminacoes/:id  → atualiza inseminação (inclui confirmação de prenhez)
 * DELETE /api/inseminacoes/:id  → remove inseminação
 */
export default async function handler(req, res) {
  const { id } = req.query
  const inseminacaoId = parseInt(id)
  if (!inseminacaoId || isNaN(inseminacaoId)) {
    return res.status(400).json({ success: false, message: 'ID inválido' })
  }

  try {
    if (req.method === 'GET') {
      const result = await query(
        `SELECT i.*, a.serie as animal_serie, a.rg as animal_rg, a.nome as animal_nome
         FROM inseminacoes i
         LEFT JOIN animais a ON i.animal_id = a.id
         WHERE i.id = $1`,
        [inseminacaoId]
      )
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Inseminação não encontrada' })
      }
      return res.status(200).json({ success: true, data: result.rows[0] })
    }

    if (req.method === 'PUT') {
      const insAtual = await query('SELECT * FROM inseminacoes WHERE id = $1', [inseminacaoId])
      if (insAtual.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Inseminação não encontrada' })
      }
      const atual = insAtual.rows[0]

      const {
        data_ia,
        touro_nome,
        touro_rg,
        serie_touro,
        semen_id,
        tecnico,
        numero_ia,
        protocolo,
        resultado_dg,
        data_dg,
        status_gestacao,
        observacoes,
        custo_dose,
      } = req.body

      // Atualizar inseminação
      const updated = await query(
        `UPDATE inseminacoes SET
          data_ia         = COALESCE($1, data_ia),
          touro_nome      = COALESCE($2, touro_nome),
          touro_rg        = COALESCE($3, touro_rg),
          serie_touro     = COALESCE($4, serie_touro),
          semen_id        = COALESCE($5, semen_id),
          tecnico         = COALESCE($6, tecnico),
          numero_ia       = COALESCE($7, numero_ia),
          protocolo       = COALESCE($8, protocolo),
          resultado_dg    = COALESCE($9, resultado_dg),
          data_dg         = COALESCE($10, data_dg),
          status_gestacao = COALESCE($11, status_gestacao),
          observacoes     = COALESCE($12, observacoes),
          updated_at      = CURRENT_TIMESTAMP
         WHERE id = $13
         RETURNING *`,
        [
          data_ia         || null,
          touro_nome      || null,
          touro_rg        || null,
          serie_touro     || null,
          semen_id        || null,
          tecnico         || null,
          numero_ia       || null,
          protocolo       || null,
          resultado_dg    || null,
          data_dg         || null,
          status_gestacao || null,
          observacoes     || null,
          inseminacaoId,
        ]
      )
      const inseminacao = updated.rows[0]

      // ---------------------------------------------------------------
      // CONFIRMAR PRENHEZ: se resultado_dg mudou para Prenha/Positivo
      // criar (ou atualizar) registro em gestacoes
      // ---------------------------------------------------------------
      const eraVazia = !atual.resultado_dg || !isPrenha(atual.resultado_dg)
      const agora    = isPrenha(inseminacao.resultado_dg)

      if (agora && eraVazia) {
        // Buscar dados do animal
        const animal = await query(
          'SELECT id, serie, rg, nome FROM animais WHERE id = $1',
          [inseminacao.animal_id]
        )
        if (animal.rows.length > 0) {
          const a = animal.rows[0]
          const pai_info = parsePaiInfo(inseminacao.touro)

          const gestacaoExistente = await query(
            `SELECT id FROM gestacoes
             WHERE receptora_serie = $1 AND receptora_rg = $2 AND data_cobertura = $3
             LIMIT 1`,
            [a.serie, a.rg, inseminacao.data_ia]
          )

          if (gestacaoExistente.rows.length === 0) {
            await query(
              `INSERT INTO gestacoes (
                receptora_nome, receptora_serie, receptora_rg,
                mae_serie, mae_rg,
                pai_serie, pai_rg,
                data_cobertura, situacao, observacoes
               ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Gestante',$9)`,
              [
                a.nome || `${a.serie} ${a.rg}`,
                a.serie,
                a.rg,
                a.serie,
                a.rg,
                inseminacao.serie_touro || 'N/A',
                inseminacao.touro_rg    || 'N/A',
                inseminacao.data_ia,
                `IA confirmada - inseminação ID ${inseminacaoId}`,
              ]
            )
          }

          // Atualizar situação do animal para Gestante
          await query(
            `UPDATE animais SET situacao = 'Gestante', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [a.id]
          )
        }
      }

      broadcast('inseminacao.updated', {
        inseminacaoId,
        animalId: inseminacao.animal_id,
        resultado_dg: inseminacao.resultado_dg,
      })

      return res.status(200).json({ success: true, data: inseminacao })
    }

    if (req.method === 'DELETE') {
      const existing = await query('SELECT animal_id FROM inseminacoes WHERE id = $1', [inseminacaoId])
      if (existing.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Inseminação não encontrada' })
      }
      await query('DELETE FROM inseminacoes WHERE id = $1', [inseminacaoId])
      broadcast('inseminacao.deleted', { inseminacaoId, animalId: existing.rows[0].animal_id })
      return res.status(200).json({ success: true, message: 'Inseminação removida' })
    }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
    return res.status(405).json({ success: false, message: `Método ${req.method} não permitido` })
  } catch (error) {
    console.error('Erro em /api/inseminacoes/[id]:', error)
    return res.status(500).json({ success: false, message: error.message })
  }
}

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------

function isPrenha(valor) {
  if (!valor) return false
  const v = valor.toString().toUpperCase()
  return v.startsWith('P') || v.includes('PRENHA') || v.includes('POSITIVO')
}

function parsePaiInfo(touro) {
  if (!touro) return { serie: 'N/A', rg: 'N/A' }
  const parts = touro.trim().split(/\s+/)
  if (parts.length >= 2) {
    return { serie: parts[0], rg: parts.slice(1).join(' ') }
  }
  return { serie: touro, rg: 'N/A' }
}
