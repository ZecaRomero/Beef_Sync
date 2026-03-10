import { query, pool } from '../../../../lib/database'
import logger from '../../../../utils/logger'
import { 
  sendSuccess, 
  sendValidationError, 
  sendError,
  sendMethodNotAllowed
} from '../../../../utils/apiResponse'
import * as XLSX from 'xlsx'

export default async function importExcelHandler(req, res) {
  const { method } = req

  if (method !== 'POST') {
    return sendMethodNotAllowed(res, ['POST'])
  }

  try {
    logger.info('📥 Iniciando processamento de importação Excel')
    
    // Verificar se há arquivo no body (será enviado como base64 ou buffer)
    const { fileData, fileName, laboratorio, veterinario } = req.body

    if (!fileData) {
      logger.warn('❌ Arquivo Excel não fornecido')
      return sendValidationError(res, 'Arquivo Excel é obrigatório')
    }

    if (!laboratorio || !veterinario) {
      logger.warn('❌ Laboratório ou veterinário não fornecido')
      return sendValidationError(res, 'Laboratório e veterinário são obrigatórios para importação')
    }

    logger.info(`📄 Processando arquivo: ${fileName}, tamanho base64: ${typeof fileData === 'string' ? fileData.length : 'buffer'}`)

    // Converter base64 para buffer se necessário
    let buffer
    try {
      if (typeof fileData === 'string') {
        // Remover prefixo data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64, se existir
        const base64Data = fileData.replace(/^data:.*,/, '')
        buffer = Buffer.from(base64Data, 'base64')
        logger.info(`✅ Base64 convertido para buffer, tamanho: ${buffer.length} bytes`)
      } else {
        buffer = Buffer.from(fileData)
        logger.info(`✅ Buffer criado, tamanho: ${buffer.length} bytes`)
      }
    } catch (error) {
      logger.error('❌ Erro ao converter base64 para buffer:', error)
      return sendError(res, `Erro ao processar arquivo: ${error.message}`)
    }

    if (!buffer || buffer.length === 0) {
      logger.error('❌ Buffer vazio após conversão')
      return sendError(res, 'Arquivo inválido ou vazio')
    }

    // Ler o arquivo Excel
    let workbook, sheetName, worksheet
    try {
      logger.info('📖 Lendo arquivo Excel...')
      workbook = XLSX.read(buffer, { 
        type: 'buffer',
        cellDates: true, // Importante: ler datas como objetos Date
        cellNF: false,
        cellText: false
      })
      sheetName = workbook.SheetNames[0]
      worksheet = workbook.Sheets[sheetName]
      logger.info(`✅ Arquivo Excel lido, planilha: ${sheetName}`)
    } catch (error) {
      logger.error('❌ Erro ao ler arquivo Excel:', error)
      return sendError(res, `Erro ao ler arquivo Excel: ${error.message}`)
    }
    
    // Converter para JSON - usar raw: true para manter números e datas como estão
    logger.info('🔄 Convertendo planilha para JSON...')
    const data = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: null,
      raw: true // Manter valores originais (números, datas)
    })

    logger.info(`📊 Planilha convertida, ${data.length} linhas encontradas`)

    if (data.length < 2) {
      logger.warn('❌ Planilha vazia ou sem dados suficientes')
      return sendValidationError(res, 'Planilha vazia ou sem dados')
    }

    // Encontrar linha de cabeçalho (primeira linha não vazia)
    let headerRowIndex = 0
    for (let i = 0; i < Math.min(5, data.length); i++) {
      if (data[i] && data[i].some(cell => cell !== null && cell !== '')) {
        headerRowIndex = i
        break
      }
    }

    logger.info(`📋 Linha de cabeçalho encontrada na linha ${headerRowIndex + 1}`)
    const headers = data[headerRowIndex].map(h => String(h || '').trim().toLowerCase())
    logger.info(`📋 Cabeçalhos encontrados: ${headers.filter(h => h).join(', ')}`)
    
    // Mapear índices das colunas (apenas as colunas do cabeçalho especificado)
    // Rqd = Registro da doadora (comum em planilhas ZebuEmbryo)
    const columnMap = {
      serie: headers.findIndex(h => h.includes('série') || h.includes('serie')),
      rg: headers.findIndex(h => h === 'rg' || (h.includes('rg') && !h.includes('rgd') && !h.includes('rqd'))),
      rgd: headers.findIndex(h => h.includes('rgd') || h.includes('registro') || h === 'rqd' || h.includes('rqd') || h.includes('doadora')),
      data: headers.findIndex(h => (h.includes('data') || h === 'data') && !h.includes('transf')),
      touro: headers.findIndex(h => h.includes('touro')),
      viaveis: headers.findIndex(h => h.includes('viavei') || h.includes('viaveis') || h.includes('viáveis')),
      cultivados: headers.findIndex(h => h.includes('cultivad')),
      embriao: headers.findIndex(h => h.includes('embria') || h.includes('embriao') || h.includes('embrião')),
      pctemb: headers.findIndex(h => h.includes('%emb') || h.includes('percent') || h.includes('porcent')),
      te: headers.findIndex(h => {
        const hLower = h.toLowerCase().trim()
        return hLower === 'te' || 
               hLower === 't.e.' || 
               hLower === 't e' ||
               hLower.includes('transferidos') ||
               hLower.includes('transferido') ||
               (hLower.includes('transfer') && hLower.includes('embri'))
      }),
      transferidos: headers.findIndex(h => {
        const hLower = h.toLowerCase().trim()
        return hLower === 'transferidos' || hLower === 'transferido'
      })
    }
    
    // Se não encontrou RG diretamente, usar RGD como fallback
    if (columnMap.rg === -1 && columnMap.rgd !== -1) {
      columnMap.rg = columnMap.rgd
    }
    
    // Se não encontrou RGD mas encontrou RG, usar RG como RGD
    if (columnMap.rgd === -1 && columnMap.rg !== -1) {
      columnMap.rgd = columnMap.rg
    }

    // Fallback: se rgd não encontrado, tentar colunas comuns (Rqd, Doadora, etc.)
    if (columnMap.rgd === -1 && columnMap.rg === -1) {
      const firstDataCol = headers.findIndex(h => h && (h.includes('rqd') || h.includes('doadora') || h.includes('registro') || h.includes('ident')))
      if (firstDataCol !== -1) {
        columnMap.rgd = firstDataCol
        columnMap.rg = firstDataCol
        logger.info(`   Usando coluna "${headers[firstDataCol]}" como RGD/RQd`)
      }
    }

    logger.info(`🔍 Mapeamento de colunas:`)
    logger.info(`   Série: ${columnMap.serie}, RG: ${columnMap.rg}, RGD: ${columnMap.rgd}`)
    logger.info(`   Data: ${columnMap.data}, Touro: ${columnMap.touro}`)
    logger.info(`   Viáveis: ${columnMap.viaveis}, Cultivados: ${columnMap.cultivados}, Embriões: ${columnMap.embriao}, %Emb: ${columnMap.pctemb}, TE: ${columnMap.te}`)
    
    // Verificar se a coluna TE foi encontrada
    if (columnMap.te === -1) {
      logger.warn(`⚠️ Coluna TE não encontrada nos cabeçalhos. Cabeçalhos disponíveis: ${headers.filter(h => h).join(', ')}`)
    } else {
      logger.info(`✅ Coluna TE encontrada no índice ${columnMap.te} (cabeçalho: "${headers[columnMap.te]}")`)
    }
    
    // Validar: precisa ter pelo menos RG, RGD ou Rqd, e Data
    const temRg = columnMap.rg !== -1 || columnMap.rgd !== -1
    if (!temRg || columnMap.data === -1) {
      const cabecalhosStr = headers.filter(h => h).join(', ')
      logger.error(`❌ Colunas obrigatórias não encontradas. RG/RGD/Rqd: ${temRg}, Data: ${columnMap.data}. Cabeçalhos: ${cabecalhosStr}`)
      return sendValidationError(res, 
        `Colunas obrigatórias não encontradas. A planilha precisa ter: (1) Rqd, RG, RGD ou Registro da doadora; (2) Data da FIV. Cabeçalhos encontrados: ${cabecalhosStr || 'nenhum'}`)
    }

    // Processar linhas de dados
    const rows = data.slice(headerRowIndex + 1)
    logger.info(`📝 Processando ${rows.length} linhas de dados...`)
    const processedData = []
    const errors = []
    const warnings = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = headerRowIndex + 2 + i

      // Pular linhas vazias
      if (!row || row.every(cell => cell === null || cell === '' || String(cell).trim() === '')) {
        continue
      }

      // Obter RG/RGD (priorizar RG, depois RGD)
      let rgd = null
      let serie = null
      
      if (columnMap.serie !== -1 && row[columnMap.serie]) {
        serie = String(row[columnMap.serie]).trim()
      }
      
      if (columnMap.rg !== -1 && row[columnMap.rg]) {
        rgd = String(row[columnMap.rg]).trim()
      } else if (columnMap.rgd !== -1 && row[columnMap.rgd]) {
        rgd = String(row[columnMap.rgd]).trim()
      }
      
      // Se tem série e RG, combinar: "SÉRIE RG"
      if (serie && rgd) {
        rgd = `${serie} ${rgd}`.trim()
      } else if (serie && !rgd) {
        rgd = serie
      }
      
      const dataVal = row[columnMap.data]

      if (!rgd || dataVal === null || dataVal === undefined || dataVal === '') {
        warnings.push(`Linha ${rowNum}: Dados incompletos (Rgd ou Data faltando)`)
        continue
      }

      // Converter data (aceitar vários formatos)
      let dataFiv = null
      try {
        let dateObj = null
        
        // Caso 1: Já é um objeto Date (quando cellDates: true)
        if (dataVal instanceof Date) {
          dateObj = dataVal
          // Adicionar 12 horas para evitar problemas de timezone
          dateObj.setHours(12, 0, 0, 0)
        }
        // Caso 2: É um número (Excel serial date)
        else if (typeof dataVal === 'number') {
          // Excel serial date: Excel usa 1900-01-01 = 1 como base
          // Mas JavaScript Date usa 1970-01-01 como base
          // Excel serial date: dias desde 30/12/1899
          // Ajuste mais preciso para Excel
          const excelEpoch = new Date(1899, 11, 30) // 30/12/1899 (Excel base)
          const days = Math.floor(dataVal)
          const milliseconds = (dataVal - days) * 86400000
          dateObj = new Date(excelEpoch.getTime() + days * 86400000 + milliseconds)
          dateObj.setHours(12, 0, 0, 0)
          
          // Log para debug
          logger.debug(`📅 Data numérica Excel linha ${rowNum}: ${dataVal} → ${dateObj.toISOString().split('T')[0]}`)
        }
        // Caso 3: É uma string
        else {
          const dataStr = String(dataVal).trim()
          
          // Tentar parsear data brasileira (DD/MM/YYYY ou DD/MM/YY)
          if (dataStr.includes('/')) {
            const parts = dataStr.split('/')
            if (parts.length === 3) {
              const day = parseInt(parts[0])
              const month = parseInt(parts[1]) - 1
              let year = parseInt(parts[2])
              
              // Se o ano tem 2 dígitos, assumir 20XX
              if (year < 100) {
                year += 2000
              }
              
              dateObj = new Date(year, month, day, 12, 0, 0, 0)
            }
          } 
          // Tentar parsear como ISO (YYYY-MM-DD)
          else if (dataStr.match(/^\d{4}-\d{2}-\d{2}/)) {
            dateObj = new Date(dataStr + 'T12:00:00')
          }
          // Tentar parsear como Date padrão
          else {
            dateObj = new Date(dataStr)
            if (!isNaN(dateObj.getTime())) {
              dateObj.setHours(12, 0, 0, 0)
            }
          }
        }

        if (!dateObj || isNaN(dateObj.getTime())) {
          throw new Error(`Data inválida: ${dataVal}`)
        }

        // Verificar se o ano está razoável (entre 2000 e 2100)
        const year = dateObj.getFullYear()
        if (year < 2000 || year > 2100) {
          logger.warn(`⚠️ Ano suspeito na linha ${rowNum}: ${year}. Valor original: ${dataVal}`)
          // Se o ano está entre 1900-1999, adicionar 100 anos
          if (year >= 1900 && year < 2000) {
            dateObj.setFullYear(year + 100)
            logger.info(`✅ Ano corrigido de ${year} para ${dateObj.getFullYear()}`)
          }
          // Se o ano está entre 2027-2030, pode ser um erro de interpretação (deveria ser 2025-2026)
          // Mas não vamos corrigir automaticamente, apenas avisar
          if (year >= 2027 && year <= 2030) {
            logger.warn(`⚠️ Data futura suspeita na linha ${rowNum}: ${year}. Verifique se está correto.`)
          }
        }

        // Formatar como YYYY-MM-DD
        dataFiv = dateObj.toISOString().split('T')[0]
        logger.debug(`📅 Data processada linha ${rowNum}: ${dataVal} → ${dataFiv}`)
      } catch (error) {
        logger.error(`❌ Erro ao processar data linha ${rowNum}:`, error)
        errors.push(`Linha ${rowNum}: Data inválida "${dataVal}" - ${error.message}`)
        continue
      }

      // Buscar animal pelo RG (usando SÉRIE + RG se disponível)
      let animal = null
      let doadoraId = null
      let doadoraNome = rgd

      try {
        // Normalizar busca: remover espaços extras e converter para maiúsculas
        const rgNormalizado = rgd.replace(/\s+/g, ' ').trim().toUpperCase()
        
        // Separar série e RG se possível (formato "SÉRIE RG")
        const partes = rgNormalizado.split(/\s+/)
        let serieBusca = null
        let rgBusca = null
        
        if (partes.length >= 2) {
          // Assumir que a primeira parte é a série e o resto é o RG
          serieBusca = partes[0]
          rgBusca = partes.slice(1).join(' ')
        } else if (partes.length === 1) {
          // Apenas uma parte, pode ser só RG ou só série
          rgBusca = partes[0]
        }
        
        // Tentar diferentes formatos de busca
        let animalResult
        if (serieBusca && rgBusca) {
          // Buscar com série e RG
          animalResult = await query(
            `SELECT id, nome, rg, serie 
             FROM animais 
             WHERE (
               (UPPER(COALESCE(serie, '')) = $1 AND UPPER(CAST(rg AS TEXT)) = $2)
               OR UPPER(REPLACE(COALESCE(serie, '') || ' ' || CAST(rg AS TEXT), ' ', '')) = $3
               OR UPPER(REPLACE(COALESCE(serie, '') || CAST(rg AS TEXT), ' ', '')) = $3
             )
             AND (sexo ILIKE 'F%' OR sexo = 'F')
             LIMIT 1`,
            [serieBusca, rgBusca, rgNormalizado.replace(/\s+/g, '')]
          )
        } else {
          // Buscar apenas por RG ou nome completo
          animalResult = await query(
            `SELECT id, nome, rg, serie 
             FROM animais 
             WHERE (
               UPPER(REPLACE(CAST(rg AS TEXT), ' ', '')) = $1
               OR UPPER(REPLACE(COALESCE(serie, '') || CAST(rg AS TEXT), ' ', '')) = $1
               OR UPPER(REPLACE(COALESCE(serie, '') || ' ' || CAST(rg AS TEXT), ' ', '')) = $1
               OR CAST(rg AS TEXT) ILIKE $2
               OR nome ILIKE $2
             )
             AND (sexo ILIKE 'F%' OR sexo = 'F')
             LIMIT 1`,
            [rgNormalizado.replace(/\s+/g, ''), `%${rgd}%`]
          )
        }

        if (animalResult.rows.length > 0) {
          animal = animalResult.rows[0]
          doadoraId = animal.id
          doadoraNome = animal.nome || `${animal.serie || ''} ${animal.rg || ''}`.trim() || rgd
          logger.debug(`✅ Animal encontrado: ${doadoraNome} (ID: ${doadoraId})`)
        } else {
          // Se não encontrou, usar o Rgd como nome
          doadoraNome = rgd
          logger.debug(`⚠️ Animal não encontrado para ${rgd}, usando como nome`)
        }
      } catch (error) {
        logger.warn(`Erro ao buscar animal com RG ${rgd}:`, error)
        // Em caso de erro, usar o Rgd como nome
        doadoraNome = rgd
      }

      // Extrair outros dados
      const touro = columnMap.touro !== -1 && row[columnMap.touro] 
        ? String(row[columnMap.touro]).trim() 
        : null

      // Usar "Viaveis" como quantidade de oócitos; fallback para "Cultivados" (ZebuEmbryo)
      let quantidadeOocitos = 0
      if (columnMap.viaveis !== -1 && row[columnMap.viaveis]) {
        quantidadeOocitos = parseInt(row[columnMap.viaveis]) || 0
      } else if (columnMap.cultivados !== -1 && row[columnMap.cultivados]) {
        quantidadeOocitos = parseInt(row[columnMap.cultivados]) || 0
      }

      // Montar observações apenas com os dados do cabeçalho especificado
      const observacoesParts = []
      if (columnMap.embriao !== -1 && row[columnMap.embriao]) {
        observacoesParts.push(`Embriões: ${row[columnMap.embriao]}`)
      }
      if (columnMap.pctemb !== -1 && row[columnMap.pctemb]) {
        observacoesParts.push(`%Emb: ${row[columnMap.pctemb]}`)
      }

      const observacoes = observacoesParts.length > 0 
        ? observacoesParts.join(' | ') 
        : null

      // Extrair quantidade de TE / Transferidos (embriões transferidos)
      let quantidadeTE = 0
      const teIdx = columnMap.te !== -1 ? columnMap.te : columnMap.transferidos
      if (teIdx !== -1 && teIdx !== undefined) {
        const teValue = row[teIdx]
        if (teValue !== null && teValue !== undefined && teValue !== '') {
          const teNum = typeof teValue === 'number' ? teValue : parseInt(String(teValue).trim())
          quantidadeTE = isNaN(teNum) ? 0 : teNum
        }
      }

      // Extrair embriões produzidos
      let embrioesProduzidos = 0
      if (columnMap.embriao !== -1 && row[columnMap.embriao]) {
        embrioesProduzidos = parseInt(row[columnMap.embriao]) || 0
      }

      // Identificador normalizado (SÉRIE_RG) para busca quando doadora não cadastrada
      const doadoraIdentificador = rgd ? rgd.replace(/\s+/g, ' ').trim().toUpperCase() : null

      // Extrair receptora se houver
      let receptoraNome = null
      let receptoraId = null
      if (columnMap.receptora !== -1 && row[columnMap.receptora]) {
        receptoraNome = String(row[columnMap.receptora]).trim()
        // Tentar buscar animal receptora pelo nome/RG
        try {
          const receptoraResult = await query(
            `SELECT id, nome, rg, serie 
             FROM animais 
             WHERE (
               nome ILIKE $1
               OR CAST(rg AS TEXT) ILIKE $2
               OR UPPER(REPLACE(COALESCE(serie, '') || CAST(rg AS TEXT), ' ', '')) = UPPER(REPLACE($3, ' ', ''))
             )
             LIMIT 1`,
            [`%${receptoraNome}%`, `%${receptoraNome}%`, receptoraNome]
          )
          if (receptoraResult.rows.length > 0) {
            receptoraId = receptoraResult.rows[0].id
            receptoraNome = receptoraResult.rows[0].nome || receptoraNome
          }
        } catch (error) {
          logger.warn(`Erro ao buscar receptora ${receptoraNome}:`, error)
        }
      }

      processedData.push({
        doadora_id: doadoraId,
        doadora_nome: doadoraNome,
        doadora_identificador: doadoraIdentificador,
        laboratorio,
        veterinario,
        data_fiv: dataFiv,
        quantidade_oocitos: quantidadeOocitos,
        embrioes_produzidos: embrioesProduzidos,
        embrioes_transferidos: quantidadeTE,
        touro,
        observacoes: observacoes || null,
        quantidade_te: quantidadeTE,
        receptora_id: receptoraId,
        receptora_nome: receptoraNome
      })
    }

    logger.info(`✅ ${processedData.length} registros processados com sucesso`)
    if (warnings.length > 0) {
      logger.warn(`⚠️ ${warnings.length} avisos encontrados`)
    }
    if (errors.length > 0) {
      logger.error(`❌ ${errors.length} erros encontrados`)
    }

    if (processedData.length === 0) {
      logger.error('❌ Nenhum dado válido encontrado na planilha')
      return sendValidationError(res, 'Nenhum dado válido encontrado na planilha')
    }

    // Inserir dados no banco em lote
    logger.info('💾 Iniciando inserção no banco de dados...')
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      logger.info('✅ Transação iniciada')
      
      const createdItems = []
      const createdTEs = []
      const insertErrors = []

      for (let idx = 0; idx < processedData.length; idx++) {
        const item = processedData[idx]
        if (idx % 10 === 0) {
          logger.info(`📊 Processando item ${idx + 1}/${processedData.length}...`)
        }
        const savepointName = `sp_${idx}`
        try {
          await client.query(`SAVEPOINT ${savepointName}`)

          // Calcular data de transferência (FIV + 7 dias)
          const fivDate = new Date(item.data_fiv)
          const transferDate = new Date(fivDate)
          transferDate.setDate(transferDate.getDate() + 7)
          const data_transferencia = transferDate.toISOString().split('T')[0]

          // Inserir coleta FIV (usa apenas colunas do schema base para compatibilidade)
          const obsParts = [item.observacoes]
          if (item.embrioes_produzidos != null) obsParts.push(`Embriões: ${item.embrioes_produzidos}`)
          if (item.embrioes_transferidos != null) obsParts.push(`TE: ${item.embrioes_transferidos}`)
          const observacoesFinal = obsParts.filter(Boolean).join(' | ') || null

          const { rows } = await client.query(
            `INSERT INTO coleta_fiv 
            (doadora_id, doadora_nome, laboratorio, veterinario, data_fiv, data_transferencia, quantidade_oocitos, touro, observacoes, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *`,
            [
              item.doadora_id || null,
              item.doadora_nome,
              item.laboratorio,
              item.veterinario,
              item.data_fiv,
              data_transferencia,
              item.quantidade_oocitos || 0,
              item.touro || null,
              observacoesFinal
            ]
          )
          const coletaFIV = rows[0]
          createdItems.push(coletaFIV)

          // Se houver TE (Transferências de Embriões), criar registros
          if (item.quantidade_te > 0) {
            logger.info(`📋 Criando ${item.quantidade_te} Transferência(s) de Embrião para ${item.doadora_nome} (Data FIV: ${item.data_fiv})`)
            
            // Buscar touro_id se touro foi informado
            let touroId = null
            if (item.touro) {
              try {
                const touroResult = await client.query(
                  `SELECT id FROM animais 
                   WHERE nome ILIKE $1 OR (serie || ' ' || CAST(rg AS TEXT)) ILIKE $1
                   LIMIT 1`,
                  [`%${item.touro}%`]
                )
                if (touroResult.rows.length > 0) {
                  touroId = touroResult.rows[0].id
                }
              } catch (error) {
                logger.warn(`Erro ao buscar touro ${item.touro}:`, error)
              }
            }

            // Criar uma TE para cada embrião transferido
            for (let teNum = 1; teNum <= item.quantidade_te; teNum++) {
              try {
                // Gerar número TE único: TE-YYYYMMDD-IDX-TENUM-TIMESTAMP (evita duplicatas em lote)
                const teDateStr = data_transferencia.replace(/-/g, '')
                const uniquePart = `${idx}-${teNum}-${Date.now()}`
                const numeroTE = `TE-${teDateStr}-${uniquePart}`

                const teObs = [item.doadora_nome && `Doadora: ${item.doadora_nome}`, item.touro && `Touro: ${item.touro}`, item.receptora_nome && `Receptora: ${item.receptora_nome}`].filter(Boolean).join(' | ') || null
                const teResult = await client.query(
                  `INSERT INTO transferencias_embrioes 
                  (numero_te, data_te, doadora_id, touro_id, receptora_id, data_fiv, local_te, tecnico_responsavel, observacoes, status)
                  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                  RETURNING *`,
                  [
                    numeroTE,
                    data_transferencia,
                    item.doadora_id || null,
                    touroId,
                    item.receptora_id || null,
                    item.data_fiv,
                    item.laboratorio || null,
                    item.veterinario || null,
                    teObs,
                    'realizada'
                  ]
                )
                createdTEs.push(teResult.rows[0])
                logger.debug(`✅ TE criada: ${numeroTE} para ${item.doadora_nome}`)
              } catch (error) {
                logger.error(`Erro ao criar TE ${teNum} para ${item.doadora_nome}:`, error)
                insertErrors.push(`Erro ao criar TE ${teNum} para ${item.doadora_nome}: ${error.message}`)
              }
            }
          }
          await client.query(`RELEASE SAVEPOINT ${savepointName}`)
        } catch (error) {
          await client.query(`ROLLBACK TO SAVEPOINT ${savepointName}`)
          insertErrors.push(`Erro ao inserir registro para ${item.doadora_nome}: ${error.message}`)
          logger.error(`Erro ao inserir coleta FIV:`, error)
        }
      }
      
      await client.query('COMMIT')
      
      logger.info(`Importação Excel: ${createdItems.length} coletas FIV criadas com sucesso`)
      if (createdTEs.length > 0) {
        logger.info(`Importação Excel: ${createdTEs.length} Transferências de Embriões criadas com sucesso`)
      }
      
      return sendSuccess(res, {
        created: createdItems.length,
        createdTEs: createdTEs.length,
        total: processedData.length,
        errors: insertErrors.length > 0 ? insertErrors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        items: createdItems,
        tes: createdTEs
      }, `Importação concluída: ${createdItems.length} coletas FIV e ${createdTEs.length} Transferências de Embriões importadas com sucesso`, 201)
      
    } catch (error) {
      await client.query('ROLLBACK')
      logger.error('Erro ao importar coletas FIV:', error)
      return sendError(res, `Erro ao importar dados: ${error.message}`)
    } finally {
      client.release()
    }

  } catch (error) {
    logger.error('Erro ao processar arquivo Excel:', error)
    return sendError(res, `Erro ao processar arquivo: ${error.message}`)
  }
}
