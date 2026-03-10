/**
 * API para buscar resumo de coletas FIV de uma doadora pelo identificador (serie+rg ou nome).
 * Usado quando a fêmea não está cadastrada no banco - permite exibir histórico de coletas.
 */
import { query } from '../../../lib/database'
import { sendSuccess, sendError, sendMethodNotAllowed } from '../../../utils/apiResponse'

function normalizarIdentificador(str) {
  if (!str || typeof str !== 'string') return ''
  return str.replace(/\s+/g, ' ').trim().toUpperCase()
}

export const config = { api: { externalResolver: true } }
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendMethodNotAllowed(res, ['GET'])
  }

  try {
    const { identificador, nome, animalId, serie, rg } = req.query
    const busca = (identificador || nome || '').trim()
    const idNum = animalId ? parseInt(animalId, 10) : null
    const serieMae = (serie || '').trim()
    const rgMae = (rg || '').trim()

    if ((!busca || busca.length < 2) && !idNum && !(serieMae && rgMae)) {
      return res.status(400).json({ success: false, message: 'Parâmetro identificador, nome, animalId ou serie+rg é obrigatório' })
    }

    const normalizado = busca ? normalizarIdentificador(busca) : ''

    // Colunas base (embrioes_produzidos/transferidos podem não existir em DBs antigos - usamos observacoes)
    const colsBase = 'id, data_fiv, quantidade_oocitos, touro, doadora_nome, observacoes'

    // Buscar coletas: por doadora_id (prioridade), serie+rg, ou doadora_nome
    let result
    if (idNum && !isNaN(idNum)) {
      result = await query(
        `SELECT ${colsBase} FROM coleta_fiv WHERE doadora_id = $1 ORDER BY data_fiv DESC`,
        [idNum]
      )
    }
    // Por serie+rg: buscar animal e usar doadora_id, ou buscar coleta por doadora_nome
    if ((!result || result.rows.length === 0) && serieMae && rgMae) {
      const animalMae = await query(
        `SELECT id FROM animais WHERE UPPER(TRIM(COALESCE(serie,''))) = UPPER($1) AND TRIM(CAST(rg AS TEXT)) = $2 LIMIT 1`,
        [serieMae, String(rgMae).trim()]
      )
      if (animalMae.rows.length > 0) {
        result = await query(
          `SELECT ${colsBase} FROM coleta_fiv WHERE doadora_id = $1 ORDER BY data_fiv DESC`,
          [animalMae.rows[0].id]
        )
      }
      if (!result || result.rows.length === 0) {
        const identSerieRg = `${serieMae} ${rgMae}`.trim()
        const identSerieRg2 = `${serieMae}-${rgMae}`.trim()
        const identSerieRg3 = `${serieMae}-${rgMae} ${rgMae}`.trim() // "CJCJ-13604 13604"
        const serieUpper = serieMae.toUpperCase()
        const rgStr = String(rgMae).trim()
        result = await query(
          `SELECT ${colsBase} FROM coleta_fiv
           WHERE UPPER(TRIM(doadora_nome)) = UPPER($1)
              OR UPPER(REPLACE(COALESCE(doadora_nome,''), ' ', '')) = UPPER(REPLACE($2, ' ', ''))
              OR UPPER(TRIM(doadora_nome)) = UPPER($3)
              OR UPPER(TRIM(doadora_nome)) = UPPER($4)
              OR (UPPER(TRIM(doadora_nome)) LIKE $5 AND UPPER(TRIM(doadora_nome)) LIKE $6)
           ORDER BY data_fiv DESC`,
          [identSerieRg, identSerieRg, identSerieRg2, identSerieRg3, `${serieUpper}%`, `%${rgStr}`]
        )
        // Fallback: doadora_nome termina com o RG e contém a série (ex: "CJ SANT ANNA 13604", "CJCJ-13604 13604")
        if ((!result || result.rows.length === 0) && rgStr && serieUpper) {
          result = await query(
            `SELECT ${colsBase} FROM coleta_fiv
             WHERE (UPPER(TRIM(doadora_nome)) LIKE $1 OR UPPER(TRIM(doadora_nome)) LIKE $2)
               AND UPPER(TRIM(doadora_nome)) LIKE $3
             ORDER BY data_fiv DESC`,
            [`% ${rgStr}`, `%-${rgStr} %`, `${serieUpper.substring(0, 2)}%`]
          )
        }
      }
    }
    // Por nome: buscar animal em animais primeiro (pode estar cadastrada com nome)
    if ((!result || result.rows.length === 0) && busca.length >= 2) {
      const animalPorNome = await query(
        `SELECT id FROM animais 
         WHERE UPPER(TRIM(COALESCE(nome,''))) LIKE UPPER($1) 
           AND (sexo ILIKE 'F%' OR sexo = 'F')
         LIMIT 1`,
        [`%${busca}%`]
      )
      if (animalPorNome.rows.length > 0) {
        result = await query(
          `SELECT ${colsBase} FROM coleta_fiv WHERE doadora_id = $1 ORDER BY data_fiv DESC`,
          [animalPorNome.rows[0].id]
        )
      }
    }
    if ((!result || result.rows.length === 0) && busca.length >= 2) {
      result = await query(
        `SELECT ${colsBase} FROM coleta_fiv
         WHERE UPPER(TRIM(doadora_nome)) = $1
            OR UPPER(TRIM(REPLACE(COALESCE(doadora_nome,''), ' ', ''))) = UPPER(REPLACE($2, ' ', ''))
            OR (UPPER(doadora_nome) LIKE $3 AND LENGTH(TRIM(doadora_nome)) > 3)
         ORDER BY data_fiv DESC`,
        [normalizado, normalizado, `%${normalizado}%`]
      )
      // Fallback: buscar por primeira palavra do nome (ex: "MANERA" de "MANERA SANT ANNA")
      if ((!result || result.rows.length === 0) && busca.includes(' ')) {
        const primeiraPalavra = busca.trim().split(/\s+/)[0]
        if (primeiraPalavra.length >= 3) {
          result = await query(
            `SELECT ${colsBase} FROM coleta_fiv
             WHERE UPPER(doadora_nome) LIKE $1
             ORDER BY data_fiv DESC`,
            [`%${primeiraPalavra.toUpperCase()}%`]
          )
        }
      }
      // Fallback: nome termina com RG (ex: "CJ SANT ANNA 13604" -> doadora_nome "CJCJ-13604 13604")
      if ((!result || result.rows.length === 0)) {
        const rgNoFinal = busca.trim().match(/\s+(\d+)$/)
        if (rgNoFinal) {
          const rg = rgNoFinal[1]
          const prefixo = busca.trim().substring(0, 2).toUpperCase()
          result = await query(
            `SELECT ${colsBase} FROM coleta_fiv
             WHERE (UPPER(TRIM(doadora_nome)) LIKE $1 OR UPPER(TRIM(doadora_nome)) LIKE $2)
               AND UPPER(TRIM(doadora_nome)) LIKE $3
             ORDER BY data_fiv DESC`,
            [`% ${rg}`, `%-${rg} %`, `${prefixo}%`]
          )
        }
      }
    }
    if (!result) result = { rows: [] }

    const coletas = result.rows
    if (coletas.length === 0) {
      return sendSuccess(res, {
        coletas: [],
        resumo: null,
        doadora_nome: busca
      }, 'Nenhuma coleta encontrada')
    }

    // Extrair embriões de observacoes se colunas não existirem (formato: "Embriões: X | TE: Y")
    const parseEmbrioes = (obs) => {
      if (!obs) return { produzidos: 0, transferidos: 0 }
      const embMatch = obs.match(/Embriões?:\s*(\d+)/i)
      const teMatch = obs.match(/TE:\s*(\d+)/i)
      return {
        produzidos: embMatch ? parseInt(embMatch[1]) : 0,
        transferidos: teMatch ? parseInt(teMatch[1]) : 0
      }
    }

    const totalColetas = coletas.length
    const totalOocitos = coletas.reduce((s, c) => s + (parseInt(c.quantidade_oocitos) || 0), 0)
    const totalEmbrioes = coletas.reduce((s, c) => {
      const e = c.embrioes_produzidos ?? parseEmbrioes(c.observacoes).produzidos
      return s + (parseInt(e) || 0)
    }, 0)
    const totalTransferidos = coletas.reduce((s, c) => {
      const t = c.embrioes_transferidos ?? parseEmbrioes(c.observacoes).transferidos
      return s + (parseInt(t) || 0)
    }, 0)

    const resumo = {
      totalColetas,
      totalOocitos,
      mediaOocitos: totalColetas > 0 ? (totalOocitos / totalColetas).toFixed(1) : '0',
      totalEmbrioesProduzidos: totalEmbrioes,
      mediaEmbrioesProduzidos: totalColetas > 0 ? (totalEmbrioes / totalColetas).toFixed(1) : '0',
      totalEmbrioesTransferidos: totalTransferidos,
      mediaEmbrioesTransferidos: totalColetas > 0 ? (totalTransferidos / totalColetas).toFixed(1) : '0'
    }

    return sendSuccess(res, {
      coletas,
      resumo,
      doadora_nome: coletas[0]?.doadora_nome || busca
    }, 'Coletas encontradas')
  } catch (error) {
    console.error('Erro ao buscar coletas da doadora:', error)
    return sendError(res, 'Erro ao buscar coletas', 500, error.message)
  }
}
