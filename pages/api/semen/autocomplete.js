import { query } from '../../../lib/database'

const CAMPOS_VALIDOS = [
  'nome_touro',
  'rg_touro',
  'raca',
  'localizacao',
  'rack_touro',
  'botijao',
  'caneca',
  'fornecedor',
  'certificado',
  'origem',
  'linhagem'
]

function normalizeSearch(value) {
  return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
}

function rankValues(values, termo) {
  if (!termo) return values
  const termoNorm = normalizeSearch(termo)
  if (!termoNorm) return values

  const scored = values.map((valor) => {
    const v = String(valor || '')
    const vNorm = normalizeSearch(v)
    let score = 0

    if (vNorm === termoNorm) score = 100
    else if (vNorm.startsWith(termoNorm)) score = 80
    else if (vNorm.includes(termoNorm)) score = 60
    else if (v.toUpperCase().includes(String(termo).toUpperCase())) score = 40

    return { valor: v, score }
  })

  return scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.valor.localeCompare(b.valor, 'pt-BR'))
    .map((x) => x.valor)
}

async function buscarValores(coluna, termo = '') {
  try {
    const termoRaw = String(termo || '').trim()
    const termoLike = `%${termoRaw}%`
    const termoNormLike = `%${normalizeSearch(termoRaw)}%`
    const hasTerm = termoRaw.length > 0
    const result = await query(
      `SELECT DISTINCT ${coluna} as valor FROM estoque_semen 
       WHERE ${coluna} IS NOT NULL
         AND TRIM(${coluna}::text) != ''
         AND (
           $1::boolean = false
           OR ${coluna}::text ILIKE $2
           OR UPPER(REGEXP_REPLACE(${coluna}::text, '[^A-Za-z0-9]', '', 'g')) LIKE $3
         )
       ORDER BY valor
       LIMIT 200`,
      [hasTerm, termoLike, termoNormLike]
    )
    const valores = result.rows.map(r => r.valor).filter(Boolean)
    return rankValues(valores, termoRaw)
  } catch (err) {
    if (err.code === '42703' && coluna === 'nome_touro') {
      const termoRaw = String(termo || '').trim()
      const termoLike = `%${termoRaw}%`
      const termoNormLike = `%${normalizeSearch(termoRaw)}%`
      const hasTerm = termoRaw.length > 0
      const r = await query(
        `SELECT DISTINCT serie as valor FROM estoque_semen 
         WHERE serie IS NOT NULL
           AND TRIM(serie) != ''
           AND (
             $1::boolean = false
             OR serie ILIKE $2
             OR UPPER(REGEXP_REPLACE(serie, '[^A-Za-z0-9]', '', 'g')) LIKE $3
           )
         ORDER BY serie
         LIMIT 200`,
        [hasTerm, termoLike, termoNormLike]
      )
      const valores = r.rows.map(row => row.valor).filter(Boolean)
      return rankValues(valores, termoRaw)
    }
    throw err
  }
}

export default async function autocompleteHandler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const { campo, todos, q, termo } = req.query
  const termoBusca = String(q || termo || '').trim()

  try {
    // Retornar todos os campos de uma vez (para carregar no modal)
    if (todos === '1' || todos === 'true') {
      const data = {}
      for (const c of CAMPOS_VALIDOS) {
        try {
          data[c] = await buscarValores(c, termoBusca)
        } catch (e) {
          data[c] = []
        }
      }
      return res.status(200).json({ success: true, data })
    }

    if (!campo || !CAMPOS_VALIDOS.includes(campo)) {
      return res.status(400).json({
        success: false,
        message: `Campo inválido. Use: ${CAMPOS_VALIDOS.join(', ')}`
      })
    }

    const valores = await buscarValores(campo, termoBusca)
    return res.status(200).json({ success: true, data: valores })
  } catch (error) {
    console.error('Erro autocomplete sêmen:', error)
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar sugestões',
      error: error.message
    })
  }
}
