/**
 * POST /api/pesagens/aplicar-localizacoes
 * Aplica localizações a partir das pesagens de um período (ex: mês 02).
 * Animais sem localização atual recebem a local informada na observação da pesagem.
 *
 * Body: { mes?: number, ano?: number }
 * Default: mes=2 (fevereiro), ano=ano atual
 */
const { query } = require('../../../lib/database')

function extrairLocal(obs) {
  if (!obs || typeof obs !== 'string') return null
  const s = obs.trim().replace(/CONFINAÇÃO/gi, 'CONFINA').replace(/CONFINACAO/gi, 'CONFINA')
  const m = s.match(/(PIQUETE\s*\d+|PIQUETE\s*(CABANHA|CONF|GUARITA|PISTA)|PROJETO\s*[\dA-Za-z\-]+|LOTE\s*\d+|CONFINA\w*|GUARITA|CABANHA|PISTA\s*\d*)/i)
  if (m) {
    let loc = m[1].trim().toUpperCase().replace(/\s+/g, ' ')
    if (/^CONFINA/.test(loc)) loc = 'CONFINA'
    if (/^PIQUETE\s+\d+$/.test(loc)) loc = loc.replace(/^PIQUETE\s+/i, 'PROJETO ')
    if (/^PIQUETE\s+(\d+|CABANHA|CONF|GUARITA|PISTA)$/i.test(loc) || /^PROJETO\s+[\dA-Za-z\-]+$/i.test(loc) || /^CONFINA$/i.test(loc) || /^(GUARITA|CABANHA|PISTA\s*\d*|CONF)$/i.test(loc)) return loc
  }
  return s.length <= 35 && s.length > 0 ? s.toUpperCase() : null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    const ano = parseInt(req.body?.ano || new Date().getFullYear(), 10)
    const mes = parseInt(req.body?.mes || 2, 10)
    const start = `${ano}-${String(mes).padStart(2, '0')}-01`
    const lastDay = new Date(ano, mes, 0)
    const end = `${ano}-${String(mes).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`

    const r = await query(`
      SELECT p.id, p.animal_id, p.peso, p.data, p.observacoes
      FROM pesagens p
      JOIN animais a ON a.id = p.animal_id
      WHERE a.situacao = 'Ativo'
        AND p.data >= $1 AND p.data <= $2
      ORDER BY p.data DESC
    `, [start, end])

    const rows = r.rows || []
    const porAnimal = {}
    rows.forEach(x => {
      const aid = x.animal_id
      if (!aid) return
      const local = extrairLocal(x.observacoes)
      if (!local || /^(não informado|nao informado|-)$/i.test(local)) return
      const d = x.data || ''
      const prev = porAnimal[aid]
      if (!prev || (d > (prev.data || '')) || (d === (prev.data || '') && (x.id || 0) > (prev.id || 0))) {
        porAnimal[aid] = { ...x, local }
      }
    })

    const comLocal = Object.entries(porAnimal).filter(([, p]) => p.local)
    const animaisComLocal = comLocal.map(([aid]) => parseInt(aid, 10))

    if (animaisComLocal.length === 0) {
      return res.status(200).json({
        success: true,
        aplicados: 0,
        ignorados: 0,
        mensagem: `Nenhuma pesagem com local válido no período ${start} a ${end}`
      })
    }

    const locsExistentes = await query(`
      SELECT animal_id FROM localizacoes_animais
      WHERE animal_id = ANY($1::int[]) AND data_saida IS NULL
    `, [animaisComLocal])
    const idsComLocalizacao = new Set((locsExistentes.rows || []).map(r => r.animal_id))

    const paraInserir = comLocal.filter(([aid]) => !idsComLocalizacao.has(parseInt(aid, 10)))
    let aplicados = 0

    for (const [aid, p] of paraInserir) {
      try {
        await query(`
          INSERT INTO localizacoes_animais (animal_id, piquete, data_entrada, motivo_movimentacao, observacoes, usuario_responsavel, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        `, [
          parseInt(aid, 10),
          p.local,
          p.data || start,
          'Importado da Pesagem (mês ' + mes + '/' + ano + ')',
          p.observacoes || null,
          'Sistema'
        ])
        aplicados++
      } catch (err) {
        console.warn('Erro ao inserir localização para animal', aid, err.message)
      }
    }

    return res.status(200).json({
      success: true,
      aplicados,
      ignorados: comLocal.length - aplicados,
      periodo: `${mes}/${ano}`,
      mensagem: `✅ ${aplicados} localização(ões) aplicada(s) a partir das pesagens de ${mes}/${ano}. ${comLocal.length - aplicados} já tinham localização atual.`
    })
  } catch (error) {
    console.error('Erro em aplicar-localizacoes:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao aplicar localizações'
    })
  }
}
