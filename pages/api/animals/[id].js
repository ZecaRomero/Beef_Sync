import databaseService from '../../../services/databaseService'
import logger from '../../../utils/logger'
import { asyncHandler } from '../../../utils/apiResponse'
import { broadcast } from '../../../lib/sseClients'

// Função auxiliar de log
function debugLog(msg) {
  // Em produção, remover ou usar logger.debug
  console.log(`[DEBUG-ANIMAL-API] ${msg}`);
}

import { 
  sendSuccess, 
  sendValidationError, 
  sendConflict, 
  sendNotFound, 
  sendMethodNotAllowed,
  sendForbidden
} from '../../../utils/apiResponse'
import { canDelete } from '../../../utils/permissions'
import { RACAS_POR_SERIE as racasPorSerie } from '../../../utils/constants'

// Função para criar nota fiscal de saída automaticamente
async function criarNotaFiscalSaidaAutomatica(animal) {
  try {
    const nfData = {
      numeroNF: `AUTO-SAIDA-${animal.serie}${animal.rg}-${Date.now()}`,
      data: new Date().toISOString().split('T')[0],
      destino: animal.comprador || 'Venda Direta',
      naturezaOperacao: 'Venda',
      observacoes: `NF gerada automaticamente para venda do animal ${animal.serie} ${animal.rg}`,
      tipoProduto: 'bovino',
      tipo: 'saida',
      itens: [{
        tatuagem: `${animal.serie}-${animal.rg}`,
        sexo: animal.sexo,
        era: calcularEra(animal.meses, animal.sexo),
        raca: animal.raca,
        peso: animal.peso || 0,
        valorUnitario: animal.valor_venda || 0,
        tipoProduto: 'bovino'
      }],
      valorTotal: animal.valor_venda || 0,
      dataCadastro: new Date().toISOString()
    }

    // Salvar NF no banco de dados
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3020'}/api/notas-fiscais`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nfData)
    })

    if (!response.ok) {
      throw new Error(`Erro ao criar NF: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    logger.error('Erro ao criar NF de saída automática:', error)
    throw error
  }
}

// Função para calcular era baseada na idade em meses e sexo
function calcularEra(meses, sexo) {
  if (!meses || meses <= 0) return 'Não informado'
  
  const isFemea = sexo && (sexo.toLowerCase().includes('fêmea') || sexo.toLowerCase().includes('femea') || sexo === 'F')
  const isMacho = sexo && (sexo.toLowerCase().includes('macho') || sexo === 'M')
  
  if (isFemea) {
    // FÊMEA: 0-7 / 7-12 / 12-18 / 18-24 / 24+
    if (meses <= 7) return '0/7'
    if (meses <= 12) return '7/12'
    if (meses <= 18) return '12/18'
    if (meses <= 24) return '18/24'
    return '24+'
  } else if (isMacho) {
    // MACHO: 0-7 / 7-15 / 15-18 / 18-22 / 22+
    if (meses <= 7) return '0/7'
    if (meses <= 15) return '7/15'
    if (meses <= 18) return '15/18'
    if (meses <= 22) return '18/22'
    return '22+'
  }
  
  // Se não tem sexo definido, usar padrão antigo para compatibilidade
  if (meses <= 7) return '0/7'
  if (meses <= 12) return '7/12'
  if (meses <= 18) return '12/18'
  if (meses <= 24) return '18/24'
  return '24+'
}

export const config = { api: { externalResolver: true } }
export default asyncHandler(async function handler(req, res) {
  const { id } = req.query

  if (!id) {
    return sendValidationError(res, 'ID do animal é obrigatório')
  }

  const { method } = req

  switch (method) {
    case 'GET':
      await handleGet(req, res, id)
      break
    case 'PUT':
      await handlePut(req, res, id)
      break
    case 'DELETE':
      await handleDelete(req, res, id)
      break
    default:
      return sendMethodNotAllowed(res, ['GET', 'PUT', 'DELETE'])
  }
})

async function handleGet(req, res, id) {
  const { history, serie, rg } = req.query
  
  debugLog(`[START] Buscando animal com ID/RG: ${id} (tipo: ${typeof id}, history: ${history})`);
  
  let animal = null
  const animalId = parseInt(id, 10)

  // 0. Se id tem formato SÉRIE-RG (ex: CJCJ-16974) ou SÉRIE RG (ex: CJCJ 17037), tentar PRIMEIRO - evita 404 recorrente
  const idStr = id && typeof id === 'string' ? String(id).trim() : ''
  const isSerieRgFormat = idStr && isNaN(animalId) && (idStr.includes('-') || /^[A-Za-z]+\s+\d+$/.test(idStr))
  if (isSerieRgFormat) {
    try {
      const { query } = require('../../../lib/database')
      let serieBusca, rgBruto
      if (idStr.includes('-')) {
        const parts = idStr.split('-')
        serieBusca = (parts[0] || '').trim()
        rgBruto = (parts.slice(1).join('-') || '').trim()
      } else {
        const match = idStr.match(/^([A-Za-z]+)\s+(\d+)$/)
        if (match) {
          serieBusca = match[1].trim()
          rgBruto = match[2].trim()
        } else {
          serieBusca = ''
          rgBruto = ''
        }
      }
      const rgBusca = rgBruto.replace(/^0+/, '') || '0'
      const rgNum = /^\d+$/.test(rgBusca) ? parseInt(rgBusca, 10) : null

      if (serieBusca && (rgBusca || rgNum !== null)) {
        debugLog(`Tentando buscar animal por SÉRIE-RG: ${serieBusca}-${rgBusca} (bruto: ${rgBruto})`)

        // Tentativa 1: match exato normalizado (rg sem zeros à esquerda)
        let result = await query(
          `SELECT id, serie, rg FROM animais 
           WHERE UPPER(TRIM(COALESCE(serie, ''))) = UPPER(TRIM($1)) 
             AND COALESCE(NULLIF(REGEXP_REPLACE(TRIM(rg::text), '^0+', ''), ''), '0') = $2
           LIMIT 1`,
          [serieBusca, rgBusca]
        )
        debugLog(`Tentativa 1 (normalizada): ${result.rows.length} encontrados`)

        // Tentativa 2: rg como texto exato
        if (result.rows.length === 0) {
          result = await query(
            `SELECT id, serie, rg FROM animais 
             WHERE UPPER(TRIM(COALESCE(serie, ''))) = UPPER(TRIM($1)) 
               AND (TRIM(rg::text) = $2 OR rg::text = $2)
             LIMIT 1`,
            [serieBusca, rgBruto]
          )
          debugLog(`Tentativa 2 (texto exato): ${result.rows.length} encontrados`)
        }

        // Tentativa 3: rg como inteiro (coluna pode ser int ou varchar)
        if (result.rows.length === 0 && rgNum !== null) {
          try {
            const r3 = await query(
              `SELECT id, serie, rg FROM animais 
               WHERE UPPER(TRIM(COALESCE(serie, ''))) = UPPER(TRIM($1)) 
                 AND (rg::text = $2 OR rg = $3)
               LIMIT 1`,
              [serieBusca, String(rgNum), rgNum]
            )
            if (r3.rows.length > 0) result = r3
            debugLog(`Tentativa 3 (numérico): ${result.rows.length} encontrados`)
          } catch (_) { /* ignora se rg não for numérico */ }
        }

        // Tentativa 4: busca mais flexível (rg contém ou termina com)
        if (result.rows.length === 0 && rgBruto) {
          result = await query(
            `SELECT id, serie, rg FROM animais 
             WHERE UPPER(TRIM(COALESCE(serie, ''))) = UPPER(TRIM($1)) 
               AND TRIM(rg::text) = TRIM($2)
             LIMIT 1`,
            [serieBusca, rgBruto]
          )
          debugLog(`Tentativa 4 (flexível): ${result.rows.length} encontrados`)
        }

        // Tentativa 5: usar buscarAnimais (mesma lógica da API principal - mais robusta)
        if (result.rows.length === 0) {
          try {
            debugLog(`Tentativa 5 (buscarAnimais service)...`)
            const animais = await databaseService.buscarAnimais({ serie: serieBusca, rg: rgBruto || rgBusca, limit: 1 })
            if (animais && animais.length > 0) {
              result = { rows: [{ id: animais[0].id, serie: animais[0].serie, rg: animais[0].rg }] }
            }
            debugLog(`Tentativa 5: ${result.rows.length} encontrados`)
          } catch (errService) { 
             debugLog(`Erro na Tentativa 5: ${errService.message}`)
          }
        }

        // Tentativa 6: match por CONCAT (serie-rg ou serie rg) - cobre formatos variados no banco
        if (result.rows.length === 0) {
          try {
            const idNorm = String(id).trim()
            const idComEspaco = idNorm.replace('-', ' ')
            result = await query(
              `SELECT id, serie, rg FROM animais 
               WHERE (TRIM(COALESCE(serie,'')) || '-' || TRIM(rg::text)) IN ($1, $2)
                  OR (TRIM(COALESCE(serie,'')) || ' ' || TRIM(rg::text)) IN ($1, $2)
               LIMIT 1`,
              [idNorm, idComEspaco]
            )
            debugLog(`Tentativa 6 (CONCAT): ${result.rows.length} encontrados`)
          } catch (_) {}
        }

        // Tentativa 7: serie com espaços (ex: "CJ CJ" = "CJCJ")
        if (result.rows.length === 0 && serieBusca && rgBruto) {
          try {
            const serieSemEspacos = String(serieBusca).replace(/\s/g, '')
            result = await query(
              `SELECT id, serie, rg FROM animais 
               WHERE UPPER(REPLACE(TRIM(COALESCE(serie, '')), ' ', '')) = UPPER($1)
                 AND (TRIM(rg::text) = $2 OR rg::text = $2)
               LIMIT 1`,
              [serieSemEspacos, rgBruto]
            )
            debugLog(`Tentativa 7 (serie sem espaços): ${result.rows.length} encontrados`)
          } catch (_) {}
        }

        // Tentativa 8: RG com zeros à esquerda (ex: 013604 quando busca 13604) - tenta variantes
        if (result.rows.length === 0 && serieBusca && rgBruto && /^\d+$/.test(rgBruto)) {
          try {
            const variantesRg = [rgBruto]
            if (rgBruto.length <= 5) variantesRg.push(rgBruto.padStart(6, '0')) // 13604 -> 013604
            if (rgBruto.length <= 4) variantesRg.push(rgBruto.padStart(5, '0'))
            for (const rgVar of variantesRg) {
              if (result.rows.length > 0) break
              const r8 = await query(
                `SELECT id, serie, rg FROM animais 
                 WHERE UPPER(TRIM(COALESCE(serie, ''))) = UPPER(TRIM($1)) 
                   AND (TRIM(rg::text) = $2 OR TRIM(LEADING '0' FROM rg::text) = $3)
                 LIMIT 1`,
                [serieBusca, rgVar, rgBruto]
              )
              if (r8.rows.length > 0) result = r8
            }
            debugLog(`Tentativa 8 (rg variantes): ${result.rows.length} encontrados`)
          } catch (_) {}
        }

        if (result.rows.length > 0) {
          const row = result.rows[0]
          debugLog(`✅ Animal encontrado por SÉRIE-RG ${id} → ID ${row.id}`)
          try {
            if (history === 'true') {
              debugLog(`Buscando histórico completo para ID ${row.id}...`)
              animal = await databaseService.buscarHistoricoAnimal(row.id)
            } else {
              debugLog(`Buscando dados básicos para ID ${row.id}...`)
              animal = await databaseService.buscarAnimalPorId(row.id)
            }
            if (!animal) {
                debugLog(`❌ buscarHistoricoAnimal/buscarAnimalPorId retornou null para ID ${row.id}`)
            } else {
                debugLog(`✅ Dados carregados com sucesso para ID ${row.id}`)
            }
          } catch (e) {
            debugLog(`ERRO CRÍTICO ao buscar animal/histórico ID ${row.id}: ${e.message}`)
            logger.warn('buscarHistoricoAnimal falhou após match serie-rg:', e?.message)
            try {
              debugLog(`Tentando fallback básico (buscarAnimalPorId) para ID ${row.id}...`)
              animal = await databaseService.buscarAnimalPorId(row.id)
            } catch (_) {
              debugLog(`Fallback básico falhou. Tentando query direta manual...`)
              const { query: q2 } = require('../../../lib/database')
              const full = await q2('SELECT * FROM animais WHERE id = $1', [row.id])
              if (full.rows[0]) {
                const r = full.rows[0]
                let filhos = []
                try {
                  const fRes = await q2(
                    `SELECT * FROM animais WHERE (serie_mae = $1 AND rg_mae = $2) OR mae LIKE $3 OR mae = $4 ORDER BY data_nascimento DESC`,
                    [r.serie, r.rg, `%${r.serie}-${r.rg}%`, `${r.serie} ${r.rg}`]
                  )
                  filhos = fRes.rows || []
                } catch (_) {
                  try {
                    const fRes = await q2(`SELECT * FROM animais WHERE mae LIKE $1 OR mae = $2 ORDER BY data_nascimento DESC`, [`%${r.serie}-${r.rg}%`, `${r.serie} ${r.rg}`])
                    filhos = fRes.rows || []
                  } catch (__) {}
                }
                animal = { ...r, pesagens: [], inseminacoes: [], custos: [], gestacoes: [], filhos, protocolos: [], localizacoes: [], fivs: [] }
                console.log(`⚠️ Retornando animal ${r.serie}-${r.rg} (fallback básico com ${filhos.length} filhos)`)
              }
            }
          }
        }
      }
    } catch (e) {
      debugLog(`❌ Busca SÉRIE-RG falhou: ${e?.message || e}`)
      logger.warn('Busca SÉRIE-RG falhou:', e?.message)
    }
  }

  // 1. Tentar buscar por ID numérico (se ainda não encontrou)
  if (!animal && !isNaN(animalId)) {
    console.log(`📋 Tentando buscar por ID numérico: ${animalId}`)
    
    try {
      if (history === 'true') {
        animal = await databaseService.buscarHistoricoAnimal(animalId)
      } else {
        animal = await databaseService.buscarAnimalPorId(animalId)
      }
    } catch (err) {
      logger.warn('Erro na busca principal por ID:', err?.message)
    }
    
    // Fallback 1: query direta (evita inconsistências - mesma lógica do /verificar)
    if (!animal) {
      try {
        const { query } = require('../../../lib/database')
        const direct = await query(
          `SELECT id FROM animais WHERE id = $1 OR rg::text = TRIM($2) OR rg = $3 LIMIT 1`,
          [animalId, String(id), animalId]
        )
        if (direct.rows.length > 0) {
          const foundId = direct.rows[0].id
          console.log(`📋 Fallback: encontrado por query direta (id=${foundId}), buscando completo...`)
          try {
            if (history === 'true') {
              animal = await databaseService.buscarHistoricoAnimal(foundId)
            } else {
              animal = await databaseService.buscarAnimalPorId(foundId)
            }
          } catch (e2) {
            logger.warn('Fallback busca completa falhou:', e2?.message)
          }
        }
      } catch (e) {
        logger.warn('Fallback query direta falhou:', e?.message)
      }
    }
    
    // Fallback 2: buscar por serie+rg (quando ID falha mas animal existe - ex: CJCJ 16974)
    if (!animal && serie && rg) {
      try {
        const { query } = require('../../../lib/database')
        const bySerieRg = await query(
          `SELECT id FROM animais WHERE UPPER(TRIM(serie)) = UPPER(TRIM($1)) AND TRIM(rg::text) = TRIM($2) LIMIT 1`,
          [String(serie).trim(), String(rg).trim()]
        )
        if (bySerieRg.rows.length > 0) {
          const foundId = bySerieRg.rows[0].id
          console.log(`📋 Fallback serie+rg: encontrado ${serie}-${rg} (id=${foundId})`)
          try {
            if (history === 'true') {
              animal = await databaseService.buscarHistoricoAnimal(foundId)
            } else {
              animal = await databaseService.buscarAnimalPorId(foundId)
            }
          } catch (e2) {
            logger.warn('Fallback serie+rg busca completa falhou:', e2?.message)
          }
        }
      } catch (e) {
        logger.warn('Fallback serie+rg falhou:', e?.message)
      }
    }
    
    // Fallback 3: verificação crua - animal existe mas buscarHistoricoAnimal falhou?
    if (!animal && history === 'true') {
      try {
        const { query } = require('../../../lib/database')
        const raw = await query(
          `SELECT id, serie, rg, nome, sexo, raca, mgte, top FROM animais WHERE id = $1 LIMIT 1`,
          [animalId]
        )
        if (raw.rows.length > 0) {
          const row = raw.rows[0]
          console.log(`📋 Fallback cru: animal existe (${row.serie}-${row.rg}), buscarHistoricoAnimal falhou - tentando buscarAnimalPorId`)
          try {
            animal = await databaseService.buscarHistoricoAnimal(animalId)
          } catch (_) {
            try {
              animal = await databaseService.buscarAnimalPorId(animalId)
              if (animal) {
                animal = { ...animal, pesagens: animal.pesagens || [], inseminacoes: animal.inseminacoes || [], custos: animal.custos || [], gestacoes: [], filhos: [], protocolos: [], localizacoes: animal.localizacoes || [], fivs: animal.fivs || [] }
              }
            } catch (_) {
              animal = { ...row, pesagens: [], inseminacoes: [], custos: [], gestacoes: [], filhos: [], protocolos: [], localizacoes: [], fivs: [] }
              console.log(`⚠️ Retornando dados básicos do animal ${row.serie}-${row.rg} (histórico incompleto)`)
            }
          }
        }
      } catch (e) {
        logger.warn('Fallback cru falhou:', e?.message)
      }
    }
    
    if (animal) {
      console.log(`✅ Animal encontrado por ID: ${animalId}`)
    } else {
      console.log(`⚠️ Animal não encontrado por ID: ${animalId}`)
    }
  }
  
  // 2. Se não encontrou por ID, tentar buscar por RG
  if (!animal) {
    console.log(`📋 Tentando buscar por RG: ${id}`)
    try {
      const { query } = require('../../../lib/database')
      
      // Buscar por RG exato
      const resultRG = await query(
        `SELECT * FROM animais WHERE rg = $1 LIMIT 1`,
        [id]
      )
      
      if (resultRG.rows.length > 0) {
        const animalRG = resultRG.rows[0]
        console.log(`✅ Animal encontrado por RG ${id}: ID ${animalRG.id} (${animalRG.serie}-${animalRG.rg})`)
        
        // Buscar animal completo usando o ID encontrado
        if (history === 'true') {
          animal = await databaseService.buscarHistoricoAnimal(animalRG.id)
        } else {
          animal = await databaseService.buscarAnimalPorId(animalRG.id)
        }
      } else {
        // Tentar buscar por série-RG combinado (ex: "CJCJ-17836" ou "CJCJ-16013")
        if (id.includes('-')) {
          const parts = id.split('-')
          const serie = parts[0].trim()
          const rg = parts.slice(1).join('-').trim() // RG pode ter hífen (ex: 16013)
          console.log(`📋 Tentando buscar por série-RG: ${serie}-${rg}`)
          
          // Busca flexível: rg como texto e como número (PostgreSQL aceita ambos)
          let resultSerieRG = await query(
            `SELECT * FROM animais 
             WHERE UPPER(TRIM(serie)) = UPPER(TRIM($1)) 
               AND (TRIM(rg::text) = $2 OR rg::text = $2)
             LIMIT 1`,
            [serie, rg]
          )
          // Fallback 1: tentar rg como inteiro (alguns bancos armazenam assim)
          if (resultSerieRG.rows.length === 0 && /^\d+$/.test(rg)) {
            try {
              const alt = await query(
                `SELECT * FROM animais WHERE UPPER(TRIM(serie)) = UPPER(TRIM($1)) AND rg::text = $2 LIMIT 1`,
                [serie, rg]
              )
              if (alt.rows.length > 0) resultSerieRG = alt
            } catch (e) { /* ignora */ }
          }
          // Fallback 2: typo comum I↔J (ex: CJCI vs CJCJ)
          if (resultSerieRG.rows.length === 0 && serie.length >= 2) {
            const serieAlt = serie.includes('I') ? serie.replace(/I/g, 'J') : serie.replace(/J/g, 'I')
            if (serieAlt !== serie) {
              try {
                const alt = await query(
                  `SELECT * FROM animais WHERE UPPER(TRIM(serie)) = UPPER(TRIM($1)) AND TRIM(rg::text) = $2 LIMIT 1`,
                  [serieAlt, rg]
                )
                if (alt.rows.length > 0) resultSerieRG = alt
              } catch (e) { /* ignora */ }
            }
          }
          
          if (resultSerieRG.rows.length > 0) {
            const animalSerieRG = resultSerieRG.rows[0]
            console.log(`✅ Animal encontrado por série-RG ${id}: ID ${animalSerieRG.id}`)
            
            // Buscar animal completo usando o ID encontrado
            if (history === 'true') {
              animal = await databaseService.buscarHistoricoAnimal(animalSerieRG.id)
            } else {
              animal = await databaseService.buscarAnimalPorId(animalSerieRG.id)
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao buscar por RG:', error)
    }
  }
  
  // 3. Se ainda não encontrou, tentar buscar animais próximos (apenas para IDs numéricos)
  if (!animal && !isNaN(animalId)) {
    console.log(`⚠️ Animal ${id} não encontrado, buscando animais próximos...`)
    try {
      const { query } = require('../../../lib/database')
      const animaisProximos = await query(
        `SELECT id, serie, rg, nome FROM animais 
         WHERE id BETWEEN $1 AND $2 
         ORDER BY ABS(id - $3) 
         LIMIT 5`,
        [animalId - 10, animalId + 10, animalId]
      )
      
      if (animaisProximos.rows.length > 0) {
        console.log(`💡 Animais próximos encontrados:`, animaisProximos.rows.map(a => `${a.id} (${a.serie}-${a.rg})`))
      }
    } catch (error) {
      console.error('Erro ao buscar animais próximos:', error)
    }
  }
  
  // Fallback: se não encontrou em animais, buscar coletas FIV por doadora_nome (doadora inativa/não cadastrada)
  if (!animal && id.includes('-')) {
    try {
      const { query: dbQuery } = require('../../../lib/database')
      const [serie, rg] = id.split('-').map(s => s.trim())
      const ident1 = `${serie} ${rg}`
      const ident2 = `${serie}-${rg}`
      const colsFiv = 'id, data_fiv, data_transferencia, quantidade_oocitos, touro, laboratorio, veterinario, doadora_nome, observacoes'
      const coletasResult = await dbQuery(
        `SELECT ${colsFiv} FROM coleta_fiv
         WHERE UPPER(TRIM(doadora_nome)) = UPPER($1)
            OR UPPER(TRIM(doadora_nome)) = UPPER($2)
            OR UPPER(REPLACE(COALESCE(doadora_nome,''), ' ', '')) = UPPER(REPLACE($1, ' ', ''))
         ORDER BY data_fiv DESC`,
        [ident1, ident2]
      )
      if (coletasResult.rows.length > 0) {
        const fivs = coletasResult.rows
        const skeletonAnimal = {
          id: null,
          serie,
          rg,
          nome: `${serie} ${rg}`,
          situacao: 'Inativo (apenas coletas FIV)',
          sexo: 'Fêmea',
          fivs,
          is_doadora: true,
          _apenas_coletas: true
        }
        const animalComIdentificacao = {
          ...skeletonAnimal,
          localizacoes: [],
          identificacao: `${serie}-${rg}`,
          dataNascimento: null,
          precoVenda: null,
          status: skeletonAnimal.situacao
        }
        console.log(`✅ Doadora ${id} não cadastrada - retornando ficha com ${fivs.length} coletas FIV`)
        return sendSuccess(res, animalComIdentificacao)
      }
    } catch (e) {
      console.warn('Erro ao buscar coletas FIV para doadora não cadastrada:', e.message)
    }
  }

  // Fallback final: ID numérico falhou - se animal existe, retornar dados básicos (buscarHistoricoAnimal pode falhar)
  if (!animal && !isNaN(animalId)) {
    try {
      const { query: dbQuery } = require('../../../lib/database')
      const lookup = await dbQuery(
        `SELECT * FROM animais WHERE id = $1 LIMIT 1`,
        [animalId]
      )
      if (lookup.rows.length > 0) {
        const row = lookup.rows[0]
        console.log(`📋 Fallback final: animal ${animalId} existe (${row.serie}-${row.rg}), retornando dados básicos`)
        try {
          animal = history === 'true'
            ? await databaseService.buscarHistoricoAnimal(row.id)
            : await databaseService.buscarAnimalPorId(row.id)
        } catch (_) {
          animal = { ...row, pesagens: [], inseminacoes: [], custos: [], gestacoes: [], filhos: [], protocolos: [], localizacoes: [], fivs: [] }
        }
      }
    } catch (e) {
      logger.warn('Fallback final lookup falhou:', e?.message)
    }
  }

  // Fallback: animal inativo - existe apenas em baixas (abate, morte, venda)
  if (!animal && idStr && idStr.includes('-')) {
    try {
      const [serieBaixa, rgBaixa] = idStr.split('-').map(s => s?.trim() || '')
      if (serieBaixa && rgBaixa) {
        const baixas = await databaseService.buscarBaixasPorSerieRg(serieBaixa, rgBaixa)
        if (baixas && baixas.length > 0) {
          const venda = baixas.find(b => b.tipo === 'VENDA')
          const morte = baixas.find(b => b.tipo === 'MORTE/BAIXA')
          const situacao = venda ? 'Vendido' : (morte ? 'Morto/Abate' : 'Baixa')
          const skeletonAnimal = {
            id: null,
            serie: serieBaixa,
            rg: rgBaixa,
            nome: `${serieBaixa} ${rgBaixa}`,
            situacao: `Inativo (${situacao})`,
            sexo: null,
            raca: null,
            filhos: [],
            gestacoes: [],
            inseminacoes: [],
            pesagens: [],
            custos: [],
            protocolos: [],
            localizacoes: [],
            fivs: [],
            _apenas_baixas: true,
            baixas
          }
          debugLog(`✅ Animal ${id} não cadastrado - retornando ficha com ${baixas.length} baixa(s) (histórico)`)
          return sendSuccess(res, skeletonAnimal)
        }
      }
    } catch (e) {
      debugLog(`Fallback baixas falhou: ${e?.message}`)
    }
  }

  // Se não encontrou no PostgreSQL, retornar erro (fallback desativado)
  if (!animal) {
    return sendNotFound(res, 'Animal não encontrado')
  }
  
  // Corrigir raça baseada na série
  if (animal.serie && racasPorSerie[animal.serie] && animal.raca !== racasPorSerie[animal.serie]) {
    animal.raca = racasPorSerie[animal.serie]
  }

  // Enriquecer com série e RG da mãe quando não estiverem preenchidos
  if (animal.mae && !(animal.serie_mae || animal.rg_mae)) {
    try {
      const { query: dbQuery } = require('../../../lib/database')
      const maeNome = String(animal.mae).trim()
      // 1. Buscar em animais por nome (exato ou LIKE)
      let maeResult = await dbQuery(
        `SELECT id, serie, rg, nome FROM animais 
         WHERE UPPER(TRIM(COALESCE(nome,''))) = UPPER(TRIM($1)) 
         LIMIT 1`,
        [maeNome]
      )
      if (maeResult.rows.length === 0) {
        maeResult = await dbQuery(
          `SELECT id, serie, rg, nome FROM animais 
           WHERE UPPER(TRIM(COALESCE(nome,''))) LIKE UPPER($1) 
           LIMIT 1`,
          [`%${maeNome}%`]
        )
      }
      // 2. Se não achou em animais, buscar em gestações (receptora_nome = mãe)
      if (maeResult.rows.length === 0) {
        let gestMae = await dbQuery(
          `SELECT receptora_serie as serie, receptora_rg as rg 
           FROM gestacoes 
           WHERE UPPER(TRIM(COALESCE(receptora_nome,''))) = UPPER(TRIM($1))
             AND receptora_serie IS NOT NULL AND receptora_rg IS NOT NULL
           LIMIT 1`,
          [maeNome]
        )
        if (gestMae.rows.length === 0) {
          gestMae = await dbQuery(
            `SELECT receptora_serie as serie, receptora_rg as rg 
             FROM gestacoes 
             WHERE UPPER(TRIM(COALESCE(receptora_nome,''))) LIKE UPPER($1)
               AND receptora_serie IS NOT NULL AND receptora_rg IS NOT NULL
             LIMIT 1`,
            [`%${maeNome}%`]
          )
        }
        if (gestMae.rows.length > 0) {
          animal.serie_mae = gestMae.rows[0].serie
          animal.rg_mae = gestMae.rows[0].rg
        }
      }
      // 3. Se ainda não achou, buscar via nascimentos: gestação onde este animal nasceu
      if (!animal.serie_mae && !animal.rg_mae && animal.serie && animal.rg) {
        const nascMae = await dbQuery(
          `SELECT g.receptora_serie as serie, g.receptora_rg as rg 
           FROM gestacoes g
           JOIN nascimentos n ON n.gestacao_id = g.id
           WHERE TRIM(n.serie) = TRIM($1) AND TRIM(n.rg::text) = TRIM($2)
             AND g.receptora_serie IS NOT NULL AND g.receptora_rg IS NOT NULL
           LIMIT 1`,
          [String(animal.serie).trim(), String(animal.rg).trim()]
        )
        if (nascMae.rows.length > 0) {
          animal.serie_mae = nascMae.rows[0].serie
          animal.rg_mae = nascMae.rows[0].rg
        }
      }
      if (maeResult.rows.length > 0 && !animal.serie_mae) {
        const mae = maeResult.rows[0]
        animal.serie_mae = mae.serie
        animal.rg_mae = mae.rg
      }
    } catch (e) {
      console.warn('Erro ao buscar série/RG da mãe:', e)
    }
  }

  // Garantir localizacoes (piquete) para exibição na consulta - buscar se não vier do banco
  let localizacoes = animal.localizacoes
  if (!localizacoes || !Array.isArray(localizacoes) || localizacoes.length === 0) {
    try {
      const { query: dbQuery } = require('../../../lib/database')
      const locResult = await dbQuery(
        'SELECT * FROM localizacoes_animais WHERE animal_id = $1 ORDER BY data_entrada DESC',
        [animal.id]
      )
      localizacoes = locResult.rows || []
    } catch (e) {
      localizacoes = []
    }
  }
  
  // Adicionar campos para compatibilidade
  const animalComIdentificacao = {
    ...animal,
    localizacoes,
    identificacao: `${animal.serie}-${animal.rg}`,
    dataNascimento: animal.data_nascimento,
    precoVenda: animal.valor_venda,
    status: animal.situacao,
    // Garantir que ambos os formatos de nome do campo estejam presentes
    avo_materno: animal.avo_materno || animal.avoMaterno || null,
    avoMaterno: animal.avo_materno || animal.avoMaterno || null,
    situacao_abcz: animal.situacao_abcz || animal.situacaoAbcz || null,
    situacaoAbcz: animal.situacao_abcz || animal.situacaoAbcz || null
  }
  
  console.log(`✅ GET Animal ${animal.serie}-${animal.rg} (ID: ${animal.id})`)
  
  return sendSuccess(res, animalComIdentificacao)
}

async function handlePut(req, res, id) {
  const dataNasc = req.body.dataNascimento ?? req.body.data_nascimento
  const pasto = req.body.pastoAtual ?? req.body.pasto_atual
  console.log(`📝 PUT animal ${id} | data_nascimento:`, dataNasc, '| pasto_atual:', pasto)
  
  const animal = await databaseService.atualizarAnimal(id, req.body)
  
  if (!animal) {
    return sendNotFound(res, 'Animal não encontrado para atualização')
  }
  console.log(`✅ Animal ${id} atualizado | data_nascimento:`, animal.data_nascimento, '| pasto_atual:', animal.pasto_atual)
  
  // DESABILITADO: Não criar nota fiscal de saída automaticamente
  // A NF deve ser criada manualmente através do módulo de Notas Fiscais
  // if (req.body.situacao === 'Vendido' && req.body.valor_venda) {
  //   try {
  //     await criarNotaFiscalSaidaAutomatica(animal)
  //     logger.info(`NF de saída criada automaticamente para: ${animal.serie}${animal.rg}`)
  //   } catch (nfError) {
  //     logger.error(`Erro ao criar NF de saída automática: ${nfError.message}`)
  //     // Não falhar a atualização do animal se a NF falhar
  //   }
  // }
  
  // Corrigir raça baseada na série
  if (animal.serie && racasPorSerie[animal.serie] && animal.raca !== racasPorSerie[animal.serie]) {
    animal.raca = racasPorSerie[animal.serie]
  }
  
  // Adicionar campos para compatibilidade
  const animalComIdentificacao = {
    ...animal,
    identificacao: `${animal.serie}-${animal.rg}`,
    dataNascimento: animal.data_nascimento,
    precoVenda: animal.valor_venda,
    status: animal.situacao,
    // Garantir que ambos os formatos de nome do campo estejam presentes
    avo_materno: animal.avo_materno || animal.avoMaterno || null,
    avoMaterno: animal.avo_materno || animal.avoMaterno || null,
    situacao_abcz: animal.situacao_abcz || animal.situacaoAbcz || null,
    situacaoAbcz: animal.situacao_abcz || animal.situacaoAbcz || null
  }
  
  broadcast('animal.updated', { animalId: animal.id, serie: animal.serie, rg: animal.rg })
  return sendSuccess(res, animalComIdentificacao)
}

async function handleDelete(req, res, id) {
  // Verificar permissão de exclusão
  if (!canDelete(req)) {
    return sendForbidden(res, 'Acesso negado. Esta ação é permitida apenas para o desenvolvedor (acesso local).')
  }

  const animal = await databaseService.deletarAnimal(id)

  broadcast('animal.deleted', { animalId: Number(id) })
  return sendSuccess(res, {
    message: 'Animal deletado com sucesso',
    data: animal
  })
}
