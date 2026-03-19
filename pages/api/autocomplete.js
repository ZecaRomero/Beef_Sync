/**
 * API genérica de autocomplete para todo o app.
 * Retorna valores distintos já cadastrados no banco para evitar erros de digitação.
 *
 * Uso: GET /api/autocomplete?tabela=animais&campo=raca
 *      GET /api/autocomplete?tabela=animais&todos=1  (retorna todos os campos)
 */

import { query } from '../../lib/database'

// Mapeamento: tabela -> colunas permitidas (apenas colunas de texto para autocomplete)
const CONFIG = {
  animais: [
    'serie', 'rg', 'raca', 'nome', 'tatuagem', 'cor', 'pai', 'mae', 'avo_materno',
    'receptora', 'veterinario', 'abczg', 'deca', 'boletim', 'local_nascimento',
    'pasto_atual', 'piquete_atual', 'situacao_abcz', 'iqg', 'pt_iqg'
  ],
  estoque_semen: [
    'nome_touro', 'rg_touro', 'raca', 'localizacao', 'rack_touro', 'botijao', 'caneca',
    'fornecedor', 'destino', 'certificado', 'origem', 'linhagem'
  ],
  custos: ['tipo', 'subtipo'],
  nascimentos: ['serie', 'rg', 'cor', 'tipo_nascimento', 'dificuldade_parto', 'veterinario'],
  gestacoes: ['receptora_nome', 'receptora_serie', 'receptora_rg', 'pai_serie', 'pai_rg', 'mae_serie', 'mae_rg'],
  inseminacoes: ['touro_nome', 'touro_rg', 'tecnico', 'protocolo', 'resultado_dg'],
  localizacoes_animais: ['piquete', 'motivo_movimentacao', 'usuario_responsavel'],
  fornecedores_destinatarios: ['nome', 'municipio', 'estado', 'cnpj_cpf'],
  destinos_semen: ['nome'],
  coleta_fiv: ['doadora_nome', 'laboratorio', 'veterinario', 'touro'],
  notas_fiscais: ['origem', 'fornecedor', 'destino', 'numero_nf'],
  servicos: ['descricao', 'responsavel'],
  protocolos_reprodutivos: ['nome', 'tipo', 'descricao'],
  piquetes: ['nome'],
  causas_morte: ['causa'],
  origens_receptoras: ['nome', 'documento']
}

// Aliases para tabelas que podem ter nomes diferentes
const TABLE_ALIAS = {
  semen: 'estoque_semen',
  semen_estoque: 'estoque_semen',
  fornecedores: 'fornecedores_destinatarios',
  destinos: 'destinos_semen'
}

function resolveTable(tabela) {
  return TABLE_ALIAS[tabela] || tabela
}

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

export default async function autocompleteHandler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const { tabela, campo, todos, q, termo } = req.query
  const termoBusca = String(q || termo || '').trim()
  const tableResolved = resolveTable((tabela || '').toLowerCase())

  if (!CONFIG[tableResolved]) {
    return res.status(400).json({
      success: false,
      message: `Tabela inválida. Use: ${Object.keys(CONFIG).join(', ')}`
    })
  }

  const colunasPermitidas = CONFIG[tableResolved]

  try {
    if (todos === '1' || todos === 'true') {
      const data = {}
      for (const col of colunasPermitidas) {
        try {
          data[col] = await buscarDistinct(tableResolved, col, termoBusca)
        } catch (e) {
          data[col] = []
        }
      }
      return res.status(200).json({ success: true, data })
    }

    if (!campo || !colunasPermitidas.includes(campo)) {
      return res.status(400).json({
        success: false,
        message: `Campo inválido para ${tableResolved}. Use: ${colunasPermitidas.join(', ')}`
      })
    }

    const valores = await buscarDistinct(tableResolved, campo, termoBusca)
    return res.status(200).json({ success: true, data: valores })
  } catch (error) {
    console.error('Erro autocomplete:', error)
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar sugestões',
      error: error.message
    })
  }
}

async function buscarDistinct(tabela, coluna, termo = '') {
  try {
    const termoRaw = String(termo || '').trim()
    const termoLike = `%${termoRaw}%`
    const termoNormLike = `%${normalizeSearch(termoRaw)}%`
    const hasTerm = termoRaw.length > 0
    const result = await query(
      `SELECT DISTINCT ${coluna} as valor FROM ${tabela} 
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
    const valores = result.rows.map(r => String(r.valor)).filter(Boolean)
    return rankValues(valores, termoRaw)
  } catch (err) {
    if (err.code === '42703' && tabela === 'estoque_semen' && coluna === 'nome_touro') {
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
         ORDER BY valor
         LIMIT 200`,
        [hasTerm, termoLike, termoNormLike]
      )
      const valores = r.rows.map(row => String(row.valor)).filter(Boolean)
      return rankValues(valores, termoRaw)
    }
    throw err
  }
}
