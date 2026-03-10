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

async function buscarValores(coluna) {
  try {
    const result = await query(
      `SELECT DISTINCT ${coluna} as valor FROM estoque_semen 
       WHERE ${coluna} IS NOT NULL AND TRIM(${coluna}::text) != '' 
       ORDER BY valor`
    )
    return result.rows.map(r => r.valor).filter(Boolean)
  } catch (err) {
    if (err.code === '42703' && coluna === 'nome_touro') {
      const r = await query(
        `SELECT DISTINCT serie as valor FROM estoque_semen 
         WHERE serie IS NOT NULL AND TRIM(serie) != '' ORDER BY serie`
      )
      return r.rows.map(row => row.valor).filter(Boolean)
    }
    throw err
  }
}

export default async function autocompleteHandler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const { campo, todos } = req.query

  try {
    // Retornar todos os campos de uma vez (para carregar no modal)
    if (todos === '1' || todos === 'true') {
      const data = {}
      for (const c of CAMPOS_VALIDOS) {
        try {
          data[c] = await buscarValores(c)
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

    const valores = await buscarValores(campo)
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
