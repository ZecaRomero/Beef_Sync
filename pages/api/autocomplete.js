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

export default async function autocompleteHandler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const { tabela, campo, todos } = req.query
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
          data[col] = await buscarDistinct(tableResolved, col)
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

    const valores = await buscarDistinct(tableResolved, campo)
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

async function buscarDistinct(tabela, coluna) {
  try {
    const result = await query(
      `SELECT DISTINCT ${coluna} as valor FROM ${tabela} 
       WHERE ${coluna} IS NOT NULL AND TRIM(${coluna}::text) != '' 
       ORDER BY valor
       LIMIT 200`,
      []
    )
    return result.rows.map(r => String(r.valor)).filter(Boolean)
  } catch (err) {
    if (err.code === '42703' && tabela === 'estoque_semen' && coluna === 'nome_touro') {
      const r = await query(
        `SELECT DISTINCT serie as valor FROM estoque_semen 
         WHERE serie IS NOT NULL AND TRIM(serie) != '' ORDER BY valor LIMIT 200`
      )
      return r.rows.map(row => String(row.valor)).filter(Boolean)
    }
    throw err
  }
}
