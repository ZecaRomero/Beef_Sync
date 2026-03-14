import { query } from '../../lib/database'
import logger from '../../utils/logger'
import { 
  sendSuccess, 
  sendValidationError, 
  sendNotFound, 
  sendMethodNotAllowed,
  asyncHandler
} from '../../utils/apiResponse'

async function calendarioHandler(req, res) {
  const { method } = req

  switch (method) {
    case 'GET':
      await handleGet(req, res)
      break
    case 'POST':
      await handlePost(req, res)
      break
    case 'PUT':
      await handlePut(req, res)
      break
    case 'DELETE':
      await handleDelete(req, res)
      break
    default:
      return sendMethodNotAllowed(res, ['GET', 'POST', 'PUT', 'DELETE'])
  }
}

async function handleGet(req, res) {
  const { id, data_inicio, data_fim, tipo, animal, limit = 200, offset = 0 } = req.query

  try {
    logger.info(`Buscando eventos do calendário - Tipo: ${tipo || 'todos'}, Data: ${data_inicio || 'todas'}`)
    
    if (id) {
      const result = await query(
        'SELECT * FROM calendario_reprodutivo WHERE id = $1',
        [id]
      )

      if (result.rows.length === 0) {
        return sendNotFound(res, 'Evento não encontrado')
      }

      return sendSuccess(res, result.rows[0])
    }

    // Buscar eventos do calendário manual
    let sql = `
      SELECT 
        cr.id,
        cr.titulo,
        cr.animal_id,
        cr.data_evento,
        cr.tipo_evento,
        cr.descricao,
        cr.status,
        a.serie as animal_serie, 
        a.rg as animal_rg,
        a.nome as animal_nome,
        a.tatuagem as animal_tatuagem,
        'manual' as origem
      FROM calendario_reprodutivo cr
      LEFT JOIN animais a ON cr.animal_id = a.id
      WHERE 1=1
    `
    const params = []
    let paramCount = 0

    if (data_inicio) {
      paramCount++
      sql += ` AND cr.data_evento >= $${paramCount}`
      params.push(data_inicio)
    }

    if (data_fim) {
      paramCount++
      sql += ` AND cr.data_evento <= $${paramCount}`
      params.push(data_fim)
    }

    if (tipo) {
      paramCount++
      sql += ` AND cr.tipo_evento = $${paramCount}`
      params.push(tipo)
    }

    if (animal) {
      paramCount++
      sql += ` AND (a.serie ILIKE $${paramCount} OR a.rg ILIKE $${paramCount} OR a.nome ILIKE $${paramCount})`
      params.push(`%${animal}%`)
    }

    let eventosManuais = { rows: [] }
    try {
      eventosManuais = await query(sql, params)
    } catch (queryError) {
      logger.error('Erro ao buscar eventos manuais:', queryError)
      console.error('Erro na query de eventos manuais:', queryError)
      // Continuar com array vazio se houver erro
      eventosManuais = { rows: [] }
    }

    // Buscar eventos das receptoras (chegada da NF e DG agendado)
    let receptorasResult = { rows: [] }
    try {
      let sqlReceptoras = `
        SELECT DISTINCT
          nf.id as nf_id,
          nf.numero_nf,
          nf.data_compra,
          nf.receptora_letra,
          nf.receptora_numero,
          nf.data_te,
          nf.fornecedor,
          CASE 
            WHEN nf.data_compra IS NOT NULL THEN (nf.data_compra + INTERVAL '20 days')::date
            ELSE NULL
          END as data_prevista_dg,
          CASE 
            WHEN item.dados_item IS NOT NULL THEN item.dados_item->>'tatuagem'
            ELSE NULL
          END as tatuagem_item,
          item.id as item_id,
          a.id as animal_id,
          a.serie,
          a.rg,
          a.nome as animal_nome,
          a.tatuagem as animal_tatuagem,
          a.data_dg as animal_data_dg,
          a.resultado_dg as animal_resultado_dg
        FROM notas_fiscais nf
        INNER JOIN notas_fiscais_itens item ON item.nota_fiscal_id = nf.id
        LEFT JOIN animais a ON (
          (a.serie = nf.receptora_letra AND a.rg = nf.receptora_numero) OR
          (item.dados_item->>'tatuagem' IS NOT NULL AND a.tatuagem = item.dados_item->>'tatuagem') OR
          (REPLACE(LOWER(COALESCE(a.serie,'')||COALESCE(a.rg::text,'')),' ','') = REPLACE(LOWER(COALESCE(nf.receptora_letra,'')||COALESCE(nf.receptora_numero,'')),' ',''))
        )
        WHERE nf.eh_receptoras = true
          AND nf.tipo = 'entrada'
          AND (item.tipo_produto = 'bovino' OR item.tipo_produto IS NULL)
      `
      const paramsReceptoras = []
      let paramCountReceptoras = 0

      if (data_inicio) {
        paramCountReceptoras++
        sqlReceptoras += ` AND (nf.data_compra >= $${paramCountReceptoras} OR (nf.data_compra + INTERVAL '20 days')::date >= $${paramCountReceptoras})`
        paramsReceptoras.push(data_inicio)
      }

      if (data_fim) {
        paramCountReceptoras++
        sqlReceptoras += ` AND (nf.data_compra <= $${paramCountReceptoras} OR (nf.data_compra + INTERVAL '20 days')::date <= $${paramCountReceptoras})`
        paramsReceptoras.push(data_fim)
      }

      receptorasResult = await query(sqlReceptoras, paramsReceptoras)
    } catch (queryError) {
      logger.error('Erro ao buscar receptoras:', queryError)
      console.error('Erro na query de receptoras:', queryError)
      // Continuar com array vazio se houver erro
      receptorasResult = { rows: [] }
    }
    
    console.log(`📋 Receptoras encontradas na query: ${receptorasResult.rows.length}`)
    if (receptorasResult.rows.length > 0) {
      console.log('📋 Primeira receptora exemplo:', JSON.stringify(receptorasResult.rows[0], null, 2))
    }

    // Buscar animais que já têm DG (para filtrar eventos DG agendado)
    const animaisComDG = new Set()
    const receptoraVaziaKeys = new Set() // Receptoras diagnosticadas como VAZIA - não mostrar Parto Previsto
    try {
      const r = await query(`SELECT serie, rg, tatuagem, resultado_dg FROM animais WHERE data_dg IS NOT NULL`)
      r.rows.forEach(ax => {
        const serie = String(ax.serie||'').trim().toUpperCase()
        const rg = String(ax.rg||'').trim()
        const rgSemZero = rg.replace(/^0+/, '') || '0'
        const tatuagem = String(ax.tatuagem||'').replace(/\s/g, '').toLowerCase()
        const serieRg = (serie+rg).replace(/\s/g, '').toLowerCase()
        const res = String(ax.resultado_dg || '').toLowerCase()
        const ehVazia = res.includes('vazia') || res.includes('negativ') || res.includes('nao') || res.includes('não')
        animaisComDG.add(`${serie}_${rg}`)
        animaisComDG.add(`_${rgSemZero}`)
        animaisComDG.add(serieRg)
        if (tatuagem) animaisComDG.add(tatuagem)
        if (ehVazia) {
          receptoraVaziaKeys.add(`${serie}_${rg}`)
          receptoraVaziaKeys.add(`_${rgSemZero}`)
          receptoraVaziaKeys.add(serieRg)
          if (tatuagem) receptoraVaziaKeys.add(tatuagem)
        }
      })
      const teVazias = await query(`SELECT r.serie, r.rg FROM transferencias_embrioes te
        LEFT JOIN animais r ON r.id = te.receptora_id
        WHERE te.data_diagnostico IS NOT NULL AND LOWER(COALESCE(te.resultado,'')) IN ('vazia','negativo')`)
      teVazias.rows.forEach(ax => {
        const serie = String(ax.serie||'').trim().toUpperCase()
        const rg = String(ax.rg||'').trim()
        const rgSemZero = rg.replace(/^0+/, '') || '0'
        receptoraVaziaKeys.add(`${serie}_${rg}`)
        receptoraVaziaKeys.add(`_${rgSemZero}`)
        receptoraVaziaKeys.add((serie+rg).replace(/\s/g, '').toLowerCase())
      })
    } catch (e) {
      console.error('Erro ao buscar animais com DG:', e.message)
    }

    const ehReceptoraVazia = (letra, numero, tatuagem) => {
      const n = String(numero||'').trim()
      const nSemZero = n.replace(/^0+/, '') || '0'
      const l = String(letra||'').trim().toUpperCase()
      const t = String(tatuagem||'').replace(/\s/g, '').toLowerCase()
      const ln = (l+n).replace(/\s/g, '').toLowerCase()
      return receptoraVaziaKeys.has(`${l}_${n}`) || receptoraVaziaKeys.has(`_${nSemZero}`) || receptoraVaziaKeys.has(t) || receptoraVaziaKeys.has(ln)
    }

    const jaTemDG = (letra, numero, tatuagem) => {
      if (!letra && !numero && !tatuagem) return false
      const n = String(numero||'').trim()
      const nSemZero = n.replace(/^0+/, '') || '0'
      const l = String(letra||'').trim().toUpperCase()
      const t = String(tatuagem||'').replace(/\s/g, '').toLowerCase()
      const ln = (l+n).replace(/\s/g, '').toLowerCase()
      return animaisComDG.has(`${l}_${n}`) || animaisComDG.has(`_${nSemZero}`) || animaisComDG.has(t) || animaisComDG.has(ln)
    }

    // Processar receptoras e criar eventos
    const eventosReceptoras = []
    const receptorasMap = new Map()

    console.log(`🔄 Iniciando processamento de ${receptorasResult.rows.length} receptoras...`)

    receptorasResult.rows.forEach((row, index) => {
      try {
        const tatuagem = row.tatuagem_item || ''
        let letra = row.receptora_letra || ''
        let numero = row.receptora_numero || ''
        
        // Extrair letra e número da tatuagem se disponível
        if (tatuagem) {
          const matchLetra = tatuagem.match(/^([A-Za-z]+)/)
          const matchNumero = tatuagem.match(/(\d+)/)
          if (matchLetra) letra = matchLetra[1].toUpperCase()
          if (matchNumero) numero = matchNumero[1]
        }

        // Se não conseguiu extrair da tatuagem, usar da NF
        if (!numero && row.receptora_numero) numero = String(row.receptora_numero).trim()
        if (!letra && row.receptora_letra) letra = String(row.receptora_letra).toUpperCase().trim()

        // Sempre processar, mesmo sem número (usar tatuagem como identificador)
        const itemId = row.item_id || index
        const chave = `${row.nf_id}_${itemId}`
        
        if (!receptorasMap.has(chave)) {
          receptorasMap.set(chave, true)
          
          const nomeReceptora = tatuagem || `${letra}${numero}`.trim() || `Receptora ${row.numero_nf}`
          console.log(`  ✅ Processando: ${nomeReceptora}`)
          
          // Evento 1: Chegada da NF
          if (row.data_compra) {
            eventosReceptoras.push({
              id: `receptora_chegada_${row.nf_id}_${numero}_${itemId}`,
              titulo: `Chegada Receptora ${nomeReceptora}`,
              animal_id: row.animal_id,
              data_evento: row.data_compra,
              tipo_evento: 'Chegada de Receptora',
              descricao: `Receptora ${nomeReceptora} chegou na NF ${row.numero_nf}${row.fornecedor ? ` - ${row.fornecedor}` : ''}${row.data_te ? `. TE: ${new Date(row.data_te).toLocaleDateString('pt-BR')}` : ''}`,
              status: 'Concluído',
              animal_serie: letra,
              animal_rg: numero,
              animal_nome: row.animal_nome || nomeReceptora,
              animal_tatuagem: row.animal_tatuagem || tatuagem || `${letra}${numero}`,
              origem: 'receptora',
              numero_nf: row.numero_nf,
              fornecedor: row.fornecedor,
              data_te: row.data_te
            })
          }

          // Evento 2: DG Agendado (20 dias após chegada) - SOMENTE se o animal ainda NÃO passou pelo DG
          const temDG = row.animal_data_dg || jaTemDG(letra, numero, tatuagem)
          if (row.data_prevista_dg && !temDG) {
            eventosReceptoras.push({
                id: `receptora_dg_${row.nf_id}_${numero}_${itemId}`,
                titulo: `DG - Receptora ${nomeReceptora}`,
                animal_id: row.animal_id,
                data_evento: row.data_prevista_dg,
                tipo_evento: 'Diagnóstico de Gestação',
                descricao: `Diagnóstico de Gestação agendado para Receptora ${nomeReceptora} (NF ${row.numero_nf})`,
                status: 'Agendado',
                animal_serie: letra,
                animal_rg: numero,
                animal_nome: row.animal_nome || nomeReceptora,
                animal_tatuagem: row.animal_tatuagem || tatuagem || `${letra}${numero}`,
                origem: 'receptora',
                numero_nf: row.numero_nf,
                fornecedor: row.fornecedor,
                data_te: row.data_te
            })
          }

          // Evento 3: Parto Previsto (9 meses após TE) - SOMENTE se NÃO foi diagnosticada como VAZIA
          const resDG = String(row.animal_resultado_dg || '').toLowerCase()
          const foiVazia = resDG.includes('vazia') || resDG.includes('negativ') || resDG.includes('nao') || resDG.includes('não') || ehReceptoraVazia(letra, numero, tatuagem)
          if (row.data_te && !foiVazia) {
            const dataTE = new Date(row.data_te)
            const dataParto = new Date(dataTE)
            dataParto.setMonth(dataParto.getMonth() + 9) // Adicionar 9 meses
            
            eventosReceptoras.push({
                id: `receptora_parto_${row.nf_id}_${numero}_${itemId}`,
                titulo: `Parto Previsto - ${nomeReceptora}`,
                animal_id: row.animal_id,
                data_evento: dataParto.toISOString().split('T')[0],
                tipo_evento: 'Parto Previsto',
                descricao: `Parto previsto para Receptora ${nomeReceptora} (TE em ${new Date(row.data_te).toLocaleDateString('pt-BR')}, NF ${row.numero_nf})`,
                status: 'Agendado',
                animal_serie: letra,
                animal_rg: numero,
                animal_nome: row.animal_nome || nomeReceptora,
                animal_tatuagem: row.animal_tatuagem || tatuagem || `${letra}${numero}`,
                origem: 'receptora',
                numero_nf: row.numero_nf,
                fornecedor: row.fornecedor,
                data_te: row.data_te
            })
          }
        }
      } catch (rowError) {
        logger.error(`Erro ao processar linha ${index + 1} de receptoras:`, rowError)
        console.error(`Erro ao processar receptora linha ${index + 1}:`, rowError)
      }
    })
    
    console.log(`✅ Eventos de receptoras criados: ${eventosReceptoras.length}`)

    // Buscar exames andrológicos para refazer (Inapto → reagendamento em 30 dias)
    let examesAndrologicosResult = { rows: [] }
    try {
      let sqlAndrologicos = `
        SELECT 
          e.id as exame_id,
          e.touro,
          e.rg,
          e.data_exame,
          e.resultado,
          e.data_reagendamento,
          e.reagendado,
          CASE 
            WHEN e.reagendado = true AND e.resultado = 'Pendente' THEN e.data_exame
            ELSE COALESCE(e.data_reagendamento, (e.data_exame + INTERVAL '30 days')::date)
          END as data_refazer,
          a.id as animal_id,
          a.serie as animal_serie,
          a.rg as animal_rg,
          a.nome as animal_nome,
          a.tatuagem as animal_tatuagem
        FROM exames_andrologicos e
        LEFT JOIN animais a ON (CAST(a.rg AS TEXT) = TRIM(e.rg) OR CAST(a.rg AS TEXT) = LTRIM(e.rg, '0'))
        WHERE (
          (e.resultado = 'Inapto' AND COALESCE(e.data_reagendamento, (e.data_exame + INTERVAL '30 days')::date) IS NOT NULL)
          OR (e.reagendado = true AND e.resultado = 'Pendente' AND e.status = 'Ativo')
        )
      `
      const paramsAndrologicos = []
      let paramCountAndro = 0

      if (data_inicio) {
        paramCountAndro++
        sqlAndrologicos += ` AND (CASE WHEN e.reagendado = true AND e.resultado = 'Pendente' THEN e.data_exame ELSE COALESCE(e.data_reagendamento, (e.data_exame + INTERVAL '30 days')::date) END) >= $${paramCountAndro}`
        paramsAndrologicos.push(data_inicio)
      }
      if (data_fim) {
        paramCountAndro++
        sqlAndrologicos += ` AND (CASE WHEN e.reagendado = true AND e.resultado = 'Pendente' THEN e.data_exame ELSE COALESCE(e.data_reagendamento, (e.data_exame + INTERVAL '30 days')::date) END) <= $${paramCountAndro}`
        paramsAndrologicos.push(data_fim)
      }

      examesAndrologicosResult = await query(sqlAndrologicos, paramsAndrologicos)

      // Deduplicar por animal+data (evitar duplicata Inapto + Pendente reagendado)
      const seen = new Set()
      examesAndrologicosResult.rows = examesAndrologicosResult.rows.filter(row => {
        const key = `${row.animal_id || row.rg}_${row.data_refazer}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    } catch (queryError) {
      logger.error('Erro ao buscar exames andrológicos:', queryError)
      examesAndrologicosResult = { rows: [] }
    }

    const eventosAndrologicos = examesAndrologicosResult.rows.map(row => {
      const dataEvento = row.data_refazer || row.data_reagendamento || row.data_exame
      const nomeTouro = row.touro || `${row.animal_serie || ''}${row.animal_rg || row.rg}`.trim() || `RG ${row.rg}`
      return {
        id: `andrologico_refazer_${row.exame_id}`,
        titulo: `Refazer Exame Andrológico - ${nomeTouro}`,
        animal_id: row.animal_id,
        data_evento: dataEvento,
        tipo_evento: 'Refazer Exame Andrológico',
        descricao: `Touro ${nomeTouro} (RG: ${row.rg}) deu Inapto. Refazer exame em 30 dias.`,
        status: 'Agendado',
        animal_serie: row.animal_serie,
        animal_rg: row.animal_rg || row.rg,
        animal_nome: row.animal_nome || nomeTouro,
        animal_tatuagem: row.animal_tatuagem,
        origem: 'andrologico'
      }
    })

    console.log(`✅ Eventos andrológicos para refazer: ${eventosAndrologicos.length}`)

    // Combinar eventos manuais, de receptoras e andrológicos
    const todosEventos = [
      ...eventosManuais.rows.map(e => ({ ...e, origem: 'manual' })),
      ...eventosReceptoras,
      ...eventosAndrologicos
    ]

    // Filtrar por animal se especificado
    let eventosFiltrados = todosEventos
    if (animal) {
      eventosFiltrados = todosEventos.filter(e => 
        (e.animal_serie && e.animal_serie.includes(animal)) ||
        (e.animal_rg && e.animal_rg.includes(animal)) ||
        (e.animal_nome && e.animal_nome.toLowerCase().includes(animal.toLowerCase()))
      )
    }
    
    // Filtrar por tipo se especificado (vem do query param tipo)
    if (tipo) {
      eventosFiltrados = eventosFiltrados.filter(e => 
        e.tipo_evento === tipo || e.tipo === tipo
      )
    }
    
    console.log(`📊 Total de eventos após filtros: ${eventosFiltrados.length} (Manuais: ${eventosManuais.rows.length}, Receptoras: ${eventosReceptoras.length})`)

    // Ordenar por data
    eventosFiltrados.sort((a, b) => {
      try {
        const dataA = a.data_evento ? new Date(a.data_evento) : new Date(0)
        const dataB = b.data_evento ? new Date(b.data_evento) : new Date(0)
        
        if (isNaN(dataA.getTime())) return 1
        if (isNaN(dataB.getTime())) return -1
        
        return dataB.getTime() - dataA.getTime()
      } catch (sortError) {
        logger.error('Erro ao ordenar eventos:', sortError)
        return 0
      }
    })

    // Aplicar limite e offset
    const eventosPaginados = eventosFiltrados.slice(parseInt(offset), parseInt(offset) + parseInt(limit))

    console.log(`📤 Retornando ${eventosPaginados.length} eventos`)
    if (eventosPaginados.length > 0) {
      console.log('Primeiro evento:', eventosPaginados[0].titulo)
    }

    return sendSuccess(res, eventosPaginados)

  } catch (error) {
    logger.error('Erro ao buscar eventos do calendário:', error)
    console.error('Erro completo:', error)
    console.error('Stack:', error.stack)
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

async function handlePost(req, res) {
  const { 
    titulo, 
    animal_id, 
    data_evento, 
    tipo_evento, 
    descricao,
    status = 'Agendado'
  } = req.body

  if (!titulo || !data_evento) {
    return sendValidationError(res, 'Título e data do evento são obrigatórios')
  }

  try {
    const result = await query(
      `INSERT INTO calendario_reprodutivo 
       (titulo, animal_id, data_evento, tipo_evento, descricao, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [titulo, animal_id, data_evento, tipo_evento, descricao, status]
    )

    logger.info(`Evento criado: ${titulo} para ${data_evento}`)
    return sendSuccess(res, result.rows[0], 'Evento criado com sucesso', 201)

  } catch (error) {
    logger.error('Erro ao criar evento:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao criar evento',
      error: error.message 
    })
  }
}

async function handlePut(req, res) {
  const { id } = req.query
  const { titulo, animal_id, data_evento, tipo_evento, descricao, status } = req.body

  if (!id) {
    return sendValidationError(res, 'ID do evento é obrigatório')
  }

  try {
    let sql = 'UPDATE calendario_reprodutivo SET updated_at = CURRENT_TIMESTAMP'
    const params = []
    let paramCount = 0

    if (titulo !== undefined) {
      paramCount++
      sql += `, titulo = $${paramCount}`
      params.push(titulo)
    }

    if (animal_id !== undefined) {
      paramCount++
      sql += `, animal_id = $${paramCount}`
      params.push(animal_id)
    }

    if (data_evento !== undefined) {
      paramCount++
      sql += `, data_evento = $${paramCount}`
      params.push(data_evento)
    }

    if (tipo_evento !== undefined) {
      paramCount++
      sql += `, tipo_evento = $${paramCount}`
      params.push(tipo_evento)
    }

    if (descricao !== undefined) {
      paramCount++
      sql += `, descricao = $${paramCount}`
      params.push(descricao)
    }

    if (status !== undefined) {
      paramCount++
      sql += `, status = $${paramCount}`
      params.push(status)
    }

    sql += ` WHERE id = $${paramCount + 1} RETURNING *`
    params.push(id)

    const result = await query(sql, params)

    if (result.rows.length === 0) {
      return sendNotFound(res, 'Evento não encontrado')
    }

    logger.info(`Evento atualizado: ID ${id}`)
    return sendSuccess(res, result.rows[0], 'Evento atualizado com sucesso')

  } catch (error) {
    logger.error('Erro ao atualizar evento:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao atualizar evento',
      error: error.message 
    })
  }
}

async function handleDelete(req, res) {
  const { id } = req.query

  if (!id) {
    return sendValidationError(res, 'ID do evento é obrigatório')
  }

  try {
    const result = await query(
      'DELETE FROM calendario_reprodutivo WHERE id = $1 RETURNING *',
      [id]
    )

    if (result.rows.length === 0) {
      return sendNotFound(res, 'Evento não encontrado')
    }

    logger.info(`Evento excluído: ID ${id}`)
    return sendSuccess(res, result.rows[0], 'Evento excluído com sucesso')

  } catch (error) {
    logger.error('Erro ao excluir evento:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao excluir evento',
      error: error.message 
    })
  }
}

export default asyncHandler(calendarioHandler)