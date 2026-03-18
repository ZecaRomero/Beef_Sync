import { query } from '../../../lib/database'
import {
  sendSuccess,
  sendError,
  sendMethodNotAllowed,
  asyncHandler,
  HTTP_STATUS,
} from '../../../utils/apiResponse'

function normalizeRg(rg) {
  const s = String(rg ?? '').trim()
  if (!s) return null
  const withoutZeros = s.replace(/^0+/, '')
  return withoutZeros || '0'
}

function parseIdent({ id, serie, rg }) {
  const rawId = id != null ? String(id) : ''
  const rawSerie = serie != null ? String(serie) : ''
  const rawRg = rg != null ? String(rg) : ''

  // id pode ser "CJCJ-16141" ou "CJCJ 16141"
  if (rawId && !rawSerie && !rawRg) {
    const trimmed = rawId.trim()
    if (trimmed.includes('-')) {
      const [s, ...rest] = trimmed.split('-')
      return { serie: (s || '').trim(), rg: rest.join('-').trim() }
    }
    const m = trimmed.match(/^([A-Za-z]+)\s+(\d+)$/)
    if (m) return { serie: m[1].trim(), rg: m[2].trim() }
  }

  return {
    serie: rawSerie.trim(),
    rg: rawRg.trim(),
  }
}

function pick(obj, keys) {
  const out = {}
  for (const k of keys) out[k] = obj?.[k]
  return out
}

const PMGZ_TRAITS = ['pn', 'pd', 'pa', 'ps', 'ipp', 'stay', 'pe365', 'aol', 'acab', 'mar']
const PMGZ_SUFFIXES = ['dep', 'deca', 'pct']

const GENEPLUS_KEYS = [
  'iqg',
  'pt_iqg',

  'gp_pn_kg',
  'gp_pn_pt',

  'gp_p120_kg_em',
  'gp_p120_pt',

  'gp_p2_kg',
  'gp_p2_pt',

  'gp_p5_kg',
  'gp_p5_pt',

  'gp_hp_stay_pct',
  'gp_hp_stay_pt',

  'gp_ipp_01em',
  'gp_ipp_pt',
  'gp_ipp_dias',
  'gp_ipp_dias_pt',

  'gp_pfp30_pct',
  'gp_pfp30_pt',

  'gp_rd_pct',
  'gp_rd_pt',

  'gp_aol_cm2',
  'gp_aol_pt',

  'gp_egs_01mm',
  'gp_egs_pt',

  'gp_mar_pct',
  'gp_mar_pt',
]

const ANCP_KEYS = [
  'mgte',
  'top',
  'ancp_d3p',
  'ancp_dipp',
  'ancp_dpe365',
  'ancp_dpn',
  'ancp_dstay',
  'ancp_mp120',
  'ancp_mp210',
  'ancp_dp450',
  'ancp_daol',
  'ancp_dacab',

  'ancp_top_d3p',
  'ancp_top_dipp',
  'ancp_top_dpe365',
  'ancp_top_dpn',
  'ancp_top_dstay',
  'ancp_top_mp120',
  'ancp_top_mp210',
  'ancp_top_dp450',
  'ancp_top_daol',
  'ancp_top_dacab',
]

const handler = async (req, res) => {
  if (req.method !== 'GET') return sendMethodNotAllowed(res, req.method)

  try {
    const { id, serie, rg } = req.query || {}
    const ident = parseIdent({ id, serie, rg })

    const serieBusca = ident.serie?.trim()
    const rgBuscaRaw = ident.rg?.trim()
    const rgBusca = normalizeRg(rgBuscaRaw)

    if (!serieBusca || rgBusca == null) {
      return sendError(
        res,
        'Parâmetros inválidos. Use: id=CJCJ-16141 (ou serie+rg).',
        HTTP_STATUS.BAD_REQUEST
      )
    }

    const result = await query(
      `SELECT * FROM animais
       WHERE UPPER(TRIM(COALESCE(serie,''))) = UPPER(TRIM($1))
         AND (TRIM(rg::text) = TRIM($2))
       LIMIT 1`,
      [serieBusca, rgBusca]
    )

    if (!result?.rows?.length) {
      return sendError(res, 'Animal não encontrado', HTTP_STATUS.NOT_FOUND)
    }

    const row = result.rows[0]

    // Montar keys PMGZ usados
    const pmgzKeys = []
    for (const t of PMGZ_TRAITS) {
      for (const s of PMGZ_SUFFIXES) {
        pmgzKeys.push(`pmgz_${t}_${s}`)
      }
    }

    const pmgz = pick(row, pmgzKeys)

    // DGT / Carcaça (campos usados no componente)
    const carcKeys = [
      'carc_aol',
      'carc_aol_100kg',
      'carc_ratio',
      'carc_mar',
      'carc_egs',
      'carc_egs_100kg',
      'carc_picanha',
    ]

    const carc = pick(row, carcKeys)

    // PROCRIAR / Puberdade
    const pubKeys = ['pub_classe', 'pub_idade', 'pub_pct_media', 'pub_grupo', 'pub_classif']
    const pub = pick(row, pubKeys)

    const geneplus = pick(row, GENEPLUS_KEYS)
    const ancp = pick(row, ANCP_KEYS)

    // Resumo rápido pra você ver se há algum valor
    const anyPub = Object.values(pub).some(v => v != null)
    const anyCarc = Object.values(carc).some(v => v != null)
    const anyPmgz = Object.values(pmgz).some(v => v != null)
    const anyGeneplus = Object.values(geneplus).some(v => v != null)
    const anyAncp = Object.values(ancp).some(v => v != null)

    return sendSuccess(res, {
      serie: row.serie,
      rg: row.rg,
      identificacao: row.identificacao || `${row.serie}-${row.rg}`,
      summary: {
        pub: anyPub,
        carc: anyCarc,
        pmgz: anyPmgz,
        geneplus: anyGeneplus,
        ancp: anyAncp,
      },
      pub,
      carc,
      pmgz,
      geneplus,
      ancp,
    })
  } catch (error) {
    return sendError(res, 'Erro ao buscar campos de avaliações', HTTP_STATUS.INTERNAL_SERVER_ERROR, null, error?.message)
  }
}

export default asyncHandler(handler)

